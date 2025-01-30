import { Address } from "viem"

export type DaoConstants = {
    name: string,
    contracts: {
        timelock: Address,
        governor: Address,
        token: Address
    },
    snapshot: string,
    rules: {
        delay: boolean,
        changeVote: boolean,
        timelock: boolean,
        cancelFunction: boolean
    }
}