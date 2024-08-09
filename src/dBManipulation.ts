import fetch from 'node-fetch';

const query = `
  query {
     voteCasts {
      items {
      voter
      weight
    }
  }
  }
`;

async function fetchVoteCasts() {
  try {
    const response = await fetch('http://localhost:42069/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ query }),
    });

    const data: any = await response.json();
    console.log(data.data.voteCasts.items);

    // Identificar o voter com o maior weight
    const voteCasts = data.data.voteCasts.items;
    const maxVoter = voteCasts.reduce((max: { weight: number; }, voter: { weight: number; }) => voter.weight > max.weight ? voter : max, voteCasts[0]);

    console.log(`Voter com o maior weight: ${maxVoter.voter}, Weight: ${maxVoter.weight}`);
  } catch (error) {
    console.error('Error fetching vote casts:', error);
  }
}

void fetchVoteCasts();