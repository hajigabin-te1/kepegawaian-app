import type { Metadata } from "next";

import { PlaceholderNotice } from "@/components/common/placeholder-notice";
import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";

export const metadata: Metadata = {
  title: "Dashboard",
};

export default function DashboardPage() {
  return (
    <PageContainer>
      <PageHeader title="Dashboard" description="Ringkasan data kepegawaian." />
      <PlaceholderNotice description="Ringkasan dan statistik pegawai akan ditampilkan di sini." />
    </PageContainer>
  );
}
