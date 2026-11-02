"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  CircleAlertIcon,
  EyeIcon,
  EyeOffIcon,
  Loader2Icon,
  LockKeyholeIcon,
  MailIcon,
} from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import type { LoginInput } from "@/features/auth/types/auth";

const GENERIC_ERROR_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";

const REDIRECT_MESSAGES: Record<string, string> = {
  session: "Sesi Anda berakhir atau akun tidak aktif. Silakan masuk kembali.",
};

export function LoginForm() {
  const reason = useSearchParams().get("reason");
  const redirectMessage = reason ? REDIRECT_MESSAGES[reason] : undefined;
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: "", password: "" },
    mode: "onTouched",
  });

  const onSubmit = async (values: LoginInput) => {
    try {
      // The action redirects on success, so a result only comes back on failure.
      const result = await loginAction(values);
      if (result?.error) setError("root", { message: result.error });
    } catch {
      setError("root", { message: GENERIC_ERROR_MESSAGE });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
      {!errors.root?.message && redirectMessage ? (
        <Alert>
          <CircleAlertIcon />
          <AlertDescription>{redirectMessage}</AlertDescription>
        </Alert>
      ) : null}

      {errors.root?.message ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <div className="relative">
          <MailIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="nama@stiaamuntai.ac.id"
            className="h-11 bg-card pl-9 transition-colors hover:border-primary/40"
            aria-invalid={errors.email ? true : undefined}
            aria-describedby={errors.email ? "email-error" : undefined}
            {...register("email")}
          />
        </div>
        {errors.email ? (
          <p id="email-error" className="text-sm text-destructive">
            {errors.email.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <LockKeyholeIcon className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password"
            className="h-11 bg-card pr-10 pl-9 transition-colors hover:border-primary/40"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground hover:bg-secondary hover:text-primary"
            onClick={() => setPasswordVisible((visible) => !visible)}
            aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
            aria-pressed={isPasswordVisible}
          >
            {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
          </Button>
        </div>
        {errors.password ? (
          <p id="password-error" className="text-sm text-destructive">
            {errors.password.message}
          </p>
        ) : null}
      </div>

      <Button type="submit" size="lg" className="h-11 w-full hover:bg-primary/90" disabled={isSubmitting}>
        {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
