import { z } from "@hono/zod-openapi";

type EnumLike = {
  [k: string]: string | number;
  [nu: number]: string;
};
export const caseInsensitiveEnum = <T extends EnumLike>(e: T) =>
  z.preprocess((val) => {
    const target = String(val)?.toLowerCase();
    for (const k of Object.values(e)) {
      if (String(k)?.toLowerCase() === target) {
        return k;
      }
    }

    return null;
  }, z.nativeEnum(e));
