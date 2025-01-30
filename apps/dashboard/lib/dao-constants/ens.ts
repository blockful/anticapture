import { DaoConstants } from "./types";

export const ENS: DaoConstants = {
    name: "Ethereum Name Service",
    contracts: {
        governor: "0x",
        token: "0x",
        timelock: "0x"
    },
    snapshot: "",
    rules: {
        delay: true,
        changeVote: false,
        timelock: false,
        cancelFunction: false
    }
}