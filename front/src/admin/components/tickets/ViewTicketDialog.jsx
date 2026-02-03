import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Ticket,
  MessageSquare,
  Paperclip,
  CheckCircle,
  Upload,
} from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";

const getPriorityBadge = (priority) => {
  const config = {
    low: { label: "Low", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700" },
    high: { label: "High", className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700" },
    urgent: { label: "Urgent", className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700" },
  };
  const { label, className } = config[priority] || config.medium;
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

const getStatusBadge = (status) => {
  const config = {
    open: { label: "Open", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" },
    in_progress: { label: "In Progress", className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700" },
    resolved: { label: "Resolved", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" },
    closed: { label: "Closed", className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" },
  };
  const { label, className } = config[status] || config.open;
  return <Badge variant="outline" className={className}>{label}</Badge>;
};

const getCategoryLabel = (category) => {
  const labels = {
    technical_issue: "Technical Issue",
    billing_payment: "Billing/Payment",
    feature_request: "Feature Request",
    complaint: "Complaint",
    feedback: "Feedback",
    contract_legal: "Contract/Legal",
    other: "Other",
  };
  return labels[category] || category;
};

export const ViewTicketDialog = ({
  open,
  onOpenChange,
  ticketId,
  onRefresh,
}) => {
  const { user } = useAuth();
  const [ticket, setTicket] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [isAddingComment, setIsAddingComment] = useState(false);
  const [statusUpdate, setStatusUpdate] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploadingFile, setIsUploadingFile] = useState(false);

  const isAdmin = user?.role === "admin" || user?.role === "super_admin";

  useEffect(() => {
    if (open && ticketId) {
      fetchTicket();
    }
  }, [open, ticketId]);

  const fetchTicket = async () => {
    setIsLoading(true);
    try {
      const response = await api.getTicketById(ticketId);
      setTicket(response.data);
      setStatusUpdate(response.data.status);
    } catch (error) {
      toast.error("Failed to fetch ticket details");
      console.error("Fetch ticket error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) return;

    setIsAddingComment(true);
    try {
      await api.addTicketComment(ticketId, newComment);
      toast.success("Comment added");
      setNewComment("");
      fetchTicket();
      onRefresh?.();
    } catch (error) {
      toast.error("Failed to add comment");
      console.error("Add comment error:", error);
    } finally {
      setIsAddingComment(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (statusUpdate === ticket.status) return;

    setIsUpdatingStatus(true);
    try {
      await api.updateTicketStatus(ticketId, statusUpdate, resolutionNotes);
      toast.success("Ticket status updated");
      setResolutionNotes("");
      fetchTicket();
      onRefresh?.();
    } catch (error) {
      toast.error("Failed to update ticket status");
      console.error("Update status error:", error);
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;

    setIsUploadingFile(true);
    try {
      await api.uploadTicketAttachment(ticketId, selectedFile);
      toast.success("File uploaded successfully");
      setSelectedFile(null);
      fetchTicket();
    } catch (error) {
      toast.error("Failed to upload file");
      console.error("Upload file error:", error);
    } finally {
      setIsUploadingFile(false);
    }
  };

  if (!ticket) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] w-[95vw] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-base sm:text-lg">
            <Ticket className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
            Ticket Details
          </DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            {ticket.ticketNumber}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-120px)]">
          <div className="space-y-5 pr-4">
            {/* Ticket Header */}
            <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3 sm:p-4 space-y-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <h3 className="text-base sm:text-lg font-semibold">
                    {ticket.subject}
                  </h3>
                  <div className="flex gap-2 flex-wrap">
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                    <Badge variant="outline" className="text-xs">
                      {getCategoryLabel(ticket.category)}
                    </Badge>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs">Created</p>
                  <p className="font-medium text-sm">
                    {format(new Date(ticket.createdAt), "MMM dd, yyyy HH:mm")}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Created By</p>
                  <p className="font-medium text-sm">
                    {ticket.creatorFirstName} {ticket.creatorLastName}
                  </p>
                </div>
              </div>
            </div>

            {/* Description */}
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Description
              </h4>
              <p className="text-sm whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            {/* Attachments */}
            {ticket.attachments && ticket.attachments.length > 0 && (
              <div>
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                  <Paperclip className="h-4 w-4" />
                  Attachments ({ticket.attachments.length})
                </h4>
                <div className="space-y-2">
                  {ticket.attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between p-2 border rounded-lg"
                    >
                      <div>
                        <p className="text-sm font-medium">
                          {attachment.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {(attachment.fileSize / 1024).toFixed(2)} KB
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add Attachment */}
            <div>
              <Label htmlFor="file-upload" className="text-sm font-semibold">
                Upload File
              </Label>
              <div className="flex flex-col sm:flex-row gap-2 mt-2">
                <input
                  id="file-upload"
                  type="file"
                  onChange={(e) => setSelectedFile(e.target.files[0])}
                  className="text-sm flex-1"
                />
                <Button
                  size="sm"
                  onClick={handleFileUpload}
                  disabled={!selectedFile || isUploadingFile}
                  className="w-full sm:w-auto"
                >
                  <Upload className="h-4 w-4 mr-1" />
                  {isUploadingFile ? "Uploading..." : "Upload"}
                </Button>
              </div>
            </div>

            <Separator />

            {/* Admin Status Update */}
            {isAdmin && (
              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
                  Update Status (Admin Only)
                </h4>
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select
                      value={statusUpdate}
                      onValueChange={setStatusUpdate}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                        <SelectItem value="closed">Closed</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(statusUpdate === "resolved" ||
                    statusUpdate === "closed") && (
                    <div className="space-y-2">
                      <Label>Resolution Notes</Label>
                      <Textarea
                        value={resolutionNotes}
                        onChange={(e) => setResolutionNotes(e.target.value)}
                        placeholder="Enter resolution details..."
                        rows={3}
                      />
                    </div>
                  )}
                  <Button
                    onClick={handleUpdateStatus}
                    disabled={
                      statusUpdate === ticket.status || isUpdatingStatus
                    }
                    className="w-full sm:w-auto"
                  >
                    <CheckCircle className="h-4 w-4 mr-1" />
                    {isUpdatingStatus ? "Updating..." : "Update Status"}
                  </Button>
                </div>
                {ticket.resolutionNotes && (
                  <div className="mt-3 p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                    <p className="text-sm font-semibold mb-1">
                      Resolution Notes:
                    </p>
                    <p className="text-sm whitespace-pre-wrap">
                      {ticket.resolutionNotes}
                    </p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Comments */}
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Comments ({ticket.comments?.length || 0})
              </h4>

              {ticket.comments && ticket.comments.length > 0 && (
                <div className="space-y-3">
                  {ticket.comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-3 border rounded-lg space-y-2"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {comment.firstName} {comment.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {format(
                              new Date(comment.createdAt),
                              "MMM dd, yyyy HH:mm"
                            )}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {comment.role}
                        </Badge>
                      </div>
                      <p className="text-sm whitespace-pre-wrap">
                        {comment.content}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Comment */}
              <div className="space-y-2">
                <Label>Add Comment</Label>
                <Textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Write a comment..."
                  rows={3}
                />
                <Button
                  size="sm"
                  onClick={handleAddComment}
                  disabled={!newComment.trim() || isAddingComment}
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  {isAddingComment ? "Adding..." : "Add Comment"}
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
