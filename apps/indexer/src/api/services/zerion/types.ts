export interface ZerionWalletPositionsResponse {
  data: ZerionWalletPositions[];
}

export interface ZerionWalletPositions {
  type: string;
  id: string;
  attributes: {
    name: string;
    position_type: string;
    quantity: {
      int: string;
      decimals: number;
      float: number;
      numeric: string;
    };
    value: number;
    price: number;
    changes: {
      absolute_1d: number;
      percent_1d: number;
    };
    fungible_info: {
      name: string;
      symbol: string;
      icon: {
        url: string;
      };
      flags: {
        verified: boolean;
      };
    };
    flags: {
      displayable: boolean;
      is_trash: boolean;
    };
    updated_at: string;
    updated_at_block: number;
  };
}

export interface ZerionDaoLiquidTreasury {
  totalUSD: number;
  governanceUSD: number;
  liquidUSD: number;
  timestamp: string;
}
