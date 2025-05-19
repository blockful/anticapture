// Helper function to format a word with proper pluralization
export function formatPlural(count: number, word: string): string {
  return `${count} ${count === 1 ? word : word + "s"}`;
}
