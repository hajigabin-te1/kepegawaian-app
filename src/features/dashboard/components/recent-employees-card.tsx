import Link from "next/link";
import { UserPlusIcon, UsersIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { routes } from "@/config/routes";
import type { RecentEmployee, RecentEmployeeStatus } from "@/features/dashboard/data/mock-dashboard";

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

function getInitials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

type RecentEmployeesCardProps = {
  employees: RecentEmployee[];
};

export function RecentEmployeesCard({ employees }: RecentEmployeesCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Pegawai Terbaru</CardTitle>
        <CardDescription>Pegawai yang terakhir ditambahkan ke sistem.</CardDescription>
        <CardAction>
          <Button variant="link" size="sm" className="px-0" nativeButton={false} render={<Link href={routes.employees.list} />}>
            Lihat semua
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>
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
              <TableRow>
                <TableHead>Pegawai</TableHead>
                <TableHead className="hidden md:table-cell">Unit Kerja</TableHead>
                <TableHead className="hidden sm:table-cell">Tanggal Masuk</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {employees.map((employee) => {
                const status = STATUS_BADGES[employee.status];
                return (
                  <TableRow key={employee.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <Avatar className="size-8">
                          <AvatarFallback className="bg-muted text-xs font-medium">
                            {getInitials(employee.name)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 leading-tight">
                          <p className="truncate font-medium">{employee.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{employee.position}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-muted-foreground md:table-cell">{employee.unit}</TableCell>
                    <TableCell className="hidden text-muted-foreground tabular-nums sm:table-cell">
                      {dateFormatter.format(new Date(employee.joinedAt))}
                    </TableCell>
                    <TableCell>
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
