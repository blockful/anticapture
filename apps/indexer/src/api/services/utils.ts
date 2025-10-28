export function containsAnyValue(data: Record<string, unknown>): boolean {
  return Object.keys(data).some((key) => {
    const value = data[key];
    if (value === null || value === undefined) return false;
    if (typeof value === "object" && Object.keys(value).length === 0)
      return false;
    return true;
  });
}
