"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export type DecisionSubmit = { note: string; decree: string };

type DecisionDialogProps = {
  open: boolean;
  /** true = approving; false = rejecting (a reason becomes mandatory). */
  approve: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  /** Asks for an optional decree (SK) number, used when approving. */
  askDecree?: boolean;
  pending: boolean;
  onSubmit: (values: DecisionSubmit) => void;
  onClose: () => void;
};

function DecisionForm({ approve, title, description, confirmLabel, askDecree = false, pending, onSubmit, onClose }: Omit<DecisionDialogProps, "open">) {
  const [note, setNote] = useState("");
  const [decree, setDecree] = useState("");
  const [error, setError] = useState<string | null>(null);

  const submit = () => {
    if (!approve && note.trim() === "") {
      setError("Alasan penolakan wajib diisi.");
      return;
    }
    onSubmit({ note: note.trim(), decree: decree.trim() });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {approve && askDecree ? (
          <div className="space-y-2">
            <Label htmlFor="decision-decree">Nomor SK (opsional)</Label>
            <Input id="decision-decree" value={decree} onChange={(event) => setDecree(event.target.value)} />
          </div>
        ) : null}
        <div className="space-y-2">
          <Label htmlFor="decision-reason">{approve ? "Catatan (opsional)" : "Alasan penolakan"}</Label>
          <Input id="decision-reason" value={note} onChange={(event) => setNote(event.target.value)} aria-invalid={error ? true : undefined} />
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onClose} disabled={pending}>
          Batal
        </Button>
        <Button variant={approve ? "default" : "destructive"} onClick={submit} disabled={pending}>
          {pending ? <Loader2Icon className="animate-spin" /> : null}
          {confirmLabel}
        </Button>
      </DialogFooter>
    </>
  );
}

/** Approve/reject dialog shared by the HR approval screens. Rejecting requires a reason. */
export function DecisionDialog({ open, ...form }: DecisionDialogProps) {
  return (
    <Dialog open={open} onOpenChange={(next) => !next && !form.pending && form.onClose()}>
      {/* The form mounts fresh on every open, so its fields start empty without an effect. */}
      <DialogContent>{open ? <DecisionForm {...form} /> : null}</DialogContent>
    </Dialog>
  );
}
