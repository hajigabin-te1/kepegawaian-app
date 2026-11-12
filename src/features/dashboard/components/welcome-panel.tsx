import Link from "next/link";
import { KeyRoundIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { routes } from "@/config/routes";

/** Shown to accounts without statistics access until their own modules exist. */
export function WelcomePanel({ name }: { name: string }) {
  return (
    <Card className="max-w-2xl">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Selamat datang, {name}</CardTitle>
        <CardDescription>Menu yang tersedia untuk akun Anda ada di panel sebelah kiri.</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" nativeButton={false} render={<Link href={routes.profile.password} />}>
          <KeyRoundIcon />
          Ganti Password
        </Button>
      </CardContent>
    </Card>
  );
}
