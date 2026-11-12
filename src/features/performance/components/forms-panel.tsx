"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, ClipboardListIcon, Loader2Icon, PencilLineIcon, UndoIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { AppraisalStatusBadge, PeriodSelect, formatScore } from "@/features/performance/components/appraisal-parts";
import { useAppraisalList, usePeriods, useReviewAppraisal } from "@/features/performance/hooks/use-performance";
import { reviewSchema, type ReviewFormValues } from "@/features/performance/schemas/performance-schemas";
import { APPRAISAL_STATUS_LABELS, type AppraisalListItem, type AppraisalStatus } from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

const FILTERS: { value: AppraisalStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  ...(Object.keys(APPRAISAL_STATUS_LABELS) as AppraisalStatus[]).map((value) => ({ value, label: APPRAISAL_STATUS_LABELS[value] })),
];

type Review = { item: AppraisalListItem; accept: boolean };

function ReviewDialog({ review, onClose }: { review: Review | null; onClose: () => void }) {
  const reviewMutation = useReviewAppraisal();
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors },
  } = useForm<ReviewFormValues>({ resolver: zodResolver(reviewSchema), defaultValues: { note: "" } });

  const close = () => {
    reset({ note: "" });
    onClose();
  };

  const onSubmit = ({ note }: ReviewFormValues) => {
    if (!review) return;
    if (!review.accept && note === "") {
      setError("note", { message: "Alasan pengembalian wajib diisi." });
      return;
    }
    reviewMutation.mutate(
      { id: review.item.id, accept: review.accept, note },
      {
        onSuccess: () => {
          toast.success(review.accept ? "Penilaian diverifikasi." : "Penilaian dikembalikan untuk revisi.");
          close();
        },
        onError: (error) => toast.error(error instanceof ApiError ? error.message : "Keputusan gagal disimpan."),
      },
    );
  };

  const accept = review?.accept ?? true;
  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && !reviewMutation.isPending && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accept ? "Verifikasi penilaian?" : "Kembalikan untuk revisi?"}</DialogTitle>
          <DialogDescription>
            {accept
              ? `Nilai ${review?.item.employeeName ?? "pegawai"} dikunci dan pegawai dapat melihat hasilnya.`
              : "Form kembali ke status perlu revisi dan bisa diisi ulang."}
          </DialogDescription>
        </DialogHeader>
        {accept ? null : (
          <form id="review-form" onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-2">
            <Label htmlFor="review-note">Alasan pengembalian</Label>
            <Input id="review-note" aria-invalid={errors.note ? true : undefined} {...register("note")} />
            {errors.note ? <p className="text-sm text-destructive">{errors.note.message}</p> : null}
          </form>
        )}
        <DialogFooter>
          <Button variant="outline" onClick={close} disabled={reviewMutation.isPending}>
            Batal
          </Button>
          {accept ? (
            <Button onClick={() => onSubmit({ note: "" })} disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
              Verifikasi
            </Button>
          ) : (
            <Button type="submit" form="review-form" variant="destructive" disabled={reviewMutation.isPending}>
              {reviewMutation.isPending ? <Loader2Icon className="animate-spin" /> : null}
              Kembalikan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function FormsPanel() {
  const periods = usePeriods();
  const [chosenPeriod, setChosenPeriod] = useState("");
  const [status, setStatus] = useState<AppraisalStatus | "all">("all");
  const [review, setReview] = useState<Review | null>(null);

  // Default to the newest active period (or the newest one) until the user picks another.
  const periodId = chosenPeriod || periods.data?.find((p) => p.isActive)?.id || periods.data?.[0]?.id || "";
  const forms = useAppraisalList(periodId, status);

  return (
    <>
      <PageHeader
        title="Form Penilaian"
        description="Isi nilai kinerja pegawai, kirim, lalu verifikasi. Hanya Bagian Kepegawaian yang mengisi dan memverifikasi."
        breadcrumbs={[{ label: "Beranda", href: routes.dashboard }, { label: "Penilaian Kinerja" }, { label: "Form Penilaian" }]}
      />

      {periods.isError ? (
        <Card>
          <QueryErrorState error={periods.error} onRetry={() => void periods.refetch()} />
        </Card>
      ) : periods.data?.length === 0 ? (
        <Card>
          <EmptyState
            icon={ClipboardListIcon}
            title="Belum ada periode penilaian"
            description="Buat periode terlebih dahulu, lalu buat form penilaian."
            action={
              <Button size="sm" nativeButton={false} render={<Link href={routes.performance.periods} />}>
                Ke Periode Penilaian
              </Button>
            }
          />
        </Card>
      ) : (
        <>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <PeriodSelect periods={periods.data ?? []} value={periodId} onChange={setChosenPeriod} />
            <Tabs value={status} onValueChange={(value) => setStatus(value as AppraisalStatus | "all")}>
              <TabsList className="h-auto flex-wrap justify-start">
                {FILTERS.map((filter) => (
                  <TabsTrigger key={filter.value} value={filter.value}>
                    {filter.label}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Card className="gap-0 py-0">
            {periods.isPending || forms.isPending ? (
              <TableSkeleton />
            ) : forms.isError ? (
              <QueryErrorState error={forms.error} onRetry={() => void forms.refetch()} />
            ) : forms.data.length === 0 ? (
              <EmptyState icon={ClipboardListIcon} title="Belum ada form" description="Buat form dari menu Periode Penilaian, atau ubah filter status." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="pl-6">Pegawai</TableHead>
                    <TableHead className="hidden md:table-cell">Unit kerja</TableHead>
                    <TableHead className="text-right">Nilai</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="pr-6">
                      <span className="sr-only">Aksi</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {forms.data.map((item) => (
                    <TableRow key={item.id} className="hover:bg-accent/15">
                      <TableCell className="pl-6">
                        <p className="font-medium">{item.employeeName}</p>
                        <p className="text-xs text-muted-foreground tabular-nums">{item.employeeNumber ?? "—"}</p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{item.workUnitName ?? "—"}</TableCell>
                      <TableCell className="text-right tabular-nums">{formatScore(item.score)}</TableCell>
                      <TableCell>
                        <AppraisalStatusBadge status={item.status} />
                      </TableCell>
                      <TableCell className="pr-6">
                        <div className="flex justify-end gap-2">
                          {item.status === "submitted" ? (
                            <>
                              <Button variant="outline" size="sm" onClick={() => setReview({ item, accept: false })}>
                                <UndoIcon />
                                Kembalikan
                              </Button>
                              <Button size="sm" onClick={() => setReview({ item, accept: true })}>
                                <CheckIcon />
                                Verifikasi
                              </Button>
                            </>
                          ) : null}
                          <Button variant="outline" size="sm" nativeButton={false} render={<Link href={routes.performance.form(item.id)} />}>
                            <PencilLineIcon />
                            {item.status === "draft" || item.status === "revision_requested" ? "Isi" : "Lihat"}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </Card>
        </>
      )}

      <ReviewDialog review={review} onClose={() => setReview(null)} />
    </>
  );
}
