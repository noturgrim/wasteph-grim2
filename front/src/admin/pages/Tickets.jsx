import { useState, useEffect, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { createTicketColumns } from "../components/tickets/ticketColumns";
import { ViewTicketDialog } from "../components/tickets/ViewTicketDialog";

export default function Tickets() {
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState([]);
  const [categoryFilter, setCategoryFilter] = useState([]);
  const [priorityFilter, setPriorityFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedTicketId, setSelectedTicketId] = useState(null);

  useEffect(() => {
    fetchTickets();
    fetchClients();
  }, []);

  const fetchTickets = async () => {
    setIsLoading(true);
    try {
      const response = await api.getTickets();
      setTickets(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch tickets");
      console.error("Fetch tickets error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchClients = async () => {
    try {
      const response = await api.getClients();
      setClients(response.data || []);
    } catch (error) {
      console.error("Failed to fetch clients:", error);
    }
  };

  // Client-side filtering
  const filteredTickets = useMemo(() => {
    let result = tickets;

    if (statusFilter.length > 0) {
      result = result.filter((t) => statusFilter.includes(t.status));
    }

    if (categoryFilter.length > 0) {
      result = result.filter((t) => categoryFilter.includes(t.category));
    }

    if (priorityFilter.length > 0) {
      result = result.filter((t) => priorityFilter.includes(t.priority));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.ticketNumber?.toLowerCase().includes(term) ||
          t.subject?.toLowerCase().includes(term) ||
          t.description?.toLowerCase().includes(term) ||
          t.creatorFirstName?.toLowerCase().includes(term) ||
          t.creatorLastName?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [tickets, statusFilter, categoryFilter, priorityFilter, searchTerm]);

  const handleView = (ticket) => {
    setSelectedTicketId(ticket.id);
    setIsViewDialogOpen(true);
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
    clients: clients,
  });

  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions
    return columnVisibility[column.accessorKey];
  });

  // Get filter counts
  const getStatusCount = (status) =>
    tickets.filter((t) => t.status === status).length;
  const getCategoryCount = (category) =>
    tickets.filter((t) => t.category === category).length;
  const getPriorityCount = (priority) =>
    tickets.filter((t) => t.priority === priority).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
        <p className="text-muted-foreground">
          Manage client tickets and support requests
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search by ticket #, subject, or creator..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

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
            getCount={getStatusCount}
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
            getCount={getCategoryCount}
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
            getCount={getPriorityCount}
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

        <div className="flex gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                Columns
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {Object.entries(columnVisibility).map(([key, value]) => (
                <DropdownMenuCheckboxItem
                  key={key}
                  checked={value}
                  onCheckedChange={() => handleToggleColumn(key)}
                  className="capitalize"
                >
                  {key.replace(/([A-Z])/g, " $1").trim()}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Open</p>
          <p className="text-2xl font-bold">{getStatusCount("open")}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">In Progress</p>
          <p className="text-2xl font-bold">{getStatusCount("in_progress")}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Resolved</p>
          <p className="text-2xl font-bold">{getStatusCount("resolved")}</p>
        </div>
        <div className="rounded-lg border p-4">
          <p className="text-sm text-muted-foreground">Total</p>
          <p className="text-2xl font-bold">{tickets.length}</p>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredTickets}
        isLoading={isLoading}
        emptyMessage="No tickets found"
      />

      {/* Dialogs */}
      <ViewTicketDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        ticketId={selectedTicketId}
        onRefresh={fetchTickets}
      />
    </div>
  );
}
