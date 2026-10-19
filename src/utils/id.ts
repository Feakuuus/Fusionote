/** Unikalne id bez zależności od crypto (oryginalny uuid.v4 wymagał polyfilla). */
export function createId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
