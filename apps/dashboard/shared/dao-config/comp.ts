import { DaoConfiguration } from "@/shared/dao-config/types";
import { RiskLevel, GovernanceImplementationEnum } from "@/shared/types/enums";
import { GOVERNANCE_IMPLEMENTATION_CONSTANTS } from "@/shared/constants/governance-implementations";
import { CompoundIcon } from "@/shared/components/icons";
import { mainnet } from "viem/chains";
import { QUORUM_CALCULATION_TYPES } from "../constants/labels";

export const COMP: DaoConfiguration = {
  name: "Compound",
  // supportStage: SupportStageEnum.FULL,
  icon: CompoundIcon,
  daoOverview: {
    token: "ERC20",
    chain: mainnet,
    blockTime: 12,
    snapshot: "https://snapshot.box/#/s:comp-vote.eth/proposals",
    contracts: {
      governor: "0x309a862bbC1A00e45506cB8A802D1ff10004c8C0",
      token: "0xc00e94Cb662C3520282E6f5717214004A7f26888",
      timelock: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
    },
    cancelFunction: "true", // TODO: verify
    rules: {
      delay: true,
      changeVote: false,
      timelock: true,
      cancelFunction: true,
      logic: "For + Abstain",
      quorumCalculation: QUORUM_CALCULATION_TYPES.COMPOUND,
      proposalThreshold: "25K $COMP",
    },
  },
  attackProfitability: {
    riskLevel: RiskLevel.HIGH,
    supportsLiquidTreasuryCall: true,
    attackCostBarChart: {
      // 41 addresses -> You can check all the addresses in this dashboard: https://encurtador.com.br/kDHn
      Timelock: "0x6d903f6003cca6255D85CcA4D3B5E5146dC33925",
      Comptroller: "0x3d9819210A31b4961b30EF54bE2aeD79B9c9Cd3B",
      /// v2 markets
      v2WBTC: "0xccF4429DB6322D5C611ee964527D42E5d685DD6a",
      v2USDC: "0x39AA39c021dfbaE8faC545936693aC917d5E7563",
      v2DAI: "0x5d3a536E4D6DbD6114cc1Ead35777bAB948E3643",
      v2USDT: "0xf650C3d88D12dB855b8bf7D11Be6C55A4e07dCC9",
      v2ETH: "0x4Ddc2D193948926D02f9B1fE9e1daa0718270ED5",
      v2UNI: "0x35A18000230DA775CAc24873d00Ff85BccdeD550",
      v2BAT: "0x6C8c6b02E7b2BE14d4fA6022Dfd6d75921D90E4E",
      v2LINK: "0xFAce851a4921ce59e912d19329929CE6da6EB0c7",
      v2TUSD: "0x12392F67bdf24faE0AF363c24aC620a2f67DAd86",
      v2AAVE: "0xe65cdB6479BaC1e22340E4E755fAE7E509EcD06c",
      v2COMP: "0x70e36f6BF80a52b3B46b3aF8e106CC0ed743E8e4",
      ///v3 markets
      //Ethereum markets
      mainnetETH: "0xA17581A9E3356d9A858b789D68B4d866e593aE94",
      mainnetstETH: "0x3D0bb1ccaB520A66e607822fC55BC921738fAFE3",
      mainnetUSDT: "0x3Afdc9BCA9213A35503b077a6072F3D0d5AB0840",
      mainnetUSDS: "0x5D409e56D886231aDAf00c8775665AD0f9897b56",
      mainnetUSDC: "0xc3d688B66703497DAA19211EEdff47f25384cdc3",
      mainnetWBTC: "0xe85Dc543813B8c2CFEaAc371517b925a166a9293",
      // Optimism markets
      opETH: "0xE36A30D249f7761327fd973001A32010b521b6Fd",
      opUSDT: "0x995E394b8B2437aC8Ce61Ee0bC610D617962B214",
      opUSDC: "0x2e44e174f7D53F0212823acC11C01A11d58c5bCB",
      // Unichain markets
      uniUSDC: "0x2c7118c4C88B9841FCF839074c26Ae8f035f2921",
      uniETH: "0x6C987dDE50dB1dcDd32Cd4175778C2a291978E2a",
      // Polygon markets
      polyUSDT0: "0xaeB318360f27748Acb200CE616E389A6C9409a07",
      polyUSDC: "0xF25212E676D1F7F89Cd72fFEe66158f541246445",
      // Ronin markets
      ronWETH: "0x4006ed4097ee51c09a04c3b0951d28ccf19e6dfe",
      ronRON: "0xc0Afdbd1cEB621Ef576BA969ce9D4ceF78Dbc0c0",
      // Mantle markets
      manUSDe: "0x606174f62cd968d8e684c645080fa694c1D7786E",
      // Base markets
      manUSDbC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
      manUSDC: "0xb125E6687d4313864e53df431d5425969c15Eb2F",
      manAERO: "0x784efeB622244d2348d4F2522f8860B96fbEcE89",
      manUSDS: "0x2c776041CCFe903071AF44aa147368a9c8EEA518",
      manETH: "0x46e6b214b524310239732D51387075E0e70970bf",
      // Arbitrum markets
      arbUSDT0: "0xd98Be00b5D27fc98112BdE293e487f8D4cA57d07",
      arbUSDC: "0x9c4ec768c28520B50860ea7a15bd7213a9fF58bf",
      "arbUSDC.e": "0xA5EDBDD9646f8dFF606d7448e414884C7d905dCA",
      arbETH: "0x6f7D514bbD4aFf3BcD1140B7344b32f063dEe486",
      // Linea markets
      linUSDC: "0x8D38A3d6B3c3B7d96D6536DA7Eef94A9d7dbC991",
      linETH: "0x60F2058379716A64a7A5d29219397e79bC552194",
      // Scroll markets
      scrUSDC: "0xB2f97c1Bd3bf02f5e74d13f02E3e26F93D77CE44",
    },
  },
  governanceImplementation: {
    // Fields are sorted alphabetically by GovernanceImplementationEnum for readability
    fields: {
      [GovernanceImplementationEnum.AUDITED_CONTRACTS]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.AUDITED_CONTRACTS
          ].description,
        riskExplanation: "Compound contracts are audited.", //Link: https://www.openzeppelin.com/news/compound-governor-bravo-audit
      },
      [GovernanceImplementationEnum.INTERFACE_HIJACK]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.INTERFACE_HIJACK
          ].description,
        requirements: [
          "Without the proper protections(DNSSEC/SPF/DKIM/DMARC), attackers can spoof governance UIs by hijacking unprotected domains.", // https://internet.nl/site/www.tally.xyz/3493806/
        ],
        riskExplanation:
          "The domain is not signed with a valid signature (DNSSEC) and it is not possible to establish a secure connection to it (HTTPS).",
      },
      [GovernanceImplementationEnum.ATTACK_PROFITABILITY]: {
        value: "U$2.72B", // TODO: verify
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.ATTACK_PROFITABILITY
          ].description,
        requirements: [
          "An attack on Compound doesn’t just put its treasury at risk — it also endangers users’ funds. The Governor can authorize a malicious address to move money across all its markets, whether in v2 or v3.",
          "To reduce the profitability of an attack, Compound needs to remove that permission from the Governor.",
        ],
        riskExplanation:
          "If Compound gets captured, the entire TVL of the protocol could be stolen — including users’ funds.",
      },
      [GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },

      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD]: {
        value: "25K $COMP",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD
          ].description,
        requirements: [
          "The proposal threshold should be increased based on the amount of $COMP market supply.",
        ],
        riskExplanation:
          "The proposal threshold is 0,9% of the market supply, which is considered medium risk.",
      },
      [GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL]: {
        value: "Yes",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.PROPOSAL_THRESHOLD_CANCEL
          ].description,
        riskExplanation:
          "If the proposer maintains governance power above the Proposal Threshold during the Voting Period, the proposal will be canceled",
      },
      [GovernanceImplementationEnum.SECURITY_COUNCIL]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SECURITY_COUNCIL
          ].description,
        requirements: [
          "The Compound Security Council needs to raise the threshold to 75% for approvals on their multisig to be considered Low Risk.",
        ],
        riskExplanation:
          "Compound has the Proposal Guardian, a multisig responsible for canceling malicious proposals.",
      },
      [GovernanceImplementationEnum.SPAM_RESISTANCE]: {
        value: "No",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.SPAM_RESISTANCE
          ].description,
        requirements: [
          "Compound has no limit on active proposals or proposals submitted per address.",
        ],
        riskExplanation: "Compound governance is vulnerable to spam.",
      },
      [GovernanceImplementationEnum.TIMELOCK_ADMIN]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_ADMIN
          ].description,
        riskExplanation: "Governor has Admin role on timelock.",
      },
      [GovernanceImplementationEnum.TIMELOCK_DELAY]: {
        value: "2 days",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.TIMELOCK_DELAY
          ].description,
        riskExplanation: "2 days is a sufficient delay for Timelock.",
      },
      [GovernanceImplementationEnum.VETO_STRATEGY]: {
        value: "Yes",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VETO_STRATEGY
          ].description,
        requirements: [
          "Veto strategy should be fully controlled by the DAO in order to have a low risk level.",
        ],
        riskExplanation:
          "There is a veto strategy controlled by the Security Council multisig.",
      },
      [GovernanceImplementationEnum.VOTE_MUTABILITY]: {
        value: "No",
        riskLevel: RiskLevel.MEDIUM,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTE_MUTABILITY
          ].description,
        requirements: [
          "It is necessary to allow voters to change their votes until the end of the proposal to prevent them from being misled in an attack on Compound's governance DNS.",
        ],
        riskExplanation:
          "The lack of vote mutability jeopardizes DAO decisions if its main voting interface is attacked.",
      },
      [GovernanceImplementationEnum.VOTING_DELAY]: {
        value: "1 day and 19 hours",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_DELAY
          ].description,
        requirements: [
          "The Voting Delay needs to be more than 2 days for be considered as Medium Risk.",
        ],
        riskExplanation:
          "With the current Voting Delay, Compound has little time left to gather votes to protect its governance, in case of an attack.",
      },
      [GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_FLASHLOAN_PROTECTION
          ].description,
        riskExplanation:
          "Voting power are based on block previous to when voters could first cast a vote, making flashloan votes impossible.",
      },
      [GovernanceImplementationEnum.VOTING_PERIOD]: {
        value: "2 days and 17 hours",
        riskLevel: RiskLevel.HIGH,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_PERIOD
          ].description,
        requirements: [
          "The Voting Period must have, at least, 3 days to be classified as Medium Risk.",
        ],
        riskExplanation:
          "Compound has a short timeframe to prepare itself in case of a governance attack.",
      },
      [GovernanceImplementationEnum.VOTING_SUBSIDY]: {
        value: "Yes",
        riskLevel: RiskLevel.LOW,
        description:
          GOVERNANCE_IMPLEMENTATION_CONSTANTS[
            GovernanceImplementationEnum.VOTING_SUBSIDY
          ].description,
        riskExplanation:
          "The voting subsidy exists in the Governor code, and is already implemented to voters.", // https://app.compound.finance/extensions/comp_vote
      },
    },
  },
  resilienceStages: true,
  tokenDistribution: true,
  riskAnalysis: true,
  dataTables: true,
};
