"use client";

import { useState } from "react";
import { Loader2Icon, PaperclipIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getAttachmentUrl } from "@/features/leave/services/leave-service";
import { ApiError } from "@/lib/api-error";

export { RequestStatusBadge as LeaveStatusBadge } from "@/features/profile-requests/components/request-parts";

const dateFormatter = new Intl.DateTimeFormat("id-ID", { timeZone: "UTC", day: "numeric", month: "short", year: "numeric" });
const formatDate = (iso: string) => dateFormatter.format(new Date(`${iso}T00:00:00Z`));

export function formatRange(start: string, end: string): string {
  return start === end ? formatDate(start) : `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDays(days: number): string {
  return `${new Intl.NumberFormat("id-ID").format(days)} hari`;
}

/** Opens a private attachment through a short-lived link. */
export function AttachmentButton({ path }: { path: string }) {
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true);
    try {
      window.open(await getAttachmentUrl(path), "_blank", "noopener,noreferrer");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Lampiran tidak dapat dibuka.");
    } finally {
      setLoading(false);
    }
  };
  return (
    <Button variant="outline" size="sm" onClick={() => void open()} disabled={loading}>
      {loading ? <Loader2Icon className="animate-spin" /> : <PaperclipIcon />}
      Lampiran
    </Button>
  );
}
