import dotenv from "dotenv";
import { AnvilInstance } from "./anvil";
dotenv.config();

const startAnvil = async () => {
  const anvilInstance = new AnvilInstance(
    process.env.PONDER_RPC_URL_1 as string,
    undefined,
    8545
  );
  await anvilInstance.startAnvil();
};

startAnvil();
