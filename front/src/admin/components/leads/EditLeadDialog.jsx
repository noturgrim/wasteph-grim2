import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";

export function EditLeadDialog({ open, onOpenChange, lead, onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    clientName: "",
    company: "",
    email: "",
    phone: "",
    location: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (lead && open) {
      setFormData({
        clientName: lead.clientName || "",
        company: lead.company || "",
        email: lead.email || "",
        phone: lead.phone || "",
        location: lead.location || "",
        notes: lead.notes || "",
      });
    }
  }, [lead, open]);

  const validateForm = () => {
    const errors = {};
    if (!formData.clientName?.trim()) errors.clientName = "Client name is required.";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    onSubmit(formData);
  };

  const handleOpenChange = (isOpen) => {
    if (!isOpen) {
      setFormErrors({});
    }
    onOpenChange(isOpen);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
          <DialogDescription>
            Update the lead information here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-clientName">Client Name *</Label>
              <Input
                id="edit-clientName"
                value={formData.clientName}
                onChange={(e) => {
                  setFormData({ ...formData, clientName: e.target.value });
                  if (formErrors.clientName) {
                    setFormErrors({ ...formErrors, clientName: null });
                  }
                }}
                className={formErrors.clientName ? "border-red-500" : ""}
              />
              {formErrors.clientName && (
                <p className="text-sm text-red-500 mt-1">{formErrors.clientName}</p>
              )}
            </div>

            <div>
              <Label htmlFor="edit-company">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="edit-phone">Phone</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-location">Location</Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                placeholder="City, Province"
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="edit-notes">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Any additional information about this potential client..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
