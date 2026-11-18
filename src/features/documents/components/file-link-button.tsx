"use client";

import { useState } from "react";
import { ExternalLinkIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getEmployeeFileUrl } from "@/features/documents/services/file-storage";
import { ApiError } from "@/lib/api-error";

type FileLinkButtonProps = {
  path: string;
  label?: string;
  /** Signed URL resolver; defaults to the employee documents bucket. */
  resolveUrl?: (path: string) => Promise<string>;
};

/** Opens a private file through a short-lived signed URL. */
export function FileLinkButton({ path, label = "Lihat file", resolveUrl = getEmployeeFileUrl }: FileLinkButtonProps) {
  const [opening, setOpening] = useState(false);

  const open = async () => {
    // Open the tab synchronously so pop-up blockers allow it, then point it at the signed URL.
    const tab = window.open("", "_blank");
    setOpening(true);
    try {
      const url = await resolveUrl(path);
      if (tab) tab.location.href = url;
      else window.location.assign(url);
    } catch (error) {
      tab?.close();
      toast.error(error instanceof ApiError ? error.message : "File tidak dapat dibuka.");
    } finally {
      setOpening(false);
    }
  };

  return (
    <Button variant="link" size="sm" className="h-auto px-0" onClick={() => void open()} disabled={opening}>
      {opening ? <Loader2Icon className="animate-spin" /> : <ExternalLinkIcon />}
      {label}
    </Button>
  );
}
