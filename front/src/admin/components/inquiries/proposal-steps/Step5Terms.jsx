import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export function Step5Terms({ terms, onTermsChange }) {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold mb-2">Terms & Conditions</h3>
        <p className="text-sm text-muted-foreground mb-6">
          Specify payment terms, schedule, and additional notes.
        </p>
      </div>

      <div className="border-t pt-4">
        <Label className="text-base font-semibold mb-3 block">Terms & Conditions</Label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="paymentTerms">Payment Terms</Label>
            <Input
              id="paymentTerms"
              value={terms.paymentTerms}
              onChange={(e) => onTermsChange({ ...terms, paymentTerms: e.target.value })}
              placeholder="e.g., Net 30, Due upon receipt"
            />
          </div>

          <div>
            <Label htmlFor="schedule">Schedule</Label>
            <Input
              id="schedule"
              value={terms.schedule}
              onChange={(e) => onTermsChange({ ...terms, schedule: e.target.value })}
              placeholder="e.g., Weekly, Bi-weekly"
            />
          </div>

          <div className="col-span-2">
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={terms.notes}
              onChange={(e) => onTermsChange({ ...terms, notes: e.target.value })}
              placeholder="Any additional terms or notes..."
              rows={4}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
