import axios from "axios";

const BACKEND_BASE_URL = import.meta.env.VITE_BACKEND_API_BASE_URL || "http://localhost:8080";

const backendApi = axios.create({
  baseURL: BACKEND_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export default backendApi;
