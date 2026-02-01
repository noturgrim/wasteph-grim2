import { useState, useEffect, useMemo } from "react";
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
import { createClientColumns } from "../components/clients/columns";
import { ViewClientDialog } from "../components/clients/ViewClientDialog";
import { EditClientDialog } from "../components/clients/EditClientDialog";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";

export default function Clients() {
  const [clients, setClients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [users, setUsers] = useState([]);

  // Filters
  const [statusFilter, setStatusFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

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

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);

  useEffect(() => {
    fetchClients();
    fetchUsers();
  }, []);

  const fetchClients = async () => {
    setIsLoading(true);
    try {
      const response = await api.getClients();
      setClients(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch clients");
      console.error("Fetch clients error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      setUsers(response.data || response);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  // Client-side filtering
  const filteredClients = useMemo(() => {
    let result = clients;

    if (statusFilter.length > 0) {
      result = result.filter((c) => statusFilter.includes(c.status));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (c) =>
          c.companyName?.toLowerCase().includes(term) ||
          c.contactPerson?.toLowerCase().includes(term) ||
          c.email?.toLowerCase().includes(term) ||
          c.city?.toLowerCase().includes(term) ||
          c.province?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [clients, statusFilter, searchTerm]);

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
            getCount={(status) => clients.filter((c) => c.status === status).length}
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={filteredClients}
        isLoading={isLoading}
        emptyMessage="No clients found"
      />

      {/* Dialogs */}
      <ViewClientDialog
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
