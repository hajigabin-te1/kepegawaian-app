"use client";

import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2Icon } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveAttendanceLocation } from "@/features/settings/hooks/use-settings";
import { attendanceLocationSchema, type AttendanceLocationFormValues } from "@/features/settings/schemas/settings-schemas";
import type { AttendanceLocation } from "@/features/settings/types/settings";
import { ApiError } from "@/lib/api-error";

const STATUS_ITEMS = { active: "Aktif", inactive: "Nonaktif" };

type AttendanceLocationDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Location being edited, or null to add one. */
  location: AttendanceLocation | null;
};

export function AttendanceLocationDialog({ open, onOpenChange, location }: AttendanceLocationDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        {open ? <LocationForm key={location?.id ?? "new"} location={location} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}

function LocationForm({ location, onDone }: { location: AttendanceLocation | null; onDone: () => void }) {
  const save = useSaveAttendanceLocation();
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AttendanceLocationFormValues>({
    resolver: zodResolver(attendanceLocationSchema),
    defaultValues: location
      ? {
          name: location.name,
          latitude: String(location.latitude),
          longitude: String(location.longitude),
          radiusMeters: String(location.radiusMeters),
          isActive: location.isActive,
        }
      : { name: "", latitude: "", longitude: "", radiusMeters: "100", isActive: true },
  });

  const onSubmit = (values: AttendanceLocationFormValues) => {
    save.mutate(
      { id: location?.id ?? null, values },
      {
        onSuccess: () => {
          toast.success(location ? "Lokasi presensi diperbarui." : "Lokasi presensi ditambahkan.");
          onDone();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Gagal menyimpan lokasi presensi."),
      },
    );
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle>{location ? "Ubah Lokasi Presensi" : "Tambah Lokasi Presensi"}</DialogTitle>
        <DialogDescription>
          Presensi diterima jika posisi GPS pegawai berada dalam radius dari titik ini. Koordinat bisa disalin dari Google Maps.
        </DialogDescription>
      </DialogHeader>

      <form id="attendance-location-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="location-name">
            Nama lokasi<span className="text-destructive">*</span>
          </Label>
          <Input id="location-name" placeholder="mis. Kampus STIA Amuntai" aria-invalid={errors.name ? true : undefined} {...register("name")} />
          {errors.name ? <p className="text-sm text-destructive">{errors.name.message}</p> : null}
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="location-latitude">
              Latitude<span className="text-destructive">*</span>
            </Label>
            <Input id="location-latitude" inputMode="decimal" placeholder="-2.422180" className="tabular-nums" aria-invalid={errors.latitude ? true : undefined} {...register("latitude")} />
            {errors.latitude ? <p className="text-sm text-destructive">{errors.latitude.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-longitude">
              Longitude<span className="text-destructive">*</span>
            </Label>
            <Input id="location-longitude" inputMode="decimal" placeholder="115.262310" className="tabular-nums" aria-invalid={errors.longitude ? true : undefined} {...register("longitude")} />
            {errors.longitude ? <p className="text-sm text-destructive">{errors.longitude.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label htmlFor="location-radius">
              Radius (meter)<span className="text-destructive">*</span>
            </Label>
            <Input id="location-radius" inputMode="numeric" className="tabular-nums" aria-invalid={errors.radiusMeters ? true : undefined} {...register("radiusMeters")} />
            {errors.radiusMeters ? <p className="text-sm text-destructive">{errors.radiusMeters.message}</p> : null}
          </div>
          <div className="space-y-2">
            <Label>Status</Label>
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <Select items={STATUS_ITEMS} value={field.value ? "active" : "inactive"} onValueChange={(value) => field.onChange(value === "active")}>
                  <SelectTrigger className="w-full" aria-label="Status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Aktif</SelectItem>
                    <SelectItem value="inactive">Nonaktif</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </form>

      <DialogFooter>
        <Button variant="outline" onClick={onDone} disabled={save.isPending}>
          Batal
        </Button>
        <Button type="submit" form="attendance-location-form" disabled={save.isPending}>
          {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
          Simpan
        </Button>
      </DialogFooter>
    </>
  );
}
