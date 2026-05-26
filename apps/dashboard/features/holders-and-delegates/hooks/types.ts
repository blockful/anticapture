export interface AmountFilterVariables {
  fromValue?: string | null;
  toValue?: string | null;
}

export interface LoadingState {
  loading: boolean;
  fetchingMore: boolean;
}
