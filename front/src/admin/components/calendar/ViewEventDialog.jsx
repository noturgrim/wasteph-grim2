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
import { CheckCircle, XCircle, Trash2, ExternalLink } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { useNavigate } from "react-router-dom";

export function ViewEventDialog({
  open,
  onOpenChange,
  event,
  onUpdate,
  onDelete,
}) {
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  if (!event) return null;

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      await api.completeCalendarEvent(event.id);
      toast.success("Event marked as completed");
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <DialogTitle className="text-2xl">{event.title}</DialogTitle>
                {event.eventType && (
                  <p className="text-sm text-muted-foreground">
                    {formatEventType(event.eventType)}
                  </p>
                )}
              </div>
              {getStatusBadge(event.status)}
            </div>
          </DialogHeader>

          <div className="space-y-6">
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
            {event.inquiry && (
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
                    {event.inquiry.name} -{" "}
                    {event.inquiry.company || "No company"}
                  </span>
                  <ExternalLink className="h-3 w-3" />
                </Button>
              </div>
            )}

            {/* Notes */}
            {event.notes && (
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-2">
                  Notes
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
                    "MMM dd, yyyy 'at' hh:mm a",
                  )}
                </p>
              </div>
            )}

            {/* Created/Updated */}
            <div className="pt-4 border-t">
              <div className="grid grid-cols-2 gap-4 text-xs text-muted-foreground">
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

          <DialogFooter className="flex items-center justify-between sm:justify-between">
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              disabled={
                isDeleting || isCompleting || event.status === "cancelled"
              }
            >
              <Trash2 className="h-4 w-4 mr-2" />
              {event.status === "cancelled" ? "Cancelled" : "Cancel Event"}
            </Button>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isDeleting || isCompleting}
              >
                Close
              </Button>
              {event.status === "scheduled" && (
                <Button
                  onClick={handleComplete}
                  disabled={isDeleting || isCompleting}
                >
                  {isCompleting ? (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2 animate-spin" />
                      Marking...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Mark Complete
                    </>
                  )}
                </Button>
              )}
            </div>
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
              {isDeleting ? "Cancelling..." : "Cancel Event"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
