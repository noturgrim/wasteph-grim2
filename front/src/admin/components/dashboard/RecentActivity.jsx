import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatDistanceToNow } from "date-fns";
import {
  FileText,
  FolderKanban,
  Users,
  MessageSquare,
  UserPlus,
  Send,
  CheckCircle2,
  XCircle,
  PenLine,
  Trash2,
  ClipboardList,
  Activity,
} from "lucide-react";

// --- Helpers ---

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

const DEFAULT_ENTITY_COLOR =
  "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/30";

const ICON_BG = {
  proposal: "bg-blue-100 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
  contract:
    "bg-violet-100 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400",
  lead: "bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
  inquiry:
    "bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
  client: "bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400",
  ticket:
    "bg-orange-100 text-orange-600 dark:bg-orange-500/20 dark:text-orange-400",
};

const DEFAULT_ICON_BG =
  "bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-400";

/** Map action strings to a human-readable label and icon. */
const ACTION_MAP = {
  // Proposals
  proposal_created: { label: "Created a proposal", icon: FileText },
  proposal_updated: { label: "Updated a proposal", icon: PenLine },
  proposal_revised: { label: "Revised a proposal", icon: PenLine },
  proposal_approved: { label: "Proposal approved by admin", icon: CheckCircle2 },
  proposal_disapproved: { label: "Proposal disapproved", icon: XCircle },
  proposal_sent: { label: "Sent proposal to client", icon: Send },
  proposal_cancelled: { label: "Cancelled a proposal", icon: XCircle },
  proposal_client_approved: { label: "Client accepted proposal", icon: CheckCircle2 },
  proposal_client_rejected: { label: "Client rejected proposal", icon: XCircle },
  proposal_email_retried: { label: "Retried proposal email", icon: Send },

  // Contracts
  contract_created: { label: "Contract created", icon: FolderKanban },
  contract_requested: { label: "Requested a contract", icon: ClipboardList },
  contract_uploaded: { label: "Contract PDF uploaded", icon: FolderKanban },
  contract_generated_from_template: { label: "Contract generated from template", icon: FolderKanban },
  contract_html_edited: { label: "Edited contract content", icon: PenLine },
  contract_sent_to_client: { label: "Sent contract to client", icon: Send },
  contract_signed_by_client: { label: "Client signed contract", icon: CheckCircle2 },
  hardbound_contract_uploaded: { label: "Hardbound contract uploaded", icon: FolderKanban },

  // Leads
  lead_created: { label: "Created a lead", icon: UserPlus },
  lead_created_public: { label: "Lead submitted via website", icon: UserPlus },
  lead_created_from_inquiry: { label: "Lead created from inquiry", icon: UserPlus },
  lead_updated: { label: "Updated a lead", icon: PenLine },
  lead_claimed: { label: "Claimed a lead", icon: Users },
  lead_deleted: { label: "Deleted a lead", icon: Trash2 },
  lead_deleted_bulk: { label: "Bulk deleted leads", icon: Trash2 },

  // Inquiries
  inquiry_created: { label: "Created an inquiry", icon: MessageSquare },
  inquiry_created_manual: { label: "Manually created inquiry", icon: MessageSquare },
  inquiry_updated: { label: "Updated an inquiry", icon: PenLine },
  inquiry_assigned: { label: "Assigned an inquiry", icon: Users },
  inquiry_converted_to_lead: { label: "Converted inquiry to lead", icon: UserPlus },
  inquiry_deleted: { label: "Deleted an inquiry", icon: Trash2 },

  // Tickets
  ticket_created: { label: "Created a ticket", icon: ClipboardList },
  ticket_updated: { label: "Updated a ticket", icon: PenLine },
  ticket_status_updated: { label: "Changed ticket status", icon: Activity },
  ticket_comment_added: { label: "Commented on a ticket", icon: MessageSquare },

  // Clients
  client_created: { label: "Client record created", icon: Users },
  client_updated: { label: "Updated client info", icon: PenLine },
  client_deleted: { label: "Deleted a client", icon: Trash2 },
};

const formatStatus = (s) => (s ? s.replace(/_/g, " ") : s);

/**
 * Build a summary line from the enriched context object
 * returned by the backend (real names from joined tables + parsed details).
 */
const buildSummary = (context) => {
  if (!context || typeof context !== "object") return null;

  const parts = [];

  // Identifier (proposal number, contract number, etc.)
  if (context.proposalNumber) parts.push(context.proposalNumber);
  if (context.contractNumber) parts.push(context.contractNumber);
  if (context.inquiryNumber) parts.push(context.inquiryNumber);
  if (context.ticketNumber) parts.push(context.ticketNumber);

  // Who — client name and/or company
  if (context.clientName && context.company) {
    parts.push(`${context.clientName} (${context.company})`);
  } else if (context.company) {
    parts.push(context.company);
  } else if (context.clientName) {
    parts.push(context.clientName);
  }

  // Ticket subject
  if (context.subject) parts.push(context.subject);

  // Status change (e.g. "open → resolved")
  if (context.oldStatus && context.newStatus) {
    parts.push(`${formatStatus(context.oldStatus)} → ${formatStatus(context.newStatus)}`);
  }

  // Rejection reason
  if (context.rejectionReason) parts.push(context.rejectionReason);

  return parts.length > 0 ? parts.join(" — ") : null;
};

// --- Component ---

const RecentActivity = ({ activities = [], showActor = false }) => {
  if (activities.length === 0) {
    return (
      <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
        <CardHeader className="pb-3 sm:pb-4">
          <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-6 sm:py-8 text-center">
            <Activity className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground/40 mb-2" />
            <p className="text-xs sm:text-sm text-muted-foreground">No recent activity</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-slate-200 bg-white dark:border-white/10 dark:bg-black/40">
      <CardHeader className="pb-3 sm:pb-4">
        <CardTitle className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[280px] sm:h-[360px] px-3 sm:px-6 pb-4 sm:pb-6">
          <div className="space-y-1">
            {activities.map((activity) => {
              const mapped = ACTION_MAP[activity.action];
              const Icon = mapped?.icon || Activity;
              const label = mapped?.label || activity.action?.replace(/_/g, " ") || "Unknown";
              const entityColor =
                ENTITY_COLORS[activity.entityType] || DEFAULT_ENTITY_COLOR;
              const iconBg = ICON_BG[activity.entityType] || DEFAULT_ICON_BG;
              const summary = buildSummary(activity.context);

              return (
                <div
                  key={activity.id}
                  className="flex items-start gap-2 sm:gap-3 rounded-lg p-2 sm:p-3 transition-colors hover:bg-accent/50"
                >
                  <div
                    className={`mt-0.5 flex h-7 w-7 sm:h-8 sm:w-8 shrink-0 items-center justify-center rounded-lg ${iconBg}`}
                  >
                    <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-medium text-slate-900 dark:text-white break-words">
                          {label}
                        </p>
                        {showActor && activity.context?.actorName && (
                          <p className="text-xs text-muted-foreground truncate">
                            by {activity.context.actorName}
                          </p>
                        )}
                      </div>
                      <span className="shrink-0 text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                        {formatDistanceToNow(new Date(activity.createdAt), {
                          addSuffix: true,
                        })}
                      </span>
                    </div>
                    {summary && (
                      <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-2 break-words">
                        {summary}
                      </p>
                    )}
                    <Badge
                      variant="outline"
                      className={`text-[9px] sm:text-[10px] capitalize ${entityColor}`}
                    >
                      {activity.entityType}
                    </Badge>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

export default RecentActivity;
