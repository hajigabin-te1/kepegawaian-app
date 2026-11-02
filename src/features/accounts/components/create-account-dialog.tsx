"use client";

import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCreateAccount } from "@/features/accounts/hooks/use-accounts";
import {
  generateTemporaryPassword,
  newAccountSchema,
  type NewAccountFormValues,
} from "@/features/accounts/schemas/account-schemas";
import type { Role } from "@/features/accounts/types/accounts";
import { ApiError } from "@/lib/api-error";

const DEFAULT_ROLE_CODE = "employee";

type CreateAccountDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  roles: Role[];
};

export function CreateAccountDialog({ open, onOpenChange, roles }: CreateAccountDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {/* Mounted only while open so each opening starts with an empty form. */}
        {open ? <CreateAccountForm roles={roles} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function CreateAccountForm({ roles, onDone }: { roles: Role[]; onDone: () => void }) {
  const createAccount = useCreateAccount();
  const [isPasswordVisible, setPasswordVisible] = useState(false);
  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<NewAccountFormValues>({
    resolver: zodResolver(newAccountSchema),
    defaultValues: { email: "", roleCode: DEFAULT_ROLE_CODE, temporaryPassword: "" },
  });

  const roleItems = Object.fromEntries(roles.map((role) => [role.code, role.name]));

  const onSubmit = (values: NewAccountFormValues) => {
    createAccount.mutate(values, {
      onSuccess: () => {
        toast.success("Akun dibuat.", {
          description: "Berikan email dan password sementara kepada pemilik akun secara langsung.",
        });
        onDone();
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Akun gagal dibuat."),
    });
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>Tambah Akun</DialogTitle>
        <DialogDescription>
          Akun langsung aktif dan dapat dipakai masuk dengan email dan password sementara di bawah.
        </DialogDescription>
      </DialogHeader>

      <form id="create-account-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="new-account-email">Email</Label>
          <Input
            id="new-account-email"
            type="email"
            autoComplete="off"
            placeholder="nama@stiaamuntai.ac.id"
            aria-invalid={errors.email ? true : undefined}
            {...register("email")}
          />
          {errors.email ? <p className="text-sm text-destructive">{errors.email.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label>Peran</Label>
          <Controller
            control={control}
            name="roleCode"
            render={({ field }) => (
              <Select items={roleItems} value={field.value} onValueChange={(value) => value && field.onChange(value)}>
                <SelectTrigger className="w-full" aria-label="Peran">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.code} value={role.code}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.roleCode ? <p className="text-sm text-destructive">{errors.roleCode.message}</p> : null}
        </div>

        <div className="space-y-2">
          <Label htmlFor="new-account-password">Password sementara</Label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Input
                id="new-account-password"
                type={isPasswordVisible ? "text" : "password"}
                autoComplete="new-password"
                className="pr-10 font-mono"
                aria-invalid={errors.temporaryPassword ? true : undefined}
                {...register("temporaryPassword")}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="absolute top-1/2 right-1 -translate-y-1/2 text-muted-foreground"
                onClick={() => setPasswordVisible((visible) => !visible)}
                aria-label={isPasswordVisible ? "Sembunyikan password" : "Tampilkan password"}
              >
                {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
              </Button>
            </div>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setValue("temporaryPassword", generateTemporaryPassword(), { shouldValidate: true });
                setPasswordVisible(true);
              }}
            >
              <WandSparklesIcon />
              Buat
            </Button>
          </div>
          {errors.temporaryPassword ? (
            <p className="text-sm text-destructive">{errors.temporaryPassword.message}</p>
          ) : (
            <p className="text-xs text-muted-foreground">Minimal 8 karakter. Catat sebelum menyimpan.</p>
          )}
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={createAccount.isPending}>
          Batal
        </Button>
        <Button type="submit" form="create-account-form" disabled={createAccount.isPending}>
          {createAccount.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Buat Akun
        </Button>
      </DialogFooter>
    </>
  );
}
