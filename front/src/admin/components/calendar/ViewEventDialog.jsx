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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format, parseISO } from "date-fns";
import {
  CheckCircle,
  XCircle,
  Trash2,
  ExternalLink,
  FileText,
  Loader2,
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

export function ViewEventDialog({
  open,
  onOpenChange,
  event,
  onUpdate,
  onDelete,
  isReadOnly = false,
}) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [completionReport, setCompletionReport] = useState("");

  if (!event) return null;

  const handleCompleteClick = () => {
    setCompletionReport(event.notes || "");
    setShowCompleteDialog(true);
  };

  const handleComplete = async () => {
    if (!completionReport.trim()) {
      toast.error(
        "Please provide a summary or report before marking as completed"
      );
      return;
    }

    try {
      setIsCompleting(true);
      await api.completeCalendarEvent(event.id, {
        notes: completionReport,
      });
      toast.success("Event marked as completed");
      setShowCompleteDialog(false);
      setCompletionReport("");
      if (onUpdate) onUpdate();
    } catch (error) {
      toast.error(error.message || "Failed to complete event");
    } finally {
      setIsCompleting(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await api.deleteCalendarEvent(event.id);
      toast.success("Event cancelled successfully");
      setShowDeleteDialog(false);
      if (onDelete) onDelete();
    } catch (error) {
      toast.error(error.message || "Failed to cancel event");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleViewInquiry = () => {
    if (event.inquiryId) {
      navigate("/admin/inquiries");
      onOpenChange(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return (
          <Badge className="bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300">
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge className="bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300">
            <XCircle className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return (
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
            Scheduled
          </Badge>
        );
    }
  };

  const formatEventType = (type) => {
    if (!type) return null;
    return type.replace(/_/g, " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl w-[95vw] sm:w-full">
          <DialogHeader>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-xl sm:text-2xl">{event.title}</DialogTitle>
                {event.eventType && (
                  <DialogDescription className="text-sm">
                    {formatEventType(event.eventType)}
                  </DialogDescription>
                )}
              </div>
              {getStatusBadge(event.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6">
            {/* Assigned To (for Master Sales viewing other's events) */}
            {isReadOnly && event.user && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Assigned To
                </h4>
                <p className="text-sm text-foreground">
                  {event.user.name} ({event.user.email})
                </p>
              </div>
            )}

            {/* Description */}
            {event.description && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Description
                </h4>
                <p className="text-sm text-muted-foreground">
                  {event.description}
                </p>
              </div>
            )}

            {/* Date and Time */}
            <div>
              <h4 className="text-sm font-semibold text-foreground mb-2">
                Date & Time
              </h4>
              <div className="space-y-1">
                <p className="text-sm text-foreground">
                  {format(parseISO(event.scheduledDate), "EEEE, MMMM dd, yyyy")}
                </p>
                {event.startTime && (
                  <p className="text-sm text-muted-foreground">
                    {event.startTime}
                    {event.endTime && ` - ${event.endTime}`}
                  </p>
                )}
              </div>
            </div>

            {/* Linked Inquiry */}
            {event.inquiryId && event.inquiryName && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Linked Inquiry
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleViewInquiry}
                  className="gap-2"
                >
                  <span>
                    {event.inquiryName} - {event.inquiryCompany || "No company"}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Linked Client */}
            {event.clientId && event.clientCompanyName && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Linked Client
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    navigate("/admin/clients");
                    onOpenChange(false);
                  }}
                  className="gap-2"
                >
                  <span>
                    {event.clientCompanyName}
                    {event.clientContactPerson &&
                      ` - ${event.clientContactPerson}`}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Notes */}
            {event.notes && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Report
                </h4>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {event.notes}
                </p>
              </div>
            )}

            {/* Completed At */}
            {event.completedAt && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Completed
                </h4>
                <p className="text-sm text-muted-foreground">
                  {format(
                    parseISO(event.completedAt),
                    "MMM dd, yyyy 'at' hh:mm a"
                  )}
                </p>
              </div>
            )}

            {/* Created/Updated */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-muted-foreground">
                <div>
                  <span className="font-medium">Created:</span>{" "}
                  {format(parseISO(event.createdAt), "MMM dd, yyyy")}
                </div>
                <div>
                  <span className="font-medium">Updated:</span>{" "}
                  {format(parseISO(event.updatedAt), "MMM dd, yyyy")}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            {!isReadOnly ? (
              <>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() => setShowDeleteDialog(true)}
                  disabled={
                    isDeleting || isCompleting || event.status === "cancelled"
                  }
                  className="w-full sm:w-auto"
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4 mr-2" />
                  )}
                  {event.status === "cancelled"
                    ? "Cancelled"
                    : isDeleting
                      ? "Cancelling..."
                      : "Cancel Event"}
                </Button>

                <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
                  <Button
                    variant="outline"
                    onClick={() => onOpenChange(false)}
                    disabled={isDeleting || isCompleting}
                    className="w-full sm:w-auto"
                  >
                    Close
                  </Button>
                  {event.status === "scheduled" && (
                    <Button
                      onClick={handleCompleteClick}
                      disabled={isDeleting || isCompleting}
                      className="w-full sm:w-auto"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 w-full">
                <Badge variant="outline" className="text-xs">
                  View Only - This is {event.user?.name || "another user"}'s
                  event
                </Badge>
                <Button variant="outline" onClick={() => onOpenChange(false)} className="w-full sm:w-auto">
                  Close
                </Button>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Event</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel "{event.title}"? The event will be
              marked as cancelled but will remain in your calendar.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>
              Keep Event
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Cancelling...
                </>
              ) : (
                <>
                  <XCircle className="h-4 w-4 mr-2" />
                  Cancel Event
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Complete Event Dialog with Report */}
      <AlertDialog
        open={showCompleteDialog}
        onOpenChange={setShowCompleteDialog}
      >
        <AlertDialogContent className="sm:max-w-[600px]">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Complete Event - Add Summary/Report
            </AlertDialogTitle>
            <AlertDialogDescription>
              Please provide a summary, rundown, or report of what happened
              during this event before marking it as completed.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="space-y-3 py-4">
            <div className="space-y-2">
              <Label
                htmlFor="completion-report"
                className="text-sm font-medium"
              >
                Event Report <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="completion-report"
                value={completionReport}
                onChange={(e) => setCompletionReport(e.target.value)}
                placeholder="What happened during this event? (e.g., discussed pricing, conducted site visit, client agreed to proposal, etc.)"
                rows={6}
                className={
                  !completionReport.trim()
                    ? "border-amber-500 focus:ring-amber-500"
                    : ""
                }
              />
              <p className="text-xs text-muted-foreground">
                This report will be saved and visible in the timeline.
              </p>
            </div>

            {!completionReport.trim() && (
              <div className="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-md">
                <XCircle className="h-4 w-4 text-amber-600 dark:text-amber-500 mt-0.5 shrink-0" />
                <p className="text-xs text-amber-700 dark:text-amber-400">
                  A summary or report is required to complete this event.
                </p>
              </div>
            )}
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCompleting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleComplete}
              disabled={isCompleting || !completionReport.trim()}
              className="bg-green-600 hover:bg-green-700"
            >
              {isCompleting ? (
                <>
                  <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                  Completing...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Completed
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
