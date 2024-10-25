import { ponder } from "@/generated";

ponder.on("ENSToken:setup", async ({ context }) => {
  const { DAO } = context.db;
  await DAO.create({
    id: "ENS",
  });
  await DAO.create({
    id: "SHU",
  });
  await DAO.create({
    id: "UNI",
  });
  await DAO.create({
    id: "COMP",
  });
});
