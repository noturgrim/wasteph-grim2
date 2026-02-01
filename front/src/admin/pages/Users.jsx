import { useState, useEffect, useMemo } from "react";
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

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    email: true,
    role: true,
    isActive: true,
    createdAt: true,
  });

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const response = await api.getAllUsers();
      setUsers(response.data || []);
    } catch (error) {
      toast.error("Failed to fetch users");
      console.error("Fetch users error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Client-side filtering
  const filteredUsers = useMemo(() => {
    let result = users;

    if (roleFilter.length > 0) {
      result = result.filter((u) => roleFilter.includes(u.role));
    }

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          `${u.firstName} ${u.lastName}`.toLowerCase().includes(term) ||
          u.email?.toLowerCase().includes(term)
      );
    }

    return result;
  }, [users, roleFilter, searchTerm]);

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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">User Management</h1>
          <p className="text-muted-foreground">Manage system users and permissions</p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <UserPlus className="mr-2 h-4 w-4" />
          Add User
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

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
            getCount={(role) => users.filter((u) => u.role === role).length}
          />

          {(roleFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setRoleFilter([]);
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
        data={filteredUsers}
        isLoading={isLoading}
        emptyMessage="No users found"
      />

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
