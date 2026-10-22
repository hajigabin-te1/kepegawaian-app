import Link from "next/link";
import { BriefcaseBusinessIcon } from "lucide-react";

import { routes } from "@/config/routes";

export function AppBrand() {
  return (
    <Link href={routes.dashboard} className="flex items-center gap-2 font-semibold">
      <span className="flex size-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
        <BriefcaseBusinessIcon className="size-4" />
      </span>
      <span>Kepegawaian</span>
    </Link>
  );
}
