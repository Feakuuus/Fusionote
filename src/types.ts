export type Thought = {
  id: string;
  title: string;
  content: string;
  color: string;
  /** Id myśli nadrzędnej; brak = myśl główna. */
  parentId?: string;
  /** Lokalny URI obrazka (kopiowany do katalogu aplikacji). */
  image?: string;
  createdAt: number;
  updatedAt: number;
};

export type SortMode = 'updated' | 'created' | 'alpha';

export type RootStackParamList = {
  Welcome: undefined;
  Board: { parentId?: string } | undefined;
  EditThought: { id: string; isNew?: boolean };
  Map: undefined;
  Settings: undefined;
};
