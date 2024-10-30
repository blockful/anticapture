import axios from "axios";

type PonderStatusResponse = {
  anvil: {
    block: {
      number: number;
      timestamp: number;
    };
    ready: boolean;
  };
};

export const ponderHttpClient = (url: string) => {
  const isReady = async () => {
    try {
      const { data } = await axios.get<PonderStatusResponse>(
        [url, "/status"].join("")
      );
      if (data.anvil.block.number > 4 && data.anvil.ready === true) {
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };
  return { isReady };
};
