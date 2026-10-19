import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import React from 'react';

import { sortThoughts, ThoughtsProvider, useThoughts } from '../src/store/ThoughtsContext';

const wrapper = ({ children }: { children: React.ReactNode }) => <ThoughtsProvider>{children}</ThoughtsProvider>;

async function mount() {
  const hook = renderHook(() => useThoughts(), { wrapper });
  await waitFor(() => expect(hook.result.current.status).toBe('ready'));
  return hook;
}

const stored = async () => JSON.parse((await AsyncStorage.getItem('thoughts')) ?? '[]');

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('wczytuje dane z FusioMyśli 1.0 bez utraty treści i pomija ekran powitalny', async () => {
  await AsyncStorage.setItem(
    'thoughts',
    JSON.stringify([
      { id: 'a', title: 'Projekt', content: 'opis', color: '#00ff22ff', parentId: undefined },
      { id: 'b', title: 'Podpunkt', content: '', color: 'zly-kolor', parentId: 'a', image: 'file:///x.jpg' },
      { id: 'c', title: 'Sierota', content: '', color: '#fff', parentId: 'nie-istnieje' },
    ]),
  );
  const { result } = await mount();
  const t = result.current.thoughts;
  expect(t.map((x) => x.id)).toEqual(['a', 'b', 'c']);
  expect(t[0]).toMatchObject({ title: 'Projekt', content: 'opis', color: '#00ff22ff' });
  expect(t[1]).toMatchObject({ parentId: 'a', image: 'file:///x.jpg', color: '#A855F7' });
  expect(t[2].parentId).toBeUndefined();
  expect(typeof t[0].createdAt).toBe('number');
  expect(result.current.settings.onboarded).toBe(true);
});

test('uszkodzone dane nie wywracają aplikacji i trafiają do kopii zapasowej', async () => {
  await AsyncStorage.setItem('thoughts', '{nie-json');
  const { result } = await mount();
  expect(result.current.thoughts).toEqual([]);
  const keys = await AsyncStorage.getAllKeys();
  expect(keys.some((k) => k.startsWith('thoughts:backup-'))).toBe(true);
});

test('dodawanie, edycja i zapis przetrwają ponowne uruchomienie', async () => {
  const first = await mount();
  let id = '';
  act(() => {
    id = first.result.current.addThought().id;
  });
  act(() => first.result.current.updateThought(id, { title: 'Pomysł', content: 'Treść' }));
  await act(() => first.result.current.flush());
  first.unmount();

  const second = await mount();
  expect(second.result.current.getThought(id)).toMatchObject({ title: 'Pomysł', content: 'Treść' });
  expect(await stored()).toHaveLength(1);
});

test('usuwanie kasuje całe poddrzewo (także wnuki)', async () => {
  const { result } = await mount();
  let root = '';
  let child = '';
  act(() => {
    root = result.current.addThought().id;
  });
  act(() => {
    child = result.current.addThought(root).id;
  });
  act(() => {
    result.current.addThought(child);
    result.current.addThought();
  });
  expect(result.current.countDescendants(root)).toBe(2);
  let removed = 0;
  act(() => {
    removed = result.current.deleteThought(root);
  });
  await act(() => result.current.flush());
  expect(removed).toBe(3);
  expect(result.current.thoughts).toHaveLength(1);
  expect(await stored()).toHaveLength(1);
});

test('pusta nowa myśl jest odrzucana, a wypełniona zostaje', async () => {
  const { result } = await mount();
  let a = '';
  let b = '';
  act(() => {
    a = result.current.addThought().id;
    b = result.current.addThought().id;
  });
  act(() => result.current.updateThought(b, { title: 'Coś' }));
  act(() => {
    expect(result.current.discardIfEmpty(a)).toBe(true);
    expect(result.current.discardIfEmpty(b)).toBe(false);
  });
  expect(result.current.thoughts.map((t) => t.id)).toEqual([b]);
});

test('ścieżka i ustawienia sortowania', async () => {
  const { result } = await mount();
  let a = '';
  let b = '';
  act(() => {
    a = result.current.addThought().id;
  });
  act(() => {
    b = result.current.addThought(a).id;
  });
  expect(result.current.getPath(b).map((t) => t.id)).toEqual([a, b]);
  act(() => result.current.updateSettings({ sortMode: 'alpha' }));
  await waitFor(async () => expect(JSON.parse((await AsyncStorage.getItem('fusionote:settings'))!).sortMode).toBe('alpha'));

  const sorted = sortThoughts(
    [
      { id: '1', title: 'Żaba', content: '', color: '#fff', createdAt: 1, updatedAt: 3 },
      { id: '2', title: 'arbuz', content: '', color: '#fff', createdAt: 2, updatedAt: 1 },
      { id: '3', title: '', content: '', color: '#fff', createdAt: 3, updatedAt: 2 },
    ],
    'alpha',
  );
  expect(sorted.map((t) => t.id)).toEqual(['2', '1', '3']);
});
