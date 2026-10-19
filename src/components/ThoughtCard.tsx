import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { Animated, Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors, defaultThoughtColor, fonts, radius } from '../theme';
import { Thought } from '../types';
import { safeColor, withAlpha } from '../utils/color';
import { formatRelative } from '../utils/date';
import { ScalePressable } from './Pressable';

type Props = {
  thought: Thought;
  childCount: number;
  index: number;
  onEdit: () => void;
  onOpen: () => void;
  onDelete: () => void;
  subtitle?: string;
};

export function ThoughtCard({ thought, childCount, index, onEdit, onOpen, onDelete, subtitle }: Props) {
  const accent = safeColor(thought.color, defaultThoughtColor);
  const appear = useRef(new Animated.Value(0)).current;
  const [imageFailed, setImageFailed] = useState(false);

  useEffect(() => {
    Animated.timing(appear, {
      toValue: 1,
      duration: 260,
      delay: Math.min(index, 8) * 35,
      useNativeDriver: true,
    }).start();
  }, [appear, index]);

  useEffect(() => setImageFailed(false), [thought.image]);

  const title = thought.title.trim() || 'Bez tytułu';

  return (
    <Animated.View
      style={[
        styles.outer,
        { opacity: appear, transform: [{ translateY: appear.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] },
      ]}
    >
      <ScalePressable
        onPress={onEdit}
        accessibilityRole="button"
        accessibilityLabel={`Edytuj myśl: ${title}`}
        style={[styles.card, { borderColor: withAlpha(accent, 0.28) }]}
      >
        <LinearGradient
          colors={[withAlpha(accent, 0.16), 'rgba(18,16,49,0)']}
          start={{ x: 0, y: 0 }}
          end={{ x: 0.8, y: 0.9 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.accent, { backgroundColor: accent, shadowColor: accent }]} />

        {thought.image && !imageFailed ? (
          <Image source={{ uri: thought.image }} style={styles.image} onError={() => setImageFailed(true)} />
        ) : null}

        <View style={styles.body}>
          {subtitle ? (
            <Text style={styles.subtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          ) : null}
          <Text style={[styles.title, !thought.title.trim() && styles.untitled]} numberOfLines={2}>
            {title}
          </Text>
          {thought.content.trim() ? (
            <Text style={styles.content} numberOfLines={4}>
              {thought.content.trim()}
            </Text>
          ) : null}
        </View>

        <View style={styles.footer}>
          <Text style={styles.time} numberOfLines={1}>
            {formatRelative(thought.updatedAt)}
          </Text>
          <View style={styles.actions}>
            <Pressable
              onPress={onOpen}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel={`Podmyśli (${childCount})`}
              style={({ pressed }) => [styles.chip, childCount > 0 && { borderColor: withAlpha(accent, 0.45) }, pressed && styles.pressed]}
            >
              <Ionicons name="git-network-outline" size={15} color={childCount > 0 ? accent : colors.textMuted} />
              <Text style={[styles.chipText, childCount > 0 && { color: colors.text }]}>{childCount}</Text>
            </Pressable>
            <Pressable
              onPress={onDelete}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Usuń myśl"
              style={({ pressed }) => [styles.iconBtn, pressed && styles.pressed]}
            >
              <Ionicons name="trash-outline" size={16} color={colors.textMuted} />
            </Pressable>
          </View>
        </View>
      </ScalePressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, padding: 6 },
  card: {
    flex: 1,
    minHeight: 150,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    overflow: 'hidden',
  },
  accent: {
    position: 'absolute',
    left: 14,
    top: 0,
    width: 28,
    height: 3,
    borderBottomLeftRadius: 3,
    borderBottomRightRadius: 3,
    shadowOpacity: 0.9,
    shadowRadius: 8,
    zIndex: 2,
  },
  image: { width: '100%', height: 96, backgroundColor: colors.surfaceHigh },
  body: { paddingHorizontal: 14, paddingTop: 16, gap: 6, flex: 1 },
  subtitle: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 11, letterSpacing: 0.3 },
  title: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16, lineHeight: 21 },
  untitled: { color: colors.textMuted, fontStyle: 'italic' },
  content: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19 },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    marginTop: 8,
  },
  time: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 11, flexShrink: 1, marginRight: 6 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    height: 32,
    paddingHorizontal: 10,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  chipText: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12 },
  iconBtn: { width: 32, height: 32, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  pressed: { opacity: 0.6 },
});
