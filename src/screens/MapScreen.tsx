import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '../components/Backdrop';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { sortThoughts, useThoughts } from '../store/ThoughtsContext';
import { colors, defaultThoughtColor, fonts, radius } from '../theme';
import { RootStackParamList, Thought } from '../types';
import { safeColor } from '../utils/color';

type Props = NativeStackScreenProps<RootStackParamList, 'Map'>;

/** Drzewo wszystkich myśli — rozwinięcie menu „Lista myśli” z FusioMyśli. */
export function MapScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { thoughts, settings } = useThoughts();
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());

  const byParent = useMemo(() => {
    const map = new Map<string | undefined, Thought[]>();
    thoughts.forEach((t) => map.set(t.parentId, [...(map.get(t.parentId) ?? []), t]));
    map.forEach((list, key) => map.set(key, sortThoughts(list, settings.sortMode)));
    return map;
  }, [thoughts, settings.sortMode]);

  const roots = byParent.get(undefined) ?? [];

  const toggle = (id: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const open = (t: Thought) => {
    // przejście do poziomu myśli: najpierw ekran główny, potem kolejne poziomy ścieżki
    navigation.popToTop();
    const chain: Thought[] = [];
    let cur: Thought | undefined = t;
    const seen = new Set<string>();
    while (cur && !seen.has(cur.id)) {
      seen.add(cur.id);
      chain.unshift(cur);
      const pid: string | undefined = cur.parentId;
      cur = pid ? thoughts.find((x) => x.id === pid) : undefined;
    }
    chain.forEach((c) => navigation.push('Board', { parentId: c.id }));
  };

  const renderNode = (t: Thought, depth: number, seen: Set<string>): React.ReactNode => {
    if (seen.has(t.id)) return null;
    seen.add(t.id);
    const kids = byParent.get(t.id) ?? [];
    const isCollapsed = collapsed.has(t.id);
    const accent = safeColor(t.color, defaultThoughtColor);
    return (
      <View key={t.id}>
        <View style={[styles.row, { marginLeft: depth * 18 }]}>
          {depth > 0 && <View style={styles.connector} />}
          <Pressable
            onPress={() => (kids.length ? toggle(t.id) : undefined)}
            hitSlop={6}
            style={styles.toggle}
            accessibilityLabel={kids.length ? (isCollapsed ? 'Rozwiń' : 'Zwiń') : undefined}
            disabled={!kids.length}
          >
            {kids.length ? (
              <Ionicons name={isCollapsed ? 'chevron-forward' : 'chevron-down'} size={16} color={colors.textSecondary} />
            ) : (
              <View style={[styles.leafDot, { backgroundColor: accent }]} />
            )}
          </Pressable>
          <Pressable
            onPress={() => open(t)}
            style={({ pressed }) => [styles.node, depth === 0 && styles.rootNode, pressed && { opacity: 0.7 }]}
            accessibilityRole="button"
            accessibilityLabel={`Otwórz: ${t.title || 'Bez tytułu'}`}
          >
            <View style={[styles.bar, { backgroundColor: accent }]} />
            <Text style={[depth === 0 ? styles.rootTitle : styles.childTitle, !t.title.trim() && styles.untitled]} numberOfLines={1}>
              {t.title.trim() || 'Bez tytułu'}
            </Text>
            {kids.length > 0 && <Text style={styles.count}>{kids.length}</Text>}
          </Pressable>
        </View>
        {!isCollapsed && kids.map((k) => renderNode(k, depth + 1, seen))}
      </View>
    );
  };

  const seen = new Set<string>();

  return (
    <View style={styles.flex}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
        <View style={styles.flex}>
          <Text style={styles.title}>Mapa myśli</Text>
          <Text style={styles.subtitle}>
            {roots.length} głównych · {thoughts.length} łącznie
          </Text>
        </View>
      </View>
      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 32, gap: 4 }}>
        {roots.length === 0 ? (
          <EmptyState icon="git-network-outline" title="Mapa jest pusta" subtitle="Dodaj pierwszą myśl na ekranie głównym." />
        ) : (
          roots.map((r) => renderNode(r, 0, seen))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 8 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, marginTop: 2 },
  row: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
  connector: { position: 'absolute', left: -10, top: 0, bottom: 0, width: 1, backgroundColor: colors.border },
  toggle: { width: 28, height: 44, alignItems: 'center', justifyContent: 'center' },
  leafDot: { width: 7, height: 7, borderRadius: 4, opacity: 0.8 },
  node: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 44, paddingHorizontal: 12, borderRadius: radius.md },
  rootNode: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, marginVertical: 3 },
  bar: { width: 3, height: 18, borderRadius: 2 },
  rootTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15, flex: 1 },
  childTitle: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, flex: 1 },
  untitled: { fontStyle: 'italic', color: colors.textMuted },
  count: {
    color: colors.textSecondary,
    fontFamily: fonts.semibold,
    fontSize: 12,
    minWidth: 24,
    textAlign: 'center',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: radius.pill,
    backgroundColor: 'rgba(255,255,255,0.06)',
    overflow: 'hidden',
  },
});
