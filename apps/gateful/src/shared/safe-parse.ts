/** JSON.parse that returns null instead of throwing on malformed input. */
export function safeParse<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
