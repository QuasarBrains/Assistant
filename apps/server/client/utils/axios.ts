import axios, { AxiosError } from "axios";
import { setupCache } from "axios-cache-interceptor";
import { logout } from "./auth";

export const api = setupCache(
  axios.create({
    baseURL: "/api",
    withCredentials: true,
    headers: {
      Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
      "x-refresh-token": localStorage.getItem("refreshToken"),
    },
  }),
  {
    ttl: 2 * 1000,
    interpretHeader: false,
  }
);

api.interceptors.response.use(
  (response) => {
    if (response.headers["x-refreshed"]) {
      localStorage.setItem("accessToken", response.headers["x-access-token"]);
      localStorage.setItem("refreshToken", response.headers["x-refresh-token"]);
    }
    return response;
  },
  async (error: AxiosError) => {
    // Check for 401 Unauthorized error
    if (error.response?.status === 401) {
      logout("unauthorized");
    }
    // Pass the error along to the caller
    return Promise.reject(error);
  }
);
