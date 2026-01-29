import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Loader2,
  Send,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Activity,
  Edit,
  UserPlus,
  Trash2,
  FileText,
  ArrowRightLeft,
  CheckCircle,
  XCircle,
  Mail,
  FilePlus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

const getAvatarColor = (userId) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const index = userId ? userId.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

const formatFieldChange = (field, change) => {
  const fieldLabels = {
    name: "Name",
    email: "Email",
    phone: "Phone",
    company: "Company",
    location: "Location",
    source: "Source",
    status: "Status",
    assignedTo: "Assigned To",
    serviceId: "Service",
    isInformationComplete: "Information Complete",
  };

  const statusLabels = {
    submitted_proposal: "Submitted Proposal",
    initial_comms: "Initial Comms",
    negotiating: "Negotiating",
    to_call: "To Call",
    submitted_company_profile: "Submitted Company Profile",
    na: "N/A",
    waiting_for_feedback: "Waiting for Feedback",
    declined: "Declined",
    on_boarded: "On Boarded",
  };

  const label = fieldLabels[field] || field;
  let from = change.from;
  let to = change.to;

  // Handle null/undefined/empty values
  if (from === null || from === undefined || from === "") {
    from = "(empty)";
  }
  if (to === null || to === undefined || to === "") {
    to = "(empty)";
  }

  // Format boolean values
  if (field === "isInformationComplete") {
    from =
      change.from === true ? "Yes" : change.from === false ? "No" : "(empty)";
    to = change.to === true ? "Yes" : change.to === false ? "No" : "(empty)";
  }

  // Format status values
  if (field === "status") {
    from = statusLabels[change.from] || change.from || "(empty)";
    to = statusLabels[change.to] || change.to || "(empty)";
  }

  // Format source values
  if (field === "source") {
    from = change.from?.replace("-", " ") || "(empty)";
    to = change.to?.replace("-", " ") || "(empty)";
  }

  // Format service values (use service name if available)
  if (field === "serviceId") {
    from = change.fromName || change.from || "(empty)";
    to = change.toName || change.to || "(empty)";
  }

  // Format assignedTo values (use user name if available)
  if (field === "assignedTo") {
    from = change.fromName || change.from || "(empty)";
    to = change.toName || change.to || "(empty)";
  }

  return { label, from, to };
};

export const NotesTimeline = ({ inquiryId, initialNotes = [] }) => {
  const [timeline, setTimeline] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load timeline on mount
    handleLoadTimeline();
  }, [inquiryId]);

  const handleLoadTimeline = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInquiryTimeline(inquiryId);
      setTimeline(response.data || []);
    } catch (error) {
      console.error("Error loading timeline:", error);
      toast.error("Failed to load activity timeline");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();

    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.addInquiryNote(inquiryId, newNote.trim());

      // Reload timeline to get both the note and the activity log
      await handleLoadTimeline();
      setNewNote("");
      setIsAddingNote(false);
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error(error.message || "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAddNote(e);
    } else if (e.key === "Escape") {
      setIsAddingNote(false);
      setNewNote("");
    }
  };

  const getActivityInfo = (action, details = {}) => {
    const activityTypes = {
      inquiry_created_manual: {
        label: "Created",
        description: "Created inquiry manually",
        icon: UserPlus,
        badgeBg: "bg-green-50",
        badgeText: "text-green-700",
        badgeBorder: "border-green-200",
      },
      inquiry_created: {
        label: details.fromLeadPool ? "Claimed from Lead Pool" : "Created",
        description: details.fromLeadPool
          ? "Claimed lead and converted to inquiry"
          : "Created inquiry",
        icon: details.fromLeadPool ? FileText : UserPlus,
        badgeBg: details.fromLeadPool ? "bg-indigo-50" : "bg-green-50",
        badgeText: details.fromLeadPool ? "text-indigo-700" : "text-green-700",
        badgeBorder: details.fromLeadPool
          ? "border-indigo-200"
          : "border-green-200",
      },
      inquiry_updated: {
        label: "Updated",
        description: null, // Will show field changes instead
        icon: Edit,
        badgeBg: "bg-gray-50",
        badgeText: "text-gray-700",
        badgeBorder: "border-gray-200",
      },
      inquiry_deleted: {
        label: "Deleted",
        description: "Deleted this inquiry",
        icon: Trash2,
        badgeBg: "bg-red-50",
        badgeText: "text-red-700",
        badgeBorder: "border-red-200",
      },
      proposal_created: {
        label: "Proposal Created",
        description: "Created a proposal for this inquiry",
        icon: FilePlus,
        badgeBg: "bg-blue-50",
        badgeText: "text-blue-700",
        badgeBorder: "border-blue-200",
      },
      proposal_approved: {
        label: "Proposal Approved",
        description: "Proposal was approved by admin",
        icon: CheckCircle,
        badgeBg: "bg-green-50",
        badgeText: "text-green-700",
        badgeBorder: "border-green-200",
      },
      proposal_sent: {
        label: "Proposal Sent",
        description: "Proposal was sent to client via email",
        icon: Mail,
        badgeBg: "bg-purple-50",
        badgeText: "text-purple-700",
        badgeBorder: "border-purple-200",
      },
      proposal_disapproved: {
        label: "Proposal Disapproved",
        description: details.rejectionReason
          ? `Disapproved: ${details.rejectionReason}`
          : "Proposal was disapproved by admin",
        icon: XCircle,
        badgeBg: "bg-red-50",
        badgeText: "text-red-700",
        badgeBorder: "border-red-200",
      },
      proposal_revised: {
        label: "Proposal Revised",
        description: "Revised rejected proposal and resubmitted",
        icon: Edit,
        badgeBg: "bg-orange-50",
        badgeText: "text-orange-700",
        badgeBorder: "border-orange-200",
      },
      proposal_cancelled: {
        label: "Proposal Cancelled",
        description: "Proposal was cancelled",
        icon: XCircle,
        badgeBg: "bg-gray-50",
        badgeText: "text-gray-700",
        badgeBorder: "border-gray-200",
      },
      proposal_client_approved: {
        label: "Client Approved",
        description: "Client approved the proposal via email",
        icon: CheckCircle,
        badgeBg: "bg-emerald-50",
        badgeText: "text-emerald-700",
        badgeBorder: "border-emerald-200",
      },
      proposal_client_rejected: {
        label: "Client Rejected",
        description: "Client rejected the proposal via email",
        icon: XCircle,
        badgeBg: "bg-rose-50",
        badgeText: "text-rose-700",
        badgeBorder: "border-rose-200",
      },
    };

    return (
      activityTypes[action] || {
        label: "Activity",
        description: "Performed an action",
        icon: Activity,
        badgeBg: "bg-gray-50",
        badgeText: "text-gray-700",
        badgeBorder: "border-gray-200",
      }
    );
  };

  const renderTimelineEntry = (entry) => {
    if (entry.type === "note") {
      // Manual note
      return (
        <div
          key={entry.id}
          className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <Edit className="h-5 w-5 text-gray-400 dark:text-gray-600 mt-0.5 shrink-0" />

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {entry.createdBy?.firstName} {entry.createdBy?.lastName}
              </span>
              <Badge
                variant="outline"
                className="text-xs bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-300 border-blue-200 dark:border-blue-800"
              >
                <MessageSquare className="h-3 w-3 mr-1" />
                Note
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(entry.createdAt), "MMM dd, yyyy 'at' h:mm a")}
              </span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap">
              {entry.content}
            </p>
          </div>
        </div>
      );
    } else if (entry.type === "activity") {
      // System activity log
      const changes = entry.details?.changes || {};
      const changeCount = Object.keys(changes).length;
      const activityInfo = getActivityInfo(entry.action, entry.details || {});

      return (
        <div
          key={entry.id}
          className="flex gap-3 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
        >
          <Edit className="h-5 w-5 text-gray-400 dark:text-gray-600 mt-0.5 shrink-0" />

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-foreground">
                {entry.createdBy?.firstName} {entry.createdBy?.lastName}
              </span>
              <Badge
                variant="outline"
                className={`text-xs ${activityInfo.badgeBg} ${activityInfo.badgeText} ${activityInfo.badgeBorder} dark:opacity-90`}
              >
                {activityInfo.label}
              </Badge>
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {format(new Date(entry.createdAt), "MMM dd, yyyy 'at' h:mm a")}
              </span>
            </div>

            {/* Show description for non-update activities or when there are no field changes */}
            {activityInfo.description && changeCount === 0 && (
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {activityInfo.description}
              </p>
            )}

            {/* Show field changes for update activities */}
            {changeCount > 0 && (
              <div className="text-sm space-y-1">
                {Object.entries(changes).map(([field, change]) => {
                  const { label, from, to } = formatFieldChange(field, change);
                  return (
                    <div
                      key={field}
                      className="flex items-start gap-1.5 text-gray-600 dark:text-gray-300"
                    >
                      <ArrowRightLeft className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span>
                        Changed{" "}
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {label}
                        </span>
                        {" from "}
                        <span className="font-medium text-red-600 dark:text-red-400">
                          {from}
                        </span>
                        {" to "}
                        <span className="font-medium text-green-600 dark:text-green-400">
                          {to}
                        </span>
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <div className="space-y-4">
      {/* Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            aria-expanded={isExpanded}
            aria-label={
              isExpanded
                ? "Collapse activity timeline"
                : "Expand activity timeline"
            }
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Activity Timeline
              {timeline.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({timeline.length})
                </span>
              )}
            </h3>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && !isAddingNote && (
            <Button
              onClick={() => setIsAddingNote(true)}
              size="sm"
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>

        {isExpanded && (
          <>
            {/* Add Note Form */}
            {isAddingNote && (
              <form
                onSubmit={handleAddNote}
                className="space-y-2 mb-4 p-4 border rounded-lg bg-muted/30"
              >
                <Textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Add a note... (Ctrl+Enter to submit)"
                  rows={3}
                  disabled={isSubmitting}
                  className="resize-none"
                  autoFocus
                />
                <div className="flex justify-between items-center">
                  <p className="text-xs text-muted-foreground">
                    Notes are visible to all team members
                  </p>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsAddingNote(false);
                        setNewNote("");
                      }}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isSubmitting || !newNote.trim()}
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Adding...
                        </>
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Submit
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            <div className="h-[300px] overflow-y-auto pr-2 scrollbar-thin">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : timeline.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Activity className="h-12 w-12 mx-auto mb-2 opacity-20" />
                  <p className="text-sm">No activity yet</p>
                  <p className="text-xs">
                    Add the first note to start tracking activity
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {timeline.map((entry) => renderTimelineEntry(entry))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
