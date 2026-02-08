import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import ticketSocketService from "../services/ticketSocketService";
import { SlidersHorizontal, X, Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { createTicketColumns } from "../components/tickets/ticketColumns";
import { ViewTicketDialog } from "../components/tickets/ViewTicketDialog";
import { CreateTicketDialog } from "../components/tickets/CreateTicketDialog";
import { EditTicketDialog } from "../components/tickets/EditTicketDialog";

export default function Tickets() {
  const { user } = useAuth();
  const location = useLocation();
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Server-side facet counts
  const [facets, setFacets] = useState({
    status: {},
    category: {},
    priority: {},
  });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    ticketNumber: true,
    subject: true,
    client: true,
    category: true,
    priority: true,
    status: true,
    createdBy: true,
    createdAt: true,
  });

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [editTicketId, setEditTicketId] = useState(null);

  const canCreateTicket =
    user?.role === "sales" ||
    user?.role === "admin" ||
    user?.role === "super_admin";

  const handleCreateTicket = async (ticketData, attachmentFiles = []) => {
    try {
      const response = await api.createTicket(ticketData);
      const ticketId = response?.data?.id;

      let uploadedCount = 0;
      const failedFiles = [];

      if (attachmentFiles?.length > 0 && ticketId) {
        for (const file of attachmentFiles) {
          try {
            const uploadResponse = await api.uploadTicketAttachment(
              ticketId,
              file
            );
            if (uploadResponse?.success && uploadResponse?.data?.fileUrl) {
              uploadedCount += 1;
            }
          } catch (uploadError) {
            failedFiles.push(file.name);
            console.error(
              `Attachment upload error for ${file.name}:`,
              uploadError
            );
          }
        }

        if (failedFiles.length > 0) {
          toast.error(
            `Ticket created. ${
              failedFiles.length
            } attachment(s) failed: ${failedFiles.join(", ")}`
          );
        } else if (uploadedCount > 0) {
          toast.success(
            `Ticket created. ${uploadedCount} attachment(s) uploaded to S3.`
          );
        }
      } else {
        toast.success("Ticket created successfully");
      }

      setIsCreateDialogOpen(false);
      fetchTickets(pagination.page, pagination.limit);
    } catch (error) {
      if (!error.validationErrors?.length) {
        toast.error("Failed to create ticket");
      }
      throw error;
    }
  };

  // Fetch clients on mount
  useEffect(() => {
    fetchClients();
  }, []);

  // Setup real-time socket listeners
  useEffect(() => {
    // Register handlers for real-time updates
    const handleTicketCreated = (data) => {
      // Refresh ticket list when new ticket is created
      fetchTickets(pagination.page, pagination.limit);
    };

    const handleTicketUpdated = (data) => {
      // Update ticket in list if it's currently displayed
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === data.ticketId
            ? { ...ticket, ...data.changes, updatedAt: data.timestamp }
            : ticket
        )
      );
    };

    const handleTicketStatusChanged = (data) => {
      // Update ticket status in list
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === data.ticketId
            ? { ...ticket, status: data.newStatus, updatedAt: data.timestamp }
            : ticket
        )
      );

      // Refresh if viewing the updated ticket
      if (selectedTicketId === data.ticketId && isViewDialogOpen) {
        // The ViewTicketDialog will handle its own refresh
      }
    };

    const handleTicketPriorityChanged = (data) => {
      // Update ticket priority in list
      setTickets((prevTickets) =>
        prevTickets.map((ticket) =>
          ticket.id === data.ticketId
            ? {
                ...ticket,
                priority: data.newPriority,
                updatedAt: data.timestamp,
              }
            : ticket
        )
      );
    };

    const handleCommentAdded = (data) => {
      // Refresh if viewing the ticket with new comment
      if (selectedTicketId === data.ticketId && isViewDialogOpen) {
        // The ViewTicketDialog will handle its own refresh
      }
    };

    // Register all handlers
    ticketSocketService.onTicketEvent("created", handleTicketCreated);
    ticketSocketService.onTicketEvent("updated", handleTicketUpdated);
    ticketSocketService.onTicketEvent(
      "statusChanged",
      handleTicketStatusChanged
    );
    ticketSocketService.onTicketEvent(
      "priorityChanged",
      handleTicketPriorityChanged
    );
    ticketSocketService.onTicketEvent("commentAdded", handleCommentAdded);

    // Cleanup on unmount
    return () => {
      ticketSocketService.offTicketEvent("created", handleTicketCreated);
      ticketSocketService.offTicketEvent("updated", handleTicketUpdated);
      ticketSocketService.offTicketEvent(
        "statusChanged",
        handleTicketStatusChanged
      );
      ticketSocketService.offTicketEvent(
        "priorityChanged",
        handleTicketPriorityChanged
      );
      ticketSocketService.offTicketEvent("commentAdded", handleCommentAdded);
    };
  }, [pagination.page, pagination.limit, selectedTicketId, isViewDialogOpen]);

  // Fetch tickets, reset to page 1 on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTickets(1);
  }, [statusFilter, categoryFilter, priorityFilter, searchTerm]);

  // Open ticket dialog if navigated from notification
  useEffect(() => {
    if (location.state?.openTicketId) {
      setSelectedTicketId(location.state.openTicketId);
      setIsViewDialogOpen(true);
      // Clear the state to prevent reopening on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchClients = async () => {
    try {
      const response = await api.getClients({ limit: 500 });
      setClients(response.data || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  const fetchTickets = async (
    page = pagination.page,
    limit = pagination.limit
  ) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit,
        ...(statusFilter.length > 0 && { status: statusFilter.join(",") }),
        ...(categoryFilter.length > 0 && {
          category: categoryFilter.join(","),
        }),
        ...(priorityFilter.length > 0 && {
          priority: priorityFilter.join(","),
        }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getTickets(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setTickets(data);
      setPagination(meta);
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch tickets");
      console.error("Fetch tickets error:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleView = (ticket) => {
    setSelectedTicketId(ticket.id);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (ticket) => {
    setEditTicketId(ticket.id);
    setIsEditDialogOpen(true);
  };

  const handleToggleColumn = (columnKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const allColumns = createTicketColumns({
    userRole: user?.role,
    onView: handleView,
    onEdit: handleEdit,
    clients: clients,
    user,
  });

  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
          <p className="text-muted-foreground">
            Manage client tickets and support requests
          </p>
        </div>
        {canCreateTicket && (
          <Button
            onClick={() => setIsCreateDialogOpen(true)}
            className="shrink-0"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Ticket
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:flex-wrap">
          <SearchInput
            placeholder="Search by ticket #, subject, or creator..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full sm:w-auto"
          />

          <div className="flex items-center gap-2 flex-wrap">
            <FacetedFilter
              title="Status"
              options={[
                { value: "open", label: "Open" },
                { value: "in_progress", label: "In Progress" },
                { value: "resolved", label: "Resolved" },
                { value: "closed", label: "Closed" },
              ]}
              selectedValues={statusFilter}
              onSelectionChange={setStatusFilter}
              getCount={(status) => facets.status[status] || 0}
            />

            <FacetedFilter
              title="Category"
              options={[
                { value: "technical_issue", label: "Technical Issue" },
                { value: "billing_payment", label: "Billing/Payment" },
                { value: "feature_request", label: "Feature Request" },
                { value: "complaint", label: "Complaint" },
                { value: "feedback", label: "Feedback" },
                { value: "contract_legal", label: "Contract/Legal" },
                { value: "other", label: "Other" },
              ]}
              selectedValues={categoryFilter}
              onSelectionChange={setCategoryFilter}
              getCount={(category) => facets.category[category] || 0}
            />

            <FacetedFilter
              title="Priority"
              options={[
                { value: "low", label: "Low" },
                { value: "medium", label: "Medium" },
                { value: "high", label: "High" },
                { value: "urgent", label: "Urgent" },
              ]}
              selectedValues={priorityFilter}
              onSelectionChange={setPriorityFilter}
              getCount={(priority) => facets.priority[priority] || 0}
            />

            {(statusFilter.length > 0 ||
              categoryFilter.length > 0 ||
              priorityFilter.length > 0 ||
              searchTerm) && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setStatusFilter([]);
                  setCategoryFilter([]);
                  setPriorityFilter([]);
                  setSearchTerm("");
                }}
                className="h-8 px-2 lg:px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {allColumns
                .filter((column) => column.accessorKey)
                .map((column) => {
                  const columnLabels = {
                    ticketNumber: "Ticket #",
                    subject: "Subject",
                    client: "Client",
                    category: "Category",
                    priority: "Priority",
                    status: "Status",
                    createdBy: "Created By",
                    createdAt: "Created",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.accessorKey}
                      checked={columnVisibility[column.accessorKey]}
                      onCheckedChange={() =>
                        handleToggleColumn(column.accessorKey)
                      }
                    >
                      {columnLabels[column.accessorKey]}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-bold">
            {facets.status.open || 0}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold">
            {facets.status.in_progress || 0}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold">
            {facets.status.resolved || 0}
          </p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{pagination.total}</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={tickets}
        isLoading={isLoading}
        emptyMessage="No tickets found"
      />

      {/* Pagination */}
      <div className="flex items-center justify-end gap-8 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Rows per page</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
              fetchTickets(1, newLimit);
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent align="start" side="bottom">
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="30">30</SelectItem>
              <SelectItem value="40">40</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <span className="text-sm">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchTickets(1)}
            disabled={pagination.page === 1 || isLoading}
          >
            <span className="sr-only">First page</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchTickets(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1 || isLoading}
          >
            <span className="sr-only">Previous page</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() =>
              fetchTickets(Math.min(pagination.page + 1, pagination.totalPages))
            }
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <span className="sr-only">Next page</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchTickets(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <span className="sr-only">Last page</span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ViewTicketDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        ticketId={selectedTicketId}
        onRefresh={fetchTickets}
        onEdit={handleEdit}
      />

      {canCreateTicket && (
        <CreateTicketDialog
          open={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          clients={clients}
          onSuccess={handleCreateTicket}
        />
      )}

      <EditTicketDialog
        open={isEditDialogOpen}
        onOpenChange={(open) => {
          setIsEditDialogOpen(open);
          if (!open) setEditTicketId(null);
        }}
        ticketId={editTicketId}
        clients={clients}
        onSuccess={() => {
          fetchTickets(pagination.page, pagination.limit);
        }}
      />
    </div>
  );
}
