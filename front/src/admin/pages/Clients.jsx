import { useState, useEffect, useRef } from "react";
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
import { createClientColumns } from "../components/clients/columns";
import { ClientDetailDialog } from "../components/clients/ClientDetailDialog";
import { EditClientDialog } from "../components/clients/EditClientDialog";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Server-side facet counts
  const [facets, setFacets] = useState({ status: {} });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    companyName: true,
    contactPerson: true,
    email: true,
    phone: true,
    industry: true,
    status: true,
    contractStatus: true,
    contractDates: true,
    createdAt: true,
  });

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch clients, reset to page 1 on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchClients(1);
  }, [statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data || response);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchClients = async (page = pagination.page, limit = pagination.limit) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit,
        ...(statusFilter.length > 0 && { status: statusFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getClients(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setClients(data);
      setPagination(meta);
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch clients");
      console.error("Fetch clients error:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleView = (client) => {
    setSelectedClient(client);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (client) => {
    setSelectedClient(client);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (client) => {
    setSelectedClient(client);
    setIsDeleteModalOpen(true);
  };

  const confirmEdit = async (formData) => {
    try {
      await api.updateClient(selectedClient.id, formData);
      toast.success("Client updated successfully");
      fetchClients();
    } catch (error) {
      toast.error(error.message || "Failed to update client");
      throw error;
    }
  };

  const confirmDelete = async () => {
    try {
      await api.deleteClient(selectedClient.id);
      toast.success("Client deleted successfully");
      fetchClients();
    } catch (error) {
      toast.error(error.message || "Failed to delete client");
      throw error;
    }
  };

  const handleToggleColumn = (columnKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const allColumns = createClientColumns({
    userRole: user?.role,
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Clients</h1>
        <p className="text-muted-foreground">Manage your contracted clients</p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search by company, contact, email, or location..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          <FacetedFilter
            title="Status"
            options={[
              { value: "active", label: "Active" },
              { value: "inactive", label: "Inactive" },
              { value: "suspended", label: "Suspended" },
            ]}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            getCount={(status) => facets.status[status] || 0}
          />

          {(statusFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter([]);
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
              {allColumns
                .filter((column) => column.accessorKey)
                .map((column) => {
                  const columnLabels = {
                    companyName: "Company",
                    contactPerson: "Contact",
                    email: "Email",
                    phone: "Phone",
                    industry: "Industry",
                    status: "Status",
                    contractStatus: "Contract",
                    contractDates: "Contract Period",
                    createdAt: "Created",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.accessorKey}
                      checked={columnVisibility[column.accessorKey]}
                      onCheckedChange={() => handleToggleColumn(column.accessorKey)}
                    >
                      {columnLabels[column.accessorKey]}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={clients}
        isLoading={isLoading}
        emptyMessage="No clients found"
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
              fetchClients(1, newLimit);
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
            onClick={() => fetchClients(1)}
            disabled={pagination.page === 1 || isLoading}
          >
            <span className="sr-only">First page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchClients(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1 || isLoading}
          >
            <span className="sr-only">Previous page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchClients(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <span className="sr-only">Next page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchClients(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || isLoading}
          >
            <span className="sr-only">Last page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <ClientDetailDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        client={selectedClient}
        users={users}
      />

      <EditClientDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        client={selectedClient}
        onConfirm={confirmEdit}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        itemName={selectedClient?.companyName}
        itemType="client"
      />
    </div>
  );
}
