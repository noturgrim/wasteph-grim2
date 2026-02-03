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
    accessorKey: "inquiryNumber",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Inquiry #
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
      const inquiryNumber = inquiry.inquiryNumber;
      return (
        <button
          onClick={() => onView(inquiry)}
          className="font-mono text-sm italic font-normal text-black dark:text-white hover:underline cursor-pointer"
        >
          {inquiryNumber || "-"}
        </button>
      );
    },
  },
  {
    accessorKey: "name",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Client Info
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
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{inquiry.name}</span>
          <span className="text-sm text-muted-foreground">{inquiry.email}</span>
        </div>
      );
    },
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
    accessorKey: "service",
    header: "Service",
    cell: ({ row }) => {
      const service = row.original.service;
      return service?.name || "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      const isIncomplete = row.original.isInformationComplete === false;
      return (
        <div className="flex items-center gap-2">
          <StatusBadge status={status} />
          {isIncomplete && (
            <Badge variant="outline" className="bg-amber-100 text-amber-700 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700 text-xs">
              Info Needed
            </Badge>
          )}
        </div>
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
      const canRequestProposal = inquiry.isInformationComplete !== false;

      return (
        <div className="flex items-center gap-2">
          {/* Request Proposal Button - only show if NO proposal exists OR proposal was rejected */}
          {/* Also check if information is complete (for inquiries from claimed leads) */}
          {!inquiry.proposalStatus &&
           inquiry.status !== "submitted_proposal" &&
           inquiry.status !== "declined" &&
           inquiry.status !== "on_boarded" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRequestProposal(inquiry)}
              disabled={!canRequestProposal}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
              title={!canRequestProposal ? "Complete inquiry information first" : "Request proposal"}
            >
              <FileText className="h-4 w-4 mr-1" />
              Proposal
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
