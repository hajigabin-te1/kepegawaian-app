"use client";

import Link from "next/link";
import { useFieldArray, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowLeftIcon, ClipboardXIcon, Loader2Icon, PlusIcon, SendIcon, Trash2Icon } from "lucide-react";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { PageHeader } from "@/components/layout/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { routes } from "@/config/routes";
import { AppraisalStatusBadge, formatScore } from "@/features/performance/components/appraisal-parts";
import { useAppraisal, useMaxScore, useSaveAppraisal, useSubmitAppraisal } from "@/features/performance/hooks/use-performance";
import { appraisalSchema, type AppraisalFormValues } from "@/features/performance/schemas/performance-schemas";
import type { AppraisalDetail } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

const EMPTY_ITEM = { indicator: "", target: "", realization: "", score: "" };

/** Same rule as compute_appraisal_score() in the database: average of the scored indicators. */
function averageScore(items: { score: string }[]): number | null {
  const scores = items.map((i) => Number(i.score.replace(",", "."))).filter((n, index) => items[index].score.trim() !== "" && Number.isFinite(n));
  return scores.length === 0 ? null : Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100;
}

function AppraisalEditor({ appraisal, maxScore }: { appraisal: AppraisalDetail; maxScore: number }) {
  const save = useSaveAppraisal(appraisal.id);
  const submit = useSubmitAppraisal(appraisal.id);
  const editable = appraisal.status === "draft" || appraisal.status === "revision_requested";
  const pending = save.isPending || submit.isPending;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<AppraisalFormValues>({
    resolver: zodResolver(appraisalSchema(maxScore)),
    defaultValues: { note: appraisal.note, items: appraisal.items.length > 0 ? appraisal.items : [{ ...EMPTY_ITEM }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: "items" });
  const watchedItems = useWatch({ control, name: "items" });
  const preview = averageScore(watchedItems ?? []);

  const failed = (error: unknown) => toast.error(error instanceof ApiError ? error.message : "Penilaian gagal disimpan.");

  const onSave = (values: AppraisalFormValues) =>
    save.mutate(values, { onSuccess: () => toast.success("Draf tersimpan."), onError: failed });

  const onSubmit = (values: AppraisalFormValues) => {
    if (values.items.length === 0 || values.items.some((item) => item.score.trim() === "")) {
      toast.error("Semua indikator harus diberi nilai sebelum dikirim.");
      return;
    }
    submit.mutate(values, { onSuccess: () => toast.success("Penilaian dikirim untuk verifikasi."), onError: failed });
  };

  return (
    <form onSubmit={handleSubmit(onSave)} noValidate className="space-y-6">
      {appraisal.status === "revision_requested" && appraisal.revisionNote ? (
        <Alert variant="destructive">
          <AlertTitle>Dikembalikan untuk revisi</AlertTitle>
          <AlertDescription>{appraisal.revisionNote}</AlertDescription>
        </Alert>
      ) : null}

      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-4">
          <CardTitle className="text-lg font-semibold">Indikator kinerja</CardTitle>
          <p className="text-sm text-muted-foreground">
            Nilai akhir: <span className="text-lg font-semibold tabular-nums text-foreground">{formatScore(editable ? preview : appraisal.score)}</span>{" "}
            <span className="text-xs">(rata-rata, skala 0–{maxScore})</span>
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {fields.map((field, index) => (
            <div key={field.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-[2fr_1fr_1fr_6rem_auto]">
              <div className="space-y-1.5">
                <Label htmlFor={`indicator-${index}`}>Indikator</Label>
                <Input id={`indicator-${index}`} readOnly={!editable} aria-invalid={errors.items?.[index]?.indicator ? true : undefined} {...register(`items.${index}.indicator`)} />
                {errors.items?.[index]?.indicator ? <p className="text-sm text-destructive">{errors.items[index]?.indicator?.message}</p> : null}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`target-${index}`}>Target</Label>
                <Input id={`target-${index}`} readOnly={!editable} {...register(`items.${index}.target`)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`realization-${index}`}>Realisasi</Label>
                <Input id={`realization-${index}`} readOnly={!editable} {...register(`items.${index}.realization`)} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor={`score-${index}`}>Nilai</Label>
                <Input id={`score-${index}`} inputMode="decimal" readOnly={!editable} aria-invalid={errors.items?.[index]?.score ? true : undefined} {...register(`items.${index}.score`)} />
                {errors.items?.[index]?.score ? <p className="text-sm text-destructive">{errors.items[index]?.score?.message}</p> : null}
              </div>
              {editable ? (
                <div className="flex items-end">
                  <Button type="button" variant="ghost" size="icon-sm" aria-label={`Hapus indikator ${index + 1}`} className="text-destructive hover:text-destructive" onClick={() => remove(index)}>
                    <Trash2Icon />
                  </Button>
                </div>
              ) : null}
            </div>
          ))}
          {editable ? (
            <Button type="button" variant="outline" size="sm" onClick={() => append({ ...EMPTY_ITEM })}>
              <PlusIcon />
              Tambah indikator
            </Button>
          ) : null}
        </CardContent>
      </Card>

      <div className="space-y-2">
        <Label htmlFor="appraisal-note">Catatan penilaian</Label>
        <Input id="appraisal-note" readOnly={!editable} aria-invalid={errors.note ? true : undefined} {...register("note")} />
        {errors.note ? <p className="text-sm text-destructive">{errors.note.message}</p> : null}
      </div>

      {editable ? (
        <div className="flex flex-wrap justify-end gap-2">
          <Button type="submit" variant="outline" disabled={pending}>
            {save.isPending ? <Loader2Icon className="animate-spin" /> : null}
            Simpan draf
          </Button>
          <Button type="button" disabled={pending} onClick={() => void handleSubmit(onSubmit)()}>
            {submit.isPending ? <Loader2Icon className="animate-spin" /> : <SendIcon />}
            Kirim untuk verifikasi
          </Button>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          {appraisal.status === "submitted" ? "Form menunggu verifikasi dan tidak bisa diubah." : "Form sudah diverifikasi dan dikunci."}
        </p>
      )}
    </form>
  );
}

export function AppraisalFormPage({ id }: { id: string }) {
  const appraisal = useAppraisal(id);
  const maxScore = useMaxScore();

  if (appraisal.isPending || maxScore.isPending) return <Skeleton className="h-96 w-full" />;
  if (appraisal.isError) return <QueryErrorState error={appraisal.error} onRetry={() => void appraisal.refetch()} />;
  if (!appraisal.data) {
    return (
      <Card>
        <EmptyState
          icon={ClipboardXIcon}
          title="Form tidak ditemukan"
          description="Form penilaian tidak ada atau Anda tidak memiliki akses."
          action={
            <Button variant="outline" size="sm" nativeButton={false} render={<Link href={routes.performance.forms} />}>
              Kembali ke daftar
            </Button>
          }
        />
      </Card>
    );
  }

  const data = appraisal.data;
  return (
    <>
      <PageHeader
        title={data.employeeName}
        description={data.periodName}
        breadcrumbs={[
          { label: "Beranda", href: routes.dashboard },
          { label: "Form Penilaian", href: routes.performance.forms },
          { label: data.employeeName },
        ]}
        actions={
          <>
            <AppraisalStatusBadge status={data.status} />
            <Button variant="outline" nativeButton={false} render={<Link href={routes.performance.forms} />}>
              <ArrowLeftIcon />
              Kembali
            </Button>
          </>
        }
      />
      <AppraisalEditor key={`${data.id}-${data.status}`} appraisal={data} maxScore={maxScore.data ?? 100} />
    </>
  );
}
