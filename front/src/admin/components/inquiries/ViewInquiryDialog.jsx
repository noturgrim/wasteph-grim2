import { useState } from "react";
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
import { FileText } from "lucide-react";
import { RequestProposalDialog } from "./RequestProposalDialog";
import { NotesTimeline } from "./NotesTimeline";

const SERVICE_TYPE_LABELS = {
  garbage_collection: "Garbage Collection",
  septic_siphoning: "Septic Siphoning",
  hazardous_waste: "Hazardous Waste",
  onetime_hauling: "One-time Hauling",
};

export function ViewInquiryDialog({ open, onOpenChange, inquiry, users = [], onProposalCreated }) {
  const [isProposalDialogOpen, setIsProposalDialogOpen] = useState(false);

  if (!inquiry) return null;

  const assignedUser = users.find(u => u.id === inquiry.assignedTo);

  const handleProposalSuccess = () => {
    if (onProposalCreated) onProposalCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[85vw]! max-w-[900px]! max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
          <DialogTitle>Inquiry Details</DialogTitle>
          <DialogDescription>
            View complete inquiry information
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-6 min-h-0">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Contact Information</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-sm font-medium">{inquiry.name}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{inquiry.email}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{inquiry.phone || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-sm font-medium">{inquiry.company || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{inquiry.location || "N/A"}</p>
              </div>
            </div>
          </div>

          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Inquiry Details</h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-4">
              {inquiry.serviceType && (
                <div>
                  <p className="text-sm text-muted-foreground">Type of Inquiry</p>
                  <p className="text-sm font-medium">{SERVICE_TYPE_LABELS[inquiry.serviceType] || inquiry.serviceType}</p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Source</p>
                <p className="text-sm font-medium capitalize">{inquiry.source?.replace("-", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <div className="mt-1">
                  <StatusBadge status={inquiry.status} />
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proposal Status</p>
                <div className="mt-1">
                  {!inquiry.proposalStatus ? (
                    <Badge variant="outline" className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
                      No Proposal
                    </Badge>
                  ) : (
                    <Badge
                      variant="outline"
                      className={
                        inquiry.proposalStatus === "pending"
                          ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-300"
                          : inquiry.proposalStatus === "approved"
                          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-300"
                          : inquiry.proposalStatus === "disapproved"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300"
                          : inquiry.proposalStatus === "sent"
                          ? "bg-gray-100 text-gray-800 dark:bg-gray-950 dark:text-gray-200 border-gray-300"
                          : inquiry.proposalStatus === "accepted"
                          ? "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-300"
                          : inquiry.proposalStatus === "rejected"
                          ? "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300"
                          : "bg-gray-100 text-gray-800"
                      }
                    >
                      {inquiry.proposalStatus === "pending" ? "Pending Review" :
                       inquiry.proposalStatus === "approved" ? "Approved" :
                       inquiry.proposalStatus === "disapproved" ? "Disapproved" :
                       inquiry.proposalStatus === "sent" ? "Sent" :
                       inquiry.proposalStatus === "accepted" ? "Client Accepted" :
                       inquiry.proposalStatus === "rejected" ? "Client Rejected" :
                       inquiry.proposalStatus}
                    </Badge>
                  )}
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Assigned To</p>
                <p className="text-sm font-medium">
                  {assignedUser
                    ? `${assignedUser.firstName} ${assignedUser.lastName}`
                    : inquiry.assignedTo ? "Unknown User" : "Unassigned"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="text-sm font-medium">
                  {format(new Date(inquiry.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(inquiry.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
            </div>
          </div>

          {/* Notes Timeline */}
          <div className="border-t pt-4">
            <NotesTimeline inquiryId={inquiry.id} />
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t shrink-0 flex-col sm:flex-row gap-2">
          {/* Show info for pending/approved proposals */}
          {inquiry.proposalStatus === "pending" && (
            <div className="text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-50 dark:bg-yellow-950 px-3 py-2 rounded-md">
              Proposal is pending admin review
            </div>
          )}
          {(inquiry.proposalStatus === "approved" || inquiry.proposalStatus === "sent") && (
            <div className="text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-950 px-3 py-2 rounded-md">
              Proposal has been sent to client
            </div>
          )}
          {inquiry.proposalStatus === "disapproved" && (
            <div className="text-sm text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-950 px-3 py-2 rounded-md space-y-1">
              <p className="font-semibold">Proposal was disapproved</p>
              {inquiry.proposalRejectionReason && (
                <p className="text-xs">
                  <strong>Reason:</strong> {inquiry.proposalRejectionReason}
                </p>
              )}
              <p className="text-xs italic">Revise and resubmit from table</p>
            </div>
          )}

          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>

      {/* Request Proposal Dialog */}
      <RequestProposalDialog
        open={isProposalDialogOpen}
        onOpenChange={setIsProposalDialogOpen}
        inquiry={inquiry}
        onSuccess={handleProposalSuccess}
      />
    </Dialog>
  );
}
