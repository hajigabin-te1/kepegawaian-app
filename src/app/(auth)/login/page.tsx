import { useId } from "react";
import type { Metadata } from "next";
import { BriefcaseBusinessIcon, InfoIcon } from "lucide-react";

import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

function BrandMark() {
  return (
    <span className="flex size-10 items-center justify-center rounded-lg bg-accent text-accent-foreground">
      <BriefcaseBusinessIcon className="size-5" />
    </span>
  );
}

/** Restrained geometric accents for the navy brand panel. */
function BrandPattern({ compact = false }: { compact?: boolean }) {
  const patternId = useId();

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-accent">
      <defs>
        <pattern id={patternId} width="40" height="40" patternUnits="userSpaceOnUse">
          <path d="M40 0H0V40" fill="none" stroke="currentColor" strokeOpacity="0.08" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
      <g fill="none" stroke="currentColor" strokeWidth="1">
        <circle cx="100%" cy="0" r="180" strokeOpacity="0.25" />
        <circle cx="100%" cy="0" r="260" strokeOpacity="0.15" />
        <circle cx="100%" cy="0" r="340" strokeOpacity="0.08" />
      </g>
      {compact ? null : (
        <>
          <rect x="8%" y="72%" width="72" height="72" rx="8" fill="none" stroke="currentColor" strokeOpacity="0.3" />
          <rect x="12%" y="77%" width="72" height="72" rx="8" fill="currentColor" fillOpacity="0.12" />
        </>
      )}
    </svg>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col lg:grid lg:grid-cols-2">
      {/* Mobile / tablet brand header */}
      <header className="relative overflow-hidden bg-primary px-6 pt-10 pb-8 text-primary-foreground lg:hidden">
        <BrandPattern compact />
        <div className="relative flex items-center gap-3">
          <BrandMark />
          <div className="leading-tight">
            <p className="font-semibold">Aplikasi Kepegawaian</p>
            <p className="text-sm text-primary-foreground/75">Sistem Informasi Pegawai</p>
          </div>
        </div>
        <div className="relative mt-6 h-1 w-12 rounded-full bg-accent" />
      </header>

      {/* Login form */}
      <section className="flex flex-1 justify-center px-4 py-8 sm:px-6 sm:py-12 lg:items-center lg:px-12">
        <div className="w-full max-w-sm space-y-8">
          <div className="hidden items-center gap-3 lg:flex">
            <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <BriefcaseBusinessIcon className="size-5" />
            </span>
            <div className="leading-tight">
              <p className="font-semibold">Aplikasi Kepegawaian</p>
              <p className="text-sm text-muted-foreground">Sistem Informasi Pegawai</p>
            </div>
          </div>

          <div className="space-y-2">
            <h1 className="text-2xl font-semibold tracking-tight">Masuk ke Aplikasi Kepegawaian</h1>
            <p className="text-sm text-muted-foreground">
              Gunakan akun yang diberikan administrator untuk mengakses data pegawai.
            </p>
          </div>

          <LoginForm />

          <div className="flex gap-3 rounded-lg border border-l-4 border-l-accent bg-card p-3 text-xs text-muted-foreground">
            <InfoIcon className="mt-px size-4 shrink-0 text-primary" />
            <p>
              Mode pengembangan: autentikasi masih sementara (mock) dan belum terhubung ke API.
            </p>
          </div>
        </div>
      </section>

      {/* Desktop brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:flex-col lg:justify-between lg:p-12">
        <BrandPattern />
        <div className="relative flex items-center gap-3">
          <BrandMark />
          <p className="text-sm font-medium text-primary-foreground/80">Sistem Informasi Pegawai</p>
        </div>

        <div className="relative max-w-md space-y-5">
          <div className="h-1 w-12 rounded-full bg-accent" />
          <h2 className="text-3xl leading-tight font-semibold tracking-tight">
            Data pegawai tertata, layanan kepegawaian lebih cepat.
          </h2>
          <p className="text-sm leading-relaxed text-primary-foreground/75">
            Satu tempat untuk mengelola data, status, dan riwayat pegawai secara terpusat.
          </p>
        </div>

        <p className="relative text-xs text-primary-foreground/60">© 2026 Aplikasi Kepegawaian</p>
      </aside>
    </div>
  );
}
