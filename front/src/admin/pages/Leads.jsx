import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "sonner";
import { Plus, SlidersHorizontal, X } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import { DataTable } from "../components/DataTable";
import { SearchInput } from "../components/SearchInput";
import { DeleteConfirmationModal } from "../components/modals";
import { AddLeadDialog } from "../components/leads/AddLeadDialog";
import { EditLeadDialog } from "../components/leads/EditLeadDialog";
import { ViewLeadDialog } from "../components/leads/ViewLeadDialog";
import { createColumns } from "../components/leads/columns";

export default function Leads() {
  const { user } = useAuth();
  const isMasterSales = user?.isMasterSales || false;

  const [leads, setLeads] = useState([]);
  const [allLeads, setAllLeads] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'unclaimed', or 'claimed'

  const [columnVisibility, setColumnVisibility] = useState({
    clientName: true,
    company: true,
    email: true,
    phone: true,
    location: true,
    isClaimed: true,
    claimedByUser: true,
    createdAt: true,
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchAllLeads();
  }, []);

  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
    fetchLeads(1);
  }, [searchTerm, statusFilter]);

  const fetchAllLeads = async () => {
    try {
      // For counts, we want to fetch unclaimed leads
      const response = await api.getLeads({ isClaimed: false });
      setAllLeads(response.data || []);
    } catch (error) {
      console.error("Failed to fetch all leads:", error);
    }
  };

  const fetchLeads = async (page = pagination.page, limit = pagination.limit) => {
    try {
      setIsLoading(true);
      const params = {
        search: searchTerm || undefined,
        page,
        limit,
      };

      // Only add isClaimed filter if not showing all
      if (statusFilter !== "all") {
        params.isClaimed = statusFilter === "claimed";
      }

      const response = await api.getLeads(params);

      setLeads(response.data || []);
      setPagination(response.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 });
    } catch (error) {
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateLead = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.createLead(formData);
      toast.success("Lead added to pool successfully");
      setIsCreateDialogOpen(false);
      fetchAllLeads();
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLead = (lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  };

  const handleUpdateLead = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.updateLead(selectedLead.id, formData);
      toast.success("Lead updated successfully");
      setIsEditDialogOpen(false);
      fetchAllLeads();
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimLead = (lead) => {
    setSelectedLead(lead);
    setIsClaimDialogOpen(true);
  };

  const confirmClaim = async () => {
    try {
      await api.claimLead(selectedLead.id);
      toast.success("Lead claimed successfully! Check Inquiries page to manage it.");
      setIsClaimDialogOpen(false);
      fetchAllLeads();
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to claim lead");
    }
  };

  const handleDeleteLead = (lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteLead(selectedLead.id);
      toast.success("Lead deleted successfully");
      fetchAllLeads();
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to delete lead");
      throw error;
    }
  };

  const allColumns = createColumns({
    onView: (lead) => {
      setSelectedLead(lead);
      setIsViewDialogOpen(true);
    },
    onEdit: handleEditLead,
    onClaim: handleClaimLead,
    onDelete: handleDeleteLead,
    isMasterSales,
  });

  const columns = allColumns.filter(column => {
    if (!column.accessorKey) return true;
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Lead Pool</h1>
          <p className="text-muted-foreground">
            {isMasterSales
              ? "Manage potential clients for your sales team"
              : "Claim leads to start the inquiry process"}
          </p>
        </div>
        {isMasterSales && (
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by client name, company, or email..."
          />

          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm("")}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel className="font-bold">Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allColumns
              .filter((column) => column.accessorKey)
              .map((column) => {
                const labels = {
                  clientName: "Client Name",
                  company: "Company",
                  email: "Email",
                  phone: "Phone",
                  location: "Location",
                  isClaimed: "Status",
                  claimedByUser: "Claimed By",
                  createdAt: "Time in Pool",
                };
                return (
                  <DropdownMenuCheckboxItem
                    key={column.accessorKey}
                    className="capitalize"
                    checked={columnVisibility[column.accessorKey]}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [column.accessorKey]: value,
                      }))
                    }
                  >
                    {labels[column.accessorKey] || column.accessorKey}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <Tabs value={statusFilter} onValueChange={setStatusFilter} className="w-full">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="unclaimed">Available</TabsTrigger>
          <TabsTrigger value="claimed">Claimed</TabsTrigger>
        </TabsList>
      </Tabs>

      <DataTable
        columns={columns}
        data={leads}
        isLoading={isLoading}
        emptyMessage={
          statusFilter === "all"
            ? "No leads in pool"
            : statusFilter === "unclaimed"
            ? "No available leads in pool"
            : "No claimed leads"
        }
        showViewOptions={false}
      />

      <div className="flex items-center justify-end gap-8 pt-4">
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Rows per page</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setPagination(prev => ({ ...prev, limit: newLimit, page: 1 }));
              fetchLeads(1, newLimit);
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
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchLeads(1)} disabled={pagination.page === 1 || isLoading}>
            <span className="sr-only">First page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="11 17 6 12 11 7" />
              <polyline points="18 17 13 12 18 7" />
            </svg>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchLeads(pagination.page - 1)} disabled={pagination.page === 1 || isLoading}>
            <span className="sr-only">Previous page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchLeads(pagination.page + 1)} disabled={pagination.page >= pagination.totalPages || isLoading}>
            <span className="sr-only">Next page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </Button>
          <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => fetchLeads(pagination.totalPages)} disabled={pagination.page >= pagination.totalPages || isLoading}>
            <span className="sr-only">Last page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </Button>
        </div>
      </div>

      <AddLeadDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateLead}
        isSubmitting={isSubmitting}
      />

      <EditLeadDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        lead={selectedLead}
        onSubmit={handleUpdateLead}
        isSubmitting={isSubmitting}
      />

      <ViewLeadDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        lead={selectedLead}
      />

      <AlertDialog open={isClaimDialogOpen} onOpenChange={setIsClaimDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Claim this lead?</AlertDialogTitle>
            <AlertDialogDescription>
              By claiming this lead, it will be converted to an inquiry and assigned to you.
              You'll be able to manage it in the Inquiries page. This action cannot be undone.
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="font-semibold">{selectedLead?.clientName}</p>
                <p className="text-sm text-muted-foreground">{selectedLead?.contactPerson}</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmClaim}>
              Claim Lead
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete Lead"
        itemName={selectedLead?.clientName}
        itemType="lead"
        actionsList={[
          "Permanently delete this lead from the pool",
          "Remove all associated data",
          "This cannot be undone"
        ]}
        warningMessage="This action cannot be undone."
      />
    </div>
  );
}
