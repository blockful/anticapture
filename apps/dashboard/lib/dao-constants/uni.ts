import { DaoConstants } from "./types";

export const UNI: DaoConstants = {
  name: "Uniswap",
  contracts: {
    governor: "0x408ED6354d4973f66138C91495F2f2FCbd8724C3",
    token: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984",
    timelock: "0x1a9C8182C09F50C8318d769245beA52c32BE35BC",
  },
  snapshot: "https://snapshot.box/#/s:uniswapgovernance.eth",
  rules: {
    delay: true,
    changeVote: true,
    timelock: true,
    cancelFunction: true,
  },
};
