import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const STATUS_LABELS = {
  // Proposals
  pending: "Pending Review",
  approved: "Approved",
  sent: "Sent to Client",
  accepted: "Accepted",
  // Contracts
  pending_request: "Pending Request",
  requested: "Requested",
  ready_for_sales: "Ready for Sales",
  sent_to_sales: "Sent to Sales",
  sent_to_client: "Sent to Client",
};

const SECTION_COLORS = {
  proposals: "bg-blue-500 dark:bg-blue-400",
  contracts: "bg-violet-500 dark:bg-violet-400",
};

const SECTION_TRACK = {
  proposals: "bg-blue-100 dark:bg-blue-500/20",
  contracts: "bg-violet-100 dark:bg-violet-500/20",
};

const PipelineSection = ({ title, items, colorKey }) => {
  const maxCount = Math.max(...items.map((i) => i.count), 1);

  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
        {title}
      </h4>
      <div className="space-y-2">
        {items.map((item) => (
          <div key={item.status} className="flex items-center gap-3">
            <span className="text-sm w-32 shrink-0 truncate">
              {STATUS_LABELS[item.status] || item.status}
            </span>
            <div
              className={`flex-1 h-2 rounded-full ${SECTION_TRACK[colorKey]}`}
            >
              <div
                className={`h-full rounded-full transition-all duration-500 ${SECTION_COLORS[colorKey]}`}
                style={{
                  width: `${Math.max((item.count / maxCount) * 100, item.count > 0 ? 8 : 0)}%`,
                }}
              />
            </div>
            <Badge
              variant="secondary"
              className="min-w-[2rem] justify-center text-xs font-bold"
            >
              {item.count}
            </Badge>
          </div>
        ))}
      </div>
    </div>
  );
};

const PipelineBreakdown = ({ proposals = [], contracts = [] }) => {
  return (
    <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
          Pipeline Breakdown
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <PipelineSection
          title="Proposals"
          items={proposals}
          colorKey="proposals"
        />
        <PipelineSection
          title="Contracts"
          items={contracts}
          colorKey="contracts"
        />
      </CardContent>
    </Card>
  );
};

export default PipelineBreakdown;
