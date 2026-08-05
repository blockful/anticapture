import { isAddressLike } from "@/shared/utils/address";
import { isEnsAddress } from "@/shared/utils/ens";

export type AbiTypeCategory =
  | "bool"
  | "uint"
  | "int"
  | "address"
  | "bytes_dynamic"
  | "bytes_fixed"
  | "array"
  | "tuple"
  | "string"
  | "other";

export function getAbiTypeCategory(abiType: string): AbiTypeCategory {
  if (abiType.endsWith("[]") || /\[\d+\]$/.test(abiType)) return "array";
  if (abiType === "bool") return "bool";
  if (/^uint\d*$/.test(abiType)) return "uint";
  if (/^int\d*$/.test(abiType)) return "int";
  if (abiType === "address") return "address";
  if (abiType === "bytes") return "bytes_dynamic";
  if (/^bytes\d+$/.test(abiType)) return "bytes_fixed";
  if (abiType === "tuple") return "tuple";
  if (abiType === "string") return "string";
  return "other";
}

export function getArgPlaceholder(abiType: string): string {
  const cat = getAbiTypeCategory(abiType);
  switch (cat) {
    case "uint":
      return "0 or 0x1a2b…";
    case "int":
      return "0 or -100";
    case "address":
      return "0x… or ENS name";
    case "bytes_dynamic":
      return "0x…";
    case "bytes_fixed": {
      const n = parseInt(abiType.replace("bytes", ""), 10);
      return `0x… (${n} bytes)`;
    }
    case "string":
      return "text…";
    default:
      return "";
  }
}

/** Validates a single scalar leaf value. Returns an error message or null. */
export function validateSolidityArg(
  abiType: string,
  value: string,
): string | null {
  const v = value.trim();
  if (!v) return null;
  const cat = getAbiTypeCategory(abiType);
  switch (cat) {
    case "bool":
      return v !== "true" && v !== "false" ? "Must be true or false" : null;
    case "uint": {
      const isDecimal = /^\d+$/.test(v);
      const isHexVal = /^0x[0-9a-fA-F]+$/.test(v);
      if (!isDecimal && !isHexVal)
        return "Must be a non-negative integer (decimal or 0x hex)";
      const bits = parseInt(abiType.replace("uint", "") || "256", 10);
      const max = (1n << BigInt(bits)) - 1n;
      if (BigInt(v) > max) return `Exceeds uint${bits} max (${max})`;
      return null;
    }
    case "int": {
      const isDecimal = /^-?\d+$/.test(v);
      const isHexVal = /^0x[0-9a-fA-F]+$/.test(v);
      if (!isDecimal && !isHexVal)
        return "Must be an integer (decimal or 0x hex)";
      const bits = parseInt(abiType.replace("int", "") || "256", 10);
      const max = (1n << BigInt(bits - 1)) - 1n;
      const min = -(1n << BigInt(bits - 1));
      const n = BigInt(v);
      if (n > max || n < min)
        return `Out of range for int${bits} (${min} to ${max})`;
      return null;
    }
    case "address":
      return !isAddressLike(v) && !isEnsAddress(v)
        ? "Must be a valid address or ENS name"
        : null;
    case "bytes_dynamic":
      return !/^0x[0-9a-fA-F]*$/.test(v) ? "Must be 0x-prefixed hex" : null;
    case "bytes_fixed": {
      const n = parseInt(abiType.replace("bytes", ""), 10);
      if (!/^0x[0-9a-fA-F]*$/.test(v)) return "Must be 0x-prefixed hex";
      const hexLen = v.slice(2).length;
      if (hexLen !== n * 2)
        return `Must be exactly ${n} bytes (${n * 2} hex chars after 0x)`;
      return null;
    }
    default:
      return null;
  }
}

/*
 * `isArgComplete` used to live here, walking the parameter tree a second time to
 * answer as a boolean what `argIssues` now answers with a reason. It moved to
 * `argIssues.ts`, where the walk is, and is still exported from there.
 */
