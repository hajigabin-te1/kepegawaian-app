import { CalendarDaysIcon } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";

const TIME_ZONE = "Asia/Jakarta";

const dateFormatter = new Intl.DateTimeFormat("id-ID", {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  timeZone: TIME_ZONE,
});

const hourFormatter = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  hourCycle: "h23",
  timeZone: TIME_ZONE,
});

function getGreeting(hour: number): string {
  if (hour < 11) return "Selamat pagi";
  if (hour < 15) return "Selamat siang";
  if (hour < 18) return "Selamat sore";
  return "Selamat malam";
}

type WelcomeCardProps = {
  name: string;
  now: Date;
};

export function WelcomeCard({ name, now }: WelcomeCardProps) {
  const greeting = getGreeting(Number(hourFormatter.format(now)));

  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">{greeting},</p>
          <p className="text-lg font-semibold">{name}</p>
        </div>
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarDaysIcon className="size-4" />
          {dateFormatter.format(now)}
        </p>
      </CardContent>
    </Card>
  );
}
