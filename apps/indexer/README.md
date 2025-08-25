# Gov Indexer

## Description

Gov Indexer is a project developed with Ponder that indexes smart contract events on the Ethereum blockchain. The main focus is on indexing events related to ENS (Ethereum Name Service) and proposal governance.

## Prerequisites

- Node.js (>= 18.14)
- NPM or Yarn
- Access to an Ethereum node (Infura or Alchemy)

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/your-username/gov-indexer.git
   cd gov-indexer
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables:
   Create a `.env` file in the project root and add the following variables:
   ```env
   PONDER_RPC_URL_1=https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   PONDER_RPC_URL_2=https://eth-mainnet.g.alchemy.com/v2/YOUR_API_KEY
   START_BLOCK=0  # Optional: initial block for indexing
   ```
4. Run the server:
   ```bash
   npm start
   ```
   After indexing, the API server will be available at `http://localhost:42069`.

## Accessing the API

You can access the GraphQL API at `http://localhost:42069/graphql` to query the indexed data.

## Project Structure

- `src/`: Contains the indexer source code.
- `ponder.config.ts`: Ponder configurations.
- `ponder.schema.ts`: Schema definitions for the database.
- `.env`: Environment variables.

## Database Structure

Gov Indexer creates the following tables in the database to store the indexed data:

### 1. **Account**

- **Description**: Stores information about accounts that interact with ENSToken and ENSGovernor contracts.
- **Fields**:
  - `id`: Unique identifier of the account (string).
  - `votingPower`: Voting power of the account (bigint, optional).
  - `balance`: Account balance (bigint, optional).
  - `votesCount`: Count of votes made by the account (int, optional).
  - `proposalCount`: Count of proposals created by the account (int, optional).
  - `delegationsCount`: Count of delegations made by the account (int, optional).

### 2. **Delegations**

- **Description**: Records vote delegations between accounts.
- **Fields**:
  - `id`: Unique identifier of the delegation (string).
  - `delegate`: Account receiving the delegation (string).
  - `delegator`: Account making the delegation (string).
  - `timestamp`: Date and time when the delegation was made (bigint).

### 3. **Transfers**

- **Description**: Stores information about token transfers between accounts.
- **Fields**:
  - `id`: Unique identifier of the transfer (string).
  - `amount`: Amount of tokens transferred (bigint).
  - `from`: Source account of the transfer (string).
  - `to`: Destination account of the transfer (string).
  - `timestamp`: Date and time when the transfer occurred (bigint).

### 4. **VotesOnchain**

- **Description**: Records votes made on proposals on the blockchain.
- **Fields**:
  - `id`: Unique identifier of the vote (string).
  - `voter`: Account that voted (string).
  - `proposalId`: Identifier of the proposal voted on (string).
  - `support`: Indicates whether the vote is for or against (string).
  - `weight`: Weight of the vote (string).
  - `reason`: Reason for the vote (string, optional).
  - `timestamp`: Date and time when the vote was recorded (bigint).

### 5. **ProposalsOnchain**

- **Description**: Stores information about proposals on the blockchain.
- **Fields**:
  - `id`: Unique identifier of the proposal (string).
  - `proposer`: Account that created the proposal (string).
  - `targets`: Proposal targets (json).
  - `values`: Values associated with the proposal (json).
  - `signatures`: Proposal signatures (json).
  - `calldatas`: Proposal call data (json).
  - `startBlock`: Starting block of the proposal (string).
  - `endBlock`: Ending block of the proposal (string).
  - `description`: Description of the proposal (string).
  - `timestamp`: Date and time when the proposal was created (bigint).
  - `status`: Current status of the proposal (string).
