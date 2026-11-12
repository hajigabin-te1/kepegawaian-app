import { fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import type { AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
import type { Announcement } from "@/features/announcements/types/announcements";

const COLUMNS = "id, title, content, is_published, published_at, created_at";

/** RLS returns published announcements to everyone and drafts only to HR. */
export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("announcements")
    .select(COLUMNS)
    .order("published_at", { ascending: false, nullsFirst: true })
    .order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    createdAt: row.created_at,
  }));
}

export async function saveAnnouncement(id: string | null, values: AnnouncementFormValues): Promise<void> {
  const payload = { title: values.title, content: values.content, is_published: values.isPublished };
  const supabase = createSupabaseBrowserClient();
  const { error } = id
    ? await supabase.from("announcements").update(payload).eq("id", id).select("id").single()
    : await supabase.from("announcements").insert(payload);
  if (error) throw fromSupabaseError(error);
}

export async function setAnnouncementPublished(id: string, isPublished: boolean): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("announcements").update({ is_published: isPublished }).eq("id", id).select("id").single();
  if (error) throw fromSupabaseError(error);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("announcements").delete().eq("id", id).select("id").single();
  if (error) throw fromSupabaseError(error);
}
