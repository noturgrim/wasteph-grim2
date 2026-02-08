import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

const ENTITY_COLORS = {
  proposal:
    "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30",
  contract:
    "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-500/10 dark:text-violet-400 dark:border-violet-500/30",
  lead: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/30",
  inquiry:
    "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/30",
  client:
    "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/30",
  ticket:
    "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/30",
};

const DEFAULT_COLOR =
  "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30";

const formatAction = (action) => {
  if (!action) return "Unknown action";
  return action
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const RecentActivity = ({ activities = [] }) => {
  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
        <CardHeader className="pb-4">
          <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground text-center py-8">
            No recent activity
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {activities.map((activity) => {
            const entityColor =
              ENTITY_COLORS[activity.entityType] || DEFAULT_COLOR;

            return (
              <div
                key={activity.id}
                className="flex items-start gap-3 rounded-lg border p-3 border-slate-200 dark:border-white/10"
              >
                <div className="flex-1 min-w-0 space-y-1">
                  <p className="text-sm font-medium text-slate-900 dark:text-white">
                    {formatAction(activity.action)}
                  </p>
                  {activity.details && (
                    <p className="text-xs text-muted-foreground truncate">
                      {activity.details}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <Badge
                      variant="outline"
                      className={`text-xs capitalize ${entityColor}`}
                    >
                      {activity.entityType}
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatDistanceToNow(new Date(activity.createdAt), {
                        addSuffix: true,
                      })}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
