"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/actions";
import { loginSchema } from "@/features/auth/schemas/login-schema";
import type { LoginInput } from "@/features/auth/types/auth";

const GENERIC_ERROR_MESSAGE = "Terjadi kesalahan. Silakan coba lagi.";

export function LoginForm() {
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: "", password: "" },
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
      {errors.root?.message ? (
        <Alert variant="destructive">
          <CircleAlertIcon />
          <AlertDescription>{errors.root.message}</AlertDescription>
        </Alert>
      ) : null}

      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          autoComplete="username"
          placeholder="Masukkan username"
          className="h-10 bg-card"
          aria-invalid={errors.username ? true : undefined}
          aria-describedby={errors.username ? "username-error" : undefined}
          {...register("username")}
        />
        {errors.username ? (
          <p id="username-error" className="text-sm text-destructive">
            {errors.username.message}
          </p>
        ) : null}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <div className="relative">
          <Input
            id="password"
            type={isPasswordVisible ? "text" : "password"}
            autoComplete="current-password"
            placeholder="Masukkan password"
            className="h-10 bg-card pr-10"
            aria-invalid={errors.password ? true : undefined}
            aria-describedby={errors.password ? "password-error" : undefined}
            {...register("password")}
          />
          <Button
            type="button"
            variant="ghost"
            size="icon-sm"
            className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
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

      <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
        {isSubmitting ? "Memproses..." : "Masuk"}
      </Button>
    </form>
  );
}
