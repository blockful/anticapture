import { Address } from "viem";

export const openEtherscanAddress = (address: Address) => {
    window.open(
        `https://etherscan.io/address/${address}`,
        "_blank",
        "noopener,noreferrer",
    )
}