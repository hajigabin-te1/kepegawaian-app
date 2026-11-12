import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { HolidaysPanel } from "@/features/leave/components/holidays-panel";

export const metadata: Metadata = {
  title: "Hari Libur",
};

export default async function HolidaysPage() {
  await requirePermission(PERMISSIONS.leaveManage);
  return (
    <PageContainer>
      <HolidaysPanel />
    </PageContainer>
  );
}
