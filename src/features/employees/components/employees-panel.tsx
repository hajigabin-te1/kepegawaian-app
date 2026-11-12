"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronLeftIcon, ChevronRightIcon, PlusIcon, SearchIcon, SearchXIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import { EmployeeStatusBadge } from "@/features/employees/components/employee-status-badge";
import { useEmployees } from "@/features/employees/hooks/use-employees";
import {
  ACTIVE_STATUS_LABELS,
  CATEGORY_LABELS,
  EMPLOYEE_PAGE_SIZE,
  type EmployeeListFilters,
} from "@/features/employees/types/employee";
import { useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { getInitials } from "@/lib/utils";

const SEARCH_DELAY_MS = 300;
const ALL = "all";
const CATEGORY_ITEMS = { [ALL]: "Semua kategori", ...CATEGORY_LABELS };
const STATUS_ITEMS = { [ALL]: "Semua status", ...ACTIVE_STATUS_LABELS };

const INITIAL_FILTERS: EmployeeListFilters = { search: "", category: ALL, workUnitId: ALL, activeStatus: "active", page: 1 };

export function EmployeesPanel() {
  const [searchInput, setSearchInput] = useState("");
  const [filters, setFilters] = useState<EmployeeListFilters>(INITIAL_FILTERS);
  const employees = useEmployees(filters);
  const workUnits = useWorkUnits();

  // Debounce typing before querying.
  useEffect(() => {
    const timer = setTimeout(() => {
      setFilters((current) => (current.search === searchInput ? current : { ...current, search: searchInput, page: 1 }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateFilter = <Key extends keyof EmployeeListFilters>(key: Key, value: EmployeeListFilters[Key]) =>
    setFilters((current) => ({ ...current, [key]: value, page: 1 }));

  const unitItems: Record<string, string> = {
    [ALL]: "Semua unit kerja",
    ...Object.fromEntries((workUnits.data ?? []).map((unit) => [unit.id, unit.name])),
  };

  const total = employees.data?.total ?? 0;
  const rows = employees.data?.rows ?? [];
  const firstRow = total === 0 ? 0 : (filters.page - 1) * EMPLOYEE_PAGE_SIZE + 1;
  const lastRow = Math.min(filters.page * EMPLOYEE_PAGE_SIZE, total);
  const pageCount = Math.max(1, Math.ceil(total / EMPLOYEE_PAGE_SIZE));
  const hasFilters =
    filters.search !== "" || filters.category !== ALL || filters.workUnitId !== ALL || filters.activeStatus !== "active";

  return (
    <>
      <PageHeader
        title="Data Pegawai"
        description="Dosen dan tenaga kependidikan STIA Amuntai."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Kepegawaian" }, { label: "Data Pegawai" }]}
        actions={
          <Button nativeButton={false} render={<Link href={routes.employees.create} />}>
            <PlusIcon />
            Tambah Pegawai
          </Button>
        }
      />

      <Card className="gap-0 py-0">
        <div className="grid gap-3 border-b p-4 sm:grid-cols-2 xl:grid-cols-[minmax(0,1.5fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <SearchIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Cari nama, NIP, atau NIDN…"
              className="pl-9"
              aria-label="Cari pegawai"
            />
          </div>
          <Select
            items={CATEGORY_ITEMS}
            value={filters.category}
            onValueChange={(value) => value && updateFilter("category", value as EmployeeListFilters["category"])}
          >
            <SelectTrigger className="w-full" aria-label="Filter kategori">
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
          <Select items={unitItems} value={filters.workUnitId} onValueChange={(value) => value && updateFilter("workUnitId", value)}>
            <SelectTrigger className="w-full" aria-label="Filter unit kerja">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(unitItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            items={STATUS_ITEMS}
            value={filters.activeStatus}
            onValueChange={(value) => value && updateFilter("activeStatus", value as EmployeeListFilters["activeStatus"])}
          >
            <SelectTrigger className="w-full" aria-label="Filter status">
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

        {employees.isPending ? (
          <TableSkeleton rows={8} />
        ) : employees.isError ? (
          <QueryErrorState error={employees.error} onRetry={() => void employees.refetch()} />
        ) : rows.length === 0 ? (
          hasFilters ? (
            <EmptyState
              icon={SearchXIcon}
              title="Tidak ada pegawai yang cocok"
              description="Ubah kata kunci atau filter untuk melihat pegawai lain."
              action={
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setSearchInput("");
                    setFilters(INITIAL_FILTERS);
                  }}
                >
                  Reset filter
                </Button>
              }
            />
          ) : (
            <EmptyState
              icon={UsersIcon}
              title="Belum ada data pegawai"
              description="Tambahkan dosen dan tenaga kependidikan untuk mulai mengelola data kepegawaian."
              action={
                <Button size="sm" nativeButton={false} render={<Link href={routes.employees.create} />}>
                  <PlusIcon />
                  Tambah Pegawai
                </Button>
              }
            />
          )
        ) : (
          <>
            <Table>
              <TableHeader>
                <TableRow className="bg-secondary hover:bg-secondary">
                  <TableHead className="pl-6">Pegawai</TableHead>
                  <TableHead className="hidden md:table-cell">Kategori</TableHead>
                  <TableHead className="hidden lg:table-cell">Unit kerja</TableHead>
                  <TableHead className="hidden xl:table-cell">Jabatan</TableHead>
                  <TableHead className="pr-6">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((employee) => (
                  <TableRow key={employee.id} className="hover:bg-accent/15">
                    <TableCell className="py-3 pl-6">
                      <Link
                        href={routes.employees.detail(employee.id)}
                        className="flex items-center gap-3 rounded-md focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
                      >
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent/30 text-xs font-semibold text-accent-foreground">
                            {getInitials(employee.fullName)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="min-w-0 leading-tight">
                          <span className="block truncate font-medium hover:underline">{employee.fullName}</span>
                          <span className="block truncate text-xs text-muted-foreground tabular-nums">
                            {employee.employeeNumber
                              ? `NIP ${employee.employeeNumber}`
                              : employee.lecturerNumber
                                ? `NIDN ${employee.lecturerNumber}`
                                : "NIP belum diisi"}
                          </span>
                        </span>
                      </Link>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{CATEGORY_LABELS[employee.category]}</TableCell>
                    <TableCell className="hidden text-muted-foreground lg:table-cell">{employee.workUnitName ?? "—"}</TableCell>
                    <TableCell className="hidden text-muted-foreground xl:table-cell">{employee.positionName ?? "—"}</TableCell>
                    <TableCell className="pr-6">
                      <EmployeeStatusBadge status={employee.activeStatus} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <div className="flex flex-col gap-3 border-t px-6 py-3 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
              <span className="tabular-nums">
                Menampilkan {firstRow}–{lastRow} dari {total} pegawai
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
                  disabled={filters.page <= 1 || employees.isFetching}
                >
                  <ChevronLeftIcon />
                  Sebelumnya
                </Button>
                <span className="tabular-nums">
                  {filters.page} / {pageCount}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
                  disabled={filters.page >= pageCount || employees.isFetching}
                >
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
