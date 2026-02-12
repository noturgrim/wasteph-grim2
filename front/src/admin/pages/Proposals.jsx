import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import proposalSocketService from "../services/proposalSocketService";
import { SlidersHorizontal, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { createColumns } from "../components/proposals/columns";
import { ReviewProposalDialog } from "../components/proposals/ReviewProposalDialog";
import { ApproveProposalDialog } from "../components/proposals/ApproveProposalDialog";
import { RejectProposalDialog } from "../components/proposals/RejectProposalDialog";
import { RequestProposalDialog } from "../components/inquiries/RequestProposalDialog";
import { SendProposalDialog } from "../components/inquiries/SendProposalDialog";

export default function Proposals() {
  const { user } = useAuth();
  const isMasterSales = user?.isMasterSales || false;
  const [viewMode, setViewMode] = useState("all");
  const [proposals, setProposals] = useState([]);
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
  const [searchTerm, setSearchTerm] = useState("");

  // Server-side facet counts for status filter badges
  const [facets, setFacets] = useState({ status: {} });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    proposalNumber: true,
    inquiryNumber: true,
    inquiryName: true,
    inquiryCompany: true,
    ...(user?.role !== "sales" && { requestedByName: true }),
    status: true,
    createdAt: true,
  });

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Users for assignment display
  const [users, setUsers] = useState([]);

  // Dialogs
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);
  const [isRequestProposalDialogOpen, setIsRequestProposalDialogOpen] = useState(false);
  const [isSendProposalDialogOpen, setIsSendProposalDialogOpen] = useState(false);
  const [reviseInquiry, setReviseInquiry] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch filtered proposals
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    fetchProposals(1);
  }, [statusFilter, searchTerm, viewMode]);

  // Subscribe to proposal socket events
  useEffect(() => {
    const handleProposalEvent = () => {
      // Refresh proposals on any proposal event
      fetchProposals();
    };

    // Subscribe to all proposal events
    proposalSocketService.on("proposalRequested", handleProposalEvent);
    proposalSocketService.on("proposalApproved", handleProposalEvent);
    proposalSocketService.on("proposalRejected", handleProposalEvent);
    proposalSocketService.on("proposalSent", handleProposalEvent);
    proposalSocketService.on("proposalAccepted", handleProposalEvent);
    proposalSocketService.on("proposalDeclined", handleProposalEvent);

    // Cleanup on unmount
    return () => {
      proposalSocketService.off("proposalRequested", handleProposalEvent);
      proposalSocketService.off("proposalApproved", handleProposalEvent);
      proposalSocketService.off("proposalRejected", handleProposalEvent);
      proposalSocketService.off("proposalSent", handleProposalEvent);
      proposalSocketService.off("proposalAccepted", handleProposalEvent);
      proposalSocketService.off("proposalDeclined", handleProposalEvent);
    };
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const userData = response.data || response;
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchProposals = async (page = pagination.page, limit = pagination.limit) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit,
        ...(statusFilter.length > 0 && { status: statusFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
        ...(isMasterSales && viewMode === "my" && user?.id && { requestedBy: user.id }),
      };

      const response = await api.getProposals(filters);

      // Ignore response if a newer fetch has already been triggered
      if (currentFetchId !== fetchIdRef.current) return;

      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setProposals(data);
      setPagination(meta);
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch proposals");
      console.error("Fetch proposals error:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
    }
  };

  const handleReview = (proposal) => {
    setSelectedProposal(proposal);
    setIsReviewDialogOpen(true);
  };

  const handleApprove = (proposal) => {
    setSelectedProposal(proposal);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (proposal) => {
    setSelectedProposal(proposal);
    setIsRejectDialogOpen(true);
  };

  const confirmApprove = async (adminNotes = "") => {
    try {
      await api.approveProposal(selectedProposal.id, adminNotes);
      toast.success("Proposal approved successfully");
      setIsApproveDialogOpen(false);
      fetchProposals();
    } catch (error) {
      toast.error(error.message || "Failed to approve proposal");
    }
  };

  const confirmReject = async (rejectionReason) => {
    try {
      await api.rejectProposal(selectedProposal.id, rejectionReason);
      toast.success("Proposal rejected");
      setIsRejectDialogOpen(false);
      fetchProposals();
    } catch (error) {
      toast.error(error.message || "Failed to reject proposal");
    }
  };

  const handleDelete = async (proposal) => {
    if (!window.confirm(`Are you sure you want to delete the proposal for ${proposal.inquiryName}? This action cannot be undone.`)) {
      return;
    }

    try {
      await api.cancelProposal(proposal.id);
      toast.success("Proposal deleted successfully");
      fetchProposals();
    } catch (error) {
      toast.error(error.message || "Failed to delete proposal");
    }
  };

  const handleRevise = async (proposal) => {
    try {
      const response = await api.getInquiryById(proposal.inquiryId);
      const inquiry = response.data || response;
      setReviseInquiry(inquiry);
      setSelectedProposal(proposal);
      setIsRequestProposalDialogOpen(true);
    } catch (error) {
      toast.error("Failed to load inquiry details for revision");
    }
  };

  const handleSendToClient = (proposal) => {
    setSelectedProposal({
      ...proposal,
      proposalId: proposal.id,
      name: proposal.inquiryName,
      email: proposal.inquiryEmail,
      company: proposal.inquiryCompany,
    });
    setIsSendProposalDialogOpen(true);
  };

  const handleToggleColumn = (columnKey) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Create columns with handlers
  const allColumns = createColumns({
    users,
    onReview: handleReview,
    onDelete: handleDelete,
    onRevise: handleRevise,
    onSendToClient: handleSendToClient,
    userRole: user?.role,
  });

  // Filter columns based on visibility
  const columns = allColumns.filter(column => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Proposals</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          {user?.role === "sales"
            ? "Your proposal requests"
            : "Review and manage proposal requests from sales team"}
        </p>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {isMasterSales && (
            <Tabs value={viewMode} onValueChange={setViewMode} className="w-full sm:w-auto">
              <TabsList className="h-9 w-full sm:w-auto">
                <TabsTrigger value="all" className="text-xs px-4 flex-1 sm:flex-none">All</TabsTrigger>
                <TabsTrigger value="my" className="text-xs px-4 flex-1 sm:flex-none">My</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Search */}
          <SearchInput
            placeholder="Search by client name, email, or company..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="w-full sm:flex-1 sm:min-w-[200px]"
          />

          {/* Column Visibility */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="w-full sm:w-auto h-9">
                <SlidersHorizontal className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[200px]">
              <DropdownMenuLabel className="font-bold">
                Toggle columns
              </DropdownMenuLabel>
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

        <div className="flex flex-wrap items-center gap-2">
          {/* Status Filter */}
          <FacetedFilter
            title="Status"
            options={[
              { value: "pending", label: "Pending Review" },
              { value: "approved", label: "Approved" },
              { value: "disapproved", label: "Disapproved" },
              { value: "sent", label: "Sent" },
              { value: "accepted", label: "Client Accepted" },
              { value: "cancelled", label: "Cancelled" },
            ]}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            getCount={(status) => facets.status[status] || 0}
          />

          {/* Clear filters */}
          {(statusFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter([]);
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
        data={proposals}
        isLoading={isLoading}
      />

      {/* Pagination */}
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
              fetchProposals(1, newLimit);
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
              onClick={() => fetchProposals(1)}
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
              onClick={() => fetchProposals(Math.max(pagination.page - 1, 1))}
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
              onClick={() => fetchProposals(Math.min(pagination.page + 1, pagination.totalPages))}
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
              onClick={() => fetchProposals(pagination.totalPages)}
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
      </div>

      {/* Dialogs */}
      <ReviewProposalDialog
        open={isReviewDialogOpen}
        onOpenChange={setIsReviewDialogOpen}
        proposal={selectedProposal}
        users={users}
        onApprove={handleApprove}
        onReject={handleReject}
        userRole={user?.role}
      />

      <ApproveProposalDialog
        open={isApproveDialogOpen}
        onOpenChange={setIsApproveDialogOpen}
        proposal={selectedProposal}
        onConfirm={confirmApprove}
      />

      <RejectProposalDialog
        open={isRejectDialogOpen}
        onOpenChange={setIsRejectDialogOpen}
        proposal={selectedProposal}
        onConfirm={confirmReject}
      />

      <RequestProposalDialog
        open={isRequestProposalDialogOpen}
        onOpenChange={setIsRequestProposalDialogOpen}
        inquiry={reviseInquiry}
        onSuccess={() => {
          setReviseInquiry(null);
          fetchProposals();
        }}
      />

      <SendProposalDialog
        open={isSendProposalDialogOpen}
        onOpenChange={setIsSendProposalDialogOpen}
        inquiry={selectedProposal}
        onSuccess={() => fetchProposals()}
      />
    </div>
  );
}
