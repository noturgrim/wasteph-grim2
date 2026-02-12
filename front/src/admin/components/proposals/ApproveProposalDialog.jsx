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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, AlertTriangle, ExternalLink } from "lucide-react";
import { format } from "date-fns";
import { api } from "../../services/api";
import { StatusBadge } from "../StatusBadge";

export function ApproveProposalDialog({ open, onOpenChange, proposal, onConfirm }) {
  const [adminNotes, setAdminNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(adminNotes);
      setAdminNotes(""); // Reset after success
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = (isOpen) => {
    if (!isOpen && !isSubmitting) {
      setAdminNotes(""); // Reset on close
    }
    onOpenChange(isOpen);
  };

  const handleViewPDF = async () => {
    try {
      const blob = await api.previewProposalPDF(proposal.id);
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } catch (error) {
      console.error("Failed to preview PDF:", error);
    }
  };

  if (!proposal) return null;

  // Parse proposal data
  let proposalData = {};
  try {
    proposalData = typeof proposal.proposalData === 'string'
      ? JSON.parse(proposal.proposalData)
      : proposal.proposalData;
  } catch (error) {
    console.error("Failed to parse proposal data:", error);
  }

  const { services = [], pricing = {} } = proposalData;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        {/* Header Section */}
        <DialogHeader className="space-y-3 pb-4 border-b">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                <FileText className="h-6 w-6 text-green-700 dark:text-green-300" />
              </div>
              <div>
                <DialogTitle className="text-2xl font-bold">Approve Proposal</DialogTitle>
                <DialogDescription className="text-sm">
                  Please confirm your decision for Proposal {proposal.id?.substring(0, 8)}...
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Proposal Details Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-semibold text-slate-700 dark:text-slate-300">
                Proposal Details
              </h3>
            </div>

            {/* Client Information */}
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Client Information
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Name: <span className="font-normal text-slate-700 dark:text-slate-300">{proposal.inquiryName}</span>
                </p>
                <p className="font-semibold text-slate-900 dark:text-slate-100">
                  Email: <span className="font-normal text-slate-700 dark:text-slate-300">{proposal.inquiryEmail}</span>
                </p>
              </div>

              {/* Services */}
              {services.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Services
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-slate-700 dark:text-slate-300">
                    {services.slice(0, 3).map((service, index) => (
                      <li key={index}>{service.name || service.serviceName}</li>
                    ))}
                    {services.length > 3 && (
                      <li className="text-slate-500 dark:text-slate-400 italic">
                        +{services.length - 3} more service{services.length - 3 > 1 ? 's' : ''}
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Service Details */}
              {pricing.total && (
                <div>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                    Service Details
                  </p>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Total Amount: <span className="text-green-600 dark:text-green-400 font-bold">PHP {parseFloat(pricing.total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </p>
                </div>
              )}

              {/* Proposal Status */}
              <div>
                <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">
                  Proposal Status
                </p>
                <div>
                  <StatusBadge status={proposal.status} />
                </div>
              </div>
            </div>
          </div>

          {/* Admin Notes (Optional) */}
          <div className="border-t pt-4">
            <Label htmlFor="adminNotes" className="text-sm font-medium">
              Admin Notes <span className="text-muted-foreground font-normal">(Optional)</span>
            </Label>
            <Textarea
              id="adminNotes"
              value={adminNotes}
              onChange={(e) => setAdminNotes(e.target.value)}
              placeholder="Add any internal notes about this approval..."
              rows={3}
              className="mt-2"
            />
            <p className="text-xs text-muted-foreground mt-1.5">
              These notes are internal only and will not be sent to the client.
            </p>
          </div>

          {/* Warning Callout */}
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3 flex gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900 dark:text-amber-100">
                You are about to approve this proposal
              </p>
              <p className="text-amber-800 dark:text-amber-200 mt-0.5">
                By approving, you agree to the terms and conditions outlined in the proposal.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <DialogFooter className="border-t pt-4">
          <Button
            variant="outline"
            onClick={() => handleClose(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700 text-white"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Approving..." : "Confirm Approval"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
