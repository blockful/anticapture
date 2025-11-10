import { ENS } from "@/shared/dao-config/ens";
import { OP } from "@/shared/dao-config/op";
import { UNI } from "@/shared/dao-config/uni";
import { GTC } from "@/shared/dao-config/gtc";
import { SCR } from "@/shared/dao-config/scr";
import { COMP } from "@/shared/dao-config/comp";
import { OBOL } from "@/shared/dao-config/obol";
import { NOUNS } from "@/shared/dao-config/nouns";
import { ZK } from "@/shared/dao-config/zk";

export default {
  UNI,
  ENS,
  OP,
  GTC,
  SCR,
  NOUNS,
  COMP,
  OBOL,
  ZK,
} as const;
