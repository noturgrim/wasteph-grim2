import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Ticket as TicketIcon,
  FileText,
  Plus,
  Calendar as CalendarIcon,
} from "lucide-react";
import { format } from "date-fns";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { useAuth } from "../../contexts/AuthContext";

// Ticket components
import { TicketsList } from "../tickets/TicketsList";

// Notes components
import { CreateNoteDialog } from "../clientNotes/CreateNoteDialog";
import { NotesTimeline } from "../clientNotes/NotesTimeline";

// Calendar components
import { ScheduleEventDialog } from "../calendar/ScheduleEventDialog";

const getStatusBadge = (status) => {
  const statusConfig = {
    active: { label: "Active", className: "bg-green-600 text-white" },
    inactive: { label: "Inactive", className: "bg-gray-200 text-gray-700" },
    suspended: { label: "Suspended", className: "bg-red-100 text-red-700" },
  };
  const config = statusConfig[status] || { label: status, className: "" };
  return <Badge className={config.className}>{config.label}</Badge>;
};

export const ClientDetailDialog = ({ open, onOpenChange, client, users }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("overview");
  const [tickets, setTickets] = useState([]);
  const [notes, setNotes] = useState([]);
  const [events, setEvents] = useState([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  const [isLoadingNotes, setIsLoadingNotes] = useState(false);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [isCreateNoteOpen, setIsCreateNoteOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);

  useEffect(() => {
    if (open && client) {
      if (activeTab === "tickets") {
        fetchTickets();
      } else if (activeTab === "notes") {
        fetchNotes();
      } else if (activeTab === "calendar") {
        fetchEvents();
      }
    }
  }, [open, client, activeTab]);

  const fetchTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await api.getTickets({ clientId: client.id });
      setTickets(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch tickets");
      console.error("Fetch tickets error:", error);
    } finally {
      setIsLoadingTickets(false);
    }
  };

  const fetchNotes = async () => {
    setIsLoadingNotes(true);
    try {
      const response = await api.getClientNotes({ clientId: client.id });
      setNotes(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch notes");
      console.error("Fetch notes error:", error);
    } finally {
      setIsLoadingNotes(false);
    }
  };

  const fetchEvents = async () => {
    setIsLoadingEvents(true);
    try {
      const response = await api.getCalendarEvents({ clientId: client.id });
      setEvents(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch events");
      console.error("Fetch events error:", error);
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const handleCreateNote = async (noteData) => {
    try {
      await api.createClientNote(noteData);
      toast.success("Note saved successfully");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to save note");
      throw error;
    }
  };

  const handleEditNote = async (noteId, updateData) => {
    try {
      await api.updateClientNote(noteId, updateData);
      toast.success("Note updated successfully");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to update note");
      throw error;
    }
  };

  const handleDeleteNote = async (noteId) => {
    try {
      await api.deleteClientNote(noteId);
      toast.success("Note deleted successfully");
      fetchNotes();
    } catch (error) {
      toast.error("Failed to delete note");
      console.error("Delete note error:", error);
    }
  };

  const handleCreateEvent = async (eventData) => {
    try {
      await api.createCalendarEvent({ ...eventData, clientId: client.id });
      toast.success("Event created successfully");
      fetchEvents();
    } catch (error) {
      toast.error("Failed to create event");
      throw error;
    }
  };

  if (!client) return null;

  const manager = users?.find((u) => u.id === client.accountManager);
  const managerName = manager
    ? `${manager.firstName} ${manager.lastName}`
    : "-";

  const formatDate = (date) =>
    date ? format(new Date(date), "MMM dd, yyyy") : "-";

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-5xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-600" />
              {client.companyName}
            </DialogTitle>
            <DialogDescription>
              Manage client information, tickets, notes, and calendar events
            </DialogDescription>
          </DialogHeader>

          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">
                <Users className="h-4 w-4 mr-2" />
                Overview
              </TabsTrigger>
              <TabsTrigger value="tickets">
                <TicketIcon className="h-4 w-4 mr-2" />
                Tickets
              </TabsTrigger>
              <TabsTrigger value="notes">
                <FileText className="h-4 w-4 mr-2" />
                Notes
              </TabsTrigger>
              <TabsTrigger value="calendar">
                <CalendarIcon className="h-4 w-4 mr-2" />
                Calendar
              </TabsTrigger>
            </TabsList>

            <div className="mt-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              <TabsContent value="overview" className="space-y-5 pr-4">
                {/* Header card */}
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Company</p>
                      <p className="text-lg font-semibold">
                        {client.companyName}
                      </p>
                    </div>
                    {getStatusBadge(client.status)}
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Contact Person
                      </p>
                      <p className="font-medium">
                        {client.contactPerson || "-"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Account Manager
                      </p>
                      <p className="font-medium">{managerName}</p>
                    </div>
                  </div>
                </div>

                {/* Contact info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Contact Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Email</p>
                      <span className="text-sm">{client.email}</span>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Phone</p>
                      <p className="text-sm">{client.phone || "-"}</p>
                    </div>
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground">Address</p>
                      <p className="text-sm">{client.address || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">City</p>
                      <p className="text-sm">{client.city || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Province</p>
                      <p className="text-sm">{client.province || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Business info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Business Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Industry</p>
                      <p className="text-sm">{client.industry || "-"}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Waste Types
                      </p>
                      <p className="text-sm">{client.wasteTypes || "-"}</p>
                    </div>
                  </div>
                </div>

                {/* Contract info */}
                <div>
                  <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                    Contract Information
                  </h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Start Date
                      </p>
                      <p className="text-sm">
                        {formatDate(client.contractStartDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">End Date</p>
                      <p className="text-sm">
                        {formatDate(client.contractEndDate)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {client.notes && (
                  <div>
                    <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                      Additional Notes
                    </h4>
                    <p className="text-sm whitespace-pre-wrap">
                      {client.notes}
                    </p>
                  </div>
                )}
              </TabsContent>

              <TabsContent value="tickets" className="space-y-4">
                <h3 className="text-lg font-semibold">Support Tickets</h3>

                {isLoadingTickets ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading tickets...
                  </div>
                ) : (
                  <TicketsList tickets={tickets} onRefresh={fetchTickets} />
                )}
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Activity Notes</h3>
                  <Button size="sm" onClick={() => setIsCreateNoteOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Note
                  </Button>
                </div>

                {isLoadingNotes ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading notes...
                  </div>
                ) : (
                  <NotesTimeline
                    notes={notes}
                    onEdit={handleEditNote}
                    onDelete={handleDeleteNote}
                    currentUserId={user?.id}
                    userRole={user?.role}
                    isMasterSales={user?.isMasterSales}
                  />
                )}
              </TabsContent>

              <TabsContent value="calendar" className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Scheduled Events</h3>
                  <Button size="sm" onClick={() => setIsCreateEventOpen(true)}>
                    <Plus className="h-4 w-4 mr-1" />
                    Schedule Event
                  </Button>
                </div>

                {isLoadingEvents ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Loading events...
                  </div>
                ) : events.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No events scheduled</p>
                    <p className="text-sm mt-2">
                      Create an event to schedule site visits, meetings, or
                      follow-ups
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className="p-4 border rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div className="flex items-start justify-between">
                          <div className="space-y-1 flex-1">
                            <div className="flex items-center gap-2">
                              <h4 className="font-semibold">{event.title}</h4>
                              <Badge
                                variant={
                                  event.status === "completed"
                                    ? "default"
                                    : event.status === "cancelled"
                                    ? "destructive"
                                    : "outline"
                                }
                              >
                                {event.status}
                              </Badge>
                            </div>
                            {event.description && (
                              <p className="text-sm text-muted-foreground">
                                {event.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>
                                {format(
                                  new Date(event.scheduledDate),
                                  "MMM dd, yyyy"
                                )}
                              </span>
                              {event.startTime && (
                                <span>
                                  {event.startTime}
                                  {event.endTime && ` - ${event.endTime}`}
                                </span>
                              )}
                              {event.eventType && (
                                <span className="capitalize">
                                  {event.eventType.replace(/_/g, " ")}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      <CreateNoteDialog
        open={isCreateNoteOpen}
        onOpenChange={setIsCreateNoteOpen}
        clientId={client?.id}
        onSuccess={handleCreateNote}
      />

      <ScheduleEventDialog
        open={isCreateEventOpen}
        onOpenChange={setIsCreateEventOpen}
        onEventScheduled={handleCreateEvent}
        prefilledData={{ clientId: client?.id }}
      />
    </>
  );
};
