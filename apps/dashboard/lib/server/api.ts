import axios from "axios";
import { BACKEND_ENDPOINT } from "@/lib/server/utils";

const api = axios.create({
  baseURL: BACKEND_ENDPOINT,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export default api;
