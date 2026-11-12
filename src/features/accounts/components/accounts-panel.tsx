"use client";

import { useState } from "react";
import { BarChart3Icon, PencilIcon, PlusIcon, Trash2Icon, UserCogIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { ActiveStatusBadge } from "@/components/common/status-badge";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { APP_TIME_ZONE } from "@/config/locale";
import { routes } from "@/config/routes";
import { AccountFormDialog } from "@/features/accounts/components/account-form-dialog";
import { ReportScopeDialog } from "@/features/accounts/components/report-scope-dialog";
import { DeleteAccountDialog } from "@/features/accounts/components/delete-account-dialog";
import { CreateAccountDialog } from "@/features/accounts/components/create-account-dialog";
import { useAccounts, useRoles } from "@/features/accounts/hooks/use-accounts";
import { LEADER_ROLE_CODES, type UserAccount } from "@/features/accounts/types/accounts";

const dateTimeFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  timeZone: APP_TIME_ZONE,
});

type AccountsPanelProps = {
  currentUserId: string;
};

export function AccountsPanel({ currentUserId }: AccountsPanelProps) {
  const accounts = useAccounts();
  const roles = useRoles();
  const [editing, setEditing] = useState<UserAccount | null>(null);
  const [creating, setCreating] = useState(false);
  const [deleting, setDeleting] = useState<UserAccount | null>(null);
  const [scoping, setScoping] = useState<UserAccount | null>(null);

  const rows = accounts.data ?? [];

  return (
    <>
      <PageHeader
        title="Akun Pengguna"
        description="Buat akun, lalu atur peran dan status akun yang dapat masuk ke aplikasi."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Administrasi" }, { label: "Akun Pengguna" }]}
        actions={
          <Button onClick={() => setCreating(true)} disabled={roles.isPending || roles.isError}>
            <PlusIcon />
            Tambah Akun
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        {accounts.isPending ? (
          <TableSkeleton />
        ) : accounts.isError ? (
          <QueryErrorState error={accounts.error} onRetry={() => void accounts.refetch()} />
        ) : rows.length === 0 ? (
          <EmptyState icon={UserCogIcon} title="Belum ada akun" description="Akun yang terdaftar akan muncul di sini." />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-secondary hover:bg-secondary">
                <TableHead className="pl-6">Email</TableHead>
                <TableHead className="hidden lg:table-cell">Pegawai</TableHead>
                <TableHead>Peran</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Login terakhir</TableHead>
                <TableHead className="w-32 pr-6">
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((account) => {
                const isSelf = account.id === currentUserId;
                return (
                  <TableRow key={account.id} className="hover:bg-accent/15">
                    <TableCell className="pl-6">
                      <span className="font-medium">{account.email}</span>
                      {isSelf ? (
                        <Badge variant="accent" className="ml-2">
                          Akun Anda
                        </Badge>
                      ) : null}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{account.employeeName ?? "—"}</TableCell>
                    <TableCell>{account.roleName}</TableCell>
                    <TableCell>
                      <ActiveStatusBadge isActive={account.isActive} />
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {account.lastSignInAt ? dateTimeFormatter.format(new Date(account.lastSignInAt)) : "Belum pernah"}
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      {(LEADER_ROLE_CODES as readonly string[]).includes(account.roleCode) ? (
                        <Button variant="ghost" size="icon-sm" onClick={() => setScoping(account)} aria-label={`Atur cakupan statistik ${account.email}`} title="Cakupan statistik">
                          <BarChart3Icon />
                        </Button>
                      ) : null}
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setEditing(account)}
                        disabled={isSelf || roles.isPending || roles.isError}
                        aria-label={`Ubah akun ${account.email}`}
                        title={isSelf ? "Akun Anda sendiri tidak dapat diubah di sini" : undefined}
                      >
                        <PencilIcon />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setDeleting(account)}
                        disabled={isSelf}
                        aria-label={`Hapus akun ${account.email}`}
                        title={isSelf ? "Akun Anda sendiri tidak dapat dihapus" : undefined}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2Icon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Card>

      <CreateAccountDialog open={creating} onOpenChange={setCreating} roles={roles.data ?? []} />

      <ReportScopeDialog account={scoping} onOpenChange={(open) => !open && setScoping(null)} />

      <DeleteAccountDialog account={deleting} onOpenChange={(open) => !open && setDeleting(null)} />

      <AccountFormDialog
        account={editing}
        roles={roles.data ?? []}
        onOpenChange={(open) => {
          if (!open) setEditing(null);
        }}
      />
    </>
  );
}
