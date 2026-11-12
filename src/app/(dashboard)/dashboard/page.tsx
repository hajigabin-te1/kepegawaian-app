import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { StatisticsDashboard } from "@/features/dashboard/components/statistics-dashboard";
import { WelcomePanel } from "@/features/dashboard/components/welcome-panel";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default async function DashboardPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);

  return (
    <PageContainer>
      {/* report.view is held by HR and the leaders; they get statistics, everyone else a personal home. */}
      {user.permissions.includes("report.view") ? <StatisticsDashboard user={user} /> : <WelcomePanel user={user} />}
    </PageContainer>
  );
}
