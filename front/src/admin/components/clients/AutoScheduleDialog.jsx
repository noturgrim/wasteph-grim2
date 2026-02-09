import { useState, useMemo, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  CalendarCheck,
  Loader2,
  Trash2,
  CheckCircle,
  Clock,
  XCircle,
} from "lucide-react";
import { format, addMonths, isBefore, isEqual } from "date-fns";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";

/**
 * Generate monthly dates from start to end, on the same day-of-month as start
 */
const generateMonthlyDates = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const dates = [];
  const dayOfMonth = start.getDate();
  let current = new Date(start);

  while (isBefore(current, end) || isEqual(current, end)) {
    dates.push(new Date(current));
    const next = addMonths(current, 1);
    next.setDate(
      Math.min(
        dayOfMonth,
        new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate(),
      ),
    );
    current = next;
  }
  return dates;
};

const STATUS_CONFIG = {
  scheduled: {
    icon: Clock,
    label: "Scheduled",
    className: "text-blue-600",
  },
  completed: {
    icon: CheckCircle,
    label: "Completed",
    className: "text-green-600",
  },
  cancelled: {
    icon: XCircle,
    label: "Cancelled",
    className: "text-gray-400",
  },
};

export function AutoScheduleDialog({ open, onOpenChange, client, onSchedule }) {
  const [selectedContractId, setSelectedContractId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingEvents, setExistingEvents] = useState([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [deletingEventId, setDeletingEventId] = useState(null);

  // Filter to only signed/hardbound contracts with valid dates
  const eligibleContracts = useMemo(() => {
    if (!client?.contracts) return [];
    return client.contracts.filter(
      (c) =>
        (c.status === "signed" || c.status === "hardbound_received") &&
        c.contractStartDate &&
        c.contractEndDate,
    );
  }, [client]);

  // Auto-select if only one eligible contract
  const resolvedContractId =
    eligibleContracts.length === 1
      ? eligibleContracts[0].id
      : selectedContractId;

  const selectedContract = eligibleContracts.find(
    (c) => c.id === resolvedContractId,
  );

  // Fetch existing client_checkup events when dialog opens
  const fetchExistingEvents = useCallback(async () => {
    if (!client?.id) return;
    setIsLoadingEvents(true);
    try {
      const response = await api.getCalendarEvents({
        clientId: client.id,
        eventType: "client_checkup",
        limit: 100,
      });
      setExistingEvents(response.data || []);
    } catch {
      setExistingEvents([]);
    } finally {
      setIsLoadingEvents(false);
    }
  }, [client?.id]);

  useEffect(() => {
    if (open && client?.id) {
      fetchExistingEvents();
    }
    if (!open) {
      setSelectedContractId("");
      setExistingEvents([]);
    }
  }, [open, client?.id, fetchExistingEvents]);

  // Filter existing events that match the selected contract (by contract number in title)
  const eventsForContract = useMemo(() => {
    if (!selectedContract) return existingEvents;
    return existingEvents.filter((e) =>
      e.title?.includes(selectedContract.contractNumber),
    );
  }, [existingEvents, selectedContract]);

  const isManageMode = eventsForContract.length > 0;
  const activeEvents = eventsForContract.filter(
    (e) => e.status !== "cancelled",
  );

  // Preview the dates that will be created (only in create mode)
  const previewDates = useMemo(() => {
    if (!selectedContract) return [];
    return generateMonthlyDates(
      selectedContract.contractStartDate,
      selectedContract.contractEndDate,
    );
  }, [selectedContract]);

  const handleSubmit = async () => {
    if (!selectedContract || !client) return;
    setIsSubmitting(true);
    try {
      await onSchedule({
        clientId: client.id,
        contractNumber: selectedContract.contractNumber,
        companyName: client.companyName,
        startDate: selectedContract.contractStartDate,
        endDate: selectedContract.contractEndDate,
      });
      await fetchExistingEvents();
    } catch {
      // Error handled by parent
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteEvent = async (eventId) => {
    setDeletingEventId(eventId);
    try {
      await api.deleteCalendarEvent(eventId);
      toast.success("Event removed");
      setExistingEvents((prev) =>
        prev.map((e) =>
          e.id === eventId ? { ...e, status: "cancelled" } : e,
        ),
      );
    } catch {
      toast.error("Failed to remove event");
    } finally {
      setDeletingEventId(null);
    }
  };

  const handleOpenChange = (isOpen) => {
    onOpenChange(isOpen);
  };

  if (!client) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarDays className="h-5 w-5 text-blue-600" />
            {isLoadingEvents
              ? "Loading..."
              : isManageMode
                ? "Manage Schedule"
                : "Auto Schedule Check-ins"}
          </DialogTitle>
          <DialogDescription>
            {isManageMode
              ? `Manage monthly check-in events for ${client.companyName}`
              : `Create monthly check-in events for ${client.companyName}`}
          </DialogDescription>
        </DialogHeader>

        {isLoadingEvents ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-4">
            {eligibleContracts.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                <CalendarDays className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">
                  No signed contracts with valid dates found.
                </p>
                <p className="text-xs mt-1">
                  Contracts must be signed and have start/end dates to schedule
                  events.
                </p>
              </div>
            ) : (
              <>
                {/* Contract selector -- only show if multiple eligible */}
                {eligibleContracts.length > 1 && (
                  <div className="space-y-2">
                    <Label>
                      Contract <span className="text-red-500">*</span>
                    </Label>
                    <Select
                      value={selectedContractId || undefined}
                      onValueChange={setSelectedContractId}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a contract" />
                      </SelectTrigger>
                      <SelectContent>
                        {eligibleContracts.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.contractNumber} ·{" "}
                            {format(
                              new Date(c.contractStartDate),
                              "MMM dd, yyyy",
                            )}{" "}
                            –{" "}
                            {format(
                              new Date(c.contractEndDate),
                              "MMM dd, yyyy",
                            )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                )}

                {/* Single contract info */}
                {eligibleContracts.length === 1 && (
                  <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
                    <p className="text-sm font-medium">
                      {eligibleContracts[0].contractNumber}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {format(
                        new Date(eligibleContracts[0].contractStartDate),
                        "MMM dd, yyyy",
                      )}{" "}
                      –{" "}
                      {format(
                        new Date(eligibleContracts[0].contractEndDate),
                        "MMM dd, yyyy",
                      )}
                    </p>
                  </div>
                )}

                {/* ── MANAGE MODE ── */}
                {isManageMode && (
                  <div className="space-y-2">
                    <Label className="flex items-center justify-between">
                      <span>Existing Events</span>
                      <Badge variant="outline" className="text-xs">
                        {activeEvents.length} active
                      </Badge>
                    </Label>
                    <div className="bg-muted/50 rounded-lg p-3 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {eventsForContract.map((event) => {
                          const cfg =
                            STATUS_CONFIG[event.status] ||
                            STATUS_CONFIG.scheduled;
                          const StatusIcon = cfg.icon;
                          const isCancelled = event.status === "cancelled";
                          return (
                            <div
                              key={event.id}
                              className={`flex items-center justify-between gap-2 text-sm rounded-md px-2 py-1.5 ${
                                isCancelled ? "opacity-50" : ""
                              }`}
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                <StatusIcon
                                  className={`h-3.5 w-3.5 shrink-0 ${cfg.className}`}
                                />
                                <span
                                  className={
                                    isCancelled ? "line-through" : ""
                                  }
                                >
                                  {format(
                                    new Date(event.scheduledDate),
                                    "EEE, MMM dd, yyyy",
                                  )}
                                </span>
                                {event.startTime && (
                                  <span className="text-xs text-muted-foreground">
                                    {event.startTime}
                                    {event.endTime && ` – ${event.endTime}`}
                                  </span>
                                )}
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <Badge
                                  variant="outline"
                                  className={`text-[10px] px-1.5 py-0 ${cfg.className}`}
                                >
                                  {cfg.label}
                                </Badge>
                                {!isCancelled &&
                                  event.status !== "completed" && (
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 w-6 p-0 text-muted-foreground hover:text-red-600"
                                      onClick={() =>
                                        handleDeleteEvent(event.id)
                                      }
                                      disabled={deletingEventId === event.id}
                                      aria-label="Remove event"
                                    >
                                      {deletingEventId === event.id ? (
                                        <Loader2 className="h-3 w-3 animate-spin" />
                                      ) : (
                                        <Trash2 className="h-3 w-3" />
                                      )}
                                    </Button>
                                  )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Completed events are preserved. Cancelled events can be
                      re-created by scheduling again.
                    </p>
                  </div>
                )}

                {/* ── CREATE MODE ── */}
                {!isManageMode &&
                  selectedContract &&
                  previewDates.length > 0 && (
                    <div className="space-y-2">
                      <Label className="flex items-center justify-between">
                        <span>Scheduled Dates</span>
                        <Badge variant="outline" className="text-xs">
                          {previewDates.length} event
                          {previewDates.length !== 1 ? "s" : ""}
                        </Badge>
                      </Label>
                      <div className="bg-muted/50 rounded-lg p-3 max-h-48 overflow-y-auto">
                        <div className="space-y-1.5">
                          {previewDates.map((date, i) => (
                            <div
                              key={i}
                              className="flex items-center gap-2 text-sm"
                            >
                              <CalendarCheck className="h-3.5 w-3.5 text-green-600 shrink-0" />
                              <span>
                                {format(date, "EEEE, MMMM dd, yyyy")}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                09:00 – 10:00
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Events will be created as "Monthly Check-in" and
                        assigned to you. You can edit or delete individual events
                        later.
                      </p>
                    </div>
                  )}
              </>
            )}
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={isSubmitting}
          >
            {isManageMode ? "Close" : "Cancel"}
          </Button>
          {!isManageMode && (
            <Button
              onClick={handleSubmit}
              disabled={
                !selectedContract ||
                previewDates.length === 0 ||
                isSubmitting
              }
            >
              {isSubmitting
                ? "Scheduling..."
                : `Schedule ${previewDates.length} Event${previewDates.length !== 1 ? "s" : ""}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
