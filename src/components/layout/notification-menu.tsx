"use client";

import { BellIcon, BellOffIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

/** Notification entry point; there is no notification API yet, so it always shows the empty state. */
export function NotificationMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground" />}
        aria-label="Notifikasi"
      >
        <BellIcon />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-sm font-semibold text-foreground">Notifikasi</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <EmptyState
          icon={BellOffIcon}
          title="Belum ada notifikasi"
          description="Pemberitahuan terkait data pegawai akan muncul di sini."
          className="py-6"
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
