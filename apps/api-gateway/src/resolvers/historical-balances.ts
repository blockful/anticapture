export const historicalBalancesResolver = {
  selectionSet: /* GraphQL */ `
    {
      daoId
      addresses  
      blockNumber
    }
  `,
  resolve: async (root: any, args: any, context: any, info: any) => {
    const { daoId, addresses, blockNumber } = args;

    // Validate input
    if (!addresses || !Array.isArray(addresses) || addresses.length === 0) {
      throw new Error('addresses array is required and must not be empty');
    }

    if (!blockNumber || blockNumber <= 0) {
      throw new Error('blockNumber must be a positive integer');
    }

    if (!daoId) {
      throw new Error('daoId is required');
    }

    try {
      // Convert daoId to uppercase to match the pattern used by other resolvers
      const upperCaseDaoId = daoId.toUpperCase();
      
      // Convert addresses array to comma-separated string for query parameter
      const addressesParam = addresses.join(',');
      
      // Call the historical balances GET endpoint with query parameters
      const response = await fetch(`http://localhost:42069/historical-balances/${upperCaseDaoId}?addresses=${addressesParam}&blockNumber=${blockNumber}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching historical balances:', error);
      throw new Error(`Failed to fetch historical balances: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}; 