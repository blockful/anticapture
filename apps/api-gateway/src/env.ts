import dotenv from "dotenv";

dotenv.config();

// Filter only gateway URLs
export const gatewayUrls = Object.entries(process.env).reduce((acc, [key, value]) => {
  if (key.startsWith("RPC_URL_")) {
    const chain = key.replace("RPC_URL_", "").toLowerCase();
    if (typeof value === "string") {
      acc[chain] = value;
    }
  }
  return acc;
}, {} as Record<string, string>);
