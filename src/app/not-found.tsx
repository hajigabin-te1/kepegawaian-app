import type { Metadata } from "next";
import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Halaman tidak ditemukan",
};

export default function NotFound() {
  return (
    <main className="flex flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-md rounded-lg border bg-card">
        <EmptyState
          icon={FileQuestionIcon}
          title="Halaman tidak ditemukan"
          description="Alamat yang Anda buka tidak tersedia atau sudah dipindahkan."
          action={
            // "/" sends signed-in users to the dashboard and everyone else to login (see src/proxy.ts).
            <Button size="sm" nativeButton={false} render={<Link href="/" />}>
              Kembali ke beranda
            </Button>
          }
        />
      </div>
    </main>
  );
}
