import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, FileText } from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "../StatusBadge";
import { Badge } from "@/components/ui/badge";

export const createColumns = ({ users = [], onView, onEdit, onDelete, onRequestProposal, userRole }) => [
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Name
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
    },
    cell: ({ row }) => {
      const inquiry = row.original;
      return (
        <button
          onClick={() => onView(inquiry)}
          className="font-bold underline hover:text-primary cursor-pointer text-left"
        >
          {inquiry.name}
        </button>
      );
    },
  },
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => row.original.company || "-",
  },
  {
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const source = row.original.source;
      return (
        <span className="capitalize">
          {source?.replace("-", " ") || "website"}
        </span>
      );
    },
  },
  {
    accessorKey: "serviceType",
    header: "Type of Inquiry",
    cell: ({ row }) => {
      const serviceType = row.original.serviceType;
      const labels = {
        garbage_collection: "Garbage Collection",
        septic_siphoning: "Septic Siphoning",
        hazardous_waste: "Hazardous Waste",
        onetime_hauling: "One-time Hauling",
      };
      return serviceType ? labels[serviceType] || serviceType : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <StatusBadge status={status} />;
    },
  },
  {
    accessorKey: "proposalStatus",
    header: "Proposal",
    cell: ({ row }) => {
      const proposalStatus = row.original.proposalStatus;

      if (!proposalStatus) {
        return (
          <Badge variant="outline" className="bg-gray-50 text-gray-600 dark:bg-gray-900 dark:text-gray-400">
            No Proposal
          </Badge>
        );
      }

      const statusConfig = {
        pending: {
          label: "Pending Review",
          className: "bg-yellow-100 text-yellow-800 dark:bg-yellow-950 dark:text-yellow-200 border-yellow-300"
        },
        approved: {
          label: "Approved",
          className: "bg-green-100 text-green-800 dark:bg-green-950 dark:text-green-200 border-green-300"
        },
        rejected: {
          label: "Rejected",
          className: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-200 border-red-300"
        },
        sent: {
          label: "Sent",
          className: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-200 border-blue-300"
        },
      };

      const config = statusConfig[proposalStatus] || {
        label: proposalStatus,
        className: "bg-gray-100 text-gray-800"
      };

      return (
        <Badge variant="outline" className={config.className}>
          {config.label}
        </Badge>
      );
    },
  },
  {
    accessorKey: "assignedTo",
    header: "Assigned To",
    cell: ({ row }) => {
      const assignedTo = row.original.assignedTo;
      if (!assignedTo) return "-";

      const user = users.find(u => u.id === assignedTo);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    },
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Date
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
    },
    cell: ({ row }) => {
      return format(new Date(row.original.createdAt), "MMM dd, yyyy");
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const inquiry = row.original;

      return (
        <div className="flex items-center gap-2">
          {/* Request Proposal Button - only show if NO proposal exists OR proposal was rejected */}
          {!inquiry.proposalStatus &&
           inquiry.status !== "submitted_proposal" &&
           inquiry.status !== "declined" &&
           inquiry.status !== "on_boarded" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestProposal(inquiry)}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              Proposal
            </Button>
          )}

          {/* Show Proposal button for rejected proposals - allow resubmission */}
          {inquiry.proposalStatus === "rejected" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestProposal(inquiry)}
              className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              Revise Proposal
            </Button>
          )}

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => onView(inquiry)} className="cursor-pointer">
                <span className="flex-1">View Detail</span>
                <Eye className="h-4 w-4" />
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => onEdit(inquiry)} className="cursor-pointer">
                <span className="flex-1">Edit</span>
                <Pencil className="h-4 w-4" />
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem
                onClick={() => onDelete(inquiry)}
                className="text-destructive cursor-pointer"
              >
                <span className="flex-1">Delete</span>
                <Trash2 className="h-4 w-4 text-destructive" />
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
