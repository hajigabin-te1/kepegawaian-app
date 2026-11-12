import type { Metadata } from "next";

import { PageContainer } from "@/components/layout/page-container";
import { PERMISSIONS } from "@/config/permissions";
import { requirePermission } from "@/features/auth/services/auth-service";
import { AppSettingsPanel } from "@/features/settings/components/app-settings-panel";

export const metadata: Metadata = {
  title: "Pengaturan Aplikasi",
};

export default async function AppSettingsPage() {
  await requirePermission(PERMISSIONS.settingsManage);
  return (
    <PageContainer>
      <AppSettingsPanel />
    </PageContainer>
  );
}
