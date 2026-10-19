import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, FlatList, Image, Pressable, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '../components/Backdrop';
import { EmptyState } from '../components/EmptyState';
import { IconButton } from '../components/IconButton';
import { ScalePressable } from '../components/Pressable';
import { ThoughtCard } from '../components/ThoughtCard';
import { useToast } from '../components/Toast';
import { sortThoughts, useThoughts } from '../store/ThoughtsContext';
import { brandGradient, colors, defaultThoughtColor, fonts, radius } from '../theme';
import { RootStackParamList, SortMode, Thought } from '../types';
import { safeColor } from '../utils/color';

type Props = NativeStackScreenProps<RootStackParamList, 'Board'>;

const SORT_LABELS: Record<SortMode, string> = {
  updated: 'Ostatnio edytowane',
  created: 'Najnowsze',
  alpha: 'Alfabetycznie',
};
const SORT_ORDER: SortMode[] = ['updated', 'created', 'alpha'];

export function BoardScreen({ navigation, route }: Props) {
  const parentId = route.params?.parentId;
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const toast = useToast();
  const { thoughts, settings, updateSettings, getThought, getChildren, getPath, addThought, deleteThought, countDescendants, saveError, flush } =
    useThoughts();
  const [query, setQuery] = useState('');

  const parent = getThought(parentId);
  const path = useMemo(() => getPath(parentId), [getPath, parentId]);
  const columns = width < 340 ? 1 : width > 700 ? 3 : 2;
  const q = query.trim().toLocaleLowerCase('pl');

  const childCounts = useMemo(() => {
    const map = new Map<string, number>();
    thoughts.forEach((t) => t.parentId && map.set(t.parentId, (map.get(t.parentId) ?? 0) + 1));
    return map;
  }, [thoughts]);

  const data = useMemo(() => {
    let list: Thought[];
    if (q) {
      // na ekranie głównym szukamy we wszystkich myślach, w podmyślach — w bieżącym poziomie
      const pool = parentId ? getChildren(parentId) : thoughts;
      list = pool.filter((t) => `${t.title}\n${t.content}`.toLocaleLowerCase('pl').includes(q));
    } else {
      list = getChildren(parentId);
    }
    return sortThoughts(list, settings.sortMode);
  }, [q, parentId, thoughts, getChildren, settings.sortMode]);

  const pathLabel = useCallback(
    (t: Thought) => {
      if (!q || parentId || !t.parentId) return undefined;
      return getPath(t.parentId)
        .map((p) => p.title.trim() || 'Bez tytułu')
        .join(' › ');
    },
    [q, parentId, getPath],
  );

  const onAdd = () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const t = addThought(parentId);
    navigation.navigate('EditThought', { id: t.id, isNew: true });
  };

  const onDelete = (t: Thought) => {
    const sub = countDescendants(t.id);
    const name = t.title.trim() || 'Bez tytułu';
    Alert.alert(
      'Usunąć myśl?',
      sub > 0
        ? `„${name}” zostanie usunięta razem z ${sub} ${sub === 1 ? 'podmyślą' : 'podmyślami'}. Tej operacji nie można cofnąć.`
        : `„${name}” zostanie trwale usunięta. Tej operacji nie można cofnąć.`,
      [
        { text: 'Anuluj', style: 'cancel' },
        {
          text: 'Usuń',
          style: 'destructive',
          onPress: () => {
            const n = deleteThought(t.id);
            void flush();
            void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            toast(n > 1 ? `Usunięto ${n} myśli` : 'Myśl usunięta');
          },
        },
      ],
      { cancelable: true },
    );
  };

  const cycleSort = () => {
    const next = SORT_ORDER[(SORT_ORDER.indexOf(settings.sortMode) + 1) % SORT_ORDER.length];
    updateSettings({ sortMode: next });
  };

  if (parentId && !parent) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 12 }]}>
        <Backdrop />
        <View style={styles.headerRow}>
          <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
        </View>
        <EmptyState icon="cloud-offline-outline" title="Ta myśl już nie istnieje" subtitle="Mogła zostać usunięta. Wróć do listy myśli." />
      </View>
    );
  }

  const accent = parent ? safeColor(parent.color, defaultThoughtColor) : colors.violet;

  const header = (
    <View style={styles.header}>
      {parent ? (
        <>
          <View style={styles.headerRow}>
            <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
            <View style={styles.headerActions}>
              <IconButton icon="home-outline" label="Ekran główny" onPress={() => navigation.popToTop()} />
              <IconButton icon="create-outline" label="Edytuj tę myśl" onPress={() => navigation.navigate('EditThought', { id: parent.id })} />
            </View>
          </View>
          <Text style={styles.breadcrumb} numberOfLines={1}>
            {['Fusionote', ...path.slice(0, -1).map((p) => p.title.trim() || 'Bez tytułu')].join('  ›  ')}
          </Text>
          <View style={styles.parentTitleRow}>
            <View style={[styles.parentDot, { backgroundColor: accent, shadowColor: accent }]} />
            <Text style={styles.parentTitle} numberOfLines={2}>
              {parent.title.trim() || 'Bez tytułu'}
            </Text>
          </View>
          {parent.content.trim() ? (
            <Text style={styles.parentContent} numberOfLines={3}>
              {parent.content.trim()}
            </Text>
          ) : null}
        </>
      ) : (
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <Image source={require('../../assets/logo-mark.png')} style={styles.brandMark} />
            <Image source={require('../../assets/wordmark.png')} style={styles.wordmark} resizeMode="contain" accessibilityLabel="Fusionote" />
          </View>
          <View style={styles.headerActions}>
            <IconButton icon="git-network-outline" label="Mapa myśli" onPress={() => navigation.navigate('Map')} />
            <IconButton icon="settings-outline" label="Ustawienia" onPress={() => navigation.navigate('Settings')} />
          </View>
        </View>
      )}

      <View style={styles.search}>
        <Ionicons name="search" size={18} color={colors.textMuted} />
        <TextInput
          value={query}
          onChangeText={setQuery}
          placeholder={parent ? 'Szukaj w podmyślach' : 'Szukaj we wszystkich myślach'}
          placeholderTextColor={colors.textMuted}
          style={styles.searchInput}
          returnKeyType="search"
          autoCorrect={false}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityLabel="Wyczyść wyszukiwanie">
            <Ionicons name="close-circle" size={18} color={colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      <View style={styles.metaRow}>
        <Text style={styles.sectionLabel}>
          {q ? `Wyniki: ${data.length}` : parent ? `Podmyśli · ${data.length}` : `Twoje myśli · ${data.length}`}
        </Text>
        <Pressable onPress={cycleSort} hitSlop={8} style={styles.sortBtn} accessibilityRole="button" accessibilityLabel={`Sortowanie: ${SORT_LABELS[settings.sortMode]}`}>
          <Ionicons name="swap-vertical" size={14} color={colors.textSecondary} />
          <Text style={styles.sortText}>{SORT_LABELS[settings.sortMode]}</Text>
        </Pressable>
      </View>

      {saveError ? (
        <Pressable style={styles.errorBanner} onPress={() => void flush()}>
          <Ionicons name="warning-outline" size={16} color={colors.danger} />
          <Text style={styles.errorText}>{saveError} Dotknij, aby ponowić.</Text>
        </Pressable>
      ) : null}
    </View>
  );

  return (
    <View style={styles.flex}>
      <Backdrop />
      <FlatList
        key={columns}
        data={data}
        numColumns={columns}
        keyExtractor={(t) => t.id}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={{ paddingTop: insets.top + 12, paddingBottom: insets.bottom + 120, paddingHorizontal: 10 }}
        ListHeaderComponent={header}
        renderItem={({ item, index }) => (
          <View style={{ width: `${100 / columns}%` }}>
            <ThoughtCard
              thought={item}
              index={index}
              childCount={childCounts.get(item.id) ?? 0}
              subtitle={pathLabel(item)}
              onEdit={() => navigation.navigate('EditThought', { id: item.id })}
              onOpen={() => navigation.push('Board', { parentId: item.id })}
              onDelete={() => onDelete(item)}
            />
          </View>
        )}
        ListEmptyComponent={
          q ? (
            <EmptyState icon="search-outline" title="Brak wyników" subtitle={`Nic nie pasuje do „${query.trim()}”.`} />
          ) : parent ? (
            <EmptyState icon="git-branch-outline" title="Brak podmyśli" subtitle="Rozwiń tę myśl — dodaj pierwszą podmyśl przyciskiem poniżej." />
          ) : (
            <EmptyState icon="sparkles-outline" title="Zacznij od pierwszej myśli" subtitle="Zapisuj pomysły, łącz je w podmyśli i wracaj do nich, kiedy chcesz." />
          )
        }
      />

      <ScalePressable
        onPress={onAdd}
        accessibilityRole="button"
        accessibilityLabel={parent ? 'Dodaj podmyśl' : 'Dodaj myśl'}
        style={[styles.fabWrap, { bottom: insets.bottom + 24 }]}
        scaleTo={0.94}
      >
        <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.fab}>
          <Ionicons name="add" size={26} color="#fff" />
          <Text style={styles.fabText}>{parent ? 'Podmyśl' : 'Nowa myśl'}</Text>
        </LinearGradient>
      </ScalePressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  header: { paddingHorizontal: 6, paddingBottom: 6, gap: 14 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  headerActions: { flexDirection: 'row', gap: 8 },
  brand: { flexDirection: 'row', alignItems: 'center', gap: 6, flexShrink: 1 },
  brandMark: { width: 40, height: 40 },
  wordmark: { width: 124, height: 30 },
  breadcrumb: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, paddingHorizontal: 6, marginTop: 2 },
  parentTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 6, marginTop: -6 },
  parentDot: { width: 10, height: 10, borderRadius: 5, shadowOpacity: 1, shadowRadius: 8, elevation: 4 },
  parentTitle: { color: colors.text, fontFamily: fonts.bold, fontSize: 26, lineHeight: 32, flex: 1 },
  parentContent: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, lineHeight: 20, paddingHorizontal: 6, marginTop: -6 },
  search: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 6,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchInput: { flex: 1, color: colors.text, fontFamily: fonts.regular, fontSize: 15, paddingVertical: 0 },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 6 },
  sectionLabel: { color: colors.textSecondary, fontFamily: fonts.semibold, fontSize: 13, letterSpacing: 0.2 },
  sortBtn: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, paddingHorizontal: 10, borderRadius: radius.pill, backgroundColor: 'rgba(255,255,255,0.04)' },
  sortText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 12 },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 6,
    padding: 12,
    borderRadius: radius.md,
    backgroundColor: 'rgba(255,92,122,0.10)',
    borderWidth: 1,
    borderColor: 'rgba(255,92,122,0.30)',
  },
  errorText: { color: colors.text, fontFamily: fonts.medium, fontSize: 13, flex: 1 },
  fabWrap: {
    position: 'absolute',
    right: 20,
    borderRadius: radius.pill,
    shadowColor: colors.violet,
    shadowOpacity: 0.55,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 10,
  },
  fab: { flexDirection: 'row', alignItems: 'center', gap: 8, height: 58, paddingLeft: 18, paddingRight: 22, borderRadius: radius.pill },
  fabText: { color: '#fff', fontFamily: fonts.semibold, fontSize: 16 },
});
