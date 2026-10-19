# Fusionote

> Twoje myśli. Zawsze przy Tobie.

Fusionote to nowa wersja aplikacji **FusioMyśli** — mapy myśli na telefon: zapisujesz myśli,
rozwijasz je w podmyśli, nadajesz im kolory i obrazki.

## Stos

- Expo SDK 53, React Native 0.79 (nowa architektura, Hermes), TypeScript
- React Navigation 7 (native stack)
- AsyncStorage — dane lokalne (klucz `thoughts`, zgodny z FusioMyśli 1.0)
- expo-image-picker + expo-file-system — obrazki kopiowane do katalogu aplikacji
- Pakiet Androida: `com.fusio.app` (bez zmian względem FusioMyśli)

## Struktura

```
App.tsx                      # fonty, splash, nawigacja, stany ładowania/błędu
src/store/ThoughtsContext.tsx # jeden wspólny magazyn myśli + kolejka zapisów
src/screens/                 # Welcome, Board (lista/poziom), EditThought, Map, Settings
src/components/              # karta myśli, przyciski, toasty, tło
src/utils/                   # kolory, daty, id, obrazki
assets/                      # logo, ikony, splash (wygenerowane z logo-source.png)
__tests__/                   # testy magazynu i przepływów aplikacji
```

## Polecenia

```bash
npm install
npm start                # serwer deweloperski (Expo)
npm test                 # testy jednostkowe i integracyjne
npm run typecheck        # kontrola TypeScript

# lokalny build APK (wymaga Android SDK + NDK 27.1, Java 17)
npx expo prebuild --platform android
cd android && ./gradlew assembleRelease
# wynik: android/app/build/outputs/apk/release/app-release.apk

# build w chmurze EAS, podpisany tym samym kluczem co FusioMyśli
npx eas build -p android --profile preview
```

## Aktualizacja z FusioMyśli

Lokalny build jest podpisany kluczem debug. Android nie pozwoli zainstalować go *na* wersji
FusioMyśli zbudowanej w EAS (inny podpis) — trzeba by ją odinstalować, co usuwa dane.
Aby zachować myśli użytkownika, zbuduj APK przez `eas build` na koncie `feakuuu`
(projekt `26cde46f-…` jest skonfigurowany w `app.json`) — EAS użyje tego samego klucza.
