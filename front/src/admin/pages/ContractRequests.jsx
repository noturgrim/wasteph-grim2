import { useState, useEffect } from "react";
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
import { createColumns } from "../components/contracts/columns";
import { RequestContractDialog } from "../components/contracts/RequestContractDialog";
import { UploadContractDialog } from "../components/contracts/UploadContractDialog";
import { GenerateContractDialog } from "../components/contracts/GenerateContractDialog";
import { SendToClientDialog } from "../components/contracts/SendToClientDialog";
import { ViewContractDetailsDialog } from "../components/contracts/ViewContractDetailsDialog";

export default function ContractRequests() {
  const { user } = useAuth();
  const [contracts, setContracts] = useState([]);
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
    clientName: true,
    clientEmail: true,
    salesPerson: true,
    status: true,
    createdAt: true,
  });

  // Users for display
  const [users, setUsers] = useState([]);

  // Dialogs
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isSendToClientDialogOpen, setIsSendToClientDialogOpen] =
    useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [selectedContract, setSelectedContract] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch filtered contracts
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    fetchContracts(1);
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

  const fetchContracts = async (page = pagination.page) => {
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit: pagination.limit,
        ...(statusFilter.length > 0 && { status: statusFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getContracts(filters);
      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setContracts(data);
      setPagination(meta);
    } catch (error) {
      toast.error("Failed to fetch contracts");
      console.error("Fetch contracts error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestContract = (contract) => {
    setSelectedContract(contract);
    setIsRequestDialogOpen(true);
  };

  const handleSubmitContract = (contract) => {
    setSelectedContract(contract);
    if (contract.contract?.templateId) {
      setIsGenerateDialogOpen(true);
    } else {
      setIsUploadDialogOpen(true);
    }
  };

  const handleSendToClient = (contract) => {
    setSelectedContract(contract);
    setIsSendToClientDialogOpen(true);
  };

  const handleUploadHardbound = async (contract) => {
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = "application/pdf";
    fileInput.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      if (file.type !== "application/pdf") {
        toast.error("Only PDF files are allowed");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        toast.error("File size must be less than 10MB");
        return;
      }

      try {
        await api.uploadHardboundContract(contract.contract.id, file);
        toast.success("Hardbound contract uploaded successfully");
        fetchContracts();
      } catch (error) {
        toast.error(error.message || "Failed to upload hardbound contract");
      }
    };
    fileInput.click();
  };

  const handleViewContract = (contract) => {
    api.previewContractPdf(contract.contract.id);
  };

  const handleViewDetails = (contract) => {
    setSelectedContract(contract);
    setIsViewDetailsDialogOpen(true);
  };

  const confirmRequestContract = async (
    contractDetails,
    customTemplateFile,
  ) => {
    try {
      await api.requestContract(
        selectedContract.contract.id,
        contractDetails,
        customTemplateFile,
      );
      toast.success("Contract requested successfully");
      setIsRequestDialogOpen(false);
      fetchContracts();
    } catch (error) {
      toast.error(error.message || "Failed to request contract");
    }
  };

  const confirmGenerateContract = async (response) => {
    // After successful generation, refresh contracts
    await fetchContracts();
  };

  const confirmUploadContract = async (
    pdfFile,
    adminNotes,
    _sendToSales,
    editedData,
  ) => {
    try {
      await api.uploadContractPdf(
        selectedContract.contract.id,
        pdfFile,
        adminNotes,
        editedData,
      );

      toast.success("Contract submitted successfully");
      setIsUploadDialogOpen(false);
      fetchContracts();
    } catch (error) {
      toast.error(error.message || "Failed to upload contract");
    }
  };

  const confirmSendToClient = async (clientEmail) => {
    try {
      await api.sendContractToClient(selectedContract.contract.id, clientEmail);
      toast.success("Contract sent to client successfully");
      setIsSendToClientDialogOpen(false);
      fetchContracts();
    } catch (error) {
      toast.error(error.message || "Failed to send contract to client");
    }
  };

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, page: newPage }));
    fetchContracts(newPage);
  };

  const handleToggleColumn = (columnKey) => {
    setColumnVisibility((prev) => ({
      ...prev,
      [columnKey]: !prev[columnKey],
    }));
  };

  // Create columns with handlers
  const allColumns = createColumns({
    users,
    userRole: user?.role,
    onRequestContract: handleRequestContract,
    onSubmitContract: handleSubmitContract,
    onSendToClient: handleSendToClient,
    onUploadHardbound: handleUploadHardbound,
    onViewContract: handleViewContract,
    onViewDetails: handleViewDetails,
  });

  // Filter columns based on visibility
  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Contract Requests</h1>
        <p className="text-muted-foreground">
          Manage contract requests from approved proposals
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Search */}
          <SearchInput
            placeholder="Search by client name, email, or company..."
            value={searchTerm}
            onChange={setSearchTerm}
          />

          {/* Status Filter */}
          <FacetedFilter
            title="Status"
            options={[
              { value: "pending_request", label: "Pending Request" },
              { value: "requested", label: "Requested" },
              { value: "sent_to_sales", label: "Sent to Sales" },
              { value: "sent_to_client", label: "Sent to Client" },
              { value: "signed", label: "Signed" },
              { value: "hardbound_received", label: "Hardbound Received" },
            ]}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            getCount={(status) =>
              contracts.filter((c) => c.contract?.status === status).length
            }
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
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
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

      {/* Table */}
      <DataTable
        columns={columns}
        data={contracts}
        isLoading={isLoading}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Dialogs */}
      <RequestContractDialog
        open={isRequestDialogOpen}
        onOpenChange={setIsRequestDialogOpen}
        contract={selectedContract}
        onConfirm={confirmRequestContract}
      />

      <UploadContractDialog
        open={isUploadDialogOpen}
        onOpenChange={setIsUploadDialogOpen}
        contract={selectedContract}
        users={users}
        onConfirm={confirmUploadContract}
      />

      <GenerateContractDialog
        open={isGenerateDialogOpen}
        onOpenChange={setIsGenerateDialogOpen}
        contract={selectedContract}
        users={users}
        onConfirm={confirmGenerateContract}
      />

      <SendToClientDialog
        open={isSendToClientDialogOpen}
        onOpenChange={setIsSendToClientDialogOpen}
        contract={selectedContract}
        onConfirm={confirmSendToClient}
      />

      <ViewContractDetailsDialog
        open={isViewDetailsDialogOpen}
        onOpenChange={setIsViewDetailsDialogOpen}
        contract={selectedContract}
        users={users}
      />
    </div>
  );
}
