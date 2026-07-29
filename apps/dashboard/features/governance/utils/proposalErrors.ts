type ProposalFetchError = Error & {
  status?: number;
  response?: {
    status?: number;
  };
};

export const isProposalNotFoundError = (error: Error | null): boolean => {
  if (!error) return false;

  const fetchError: ProposalFetchError = error;
  return fetchError.status === 404 || fetchError.response?.status === 404;
};
