import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  MoreHorizontal,
  Eye,
  CheckCircle2,
  XCircle,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil,
  FileSearch
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Pending Review", variant: "secondary" },
    approved: { label: "Approved", variant: "success" },
    disapproved: { label: "Disapproved", variant: "destructive" },
    sent: { label: "Sent to Client", variant: "default" },
    accepted: { label: "Client Accepted", variant: "success" },
    rejected: { label: "Client Rejected", variant: "destructive" },
  };

  const config = statusConfig[status] || { label: status, variant: "secondary" };

  return (
    <Badge
      variant={config.variant}
      className={
        config.variant === "success"
          ? "bg-green-600 hover:bg-green-700 text-white"
          : ""
      }
    >
      {config.label}
    </Badge>
  );
};

export const createColumns = ({ users = [], onReview, onDelete }) => [
  {
    accessorKey: "inquiryName",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Client Name
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
      const proposal = row.original;
      return (
        <button
          onClick={() => onReview(proposal)}
          className="font-bold underline hover:text-primary cursor-pointer text-left"
        >
          {proposal.inquiryName || "N/A"}
        </button>
      );
    },
  },
  {
    accessorKey: "inquiryEmail",
    header: "Email",
    cell: ({ row }) => row.original.inquiryEmail || "-",
  },
  {
    accessorKey: "inquiryCompany",
    header: "Company",
    cell: ({ row }) => row.original.inquiryCompany || "-",
  },
  {
    accessorKey: "requestedByName",
    header: "Requested By",
    cell: ({ row }) => {
      const requestedBy = row.original.requestedBy;
      if (!requestedBy) return "-";

      const user = users.find(u => u.id === requestedBy);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return getStatusBadge(row.original.status);
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
              Created
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
      const proposal = row.original;

      return (
        <div className="flex items-center gap-2">
          {/* Review Button - only show for pending proposals */}
          {proposal.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReview(proposal)}
              className="h-8 px-3 text-blue-600 hover:text-blue-700 hover:bg-blue-50 font-medium"
            >
              <FileSearch className="h-4 w-4 mr-1" />
              Review
            </Button>
          )}

          {/* Dropdown Menu (Three Dots) */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* View option for non-pending proposals */}
              {proposal.status !== "pending" && (
                <>
                  <DropdownMenuItem onClick={() => onReview(proposal)} className="cursor-pointer">
                    <span className="flex-1">View Detail</span>
                    <Eye className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Delete option */}
              {onDelete && (
                <DropdownMenuItem
                  onClick={() => onDelete(proposal)}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <span className="flex-1">Delete Proposal</span>
                  <XCircle className="h-4 w-4" />
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
