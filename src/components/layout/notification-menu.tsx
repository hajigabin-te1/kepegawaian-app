"use client";

import { useRouter } from "next/navigation";
import { BellIcon, BellOffIcon, CheckCheckIcon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Skeleton } from "@/components/ui/skeleton";
import { APP_TIME_ZONE } from "@/config/locale";
import {
  useMarkAllNotificationsRead,
  useMarkNotificationRead,
  useNotificationFeed,
} from "@/features/notifications/hooks/use-notifications";
import type { AppNotification } from "@/features/notifications/types/notifications";
import { ApiError } from "@/lib/api-error";

const timeFormatter = new Intl.DateTimeFormat("id-ID", { dateStyle: "medium", timeStyle: "short", timeZone: APP_TIME_ZONE });

const errorMessage = (error: unknown) => (error instanceof ApiError ? error.message : "Terjadi kesalahan. Silakan coba lagi.");

/** Header bell: the signed-in user's latest notifications, with an unread count. */
export function NotificationMenu({ userId }: { userId: string }) {
  const router = useRouter();
  const feed = useNotificationFeed(userId);
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead(userId);

  const unreadCount = feed.data?.unreadCount ?? 0;

  const open = (notification: AppNotification) => {
    if (!notification.readAt) {
      markRead.mutate(notification.id, { onError: (error) => toast.error(errorMessage(error)) });
    }
    if (notification.link) router.push(notification.link);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={<Button variant="outline" size="icon" className="relative size-10 text-muted-foreground hover:text-foreground" />}
        aria-label={unreadCount > 0 ? `Notifikasi, ${unreadCount} belum dibaca` : "Notifikasi"}
      >
        <BellIcon />
        {unreadCount > 0 ? (
          <span className="absolute -top-1.5 -right-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs font-semibold text-primary-foreground tabular-nums">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80 max-w-[calc(100vw-2rem)]">
        <DropdownMenuGroup>
          <DropdownMenuLabel className="text-sm font-semibold text-foreground">Notifikasi</DropdownMenuLabel>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />

        {feed.isPending ? (
          <div className="space-y-3 p-2" aria-busy="true" aria-label="Memuat notifikasi">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        ) : feed.isError ? (
          <QueryErrorState error={feed.error} onRetry={() => void feed.refetch()} />
        ) : feed.data.items.length === 0 ? (
          <EmptyState
            icon={BellOffIcon}
            title="Belum ada notifikasi"
            description="Pemberitahuan tentang pengajuan dan keputusan akan muncul di sini."
            className="py-6"
          />
        ) : (
          <>
            <DropdownMenuGroup className="max-h-80 overflow-y-auto">
              {feed.data.items.map((notification) => (
                <DropdownMenuItem key={notification.id} className="items-start gap-2.5 py-2" onClick={() => open(notification)}>
                  <span
                    aria-hidden
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${notification.readAt ? "bg-transparent" : "bg-primary"}`}
                  />
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className={`block text-sm ${notification.readAt ? "" : "font-semibold"}`}>
                      {notification.title}
                      {notification.readAt ? null : <span className="sr-only"> (belum dibaca)</span>}
                    </span>
                    {notification.body ? <span className="line-clamp-2 block text-xs text-muted-foreground">{notification.body}</span> : null}
                    <span className="block text-xs text-muted-foreground tabular-nums">{timeFormatter.format(new Date(notification.createdAt))}</span>
                  </span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {unreadCount > 0 ? (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  closeOnClick={false}
                  disabled={markAllRead.isPending}
                  onClick={() => markAllRead.mutate(undefined, { onError: (error) => toast.error(errorMessage(error)) })}
                >
                  <CheckCheckIcon />
                  Tandai semua sudah dibaca
                </DropdownMenuItem>
              </>
            ) : null}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
