import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "lucide-react";

export function Step2ClientInfo({ clientInfo, onClientInfoChange, inquiry }) {
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Client & Proposal Information</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Specify who this proposal is addressed to and when it's valid.
        </p>
      </div>

      <div className="border-t pt-4 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <Label htmlFor="clientName">To / Person to Address *</Label>
            <Input
              id="clientName"
              value={clientInfo.clientName}
              onChange={(e) => onClientInfoChange({ ...clientInfo, clientName: e.target.value })}
              placeholder="e.g., John Doe"
              required
            />
          </div>

          <div>
            <Label htmlFor="clientPosition">Position</Label>
            <Input
              id="clientPosition"
              value={clientInfo.clientPosition}
              onChange={(e) => onClientInfoChange({ ...clientInfo, clientPosition: e.target.value })}
              placeholder="e.g., Operations Manager"
            />
          </div>

          <div>
            <Label htmlFor="clientCompany">Company Name *</Label>
            <Input
              id="clientCompany"
              value={clientInfo.clientCompany}
              onChange={(e) => onClientInfoChange({ ...clientInfo, clientCompany: e.target.value })}
              placeholder="Company name"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pre-filled from inquiry
            </p>
          </div>

          <div className="col-span-2">
            <Label htmlFor="clientAddress">Address *</Label>
            <Input
              id="clientAddress"
              value={clientInfo.clientAddress}
              onChange={(e) => onClientInfoChange({ ...clientInfo, clientAddress: e.target.value })}
              placeholder="Complete address"
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              Pre-filled from inquiry
            </p>
          </div>

          <div>
            <Label htmlFor="proposalDate">Proposal Date</Label>
            <div className="relative">
              <Input
                id="proposalDate"
                type="date"
                value={clientInfo.proposalDate}
                onChange={(e) => onClientInfoChange({ ...clientInfo, proposalDate: e.target.value })}
              />
              <Calendar className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Defaults to today
            </p>
          </div>

          <div>
            <Label htmlFor="validityDays">Validity (Days)</Label>
            <Input
              id="validityDays"
              type="number"
              min="1"
              value={clientInfo.validityDays}
              onChange={(e) => onClientInfoChange({ ...clientInfo, validityDays: e.target.value })}
              placeholder="e.g., 30"
            />
            <p className="text-xs text-muted-foreground mt-1">
              How long this proposal is valid
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
