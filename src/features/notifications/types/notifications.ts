export type AppNotification = {
  id: string;
  title: string;
  body: string | null;
  /** In-app path to open (e.g. "/leave"), or null when there is nothing to open. */
  link: string | null;
  readAt: string | null;
  createdAt: string;
};

export type NotificationFeed = {
  /** Latest notifications, newest first. */
  items: AppNotification[];
  /** All unread notifications, including ones older than `items`. */
  unreadCount: number;
};
