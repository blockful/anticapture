import { eq } from "ponder";
import { ponder } from "ponder:registry";
import { dao } from "ponder:schema";

ponder.get("/dao/:daoId", async (context) => {
  const [selectedDao] = await context.db
    .select()
    .from(dao)
    .where(eq(dao.id, context.req.param("daoId")));
  return context.json(selectedDao);
});

ponder.get("/dao", async (context) => {
  const daos = await context.db.select().from(dao);
  return context.json(daos);
});
