import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useRef } from 'react';
import { Animated, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '../components/Backdrop';
import { GradientButton } from '../components/GradientButton';
import { useThoughts } from '../store/ThoughtsContext';
import { APP_NAME, colors, fonts, radius, TAGLINE } from '../theme';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const FEATURES: { icon: keyof typeof Ionicons.glyphMap; title: string; text: string }[] = [
  { icon: 'flash-outline', title: 'Zapisuj od razu', text: 'Nowa myśl jest gotowa jednym dotknięciem i zapisuje się sama.' },
  { icon: 'git-network-outline', title: 'Łącz w mapę', text: 'Rozwijaj myśli w podmyśli i przeglądaj całe drzewo pomysłów.' },
  { icon: 'color-palette-outline', title: 'Nadaj charakter', text: 'Kolory i obrazki pomagają szybko odnaleźć to, co ważne.' },
];

export function WelcomeScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { updateSettings } = useThoughts();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, { toValue: 1, duration: 500, useNativeDriver: true }).start();
  }, [anim]);

  const start = () => {
    updateSettings({ onboarded: true });
    navigation.replace('Board');
  };

  return (
    <View style={styles.flex}>
      <Backdrop />
      <ScrollView contentContainerStyle={[styles.content, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 24 }]}>
        <Animated.View style={[styles.hero, { opacity: anim, transform: [{ scale: anim.interpolate({ inputRange: [0, 1], outputRange: [0.94, 1] }) }] }]}>
          <Image source={require('../../assets/logo-badge.png')} style={styles.badge} />
          <Image source={require('../../assets/wordmark.png')} style={styles.wordmark} resizeMode="contain" accessibilityLabel={APP_NAME} />
          <Text style={styles.tagline}>{TAGLINE}</Text>
        </Animated.View>

        <Animated.View style={[styles.features, { opacity: anim }]}>
          {FEATURES.map((f) => (
            <View key={f.title} style={styles.feature}>
              <View style={styles.featureIcon}>
                <Ionicons name={f.icon} size={22} color={colors.violet} />
              </View>
              <View style={styles.flex}>
                <Text style={styles.featureTitle}>{f.title}</Text>
                <Text style={styles.featureText}>{f.text}</Text>
              </View>
            </View>
          ))}
        </Animated.View>

        <View style={styles.flexGrow} />
        <GradientButton title="Zaczynamy" icon="arrow-forward" onPress={start} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  flexGrow: { flexGrow: 1, minHeight: 24 },
  content: { flexGrow: 1, paddingHorizontal: 24 },
  hero: { alignItems: 'center' },
  badge: { width: 168, height: 168 },
  wordmark: { width: 240, height: 56, marginTop: 8 },
  tagline: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, marginTop: 10, textAlign: 'center' },
  features: { marginTop: 40, gap: 12 },
  feature: {
    flexDirection: 'row',
    gap: 14,
    padding: 16,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(168,85,247,0.12)',
  },
  featureTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 15 },
  featureText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 13, lineHeight: 19, marginTop: 2 },
});
