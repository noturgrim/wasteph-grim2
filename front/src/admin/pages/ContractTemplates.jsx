import { useState, useEffect, useMemo } from "react";
import { Plus, Eye, Code, X, SlidersHorizontal, MoreHorizontal, Star } from "lucide-react";
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
import { Badge } from "@/components/ui/badge";
import { DataTable } from "../components/DataTable";
import { SearchInput } from "../components/SearchInput";
import { FacetedFilter } from "../components/FacetedFilter";
import { ContractTemplatePreviewDialog } from "../components/contracts/ContractTemplatePreviewDialog";
import { ContractTemplateEditorDialog } from "../components/contracts/ContractTemplateEditorDialog";

// Contract type mapping
const CONTRACT_TYPES = {
  long_term_variable: "Long Term Variable Rate",
  long_term_fixed: "Long Term Fixed Rate",
  fixed_rate_term: "Fixed Rate Term",
  garbage_bins: "Garbage Bins",
  garbage_bins_disposal: "Garbage Bins with Disposal",
};

const CONTRACT_TYPE_OPTIONS = [
  { value: "long_term_variable", label: "Long Term Variable Rate" },
  { value: "long_term_fixed", label: "Long Term Fixed Rate" },
  { value: "fixed_rate_term", label: "Fixed Rate Term" },
  { value: "garbage_bins", label: "Garbage Bins" },
  { value: "garbage_bins_disposal", label: "Garbage Bins with Disposal" },
];

export default function ContractTemplates() {
  const [templates, setTemplates] = useState([]);
  const [allTemplates, setAllTemplates] = useState([]); // For counting
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [contractTypeFilter, setContractTypeFilter] = useState([]);

  // Column visibility
  const [columnVisibility, setColumnVisibility] = useState({
    name: true,
    contractType: true,
    status: true,
    createdAt: true,
    updatedAt: true,
  });

  // Dialog states
  const [previewDialog, setPreviewDialog] = useState({ open: false, template: null });
  const [editorDialog, setEditorDialog] = useState({ open: false, template: null });

  useEffect(() => {
    fetchTemplates();
  }, []);

  useEffect(() => {
    fetchTemplates();
  }, [contractTypeFilter, searchTerm]);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await api.getContractTemplates({ isActive: true });
      if (response.success) {
        // Handle paginated response structure
        const templatesData = Array.isArray(response.data)
          ? response.data
          : (response.templates || response.data || []);

        setAllTemplates(templatesData);

        // Apply filters
        let filtered = templatesData;

        // Contract type filter
        if (contractTypeFilter.length > 0) {
          filtered = filtered.filter(t =>
            contractTypeFilter.includes(t.templateType)
          );
        }

        // Search filter
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          filtered = filtered.filter(t =>
            t.name.toLowerCase().includes(search) ||
            (t.description && t.description.toLowerCase().includes(search))
          );
        }

        setTemplates(filtered);
      }
    } catch (error) {
      toast.error("Failed to fetch contract templates");
    } finally {
      setLoading(false);
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

  const handleSetDefault = async (template) => {
    try {
      await api.setDefaultContractTemplate(template.id);
      toast.success("Template set as default");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to set default template");
    }
  };

  const handleSaveTemplate = async (templateData) => {
    try {
      if (editorDialog.template) {
        await api.updateContractTemplate(editorDialog.template.id, templateData);
        toast.success("Template updated successfully");
      } else {
        await api.createContractTemplate(templateData);
        toast.success("Template created successfully");
      }
      setEditorDialog({ open: false, template: null });
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to save template");
      throw error;
    }
  };

  const handleDeleteTemplate = async (template) => {
    if (!confirm(`Are you sure you want to delete "${template.name}"?`)) {
      return;
    }

    try {
      await api.deleteContractTemplate(template.id);
      toast.success("Template deleted successfully");
      fetchTemplates();
    } catch (error) {
      toast.error(error.message || "Failed to delete template");
    }
  };

  // Count function for contract type filter
  const getContractTypeCount = (value) => {
    return allTemplates.filter(t => t.templateType === value).length;
  };

  // Define table columns
  const allColumns = useMemo(
    () => [
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
        accessorKey: "contractType",
        header: "Contract Type",
        cell: ({ row }) => {
          const contractType = row.original.templateType;
          return contractType ? (
            <Badge variant="outline">
              {CONTRACT_TYPES[contractType] || contractType}
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
          <DropdownMenu>
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
                onClick={() => handleDeleteTemplate(row.original)}
                className="cursor-pointer text-destructive"
                disabled={row.original.isDefault}
              >
                <span>Delete</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
      },
    ],
    []
  );

  // Filter columns based on visibility
  const columns = allColumns.filter(column => {
    if (!column.accessorKey) return true; // Always show actions column
    return columnVisibility[column.accessorKey];
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Contract Templates</h1>
          <p className="text-muted-foreground">
            Manage contract templates for different contract types
          </p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" />
          New Template
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search templates..."
          />

          <FacetedFilter
            title="Contract Type"
            options={CONTRACT_TYPE_OPTIONS}
            selectedValues={contractTypeFilter}
            onSelectionChange={setContractTypeFilter}
            getCount={getContractTypeCount}
          />

          {(contractTypeFilter.length > 0 || searchTerm) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setContractTypeFilter([]);
                setSearchTerm("");
              }}
              className="h-8 px-2 lg:px-3"
            >
              Reset
              <X className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Column Visibility */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {Object.keys(columnVisibility).map(key => (
              <DropdownMenuCheckboxItem
                key={key}
                checked={columnVisibility[key]}
                onCheckedChange={(checked) =>
                  setColumnVisibility(prev => ({ ...prev, [key]: checked }))
                }
              >
                {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={templates}
        isLoading={loading}
      />

      {/* Dialogs */}
      <ContractTemplatePreviewDialog
        open={previewDialog.open}
        onOpenChange={(open) => setPreviewDialog({ open, template: null })}
        template={previewDialog.template}
      />

      <ContractTemplateEditorDialog
        open={editorDialog.open}
        onOpenChange={(open) => setEditorDialog({ open, template: null })}
        template={editorDialog.template}
        onSave={handleSaveTemplate}
      />
    </div>
  );
}
