export interface PaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
  totalPages: number;
  totalCount: number;
  itemsPerPage: number;
  currentItemsCount: number;
}

export interface SimplePaginationInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  currentPage: number;
}

export interface AmountFilterVariables {
  fromValue?: string | null;
  toValue?: string | null;
}

export interface LoadingState {
  loading: boolean;
  fetchingMore: boolean;
}
