import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import Constants from 'expo-constants';
import React from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '../components/Backdrop';
import { IconButton } from '../components/IconButton';
import { useToast } from '../components/Toast';
import { useThoughts } from '../store/ThoughtsContext';
import { APP_NAME, colors, fonts, radius, TAGLINE } from '../theme';
import { RootStackParamList, SortMode } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Settings'>;

const SORTS: { mode: SortMode; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { mode: 'updated', label: 'Ostatnio edytowane', icon: 'time-outline' },
  { mode: 'created', label: 'Najnowsze', icon: 'sparkles-outline' },
  { mode: 'alpha', label: 'Alfabetycznie', icon: 'text-outline' },
];

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { thoughts, settings, updateSettings, deleteAll } = useThoughts();
  const roots = thoughts.filter((t) => !t.parentId).length;
  const withImages = thoughts.filter((t) => t.image).length;
  const version = Constants.expoConfig?.version ?? '';

  const confirmDeleteAll = () => {
    if (!thoughts.length) {
      toast('Nie masz jeszcze żadnych myśli', 'info');
      return;
    }
    Alert.alert('Usunąć wszystkie myśli?', `Zostanie trwale usuniętych ${thoughts.length} myśli wraz z obrazkami. Tej operacji nie można cofnąć.`, [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń wszystko',
        style: 'destructive',
        onPress: async () => {
          await deleteAll();
          toast('Wszystkie myśli zostały usunięte');
          navigation.popToTop();
        },
      },
    ]);
  };

  return (
    <View style={styles.flex}>
      <Backdrop />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
        <Text style={styles.title}>Ustawienia</Text>
      </View>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}>
        <View style={styles.hero}>
          <Image source={require('../../assets/logo-badge.png')} style={styles.badge} />
          <Image source={require('../../assets/wordmark.png')} style={styles.wordmark} resizeMode="contain" accessibilityLabel={APP_NAME} />
          <Text style={styles.tagline}>{TAGLINE}</Text>
        </View>

        <View style={styles.stats}>
          <Stat value={thoughts.length} label="Myśli" />
          <Stat value={roots} label="Główne" />
          <Stat value={withImages} label="Z obrazkiem" />
        </View>

        <Text style={styles.section}>Sortowanie myśli</Text>
        <View style={styles.group}>
          {SORTS.map((s, i) => {
            const active = settings.sortMode === s.mode;
            return (
              <Pressable
                key={s.mode}
                onPress={() => updateSettings({ sortMode: s.mode })}
                style={({ pressed }) => [styles.item, i > 0 && styles.itemBorder, pressed && { opacity: 0.7 }]}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
              >
                <Ionicons name={s.icon} size={20} color={active ? colors.violet : colors.textSecondary} />
                <Text style={[styles.itemText, active && { color: colors.text }]}>{s.label}</Text>
                {active && <Ionicons name="checkmark-circle" size={20} color={colors.violet} />}
              </Pressable>
            );
          })}
        </View>

        <Text style={styles.section}>Dane</Text>
        <View style={styles.group}>
          <View style={styles.item}>
            <Ionicons name="phone-portrait-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.itemText}>Myśli są zapisywane automatycznie, wyłącznie na tym urządzeniu.</Text>
          </View>
          <Pressable onPress={confirmDeleteAll} style={({ pressed }) => [styles.item, styles.itemBorder, pressed && { opacity: 0.7 }]} accessibilityRole="button">
            <Ionicons name="trash-outline" size={20} color={colors.danger} />
            <Text style={[styles.itemText, { color: colors.danger }]}>Usuń wszystkie myśli</Text>
          </Pressable>
        </View>

        <Text style={styles.section}>O aplikacji</Text>
        <View style={styles.group}>
          <View style={styles.item}>
            <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.itemText}>
              {APP_NAME} {version}
            </Text>
          </View>
          <View style={[styles.item, styles.itemBorder]}>
            <Ionicons name="sparkles-outline" size={20} color={colors.textSecondary} />
            <Text style={styles.itemText}>Następca aplikacji FusioMyśli — Twoje dotychczasowe myśli zostały zachowane.</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

function Stat({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 14, paddingHorizontal: 16, paddingBottom: 8 },
  title: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
  content: { paddingHorizontal: 16, gap: 10 },
  hero: { alignItems: 'center', paddingVertical: 12 },
  badge: { width: 116, height: 116 },
  wordmark: { width: 190, height: 44, marginTop: 4 },
  tagline: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 14, marginTop: 6, textAlign: 'center' },
  stats: { flexDirection: 'row', gap: 10 },
  stat: { flex: 1, backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, paddingVertical: 14, alignItems: 'center' },
  statValue: { color: colors.text, fontFamily: fonts.bold, fontSize: 22 },
  statLabel: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12, marginTop: 2 },
  section: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 14 },
  group: { backgroundColor: colors.surface, borderRadius: radius.lg, borderWidth: 1, borderColor: colors.border, overflow: 'hidden' },
  item: { flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 54, paddingHorizontal: 16, paddingVertical: 12 },
  itemBorder: { borderTopWidth: 1, borderTopColor: colors.border },
  itemText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 15, flex: 1, lineHeight: 20 },
});
