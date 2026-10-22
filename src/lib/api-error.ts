import { isAxiosError } from "axios";

/**
 * Normalized error shape for every failed API call.
 * The backend error body format is not confirmed yet (see docs/api-contract.md),
 * so `message` falls back to a generic Indonesian message.
 */
export class ApiError extends Error {
  readonly status: number | null;
  readonly data: unknown;

  constructor(message: string, status: number | null, data: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.data = data;
  }
}

const DEFAULT_ERROR_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";
const NETWORK_ERROR_MESSAGE = "Tidak dapat terhubung ke server. Periksa koneksi Anda.";

function readMessage(data: unknown): string | null {
  if (typeof data === "object" && data !== null && "message" in data) {
    const { message } = data as { message: unknown };
    if (typeof message === "string" && message.trim() !== "") return message;
  }
  return null;
}

export function toApiError(error: unknown): ApiError {
  if (error instanceof ApiError) return error;

  if (isAxiosError(error)) {
    if (!error.response) {
      return new ApiError(NETWORK_ERROR_MESSAGE, null, null);
    }
    const { status, data } = error.response;
    return new ApiError(readMessage(data) ?? DEFAULT_ERROR_MESSAGE, status, data);
  }

  return new ApiError(DEFAULT_ERROR_MESSAGE, null, null);
}
