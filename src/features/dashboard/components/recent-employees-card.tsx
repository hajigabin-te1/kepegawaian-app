import Link from "next/link";
import { ArrowRightIcon, UserPlusIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import type { RecentEmployee, RecentEmployeeStatus } from "@/features/dashboard/data/mock-dashboard";
import { getInitials } from "@/lib/utils";

const STATUS_BADGES: Record<RecentEmployeeStatus, { label: string; variant: "success" | "warning" | "destructive" }> = {
  active: { label: "Aktif", variant: "success" },
  onLeave: { label: "Cuti", variant: "warning" },
  inactive: { label: "Nonaktif", variant: "destructive" },
};

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Jakarta",
});

type RecentEmployeesCardProps = {
  employees: RecentEmployee[];
};

export function RecentEmployeesCard({ employees }: RecentEmployeesCardProps) {
  return (
    <Card className="gap-4">
      <CardHeader>
        <div className="flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <UsersIcon className="size-4" />
          </span>
          <div className="space-y-0.5">
            <CardTitle className="text-lg font-semibold">Pegawai Terbaru</CardTitle>
            <CardDescription>Pegawai yang terakhir ditambahkan ke sistem.</CardDescription>
          </div>
        </div>
        <CardAction>
          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={routes.employees.list} />}>
            Lihat semua
            <ArrowRightIcon />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="px-0">
        {employees.length === 0 ? (
          <EmptyState
            icon={UsersIcon}
            title="Belum ada pegawai"
            description="Data pegawai yang baru ditambahkan akan muncul di sini."
            action={
              <Button size="sm" nativeButton={false} render={<Link href={routes.employees.create} />}>
                <UserPlusIcon />
                Tambah Pegawai
              </Button>
            }
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-y bg-secondary hover:bg-secondary">
                <TableHead className="pl-6 text-xs font-medium tracking-wide text-secondary-foreground uppercase">
                  Pegawai
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wide text-secondary-foreground uppercase md:table-cell">
                  NIP
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wide text-secondary-foreground uppercase 2xl:table-cell">
                  Unit Kerja
                </TableHead>
                <TableHead className="hidden text-xs font-medium tracking-wide text-secondary-foreground uppercase sm:table-cell">
                  Tanggal Masuk
                </TableHead>
                <TableHead className="pr-6 text-xs font-medium tracking-wide text-secondary-foreground uppercase">
                  Status
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const status = STATUS_BADGES[employee.status];
                return (
                  <TableRow key={employee.id} className="hover:bg-accent/15">
                    <TableCell className="py-3 pl-6">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9">
                          <AvatarFallback className="bg-accent/30 text-xs font-semibold text-accent-foreground">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-medium">{employee.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums md:table-cell">
                      {employee.employeeNumber}
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground 2xl:table-cell">{employee.unit}</TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {dateFormatter.format(new Date(employee.joinedAt))}
                    </TableCell>
                    <TableCell className="pr-6">
                      <Badge variant={status.variant}>{status.label}</Badge>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
