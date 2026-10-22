import type { Metadata } from "next";
import { BriefcaseBusinessIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <Card>
      <CardHeader className="items-center text-center">
        <span className="mx-auto flex size-10 items-center justify-center rounded-md bg-primary text-primary-foreground">
          <BriefcaseBusinessIcon className="size-5" />
        </span>
        <CardTitle className="text-xl">Masuk ke Aplikasi Kepegawaian</CardTitle>
        <CardDescription>Silakan masuk untuk melanjutkan.</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="rounded-md border border-dashed p-4 text-center text-sm text-muted-foreground">
          Formulir login akan dibuat setelah mekanisme autentikasi API dikonfirmasi.
        </p>
      </CardContent>
    </Card>
  );
}
