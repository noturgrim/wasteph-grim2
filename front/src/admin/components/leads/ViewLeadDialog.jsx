import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";

export function ViewLeadDialog({ open, onOpenChange, lead }) {
  if (!lead) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Lead Details</DialogTitle>
          <DialogDescription>
            View complete lead information
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Contact Information */}
          <div>
            <h3 className="text-sm font-semibold mb-3 text-foreground">Contact Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client Name</p>
                <p className="text-sm font-medium">{lead.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Company</p>
                <p className="text-sm font-medium">{lead.company || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Email</p>
                <p className="text-sm font-medium">{lead.email || "N/A"}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Phone</p>
                <p className="text-sm font-medium">{lead.phone || "N/A"}</p>
              </div>
              <div className="col-span-2">
                <p className="text-sm text-muted-foreground">Location</p>
                <p className="text-sm font-medium">{lead.location || "N/A"}</p>
              </div>
            </div>
          </div>

          {/* Pool Information */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Pool Information</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm font-medium">
                  {lead.isClaimed ? (
                    <span className="text-gray-700">Claimed</span>
                  ) : (
                    <span className="text-green-700">Available</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Added to Pool</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
              {lead.isClaimed && lead.claimedByUser && (
                <div>
                  <p className="text-sm text-muted-foreground">Claimed By</p>
                  <p className="text-sm font-medium">
                    {lead.claimedByUser.firstName} {lead.claimedByUser.lastName}
                  </p>
                </div>
              )}
              {lead.isClaimed && lead.claimedAt && (
                <div>
                  <p className="text-sm text-muted-foreground">Claimed On</p>
                  <p className="text-sm font-medium">
                    {format(new Date(lead.claimedAt), "MMM dd, yyyy 'at' hh:mm a")}
                  </p>
                </div>
              )}
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="text-sm font-medium">
                  {format(new Date(lead.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                </p>
              </div>
            </div>
          </div>

          {/* Notes */}
          {lead.notes && (
            <div className="border-t pt-4">
              <h3 className="text-sm font-semibold mb-2 text-foreground">Notes</h3>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {lead.notes}
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
