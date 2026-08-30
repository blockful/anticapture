/**
 * Middle-truncates a long token ("0xa9059cbb…c0dd") for dimmed raw
 * annotations. Short values pass through untouched so nothing gains a fake
 * ellipsis.
 */
export const shortHex = (value: string, head = 10, tail = 8): string =>
  value.length <= head + tail + 1
    ? value
    : `${value.slice(0, head)}…${value.slice(-tail)}`;
