import { RefreshCwIcon, TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { ApiError } from "@/lib/api-error";

type QueryErrorStateProps = {
  error: unknown;
  onRetry: () => void;
};

/** Error state for a failed query, with a retry action. */
export function QueryErrorState({ error, onRetry }: QueryErrorStateProps) {
  return (
    <EmptyState
      icon={TriangleAlertIcon}
      title="Data gagal dimuat"
      description={error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi."}
      action={
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCwIcon />
          Coba lagi
        </Button>
      }
    />
  );
}
