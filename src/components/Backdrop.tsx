import { LinearGradient } from 'expo-linear-gradient';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { colors } from '../theme';

/** Tło ekranów: głęboki granat z delikatną fioletową poświatą u góry. */
export function Backdrop() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.bg }]} />
      <LinearGradient
        colors={['rgba(124,77,255,0.20)', 'rgba(228,73,245,0.06)', 'rgba(7,6,20,0)']}
        locations={[0, 0.35, 0.7]}
        start={{ x: 0.1, y: 0 }}
        end={{ x: 0.6, y: 1 }}
        style={styles.glow}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  glow: { position: 'absolute', top: 0, left: 0, right: 0, height: 420 },
});
