"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { useEmployeeList } from "@/features/employees/hooks/use-employees";
import {
  ACTIVE_STATUS_LABELS,
  CATEGORY_LABELS,
  EMPLOYEES_PAGE_SIZE,
  type EmployeeActiveStatus,
  type EmployeeCategory,
  type EmployeeListFilters,
} from "@/features/employees/types/employees";

const CATEGORY_ITEMS = { all: "Semua kategori", ...CATEGORY_LABELS };
const STATUS_ITEMS = { all: "Semua status", ...ACTIVE_STATUS_LABELS };

export function EmployeesPanel({ canManage }: { canManage: boolean }) {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<EmployeeListFilters>({ search: "", category: "all", status: "active", page: 1 });
  const list = useEmployeeList(filters);

  const items = list.data?.items ?? [];
  const total = list.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / EMPLOYEES_PAGE_SIZE));
  const change = (patch: Partial<EmployeeListFilters>) => setFilters((current) => ({ ...current, page: 1, ...patch }));

  return (
    <>
      <PageHeader
        title="Data Pegawai"
        description="Daftar dosen dan tenaga kependidikan."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Kepegawaian" }, { label: "Data Pegawai" }]}
        actions={
          canManage ? (
            <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
              <PlusIcon />
              Tambah Pegawai
            </Button>
          ) : null
        }
      />

      <div className="flex flex-col gap-3 sm:flex-row">
        <form
          className="relative flex-1"
          onSubmit={(event) => {
            event.preventDefault();
            change({ search: searchInput });
          }}
        >
          <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Cari nama atau NIP, lalu tekan Enter"
            aria-label="Cari pegawai"
            className="pl-9"
          />
        </form>
        <Select items={CATEGORY_ITEMS} value={filters.category} onValueChange={(v) => v && change({ category: v as EmployeeCategory | "all" })}>
          <SelectTrigger className="w-full sm:w-52" aria-label="Kategori">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(CATEGORY_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select items={STATUS_ITEMS} value={filters.status} onValueChange={(v) => v && change({ status: v as EmployeeActiveStatus | "all" })}>
          <SelectTrigger className="w-full sm:w-40" aria-label="Status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(STATUS_ITEMS).map(([value, label]) => (
              <SelectItem key={value} value={value}>
                {label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <Card className="gap-0 py-0">
        {list.isPending ? (
          <TableSkeleton />
        ) : list.isError ? (
          <QueryErrorState error={list.error} onRetry={() => void list.refetch()} />
        ) : items.length === 0 ? (
          <EmptyState icon={UsersIcon} title="Pegawai tidak ditemukan" description="Ubah kata kunci atau filter, atau tambahkan pegawai baru." />
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="pl-6">Nama</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit kerja</TableHead>
                  <TableHead className="hidden lg:table-cell">Jabatan</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {items.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-accent/15">
                    <TableCell className="pl-6">
                      <Link href={routes.employees.detail(employee.id)} className="font-medium hover:underline">
                        {employee.fullName}
                      </Link>
                      <p className="text-xs text-muted-foreground tabular-nums">{employee.employeeNumber ?? "NIP belum diisi"}</p>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">{CATEGORY_LABELS[employee.category]}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{employee.workUnitName ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{employee.positionName ?? "—"}</TableCell>
                    <TableCell className="pr-6">
                      <EmployeeStatusBadge status={employee.activeStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex items-center justify-between border-t px-6 py-3 text-sm text-muted-foreground">
              <span className="tabular-nums">
                {total} pegawai · halaman {filters.page} dari {pageCount}
              </span>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={filters.page <= 1} onClick={() => setFilters((c) => ({ ...c, page: c.page - 1 }))}>
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <Button variant="outline" size="sm" disabled={filters.page >= pageCount} onClick={() => setFilters((c) => ({ ...c, page: c.page + 1 }))}>
                  Berikutnya
                  <ChevronRightIcon />
                </Button>
              </div>
            </div>
          </>
        )}
      </Card>
    </>
  );
}
