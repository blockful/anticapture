/**
 * Pure helper: maps an array of bigint values to their string representations.
 * Used by useEncodedDraftActions to adapt the encodeActions output (bigint[])
 * into the string[] format that ActionsTabContent expects.
 *
 * Kept in a separate module so it can be unit-tested without importing
 * React/wagmi (which are ESM-only and incompatible with the Jest/ts-jest setup).
 */
export const bigintValuesToStrings = (values: bigint[]): string[] =>
  values.map((v) => v.toString());
