"use client";

import { useState } from "react";
import { EyeIcon, EyeOffIcon, KeyRoundIcon, Loader2Icon, UserPlusIcon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TIME_ZONE } from "@/config/locale";
import { generateTemporaryPassword } from "@/features/accounts/schemas/account-schemas";
import { useCreateEmployeeAccount, useEmployeeAccount } from "@/features/employees/hooks/use-employees";
import { ApiError } from "@/lib/api-error";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIME_ZONE });

type EmployeeAccountCardProps = {
  employeeId: string;
  employeeEmail: string | null;
  canManage: boolean;
};

export function EmployeeAccountCard({ employeeId, employeeEmail, canManage }: EmployeeAccountCardProps) {
  const account = useEmployeeAccount(employeeId);
  const [creating, setCreating] = useState(false);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Akun login</CardTitle>
        <CardDescription>Akun yang dipakai pegawai untuk masuk ke aplikasi.</CardDescription>
      </CardHeader>
      <CardContent>
        {account.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : account.isError ? (
          <QueryErrorState error={account.error} onRetry={() => void account.refetch()} />
        ) : account.data ? (
          <dl className="grid gap-4 sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Email login</dt>
              <dd className="mt-1 font-medium">{account.data.email}</dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Status akun</dt>
              <dd className="mt-1">
                <ActiveStatusBadge isActive={account.data.isActive} />
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Login terakhir</dt>
              <dd className="mt-1 tabular-nums">
                {account.data.lastSignInAt ? dateTimeFormatter.format(new Date(account.data.lastSignInAt)) : "Belum pernah"}
              </dd>
            </div>
          </dl>
        ) : (
          <EmptyState
            icon={KeyRoundIcon}
            title="Belum punya akun login"
            description={employeeEmail ? `Akun akan memakai email ${employeeEmail}.` : "Isi email pegawai terlebih dahulu untuk membuat akun."}
            action={
              canManage && employeeEmail ? (
                <Button size="sm" onClick={() => setCreating(true)}>
                  <UserPlusIcon />
                  Buatkan Akun
                </Button>
              ) : undefined
            }
          />
        )}
      </CardContent>

      {employeeEmail ? (
        <Dialog open={creating} onOpenChange={setCreating}>
          <DialogContent>
            {creating ? (
              <CreateAccountForm employeeId={employeeId} email={employeeEmail} onDone={() => setCreating(false)} />
            ) : null}
          </DialogContent>
        </Dialog>
      ) : null}
    </Card>
  );
}

function CreateAccountForm({ employeeId, email, onDone }: { employeeId: string; email: string; onDone: () => void }) {
  const createAccount = useCreateEmployeeAccount();
  const [password, setPassword] = useState(generateTemporaryPassword);
  const [isVisible, setVisible] = useState(true);
  const isValid = password.length >= 8 && password.length <= 72;

  const submit = () => {
    createAccount.mutate(
      { employeeId, email, temporaryPassword: password },
      {
        onSuccess: () => {
          toast.success("Akun login dibuat.", { description: "Berikan email dan password sementara kepada pegawai secara langsung." });
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Akun gagal dibuat."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Buatkan akun login</DialogTitle>
        <DialogDescription>Akun berperan Pegawai untuk {email}.</DialogDescription>
      </DialogHeader>
      <div className="space-y-2">
        <Label htmlFor="employee-temporary-password">Password sementara</Label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Input
              id="employee-temporary-password"
              type={isVisible ? "text" : "password"}
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="pr-10 font-mono"
              aria-invalid={isValid ? undefined : true}
            />
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
              onClick={() => setVisible((visible) => !visible)}
              aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
            >
              {isVisible ? <EyeOffIcon /> : <EyeIcon />}
            </Button>
          </div>
          <Button type="button" variant="outline" onClick={() => setPassword(generateTemporaryPassword())}>
            <WandSparklesIcon />
            Buat
          </Button>
        </div>
        <p className={isValid ? "text-xs text-muted-foreground" : "text-sm text-destructive"}>
          {isValid ? "Catat password ini sebelum membuat akun." : "Password sementara 8–72 karakter."}
        </p>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={createAccount.isPending}>
          Batal
        </Button>
        <Button onClick={submit} disabled={!isValid || createAccount.isPending}>
          {createAccount.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Buat Akun
        </Button>
      </DialogFooter>
    </>
  );
}
