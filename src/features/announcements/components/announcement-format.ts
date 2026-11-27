const dateFormatter = new Intl.DateTimeFormat("id-ID", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Formats a campus date (YYYY-MM-DD) without shifting it across time zones. */
export const formatAnnouncementDate = (isoDate: string) => dateFormatter.format(new Date(`${isoDate}T00:00:00Z`));
