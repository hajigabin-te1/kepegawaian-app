export type Announcement = {
  id: string;
  title: string;
  content: string;
  isPublished: boolean;
  publishedAt: string | null;
  /** Release date (campus date, YYYY-MM-DD). */
  startsOn: string;
  /** Last day shown to employees. Null only for announcements created before the period existed. */
  endsOn: string | null;
  attachmentPath: string | null;
  attachmentName: string | null;
  createdAt: string;
};

/** HR's view of where an announcement stands for employees today. */
export type AnnouncementStatus = "hidden" | "scheduled" | "live" | "ended";

/** Private bucket for announcement documents (limits enforced by Storage as well). */
export const ANNOUNCEMENT_FILES_BUCKET = "announcement-attachments";

export const MAX_ANNOUNCEMENT_FILE_BYTES = 5 * 1024 * 1024;

export const ALLOWED_ANNOUNCEMENT_FILE_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "image/jpeg",
  "image/png",
] as const;

export const ANNOUNCEMENT_FILE_ACCEPT = `.pdf,.doc,.docx,.jpg,.jpeg,.png,${ALLOWED_ANNOUNCEMENT_FILE_TYPES.join(",")}`;

export const ANNOUNCEMENT_FILE_HINT = "PDF, Word, JPG, atau PNG. Maksimal 5 MB.";
