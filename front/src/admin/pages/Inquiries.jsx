import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import {
  Plus,
  SlidersHorizontal,
  X,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { format } from "date-fns";

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
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { DeleteConfirmationModal } from "../components/modals";
import { AddInquiryDialog } from "../components/inquiries/AddInquiryDialog";
import { EditInquiryDialog } from "../components/inquiries/EditInquiryDialog";
import { ViewInquiryDialog } from "../components/inquiries/ViewInquiryDialog";
import { RequestProposalDialog } from "../components/inquiries/RequestProposalDialog";
import { SendProposalDialog } from "../components/inquiries/SendProposalDialog";
import { createColumns } from "../components/inquiries/columns";

// Month names for the picker
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

// Month Picker Content Component
function MonthPickerContent({ value, onChange }) {
  const [displayYear, setDisplayYear] = useState(() => {
    if (value) {
      return parseInt(value.split("-")[0]);
    }
    return new Date().getFullYear();
  });

  const selectedMonth = value ? parseInt(value.split("-")[1]) - 1 : null;
  const selectedYear = value ? parseInt(value.split("-")[0]) : null;

  const handleMonthSelect = (monthIndex) => {
    const month = String(monthIndex + 1).padStart(2, "0");
    onChange(`${displayYear}-${month}`);
  };

  const handleClear = () => {
    onChange("");
  };

  return (
    <div className="p-3">
      {/* Year Navigation */}
      <div className="flex items-center justify-between mb-3">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDisplayYear(displayYear - 1)}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <span className="text-sm font-medium">{displayYear}</span>
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => setDisplayYear(displayYear + 1)}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Month Grid */}
      <div className="grid grid-cols-3 gap-2">
        {MONTHS.map((month, index) => {
          const isSelected =
            selectedMonth === index && selectedYear === displayYear;
          return (
            <Button
              key={month}
              variant={isSelected ? "default" : "ghost"}
              size="sm"
              className={`h-8 text-xs ${isSelected ? "" : "hover:bg-accent"}`}
              onClick={() => handleMonthSelect(index)}
            >
              {month.substring(0, 3)}
            </Button>
          );
        })}
      </div>

      {/* Clear Button */}
      {value && (
        <Button
          variant="ghost"
          size="sm"
          className="w-full mt-3 text-muted-foreground"
          onClick={handleClear}
        >
          Clear selection
        </Button>
      )}
    </div>
  );
}

export default function Inquiries() {
  const { user } = useAuth();
  const isMasterSales = user?.isMasterSales || false;
  const [inquiries, setInquiries] = useState([]);
  const [allInquiries, setAllInquiries] = useState([]); // Store all inquiries for counting
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
  const [sourceFilter, setSourceFilter] = useState([]);
  const [serviceTypeFilter, setServiceTypeFilter] = useState([]);
  const [monthFilter, setMonthFilter] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    inquiryNumber: true,
    name: true,
    company: true,
    source: true,
    service: true,
    status: true,
    proposalStatus: true,
    assignedTo: true,
    createdAt: true,
  });

  // Users for assignment
  const [users, setUsers] = useState([]);

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isRequestProposalDialogOpen, setIsRequestProposalDialogOpen] =
    useState(false);
  const [isSendProposalDialogOpen, setIsSendProposalDialogOpen] =
    useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on mount
  useEffect(() => {
    fetchUsers();
    fetchAllInquiries();
  }, []);

  // Fetch filtered inquiries
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 })); // Reset to page 1 on filter change
    fetchInquiries(1);
  }, [statusFilter, sourceFilter, serviceTypeFilter, monthFilter, searchTerm]);

  const fetchUsers = async () => {
    try {
      const response = await api.getUsers();
      const userData = response.data || response;
      setUsers(userData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
    }
  };

  const fetchAllInquiries = async () => {
    try {
      const filters = {};
      // For normal sales, only show inquiries assigned to them
      if (!isMasterSales && user?.id) {
        filters.assignedTo = user.id;
      }
      const response = await api.getInquiries(filters);
      // Backend returns { data, pagination } so we need response.data
      setAllInquiries(response.data || []);
    } catch (error) {
      console.error("Failed to fetch all inquiries:", error);
    }
  };

  const fetchInquiries = async (
    page = pagination.page,
    limit = pagination.limit,
  ) => {
    try {
      setIsLoading(true);
      const filters = {
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        source: sourceFilter.length > 0 ? sourceFilter.join(",") : undefined,
        serviceType:
          serviceTypeFilter.length > 0
            ? serviceTypeFilter.join(",")
            : undefined,
        month: monthFilter || undefined,
        search: searchTerm || undefined,
        page,
        limit,
      };

      // For normal sales, only show inquiries assigned to them
      if (!isMasterSales && user?.id) {
        filters.assignedTo = user.id;
      }

      const response = await api.getInquiries(filters);

      // Backend now returns { data, pagination }
      setInquiries(response.data || []);
      setPagination(
        response.pagination || { total: 0, page: 1, limit: 20, totalPages: 1 },
      );
    } catch (error) {
      toast.error(error.message || "Failed to fetch inquiries");
    } finally {
      setIsLoading(false);
    }
  };

  // Get count for each status from all inquiries
  const getStatusCount = (status) => {
    return allInquiries.filter((inquiry) => inquiry.status === status).length;
  };

  // Get count for each source from all inquiries
  const getSourceCount = (source) => {
    return allInquiries.filter((inquiry) => inquiry.source === source).length;
  };

  // Get count for each service type from all inquiries
  const getServiceTypeCount = (serviceType) => {
    return allInquiries.filter((inquiry) => inquiry.serviceType === serviceType)
      .length;
  };

  // CRUD Handlers
  const handleCreateInquiry = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.createInquiry(formData);
      toast.success("Inquiry created successfully");
      setIsCreateDialogOpen(false);
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to create inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInquiry = async (formData) => {
    setIsSubmitting(true);
    try {
      await api.updateInquiry(selectedInquiry.id, formData);
      toast.success("Inquiry updated successfully");
      setIsEditDialogOpen(false);
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to update inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteInquiry(selectedInquiry.id);
      toast.success("Inquiry deleted successfully");
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to delete inquiry");
      throw error;
    }
  };

  // Table columns setup
  const allColumns = createColumns({
    users,
    onView: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsViewDialogOpen(true);
    },
    onEdit: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsEditDialogOpen(true);
    },
    onRequestProposal: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsRequestProposalDialogOpen(true);
    },
    onSendToClient: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsSendProposalDialogOpen(true);
    },
    onDelete: handleDeleteInquiry,
    userRole: user?.role,
  });

  // Filter columns based on visibility
  const columns = allColumns.filter((column) => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground">Manage inquiry leads</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Inquiry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search inquiries..."
          />

          <FacetedFilter
            title="Status"
            options={[
              { value: "submitted_proposal", label: "Submitted Proposal" },
              { value: "initial_comms", label: "Initial Comms" },
              { value: "negotiating", label: "Negotiating" },
              { value: "to_call", label: "To Call" },
              {
                value: "submitted_company_profile",
                label: "Submitted Company Profile",
              },
              { value: "na", label: "N/A" },
              { value: "waiting_for_feedback", label: "Waiting for Feedback" },
              { value: "declined", label: "Declined" },
              { value: "on_boarded", label: "On Boarded" },
            ]}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            getCount={getStatusCount}
          />

          <FacetedFilter
            title="Source"
            options={[
              "website",
              "facebook",
              "email",
              "phone",
              "walk-in",
              "cold-approach",
            ]}
            selectedValues={sourceFilter}
            onSelectionChange={setSourceFilter}
            getCount={getSourceCount}
          />

          <FacetedFilter
            title="Service Type"
            options={[
              { value: "fixed_monthly_rate", label: "Fixed Monthly Rate" },
              { value: "hazardous_waste", label: "Hazardous Waste" },
              { value: "clearing_project", label: "Clearing Project" },
              { value: "long_term_garbage", label: "Long Term Garbage" },
              { value: "onetime_hauling", label: "One-time Hauling" },
              {
                value: "purchase_of_recyclables",
                label: "Purchase of Recyclables",
              },
            ]}
            selectedValues={serviceTypeFilter}
            onSelectionChange={setServiceTypeFilter}
            getCount={getServiceTypeCount}
          />

          {/* Month Filter - Calendar Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className={`h-8 border-dashed ${monthFilter ? "border-solid" : ""}`}
              >
                <CalendarDays className="mr-2 h-4 w-4" />
                {monthFilter
                  ? format(new Date(monthFilter + "-01"), "MMMM yyyy")
                  : "Select Month"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <MonthPickerContent
                value={monthFilter}
                onChange={setMonthFilter}
              />
            </PopoverContent>
          </Popover>

          {(statusFilter.length > 0 ||
            sourceFilter.length > 0 ||
            serviceTypeFilter.length > 0 ||
            monthFilter ||
            searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setStatusFilter([]);
                setSourceFilter([]);
                setServiceTypeFilter([]);
                setMonthFilter("");
                setSearchTerm("");
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* View Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
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
                const columnLabels = {
                  inquiryNumber: "Inquiry #",
                  name: "Client Info",
                  company: "Company",
                  source: "Source",
                  service: "Service",
                  status: "Status",
                  proposalStatus: "Proposal",
                  assignedTo: "Assigned To",
                  createdAt: "Date",
                };
                return (
                  <DropdownMenuCheckboxItem
                    key={column.accessorKey}
                    checked={columnVisibility[column.accessorKey]}
                    onCheckedChange={(value) =>
                      setColumnVisibility((prev) => ({
                        ...prev,
                        [column.accessorKey]: value,
                      }))
                    }
                  >
                    {columnLabels[column.accessorKey] || column.accessorKey}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Status Legend */}
      <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground bg-muted/30 dark:bg-muted/20 rounded-lg p-3 border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-blue-500"></div>
          <span>Cold (Needs info)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-orange-500"></div>
          <span>Warm (In progress)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-red-500"></div>
          <span>Hot (Ready to close)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-full bg-green-500"></div>
          <span>Won (Graduated)</span>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={inquiries}
        isLoading={isLoading}
        emptyMessage="No inquiries found"
        showViewOptions={false}
        getRowClassName={(inquiry) => {
          const status = inquiry.status;
          const hasInfo = inquiry.isInformationComplete !== false;

          // HOT - Red border (Information gathered, ready to close)
          if (
            hasInfo &&
            ["negotiating", "submitted_proposal"].includes(status)
          ) {
            return "[&>td:first-child]:border-l-4 [&>td:first-child]:border-l-red-500 dark:[&>td:first-child]:border-l-red-400";
          }

          // WARM - Orange border (Active work in progress)
          if (
            ["to_call", "submitted_company_profile"].includes(status) ||
            (!hasInfo && ["negotiating", "submitted_proposal"].includes(status))
          ) {
            return "[&>td:first-child]:border-l-4 [&>td:first-child]:border-l-orange-500 dark:[&>td:first-child]:border-l-orange-400";
          }

          // COLD - Blue border (Early stage, needs information)
          if (
            ["initial_comms", "waiting_for_feedback"].includes(status) ||
            !hasInfo
          ) {
            return "[&>td:first-child]:border-l-4 [&>td:first-child]:border-l-blue-500 dark:[&>td:first-child]:border-l-blue-400";
          }

          // SUCCESS - Green border (Won)
          if (status === "on_boarded") {
            return "[&>td:first-child]:border-l-4 [&>td:first-child]:border-l-green-500 dark:[&>td:first-child]:border-l-green-400";
          }

          // DECLINED - Gray border
          if (status === "declined" || status === "na") {
            return "[&>td:first-child]:border-l-4 [&>td:first-child]:border-l-gray-400 dark:[&>td:first-child]:border-l-gray-600";
          }

          // Default
          return "";
        }}
      />

      {/* Pagination */}
      <div className="flex items-center justify-end gap-8 pt-4">
        {/* Rows per page */}
        <div className="flex items-center gap-2">
          <span className="text-sm whitespace-nowrap">Rows per page</span>
          <Select
            value={pagination.limit.toString()}
            onValueChange={(value) => {
              const newLimit = parseInt(value);
              setPagination((prev) => ({ ...prev, limit: newLimit, page: 1 }));
              fetchInquiries(1, newLimit);
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

        {/* Page info */}
        <span className="text-sm">
          Page {pagination.page} of {pagination.totalPages}
        </span>

        {/* Navigation buttons */}
        <div className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-8 w-8"
            onClick={() => fetchInquiries(1)}
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
            onClick={() => fetchInquiries(pagination.page - 1)}
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
            onClick={() => fetchInquiries(pagination.page + 1)}
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
            className="h-8 w-8"
            onClick={() => fetchInquiries(pagination.totalPages)}
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

      <AddInquiryDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={handleCreateInquiry}
        isSubmitting={isSubmitting}
      />

      <EditInquiryDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        inquiry={selectedInquiry}
        users={users}
        isMasterSales={isMasterSales}
        onSubmit={handleUpdateInquiry}
        isSubmitting={isSubmitting}
      />

      <ViewInquiryDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        inquiry={selectedInquiry}
        users={users}
      />

      <RequestProposalDialog
        open={isRequestProposalDialogOpen}
        onOpenChange={setIsRequestProposalDialogOpen}
        inquiry={selectedInquiry}
        onSuccess={() => {
          fetchAllInquiries();
          fetchInquiries();
        }}
      />

      <SendProposalDialog
        open={isSendProposalDialogOpen}
        onOpenChange={setIsSendProposalDialogOpen}
        inquiry={selectedInquiry}
        onSuccess={() => {
          fetchAllInquiries();
          fetchInquiries();
        }}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete"
        itemName={selectedInquiry?.name || selectedInquiry?.email}
        itemType="inquiry"
        actionsList={[
          "Permanently delete this inquiry",
          "Remove all associated data",
          "This cannot be undone",
        ]}
        warningMessage="This action cannot be undone."
      />
    </div>
  );
}
