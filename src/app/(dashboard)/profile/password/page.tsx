import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { PageContainer } from "@/components/layout/page-container";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";
import { ChangePasswordForm } from "@/features/auth/components/change-password-form";
import { getCurrentUser } from "@/features/auth/services/auth-service";

export const metadata: Metadata = {
  title: "Ganti Password",
};

export default async function ChangePasswordPage() {
  const user = await getCurrentUser();
  if (!user) redirect(`${routes.login}?reason=session`);

  return (
    <PageContainer>
      <PageHeader
        title="Ganti Password"
        description="Ganti password secara berkala, terutama setelah menerima password sementara dari admin."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Akun Saya" }, { label: "Ganti Password" }]}
      />
      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Password akun</CardTitle>
          <CardDescription>{user.email}</CardDescription>
        </CardHeader>
        <CardContent>
          <ChangePasswordForm />
        </CardContent>
      </Card>
    </PageContainer>
  );
}
