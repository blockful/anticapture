import { COMP } from "@/shared/dao-config/comp";
import { ENS } from "@/shared/dao-config/ens";
import { FLUID } from "@/shared/dao-config/fluid";
import { GTC } from "@/shared/dao-config/gtc";
import { LIL_NOUNS } from "@/shared/dao-config/lil-nouns";
import { NOUNS } from "@/shared/dao-config/nouns";
import { OBOL } from "@/shared/dao-config/obol";
import { OP } from "@/shared/dao-config/op";
import { SCR } from "@/shared/dao-config/scr";
import { SHU } from "@/shared/dao-config/shu";
import { UNI } from "@/shared/dao-config/uni";
import { AAVE } from "@/shared/dao-config/aave";
import { GNO } from "@/shared/dao-config/gno";

export default {
  AAVE,
  GNO,
  UNI,
  ENS,
  FLUID,
  LIL_NOUNS,
  OP,
  GTC,
  SCR,
  NOUNS,
  COMP,
  OBOL,
  SHU,
} as const;
