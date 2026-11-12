"use client";

import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useDeleteAccount } from "@/features/accounts/hooks/use-accounts";
import type { UserAccount } from "@/features/accounts/types/accounts";
import { ApiError } from "@/lib/api-error";

type DeleteAccountDialogProps = {
  account: UserAccount | null;
  onOpenChange: (open: boolean) => void;
};

export function DeleteAccountDialog({ account, onOpenChange }: DeleteAccountDialogProps) {
  const deleteAccount = useDeleteAccount();

  const confirm = () => {
    if (!account) return;
    deleteAccount.mutate(account.id, {
      onSuccess: () => {
        toast.success("Akun dihapus.");
        onOpenChange(false);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Akun gagal dihapus."),
    });
  };

  return (
    <Dialog open={account !== null} onOpenChange={(open) => !deleteAccount.isPending && onOpenChange(open)}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Hapus akun?</DialogTitle>
          <DialogDescription>
            Akun <span className="font-medium text-foreground">{account?.email}</span> tidak akan bisa masuk lagi. Data pegawai tetap
            tersimpan. Jika hanya ingin menutup akses sementara, nonaktifkan akun saja.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={deleteAccount.isPending}>
            Batal
          </Button>
          <Button variant="destructive" onClick={confirm} disabled={deleteAccount.isPending}>
            {deleteAccount.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Hapus akun
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
