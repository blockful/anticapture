/**
 * Reads DAO_API_* environment variables and returns a map of daoId → baseUrl.
 *
 * Example:
 *   DAO_API_ENS=http://ens.railway.internal:42069
 *   DAO_API_UNI=http://uni.railway.internal:42069
 *
 * Returns: Map { "ens" => "http://...", "uni" => "http://..." }
 */
export function getRegisteredDaos(): Map<string, string> {
  const daos = new Map<string, string>();

  for (const [key, value] of Object.entries(process.env)) {
    if (key.startsWith("DAO_API_") && value) {
      const daoId = key.replace("DAO_API_", "").toLowerCase();
      daos.set(daoId, value.replace(/\/$/, "")); // strip trailing slash
    }
  }

  return daos;
}
