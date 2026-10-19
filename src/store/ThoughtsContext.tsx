import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';

import { defaultThoughtColor } from '../theme';
import { SortMode, Thought } from '../types';
import { isValidHex } from '../utils/color';
import { createId } from '../utils/id';
import { removeImage } from '../utils/images';

/** Ten sam klucz co w FusioMyśli 1.0 — dane użytkownika przechodzą bez migracji pliku. */
const THOUGHTS_KEY = 'thoughts';
const SETTINGS_KEY = 'fusionote:settings';
const SAVE_DELAY = 300;

type Settings = { sortMode: SortMode; onboarded: boolean };
const defaultSettings: Settings = { sortMode: 'updated', onboarded: false };

type Status = 'loading' | 'ready' | 'error';

type ThoughtsContextValue = {
  status: Status;
  loadError: string | null;
  saveError: string | null;
  thoughts: Thought[];
  settings: Settings;
  reload: () => Promise<void>;
  addThought: (parentId?: string) => Thought;
  updateThought: (id: string, patch: Partial<Omit<Thought, 'id' | 'createdAt'>>) => void;
  deleteThought: (id: string) => number;
  discardIfEmpty: (id: string) => boolean;
  getThought: (id: string | undefined) => Thought | undefined;
  getChildren: (parentId: string | undefined) => Thought[];
  countDescendants: (id: string) => number;
  getPath: (id: string | undefined) => Thought[];
  updateSettings: (patch: Partial<Settings>) => void;
  deleteAll: () => Promise<void>;
  flush: () => Promise<void>;
};

const ThoughtsContext = createContext<ThoughtsContextValue | null>(null);

/** Ujednolica wpisy zapisane przez starszą wersję (brak dat, błędne kolory, osierocone podmyśli). */
function normalize(raw: unknown): Thought[] {
  if (!Array.isArray(raw)) return [];
  const now = Date.now();
  const list: Thought[] = raw
    .filter((t): t is Record<string, unknown> => !!t && typeof t === 'object' && t.id != null)
    .map((t, index) => ({
      id: String(t.id),
      title: typeof t.title === 'string' ? t.title : '',
      content: typeof t.content === 'string' ? t.content : '',
      color: typeof t.color === 'string' && isValidHex(t.color) ? t.color : defaultThoughtColor,
      parentId: t.parentId != null && t.parentId !== '' ? String(t.parentId) : undefined,
      image: typeof t.image === 'string' && t.image ? t.image : undefined,
      // zachowujemy kolejność starych wpisów nadając rosnące znaczniki czasu
      createdAt: typeof t.createdAt === 'number' ? t.createdAt : now - (raw.length - index) * 1000,
      updatedAt: typeof t.updatedAt === 'number' ? t.updatedAt : now - (raw.length - index) * 1000,
    }));
  const ids = new Set(list.map((t) => t.id));
  // podmyśli, których rodzic nie istnieje, stają się myślami głównymi zamiast znikać
  return list.map((t) => (t.parentId && !ids.has(t.parentId) ? { ...t, parentId: undefined } : t));
}

function collectSubtree(thoughts: Thought[], id: string): Set<string> {
  const ids = new Set([id]);
  let grew = true;
  while (grew) {
    grew = false;
    for (const t of thoughts) {
      if (t.parentId && ids.has(t.parentId) && !ids.has(t.id)) {
        ids.add(t.id);
        grew = true;
      }
    }
  }
  return ids;
}

export function ThoughtsProvider({ children }: { children: React.ReactNode }) {
  const [status, setStatus] = useState<Status>('loading');
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [thoughts, setThoughts] = useState<Thought[]>([]);
  const [settings, setSettings] = useState<Settings>(defaultSettings);

  const thoughtsRef = useRef<Thought[]>([]);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const writing = useRef<Promise<void>>(Promise.resolve());

  const commit = useCallback((next: Thought[]) => {
    thoughtsRef.current = next;
    setThoughts(next);
    dirty.current = true;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => void flush(), SAVE_DELAY);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Zapisy są kolejkowane, więc starszy stan nigdy nie nadpisze nowszego. */
  const flush = useCallback(async () => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    if (!dirty.current) return writing.current;
    dirty.current = false;
    const snapshot = JSON.stringify(thoughtsRef.current);
    writing.current = writing.current.then(async () => {
      try {
        await AsyncStorage.setItem(THOUGHTS_KEY, snapshot);
        setSaveError(null);
      } catch (e) {
        dirty.current = true;
        setSaveError('Nie udało się zapisać zmian. Spróbuj ponownie.');
        console.error('Błąd zapisu myśli:', e);
      }
    });
    return writing.current;
  }, []);

  const reload = useCallback(async () => {
    setStatus('loading');
    setLoadError(null);
    try {
      const [rawThoughts, rawSettings] = await Promise.all([
        AsyncStorage.getItem(THOUGHTS_KEY),
        AsyncStorage.getItem(SETTINGS_KEY),
      ]);
      let parsed: unknown = [];
      if (rawThoughts) {
        try {
          parsed = JSON.parse(rawThoughts);
        } catch {
          // uszkodzony wpis: zachowujemy kopię, aby nie stracić danych bezpowrotnie
          await AsyncStorage.setItem(`${THOUGHTS_KEY}:backup-${Date.now()}`, rawThoughts);
          parsed = [];
        }
      }
      const list = normalize(parsed);
      thoughtsRef.current = list;
      setThoughts(list);
      if (rawSettings) {
        try {
          setSettings({ ...defaultSettings, ...JSON.parse(rawSettings) });
        } catch {
          setSettings(defaultSettings);
        }
      } else if (list.length > 0) {
        // użytkownik aktualizuje aplikację z FusioMyśli — nie pokazujemy ekranu powitalnego
        setSettings({ ...defaultSettings, onboarded: true });
      }
      setStatus('ready');
    } catch (e) {
      console.error('Błąd ładowania myśli:', e);
      setLoadError('Nie udało się wczytać Twoich myśli.');
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    void reload();
  }, [reload]);

  // zapis przy przejściu aplikacji w tło
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state !== 'active') void flush();
    });
    return () => sub.remove();
  }, [flush]);

  const addThought = useCallback(
    (parentId?: string) => {
      const now = Date.now();
      const thought: Thought = {
        id: createId(),
        title: '',
        content: '',
        color: defaultThoughtColor,
        parentId,
        createdAt: now,
        updatedAt: now,
      };
      commit([...thoughtsRef.current, thought]);
      return thought;
    },
    [commit],
  );

  const updateThought = useCallback<ThoughtsContextValue['updateThought']>(
    (id, patch) => {
      let changed = false;
      const next = thoughtsRef.current.map((t) => {
        if (t.id !== id) return t;
        const merged = { ...t, ...patch };
        changed = (Object.keys(patch) as (keyof Thought)[]).some((k) => t[k] !== merged[k]);
        return changed ? { ...merged, updatedAt: Date.now() } : t;
      });
      if (changed) commit(next);
    },
    [commit],
  );

  const deleteThought = useCallback(
    (id: string) => {
      const ids = collectSubtree(thoughtsRef.current, id);
      const removed = thoughtsRef.current.filter((t) => ids.has(t.id));
      commit(thoughtsRef.current.filter((t) => !ids.has(t.id)));
      removed.forEach((t) => void removeImage(t.image));
      return removed.length;
    },
    [commit],
  );

  const discardIfEmpty = useCallback(
    (id: string) => {
      const t = thoughtsRef.current.find((x) => x.id === id);
      if (!t) return false;
      const hasChildren = thoughtsRef.current.some((x) => x.parentId === id);
      if (t.title.trim() || t.content.trim() || t.image || hasChildren) return false;
      commit(thoughtsRef.current.filter((x) => x.id !== id));
      return true;
    },
    [commit],
  );

  const getThought = useCallback((id: string | undefined) => (id ? thoughts.find((t) => t.id === id) : undefined), [thoughts]);

  const getChildren = useCallback((parentId: string | undefined) => thoughts.filter((t) => t.parentId === parentId), [thoughts]);

  const countDescendants = useCallback((id: string) => collectSubtree(thoughts, id).size - 1, [thoughts]);

  const getPath = useCallback(
    (id: string | undefined) => {
      const path: Thought[] = [];
      const seen = new Set<string>();
      let current = id ? thoughts.find((t) => t.id === id) : undefined;
      while (current && !seen.has(current.id)) {
        seen.add(current.id);
        path.unshift(current);
        const pid: string | undefined = current.parentId;
        current = pid ? thoughts.find((t) => t.id === pid) : undefined;
      }
      return path;
    },
    [thoughts],
  );

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      AsyncStorage.setItem(SETTINGS_KEY, JSON.stringify(next)).catch((e) => console.error('Błąd zapisu ustawień:', e));
      return next;
    });
  }, []);

  const deleteAll = useCallback(async () => {
    const images = thoughtsRef.current.map((t) => t.image);
    commit([]);
    await flush();
    await Promise.all(images.map(removeImage));
  }, [commit, flush]);

  const value = useMemo<ThoughtsContextValue>(
    () => ({
      status,
      loadError,
      saveError,
      thoughts,
      settings,
      reload,
      addThought,
      updateThought,
      deleteThought,
      discardIfEmpty,
      getThought,
      getChildren,
      countDescendants,
      getPath,
      updateSettings,
      deleteAll,
      flush,
    }),
    [status, loadError, saveError, thoughts, settings, reload, addThought, updateThought, deleteThought, discardIfEmpty, getThought, getChildren, countDescendants, getPath, updateSettings, deleteAll, flush],
  );

  return <ThoughtsContext.Provider value={value}>{children}</ThoughtsContext.Provider>;
}

export function useThoughts(): ThoughtsContextValue {
  const ctx = useContext(ThoughtsContext);
  if (!ctx) throw new Error('useThoughts musi być użyty wewnątrz ThoughtsProvider');
  return ctx;
}

export function sortThoughts(list: Thought[], mode: SortMode): Thought[] {
  const copy = [...list];
  switch (mode) {
    case 'alpha':
      return copy.sort((a, b) => (a.title || '￿').localeCompare(b.title || '￿', 'pl', { sensitivity: 'base' }));
    case 'created':
      return copy.sort((a, b) => b.createdAt - a.createdAt);
    default:
      return copy.sort((a, b) => b.updatedAt - a.updatedAt);
  }
}
