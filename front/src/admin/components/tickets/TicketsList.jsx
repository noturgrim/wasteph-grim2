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
      <div className="text-center py-8 text-muted-foreground">
        <p>No tickets found</p>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {tickets.map((ticket) => (
          <Card key={ticket.id} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base">{ticket.subject}</CardTitle>
                    {getPriorityBadge(ticket.priority)}
                    {getStatusBadge(ticket.status)}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {ticket.ticketNumber} • {getCategoryLabel(ticket.category)}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleViewTicket(ticket)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {ticket.description}
                </p>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span>
                    Created {format(new Date(ticket.createdAt), "MMM dd, yyyy")}
                  </span>
                  {ticket.creatorFirstName && (
                    <span>
                      by {ticket.creatorFirstName} {ticket.creatorLastName}
                    </span>
                  )}
                  {ticket.comments && ticket.comments.length > 0 && (
                    <span className="flex items-center gap-1">
                      <MessageSquare className="h-3 w-3" />
                      {ticket.comments.length}
                    </span>
                  )}
                  {ticket.attachments && ticket.attachments.length > 0 && (
                    <span className="flex items-center gap-1">
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
