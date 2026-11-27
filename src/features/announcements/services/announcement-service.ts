import { ApiError, fromSupabaseError } from "@/lib/api-error";
import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { safeFileName } from "@/features/documents/services/file-storage";
import type { AnnouncementAttachmentChange, AnnouncementFormValues } from "@/features/announcements/schemas/announcement-schemas";
import {
  ALLOWED_ANNOUNCEMENT_FILE_TYPES,
  ANNOUNCEMENT_FILES_BUCKET,
  MAX_ANNOUNCEMENT_FILE_BYTES,
  type Announcement,
} from "@/features/announcements/types/announcements";

const COLUMNS = "id, title, content, is_published, published_at, starts_on, ends_on, attachment_path, attachment_name, created_at";
const SIGNED_URL_SECONDS = 60;

/** RLS returns announcements within their period to everyone, and every announcement to HR. */
export async function listAnnouncements(): Promise<Announcement[]> {
  const { data, error } = await createSupabaseBrowserClient()
    .from("announcements")
    .select(COLUMNS)
    .order("starts_on", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw fromSupabaseError(error);
  return data.map((row) => ({
    id: row.id,
    title: row.title,
    content: row.content,
    isPublished: row.is_published,
    publishedAt: row.published_at,
    startsOn: row.starts_on,
    endsOn: row.ends_on,
    attachmentPath: row.attachment_path,
    attachmentName: row.attachment_name,
    createdAt: row.created_at,
  }));
}

/** Returns an Indonesian error message, or null when the file can be uploaded. */
export function validateAnnouncementFile(file: File): string | null {
  if (!(ALLOWED_ANNOUNCEMENT_FILE_TYPES as readonly string[]).includes(file.type)) {
    return "Format file harus PDF, Word, JPG, atau PNG.";
  }
  if (file.size > MAX_ANNOUNCEMENT_FILE_BYTES) {
    return "Ukuran file maksimal 5 MB.";
  }
  return null;
}

async function uploadAttachment(file: File): Promise<string> {
  const invalid = validateAnnouncementFile(file);
  if (invalid) throw new ApiError(invalid, 400, null);

  const path = `${crypto.randomUUID()}/${safeFileName(file.name)}`;
  const { error } = await createSupabaseBrowserClient()
    .storage.from(ANNOUNCEMENT_FILES_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new ApiError("File gagal diunggah. Silakan coba lagi.", null, error);
  return path;
}

/** Best effort: a leftover object is harmless, so failures are not surfaced. */
async function removeAttachment(path: string | null): Promise<void> {
  if (!path) return;
  await createSupabaseBrowserClient().storage.from(ANNOUNCEMENT_FILES_BUCKET).remove([path]);
}

/**
 * Uploads a new file first, then writes the row. If the write fails the new file is removed;
 * if it succeeds the replaced or removed file is cleaned up.
 */
export async function saveAnnouncement(
  current: Pick<Announcement, "id" | "attachmentPath"> | null,
  values: AnnouncementFormValues,
  attachment: AnnouncementAttachmentChange,
): Promise<void> {
  const uploadedPath = attachment.file ? await uploadAttachment(attachment.file) : null;
  const attachmentColumns: { attachment_path?: string | null; attachment_name?: string | null } = attachment.file
    ? { attachment_path: uploadedPath, attachment_name: attachment.file.name }
    : attachment.remove
      ? { attachment_path: null, attachment_name: null }
      : {};
  const payload = {
    title: values.title,
    content: values.content,
    starts_on: values.startsOn,
    ends_on: values.endsOn,
    is_published: values.isPublished,
    ...attachmentColumns,
  };

  const supabase = createSupabaseBrowserClient();
  const { error } = current
    ? await supabase.from("announcements").update(payload).eq("id", current.id).select("id").single()
    : await supabase.from("announcements").insert(payload);
  if (error) {
    await removeAttachment(uploadedPath);
    throw fromSupabaseError(error);
  }
  if (attachment.file || attachment.remove) await removeAttachment(current?.attachmentPath ?? null);
}

export async function setAnnouncementPublished(id: string, isPublished: boolean): Promise<void> {
  const { error } = await createSupabaseBrowserClient().from("announcements").update({ is_published: isPublished }).eq("id", id).select("id").single();
  if (error) throw fromSupabaseError(error);
}

export async function deleteAnnouncement(id: string): Promise<void> {
  const { data, error } = await createSupabaseBrowserClient().from("announcements").delete().eq("id", id).select("attachment_path").single();
  if (error) throw fromSupabaseError(error);
  await removeAttachment(data.attachment_path);
}

/** Short-lived link for viewing or downloading the announcement document. */
export async function getAnnouncementAttachmentUrl(path: string): Promise<string> {
  const { data, error } = await createSupabaseBrowserClient()
    .storage.from(ANNOUNCEMENT_FILES_BUCKET)
    .createSignedUrl(path, SIGNED_URL_SECONDS);
  if (error) throw new ApiError("File tidak dapat dibuka.", null, error);
  return data.signedUrl;
}
