import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/ui/date-picker";

import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { createFileColumns } from "../components/files/fileColumns";
import { FileDetailsDialog } from "../components/files/FileDetailsDialog";
import { PDFViewer } from "../components/PDFViewer";

const entityTypeOptions = [
  { value: "proposal", label: "Proposal" },
  { value: "contract", label: "Contract" },
  { value: "signed_contract", label: "Signed Contract" },
  { value: "hardbound_contract", label: "Hardbound" },
  { value: "custom_template", label: "Custom Template" },
  { value: "ticket_attachment", label: "Ticket Attachment" },
];

const statLabels = {
  proposal: "Proposals",
  contract: "Contracts",
  signed_contract: "Signed",
  hardbound_contract: "Hardbound",
  custom_template: "Templates",
  ticket_attachment: "Attachments",
};

export default function Files() {
  const { user } = useAuth();
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Filters
  const [entityTypeFilter, setEntityTypeFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [dateFrom, setDateFrom] = useState(undefined);
  const [dateTo, setDateTo] = useState(undefined);

  // Server-side facet counts
  const [facets, setFacets] = useState({ entityType: {} });

  // Stale-response guard
  const fetchIdRef = useRef(0);

  // Reset to page 1 on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchFiles(1);
  }, [entityTypeFilter, searchTerm, dateFrom, dateTo]);

  const fetchFiles = async (
    page = pagination.page,
    limit = pagination.limit
  ) => {
    const currentFetchId = ++fetchIdRef.current;
    setIsLoading(true);
    try {
      const filters = {
        page,
        limit,
        ...(entityTypeFilter.length > 0 && {
          entityType: entityTypeFilter.join(","),
        }),
        ...(searchTerm && { search: searchTerm }),
        ...(dateFrom && { dateFrom: format(dateFrom, "yyyy-MM-dd") }),
        ...(dateTo && { dateTo: format(dateTo, "yyyy-MM-dd") }),
      };

      const response = await api.getFiles(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      setFiles(response.data || []);
      setPagination(
        response.pagination || { total: 0, page: 1, limit: 10, totalPages: 1 }
      );
      if (response.facets) setFacets(response.facets);
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch files");
    } finally {
      if (currentFetchId === fetchIdRef.current) setIsLoading(false);
    }
  };

  // PDF Viewer state
  const [viewerFile, setViewerFile] = useState(null);
  const [viewerUrl, setViewerUrl] = useState(null);
  const [isViewerOpen, setIsViewerOpen] = useState(false);

  // Details dialog state
  const [detailsFile, setDetailsFile] = useState(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  const handleView = async (file) => {
    try {
      const response = await api.getFileDownloadUrl(file.id);
      setViewerFile(file);
      setViewerUrl(response.data.downloadUrl);
      setIsViewerOpen(true);
    } catch (error) {
      toast.error("Failed to get file URL");
    }
  };

  const handleViewDetails = (file) => {
    setDetailsFile(file);
    setIsDetailsOpen(true);
  };

  const columns = createFileColumns({
    onView: handleView,
    onViewDetails: handleViewDetails,
  });

  const hasActiveFilters =
    entityTypeFilter.length > 0 ||
    searchTerm ||
    dateFrom !== undefined ||
    dateTo !== undefined;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Files</h1>
        <p className="text-muted-foreground">
          View and download all files related to your work
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {Object.entries(statLabels).map(([type, label]) => (
          <div
            key={type}
            className="rounded-lg border bg-card p-4 text-card-foreground"
          >
            <p className="text-sm text-muted-foreground">{label}</p>
            <p className="text-2xl font-bold">
              {facets.entityType[type] || 0}
            </p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <SearchInput
          placeholder="Search by file name, entity #, or client..."
          value={searchTerm}
          onChange={setSearchTerm}
          className="w-full sm:w-auto"
        />
        <div className="flex items-center gap-2 flex-wrap">
          <DatePicker
            date={dateFrom}
            onDateChange={setDateFrom}
            placeholder="From date"
            toDate={dateTo || undefined}
            className="w-full sm:w-[160px] h-9"
          />
          <DatePicker
            date={dateTo}
            onDateChange={setDateTo}
            placeholder="To date"
            fromDate={dateFrom || undefined}
            className="w-full sm:w-[160px] h-9"
          />
          <FacetedFilter
            title="Type"
            options={entityTypeOptions}
            selectedValues={entityTypeFilter}
            onSelectionChange={setEntityTypeFilter}
            getCount={(type) => facets.entityType[type] || 0}
          />
          {hasActiveFilters && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setEntityTypeFilter([]);
                setSearchTerm("");
                setDateFrom(undefined);
                setDateTo(undefined);
              }}
              className="h-8 px-2 lg:px-3"
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
        data={files}
        isLoading={isLoading}
        emptyMessage="No files found"
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
              fetchFiles(1, newLimit);
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
            onClick={() => fetchFiles(1)}
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
            onClick={() =>
              fetchFiles(Math.max(pagination.page - 1, 1))
            }
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
              fetchFiles(
                Math.min(pagination.page + 1, pagination.totalPages)
              )
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
            className="h-8 w-8"
            onClick={() => fetchFiles(pagination.totalPages)}
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

      {/* File Details Dialog */}
      <FileDetailsDialog
        open={isDetailsOpen}
        onOpenChange={setIsDetailsOpen}
        file={detailsFile}
      />

      {/* PDF/File Viewer */}
      <PDFViewer
        isOpen={isViewerOpen}
        fileUrl={viewerUrl}
        fileName={viewerFile?.fileName}
        fileType={viewerFile?.fileType}
        title="File Preview"
        onClose={() => {
          setIsViewerOpen(false);
          setViewerUrl(null);
          setViewerFile(null);
        }}
      />
    </div>
  );
}
