import { useState, useEffect, useRef } from "react";
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
  const [clientContracts, setClientContracts] = useState([]);
  const [isLoadingContracts, setIsLoadingContracts] = useState(false);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    eventType: "",
    scheduledDate: new Date(),
    startTime: "",
    endTime: "",
    inquiryId: inquiryId || prefilledData.inquiryId || "",
    clientId: prefilledData.clientId || "",
    contractId: "",
    notes: "",
  });

  const [formErrors, setFormErrors] = useState({});

  // OPTIMIZATION: Cache inquiries and clients to avoid refetching on every dialog open
  const dataCache = useRef({ inquiries: null, clients: null, timestamp: 0 });
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Load inquiries and clients for linking (with caching)
  useEffect(() => {
    const loadData = async () => {
      if (!open) return;

      const now = Date.now();
      const cacheValid = now - dataCache.current.timestamp < CACHE_DURATION;

      // Use cached data if valid
      if (cacheValid && dataCache.current.inquiries && dataCache.current.clients) {
        setInquiries(dataCache.current.inquiries);
        setClients(dataCache.current.clients);
        return;
      }

      // Fetch fresh data
      try {
        const [inquiriesRes, clientsRes] = await Promise.all([
          api.getInquiries({ limit: 100 }),
          api.getClients({ limit: 100 }),
        ]);
        
        const fetchedInquiries = inquiriesRes.data || [];
        const fetchedClients = clientsRes.data || [];
        
        setInquiries(fetchedInquiries);
        setClients(fetchedClients);
        
        // Update cache
        dataCache.current = {
          inquiries: fetchedInquiries,
          clients: fetchedClients,
          timestamp: now,
        };
      } catch (error) {
        console.error("Failed to load data:", error);
      }
    };

    loadData();
  }, [open]);

  // Fetch contracts when client is selected
  useEffect(() => {
    const fetchClientContracts = async () => {
      if (!formData.clientId || formData.clientId === "none") {
        setClientContracts([]);
        setFormData((prev) => ({ ...prev, contractId: "" }));
        return;
      }

      setIsLoadingContracts(true);
      try {
        // Fetch signed and hardbound contracts (active contracts)
        const response = await api.getContracts({
          clientId: formData.clientId,
          limit: 100,
        });
        
        // Filter for signed or hardbound contracts (active contracts only)
        // API returns nested structure: { contract: {...}, proposal: {...} }
        const activeContracts = (response.data || [])
          .filter(
            (item) => item.contract.status === "signed" || item.contract.status === "hardbound_received"
          )
          .map((item) => item.contract); // Extract contract object
        
        setClientContracts(activeContracts);
        
        // Auto-select if only one active contract
        if (activeContracts.length === 1) {
          setFormData((prev) => ({ ...prev, contractId: activeContracts[0].id }));
        } else {
          setFormData((prev) => ({ ...prev, contractId: "" }));
        }
      } catch (error) {
        console.error("Failed to fetch contracts:", error);
        setClientContracts([]);
      } finally {
        setIsLoadingContracts(false);
      }
    };

    fetchClientContracts();
  }, [formData.clientId]);

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
        contractId: "",
        notes: "",
      });
      setFormErrors({});
      setClientContracts([]);
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

    // If client has multiple contracts, contract selection is required
    if (
      formData.clientId &&
      formData.clientId !== "none" &&
      clientContracts.length > 1 &&
      (!formData.contractId || formData.contractId === "none")
    ) {
      errors.contractId = "Please select a contract";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      // Combine date with start time (if provided) for accurate scheduled date
      let scheduledDateTime = new Date(formData.scheduledDate);
      
      if (formData.startTime) {
        const [hours, minutes] = formData.startTime.split(":");
        scheduledDateTime.setHours(parseInt(hours, 10), parseInt(minutes, 10), 0, 0);
      } else {
        // If no start time, default to start of day
        scheduledDateTime.setHours(0, 0, 0, 0);
      }

      const eventData = {
        title: formData.title,
        description: formData.description || undefined,
        eventType: formData.eventType || undefined,
        scheduledDate: scheduledDateTime.toISOString(),
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
        contractId:
          formData.contractId && formData.contractId !== "none"
            ? formData.contractId
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
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto w-[95vw] sm:w-full">
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
                fromDate={new Date()}
                disabledDates={(date) => {
                  const today = new Date();
                  today.setHours(0, 0, 0, 0);
                  return date < today;
                }}
              />
              {formErrors.scheduledDate && (
                <p className="text-sm text-red-500">
                  {formErrors.scheduledDate}
                </p>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                    contractId: "",
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

              {/* Contract Selection - Show if client has multiple contracts */}
              {formData.clientId && formData.clientId !== "none" && clientContracts.length > 1 && (
                <div className="mt-4">
                  <Label htmlFor="contractId">
                    Select Contract <span className="text-red-500">*</span>
                  </Label>
                  <Select
                    value={formData.contractId || "none"}
                    onValueChange={(value) => {
                      const newContractId = value === "none" ? "" : value;
                      setFormData({ ...formData, contractId: newContractId });
                      if (formErrors.contractId) {
                        setFormErrors({ ...formErrors, contractId: null });
                      }
                    }}
                    disabled={isLoadingContracts}
                  >
                    <SelectTrigger id="contractId" className={formErrors.contractId ? "border-red-500" : ""}>
                      <SelectValue placeholder={isLoadingContracts ? "Loading contracts..." : "Select contract"} />
                    </SelectTrigger>
                    <SelectContent className="max-w-[400px]">
                      <SelectItem value="none">None</SelectItem>
                      {clientContracts.map((contract) => {
                        const startDate = contract.contractStartDate || contract.startDate;
                        const endDate = contract.contractEndDate || contract.endDate;
                        return (
                          <SelectItem key={contract.id} value={contract.id}>
                            <div className="flex flex-col gap-0.5">
                              <span className="font-medium">{contract.contractNumber}</span>
                              {startDate && endDate && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(startDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })} - {new Date(endDate).toLocaleDateString("en-PH", { month: "short", day: "numeric", year: "numeric" })}
                                </span>
                              )}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {formErrors.contractId && (
                    <p className="text-sm text-red-500">{formErrors.contractId}</p>
                  )}
                </div>
              )}
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
