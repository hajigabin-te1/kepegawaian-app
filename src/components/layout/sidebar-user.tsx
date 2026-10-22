"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import type { SessionUser } from "@/features/auth/types/auth";
import { ROLE_LABELS } from "@/features/auth/user-display";
import { getInitials } from "@/lib/utils";

type SidebarUserProps = {
  user: SessionUser;
};

/** Profile summary and logout action pinned to the bottom of the sidebar. */
export function SidebarUser({ user }: SidebarUserProps) {
  const [isLoggingOut, startLogout] = useTransition();

  return (
    <div className="flex items-center gap-3 border-t border-sidebar-border p-4">
      <Avatar className="size-9 after:border-sidebar-border">
        <AvatarFallback className="bg-sidebar-accent text-xs font-semibold text-sidebar-foreground">
          {getInitials(user.name)}
        </AvatarFallback>
      </Avatar>
      <div className="min-w-0 flex-1 leading-tight">
        <p className="truncate text-sm font-medium">{user.name}</p>
        <p className="truncate text-xs text-sidebar-foreground/70">{ROLE_LABELS[user.role]}</p>
      </div>
      <Button
        variant="ghost"
        size="icon-sm"
        className="text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring"
        onClick={() => startLogout(() => logoutAction())}
        disabled={isLoggingOut}
        aria-label="Keluar"
        title="Keluar"
      >
        <LogOutIcon />
      </Button>
    </div>
  );
}
