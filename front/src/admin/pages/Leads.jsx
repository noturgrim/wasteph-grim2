import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { useDebounce } from "@/hooks/use-debounce";
import { leadSocketService } from "../services/leadSocketService";
import { Plus, SlidersHorizontal, X, Trash2 } from "lucide-react";

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
  const [isLoading, setIsLoading] = useState(true);

  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  const [searchTerm, setSearchTerm] = useState("");
  const debouncedSearch = useDebounce(searchTerm, 400);
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'unclaimed', or 'claimed'

  const [columnVisibility, setColumnVisibility] = useState({
    clientName: true,
    isClaimed: true,
    claimedByUser: true,
    createdAt: true,
  });

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isBulkDeleteDialogOpen, setIsBulkDeleteDialogOpen] = useState(false);
  const [isClaimDialogOpen, setIsClaimDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [selectedLeads, setSelectedLeads] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [claimSource, setClaimSource] = useState("");

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Store latest pagination.page in a ref so socket callbacks always use current value
  const currentPageRef = useRef(pagination.page);
  currentPageRef.current = pagination.page;

  useEffect(() => {
    // Subscribe to real-time lead updates with retry logic
    let retryCount = 0;
    const maxRetries = 5;
    let subscribeTimeout;

    const attemptSubscribe = () => {
      try {
        leadSocketService.subscribeToLeads({
          onLeadCreated: (data) => {
            // Show toast notification
            if (data.isPublic) {
              toast.success("New lead from landing page!", {
                description: `${data.lead.company} has submitted an inquiry`,
              });
            } else {
              toast.success("New lead created", {
                description: `${data.lead.company || data.lead.clientName}`,
              });
            }

            // Refresh only the current page data (single API call)
            fetchLeads(currentPageRef.current);
          },
          onLeadUpdated: (data) => {
            // Refresh only the current page data
            fetchLeads(currentPageRef.current);
          },
          onLeadClaimed: (data) => {
            toast.success("Lead claimed", {
              description: `${data.lead.company || data.lead.clientName} has been claimed`,
            });

            // Refresh only the current page data
            fetchLeads(currentPageRef.current);
          },
          onLeadDeleted: () => {
            // Refresh only the current page data
            fetchLeads(currentPageRef.current);
          },
        });

        // If subscription succeeded, log success
        if (leadSocketService.isSubscribed()) {
          console.log("Lead socket subscription successful");
        } else {
          throw new Error("Subscription failed");
        }
      } catch (error) {
        // Retry with exponential backoff
        if (retryCount < maxRetries) {
          retryCount++;
          const delay = Math.min(1000 * Math.pow(2, retryCount - 1), 5000);
          subscribeTimeout = setTimeout(attemptSubscribe, delay);
        }
      }
    };

    // Start subscription attempt with initial delay
    subscribeTimeout = setTimeout(attemptSubscribe, 500);

    // Cleanup on unmount
    return () => {
      clearTimeout(subscribeTimeout);
      leadSocketService.unsubscribeFromLeads();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchLeads(1);
  }, [debouncedSearch, statusFilter]);

  const fetchLeads = async (
    page = pagination.page,
    limit = pagination.limit,
  ) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const params = {
        search: debouncedSearch || undefined,
        page,
        limit,
      };

      // Only add isClaimed filter if not showing all
      if (statusFilter !== "all") {
        params.isClaimed = statusFilter === "claimed";
      }

      const response = await api.getLeads(params);

      if (currentFetchId !== fetchIdRef.current) return;

      setLeads(response.data || []);
      setPagination(
        response.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 },
      );
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error(error.message || "Failed to fetch leads");
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleCreateLead = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.createLead(formData);
      toast.success("Lead added to pool successfully");
      setIsCreateDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to create lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditLead = useCallback((lead) => {
    setSelectedLead(lead);
    setIsEditDialogOpen(true);
  }, []);

  const handleUpdateLead = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.updateLead(selectedLead.id, formData);
      toast.success("Lead updated successfully");
      setIsEditDialogOpen(false);
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to update lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaimLead = useCallback((lead) => {
    setSelectedLead(lead);
    setClaimSource("");
    setIsClaimDialogOpen(true);
  }, []);

  const confirmClaim = async () => {
    setIsSubmitting(true);
    try {
      // Pass source only if user selected one
      await api.claimLead(selectedLead.id, claimSource || undefined);
      toast.success(
        "Lead claimed successfully! Check Inquiries page to manage it.",
      );
      setIsClaimDialogOpen(false);
      setClaimSource("");
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to claim lead");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLead = useCallback((lead) => {
    setSelectedLead(lead);
    setIsDeleteDialogOpen(true);
  }, []);

  const confirmDelete = async () => {
    try {
      await api.deleteLead(selectedLead.id);
      toast.success("Lead deleted successfully");
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to delete lead");
      throw error;
    }
  };

  const handleBulkDelete = () => {
    // Filter to only unclaimed leads
    const unclaimedSelected = selectedLeads.filter((id) => {
      const lead = leads.find((l) => l.id === id);
      return lead && !lead.isClaimed;
    });

    if (unclaimedSelected.length === 0) {
      toast.error("No unclaimed leads selected");
      return;
    }

    setIsBulkDeleteDialogOpen(true);
  };

  const confirmBulkDelete = async () => {
    try {
      // Filter to only unclaimed leads
      const unclaimedSelected = selectedLeads.filter((id) => {
        const lead = leads.find((l) => l.id === id);
        return lead && !lead.isClaimed;
      });

      const result = await api.bulkDeleteLeads(unclaimedSelected);

      if (result.deleted > 0) {
        toast.success(`Successfully deleted ${result.deleted} lead(s)`);
      }

      if (result.failed > 0) {
        toast.error(`Failed to delete ${result.failed} lead(s)`);
      }

      setSelectedLeads([]);
      fetchLeads();
    } catch (error) {
      toast.error(error.message || "Failed to delete leads");
      throw error;
    }
  };

  const handleSelectLead = useCallback((leadId, isSelected) => {
    setSelectedLeads((prev) =>
      isSelected ? [...prev, leadId] : prev.filter((id) => id !== leadId),
    );
  }, []);

  const handleSelectAll = useCallback(
    (isSelected) => {
      if (!isSelected) {
        setSelectedLeads([]);
        return;
      }
      // Only select unclaimed leads
      const unclaimedLeadIds = leads
        .filter((lead) => !lead.isClaimed)
        .map((lead) => lead.id);
      setSelectedLeads(unclaimedLeadIds);
    },
    [leads],
  );

  const handleViewLead = useCallback((lead) => {
    setSelectedLead(lead);
    setIsViewDialogOpen(true);
  }, []);

  const allColumns = useMemo(
    () =>
      createColumns({
        onView: handleViewLead,
        onEdit: handleEditLead,
        onClaim: handleClaimLead,
        onDelete: handleDeleteLead,
        isMasterSales,
        selectedLeads,
        onSelectLead: handleSelectLead,
        onSelectAll: handleSelectAll,
      }),
    [
      handleViewLead,
      handleEditLead,
      handleClaimLead,
      handleDeleteLead,
      isMasterSales,
      selectedLeads,
      handleSelectLead,
      handleSelectAll,
    ],
  );

  const columns = useMemo(
    () =>
      allColumns.filter((column) => {
        if (!column.accessorKey) return true;
        return columnVisibility[column.accessorKey];
      }),
    [allColumns, columnVisibility],
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Lead Pool</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            {isMasterSales
              ? "Manage potential clients for your sales team"
              : "Claim leads to start the inquiry process"}
          </p>
        </div>
        {isMasterSales && (
          <Button onClick={() => setIsCreateDialogOpen(true)} className="w-full sm:w-auto">
            <Plus className="mr-2 h-4 w-4" />
            Add Lead
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 flex-1">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search by client name, company, or email..."
            className="w-full sm:flex-1 sm:min-w-[280px]"
          />

          <div className="flex items-center gap-2">
            {searchTerm && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSearchTerm("")}
                className="h-9 flex-1 sm:flex-none px-3"
              >
                Reset
                <X className="ml-2 h-4 w-4" />
              </Button>
            )}

            {isMasterSales && selectedLeads.length > 0 && (
              <Button
                variant="destructive"
                size="sm"
                onClick={handleBulkDelete}
                className="h-9 flex-1 sm:flex-none px-3"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete ({selectedLeads.length})
              </Button>
            )}
          </div>
        </div>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="w-full sm:w-auto">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel className="font-bold">
              Toggle columns
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {allColumns
              .filter((column) => column.accessorKey)
              .map((column) => {
                const labels = {
                  clientName: "Client Name",
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

      <Tabs
        value={statusFilter}
        onValueChange={setStatusFilter}
        className="w-full"
      >
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

      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 pt-4 border-t">
        <div className="flex items-center justify-between sm:justify-start gap-2">
          <span className="text-sm text-muted-foreground hidden sm:inline whitespace-nowrap">
            Rows per page
          </span>
          <span className="text-sm text-muted-foreground sm:hidden whitespace-nowrap">
            Per page
          </span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
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

        <div className="flex items-center justify-between sm:justify-end gap-4 sm:gap-8">
          <span className="text-sm text-muted-foreground whitespace-nowrap">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 hidden sm:flex"
              onClick={() => fetchLeads(1)}
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
              onClick={() => fetchLeads(Math.max(pagination.page - 1, 1))}
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
                fetchLeads(Math.min(pagination.page + 1, pagination.totalPages))
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
              className="h-8 w-8 hidden sm:flex"
              onClick={() => fetchLeads(pagination.totalPages)}
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
            <AlertDialogDescription asChild>
              <div>
                <p>
                  By claiming this lead, it will be converted to an inquiry and
                  assigned to you. You'll be able to manage it in the Inquiries
                  page. This action cannot be undone.
                </p>
                <div className="mt-4 p-3 bg-muted rounded-md">
                  <p className="font-semibold">{selectedLead?.clientName}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedLead?.company}
                  </p>
                </div>
                <div className="mt-4">
                  <label className="text-sm font-medium text-foreground">
                    Source (optional)
                  </label>
                  <p className="text-xs text-muted-foreground mb-2">
                    How did this lead reach out?
                  </p>
                  <Select
                    value={claimSource}
                    onValueChange={setClaimSource}
                    disabled={isSubmitting}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Select source (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="facebook">Facebook</SelectItem>
                      <SelectItem value="email">Email</SelectItem>
                      <SelectItem value="phone">Phone</SelectItem>
                      <SelectItem value="walk-in">Walk-in</SelectItem>
                      <SelectItem value="cold-approach">
                        Cold Approach
                      </SelectItem>
                      <SelectItem value="referral">Referral</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                confirmClaim();
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Claiming..." : "Claim Lead"}
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
          "This cannot be undone",
        ]}
        warningMessage="This action cannot be undone."
      />

      <DeleteConfirmationModal
        open={isBulkDeleteDialogOpen}
        onOpenChange={setIsBulkDeleteDialogOpen}
        onConfirm={confirmBulkDelete}
        title="Delete Multiple Leads"
        itemName={`${selectedLeads.length} lead(s)`}
        itemType="leads"
        actionsList={[
          `Delete ${selectedLeads.length} selected unclaimed lead(s)`,
          "Claimed leads will be skipped automatically",
          "This action cannot be undone",
        ]}
        warningMessage="Only unclaimed leads will be deleted. Claimed leads will be skipped."
      />
    </div>
  );
}
