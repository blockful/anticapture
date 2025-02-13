import { ponder } from "ponder:registry";
import { DuneService } from "./service";
import { DaoIdEnum } from "@/lib/enums";

ponder.get("/dao/:daoId/total-assets", async (context) => {
  const daoId = context.req.param("daoId") as DaoIdEnum;
  if (![DaoIdEnum.ENS].includes(daoId)) {
    return context.json({ error: "Not supported for this DAO" }, 400);
  }
  if (!process.env.DUNE_API_URL || !process.env.DUNE_API_KEY) {
    throw new Error("no DUNE_URL or DUNE_API_KEY set as environment variable");
  }
  const service = new DuneService(
    daoId,
    process.env.DUNE_API_URL,
    process.env.DUNE_API_KEY,
  );
  const data = await service.getTotalAssets();
  return context.json<typeof data>(data);
});
