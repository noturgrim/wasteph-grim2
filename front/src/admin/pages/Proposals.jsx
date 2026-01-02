import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "sonner";
import { SlidersHorizontal, X, Download } from "lucide-react";

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
import { createColumns } from "../components/proposals/columns";
import { ViewProposalDialog } from "../components/proposals/ViewProposalDialog";
import { ApproveProposalDialog } from "../components/proposals/ApproveProposalDialog";
import { RejectProposalDialog } from "../components/proposals/RejectProposalDialog";

export default function Proposals() {
  const { user } = useAuth();
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

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    inquiryName: true,
    inquiryEmail: true,
    inquiryCompany: true,
    requestedByName: true,
    status: true,
    totalAmount: true,
    createdAt: true,
  });

  // Users for assignment display
  const [users, setUsers] = useState([]);

  // Dialogs
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isApproveDialogOpen, setIsApproveDialogOpen] = useState(false);
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch filtered proposals
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    fetchProposals(1);
  }, [statusFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const userData = response.data || response;
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchProposals = async (page = pagination.page) => {
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit: pagination.limit,
        ...(statusFilter.length > 0 && { status: statusFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getProposals(filters);
      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setProposals(data);
      setPagination(meta);
    } catch (error) {
      toast.error("Failed to fetch proposals");
      console.error("Fetch proposals error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleView = (proposal) => {
    setSelectedProposal(proposal);
    setIsViewDialogOpen(true);
  };

  const handleApprove = (proposal) => {
    setSelectedProposal(proposal);
    setIsApproveDialogOpen(true);
  };

  const handleReject = (proposal) => {
    setSelectedProposal(proposal);
    setIsRejectDialogOpen(true);
  };

  const handleEdit = (proposal) => {
    setSelectedProposal(proposal);
    setIsEditDialogOpen(true);
  };

  const handleDownload = async (proposal) => {
    try {
      toast.info("Downloading PDF...");
      // We'll implement PDF download via API
      window.open(`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/proposals/${proposal.id}/pdf`, "_blank");
    } catch (error) {
      toast.error("Failed to download PDF");
      console.error("Download error:", error);
    }
  };

  const confirmApprove = async (adminNotes = "") => {
    try {
      await api.approveProposal(selectedProposal.id, adminNotes);
      toast.success("Proposal approved and sent to client");
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

  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
    fetchProposals(newPage);
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
    onView: handleView,
    onApprove: handleApprove,
    onReject: handleReject,
    onEdit: handleEdit,
    onDownload: handleDownload,
  });

  // Filter columns based on visibility
  const columns = allColumns.filter(column => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  // Status counts
  const statusCounts = {
    all: proposals.length,
    pending: proposals.filter(p => p.status === "pending").length,
    approved: proposals.filter(p => p.status === "approved").length,
    rejected: proposals.filter(p => p.status === "rejected").length,
    sent: proposals.filter(p => p.status === "sent").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <p className="text-muted-foreground">
          Review and manage proposal requests from sales team
        </p>
      </div>

      {/* Status Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        <Button
          variant={statusFilter.length === 0 ? "default" : "outline"}
          onClick={() => setStatusFilter([])}
          size="sm"
        >
          All
          <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
            {statusCounts.all}
          </span>
        </Button>
        <Button
          variant={statusFilter.includes("pending") ? "default" : "outline"}
          onClick={() => setStatusFilter(["pending"])}
          size="sm"
        >
          Pending Review
          <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
            {statusCounts.pending}
          </span>
        </Button>
        <Button
          variant={statusFilter.includes("approved") ? "default" : "outline"}
          onClick={() => setStatusFilter(["approved"])}
          size="sm"
        >
          Approved
          <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
            {statusCounts.approved}
          </span>
        </Button>
        <Button
          variant={statusFilter.includes("sent") ? "default" : "outline"}
          onClick={() => setStatusFilter(["sent"])}
          size="sm"
        >
          Sent
          <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
            {statusCounts.sent}
          </span>
        </Button>
        <Button
          variant={statusFilter.includes("rejected") ? "default" : "outline"}
          onClick={() => setStatusFilter(["rejected"])}
          size="sm"
        >
          Rejected
          <span className="ml-2 rounded-full bg-background px-2 py-0.5 text-xs">
            {statusCounts.rejected}
          </span>
        </Button>
      </div>

      {/* Filters & Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex flex-1 gap-2">
          {/* Search */}
          <SearchInput
            placeholder="Search by client name, email, or company..."
            value={searchTerm}
            onChange={setSearchTerm}
            className="max-w-sm"
          />
        </div>

        <div className="flex gap-2">
          {/* Column Visibility */}
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

      {/* Active Filters */}
      {(statusFilter.length > 0 || searchTerm) && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-muted-foreground">Active filters:</span>
          {statusFilter.length > 0 && (
            <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm">
              Status: {statusFilter.join(", ")}
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setStatusFilter([])}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          {searchTerm && (
            <div className="flex items-center gap-1 px-2 py-1 bg-secondary rounded-md text-sm">
              Search: "{searchTerm}"
              <Button
                variant="ghost"
                size="sm"
                className="h-4 w-4 p-0 hover:bg-transparent"
                onClick={() => setSearchTerm("")}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setStatusFilter([]);
              setSearchTerm("");
            }}
          >
            Clear all
          </Button>
        </div>
      )}

      {/* Table */}
      <DataTable
        columns={columns}
        data={proposals}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Dialogs */}
      <ViewProposalDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        proposal={selectedProposal}
        users={users}
        onApprove={handleApprove}
        onReject={handleReject}
        onDownload={handleDownload}
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
    </div>
  );
}
