import { eq } from "ponder";
import { dao } from "ponder:schema";
import app from "..";
import { db } from "ponder:api";

app.get("/dao/:daoId", async (context) => {
  const [selectedDao] = await db
    .select()
    .from(dao)
    .where(eq(dao.id, context.req.param("daoId")));
  return context.json(selectedDao);
});

app.get("/dao", async (context) => {
  const daos = await db.select().from(dao);
  return context.json(daos);
});
