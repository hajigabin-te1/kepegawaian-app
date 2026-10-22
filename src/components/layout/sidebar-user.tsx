"use client";

import { useTransition } from "react";
import { LogOutIcon } from "lucide-react";
import { cn } from "cn";

import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { logoutAction } from "@/features/auth/actions";
import type { SessionUser } from "@/features/auth/types/auth";
import { ROLE_LABELS } from "@/features/auth/user-display";
import { getInitials } from "@/lib/utils";

type SidebarUserProps = {
  user: SessionUser;
  collapsed?: boolean;
};

/** Profile summary and logout action pinned to the bottom of the sidebar. */
export function SidebarUser({ user, collapsed = false }: SidebarUserProps) {
  const [isLoggingOut, startLogout] = useTransition();

  return (
    <div className="border-t border-sidebar-border p-3">
      <div
        className={cn(
          "flex items-center gap-3 rounded-lg bg-sidebar-accent/50 p-2",
          collapsed && "flex-col bg-transparent p-0",
        )}
      >
        <Avatar className="size-9 after:border-sidebar-primary/40" title={collapsed ? user.name : undefined}>
          <AvatarFallback className="bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        {collapsed ? null : (
          <div className="min-w-0 flex-1 leading-tight">
            <p className="truncate text-sm font-semibold">{user.name}</p>
            <p className="truncate text-xs text-sidebar-foreground/65">
              {ROLE_LABELS[user.role]} · @{user.username}
            </p>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon-sm"
          className="text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground focus-visible:ring-sidebar-ring"
          onClick={() => startLogout(() => logoutAction())}
          disabled={isLoggingOut}
          aria-label="Keluar"
          title="Keluar"
        >
          <LogOutIcon />
        </Button>
      </div>
    </div>
  );
}
