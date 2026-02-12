import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, MessageSquare, Paperclip } from "lucide-react";
import { ViewTicketDialog } from "./ViewTicketDialog";

const getPriorityBadge = (priority) => {
  const config = {
    low: { label: "Low", className: "bg-blue-100 text-blue-700" },
    medium: { label: "Medium", className: "bg-yellow-100 text-yellow-700" },
    high: { label: "High", className: "bg-orange-100 text-orange-700" },
    urgent: { label: "Urgent", className: "bg-red-600 text-white" },
  };
  const { label, className } = config[priority] || config.medium;
  return <Badge className={className}>{label}</Badge>;
};

const getStatusBadge = (status) => {
  const config = {
    open: { label: "Open", className: "bg-blue-600 text-white" },
    in_progress: { label: "In Progress", className: "bg-purple-600 text-white" },
    resolved: { label: "Resolved", className: "bg-green-600 text-white" },
    closed: { label: "Closed", className: "bg-gray-500 text-white" },
  };
  const { label, className } = config[status] || config.open;
  return <Badge className={className}>{label}</Badge>;
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

export const TicketsList = ({ tickets, onRefresh }) => {
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  const handleViewTicket = (ticket) => {
    setSelectedTicket(ticket);
    setIsViewDialogOpen(true);
  };

  if (!tickets || tickets.length === 0) {
    return (
      <div className="text-center py-8 text-xs sm:text-sm text-muted-foreground">
        <p>No tickets found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-2 sm:space-y-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div className="space-y-2 flex-1 min-w-0">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <CardTitle className="text-sm sm:text-base truncate">{ticket.subject}</CardTitle>
                    <div className="flex items-center gap-2 flex-wrap">
                      {getPriorityBadge(ticket.priority)}
                      {getStatusBadge(ticket.status)}
                    </div>
                  </div>
                  <p className="text-xs sm:text-sm text-muted-foreground break-words">
                    {ticket.ticketNumber} • {getCategoryLabel(ticket.category)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTicket(ticket)}
                  className="w-full sm:w-auto shrink-0 text-xs sm:text-sm"
                >
                  <Eye className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
                  <span className="hidden sm:inline ml-1">View</span>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0 p-3 sm:p-6 sm:pt-0">
              <div className="space-y-2">
                <p className="text-xs sm:text-sm text-muted-foreground line-clamp-2 break-words">
                  {ticket.description}
                </p>
                <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs text-muted-foreground">
                  <span className="whitespace-nowrap">
                    Created {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                  </span>
                  {ticket.creatorFirstName && (
                    <span className="truncate">
                      by {ticket.creatorFirstName} {ticket.creatorLastName}
                    </span>
                  )}
                  {ticket.comments && ticket.comments.length > 0 && (
                    <span className="flex items-center gap-1 shrink-0">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.comments.length}
                    </span>
                  )}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <span className="flex items-center gap-1 shrink-0">
                      <Paperclip className="h-3 w-3" />
                      {ticket.attachments.length}
                    </span>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <ViewTicketDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        ticketId={selectedTicket?.id}
        onRefresh={onRefresh}
      />
    </>
  );
};
