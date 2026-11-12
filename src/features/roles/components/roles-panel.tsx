"use client";

import { useState } from "react";
import { Loader2Icon, LockIcon, ShieldCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { useRbacData, useUpdateRolePermissions } from "@/features/roles/hooks/use-roles";
import {
  LOCKED_SUPERADMIN_PERMISSIONS,
  PERMISSION_GROUPS,
  SUPERADMIN_ROLE_CODE,
  type Permission,
  type Role,
} from "@/features/roles/types/roles";
import { ApiError } from "@/lib/api-error";
import { cn } from "@/lib/utils";

const sameSet = (a: number[], b: number[]) => a.length === b.length && a.every((id) => b.includes(id));

function groupPermissions(permissions: Permission[]): { title: string; items: Permission[] }[] {
  const prefixOf = (code: string) => code.split(".")[0] ?? code;
  const grouped = PERMISSION_GROUPS.map((group) => ({
    title: group.title,
    items: permissions.filter((permission) => group.prefixes.includes(prefixOf(permission.code))),
  }));
  const known = new Set(PERMISSION_GROUPS.flatMap((group) => group.prefixes));
  const others = permissions.filter((permission) => !known.has(prefixOf(permission.code)));
  return [...grouped, { title: "Lainnya", items: others }].filter((group) => group.items.length > 0);
}

export function RolesPanel() {
  const rbac = useRbacData();
  const update = useUpdateRolePermissions();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  // Unsaved permission sets per role id.
  const [drafts, setDrafts] = useState<Record<number, number[]>>({});

  const roles = rbac.data?.roles ?? [];
  const selected = roles.find((role) => role.id === selectedId) ?? roles[0];
  const draftOf = (role: Role) => drafts[role.id] ?? role.permissionIds;
  const isDirty = (role: Role) => drafts[role.id] !== undefined && !sameSet(drafts[role.id] ?? [], role.permissionIds);

  const discard = (roleId: number) =>
    setDrafts((current) => {
      const next = { ...current };
      delete next[roleId];
      return next;
    });

  const toggle = (role: Role, permissionId: number, checked: boolean) => {
    const current = draftOf(role);
    setDrafts({
      ...drafts,
      [role.id]: checked ? [...current, permissionId] : current.filter((id) => id !== permissionId),
    });
  };

  const save = (role: Role) => {
    update.mutate(
      { roleId: role.id, current: role.permissionIds, desired: draftOf(role) },
      {
        onSuccess: () => {
          discard(role.id);
          toast.success(`Hak akses ${role.name} disimpan.`);
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Hak akses gagal disimpan."),
      },
    );
  };

  return (
    <>
      <PageHeader
        title="Peran & Hak Akses"
        description="Atur hak akses setiap peran. Perubahan berlaku saat pengguna membuka halaman berikutnya."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Pengaturan" }, { label: "Peran & Hak Akses" }]}
      />

      {rbac.isPending ? (
        <div className="grid gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Skeleton className="h-64 w-full" />
          <Skeleton className="h-96 w-full" />
        </div>
      ) : rbac.isError ? (
        <Card>
          <QueryErrorState error={rbac.error} onRetry={() => void rbac.refetch()} />
        </Card>
      ) : !selected ? (
        <Card>
          <EmptyState icon={ShieldCheckIcon} title="Belum ada peran" description="Peran dibuat lewat seed database." />
        </Card>
      ) : (
        <div className="grid items-start gap-6 lg:grid-cols-[16rem_minmax(0,1fr)]">
          <Card className="gap-0 py-2">
            <nav aria-label="Daftar peran" className="flex flex-col gap-1 px-2">
              {roles.map((role) => {
                const active = role.id === selected.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    aria-current={active ? "true" : undefined}
                    className={cn(
                      "flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring",
                      active ? "bg-primary text-primary-foreground" : "hover:bg-accent/20",
                    )}
                  >
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{role.name}</span>
                      <span className={cn("block text-xs tabular-nums", active ? "text-primary-foreground/80" : "text-muted-foreground")}>
                        {draftOf(role).length} hak akses
                        {isDirty(role) ? " · belum disimpan" : null}
                      </span>
                    </span>
                    {isDirty(role) ? <span className="size-2 shrink-0 rounded-full bg-warning" aria-hidden /> : null}
                  </button>
                );
              })}
            </nav>
          </Card>

          <RolePermissionsCard
            key={selected.id}
            role={selected}
            permissions={rbac.data.permissions}
            granted={draftOf(selected)}
            dirty={isDirty(selected)}
            isSaving={update.isPending}
            onToggle={(permissionId, checked) => toggle(selected, permissionId, checked)}
            onDiscard={() => discard(selected.id)}
            onSave={() => save(selected)}
          />
        </div>
      )}
    </>
  );
}

type RolePermissionsCardProps = {
  role: Role;
  permissions: Permission[];
  granted: number[];
  dirty: boolean;
  isSaving: boolean;
  onToggle: (permissionId: number, checked: boolean) => void;
  onDiscard: () => void;
  onSave: () => void;
};

function RolePermissionsCard({ role, permissions, granted, dirty, isSaving, onToggle, onDiscard, onSave }: RolePermissionsCardProps) {
  const isSuperadmin = role.code === SUPERADMIN_ROLE_CODE;
  const isLocked = (permission: Permission) =>
    isSuperadmin && (LOCKED_SUPERADMIN_PERMISSIONS as readonly string[]).includes(permission.code);

  return (
    <Card className="gap-0 py-0">
      <CardHeader className="flex flex-col gap-3 border-b py-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="space-y-1">
          <CardTitle className="text-lg font-semibold">{role.name}</CardTitle>
          <CardDescription>
            Kode peran <span className="font-mono">{role.code}</span>
          </CardDescription>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onDiscard} disabled={!dirty || isSaving}>
            Batalkan
          </Button>
          <Button onClick={onSave} disabled={!dirty || isSaving}>
            {isSaving ? <Loader2Icon className="animate-spin" /> : null}
            Simpan Perubahan
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6 py-4">
        {granted.includes(permissions.find((p) => p.code === "report.view")?.id ?? -1) ? (
          <Alert>
            <AlertDescription>
              Hak akses statistik hanya menampilkan data agregat sesuai cakupan laporan (report scope) masing-masing akun.
            </AlertDescription>
          </Alert>
        ) : null}
        {groupPermissions(permissions).map((group) => (
          <fieldset key={group.title} className="space-y-2">
            <legend className="mb-2 text-sm font-semibold">{group.title}</legend>
            <div className="divide-y rounded-lg border">
              {group.items.map((permission) => {
                const locked = isLocked(permission);
                const inputId = `permission-${role.id}-${permission.id}`;
                return (
                  <label
                    key={permission.id}
                    htmlFor={inputId}
                    className={cn("flex items-start gap-3 px-3 py-2.5", locked ? "cursor-not-allowed" : "cursor-pointer hover:bg-accent/10")}
                  >
                    <input
                      id={inputId}
                      type="checkbox"
                      className="mt-0.5 size-4 shrink-0 accent-primary"
                      checked={granted.includes(permission.id)}
                      disabled={locked || isSaving}
                      onChange={(event) => onToggle(permission.id, event.target.checked)}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm">{permission.description ?? permission.code}</span>
                      <span className="block font-mono text-xs text-muted-foreground">{permission.code}</span>
                    </span>
                    {locked ? (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <LockIcon className="size-3.5" aria-hidden />
                        Wajib
                      </span>
                    ) : null}
                  </label>
                );
              })}
            </div>
          </fieldset>
        ))}
      </CardContent>
    </Card>
  );
}
