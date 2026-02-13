import { DaoIdEnum } from "@/shared/types/daos";

/**
 * Maps DaoIdEnum to logo filename in /logo/ or /opengraph-images/.
 * Uses logo/ when available; otherwise falls back to opengraph slug.
 */
export const DAO_LOGO_MAP: Record<DaoIdEnum, string> = {
  [DaoIdEnum.UNISWAP]: "/logo/UNI.png",
  [DaoIdEnum.ENS]: "/logo/ENS.png",
  [DaoIdEnum.GITCOIN]: "/opengraph-images/gtc.png",
  [DaoIdEnum.SCR]: "/opengraph-images/scr.png",
  [DaoIdEnum.NOUNS]: "/opengraph-images/nouns.png",
  [DaoIdEnum.OBOL]: "/logo/Obol.png",
  [DaoIdEnum.COMP]: "/opengraph-images/comp.png",
};
