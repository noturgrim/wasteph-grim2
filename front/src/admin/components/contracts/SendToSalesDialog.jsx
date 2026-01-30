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
import { Send, Loader2, AlertTriangle, User, Mail, Building } from "lucide-react";

export function SendToSalesDialog({ open, onOpenChange, contract, users, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm();
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!contract) return null;

  const contractData = contract.contract || {};
  const salesPerson = users?.find(
    (u) => u.id === contract.proposal?.requestedBy,
  );
  const salesPersonName = salesPerson
    ? `${salesPerson.firstName} ${salesPerson.lastName}`
    : "Unknown";
  const salesEmail = salesPerson?.email || "N/A";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Send className="h-5 w-5 text-green-600" />
            Send Contract to Sales
          </DialogTitle>
          <DialogDescription>
            Send the generated contract to the sales team for follow-up.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Contract Info */}
          <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Building className="h-4 w-4 text-muted-foreground" />
              <div>
                <p className="text-xs text-muted-foreground">Client</p>
                <p className="text-sm font-semibold">
                  {contractData.clientName || "N/A"} — {contractData.companyName || "N/A"}
                </p>
              </div>
            </div>
            <div className="border-t border-green-200 dark:border-green-800 pt-3">
              <p className="text-xs text-muted-foreground mb-1">Sales Person</p>
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm font-semibold">{salesPersonName}</p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{salesEmail}</p>
              </div>
            </div>
          </div>

          {/* Warning */}
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-100">
                Confirm Action
              </p>
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mt-1">
                This will mark the contract as sent to sales. The sales team will be notified to follow up with the client.
              </p>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="bg-green-600 hover:bg-green-700"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isSubmitting ? "Sending..." : "Send to Sales"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
