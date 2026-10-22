import axios from "axios";

import { env } from "@/config/env";
import { routes } from "@/config/routes";
import { toApiError } from "@/lib/api-error";
import { useAuthStore } from "@/stores/auth-store";

export const apiClient = axios.create({
  baseURL: env.apiBaseUrl,
  timeout: env.apiTimeoutMs,
  headers: {
    Accept: "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    // Bearer scheme is an assumption until confirmed (see docs/api-contract.md).
    config.headers.set("Authorization", `Bearer ${token}`);
  }
  return config;
});

apiClient.interceptors.response.use(
  (response) => response,
  (error: unknown) => {
    const apiError = toApiError(error);

    if (apiError.status === 401 && typeof window !== "undefined") {
      useAuthStore.getState().clearSession();
      if (window.location.pathname !== routes.login) {
        window.location.assign(routes.login);
      }
    }

    return Promise.reject(apiError);
  },
);
