import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Users, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    active: { label: "Active", className: "bg-green-600 text-white" },
    inactive: { label: "Inactive", className: "bg-gray-200 text-gray-700" },
    suspended: { label: "Suspended", className: "bg-red-100 text-red-700" },
  };
  const config = statusConfig[status] || { label: status, className: "" };
  return <Badge className={config.className}>{config.label}</Badge>;
};

export function ViewClientDialog({ open, onOpenChange, client, users, onAutoSchedule }) {
  if (!client) return null;

  const manager = users.find((u) => u.id === client.accountManager);
  const managerName = manager ? `${manager.firstName} ${manager.lastName}` : "-";

  const hasSchedulableContract = (client.contracts || []).some(
    (c) =>
      (c.status === "signed" || c.status === "hardbound_received") &&
      c.contractStartDate &&
      c.contractEndDate,
  );

  const formatDate = (date) => (date ? format(new Date(date), "MMM dd, yyyy") : "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-green-600" />
            Client Details
          </DialogTitle>
          <DialogDescription>
            Full details for {client.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header card */}
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-lg font-semibold">{client.companyName}</p>
              </div>
              {getStatusBadge(client.status)}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Contracts</p>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {(client.contracts || []).length > 0 ? (
                  client.contracts.map((c) => {
                    const statusMap = {
                      hardbound_received: { label: "Hardbound", className: "bg-emerald-700 text-white" },
                      signed: { label: "Signed", className: "bg-green-600 text-white" },
                      sent_to_client: { label: "Sent to Client", className: "bg-blue-600 text-white" },
                      sent_to_sales: { label: "Sent to Sales", className: "bg-cyan-600 text-white" },
                      requested: { label: "Requested", className: "bg-yellow-600 text-white" },
                      pending_request: { label: "Pending", className: "bg-gray-500 text-white" },
                    };
                    const cfg = statusMap[c.status] || { label: c.status, className: "bg-gray-500 text-white" };
                    return (
                      <Badge key={c.contractNumber} className={`${cfg.className} text-xs`}>
                        {c.contractNumber?.replace("CONT-", "") || cfg.label}
                      </Badge>
                    );
                  })
                ) : (
                  <span className="text-sm text-muted-foreground">—</span>
                )}
                {hasSchedulableContract && onAutoSchedule && (
                  <Button
                    variant="outline"
                    size="sm"
                    className="ml-auto h-7 text-xs"
                    onClick={() => {
                      onOpenChange(false);
                      onAutoSchedule(client);
                    }}
                  >
                    <CalendarDays className="mr-1.5 h-3.5 w-3.5" />
                    Auto Schedule
                  </Button>
                )}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Contact Person</p>
                <p className="font-medium">{client.contactPerson || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Account Manager</p>
                <p className="font-medium">{managerName}</p>
              </div>
            </div>
          </div>

          {/* Contact info */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Contact Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <span className="text-sm">{client.email}</span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm">{client.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Address</p>
                <p className="text-sm">{client.address || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">City</p>
                <p className="text-sm">{client.city || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Province</p>
                <p className="text-sm">{client.province || "-"}</p>
              </div>
            </div>
          </div>

          {/* Business info */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Business Information
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Industry</p>
                <p className="text-sm">{client.industry || "-"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Waste Types</p>
                <p className="text-sm">{client.wasteTypes || "-"}</p>
              </div>
            </div>
          </div>

          {/* Contract period */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Contract Period
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-sm">{formatDate(client.contractStartDate)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">End Date</p>
                <p className="text-sm">{formatDate(client.contractEndDate)}</p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {client.notes && (
            <div>
              <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                Notes
              </h4>
              <p className="text-sm bg-gray-50 dark:bg-gray-900 rounded p-3">{client.notes}</p>
            </div>
          )}

          {/* Timestamps */}
          <div className="border-t pt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created: {formatDate(client.createdAt)}</span>
              <span>Updated: {formatDate(client.updatedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
