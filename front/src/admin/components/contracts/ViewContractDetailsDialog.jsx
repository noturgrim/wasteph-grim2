import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileText } from "lucide-react";
import { ContractDetailsSection } from "./ContractDetailsSection";

export function ViewContractDetailsDialog({ open, onOpenChange, contract, users }) {
  if (!contract) return null;

  const clientName = contract.inquiry?.name || "N/A";
  const salesPerson = users.find((u) => u.id === contract.proposal?.requestedBy);
  const salesPersonName = salesPerson
    ? `${salesPerson.firstName} ${salesPerson.lastName}`
    : "Unknown";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-blue-600" />
            Contract Request Details
          </DialogTitle>
          <DialogDescription>
            View all details submitted by sales for this contract request.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Basic Info */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Client</p>
                <p className="font-semibold">{clientName}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Proposal Number</p>
                <p className="font-mono text-sm italic">
                  {contract.proposal?.proposalNumber || "N/A"}
                </p>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Sales Person</p>
              <p className="font-medium">{salesPersonName}</p>
            </div>
          </div>

          {/* Contract Details */}
          <ContractDetailsSection contract={contract} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
