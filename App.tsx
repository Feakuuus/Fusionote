import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, useFonts } from '@expo-google-fonts/inter';
import { Ionicons } from '@expo/vector-icons';
import { DarkTheme, NavigationContainer, Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect } from 'react';
import { ActivityIndicator, Image, StyleSheet, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { Backdrop } from './src/components/Backdrop';
import { GradientButton } from './src/components/GradientButton';
import { ToastProvider } from './src/components/Toast';
import { BoardScreen } from './src/screens/BoardScreen';
import { EditThoughtScreen } from './src/screens/EditThoughtScreen';
import { MapScreen } from './src/screens/MapScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { WelcomeScreen } from './src/screens/WelcomeScreen';
import { ThoughtsProvider, useThoughts } from './src/store/ThoughtsContext';
import { colors, fonts } from './src/theme';
import { RootStackParamList } from './src/types';

SplashScreen.preventAutoHideAsync().catch(() => {});
SplashScreen.setOptions({ duration: 250, fade: true });
SystemUI.setBackgroundColorAsync(colors.bg).catch(() => {});

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DarkTheme,
  colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg, primary: colors.violet, text: colors.text, border: colors.border },
};

function Root() {
  const { status, loadError, reload, settings } = useThoughts();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  if (status === 'loading') {
    return (
      <View style={styles.center}>
        <Backdrop />
        <Image source={require('./assets/logo-mark.png')} style={styles.loadingLogo} />
        <ActivityIndicator color={colors.violet} />
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View style={[styles.center, { padding: 32, gap: 14 }]}>
        <Backdrop />
        <Ionicons name="alert-circle-outline" size={44} color={colors.danger} />
        <Text style={styles.errorTitle}>{loadError}</Text>
        <Text style={styles.errorText}>Twoje dane nie zostały usunięte. Spróbuj ponownie.</Text>
        <GradientButton title="Spróbuj ponownie" icon="refresh" onPress={() => void reload()} style={{ alignSelf: 'stretch' }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Stack.Navigator
        initialRouteName={settings.onboarded ? 'Board' : 'Welcome'}
        screenOptions={{ headerShown: false, animation: 'slide_from_right', contentStyle: { backgroundColor: colors.bg } }}
      >
        <Stack.Screen name="Welcome" component={WelcomeScreen} options={{ animation: 'fade' }} />
        <Stack.Screen name="Board" component={BoardScreen} />
        <Stack.Screen name="EditThought" component={EditThoughtScreen} options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="Map" component={MapScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  const [fontsLoaded, fontError] = useFonts({ Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold });

  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <ThoughtsProvider>
          <ToastProvider>
            <Root />
          </ToastProvider>
        </ThoughtsProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  loadingLogo: { width: 120, height: 120, marginBottom: 24 },
  errorTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 18, textAlign: 'center' },
  errorText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 14, textAlign: 'center', marginBottom: 8 },
});
