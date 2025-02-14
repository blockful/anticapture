export type TotalAssetsByDay = {
  totalAssets: string;
  date: string;
};

export type DuneResponse = {
  execution_id: string;
  query_id: number;
  is_execution_finished: boolean;
  state: string;
  submitted_at: string;
  expires_at: string;
  execution_started_at: string;
  execution_ended_at: string;
  result: {
    rows: TotalAssetsByDay[];
  };
  next_uri: string;
  next_offset: number;
};
