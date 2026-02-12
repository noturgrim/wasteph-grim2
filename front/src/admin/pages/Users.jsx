import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { SlidersHorizontal, X, UserPlus } from "lucide-react";

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
import { createUserColumns } from "../components/users/columns";
import { ViewUserDialog } from "../components/users/ViewUserDialog";
import { EditUserDialog } from "../components/users/EditUserDialog";
import { AddUserDialog } from "../components/users/AddUserDialog";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";

export default function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [roleFilter, setRoleFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Server-side facet counts
  const [facets, setFacets] = useState({ role: {} });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
  });

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  // Fetch users, reset to page 1 on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchUsers(1);
  }, [roleFilter, searchTerm]);

  const fetchUsers = async (page = pagination.page, limit = pagination.limit) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit,
        ...(roleFilter.length > 0 && { role: roleFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getAllUsers(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      setUsers(response.data || []);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch users");
      console.error("Fetch users error:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleView = (user) => {
    setSelectedUser(user);
    setIsViewDialogOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (user) => {
    setSelectedUser(user);
    setIsDeleteModalOpen(true);
  };

  const confirmAdd = async (formData) => {
    try {
      await api.createUser(formData);
      toast.success("User created successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to create user");
      throw error;
    }
  };

  const confirmEdit = async (formData) => {
    try {
      await api.updateUser(selectedUser.id, formData);
      toast.success("User updated successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to update user");
      throw error;
    }
  };

  const confirmDelete = async () => {
    try {
      await api.deleteUser(selectedUser.id);
      toast.success("User deleted successfully");
      fetchUsers();
    } catch (error) {
      toast.error(error.message || "Failed to delete user");
      throw error;
    }
  };

  const handleToggleColumn = (columnKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  const allColumns = createUserColumns({
    onView: handleView,
    onEdit: handleEdit,
    onDelete: handleDelete,
  });

  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)} className="w-full sm:w-auto shrink-0">
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchInput
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full sm:flex-1 sm:min-w-[200px]"
          />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
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
                    name: "Name",
                    email: "Email",
                    role: "Role",
                    isActive: "Status",
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

        <div className="flex flex-wrap items-center gap-2">
          <FacetedFilter
            title="Role"
            options={[
              { value: "super_admin", label: "Super Admin" },
              { value: "admin", label: "Admin" },
              { value: "sales", label: "Sales" },
              { value: "social_media", label: "Social Media" },
            ]}
            selectedValues={roleFilter}
            onSelectionChange={setRoleFilter}
            getCount={(role) => facets.role[role] || 0}
          />

          {(roleFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRoleFilter([]);
                setSearchTerm("");
              }}
              className="h-10 px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={users}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

      {/* Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-end gap-3 sm:gap-8 pt-4 border-t">
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-xs sm:text-sm whitespace-nowrap">
            <span className="hidden sm:inline">Rows per page</span>
            <span className="sm:hidden">Per page</span>
          </span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
              fetchUsers(1, newLimit);
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

        <span className="text-xs sm:text-sm">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8 hidden sm:flex"
            onClick={() => fetchUsers(1)}
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
            onClick={() => fetchUsers(Math.max(pagination.page - 1, 1))}
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
            onClick={() => fetchUsers(Math.min(pagination.page + 1, pagination.totalPages))}
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
            className="h-8 w-8 hidden sm:flex"
            onClick={() => fetchUsers(pagination.totalPages)}
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
      <ViewUserDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        user={selectedUser}
      />

      <EditUserDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        user={selectedUser}
        currentUserId={currentUser?.id}
        onConfirm={confirmEdit}
      />

      <AddUserDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        onConfirm={confirmAdd}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        itemName={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ""}
        itemType="user"
      />
    </div>
  );
}
