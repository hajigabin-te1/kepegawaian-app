"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Controller, useForm, useWatch, type Control, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { EyeIcon, EyeOffIcon, Loader2Icon, WandSparklesIcon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { routes } from "@/config/routes";
import { generateTemporaryPassword } from "@/features/accounts/schemas/account-schemas";
import {
  useCreateEmployee,
  useCreateEmployeeAccount,
  useEmploymentStatuses,
  useUpdateEmployee,
} from "@/features/employees/hooks/use-employees";
import {
  createEmployeeFormSchema,
  type CreateEmployeeFormValues,
  type EmployeeFormValues,
} from "@/features/employees/schemas/employee-schema";
import {
  CATEGORY_LABELS,
  GENDER_LABELS,
  MARITAL_STATUS_LABELS,
  RELIGION_OPTIONS,
  type EmployeeDetail,
} from "@/features/employees/types/employee";
import { usePositions, useWorkUnits } from "@/features/master-data/hooks/use-master-data";
import { ApiError } from "@/lib/api-error";

const NONE = "";

type EmployeeFormProps = { mode: "create" } | { mode: "edit"; employee: EmployeeDetail };

function toFormValues(employee: EmployeeDetail | null): CreateEmployeeFormValues {
  const text = (value: string | null) => value ?? "";
  const number = (value: number | null) => (value === null ? "" : String(value));
  return {
    fullName: text(employee?.fullName ?? null),
    category: employee?.category ?? "lecturer",
    workUnitId: text(employee?.workUnitId ?? null),
    employeeNumber: text(employee?.employeeNumber ?? null),
    lecturerNumber: text(employee?.lecturerNumber ?? null),
    nationalIdNumber: text(employee?.nationalIdNumber ?? null),
    birthPlace: text(employee?.birthPlace ?? null),
    birthDate: text(employee?.birthDate ?? null),
    gender: employee?.gender ?? "",
    religion: text(employee?.religion ?? null),
    maritalStatus: employee?.maritalStatus ?? "",
    address: text(employee?.address ?? null),
    city: text(employee?.city ?? null),
    province: text(employee?.province ?? null),
    postalCode: text(employee?.postalCode ?? null),
    phone: text(employee?.phone ?? null),
    email: text(employee?.email ?? null),
    employmentStatusCode: text(employee?.employmentStatusCode ?? null),
    appointmentDate: text(employee?.appointmentDate ?? null),
    positionId: text(employee?.positionId ?? null),
    rankGrade: text(employee?.rankGrade ?? null),
    serviceYears: number(employee?.serviceYears ?? null),
    serviceMonths: number(employee?.serviceMonths ?? null),
    createAccount: false,
    temporaryPassword: "",
  };
}

function Field({ id, label, error, required, hint, children }: {
  id?: string;
  label: string;
  error?: string;
  required?: boolean;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="text-destructive">*</span> : null}
      </Label>
      {children}
      {error ? <p className="text-sm text-destructive">{error}</p> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function SelectField({ control, name, label, items, placeholder, required, error }: {
  control: Control<CreateEmployeeFormValues>;
  name: FieldPath<CreateEmployeeFormValues>;
  label: string;
  items: Record<string, string>;
  placeholder: string;
  required?: boolean;
  error?: string;
}) {
  const allItems = required ? items : { [NONE]: placeholder, ...items };
  return (
    <Field label={label} required={required} error={error}>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select items={allItems} value={String(field.value)} onValueChange={(value) => field.onChange(value ?? NONE)}>
            <SelectTrigger className="w-full" aria-label={label} aria-invalid={error ? true : undefined}>
              <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(allItems).map(([value, itemLabel]) => (
                <SelectItem key={value || "none"} value={value}>
                  {itemLabel}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      />
    </Field>
  );
}

function FormSection({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 sm:grid-cols-2">{children}</CardContent>
    </Card>
  );
}

export function EmployeeForm(props: EmployeeFormProps) {
  const router = useRouter();
  const employee = props.mode === "edit" ? props.employee : null;
  const workUnits = useWorkUnits();
  const positions = usePositions();
  const employmentStatuses = useEmploymentStatuses();
  const createEmployee = useCreateEmployee();
  const updateEmployee = useUpdateEmployee(employee?.id ?? "");
  const createAccount = useCreateEmployeeAccount();
  const [isPasswordVisible, setPasswordVisible] = useState(false);

  const {
    register,
    control,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<CreateEmployeeFormValues>({
    resolver: zodResolver(createEmployeeFormSchema),
    defaultValues: toFormValues(employee),
  });
  const wantsAccount = useWatch({ control, name: "createAccount" });

  // Inactive units and positions stay selectable only when already assigned.
  const unitItems = Object.fromEntries(
    (workUnits.data ?? []).filter((unit) => unit.isActive || unit.id === employee?.workUnitId).map((unit) => [unit.id, unit.name]),
  );
  const positionItems = Object.fromEntries(
    (positions.data ?? []).filter((item) => item.isActive || item.id === employee?.positionId).map((item) => [item.id, item.name]),
  );
  const statusItems = Object.fromEntries((employmentStatuses.data ?? []).map((status) => [status.code, status.name]));
  const religionItems = Object.fromEntries(RELIGION_OPTIONS.map((religion) => [religion, religion]));

  const onSubmit = async (values: CreateEmployeeFormValues) => {
    const { createAccount: withAccount, temporaryPassword, ...employeeValues } = values;
    const formValues: EmployeeFormValues = employeeValues;
    try {
      if (!employee) {
        const id = await createEmployee.mutateAsync(formValues);
        if (withAccount) {
          try {
            await createAccount.mutateAsync({ employeeId: id, email: formValues.email, temporaryPassword });
            toast.success("Pegawai dan akun login ditambahkan.", {
              description: "Berikan email dan password sementara kepada pegawai secara langsung.",
            });
          } catch (error) {
            toast.warning("Data pegawai tersimpan, tetapi akun login gagal dibuat.", {
              description: `${error instanceof ApiError ? error.message : "Silakan coba lagi."} Akun dapat dibuat dari halaman detail.`,
            });
          }
        } else {
          toast.success("Pegawai ditambahkan.");
        }
        router.push(routes.employees.detail(id));
      } else {
        await updateEmployee.mutateAsync(formValues);
        toast.success("Data pegawai diperbarui.");
        router.push(routes.employees.detail(employee.id));
      }
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Data pegawai gagal disimpan.");
    }
  };

  const cancelHref = employee ? routes.employees.detail(employee.id) : routes.employees.list;

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <FormSection title="Data pokok" description="Identitas pegawai. Kolom bertanda * wajib diisi.">
        <div className="sm:col-span-2">
          <Field id="full-name" label="Nama lengkap (dengan gelar)" required error={errors.fullName?.message}>
            <Input id="full-name" placeholder="mis. Dr. Siti Rahmawati, M.Si." {...register("fullName")} aria-invalid={errors.fullName ? true : undefined} />
          </Field>
        </div>
        <SelectField control={control} name="category" label="Kategori" items={CATEGORY_LABELS} placeholder="Pilih kategori" required error={errors.category?.message} />
        <Field id="national-id" label="NIK" error={errors.nationalIdNumber?.message} hint="16 digit sesuai KTP.">
          <Input id="national-id" inputMode="numeric" className="tabular-nums" {...register("nationalIdNumber")} />
        </Field>
        <Field id="employee-number" label="NIP" error={errors.employeeNumber?.message}>
          <Input id="employee-number" inputMode="numeric" className="tabular-nums" {...register("employeeNumber")} />
        </Field>
        <Field id="lecturer-number" label="NIDN" error={errors.lecturerNumber?.message} hint="Khusus dosen.">
          <Input id="lecturer-number" inputMode="numeric" className="tabular-nums" {...register("lecturerNumber")} />
        </Field>
        <Field id="birth-place" label="Tempat lahir" error={errors.birthPlace?.message}>
          <Input id="birth-place" {...register("birthPlace")} />
        </Field>
        <Field id="birth-date" label="Tanggal lahir">
          <Input id="birth-date" type="date" {...register("birthDate")} />
        </Field>
        <SelectField control={control} name="gender" label="Jenis kelamin" items={GENDER_LABELS} placeholder="Belum diisi" />
        <SelectField control={control} name="religion" label="Agama" items={religionItems} placeholder="Belum diisi" />
        <SelectField control={control} name="maritalStatus" label="Status perkawinan" items={MARITAL_STATUS_LABELS} placeholder="Belum diisi" />
      </FormSection>

      <FormSection title="Kontak & alamat" description="Dipakai untuk komunikasi dan akun login.">
        <Field id="email" label="Email" error={errors.email?.message}>
          <Input id="email" type="email" placeholder="nama@stiaamuntai.ac.id" {...register("email")} />
        </Field>
        <Field id="phone" label="No. HP" error={errors.phone?.message}>
          <Input id="phone" inputMode="tel" placeholder="08xxxxxxxxxx" className="tabular-nums" {...register("phone")} />
        </Field>
        <div className="sm:col-span-2">
          <Field id="address" label="Alamat" error={errors.address?.message}>
            <Input id="address" {...register("address")} />
          </Field>
        </div>
        <Field id="city" label="Kota/Kabupaten" error={errors.city?.message}>
          <Input id="city" {...register("city")} />
        </Field>
        <Field id="province" label="Provinsi" error={errors.province?.message}>
          <Input id="province" {...register("province")} />
        </Field>
        <Field id="postal-code" label="Kode pos" error={errors.postalCode?.message}>
          <Input id="postal-code" inputMode="numeric" className="tabular-nums" {...register("postalCode")} />
        </Field>
      </FormSection>

      <FormSection title="Data kepegawaian" description="Unit kerja, jabatan, dan status kepegawaian.">
        <SelectField control={control} name="workUnitId" label="Unit kerja" items={unitItems} placeholder="Pilih unit kerja" required error={errors.workUnitId?.message} />
        <SelectField control={control} name="positionId" label="Jabatan" items={positionItems} placeholder="Belum diisi" />
        <SelectField control={control} name="employmentStatusCode" label="Status kepegawaian" items={statusItems} placeholder="Belum diisi" />
        <Field id="appointment-date" label="Tanggal pengangkatan">
          <Input id="appointment-date" type="date" {...register("appointmentDate")} />
        </Field>
        <Field id="rank-grade" label="Golongan" error={errors.rankGrade?.message}>
          <Input id="rank-grade" placeholder="mis. III/a" {...register("rankGrade")} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field id="service-years" label="Masa kerja (tahun)" error={errors.serviceYears?.message}>
            <Input id="service-years" inputMode="numeric" className="tabular-nums" {...register("serviceYears")} />
          </Field>
          <Field id="service-months" label="(bulan)" error={errors.serviceMonths?.message}>
            <Input id="service-months" inputMode="numeric" className="tabular-nums" {...register("serviceMonths")} />
          </Field>
        </div>
      </FormSection>

      {employee ? null : (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Akun login</CardTitle>
            <CardDescription>Opsional. Akun berperan Pegawai, masuk dengan email di atas.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <label className="flex items-start gap-3 text-sm">
              <input type="checkbox" className="mt-0.5 size-4 accent-primary" {...register("createAccount")} />
              <span>
                <span className="font-medium">Buatkan akun login untuk pegawai ini</span>
                <span className="block text-xs text-muted-foreground">Pegawai dapat mengganti password setelah masuk.</span>
              </span>
            </label>
            {wantsAccount ? (
              <Field id="temporary-password" label="Password sementara" required error={errors.temporaryPassword?.message} hint="Catat sebelum menyimpan.">
                <div className="flex max-w-md gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="temporary-password"
                      type={isPasswordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      className="pr-10 font-mono"
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
              </Field>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button variant="outline" nativeButton={false} render={<Link href={cancelHref} />}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? <Loader2Icon className="animate-spin" /> : null}
          {employee ? "Simpan Perubahan" : "Simpan Pegawai"}
        </Button>
      </div>
    </form>
  );
}
