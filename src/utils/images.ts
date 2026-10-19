import * as FileSystem from 'expo-file-system';

const IMAGES_DIR = `${FileSystem.documentDirectory}images/`;

/**
 * Kopiuje wybrany obrazek do trwałego katalogu aplikacji.
 * Oryginalna wersja zapisywała URI z pamięci podręcznej, którą system może wyczyścić
 * — wtedy obrazki znikały z myśli.
 */
export async function persistImage(uri: string): Promise<string> {
  if (!FileSystem.documentDirectory) return uri;
  if (uri.startsWith(IMAGES_DIR)) return uri;
  const info = await FileSystem.getInfoAsync(IMAGES_DIR);
  if (!info.exists) await FileSystem.makeDirectoryAsync(IMAGES_DIR, { intermediates: true });
  const ext = (uri.split('?')[0].match(/\.(\w{2,5})$/)?.[1] ?? 'jpg').toLowerCase();
  const target = `${IMAGES_DIR}${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
  await FileSystem.copyAsync({ from: uri, to: target });
  return target;
}

/** Usuwa obrazek, jeśli należy do katalogu aplikacji. Błędy są ignorowane. */
export async function removeImage(uri: string | undefined): Promise<void> {
  if (!uri || !uri.startsWith(IMAGES_DIR)) return;
  try {
    await FileSystem.deleteAsync(uri, { idempotent: true });
  } catch {
    // plik mógł zostać już usunięty — nie blokujemy operacji
  }
}
