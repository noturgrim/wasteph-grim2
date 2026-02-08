import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  FolderKanban,
  MessageSquare,
  AlertTriangle,
  ChevronDown,
} from "lucide-react";

const CollapsibleSection = ({
  icon: Icon,
  label,
  count,
  colorClass,
  defaultOpen = false,
  children,
}) => (
  <Collapsible defaultOpen={defaultOpen} className="space-y-2">
    <CollapsibleTrigger className="flex w-full items-center justify-between rounded-lg p-2 hover:bg-accent/50 transition-colors">
      <div className="flex items-center gap-2">
        <Icon className={`h-4 w-4 ${colorClass}`} />
        <span className="text-sm font-semibold text-slate-900 dark:text-white">
          {label}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <Badge variant="secondary" className="text-xs font-bold">
          {count}
        </Badge>
        <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform duration-200 [[data-state=open]>&]:rotate-180" />
      </div>
    </CollapsibleTrigger>
    <CollapsibleContent>{children}</CollapsibleContent>
  </Collapsible>
);

const ProposalItem = ({ item }) => (
  <div className="flex items-start justify-between gap-2 rounded-md border p-2.5 border-slate-200 dark:border-white/10">
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
        {item.proposalNumber}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {item.clientName}
        {item.company ? ` (${item.company})` : ""}
      </p>
      <p className="text-xs text-muted-foreground">by {item.requester}</p>
    </div>
    <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
      {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true })}
    </span>
  </div>
);

const ContractItem = ({ item }) => (
  <div className="flex items-start justify-between gap-2 rounded-md border p-2.5 border-slate-200 dark:border-white/10">
    <div className="min-w-0 space-y-0.5">
      <p className="text-sm font-medium text-slate-900 dark:text-white truncate">
        {item.contractNumber || "Pending number"}
      </p>
      <p className="text-xs text-muted-foreground truncate">
        {item.clientName}
        {item.companyName ? ` (${item.companyName})` : ""}
      </p>
      <p className="text-xs text-muted-foreground">by {item.requester}</p>
    </div>
    {item.requestedAt && (
      <span className="shrink-0 text-[10px] text-muted-foreground whitespace-nowrap">
        {formatDistanceToNow(new Date(item.requestedAt), { addSuffix: true })}
      </span>
    )}
  </div>
);

const CountItem = ({ icon: Icon, label, count, colorClass }) => (
  <div className="flex items-center gap-3 rounded-lg border p-3 border-slate-200 dark:border-white/10">
    <div
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${colorClass}`}
    >
      <Icon className="h-4 w-4" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-medium text-slate-900 dark:text-white">
        {label}
      </p>
    </div>
    <span className="text-2xl font-bold text-slate-900 dark:text-white">
      {count}
    </span>
  </div>
);

const PendingActions = ({ data }) => {
  if (!data) return null;

  const { proposals, contracts, unassignedInquiries, urgentTickets } = data;

  return (
    <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-4">
        <CardTitle className="text-base font-bold text-slate-900 dark:text-white">
          Pending Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[420px] px-6 pb-6">
          <div className="space-y-3">
            {/* Proposals awaiting approval */}
            <CollapsibleSection
              icon={FileText}
              label="Proposals Awaiting Approval"
              count={proposals.total}
              colorClass="text-blue-600 dark:text-blue-400"
              defaultOpen={proposals.total > 0}
            >
              {proposals.items.length > 0 ? (
                <div className="space-y-1.5 pl-1">
                  {proposals.items.map((item) => (
                    <ProposalItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-7 pb-1">
                  No proposals pending
                </p>
              )}
            </CollapsibleSection>

            {/* Contracts awaiting upload */}
            <CollapsibleSection
              icon={FolderKanban}
              label="Contracts Awaiting Upload"
              count={contracts.total}
              colorClass="text-violet-600 dark:text-violet-400"
              defaultOpen={contracts.total > 0}
            >
              {contracts.items.length > 0 ? (
                <div className="space-y-1.5 pl-1">
                  {contracts.items.map((item) => (
                    <ContractItem key={item.id} item={item} />
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground pl-7 pb-1">
                  No contracts pending
                </p>
              )}
            </CollapsibleSection>

            {/* Quick counts */}
            <CollapsibleSection
              icon={MessageSquare}
              label="Other Alerts"
              count={unassignedInquiries + urgentTickets}
              colorClass="text-amber-600 dark:text-amber-400"
              defaultOpen
            >
              <div className="space-y-2 pl-1">
                <CountItem
                  icon={MessageSquare}
                  label="Unassigned Inquiries"
                  count={unassignedInquiries}
                  colorClass="bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400"
                />
                <CountItem
                  icon={AlertTriangle}
                  label="Urgent Open Tickets"
                  count={urgentTickets}
                  colorClass="bg-red-100 text-red-600 dark:bg-red-500/20 dark:text-red-400"
                />
              </div>
            </CollapsibleSection>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default PendingActions;
