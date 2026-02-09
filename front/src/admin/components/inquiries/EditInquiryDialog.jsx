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
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, AlertCircle, Calendar } from "lucide-react";
import { api } from "../../services/api";
import { ScheduleEventDialog } from "../calendar/ScheduleEventDialog";

export function EditInquiryDialog({
  open,
  onOpenChange,
  inquiry,
  users = [],
  isMasterSales = false,
  onSubmit,
  isSubmitting,
}) {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    location: "",
    message: "",
    source: "phone",
    status: "initial_comms",
    assignedTo: "",
    serviceId: "",
    notes: "",
    isInformationComplete: true,
  });

  const [formErrors, setFormErrors] = useState({});
  const [services, setServices] = useState([]);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);

  const handleEventScheduled = () => {
    // Could refresh or show toast
  };

  // Load services on mount
  useEffect(() => {
    const loadServices = async () => {
      try {
        const response = await api.getServices();
        setServices(response.data || []);
      } catch (error) {
        console.error("Failed to load services:", error);
      }
    };

    if (open) {
      loadServices();
    }
  }, [open]);

  useEffect(() => {
    if (inquiry && open) {
      setFormData({
        name: inquiry.name || "",
        email: inquiry.email || "",
        phone: inquiry.phone || "",
        company: inquiry.company || "",
        location: inquiry.location || "",
        message: inquiry.message || "",
        source: inquiry.source || "phone",
        status: inquiry.status || "initial_comms",
        assignedTo: inquiry.assignedTo || "",
        serviceId: inquiry.serviceId || "",
        notes: inquiry.notes || "",
        isInformationComplete: inquiry.isInformationComplete !== false,
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

    // Stricter validation when marking as Information Complete
    if (formData.isInformationComplete) {
      if (!formData.phone?.trim()) errors.phone = "Phone is required when marking as complete.";
      if (!formData.company?.trim()) errors.company = "Company is required when marking as complete.";
      if (!formData.location?.trim()) errors.location = "Location is required when marking as complete.";
      if (!formData.serviceId) errors.serviceId = "Service type is required when marking as complete.";
      if (formData.email === "noemail@wasteph.com") {
        errors.email = "Please provide the client's actual email before marking as complete.";
      }
    }

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
      <DialogContent
        className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto"
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader>
          <DialogTitle>Edit Inquiry</DialogTitle>
          <DialogDescription>
            Update the inquiry here. Click save changes when you're done.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 mt-4">
          {/* 2-column grid for most fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="edit-name">Name <span className="text-red-500">*</span></Label>
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
                <p className="text-sm text-red-500">{formErrors.name}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="edit-email">Email <span className="text-red-500">*</span></Label>
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
                <p className="text-sm text-red-500">{formErrors.email}</p>
              )}
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="edit-phone">
                Phone Number {formData.isInformationComplete && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) => {
                  setFormData({ ...formData, phone: e.target.value });
                  if (formErrors.phone) {
                    setFormErrors({ ...formErrors, phone: null });
                  }
                }}
                className={formErrors.phone ? "border-red-500" : ""}
              />
              {formErrors.phone && (
                <p className="text-sm text-red-500">{formErrors.phone}</p>
              )}
            </div>

            {/* Company */}
            <div className="space-y-2">
              <Label htmlFor="edit-company">
                Company {formData.isInformationComplete && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) => {
                  setFormData({ ...formData, company: e.target.value });
                  if (formErrors.company) {
                    setFormErrors({ ...formErrors, company: null });
                  }
                }}
                className={formErrors.company ? "border-red-500" : ""}
              />
              {formErrors.company && (
                <p className="text-sm text-red-500">{formErrors.company}</p>
              )}
            </div>

            {/* Location */}
            <div className="space-y-2">
              <Label htmlFor="edit-location">
                Location {formData.isInformationComplete && <span className="text-red-500">*</span>}
              </Label>
              <Input
                id="edit-location"
                value={formData.location}
                onChange={(e) => {
                  setFormData({ ...formData, location: e.target.value });
                  if (formErrors.location) {
                    setFormErrors({ ...formErrors, location: null });
                  }
                }}
                placeholder="City, Province or Address"
                className={formErrors.location ? "border-red-500" : ""}
              />
              {formErrors.location && (
                <p className="text-sm text-red-500">{formErrors.location}</p>
              )}
            </div>

            {/* Service */}
            <div className="space-y-2">
              <Label htmlFor="edit-service">
                Service {formData.isInformationComplete && <span className="text-red-500">*</span>}
              </Label>
              <Select
                value={formData.serviceId}
                onValueChange={(val) => {
                  setFormData({ ...formData, serviceId: val });
                  if (formErrors.serviceId) {
                    setFormErrors({ ...formErrors, serviceId: null });
                  }
                }}
              >
                <SelectTrigger id="edit-service" className={formErrors.serviceId ? "border-red-500" : ""}>
                  <SelectValue placeholder="Select service type" />
                </SelectTrigger>
                <SelectContent>
                  {services.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">
                      No services found
                    </div>
                  ) : (
                    services.map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              {formErrors.serviceId && (
                <p className="text-sm text-red-500">{formErrors.serviceId}</p>
              )}
            </div>

            {/* Source */}
            <div className="space-y-2">
              <Label htmlFor="edit-source">Source</Label>
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
                  <SelectItem value="referral">Referral</SelectItem>
                  <SelectItem value="lead-pool">Lead Pool</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label htmlFor="edit-status">Status</Label>
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
                  <SelectItem value="submitted_proposal">
                    Submitted Proposal
                  </SelectItem>
                  <SelectItem value="initial_comms">Initial Comms</SelectItem>
                  <SelectItem value="negotiating">Negotiating</SelectItem>
                  <SelectItem value="to_call">To Call</SelectItem>
                  <SelectItem value="submitted_company_profile">
                    Submitted Company Profile
                  </SelectItem>
                  <SelectItem value="na">N/A</SelectItem>
                  <SelectItem value="waiting_for_feedback">
                    Waiting for Feedback
                  </SelectItem>
                  <SelectItem value="declined">Declined</SelectItem>
                  <SelectItem value="on_boarded">On Boarded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Assigned To - Only for Master Sales */}
            {isMasterSales && (
              <div className="space-y-2">
                <Label htmlFor="edit-assigned">Assigned To</Label>
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
                      <div className="p-2 text-sm text-muted-foreground">
                        No users found
                      </div>
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
            )}
          </div>

          {/* Message - Full width */}
          <div className="space-y-2">
            <Label htmlFor="edit-message">Message <span className="text-red-500">*</span></Label>
            <Textarea
              id="edit-message"
              rows={3}
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
              <p className="text-sm text-red-500">{formErrors.message}</p>
            )}
          </div>

          {/* Information Complete Checkbox */}
          <div className={`flex items-start space-x-3 rounded-md border p-4 ${formData.isInformationComplete ? "border-green-500/30 bg-green-50/50 dark:bg-green-950/20" : "bg-muted/30 dark:bg-muted/20"}`}>
            <Checkbox
              id="edit-info-complete"
              checked={formData.isInformationComplete}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, isInformationComplete: checked })
              }
            />
            <div className="space-y-1 leading-none flex-1">
              <Label
                htmlFor="edit-info-complete"
                className="font-medium cursor-pointer"
              >
                Information Complete
              </Label>
              <p className="text-sm text-muted-foreground">
                Check this after visiting the client site or gathering all
                required information. You can only request a proposal when
                information is complete.
              </p>
              {formData.isInformationComplete && (
                <p className="text-xs text-amber-600 dark:text-amber-500 mt-2 font-medium">
                  All fields marked with * must be filled in. Ensure client name, email, company, phone, location, and service are accurate — this data will be used in the proposal and cannot be changed after submission.
                </p>
              )}
              {!formData.isInformationComplete && (
                <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-500 mt-2">
                  <span>
                    Proposal requests are disabled until information is complete
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Deprecated: Notes field - use timeline instead */}
          {formData.notes && (
            <div className="space-y-2 opacity-50">
              <Label htmlFor="edit-notes">
                Legacy Notes
                <span className="text-xs text-muted-foreground font-normal ml-2">
                  (Read-only)
                </span>
              </Label>
              <Textarea
                id="edit-notes"
                rows={2}
                value={formData.notes}
                disabled
                className="bg-muted cursor-not-allowed"
              />
              <p className="text-xs text-muted-foreground">
                Use the timeline in View Details to add new notes
              </p>
            </div>
          )}

          <div className="flex flex-col gap-3 pt-2">
            <Button type="submit" disabled={isSubmitting} className="w-full">
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save changes
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsScheduleDialogOpen(true)}
              className="w-full"
            >
              <Calendar className="mr-2 h-4 w-4" />
              Schedule Event
            </Button>
          </div>
        </form>
      </DialogContent>

      {/* Schedule Event Dialog */}
      <ScheduleEventDialog
        open={isScheduleDialogOpen}
        onOpenChange={setIsScheduleDialogOpen}
        inquiryId={inquiry?.id}
        onSuccess={handleEventScheduled}
      />
    </Dialog>
  );
}
