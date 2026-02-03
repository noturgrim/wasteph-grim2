import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { StatusBadge } from "../StatusBadge";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { FileText, Calendar } from "lucide-react";
import { RequestProposalDialog } from "./RequestProposalDialog";
import { NotesTimeline } from "./NotesTimeline";
import { ScheduleEventDialog } from "../calendar/ScheduleEventDialog";

const SERVICE_TYPE_LABELS = {
  garbage_collection: "Garbage Collection",
  septic_siphoning: "Septic Siphoning",
  hazardous_waste: "Hazardous Waste",
  onetime_hauling: "One-time Hauling",
};

export function ViewInquiryDialog({
  open,
  onOpenChange,
  inquiry,
  users = [],
  onProposalCreated,
}) {
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [timelineKey, setTimelineKey] = useState(0);

  // Reset timeline key when dialog opens or inquiry changes
  useEffect(() => {
    if (open && inquiry) {
      setTimelineKey((prev) => prev + 1);
    }
  }, [open, inquiry?.id]);

  if (!inquiry) return null;

  const assignedUser = users.find((u) => u.id === inquiry.assignedTo);

  const handleProposalSuccess = () => {
    if (onProposalCreated) onProposalCreated();
  };

  const handleEventScheduled = () => {
    // Force timeline to reload by changing the key
    setTimelineKey((prev) => prev + 1);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw]! max-w-[900px]! max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden [&>button]:hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle>Inquiry Details</DialogTitle>
              <DialogDescription>
                View complete inquiry information
              </DialogDescription>
            </div>
            {inquiry.inquiryNumber && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Inquiry Number</p>
                <p className="font-mono text-sm italic font-normal text-black dark:text-white">
                  {inquiry.inquiryNumber}
                </p>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Contact Information
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium text-foreground">
                  {inquiry.name}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium text-foreground">
                  {inquiry.email}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium text-foreground">
                  {inquiry.phone || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-sm font-medium text-foreground">
                  {inquiry.company || "N/A"}
                </p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm font-medium text-foreground">
                  {inquiry.location || "N/A"}
                </p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">
              Inquiry Details
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              {inquiry.serviceType && (
                <div>
                  <p className="text-sm text-muted-foreground">
                    Type of Inquiry
                  </p>
                  <p className="text-sm font-medium text-foreground">
                    {SERVICE_TYPE_LABELS[inquiry.serviceType] ||
                      inquiry.serviceType}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-sm font-medium capitalize text-foreground">
                  {inquiry.source?.replace("-", " ")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <StatusBadge status={inquiry.status} />
                  {inquiry.isInformationComplete === false && (
                    <Badge
                      variant="outline"
                      className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700 text-xs"
                    >
                      Info Needed
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proposal Status</p>
                <div className="mt-1">
                  {!inquiry.proposalStatus ? (
                    <Badge
                      variant="outline"
                      className="bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"
                    >
                      No Proposal
                    </Badge>
                  ) : (
                    <StatusBadge status={inquiry.proposalStatus} />
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium text-foreground">
                  {assignedUser
                    ? `${assignedUser.firstName} ${assignedUser.lastName}`
                    : inquiry.assignedTo
                      ? "Unknown User"
                      : "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium text-foreground">
                  {format(
                    new Date(inquiry.createdAt),
                    "MMM dd, yyyy 'at' hh:mm a",
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium text-foreground">
                  {format(
                    new Date(inquiry.updatedAt),
                    "MMM dd, yyyy 'at' hh:mm a",
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Timeline */}
          <div className="border-t pt-4">
            <NotesTimeline key={timelineKey} inquiryId={inquiry.id} />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex-col sm:flex-row gap-2">
          {/* Show warning if information is incomplete */}
          {inquiry.isInformationComplete === false && (
            <div className="text-sm text-amber-700 dark:text-amber-200 bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 px-3 py-2 rounded-md space-y-1">
              <p className="font-semibold">Information Incomplete</p>
              <p className="text-xs text-amber-600 dark:text-amber-300">
                This inquiry was created from a lead pool. Please visit the
                client site or contact them to gather complete information, then
                edit the inquiry and mark "Information Complete" before
                requesting a proposal.
              </p>
            </div>
          )}

          {/* Show info for pending/approved proposals */}
          {inquiry.proposalStatus === "pending" && (
            <div className="text-sm text-yellow-700 dark:text-yellow-200 bg-yellow-50 dark:bg-yellow-950/50 border border-yellow-200 dark:border-yellow-800 px-3 py-2 rounded-md">
              Proposal is pending admin review
            </div>
          )}
          {(inquiry.proposalStatus === "approved" ||
            inquiry.proposalStatus === "sent") && (
            <div className="text-sm text-green-700 dark:text-green-200 bg-green-50 dark:bg-green-950/50 border border-green-200 dark:border-green-800 px-3 py-2 rounded-md">
              Proposal has been sent to client
            </div>
          )}
          {inquiry.proposalStatus === "disapproved" && (
            <div className="text-sm text-red-700 dark:text-red-200 bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 px-3 py-2 rounded-md space-y-1">
              <p className="font-semibold">Proposal was disapproved</p>
              {inquiry.proposalRejectionReason && (
                <p className="text-xs text-red-600 dark:text-red-300">
                  <strong>Reason:</strong> {inquiry.proposalRejectionReason}
                </p>
              )}
              <p className="text-xs italic text-red-600 dark:text-red-300">
                Revise and resubmit from table
              </p>
            </div>
          )}

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(true)}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Event
            </Button>
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>

      {/* Request Proposal Dialog */}
      <RequestProposalDialog
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
        inquiry={inquiry}
        onSuccess={handleProposalSuccess}
      />

      {/* Schedule Event Dialog */}
      <ScheduleEventDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        inquiryId={inquiry.id}
        onSuccess={handleEventScheduled}
      />
    </Dialog>
  );
}
