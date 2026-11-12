import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { routes } from "@/config/routes";
import { getCurrentUser } from "@/features/auth/services/auth-service";
import { MyAttendancePanel } from "@/features/attendance/components/my-attendance-panel";

export const metadata: Metadata = {
  title: "Presensi Saya",
};

export default async function MyAttendancePage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);
  return (
    <PageContainer>
      <MyAttendancePanel employeeId={user.employeeId} />
    </PageContainer>
  );
}
