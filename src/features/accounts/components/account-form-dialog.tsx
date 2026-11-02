"use client";

import { useState } from "react";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useUpdateAccount } from "@/features/accounts/hooks/use-accounts";
import type { Role, UserAccount } from "@/features/accounts/types/accounts";
import { ApiError } from "@/lib/api-error";

const STATUS_ITEMS = { active: "Aktif", inactive: "Nonaktif" };

type AccountFormDialogProps = {
  account: UserAccount | null;
  roles: Role[];
  onOpenChange: (open: boolean) => void;
};

export function AccountFormDialog({ account, roles, onOpenChange }: AccountFormDialogProps) {
  return (
    <Dialog open={account !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        {account ? (
          // Keyed by account so the form state starts from the selected account each time.
          <AccountForm key={account.id} account={account} roles={roles} onDone={() => onOpenChange(false)} />
        ) : null}
      </DialogContent>
    </Dialog>
  );
}

type AccountFormProps = {
  account: UserAccount;
  roles: Role[];
  onDone: () => void;
};

function AccountForm({ account, roles, onDone }: AccountFormProps) {
  const updateAccount = useUpdateAccount();
  const [roleId, setRoleId] = useState(String(account.roleId));
  const [status, setStatus] = useState<"active" | "inactive">(account.isActive ? "active" : "inactive");

  const roleItems = Object.fromEntries(roles.map((role) => [String(role.id), role.name]));

  const save = () => {
    updateAccount.mutate(
      { id: account.id, update: { roleId: Number(roleId), isActive: status === "active" } },
      {
        onSuccess: () => {
          toast.success("Akun diperbarui.");
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal memperbarui akun."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Ubah Akun</DialogTitle>
        <DialogDescription>{account.email}</DialogDescription>
      </DialogHeader>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Peran</Label>
          <Select items={roleItems} value={roleId} onValueChange={(value) => value && setRoleId(value)}>
            <SelectTrigger className="w-full" aria-label="Peran">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {roles.map((role) => (
                <SelectItem key={role.id} value={String(role.id)}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Peran menentukan menu dan data yang dapat diakses.</p>
        </div>

        <div className="space-y-2">
          <Label>Status akun</Label>
          <Select
            items={STATUS_ITEMS}
            value={status}
            onValueChange={(value) => setStatus(value === "inactive" ? "inactive" : "active")}
          >
            <SelectTrigger className="w-full" aria-label="Status akun">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="inactive">Nonaktif</SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-muted-foreground">Akun nonaktif tidak dapat masuk ke aplikasi.</p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={updateAccount.isPending}>
          Batal
        </Button>
        <Button onClick={save} disabled={updateAccount.isPending}>
          {updateAccount.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </>
  );
}
