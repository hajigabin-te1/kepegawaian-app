"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckIcon, ClipboardListIcon, Loader2Icon, PencilLineIcon, Trash2Icon, UndoIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import { ConfirmDeleteDialog } from "@/components/common/confirm-delete-dialog";
import { EmptyState } from "@/components/common/empty-state";
import { QueryErrorState } from "@/components/common/query-error-state";
import { TableSkeleton } from "@/components/common/table-skeleton";
import { PageHeader } from "@/components/layout/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { routes } from "@/config/routes";
import { AppraisalStatusBadge, PeriodSelect, formatScore } from "@/features/performance/components/appraisal-parts";
import { useAppraisalList, useDeleteDraftAppraisal, usePeriods, useReviewAppraisal } from "@/features/performance/hooks/use-performance";
import { reviewSchema, type ReviewFormValues } from "@/features/performance/schemas/performance-schemas";
import { useWorkReportCounts } from "@/features/performance/hooks/use-work-reports";
import {
  APPRAISAL_CATEGORY_LABELS,
  APPRAISAL_STATUS_LABELS,
  MIN_WORK_REPORTS,
  type AppraisalCategory,
  type AppraisalListItem,
  type AppraisalStatus,
} from "@/features/performance/types/performance";
import { ApiError } from "@/lib/api-error";

const CATEGORY_FILTER_ITEMS: Record<AppraisalCategory | "all", string> = { all: "Semua kategori", ...APPRAISAL_CATEGORY_LABELS };

const FILTERS: { value: AppraisalStatus | "all"; label: string }[] = [
  { value: "all", label: "Semua" },
  ...(Object.keys(APPRAISAL_STATUS_LABELS) as AppraisalStatus[]).map((value) => ({ value, label: APPRAISAL_STATUS_LABELS[value] })),
];

type Review = { item: AppraisalListItem; accept: boolean };

/** Work report count; below the minimum it is highlighted so HR can follow up. */
function ReportCount({ count = 0 }: { count: number | undefined }) {
  return (
    <Badge variant={count >= MIN_WORK_REPORTS ? "secondary" : "warning"} className="tabular-nums">
      {count}
    </Badge>
  );
}

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
  const formLabel = review ? `${APPRAISAL_CATEGORY_LABELS[review.item.category]} ${review.item.employeeName}` : "Penilaian pegawai";
  return (
    <Dialog open={review !== null} onOpenChange={(open) => !open && !reviewMutation.isPending && close()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{accept ? "Verifikasi penilaian?" : "Kembalikan untuk revisi?"}</DialogTitle>
          <DialogDescription>
            {accept
              ? `${formLabel} dikunci dan pegawai dapat melihat hasilnya.`
              : `${formLabel} kembali ke status perlu revisi dan bisa diisi ulang.`}
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
  const [category, setCategory] = useState<AppraisalCategory | "all">("all");
  const [review, setReview] = useState<Review | null>(null);
  const [toDelete, setToDelete] = useState<AppraisalListItem | null>(null);
  const deleteMutation = useDeleteDraftAppraisal();

  const confirmDelete = () => {
    if (!toDelete) return;
    deleteMutation.mutate(toDelete.id, {
      onSuccess: () => {
        toast.success("Draf form penilaian dihapus.");
        setToDelete(null);
      },
      onError: (error) => toast.error(error instanceof ApiError ? error.message : "Draf form gagal dihapus."),
    });
  };

  // Default to the newest active period (or the newest one) until the user picks another.
  const periodId = chosenPeriod || periods.data?.find((p) => p.isActive)?.id || periods.data?.[0]?.id || "";
  const forms = useAppraisalList(periodId, status, category);
  const reportCounts = useWorkReportCounts(periodId);

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
            <Select items={CATEGORY_FILTER_ITEMS} value={category} onValueChange={(value) => value && setCategory(value as AppraisalCategory | "all")}>
              <SelectTrigger className="w-full sm:w-48" aria-label="Kategori form">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(CATEGORY_FILTER_ITEMS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
              <EmptyState icon={ClipboardListIcon} title="Belum ada form" description="Buat form dari menu Periode Penilaian, atau ubah filter status dan kategori." />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary hover:bg-secondary">
                    <TableHead className="pl-6">Pegawai</TableHead>
                    <TableHead className="hidden md:table-cell">Unit kerja</TableHead>
                    <TableHead className="text-right">Laporan</TableHead>
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
                        <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground tabular-nums">
                          {item.employeeNumber ?? "—"}
                          <Badge variant="accent">{APPRAISAL_CATEGORY_LABELS[item.category]}</Badge>
                        </p>
                      </TableCell>
                      <TableCell className="hidden text-muted-foreground md:table-cell">{item.workUnitName ?? "—"}</TableCell>
                      <TableCell className="text-right">
                        <ReportCount count={reportCounts.data?.[item.employeeId]} />
                      </TableCell>
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
                          {item.status === "draft" ? (
                            <Button
                              variant="outline"
                              size="icon-sm"
                              onClick={() => setToDelete(item)}
                              aria-label={`Hapus draf ${APPRAISAL_CATEGORY_LABELS[item.category]} ${item.employeeName}`}
                              title="Hapus draf"
                            >
                              <Trash2Icon />
                            </Button>
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
      <ConfirmDeleteDialog
        open={toDelete !== null}
        onOpenChange={(open) => {
          if (!open && !deleteMutation.isPending) setToDelete(null);
        }}
        title="Hapus draf form penilaian?"
        description={
          toDelete
            ? `Draf ${APPRAISAL_CATEGORY_LABELS[toDelete.category]} untuk ${toDelete.employeeName} beserta indikatornya akan dihapus. Form bisa dibuat lagi lewat Generate form selama pegawai masih memiliki kategori ini.`
            : ""
        }
        onConfirm={confirmDelete}
        isPending={deleteMutation.isPending}
      />
    </>
  );
}
