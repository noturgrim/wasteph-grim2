import { useState, useEffect, useRef, useCallback } from "react";
import { Plus, Eye, Code, X, SlidersHorizontal, MoreHorizontal, Star, Trash2 } from "lucide-react";
import { api } from "../services/api";
import { toast } from "../utils/toast";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
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
import { Badge } from "@/components/ui/badge";
import { DataTable } from "../components/DataTable";
import { SearchInput } from "../components/SearchInput";
import { FacetedFilter } from "../components/FacetedFilter";
import { TemplatePreviewDialog } from "../components/templates/TemplatePreviewDialog";
import { TemplateEditorDialog } from "../components/templates/TemplateEditorDialog";
import { DeleteConfirmationModal } from "../components/modals/DeleteConfirmationModal";

// Service type mapping
const SERVICE_TYPES = {
  compactor_hauling: "Compactor Hauling",
  fixed_monthly: "Fixed Monthly Rate",
  hazardous_waste: "Hazardous Waste",
  clearing_project: "Clearing Project",
  long_term: "Long Term Garbage",
  one_time_hauling: "One-time Hauling",
  recyclables_purchase: "Purchase of Recyclables",
};

const SERVICE_TYPE_OPTIONS = [
  { value: "compactor_hauling", label: "Compactor Hauling" },
  { value: "fixed_monthly", label: "Fixed Monthly Rate" },
  { value: "hazardous_waste", label: "Hazardous Waste" },
  { value: "clearing_project", label: "Clearing Project" },
  { value: "long_term", label: "Long Term Garbage" },
  { value: "one_time_hauling", label: "One-time Hauling" },
  { value: "recyclables_purchase", label: "Purchase of Recyclables" },
];

export default function ProposalTemplates() {
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [serviceTypeFilter, setServiceTypeFilter] = useState([]);

  // Server-side facet counts
  const [facets, setFacets] = useState({ serviceType: {} });

  // Pagination
  const [pagination, setPagination] = useState({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 1,
  });

  // Track latest fetch to ignore stale responses
  const fetchIdRef = useRef(0);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    serviceType: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

  // Dialog states
  const [previewDialog, setPreviewDialog] = useState({ open: false, template: null });
  const [editorDialog, setEditorDialog] = useState({ open: false, template: null });
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);

  // Fetch templates, reset to page 1 on filter change
  useEffect(() => {
    setPagination((prev) => ({ ...prev, page: 1 }));
    fetchTemplates(1);
  }, [serviceTypeFilter, searchTerm]);

  const fetchTemplates = async (page = pagination.page, limit = pagination.limit) => {
    const currentFetchId = ++fetchIdRef.current;
    setLoading(true);
    try {
      const filters = {
        isActive: true,
        page,
        limit,
        ...(serviceTypeFilter.length > 0 && { templateType: serviceTypeFilter.join(",") }),
        ...(searchTerm && { search: searchTerm }),
      };

      const response = await api.getProposalTemplates(filters);

      if (currentFetchId !== fetchIdRef.current) return;

      setTemplates(response.data || []);
      setPagination(response.pagination || {
        total: 0,
        page: 1,
        limit: 10,
        totalPages: 1,
      });
      if (response.facets) {
        setFacets(response.facets);
      }
    } catch (error) {
      if (currentFetchId !== fetchIdRef.current) return;
      toast.error("Failed to fetch proposal templates");
    } finally {
      if (currentFetchId === fetchIdRef.current) {
        setLoading(false);
      }
    }
  };

  const handlePreview = (template) => {
    setPreviewDialog({ open: true, template });
  };

  const handleEdit = (template) => {
    setEditorDialog({ open: true, template });
  };

  const handleCreateNew = () => {
    setEditorDialog({ open: true, template: null });
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      if (editorDialog.template) {
        await api.updateProposalTemplate(editorDialog.template.id, templateData);
        toast.success("Template updated successfully");
      } else {
        await api.createProposalTemplate(templateData);
        toast.success("Template created successfully");
      }
      setEditorDialog({ open: false, template: null });
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to save template");
      throw error;
    }
  };

  const handleSetDefault = async (template) => {
    try {
      await api.setDefaultProposalTemplate(template.id);
      toast.success("Template set as default");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to set default template");
    }
  };

  const handleDelete = (template) => {
    setSelectedTemplate(template);
    setIsDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteProposalTemplate(selectedTemplate.id);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to delete template");
      throw error;
    }
  };

  // Facet count getter — reads from server-side counts
  const getServiceTypeCount = useCallback(
    (value) => facets.serviceType[value] || 0,
    [facets.serviceType],
  );

  const allColumns = [
      {
        accessorKey: "name",
        header: "Template Name",
        cell: ({ row }) => (
          <div>
            <div className="font-medium flex items-center gap-2">
              {row.original.name}
              {row.original.isDefault && (
                <Star className="h-3.5 w-3.5 fill-yellow-500 text-yellow-500" />
              )}
            </div>
            {row.original.description && (
              <div className="text-sm text-muted-foreground mt-0.5">
                {row.original.description}
              </div>
            )}
          </div>
        ),
      },
      {
        accessorKey: "serviceType",
        header: "Service Type",
        cell: ({ row }) => {
          const templateType = row.original.templateType;
          return templateType ? (
            <Badge variant="outline">
              {SERVICE_TYPES[templateType] || templateType}
            </Badge>
          ) : (
            <span className="text-sm text-muted-foreground">General</span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => (
          row.original.isDefault ? (
            <Badge className="bg-green-600">Default</Badge>
          ) : (
            <Badge variant="secondary">Active</Badge>
          )
        ),
      },
      {
        accessorKey: "createdAt",
        header: "Created",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.createdAt).toLocaleDateString()}
          </div>
        ),
      },
      {
        accessorKey: "updatedAt",
        header: "Last Updated",
        cell: ({ row }) => (
          <div className="text-sm text-muted-foreground">
            {new Date(row.original.updatedAt).toLocaleDateString()}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Actions",
        cell: ({ row }) => (
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={() => handlePreview(row.original)}
                className="cursor-pointer"
              >
                <Eye className="h-4 w-4 mr-2" />
                <span>Preview</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => handleEdit(row.original)}
                className="cursor-pointer"
              >
                <Code className="h-4 w-4 mr-2" />
                <span>Edit</span>
              </DropdownMenuItem>
              {!row.original.isDefault && (
                <DropdownMenuItem
                  onClick={() => handleSetDefault(row.original)}
                  className="cursor-pointer"
                >
                  <Star className="h-4 w-4 mr-2" />
                  <span>Set as Default</span>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => handleDelete(row.original)}
                className="cursor-pointer text-red-600 focus:text-red-600"
                disabled={row.original.isDefault}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
  ];

  // Filter columns based on visibility
  const columns = allColumns.filter(column => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 sm:gap-0">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Proposal Templates</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-1">
            Manage proposal templates for different service types
          </p>
        </div>
        <Button onClick={handleCreateNew} className="w-full sm:w-auto shrink-0">
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search templates..."
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
                    name: "Template Name",
                    serviceType: "Service Type",
                    status: "Status",
                    createdAt: "Created",
                    updatedAt: "Last Updated",
                  };
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.accessorKey}
                      checked={columnVisibility[column.accessorKey]}
                      onCheckedChange={(value) =>
                        setColumnVisibility({
                          ...columnVisibility,
                          [column.accessorKey]: value,
                        })
                      }
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
            title="Service Type"
            options={SERVICE_TYPE_OPTIONS}
            selectedValues={serviceTypeFilter}
            onSelectionChange={setServiceTypeFilter}
            getCount={getServiceTypeCount}
          />

          {(serviceTypeFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setServiceTypeFilter([]);
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

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={templates}
        isLoading={loading}
        emptyMessage="No templates found. Create your first template to get started."
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
              fetchTemplates(1, newLimit);
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
            onClick={() => fetchTemplates(1)}
            disabled={pagination.page === 1 || loading}
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
            onClick={() => fetchTemplates(Math.max(pagination.page - 1, 1))}
            disabled={pagination.page === 1 || loading}
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
            onClick={() => fetchTemplates(Math.min(pagination.page + 1, pagination.totalPages))}
            disabled={pagination.page >= pagination.totalPages || loading}
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
            onClick={() => fetchTemplates(pagination.totalPages)}
            disabled={pagination.page >= pagination.totalPages || loading}
          >
            <span className="sr-only">Last page</span>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="13 17 18 12 13 7" />
              <polyline points="6 17 11 12 6 7" />
            </svg>
          </Button>
        </div>
      </div>

      {/* Preview Dialog */}
      <TemplatePreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ open, template: null })}
        template={previewDialog.template}
      />

      {/* Editor Dialog */}
      <TemplateEditorDialog
        open={editorDialog.open}
        onOpenChange={(open) => setEditorDialog({ open, template: null })}
        template={editorDialog.template}
        onSave={handleSaveTemplate}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={confirmDelete}
        itemName={selectedTemplate?.name}
        itemType="proposal template"
      />
    </div>
  );
}
