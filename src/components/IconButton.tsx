import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet } from 'react-native';

import { colors, radius } from '../theme';
import { ScalePressable } from './Pressable';

type Props = {
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  label: string;
  color?: string;
  size?: number;
  variant?: 'ghost' | 'filled';
  disabled?: boolean;
};

export function IconButton({ icon, onPress, label, color = colors.text, size = 22, variant = 'filled', disabled }: Props) {
  return (
    <ScalePressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      hitSlop={6}
      scaleTo={0.9}
      style={[styles.btn, variant === 'filled' && styles.filled, disabled && { opacity: 0.4 }]}
    >
      <Ionicons name={icon} size={size} color={color} />
    </ScalePressable>
  );
}

const styles = StyleSheet.create({
  btn: { width: 44, height: 44, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  filled: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
