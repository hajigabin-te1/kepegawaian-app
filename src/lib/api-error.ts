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

type PostgrestLikeError = {
  code?: string;
  message: string;
  details?: string | null;
  hint?: string | null;
};

const POSTGREST_MESSAGES: Record<string, string> = {
  "23505": "Data dengan nama tersebut sudah ada.",
  "23503": "Data masih dipakai oleh data lain sehingga tidak dapat diubah.",
  "23514": "Data tidak memenuhi aturan validasi.",
  "42501": "Anda tidak memiliki akses untuk tindakan ini.",
  // .single() after an update/insert that RLS filtered out returns no row.
  PGRST116: "Data tidak ditemukan atau Anda tidak memiliki akses.",
};

/** Normalizes a Supabase/PostgREST error into an ApiError with an Indonesian message. */
export function fromSupabaseError(error: PostgrestLikeError, overrides: Record<string, string> = {}): ApiError {
  const byHint = error.hint ? overrides[error.hint] : undefined;
  const byCode = error.code ? (overrides[error.code] ?? POSTGREST_MESSAGES[error.code]) : undefined;
  return new ApiError(byHint ?? byCode ?? DEFAULT_ERROR_MESSAGE, null, error);
}
