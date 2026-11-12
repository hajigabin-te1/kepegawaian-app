"use client";

import { useState } from "react";
import { LogInIcon, LogOutIcon, Loader2Icon, MapPinIcon, MapPinOffIcon } from "lucide-react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AttendanceStatusBadge, formatDate, formatTime } from "@/features/attendance/components/attendance-format";
import { useCheckInOut, useTodayRecord } from "@/features/attendance/hooks/use-attendance";
import { todayInCampus } from "@/features/attendance/services/attendance-service";
import type { Coordinates } from "@/features/attendance/types/attendance";
import { ApiError } from "@/lib/api-error";

const OUT_OF_AREA = "Tidak bisa melakukan presensi";

function readPosition(): Promise<Coordinates> {
  return new Promise((resolve, reject) => {
    if (!("geolocation" in navigator)) {
      reject(new ApiError("Peramban Anda tidak mendukung GPS.", null, null));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: Number(position.coords.latitude.toFixed(6)),
          longitude: Number(position.coords.longitude.toFixed(6)),
          accuracy: Number.isFinite(position.coords.accuracy) ? Number(position.coords.accuracy.toFixed(1)) : null,
        }),
      (error) =>
        reject(
          new ApiError(
            error.code === error.PERMISSION_DENIED
              ? "Izin lokasi ditolak. Aktifkan izin lokasi pada peramban untuk presensi."
              : "Lokasi tidak dapat dibaca. Pastikan GPS aktif lalu coba lagi.",
            null,
            error,
          ),
        ),
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

export function CheckInCard({ employeeId }: { employeeId: string }) {
  const date = todayInCampus();
  const today = useTodayRecord(employeeId, date);
  const checkInOut = useCheckInOut();
  const [locating, setLocating] = useState(false);
  const [outOfArea, setOutOfArea] = useState(false);

  const record = today.data;
  const kind = record?.checkInAt ? "out" : "in";
  const done = Boolean(record?.checkOutAt);
  const busy = locating || checkInOut.isPending;

  const submit = async () => {
    setOutOfArea(false);
    setLocating(true);
    try {
      const coords = await readPosition();
      setLocating(false);
      checkInOut.mutate(
        { kind, coords },
        {
          onSuccess: () => toast.success(kind === "in" ? "Presensi masuk tercatat." : "Presensi pulang tercatat."),
          onError: (error) => {
            const message = error instanceof ApiError ? error.message : "Presensi gagal. Silakan coba lagi.";
            if (message === OUT_OF_AREA) setOutOfArea(true);
            else toast.error(message);
          },
        },
      );
    } catch (error) {
      setLocating(false);
      toast.error(error instanceof ApiError ? error.message : "Lokasi tidak dapat dibaca.");
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Presensi hari ini</CardTitle>
        <CardDescription>{formatDate(date)}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {today.isPending ? (
          <Skeleton className="h-16 w-full" />
        ) : (
          <dl className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <dt className="text-muted-foreground">Datang</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatTime(record?.checkInAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pulang</dt>
              <dd className="text-lg font-semibold tabular-nums">{formatTime(record?.checkOutAt ?? null)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Status</dt>
              <dd className="pt-1">{record ? <AttendanceStatusBadge status={record.status} /> : <span>Belum presensi</span>}</dd>
            </div>
          </dl>
        )}

        {outOfArea ? (
          <Alert variant="destructive">
            <MapPinOffIcon />
            <AlertTitle>{OUT_OF_AREA}</AlertTitle>
            <AlertDescription>Anda berada di luar radius titik presensi kampus.</AlertDescription>
          </Alert>
        ) : null}

        <Button onClick={() => void submit()} disabled={busy || today.isPending || today.isError || done} className="w-full sm:w-auto">
          {busy ? <Loader2Icon className="animate-spin" /> : kind === "in" ? <LogInIcon /> : <LogOutIcon />}
          {locating ? "Membaca lokasi…" : done ? "Presensi hari ini selesai" : kind === "in" ? "Presensi Masuk" : "Presensi Pulang"}
        </Button>
        <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <MapPinIcon className="size-3.5" />
          Presensi memakai lokasi GPS peramban dan hanya bisa dilakukan di area kampus.
        </p>
      </CardContent>
    </Card>
  );
}
