import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, Text, ViewStyle } from 'react-native';

import { brandGradient, colors, fonts, radius } from '../theme';
import { ScalePressable } from './Pressable';

type Props = {
  title: string;
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  variant?: 'primary' | 'secondary' | 'danger';
  style?: ViewStyle;
};

export function GradientButton({ title, onPress, icon, variant = 'primary', style }: Props) {
  const content = (
    <>
      {icon && <Ionicons name={icon} size={20} color={variant === 'danger' ? colors.danger : colors.text} />}
      <Text style={[styles.text, variant === 'danger' && { color: colors.danger }]}>{title}</Text>
    </>
  );
  return (
    <ScalePressable onPress={onPress} accessibilityRole="button" accessibilityLabel={title} style={[styles.shadow, style]}>
      {variant === 'primary' ? (
        <LinearGradient colors={brandGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
          {content}
        </LinearGradient>
      ) : (
        <LinearGradient
          colors={variant === 'danger' ? ['rgba(255,92,122,0.12)', 'rgba(255,92,122,0.06)'] : [colors.surfaceHigh, colors.surface]}
          style={[styles.btn, styles.outlined, variant === 'danger' && { borderColor: 'rgba(255,92,122,0.35)' }]}
        >
          {content}
        </LinearGradient>
      )}
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  shadow: { borderRadius: radius.lg },
  btn: {
    minHeight: 54,
    borderRadius: radius.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 20,
  },
  outlined: { borderWidth: 1, borderColor: colors.border },
  text: { color: colors.text, fontFamily: fonts.semibold, fontSize: 16 },
});
