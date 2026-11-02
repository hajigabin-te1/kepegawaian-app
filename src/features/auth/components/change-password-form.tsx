"use client";

import { useState } from "react";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CircleAlertIcon, EyeIcon, EyeOffIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { changePasswordAction } from "@/features/auth/actions";
import { changePasswordSchema, type ChangePasswordInput } from "@/features/auth/schemas/change-password-schema";

const EMPTY_VALUES: ChangePasswordInput = { currentPassword: "", newPassword: "", confirmPassword: "" };

type PasswordFieldProps = {
  id: string;
  label: string;
  autoComplete: string;
  error?: string;
  hint?: string;
  registration: UseFormRegisterReturn;
};

function PasswordField({ id, label, autoComplete, error, hint, registration }: PasswordFieldProps) {
  const [isVisible, setVisible] = useState(false);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={isVisible ? "text" : "password"}
          autoComplete={autoComplete}
          className="h-10 pr-10"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          {...registration}
        />
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
          onClick={() => setVisible((visible) => !visible)}
          aria-label={isVisible ? "Sembunyikan password" : "Tampilkan password"}
          aria-pressed={isVisible}
        >
          {isVisible ? <EyeOffIcon /> : <EyeIcon />}
        </Button>
      </div>
      {error ? (
        <p id={`${id}-error`} className="text-sm text-destructive">
          {error}
        </p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

export function ChangePasswordForm() {
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ChangePasswordInput>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_VALUES,
    mode: "onTouched",
  });

  const onSubmit = async (values: ChangePasswordInput) => {
    try {
      const result = await changePasswordAction(values);
      if (!result.ok) {
        setError("root", { message: result.error });
        return;
      }
      reset(EMPTY_VALUES);
      toast.success("Password berhasil diganti.", { description: "Gunakan password baru saat masuk berikutnya." });
    } catch {
      setError("root", { message: "Password gagal diganti. Silakan coba lagi." });
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

      <PasswordField
        id="current-password"
        label="Password lama"
        autoComplete="current-password"
        error={errors.currentPassword?.message}
        registration={register("currentPassword")}
      />
      <PasswordField
        id="new-password"
        label="Password baru"
        autoComplete="new-password"
        error={errors.newPassword?.message}
        hint="Minimal 8 karakter. Gunakan kombinasi huruf dan angka."
        registration={register("newPassword")}
      />
      <PasswordField
        id="confirm-password"
        label="Ulangi password baru"
        autoComplete="new-password"
        error={errors.confirmPassword?.message}
        registration={register("confirmPassword")}
      />

      <div className="flex justify-end">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {isSubmitting ? "Menyimpan..." : "Simpan Password"}
        </Button>
      </div>
    </form>
  );
}
