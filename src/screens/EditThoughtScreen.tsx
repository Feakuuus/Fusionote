import { Ionicons } from '@expo/vector-icons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Haptics from 'expo-haptics';
import * as ImagePicker from 'expo-image-picker';
import React, { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Backdrop } from '../components/Backdrop';
import { EmptyState } from '../components/EmptyState';
import { GradientButton } from '../components/GradientButton';
import { IconButton } from '../components/IconButton';
import { useToast } from '../components/Toast';
import { useThoughts } from '../store/ThoughtsContext';
import { colors, defaultThoughtColor, fonts, radius, thoughtColors } from '../theme';
import { RootStackParamList } from '../types';
import { normalizeHex, safeColor, withAlpha } from '../utils/color';
import { formatFull } from '../utils/date';
import { persistImage, removeImage } from '../utils/images';

type Props = NativeStackScreenProps<RootStackParamList, 'EditThought'>;

export function EditThoughtScreen({ navigation, route }: Props) {
  const { id, isNew } = route.params;
  const insets = useSafeAreaInsets();
  const toast = useToast();
  const { getThought, updateThought, deleteThought, discardIfEmpty, getChildren, addThought, flush } = useThoughts();
  const thought = getThought(id);

  // Stan formularza inicjujemy raz. Oryginał nadpisywał pola przy każdej zmianie danych
  // i przy otwarciu zapisywał puste wartości, co mogło kasować treść myśli.
  const [title, setTitle] = useState(thought?.title ?? '');
  const [content, setContent] = useState(thought?.content ?? '');
  const [color, setColor] = useState(safeColor(thought?.color, defaultThoughtColor));
  const [hexDraft, setHexDraft] = useState(safeColor(thought?.color, defaultThoughtColor));
  const [hexError, setHexError] = useState(false);
  const [image, setImage] = useState<string | undefined>(thought?.image);
  const [imageBusy, setImageBusy] = useState(false);
  const [imageFailed, setImageFailed] = useState(false);
  const [saved, setSaved] = useState(true);
  const edited = useRef(false);
  const deleted = useRef(false);

  const apply = (patch: Parameters<typeof updateThought>[1]) => {
    edited.current = true;
    setSaved(false);
    updateThought(id, patch);
  };

  // wskaźnik „Zapisano” po zapisie na dysk (magazyn zapisuje z krótkim opóźnieniem)
  useEffect(() => {
    if (saved) return;
    const t = setTimeout(() => {
      void flush().then(() => setSaved(true));
    }, 500);
    return () => clearTimeout(t);
  }, [saved, title, content, color, image, flush]);

  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', () => {
      if (deleted.current) return;
      if (isNew && discardIfEmpty(id)) {
        void flush();
        return;
      }
      void flush();
      if (edited.current) toast(isNew ? 'Myśl zapisana' : 'Zmiany zapisane');
    });
    return unsub;
  }, [navigation, id, isNew, discardIfEmpty, flush, toast]);

  if (!thought) {
    return (
      <View style={[styles.flex, { paddingTop: insets.top + 12 }]}>
        <Backdrop />
        <View style={styles.headerRow}>
          <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
        </View>
        <EmptyState icon="alert-circle-outline" title="Nie znaleziono myśli" subtitle="Ta myśl mogła zostać usunięta." />
      </View>
    );
  }

  const children = getChildren(id);

  const pickColor = (c: string) => {
    setColor(c);
    setHexDraft(c);
    setHexError(false);
    apply({ color: c });
    void Haptics.selectionAsync();
  };

  const onHexChange = (value: string) => {
    setHexDraft(value);
    const n = normalizeHex(value);
    setHexError(!n && value.trim().length > 0);
    if (n) {
      setColor(n);
      apply({ color: n });
    }
  };

  const pickImage = async () => {
    try {
      setImageBusy(true);
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, allowsEditing: false });
      if (result.canceled || !result.assets?.length) return;
      const stored = await persistImage(result.assets[0].uri);
      const previous = image;
      setImage(stored);
      setImageFailed(false);
      apply({ image: stored });
      if (previous && previous !== stored) void removeImage(previous);
    } catch (e) {
      console.error('Błąd wyboru obrazka:', e);
      Alert.alert('Nie udało się dodać obrazka', 'Sprawdź uprawnienia do zdjęć w ustawieniach telefonu i spróbuj ponownie.');
    } finally {
      setImageBusy(false);
    }
  };

  const removeCurrentImage = () => {
    Alert.alert('Usunąć obrazek?', 'Obrazek zostanie odłączony od tej myśli.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          const previous = image;
          setImage(undefined);
          apply({ image: undefined });
          void removeImage(previous);
        },
      },
    ]);
  };

  const onDelete = () => {
    const sub = children.length > 0;
    Alert.alert('Usunąć myśl?', sub ? 'Myśl zostanie usunięta razem ze wszystkimi podmyślami. Tej operacji nie można cofnąć.' : 'Tej operacji nie można cofnąć.', [
      { text: 'Anuluj', style: 'cancel' },
      {
        text: 'Usuń',
        style: 'destructive',
        onPress: () => {
          deleted.current = true;
          deleteThought(id);
          void flush();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          toast('Myśl usunięta');
          navigation.goBack();
        },
      },
    ]);
  };

  const openChildren = () => navigation.push('Board', { parentId: id });
  const addChild = () => {
    if (!title.trim() && !content.trim()) {
      // pusta myśl nadrzędna zostałaby odrzucona — nadajemy jej tytuł domyślny
      setTitle('Nowa myśl');
      apply({ title: 'Nowa myśl' });
    }
    const child = addThought(id);
    navigation.push('EditThought', { id: child.id, isNew: true });
  };

  return (
    <View style={styles.flex}>
      <Backdrop />
      <KeyboardAvoidingView style={styles.flex} behavior="padding">
        <View style={[styles.headerRow, { paddingTop: insets.top + 12 }]}>
          <IconButton icon="chevron-back" label="Wróć" onPress={() => navigation.goBack()} />
          <Text style={styles.headerTitle}>{isNew ? 'Nowa myśl' : 'Edycja'}</Text>
          <View style={[styles.savePill, saved ? styles.savePillOk : null]} accessibilityLiveRegion="polite">
            {saved ? <Ionicons name="cloud-done-outline" size={14} color={colors.success} /> : <ActivityIndicator size="small" color={colors.textMuted} />}
            <Text style={[styles.saveText, saved && { color: colors.success }]}>{saved ? 'Zapisano' : 'Zapisywanie'}</Text>
          </View>
        </View>

        <ScrollView
          style={styles.flex}
          contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="interactive"
        >
          <View style={[styles.editorCard, { borderColor: withAlpha(color, 0.35) }]}>
            <View style={[styles.editorAccent, { backgroundColor: color, shadowColor: color }]} />
            <TextInput
              value={title}
              onChangeText={(v) => {
                setTitle(v);
                apply({ title: v });
              }}
              placeholder="Tytuł myśli"
              placeholderTextColor={colors.textMuted}
              style={styles.titleInput}
              autoFocus={isNew}
              maxLength={140}
              multiline
              submitBehavior="blurAndSubmit"
              returnKeyType="next"
            />
            <View style={styles.divider} />
            <TextInput
              value={content}
              onChangeText={(v) => {
                setContent(v);
                apply({ content: v });
              }}
              placeholder="Rozwiń swoją myśl…"
              placeholderTextColor={colors.textMuted}
              style={styles.contentInput}
              multiline
              textAlignVertical="top"
              scrollEnabled={false}
            />
          </View>

          <Text style={styles.section}>Kolor</Text>
          <View style={styles.palette}>
            {thoughtColors.map((c) => {
              const active = c.toLowerCase() === color.toLowerCase();
              return (
                <Pressable
                  key={c}
                  onPress={() => pickColor(c)}
                  accessibilityRole="button"
                  accessibilityLabel={`Kolor ${c}`}
                  accessibilityState={{ selected: active }}
                  style={[styles.swatchRing, active && { borderColor: c }]}
                >
                  <View style={[styles.swatch, { backgroundColor: c }]}>{active && <Ionicons name="checkmark" size={18} color="#0b0a1f" />}</View>
                </Pressable>
              );
            })}
          </View>
          <View style={[styles.hexRow, hexError && { borderColor: colors.danger }]}>
            <View style={[styles.hexPreview, { backgroundColor: color }]} />
            <TextInput
              value={hexDraft}
              onChangeText={onHexChange}
              placeholder="#a855f7"
              placeholderTextColor={colors.textMuted}
              style={styles.hexInput}
              autoCapitalize="none"
              autoCorrect={false}
              maxLength={9}
              accessibilityLabel="Własny kolor w formacie HEX"
            />
            <Text style={styles.hexHint}>HEX</Text>
          </View>
          {hexError ? <Text style={styles.errorText}>Wpisz kolor w formacie #RRGGBB, np. #a855f7.</Text> : null}

          <Text style={styles.section}>Obrazek</Text>
          {image && !imageFailed ? (
            <View style={styles.imageWrap}>
              <Image source={{ uri: image }} style={styles.image} onError={() => setImageFailed(true)} />
              <View style={styles.imageActions}>
                <Pressable style={styles.imageBtn} onPress={pickImage} accessibilityRole="button" accessibilityLabel="Zmień obrazek">
                  <Ionicons name="swap-horizontal" size={16} color={colors.text} />
                  <Text style={styles.imageBtnText}>Zmień</Text>
                </Pressable>
                <Pressable style={styles.imageBtn} onPress={removeCurrentImage} accessibilityRole="button" accessibilityLabel="Usuń obrazek">
                  <Ionicons name="trash-outline" size={16} color={colors.danger} />
                  <Text style={[styles.imageBtnText, { color: colors.danger }]}>Usuń</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.imagePlaceholder} onPress={pickImage} disabled={imageBusy} accessibilityRole="button" accessibilityLabel="Dodaj obrazek z galerii">
              {imageBusy ? <ActivityIndicator color={colors.violet} /> : <Ionicons name="image-outline" size={26} color={colors.violet} />}
              <Text style={styles.placeholderText}>{imageFailed ? 'Obrazek jest niedostępny — wybierz ponownie' : 'Dodaj obrazek z galerii'}</Text>
            </Pressable>
          )}

          <Text style={styles.section}>Podmyśli</Text>
          <View style={styles.childRow}>
            <GradientButton
              variant="secondary"
              icon="git-network-outline"
              title={children.length ? `Otwórz (${children.length})` : 'Otwórz'}
              onPress={openChildren}
              style={styles.flex}
            />
            <GradientButton variant="secondary" icon="add" title="Dodaj" onPress={addChild} style={styles.flex} />
          </View>

          <View style={styles.meta}>
            <Text style={styles.metaText}>Utworzono: {formatFull(thought.createdAt)}</Text>
            <Text style={styles.metaText}>Ostatnia zmiana: {formatFull(thought.updatedAt)}</Text>
          </View>

          <GradientButton variant="danger" icon="trash-outline" title="Usuń myśl" onPress={onDelete} />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingBottom: 8, gap: 12 },
  headerTitle: { color: colors.text, fontFamily: fonts.semibold, fontSize: 17, flex: 1 },
  savePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 32,
    paddingHorizontal: 12,
    borderRadius: radius.pill,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  savePillOk: { borderColor: 'rgba(52,211,153,0.3)' },
  saveText: { color: colors.textMuted, fontFamily: fonts.medium, fontSize: 12 },
  scroll: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  editorCard: { backgroundColor: colors.surface, borderRadius: radius.xl, borderWidth: 1, padding: 18, paddingTop: 22, overflow: 'hidden' },
  editorAccent: { position: 'absolute', top: 0, left: 20, width: 40, height: 3, borderRadius: 2, shadowOpacity: 1, shadowRadius: 10 },
  titleInput: { color: colors.text, fontFamily: fonts.bold, fontSize: 24, lineHeight: 30, padding: 0 },
  divider: { height: 1, backgroundColor: colors.border, marginVertical: 14 },
  contentInput: { color: colors.textSecondary, fontFamily: fonts.regular, fontSize: 16, lineHeight: 24, minHeight: 140, padding: 0 },
  section: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 12, letterSpacing: 1.2, textTransform: 'uppercase', marginTop: 12 },
  palette: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  swatchRing: { padding: 3, borderRadius: radius.pill, borderWidth: 2, borderColor: 'transparent' },
  swatch: { width: 38, height: 38, borderRadius: radius.pill, alignItems: 'center', justifyContent: 'center' },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    height: 50,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hexPreview: { width: 26, height: 26, borderRadius: 8 },
  hexInput: { flex: 1, color: colors.text, fontFamily: fonts.medium, fontSize: 15, paddingVertical: 0 },
  hexHint: { color: colors.textMuted, fontFamily: fonts.semibold, fontSize: 11, letterSpacing: 1 },
  errorText: { color: colors.danger, fontFamily: fonts.regular, fontSize: 13, marginTop: -4 },
  imageWrap: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
  image: { width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.surfaceHigh },
  imageActions: { flexDirection: 'row' },
  imageBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, height: 48 },
  imageBtnText: { color: colors.text, fontFamily: fonts.medium, fontSize: 14 },
  imagePlaceholder: {
    height: 110,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderStrong,
    backgroundColor: 'rgba(168,85,247,0.05)',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  placeholderText: { color: colors.textSecondary, fontFamily: fonts.medium, fontSize: 14 },
  childRow: { flexDirection: 'row', gap: 10 },
  meta: { marginTop: 16, gap: 4, alignItems: 'center' },
  metaText: { color: colors.textMuted, fontFamily: fonts.regular, fontSize: 12 },
});
