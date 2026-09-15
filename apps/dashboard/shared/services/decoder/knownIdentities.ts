import { getAddress, isAddress, type Address } from "viem";

import { SUGGESTED_TRANSFER_TOKENS } from "@/shared/constants/suggestedTokens";
import daoConfigByDaoId from "@/shared/dao-config";
import { getKnownTokenMeta } from "@/shared/services/decoder/knownTokens";
import type { DaoIdEnum } from "@/shared/types/daos";

/**
 * What the platform already knows about an address without asking anyone:
 * the label a chip shows and the glyph that goes with it. Resolved offline so
 * a USDC transfer never renders behind a wallet identicon while the address
 * enrichment service is still answering.
 */
export type KnownIdentity = {
  /** Ticker for tokens ("USDC"), role for governance contracts ("ENS Governor"). */
  label: string;
  /** The address is an ERC-20 the platform curates or a DAO's own token. */
  isToken: boolean;
  /** DAO whose logo represents this address (its token, governor or timelock). */
  daoId?: DaoIdEnum;
  /** Token logo for curated ERC-20s that are not a DAO's own token. */
  logoUri?: string;
};

const TRUST_WALLET_ASSETS =
  "https://raw.githubusercontent.com/trustwallet/assets/master/blockchains/ethereum/assets";

let daoContracts: Map<string, KnownIdentity> | null = null;

const key = (chainId: number, address: string) =>
  `${chainId}:${address.toLowerCase()}`;

/** Every supported DAO's token, governor and timelock, keyed `chainId:address`. */
const getDaoContracts = (): Map<string, KnownIdentity> => {
  if (daoContracts) return daoContracts;
  daoContracts = new Map();
  for (const [id, config] of Object.entries(daoConfigByDaoId)) {
    const daoId = id as DaoIdEnum;
    const overview = config?.daoOverview;
    const chainId = overview?.chain?.id;
    if (!overview || chainId === undefined) continue;
    const { token, governor, timelock } = overview.contracts;
    const isErc20 = overview.token === "ERC20";
    // An ERC-20 is named by its ticker (the DAO id, or the entry's own label
    // where a DAO has several); an NFT collection by the DAO's display name,
    // since "LIL_NOUNS Token" is a key, not a name.
    const tokens = Array.isArray(token)
      ? token.map((entry) => ({
          address: entry.address,
          label: isErc20
            ? `${entry.label || daoId} Token`
            : `${config.name} Token`,
        }))
      : [
          {
            address: token,
            label: isErc20 ? `${daoId} Token` : `${config.name} Token`,
          },
        ];
    for (const entry of tokens) {
      daoContracts.set(key(chainId, entry.address), {
        label: entry.label,
        isToken: isErc20,
        daoId,
      });
    }
    if (governor) {
      daoContracts.set(key(chainId, governor), {
        label: `${config.name} Governor`,
        isToken: false,
        daoId,
      });
    }
    if (timelock) {
      daoContracts.set(key(chainId, timelock), {
        label: `${config.name} Timelock`,
        isToken: false,
        daoId,
      });
    }
  }
  return daoContracts;
};

let curatedLogos: Map<string, string> | null = null;

/** Logo URLs for the curated mainnet transfer tokens, keyed by lowercase address. */
const getCuratedLogo = (
  chainId: number,
  address: string,
): string | undefined => {
  if (chainId !== 1) return undefined;
  if (!curatedLogos) {
    curatedLogos = new Map();
    for (const tokens of Object.values(SUGGESTED_TRANSFER_TOKENS)) {
      for (const { address: tokenAddress, logoUri } of tokens) {
        curatedLogos.set(tokenAddress.toLowerCase(), logoUri);
      }
    }
  }
  return (
    curatedLogos.get(address.toLowerCase()) ??
    // Same asset library the curated list points at; the image falls back to
    // a neutral coin glyph when the library has no entry for the address.
    (isAddress(address)
      ? `${TRUST_WALLET_ASSETS}/${getAddress(address)}/logo.png`
      : undefined)
  );
};

/**
 * The identity of an address the platform can name on its own, or undefined
 * when only the enrichment service (ENS, labels) could. DAO contracts win
 * over the token list, so a DAO's own token carries the DAO's logo.
 */
export const resolveKnownIdentity = (
  chainId: number,
  address: Address | string,
): KnownIdentity | undefined => {
  const dao = getDaoContracts().get(key(chainId, address));
  if (dao) return dao;
  const token = getKnownTokenMeta(chainId, address);
  if (!token) return undefined;
  return {
    label: token.symbol,
    isToken: true,
    logoUri: getCuratedLogo(chainId, address),
  };
};
