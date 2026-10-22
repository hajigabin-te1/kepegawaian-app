import { ConstructionIcon } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

type PlaceholderNoticeProps = {
  title?: string;
  description: string;
};

/** Temporary content for pages waiting on the API contract confirmation. */
export function PlaceholderNotice({
  title = "Segera hadir",
  description,
}: PlaceholderNoticeProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <ConstructionIcon className="size-5 text-muted-foreground" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Halaman ini masih placeholder. Implementasi akan dilanjutkan setelah kontrak API dikonfirmasi.
        </p>
      </CardContent>
    </Card>
  );
}
