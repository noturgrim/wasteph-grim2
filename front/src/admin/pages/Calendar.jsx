import { useState, useEffect, useRef, useMemo } from "react";
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScheduleEventDialog } from "../components/calendar/ScheduleEventDialog";
import { ViewEventDialog } from "../components/calendar/ViewEventDialog";

/**
 * Reusable event chip rendered inside calendar cells and overflow popover
 */
const EventChip = ({
  event,
  userId,
  canViewAll,
  getStatusColor,
  getStatusIcon,
  onClick,
}) => {
  const isOwnEvent = event.userId === userId;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick(event);
      }}
      className={`w-full text-left p-1 sm:p-1.5 rounded text-[10px] sm:text-xs ${getStatusColor(
        event.status,
      )} hover:opacity-80 transition-opacity`}
    >
      <div className="flex items-center gap-0.5 sm:gap-1">
        <span className="hidden sm:inline">{getStatusIcon(event.status)}</span>
        <span className="truncate font-medium">{event.title}</span>
      </div>
      {event.startTime && (
        <div className="text-[10px] sm:text-xs opacity-75 mt-0.5 hidden sm:block">{event.startTime}</div>
      )}
      {canViewAll && !isOwnEvent && event.user?.name && (
        <div className="text-[10px] sm:text-xs opacity-60 mt-0.5 truncate hidden sm:block">
          {event.user.name}
        </div>
      )}
    </button>
  );
};

export default function Calendar() {
  const { user } = useAuth();
  const location = useLocation();
  const isMasterSales = user?.isMasterSales || false;
  const isAdmin = user?.role === "admin" || user?.role === "super_admin";
  const canViewAll = isMasterSales || isAdmin;
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isScheduleDialogOpen, setIsScheduleDialogOpen] = useState(false);
  const [schedulePrefilledDate, setSchedulePrefilledDate] = useState(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);

  // OPTIMIZATION: Cache events by month to avoid refetching when navigating back
  const eventsCache = useRef(new Map());

  useEffect(() => {
    fetchEvents();
  }, [currentDate]);

  // Handle opening event from timeline navigation
  useEffect(() => {
    if (location.state?.openEventId && events.length > 0) {
      const eventToOpen = events.find(
        (e) => e.id === location.state.openEventId,
      );
      if (eventToOpen) {
        handleEventClick(eventToOpen);
        // Clear the state so it doesn't reopen on subsequent renders
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, events]);

  const fetchEvents = async (skipCache = false) => {
    try {
      setIsLoading(true);
      const monthStart = startOfMonth(currentDate);
      const monthEnd = endOfMonth(currentDate);

      // OPTIMIZATION: Create cache key based on month and viewAll setting
      const cacheKey = `${format(currentDate, "yyyy-MM")}-${canViewAll}`;

      // Check cache first (unless explicitly skipping)
      if (!skipCache && eventsCache.current.has(cacheKey)) {
        const cachedEvents = eventsCache.current.get(cacheKey);
        setEvents(cachedEvents);
        setIsLoading(false);
        return;
      }

      const response = await api.getCalendarEvents({
        startDate: monthStart.toISOString(),
        endDate: monthEnd.toISOString(),
        viewAll: canViewAll, // Master Sales, Admin, Super Admin see all events
      });

      const fetchedEvents = response.data || [];
      setEvents(fetchedEvents);

      // Cache the results
      eventsCache.current.set(cacheKey, fetchedEvents);

      // OPTIMIZATION: Limit cache size to 6 months (prevent memory leak)
      if (eventsCache.current.size > 6) {
        const firstKey = eventsCache.current.keys().next().value;
        eventsCache.current.delete(firstKey);
      }
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
    // OPTIMIZATION: Clear cache and refetch to get fresh data
    eventsCache.current.clear();
    fetchEvents(true); // Skip cache
  };

  const handleEventUpdated = () => {
    // OPTIMIZATION: Clear cache and refetch to get fresh data
    eventsCache.current.clear();
    fetchEvents(true); // Skip cache
    setIsViewDialogOpen(false);
  };

  const handleEventDeleted = () => {
    // OPTIMIZATION: Clear cache and refetch to get fresh data
    eventsCache.current.clear();
    fetchEvents(true); // Skip cache
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

  // OPTIMIZATION: Memoize events grouping to avoid recalculating on every render
  const eventsByDate = useMemo(() => {
    return events.reduce((acc, event) => {
      const dateKey = format(parseISO(event.scheduledDate), "yyyy-MM-dd");
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [events]);

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
    <div className="space-y-4 md:space-y-6 pb-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:justify-between sm:items-center">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-sm md:text-base text-muted-foreground">
            Manage your schedule and events
          </p>
        </div>
        <Button onClick={() => setIsScheduleDialogOpen(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Schedule Event
        </Button>
      </div>

      {/* Calendar Controls */}
      <div className="bg-card border rounded-lg p-3 md:p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:relative">
          <div className="flex items-center justify-between sm:justify-start gap-2">
            <div className="flex items-center gap-1 sm:gap-2">
              <Button variant="outline" size="sm" onClick={handlePreviousMonth} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={handleNextMonth} className="h-8 w-8 p-0 sm:h-9 sm:w-9">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleToday} className="h-8 px-3 sm:h-9">
              Today
            </Button>
          </div>
          <h2 className="text-lg sm:text-xl font-semibold text-center sm:absolute sm:left-1/2 sm:-translate-x-1/2">
            {format(currentDate, "MMMM yyyy")}
          </h2>
          <div className="hidden sm:block sm:w-32" />
        </div>
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
            {[
              { full: "Sun", short: "S" },
              { full: "Mon", short: "M" },
              { full: "Tue", short: "T" },
              { full: "Wed", short: "W" },
              { full: "Thu", short: "T" },
              { full: "Fri", short: "F" },
              { full: "Sat", short: "S" }
            ].map((day) => (
              <div
                key={day.full}
                className="p-2 md:p-3 text-center text-xs md:text-sm font-semibold text-foreground border-b border-r last:border-r-0"
              >
                <span className="hidden sm:inline">{day.full}</span>
                <span className="sm:hidden">{day.short}</span>
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
              const overflowCount = dayEvents.length - 3;

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
                  className={`min-h-[80px] sm:min-h-[100px] md:min-h-[120px] p-1 sm:p-2 border-b border-r last:border-r-0 cursor-pointer hover:bg-accent/50 transition-colors ${
                    !isCurrentMonth ? "bg-muted/30" : ""
                  }`}
                  aria-label={`Create event on ${format(day, "MMMM d, yyyy")}`}
                >
                  <div
                    className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 w-6 h-6 sm:w-7 sm:h-7 rounded-full flex items-center justify-center ${
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
                  <div className="space-y-0.5 sm:space-y-1">
                    {dayEvents.slice(0, 2).map((event) => (
                      <EventChip
                        key={event.id}
                        event={event}
                        userId={user?.id}
                        canViewAll={canViewAll}
                        getStatusColor={getStatusColor}
                        getStatusIcon={getStatusIcon}
                        onClick={handleEventClick}
                      />
                    ))}
                    {dayEvents.length > 2 && (
                      <Popover>
                        <PopoverTrigger asChild>
                          <button
                            type="button"
                            onClick={(e) => e.stopPropagation()}
                            className="w-full text-left text-[10px] sm:text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-accent rounded px-1 sm:px-1.5 py-0.5 transition-colors"
                            aria-label={`Show ${dayEvents.length - 2} more event${dayEvents.length - 2 !== 1 ? "s" : ""}`}
                          >
                            +{dayEvents.length - 2} more
                          </button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-72 p-0"
                          align="start"
                          side="bottom"
                          avoidCollisions
                          collisionPadding={16}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div className="px-3 py-2 border-b">
                            <p className="font-semibold text-sm">
                              {format(day, "EEEE, MMMM d")}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {dayEvents.length} event
                              {dayEvents.length !== 1 ? "s" : ""}
                            </p>
                          </div>
                          <div className="max-h-64 overflow-y-auto p-2 space-y-1">
                            {dayEvents.map((event) => (
                              <EventChip
                                key={event.id}
                                event={event}
                                userId={user?.id}
                                canViewAll={canViewAll}
                                getStatusColor={getStatusColor}
                                getStatusIcon={getStatusIcon}
                                onClick={handleEventClick}
                              />
                            ))}
                          </div>
                          <div className="px-3 py-2 border-t">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDateClick(day);
                              }}
                              className="text-xs font-medium text-primary hover:underline"
                            >
                              <Plus className="inline h-3 w-3 mr-0.5" />
                              Add event
                            </button>
                          </div>
                        </PopoverContent>
                      </Popover>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-3 sm:gap-6 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-blue-100 dark:bg-blue-950 border border-blue-300 dark:border-blue-700" />
          <span className="text-muted-foreground">Scheduled</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-green-100 dark:bg-green-950 border border-green-300 dark:border-green-700" />
          <span className="text-muted-foreground">Completed</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 sm:w-4 sm:h-4 rounded bg-red-100 dark:bg-red-950 border border-red-300 dark:border-red-700" />
          <span className="text-muted-foreground">Cancelled</span>
        </div>
      </div>

      {/* Dialogs */}
      <ScheduleEventDialog
        open={isScheduleDialogOpen}
        onOpenChange={handleScheduleDialogClose}
        onSuccess={handleEventCreated}
        prefilledData={
          schedulePrefilledDate ? { scheduledDate: schedulePrefilledDate } : {}
        }
      />

      <ViewEventDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        event={selectedEvent}
        onUpdate={handleEventUpdated}
        onDelete={handleEventDeleted}
        isReadOnly={canViewAll && selectedEvent?.userId !== user?.id}
      />
    </div>
  );
}
