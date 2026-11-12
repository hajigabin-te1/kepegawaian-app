import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { AnnouncementsPanel } from "@/features/announcements/components/announcements-panel";

export const metadata: Metadata = {
  title: "Pengumuman",
};

export default async function AnnouncementsPage() {
  const user = await getCurrentUser();
  return (
    <PageContainer>
      <AnnouncementsPanel canManage={user?.permissions.includes("announcement.manage") ?? false} />
    </PageContainer>
  );
}
