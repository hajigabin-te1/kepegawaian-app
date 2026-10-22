import type { Metadata } from "next";
import { BriefcaseBusinessIcon, InfoIcon } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

export default function LoginPage() {
  return (
    <div className="grid w-full max-w-4xl overflow-hidden rounded-lg border bg-card md:grid-cols-2">
      <section className="flex flex-col gap-8 p-6 sm:p-10">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <BriefcaseBusinessIcon className="size-5" />
          </span>
          <div className="leading-tight">
            <p className="font-semibold">Kepegawaian</p>
            <p className="text-sm text-muted-foreground">Sistem Informasi Kepegawaian</p>
          </div>
        </div>

        <div className="space-y-1">
          <h1 className="text-2xl font-semibold tracking-tight">Masuk</h1>
          <p className="text-sm text-muted-foreground">
            Masukkan username dan password Anda untuk melanjutkan.
          </p>
        </div>

        <LoginForm />

        <p className="flex items-start gap-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-px size-3.5 shrink-0" />
          Mode pengembangan: autentikasi masih sementara (mock) dan belum terhubung ke API.
        </p>
      </section>

      <aside className="relative hidden flex-col justify-end overflow-hidden bg-primary p-10 text-primary-foreground md:flex">
        <svg aria-hidden="true" className="absolute inset-0 size-full text-primary-foreground/10">
          <defs>
            <pattern id="login-grid" width="32" height="32" patternUnits="userSpaceOnUse">
              <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeWidth="1" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#login-grid)" />
        </svg>
        <div className="relative space-y-2">
          <p className="text-lg font-semibold">Aplikasi Kepegawaian</p>
          <p className="text-sm text-primary-foreground/80">
            Kelola data pegawai secara terpusat, rapi, dan aman.
          </p>
        </div>
      </aside>
    </div>
  );
}
