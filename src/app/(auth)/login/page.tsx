import { useId } from "react";
import type { Metadata } from "next";
import { KeyRoundIcon } from "lucide-react";

import { BrandMonogram, INSTITUTION_NAME } from "@/components/layout/app-brand";
import { LoginForm } from "@/features/auth/components/login-form";

export const metadata: Metadata = {
  title: "Masuk",
};

/** Faint drafting grid behind the navy brand panel. */
function PanelGrid() {
  const patternId = useId();

  return (
    <svg aria-hidden="true" className="pointer-events-none absolute inset-0 size-full text-accent">
      <defs>
        <pattern id={patternId} width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M32 0H0V32" fill="none" stroke="currentColor" strokeOpacity="0.06" strokeWidth="1" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill={`url(#${patternId})`} />
    </svg>
  );
}

const NIP_DIGIT_COUNT = 18;

/**
 * Line drawing of a stacked employee ID card — the brand panel's single
 * focal element. Purely decorative, built from thin accent strokes.
 */
function EmployeeCardMotif() {
  return (
    <div aria-hidden="true" className="relative w-full max-w-sm">
      {/* Archived cards behind the active one */}
      <div className="absolute inset-0 translate-x-6 -translate-y-6 rounded-lg border border-accent/15" />
      <div className="absolute inset-0 translate-x-3 -translate-y-3 rounded-lg border border-accent/30 bg-primary" />

      <div className="relative rounded-lg border border-accent/70 bg-primary p-5">
        <div className="flex items-center justify-between border-b border-accent/25 pb-3">
          <div className="flex items-center gap-2">
            <span className="size-2 rounded-full bg-accent" />
            <span className="h-1.5 w-24 rounded-full bg-primary-foreground/40" />
          </div>
          <span className="h-1.5 w-10 rounded-full bg-accent/40" />
        </div>

        <div className="mt-5 flex gap-5">
          <div className="flex aspect-[3/4] w-20 shrink-0 items-end justify-center overflow-hidden rounded-md border border-dashed border-accent/60">
            <div className="flex flex-col items-center">
              <span className="size-7 rounded-full border border-accent/70" />
              <span className="-mb-px mt-1.5 h-6 w-14 rounded-t-full border border-b-0 border-accent/70" />
            </div>
          </div>
          <div className="flex flex-1 flex-col justify-center gap-2.5">
            <span className="h-2 w-4/5 rounded-full bg-primary-foreground/80" />
            <span className="h-1.5 w-3/5 rounded-full bg-primary-foreground/35" />
            <span className="mt-2 h-1.5 w-2/3 rounded-full bg-accent/45" />
            <span className="h-1.5 w-1/2 rounded-full bg-accent/25" />
          </div>
        </div>

        <div className="mt-6 grid grid-cols-[repeat(18,minmax(0,1fr))] gap-0.5">
          {Array.from({ length: NIP_DIGIT_COUNT }, (_, index) => (
            <span
              key={index}
              className={index < 8 ? "h-3.5 rounded-[2px] bg-accent/55" : "h-3.5 rounded-[2px] border border-accent/35"}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="flex w-full flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      {/* Mobile / tablet brand header */}
      <header className="relative overflow-hidden bg-primary px-4 pt-8 pb-7 text-primary-foreground sm:px-8 lg:hidden">
        <PanelGrid />
        <div className="relative flex items-center gap-3">
          <BrandMonogram tone="inverse" className="size-11" />
          <div className="min-w-0 leading-tight">
            <p className="text-sm font-semibold">{INSTITUTION_NAME}</p>
            <p className="mt-0.5 text-xs text-primary-foreground/70">Sistem Informasi Kepegawaian</p>
          </div>
        </div>
        <span aria-hidden="true" className="relative mt-6 block h-0.5 w-12 bg-accent" />
      </header>

      {/* Login form on the light side */}
      <section className="flex flex-1 flex-col px-4 py-8 sm:px-8 lg:min-h-svh lg:px-16 lg:py-12">
        <div className="hidden items-center gap-3 lg:flex">
          <BrandMonogram />
          <div className="leading-tight">
            <p className="text-sm font-semibold">{INSTITUTION_NAME}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">Sistem Informasi Kepegawaian</p>
          </div>
        </div>

        <div className="flex flex-1 items-center py-4 lg:py-10">
          <div className="mx-auto w-full max-w-sm space-y-8 lg:mx-0">
            <div className="space-y-2">
              <h1 className="text-2xl font-semibold tracking-tight sm:text-[1.75rem] sm:leading-tight">
                Masuk ke Aplikasi Kepegawaian
              </h1>
              <p className="text-sm leading-relaxed text-muted-foreground">
                Gunakan akun yang diberikan Bagian Kepegawaian untuk mengelola data dosen dan tenaga kependidikan.
              </p>
            </div>

            <LoginForm />

            <div className="flex gap-3 border-l-2 border-accent py-1 pl-4 text-xs leading-relaxed text-muted-foreground">
              <KeyRoundIcon className="mt-0.5 size-4 shrink-0 text-primary" />
              <p>
                <span className="font-medium text-foreground">Akun demo sementara.</span> Autentikasi belum terhubung ke
                API. Masuk dengan <span className="font-medium text-foreground tabular-nums">admin</span> dan password{" "}
                <span className="font-medium text-foreground tabular-nums">admin123</span>.
              </p>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-muted-foreground lg:text-left">
          Lupa password? Hubungi Bagian Kepegawaian untuk mengatur ulang akun Anda.
        </p>
      </section>

      {/* Desktop navy brand panel */}
      <aside className="relative hidden overflow-hidden bg-primary text-primary-foreground lg:flex lg:min-h-svh lg:flex-col lg:justify-between lg:p-16">
        <PanelGrid />
        <span aria-hidden="true" className="absolute inset-y-0 left-0 w-1 bg-accent" />

        <p className="relative text-sm text-primary-foreground/70">Sistem Informasi Kepegawaian</p>

        <div className="relative flex justify-center py-10">
          <EmployeeCardMotif />
        </div>

        <div className="relative space-y-6">
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl leading-tight font-semibold tracking-tight xl:text-4xl">
              Satu berkas yang rapi untuk setiap pegawai.
            </h2>
            <p className="text-sm leading-relaxed text-primary-foreground/75">
              Profil, status, dan dokumen dosen serta tenaga kependidikan dikelola di satu tempat.
            </p>
          </div>
          <div className="flex items-center justify-between border-t border-primary-foreground/15 pt-5 text-xs text-primary-foreground/60">
            <span>© 2026 STIA Amuntai</span>
            <span>Versi pengembangan</span>
          </div>
        </div>
      </aside>
    </div>
  );
}
