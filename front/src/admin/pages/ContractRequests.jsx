import { useState, useEffect, useRef } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { SlidersHorizontal, X } from "lucide-react";
import contractSocketService from "../services/contractSocketService";

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

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { createColumns } from "../components/contracts/columns";
import { RequestContractDialog } from "../components/contracts/RequestContractDialog";
import { UploadContractDialog } from "../components/contracts/UploadContractDialog";
import { GenerateContractDialog } from "../components/contracts/GenerateContractDialog";
import { SendToClientDialog } from "../components/contracts/SendToClientDialog";
import { ViewContractDetailsDialog } from "../components/contracts/ViewContractDetailsDialog";
import { UploadHardboundDialog } from "../components/contracts/UploadHardboundDialog";
import { PDFViewer } from "../components/PDFViewer";

export default function ContractRequests() {
  const { user } = useAuth();
  const location = useLocation();
  const isMasterSales = user?.isMasterSales || false;
  const [viewMode, setViewMode] = useState("all");
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

  // Server-side facet counts
  const [facets, setFacets] = useState({ status: {} });

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    contractNumber: true,
    clientName: true,
    clientEmail: true,
    salesPerson: true,
    status: true,
    createdAt: true,
    source: true,
  });

  // Users for display
  const [users, setUsers] = useState([]);

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Dialogs
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isGenerateDialogOpen, setIsGenerateDialogOpen] = useState(false);
  const [isSendToClientDialogOpen, setIsSendToClientDialogOpen] =
    useState(false);
  const [isViewDetailsDialogOpen, setIsViewDetailsDialogOpen] = useState(false);
  const [isUploadHardboundDialogOpen, setIsUploadHardboundDialogOpen] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);
  const [pdfViewerUrl, setPdfViewerUrl] = useState("");
  const [pdfViewerName, setPdfViewerName] = useState("");
  const [selectedContract, setSelectedContract] = useState(null);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
  }, []);

  // Fetch filtered contracts
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    fetchContracts(1);
  }, [statusFilter, searchTerm, viewMode]);

  // Listen for contract socket events
  useEffect(() => {
    const handleContractEvent = () => {
      // Refresh the contracts list when any contract event occurs
      fetchContracts();
    };

    // Subscribe to all contract events
    contractSocketService.on("contractRequested", handleContractEvent);
    contractSocketService.on("contractSentToSales", handleContractEvent);
    contractSocketService.on("contractSentToClient", handleContractEvent);
    contractSocketService.on("contractSigned", handleContractEvent);

    // Cleanup
    return () => {
      contractSocketService.off("contractRequested", handleContractEvent);
      contractSocketService.off("contractSentToSales", handleContractEvent);
      contractSocketService.off("contractSentToClient", handleContractEvent);
      contractSocketService.off("contractSigned", handleContractEvent);
    };
  }, []);

  // Handle opening contract from notification
  useEffect(() => {
    if (location.state?.openContractId && contracts.length > 0) {
      const contract = contracts.find(
        (c) => c.contract.id === location.state.openContractId
      );
      if (contract) {
        handleViewDetails(contract);
        // Clear the state to prevent reopening
        window.history.replaceState({}, document.title);
      }
    }
  }, [location.state, contracts]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const userData = response.data || response;
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchContracts = async (page = pagination.page, limit = pagination.limit) => {
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

      const response = await api.getContracts(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      const data = response.data || [];
      const meta = response.pagination || {
        total: data.length,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      setContracts(data);
      setPagination(meta);
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch contracts");
      console.error("Fetch contracts error:", error);
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setIsLoading(false);
      }
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

  const handleUploadHardbound = (contract) => {
    setSelectedContract(contract);
    setIsUploadHardboundDialogOpen(true);
  };

  const confirmUploadHardbound = async (file) => {
    try {
      await api.uploadHardboundContract(selectedContract.contract.id, file);
      toast.success("Hardbound contract uploaded successfully");
      setIsUploadHardboundDialogOpen(false);
      fetchContracts();
    } catch (error) {
      toast.error(error.message || "Failed to upload hardbound contract");
    }
  };

  const handleViewContract = async (contract) => {
    try {
      const dataUrl = await api.previewContractPdf(contract.contract.id);
      setPdfViewerUrl(dataUrl);
      setPdfViewerName(`${contract.inquiry?.name || "Contract"} - Contract.pdf`);
      setShowPdfViewer(true);
    } catch (error) {
      toast.error("Failed to load contract PDF");
    }
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
          {isMasterSales && (
            <Tabs value={viewMode} onValueChange={setViewMode}>
              <TabsList className="h-8">
                <TabsTrigger value="all" className="text-xs px-3">All</TabsTrigger>
                <TabsTrigger value="my" className="text-xs px-3">My</TabsTrigger>
              </TabsList>
            </Tabs>
          )}

          {/* Search */}
          <SearchInput
            placeholder="Search by contract no., client name, email, or company..."
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
              fetchContracts(1, newLimit);
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
            onClick={() => fetchContracts(1)}
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
            onClick={() => fetchContracts(Math.max(pagination.page - 1, 1))}
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
            onClick={() => fetchContracts(Math.min(pagination.page + 1, pagination.totalPages))}
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
            onClick={() => fetchContracts(pagination.totalPages)}
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

      <UploadHardboundDialog
        open={isUploadHardboundDialogOpen}
        onOpenChange={setIsUploadHardboundDialogOpen}
        contract={selectedContract}
        onConfirm={confirmUploadHardbound}
      />

      {showPdfViewer && pdfViewerUrl && (
        <PDFViewer
          fileUrl={pdfViewerUrl}
          fileName={pdfViewerName}
          title="Contract PDF"
          onClose={() => setShowPdfViewer(false)}
          isOpen={showPdfViewer}
        />
      )}
    </div>
  );
}
