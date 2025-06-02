export const historicalVotingPowerResolver = {
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
    if (!addresses || typeof addresses !== 'string' || addresses.trim() === '') {
      throw new Error('addresses parameter is required and must be a non-empty string');
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
      
      // addresses is already a comma-separated string from the GraphQL schema
      const addressesParam = addresses.trim();
      
      // Call the historical voting power GET endpoint with query parameters
      const response = await fetch(`http://localhost:42069/historical-voting-power/${upperCaseDaoId}?addresses=${addressesParam}&blockNumber=${blockNumber}`, {
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
      return {
        ...data,
        __typename: 'historicalVotingPower_200_response'
      };
    } catch (error) {
      console.error('Error fetching historical voting power:', error);
      throw new Error(`Failed to fetch historical voting power: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
}; 