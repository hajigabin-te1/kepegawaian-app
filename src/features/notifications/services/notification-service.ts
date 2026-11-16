import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { NotificationFeed } from "@/features/notifications/types/notifications";

const FEED_LIMIT = 20;

/** RLS only returns the signed-in user's notifications; the explicit filter keeps the index in use. */
export async function getNotificationFeed(userId: string): Promise<NotificationFeed> {
  const supabase = createSupabaseBrowserClient();
  const [list, unread] = await Promise.all([
    supabase
      .from("notifications")
      .select("id, title, body, link, read_at, created_at")
      .eq("recipient_user_id", userId)
      .order("created_at", { ascending: false })
      .limit(FEED_LIMIT),
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("recipient_user_id", userId).is("read_at", null),
  ]);
  if (list.error) throw fromSupabaseError(list.error);
  if (unread.error) throw fromSupabaseError(unread.error);

  return {
    items: list.data.map((row) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      // Only in-app paths are followed; anything else is ignored.
      link: row.link?.startsWith("/") && !row.link.startsWith("//") ? row.link : null,
      readAt: row.read_at,
      createdAt: row.created_at,
    })),
    unreadCount: unread.count ?? 0,
  };
}

export async function markNotificationRead(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .is("read_at", null);
  if (error) throw fromSupabaseError(error);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient()
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("recipient_user_id", userId)
    .is("read_at", null);
  if (error) throw fromSupabaseError(error);
}
