import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
} from "date-fns";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScheduleEventDialog } from "../components/calendar/ScheduleEventDialog";
import { ViewEventDialog } from "../components/calendar/ViewEventDialog";

export default function Calendar() {
  const { user } = useAuth();
  const location = useLocation();
  const isMasterSales = user?.isMasterSales || false;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulePrefilledDate, setSchedulePrefilledDate] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Handle opening event from timeline navigation
  useEffect(() => {
    if (location.state?.openEventId && events.length > 0) {
      const eventToOpen = events.find(e => e.id === location.state.openEventId);
      if (eventToOpen) {
        handleEventClick(eventToOpen);
        // Clear the state so it doesn't reopen on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, events]);

  const fetchEvents = async () => {
    try {
      setIsLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      const response = await api.getCalendarEvents({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        viewAll: isMasterSales, // Master Sales sees all events
      });

      setEvents(response.data || []);
    } catch (error) {
      toast.error(error.message || "Failed to fetch events");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleEventClick = (event) => {
    setSelectedEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleEventCreated = () => {
    fetchEvents();
  };

  const handleEventUpdated = () => {
    fetchEvents();
    setIsViewDialogOpen(false);
  };

  const handleEventDeleted = () => {
    fetchEvents();
    setIsViewDialogOpen(false);
  };

  const handleDateClick = (date) => {
    setSchedulePrefilledDate(date);
    setIsScheduleDialogOpen(true);
  };

  const handleScheduleDialogClose = (open) => {
    setIsScheduleDialogOpen(open);
    if (!open) setSchedulePrefilledDate(null);
  };

  // Generate calendar days
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);

  const calendarDays = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    calendarDays.push(day);
    day = addDays(day, 1);
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = format(parseISO(event.scheduledDate), "yyyy-MM-dd");
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(event);
    return acc;
  }, {});

  const getStatusColor = (status) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300";
      case "cancelled":
        return "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300";
      default:
        return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300";
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-3 w-3" />;
      case "cancelled":
        return <XCircle className="h-3 w-3" />;
      default:
        return <Clock className="h-3 w-3" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground">
            Manage your schedule and events
          </p>
        </div>
        <Button onClick={() => setIsScheduleDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Schedule Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="flex items-center justify-between bg-card border rounded-lg p-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handlePreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={handleToday}>
            Today
          </Button>
        </div>
        <h2 className="text-xl font-semibold">
          {format(currentDate, "MMMM yyyy")}
        </h2>
        <div className="w-[200px]" />
      </div>

      {/* Calendar Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="bg-card border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-muted">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div
                key={day}
                className="p-3 text-center text-sm font-semibold text-foreground border-b border-r last:border-r-0"
              >
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, idx) => {
              const dateKey = format(day, "yyyy-MM-dd");
              const dayEvents = eventsByDate[dateKey] || [];
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isDayToday = isToday(day);

              return (
                <div
                  key={idx}
                  role="button"
                  tabIndex={0}
                  onClick={() => handleDateClick(day)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      handleDateClick(day);
                    }
                  }}
                  className={`min-h-[120px] p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  }`}
                  aria-label={`Create event on ${format(day, "MMMM d, yyyy")}`}
                >
                  <div
                    className={`text-sm font-medium mb-2 w-7 h-7 rounded-full flex items-center justify-center ${
                      isDayToday
                        ? "bg-primary text-primary-foreground"
                        : isCurrentMonth
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {format(day, "d")}
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-1">
                    {dayEvents.slice(0, 3).map((event) => {
                      const isOwnEvent = event.userId === user?.id;
                      return (
                        <button
                          key={event.id}
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleEventClick(event);
                          }}
                          className={`w-full text-left p-1.5 rounded text-xs ${getStatusColor(
                            event.status,
                          )} hover:opacity-80 transition-opacity`}
                        >
                          <div className="flex items-center gap-1">
                            {getStatusIcon(event.status)}
                            <span className="truncate font-medium">
                              {event.title}
                            </span>
                          </div>
                          {event.startTime && (
                            <div className="text-xs opacity-75 mt-0.5">
                              {event.startTime}
                            </div>
                          )}
                          {isMasterSales && !isOwnEvent && event.user?.name && (
                            <div className="text-xs opacity-60 mt-0.5 truncate">
                              {event.user.name}
                            </div>
                          )}
                        </button>
                      );
                    })}
                    {dayEvents.length > 3 && (
                      <div className="text-xs text-muted-foreground pl-1.5">
                        +{dayEvents.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700" />
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700" />
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>

      {/* Dialogs */}
      <ScheduleEventDialog
        open={isScheduleDialogOpen}
        onOpenChange={handleScheduleDialogClose}
        onSuccess={handleEventCreated}
        prefilledData={
          schedulePrefilledDate
            ? { scheduledDate: schedulePrefilledDate }
            : {}
        }
      />

      <ViewEventDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        event={selectedEvent}
        onUpdate={handleEventUpdated}
        onDelete={handleEventDeleted}
        isReadOnly={isMasterSales && selectedEvent?.userId !== user?.id}
      />
    </div>
  );
}
