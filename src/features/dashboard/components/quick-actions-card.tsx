import Link from "next/link";
import { ChevronRightIcon, UserPlusIcon, UsersIcon, type LucideIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";

type QuickAction = {
  title: string;
  description: string;
  href: string;
  icon: LucideIcon;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    title: "Tambah Pegawai",
    description: "Daftarkan pegawai baru.",
    href: routes.employees.create,
    icon: UserPlusIcon,
  },
  {
    title: "Daftar Pegawai",
    description: "Lihat dan kelola data pegawai.",
    href: routes.employees.list,
    icon: UsersIcon,
  },
];

export function QuickActionsCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Aksi Cepat</CardTitle>
        <CardDescription>Pintasan untuk tugas yang sering dilakukan.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {QUICK_ACTIONS.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className="flex items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Icon className="size-4" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">{action.title}</span>
                <span className="block truncate text-xs text-muted-foreground">{action.description}</span>
              </span>
              <ChevronRightIcon className="size-4 text-muted-foreground" />
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
