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
import { DatePicker } from "@/components/ui/date-picker";
import { TimePicker } from "@/components/ui/time-picker";
import { Loader2 } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";

export function ScheduleEventDialog({
  open,
  onOpenChange,
  inquiryId = null,
  onEventScheduled,
  onSuccess,
  prefilledData = {},
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inquiries, setInquiries] = useState([]);
  const [clients, setClients] = useState([]);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "",
    scheduledDate: new Date(),
    startTime: "",
    endTime: "",
    inquiryId: inquiryId || prefilledData.inquiryId || "",
    clientId: prefilledData.clientId || "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // Load inquiries and clients for linking
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;
      try {
        const [inquiriesRes, clientsRes] = await Promise.all([
          api.getInquiries({ limit: 100 }),
          api.getClients({ limit: 100 }),
        ]);
        setInquiries(inquiriesRes.data || []);
        setClients(clientsRes.data || []);
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [open]);

  // Reset form when dialog opens
  useEffect(() => {
    if (open) {
      const initialDate = prefilledData?.scheduledDate
        ? new Date(prefilledData.scheduledDate)
        : new Date();
      setFormData({
        title: "",
        description: "",
        eventType: "",
        scheduledDate: initialDate,
        startTime: "",
        endTime: "",
        inquiryId: inquiryId || prefilledData?.inquiryId || "",
        clientId: prefilledData?.clientId || "",
        notes: "",
      });
      setFormErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inquiryId, prefilledData?.scheduledDate]);

  const validateForm = () => {
    const errors = {};

    if (!formData.title?.trim()) {
      errors.title = "Title is required";
    }

    if (!formData.scheduledDate) {
      errors.scheduledDate = "Date is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType || undefined,
        scheduledDate: formData.scheduledDate.toISOString(),
        startTime: formData.startTime || undefined,
        endTime: formData.endTime || undefined,
        inquiryId:
          formData.inquiryId && formData.inquiryId !== "none"
            ? formData.inquiryId
            : undefined,
        clientId:
          formData.clientId && formData.clientId !== "none"
            ? formData.clientId
            : undefined,
        notes: formData.notes || undefined,
      };

      if (onEventScheduled) {
        await onEventScheduled(eventData);
      } else {
        await api.createCalendarEvent(eventData);
      }

      toast.success("Event scheduled successfully");
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (error) {
      toast.error(error.message || "Failed to schedule event");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Schedule Event</DialogTitle>
          <DialogDescription>
            Create a new event in your calendar
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="title">
              Event Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => {
                setFormData({ ...formData, title: e.target.value });
                if (formErrors.title) {
                  setFormErrors({ ...formErrors, title: null });
                }
              }}
              placeholder="Site visit, Follow-up call, Meeting..."
              className={formErrors.title ? "border-red-500" : ""}
            />
            {formErrors.title && (
              <p className="text-sm text-red-500">{formErrors.title}</p>
            )}
          </div>

          {/* Event Type */}
          <div className="space-y-2">
            <Label htmlFor="eventType">Event Type (Optional)</Label>
            <Select
              value={formData.eventType}
              onValueChange={(value) =>
                setFormData({ ...formData, eventType: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select event type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="site_visit">Site Visit</SelectItem>
                <SelectItem value="call">Call</SelectItem>
                <SelectItem value="meeting">Meeting</SelectItem>
                <SelectItem value="follow_up">Follow Up</SelectItem>
                <SelectItem value="presentation">Presentation</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              placeholder="What is this event about..."
              rows={3}
            />
          </div>

          {/* Date and Time */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>
                Date <span className="text-red-500">*</span>
              </Label>
              <DatePicker
                date={formData.scheduledDate}
                onDateChange={(date) =>
                  setFormData({
                    ...formData,
                    scheduledDate: date || new Date(),
                  })
                }
                placeholder="Select date"
              />
              {formErrors.scheduledDate && (
                <p className="text-sm text-red-500">
                  {formErrors.scheduledDate}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <TimePicker
                  value={formData.startTime}
                  onChange={(value) =>
                    setFormData({ ...formData, startTime: value })
                  }
                  placeholder="Select start time"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <TimePicker
                  value={formData.endTime}
                  onChange={(value) =>
                    setFormData({ ...formData, endTime: value })
                  }
                  placeholder="Select end time"
                />
              </div>
            </div>
          </div>

          {/* Link to Inquiry or Client */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inquiryId">Link to Inquiry (Optional)</Label>
              <Select
                value={formData.inquiryId || "none"}
                onValueChange={(value) => {
                  const newInquiryId = value === "none" ? "" : value;
                  setFormData({
                    ...formData,
                    inquiryId: newInquiryId,
                    clientId: newInquiryId ? "" : formData.clientId,
                  });
                }}
                disabled={!!formData.clientId && formData.clientId !== "none"}
              >
                <SelectTrigger id="inquiryId">
                  <SelectValue placeholder="Select inquiry" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {inquiries.map((inquiry) => (
                    <SelectItem key={inquiry.id} value={inquiry.id}>
                      {inquiry.name} - {inquiry.company || "No company"}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="clientId">Link to Client (Optional)</Label>
              <Select
                value={formData.clientId || "none"}
                onValueChange={(value) => {
                  const newClientId = value === "none" ? "" : value;
                  setFormData({
                    ...formData,
                    clientId: newClientId,
                    inquiryId: newClientId ? "" : formData.inquiryId,
                  });
                }}
                disabled={!!formData.inquiryId && formData.inquiryId !== "none"}
              >
                <SelectTrigger id="clientId">
                  <SelectValue placeholder="Select client" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {clients.map((client) => (
                    <SelectItem key={client.id} value={client.id}>
                      {client.companyName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) =>
                setFormData({ ...formData, notes: e.target.value })
              }
              placeholder="Additional notes or reminders..."
              rows={3}
            />
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
              Schedule Event
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
