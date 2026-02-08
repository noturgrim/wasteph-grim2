import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Clock } from "lucide-react";
import { format } from "date-fns";

const EVENT_TYPE_LABELS = {
  site_visit: "Site Visit",
  call: "Call",
  meeting: "Meeting",
  follow_up: "Follow Up",
};

const EVENT_TYPE_COLORS = {
  site_visit:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  call: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
  meeting:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  follow_up:
    "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
};

const DEFAULT_COLOR =
  "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30";

const UpcomingEvents = ({ events = [] }) => {
  if (events.length === 0) {
    return (
      <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarDays className="h-10 w-10 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">
              No upcoming events scheduled
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
          Upcoming Events
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {events.map((event) => {
          const typeLabel =
            EVENT_TYPE_LABELS[event.eventType] || event.eventType || "Event";
          const typeColor = EVENT_TYPE_COLORS[event.eventType] || DEFAULT_COLOR;

          return (
            <div
              key={event.id}
              className="flex items-start gap-3 rounded-lg border p-3 transition-colors hover:bg-accent/50 border-slate-200 dark:border-white/10"
            >
              <div className="flex flex-col items-center justify-center rounded-lg bg-accent/50 px-2.5 py-1.5 text-center min-w-[3.5rem]">
                <span className="text-xs font-medium text-muted-foreground">
                  {format(new Date(event.scheduledDate), "MMM")}
                </span>
                <span className="text-lg font-bold leading-tight text-slate-900 dark:text-white">
                  {format(new Date(event.scheduledDate), "dd")}
                </span>
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-sm font-semibold truncate text-slate-900 dark:text-white">
                  {event.title}
                </p>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`text-xs capitalize ${typeColor}`}
                  >
                    {typeLabel}
                  </Badge>
                  {event.startTime && (
                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {event.startTime}
                      {event.endTime && ` - ${event.endTime}`}
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export default UpcomingEvents;
