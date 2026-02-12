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
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl">Edit Client</DialogTitle>
          <DialogDescription className="text-xs sm:text-sm">
            Update details for {client.companyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 sm:space-y-4 min-w-0">
          {/* Company & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Company Name</Label>
              <Input
                value={formData.companyName}
                onChange={(e) => handleChange("companyName", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Contact Person</Label>
              <Input
                value={formData.contactPerson}
                onChange={(e) => handleChange("contactPerson", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
          </div>

          {/* Contact details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Email</Label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange("email", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Phone</Label>
              <Input
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
          </div>

          {/* Address */}
          <div className="space-y-1 min-w-0">
            <Label className="text-sm">Address</Label>
            <Input
              value={formData.address}
              onChange={(e) => handleChange("address", e.target.value)}
              className="text-sm w-full min-w-0"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">City</Label>
              <Input
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Province</Label>
              <Input
                value={formData.province}
                onChange={(e) => handleChange("province", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
          </div>

          {/* Business */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Industry</Label>
              <Select
                value={formData.industry || ""}
                onValueChange={(value) => handleChange("industry", value)}
              >
                <SelectTrigger className="text-sm w-full min-w-0">
                  <SelectValue placeholder="Select industry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="food_and_beverage">Food & Beverage</SelectItem>
                  <SelectItem value="retail">Retail</SelectItem>
                  <SelectItem value="manufacturing">Manufacturing</SelectItem>
                  <SelectItem value="healthcare">Healthcare</SelectItem>
                  <SelectItem value="hospitality">Hospitality</SelectItem>
                  <SelectItem value="education">Education</SelectItem>
                  <SelectItem value="construction">Construction</SelectItem>
                  <SelectItem value="real_estate">Real Estate</SelectItem>
                  <SelectItem value="logistics">Logistics</SelectItem>
                  <SelectItem value="agriculture">Agriculture</SelectItem>
                  <SelectItem value="technology">Technology</SelectItem>
                  <SelectItem value="government">Government</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Waste Types</Label>
              <Input
                value={formData.wasteTypes}
                onChange={(e) => handleChange("wasteTypes", e.target.value)}
                className="text-sm w-full min-w-0"
              />
            </div>
          </div>

          {/* Contract dates */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Contract Start Date</Label>
              <DatePicker
                date={formData.contractStartDate ? new Date(formData.contractStartDate) : undefined}
                onDateChange={(date) =>
                  handleChange("contractStartDate", date ? format(date, "yyyy-MM-dd") : "")
                }
                placeholder="dd/mm/yyyy"
              />
            </div>
            <div className="space-y-1 min-w-0">
              <Label className="text-sm">Contract End Date</Label>
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
          <div className="space-y-1 min-w-0">
            <Label className="text-sm">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) => handleChange("status", value)}
            >
              <SelectTrigger className="text-sm w-full min-w-0">
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
          <div className="space-y-1 min-w-0">
            <Label className="text-sm">Notes</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              rows={3}
              className="text-sm w-full min-w-0 resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
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
