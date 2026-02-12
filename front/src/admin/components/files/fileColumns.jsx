import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  Info,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const entityTypeConfig = {
  proposal: {
    label: "Proposal",
    className:
      "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900/40 dark:text-blue-300 dark:border-blue-700",
  },
  contract: {
    label: "Contract",
    className:
      "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900/40 dark:text-purple-300 dark:border-purple-700",
  },
  signed_contract: {
    label: "Signed Contract",
    className:
      "bg-green-100 text-green-700 border-green-300 dark:bg-green-900/40 dark:text-green-300 dark:border-green-700",
  },
  hardbound_contract: {
    label: "Hardbound",
    className:
      "bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900/40 dark:text-amber-300 dark:border-amber-700",
  },
  custom_template: {
    label: "Custom Template",
    className:
      "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600",
  },
  ticket_attachment: {
    label: "Ticket Attachment",
    className:
      "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/40 dark:text-orange-300 dark:border-orange-700",
  },
};

const actionLabels = {
  generated: "Generated",
  uploaded: "Uploaded",
  signed: "Signed by Client",
};

const formatFileSize = (bytes) => {
  if (!bytes) return null;
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const SortableHeader = ({ column, label }) => {
  const isSorted = column.getIsSorted();
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm">
          {label}
          {isSorted === "asc" ? (
            <ArrowUp className="ml-2 h-4 w-4" />
          ) : isSorted === "desc" ? (
            <ArrowDown className="ml-2 h-4 w-4" />
          ) : (
            <ArrowUpDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem onClick={() => column.toggleSorting(false)}>
          <ArrowUp className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Asc
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => column.toggleSorting(true)}>
          <ArrowDown className="mr-2 h-3.5 w-3.5 text-muted-foreground/70" />
          Desc
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const createFileColumns = ({ onView, onViewDetails }) => [
  {
    accessorKey: "fileName",
    header: ({ column }) => <SortableHeader column={column} label="File Name" />,
    cell: ({ row }) => {
      const file = row.original;
      const size = formatFileSize(file.fileSize);
      return (
        <div className="max-w-[250px]">
          <div className="font-medium truncate">{file.fileName}</div>
          {size && (
            <div className="text-xs text-muted-foreground">{size}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "entityType",
    header: "Type",
    cell: ({ row }) => {
      const config = entityTypeConfig[row.original.entityType] || entityTypeConfig.proposal;
      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "relatedEntityNumber",
    header: "Related To",
    cell: ({ row }) => {
      const file = row.original;
      return (
        <div>
          <div className="font-mono text-sm">
            {file.relatedEntityNumber || "-"}
          </div>
          {file.clientName && (
            <div className="text-xs text-muted-foreground">
              {file.clientName}
            </div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: "action",
    header: "Action",
    cell: ({ row }) => (
      <span className="text-sm">
        {actionLabels[row.original.action] || row.original.action}
      </span>
    ),
  },
  {
    accessorKey: "uploadedBy",
    header: "By",
    cell: ({ row }) => {
      const file = row.original;
      return (
        <div className="text-sm">
          {file.uploaderFirstName
            ? `${file.uploaderFirstName} ${file.uploaderLastName}`
            : "Client"}
        </div>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => <SortableHeader column={column} label="Date" />,
    cell: ({ row }) => {
      const date = row.original.createdAt;
      return date
        ? format(new Date(date), "MMM dd, yyyy HH:mm")
        : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const file = row.original;
      return (
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="h-8 w-8 p-0">
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(file)}>
              <Eye className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onViewDetails(file)}>
              <Info className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
