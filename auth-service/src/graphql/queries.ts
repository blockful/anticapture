export const GET_DAO_QUERY = `
  query GetDAO($id: String!) {
    dao(id: $id) {
      id
      # Add other DAO fields you need
    }
  }
`;

export const GET_ACCOUNT_QUERY = `
  query GetAccount($id: String!) {
    account(id: $id) {
      id
    }
  }
`;
