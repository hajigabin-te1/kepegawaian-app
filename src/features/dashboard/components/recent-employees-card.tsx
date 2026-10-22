"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronRightIcon, FlaskConicalIcon, SearchXIcon, UserPlusIcon, UsersIcon } from "lucide-react";
import { cn } from "cn";

import { EmptyState } from "@/components/common/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import type {
  EmployeeCategory,
  RecentEmployee,
  RecentEmployeeStatus,
} from "@/features/dashboard/data/mock-dashboard";
import { getInitials } from "@/lib/utils";

const STATUS_BADGES: Record<RecentEmployeeStatus, { label: string; variant: "success" | "warning" | "secondary" }> = {
  active: { label: "Aktif", variant: "success" },
  onLeave: { label: "Cuti", variant: "warning" },
  inactive: { label: "Nonaktif", variant: "secondary" },
};

const CATEGORY_LABELS: Record<EmployeeCategory, string> = {
  lecturer: "Dosen",
  staff: "Tendik",
};

type StatusFilter = "all" | RecentEmployeeStatus;

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Semua" },
  { value: "active", label: "Aktif" },
  { value: "onLeave", label: "Cuti" },
  { value: "inactive", label: "Nonaktif" },
];

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

const HEAD_CLASS = "h-10 text-xs font-medium text-muted-foreground";

type RecentEmployeesCardProps = {
  employees: RecentEmployee[];
  totalEmployees: number;
};

export function RecentEmployeesCard({ employees, totalEmployees }: RecentEmployeesCardProps) {
  const [filter, setFilter] = useState<StatusFilter>("all");
  const visibleEmployees = filter === "all" ? employees : employees.filter((employee) => employee.status === filter);

  return (
    <Card className="gap-0 pb-0">
      <CardHeader className="gap-4 pb-4">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <CardTitle className="flex flex-wrap items-center gap-2 text-lg font-semibold">
              Pegawai terbaru
              <Badge variant="outline" className="font-normal text-muted-foreground">
                <FlaskConicalIcon />
                Data contoh
              </Badge>
            </CardTitle>
            <CardDescription>Pegawai yang terakhir ditambahkan ke sistem.</CardDescription>
          </div>
          <Button
            variant="link"
            size="sm"
            className="shrink-0 px-0"
            nativeButton={false}
            render={<Link href={routes.employees.list} />}
          >
            Lihat semua
          </Button>
        </div>
        <div role="group" aria-label="Filter status" className="flex flex-wrap gap-2">
          {FILTERS.map((option) => {
            const selected = option.value === filter;
            return (
              <button
                key={option.value}
                type="button"
                aria-pressed={selected}
                onClick={() => setFilter(option.value)}
                className={cn(
                  "h-8 rounded-lg border px-3 text-xs font-medium transition-colors focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none",
                  selected
                    ? "border-primary bg-primary text-primary-foreground"
                    : "bg-background text-muted-foreground hover:border-accent hover:text-foreground",
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </CardHeader>

      <CardContent className="px-0">
        {visibleEmployees.length === 0 ? (
          <EmptyState
            icon={employees.length === 0 ? UsersIcon : SearchXIcon}
            title={employees.length === 0 ? "Belum ada pegawai" : "Tidak ada pegawai dengan status ini"}
            description={
              employees.length === 0
                ? "Data pegawai yang baru ditambahkan akan muncul di sini."
                : "Coba pilih filter status lain."
            }
            action={
              employees.length === 0 ? (
                <Button size="sm" nativeButton={false} render={<Link href={routes.employees.create} />}>
                  <UserPlusIcon />
                  Tambah Pegawai
                </Button>
              ) : undefined
            }
            className="border-t"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-y bg-background hover:bg-background">
                <TableHead className={cn(HEAD_CLASS, "pl-6")}>Pegawai</TableHead>
                <TableHead className={cn(HEAD_CLASS, "hidden md:table-cell")}>Jabatan / Unit</TableHead>
                <TableHead className={cn(HEAD_CLASS, "hidden 2xl:table-cell")}>Kategori</TableHead>
                <TableHead className={cn(HEAD_CLASS, "hidden sm:table-cell")}>Tgl. Masuk</TableHead>
                <TableHead className={HEAD_CLASS}>Status</TableHead>
                <TableHead className={cn(HEAD_CLASS, "hidden w-14 pr-6 text-right sm:table-cell")}>
                  <span className="sr-only">Aksi</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visibleEmployees.map((employee) => {
                const status = STATUS_BADGES[employee.status];
                return (
                  <TableRow key={employee.id} className="group/row hover:bg-accent/10">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent/30 text-xs font-semibold text-accent-foreground">
                            {getInitials(employee.name.replace(/^(Dr|Prof)\.\s*/, ""))}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 leading-tight">
                          <Link
                            href={routes.employees.detail(employee.id)}
                            className="block truncate rounded-sm font-medium underline-offset-4 hover:underline focus-visible:ring-3 focus-visible:ring-ring/60 focus-visible:outline-none"
                          >
                            {employee.name}
                          </Link>
                          <p className="truncate text-xs text-muted-foreground tabular-nums">
                            NIP {employee.employeeNumber}
                          </p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      <div className="leading-tight">
                        <p className="truncate">{employee.position}</p>
                        <p className="truncate text-xs text-muted-foreground">{employee.unit}</p>
                      </div>
                    </TableCell>
                    <TableCell className="hidden 2xl:table-cell">
                      <Badge variant="outline">{CATEGORY_LABELS[employee.category]}</Badge>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {dateFormatter.format(new Date(employee.joinedAt))}
                    </TableCell>
                    <TableCell>
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                    <TableCell className="hidden pr-6 text-right sm:table-cell">
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        className="text-muted-foreground group-hover/row:text-primary hover:bg-accent/30"
                        nativeButton={false}
                        render={<Link href={routes.employees.detail(employee.id)} />}
                        aria-label={`Lihat detail ${employee.name}`}
                        title="Lihat detail"
                      >
                        <ChevronRightIcon />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CardFooter className="justify-between gap-2 border-t bg-background px-6 py-3 text-xs text-muted-foreground [.border-t]:pt-3">
        <span className="tabular-nums">
          Menampilkan {visibleEmployees.length} dari {new Intl.NumberFormat("id-ID").format(totalEmployees)} pegawai
        </span>
        <span>Belum terhubung ke API pegawai</span>
      </CardFooter>
    </Card>
  );
}
