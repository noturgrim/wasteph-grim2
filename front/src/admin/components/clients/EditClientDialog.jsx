import { useState, useEffect } from "react";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/ui/date-picker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function EditClientDialog({ open, onOpenChange, client, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (client) {
      setFormData({
        companyName: client.companyName || "",
        contactPerson: client.contactPerson || "",
        email: client.email || "",
        phone: client.phone || "",
        address: client.address || "",
        city: client.city || "",
        province: client.province || "",
        industry: client.industry || "",
        wasteTypes: client.wasteTypes || "",
        contractStartDate: client.contractStartDate
          ? new Date(client.contractStartDate).toISOString().split("T")[0]
          : "",
        contractEndDate: client.contractEndDate
          ? new Date(client.contractEndDate).toISOString().split("T")[0]
          : "",
        status: client.status || "active",
        notes: client.notes || "",
      });
    }
  }, [client, open]);

  if (!client) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await onConfirm(formData);
      onOpenChange(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Client</DialogTitle>
          <DialogDescription>
            Update details for {client.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Company & Contact */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Company Name</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
              />
            </div>
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1">
            <Label>Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>City</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Province</Label>
              <Input
                value={formData.province}
                onChange={(e) => handleChange("province", e.target.value)}
              />
            </div>
          </div>

          {/* Business */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Industry</Label>
              <Input
                value={formData.industry}
                onChange={(e) => handleChange("industry", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Waste Types</Label>
              <Input
                value={formData.wasteTypes}
                onChange={(e) => handleChange("wasteTypes", e.target.value)}
              />
            </div>
          </div>

          {/* Contract dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>Contract Start Date</Label>
              <DatePicker
                date={formData.contractStartDate ? new Date(formData.contractStartDate) : undefined}
                onDateChange={(date) =>
                  handleChange("contractStartDate", date ? format(date, "yyyy-MM-dd") : "")
                }
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="space-y-1">
              <Label>Contract End Date</Label>
              <DatePicker
                date={formData.contractEndDate ? new Date(formData.contractEndDate) : undefined}
                onDateChange={(date) =>
                  handleChange("contractEndDate", date ? format(date, "yyyy-MM-dd") : "")
                }
                placeholder="dd/mm/yyyy"
              />
            </div>
          </div>

          {/* Status */}
          <div className="space-y-1">
            <Label>Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Notes */}
          <div className="space-y-1">
            <Label>Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
