import { ponder } from "@/generated";

// IMPORTANT NOTE: The contract here must be the one with the lesser startBlock value from the config.ts file, in the moment is ENSToken,
// but if you add another contract with startBlock < 9380410n, be sure to replace here.
// ponder.on("ENSToken:setup", async ({ context }) => {
ponder.on("UNIToken:setup", async ({ context }) => {
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
