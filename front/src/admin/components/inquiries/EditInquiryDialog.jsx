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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

export function EditInquiryDialog({ open, onOpenChange, inquiry, users = [], onSubmit, isSubmitting }) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    source: "phone",
    status: "initial_comms",
    assignedTo: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  useEffect(() => {
    if (inquiry && open) {
      setFormData({
        name: inquiry.name || "",
        email: inquiry.email || "",
        phone: inquiry.phone || "",
        company: inquiry.company || "",
        message: inquiry.message || "",
        source: inquiry.source || "phone",
        status: inquiry.status || "initial_comms",
        assignedTo: inquiry.assignedTo || "",
        notes: inquiry.notes || "",
      });
    }
  }, [inquiry, open]);

  const validateForm = () => {
    const errors = {};
    if (!formData.name?.trim()) errors.name = "Name is required.";
    if (!formData.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }
    if (!formData.message?.trim()) errors.message = "Message is required.";
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
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Edit Inquiry</DialogTitle>
          <DialogDescription>
            Update the inquiry here. Click save changes when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <Label htmlFor="edit-name" className="text-right pt-2">Name</Label>
            <div className="flex-1">
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: null });
                  }
                }}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <Label htmlFor="edit-email" className="text-right pt-2">Email</Label>
            <div className="flex-1">
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: null });
                  }
                }}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="edit-phone" className="text-right">Phone Number</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="edit-company" className="text-right">Company</Label>
            <Input
              id="edit-company"
              value={formData.company}
              onChange={(e) =>
                setFormData({ ...formData, company: e.target.value })
              }
            />
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="edit-source" className="text-right">Source</Label>
            <Select
              value={formData.source}
              onValueChange={(val) =>
                setFormData({ ...formData, source: val })
              }
            >
              <SelectTrigger id="edit-source">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="website">Website</SelectItem>
                <SelectItem value="phone">Phone</SelectItem>
                <SelectItem value="facebook">Facebook</SelectItem>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="walk-in">Walk-in</SelectItem>
                <SelectItem value="cold-approach">Cold Approach</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="edit-status" className="text-right">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(val) =>
                setFormData({ ...formData, status: val })
              }
            >
              <SelectTrigger id="edit-status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="submitted_proposal">Submitted Proposal</SelectItem>
                <SelectItem value="initial_comms">Initial Comms</SelectItem>
                <SelectItem value="negotiating">Negotiating</SelectItem>
                <SelectItem value="to_call">To Call</SelectItem>
                <SelectItem value="submitted_company_profile">Submitted Company Profile</SelectItem>
                <SelectItem value="na">N/A</SelectItem>
                <SelectItem value="waiting_for_feedback">Waiting for Feedback</SelectItem>
                <SelectItem value="declined">Declined</SelectItem>
                <SelectItem value="on_boarded">On Boarded</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-center gap-4">
            <Label htmlFor="edit-assigned" className="text-right">Assigned To</Label>
            <Select
              value={formData.assignedTo}
              onValueChange={(val) =>
                setFormData({ ...formData, assignedTo: val })
              }
            >
              <SelectTrigger id="edit-assigned">
                <SelectValue placeholder="Select team member" />
              </SelectTrigger>
              <SelectContent>
                {users.length === 0 ? (
                  <div className="p-2 text-sm text-muted-foreground">No users found</div>
                ) : (
                  users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.firstName} {user.lastName} ({user.role})
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <Label htmlFor="edit-message" className="text-right pt-2">Message</Label>
            <div className="flex-1">
              <Textarea
                id="edit-message"
                rows={4}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (formErrors.message) {
                    setFormErrors({ ...formErrors, message: null });
                  }
                }}
                className={formErrors.message ? "border-red-500" : ""}
              />
              {formErrors.message && (
                <p className="text-sm text-red-500 mt-1">{formErrors.message}</p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-[120px_1fr] items-start gap-4">
            <Label htmlFor="edit-notes" className="text-right pt-2">Notes</Label>
            <Textarea
              id="edit-notes"
              rows={3}
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Add internal notes"
            />
          </div>

          <DialogFooter className="mt-6">
            <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
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
