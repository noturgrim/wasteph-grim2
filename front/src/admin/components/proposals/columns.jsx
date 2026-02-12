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
  FileSearch,
  FileText,
  Send
} from "lucide-react";
import { format } from "date-fns";
import { StatusBadge } from "../StatusBadge";

export const createColumns = ({ users = [], onReview, onDelete, onRevise, onSendToClient, userRole }) => [
  {
    accessorKey: "proposalNumber",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Proposal #
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
          className="font-mono text-sm italic font-normal text-black dark:text-white hover:underline cursor-pointer"
        >
          {proposal.proposalNumber || "-"}
        </button>
      );
    },
  },
  {
    accessorKey: "inquiryNumber",
    header: "Inquiry #",
    cell: ({ row }) => (
      <span className="font-mono text-sm italic font-normal text-black dark:text-white">
        {row.original.inquiryNumber || "-"}
      </span>
    ),
  },
  {
    accessorKey: "inquiryName",
    header: "Client",
    cell: ({ row }) => {
      const proposal = row.original;
      return (
        <div className="flex flex-col gap-0.5">
          <span className="font-semibold">{proposal.inquiryName || "-"}</span>
          <span className="text-sm text-muted-foreground">{proposal.inquiryEmail || "-"}</span>
        </div>
      );
    },
  },
  {
    accessorKey: "inquiryCompany",
    header: "Company",
    cell: ({ row }) => row.original.inquiryCompany || "-",
  },
  ...(userRole !== "sales" ? [{
    accessorKey: "requestedByName",
    header: "Requested By",
    cell: ({ row }) => {
      const requestedBy = row.original.requestedBy;
      if (!requestedBy) return "-";

      const user = users.find(u => u.id === requestedBy);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown User";
    },
  }] : []),
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      return <StatusBadge status={row.original.status} />;
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
        <div className="flex items-center justify-end gap-2">
          {/* Review Button - admin/super_admin only, pending proposals */}
          {userRole !== "sales" && proposal.status === "pending" && (
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

          {/* Revise — sales only, disapproved proposals */}
          {userRole === "sales" && proposal.status === "disapproved" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onRevise(proposal)}
              className="h-8 px-2 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              Revise
            </Button>
          )}

          {/* Send to Client — sales only, approved proposals */}
          {userRole === "sales" && proposal.status === "approved" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendToClient(proposal)}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Send className="h-4 w-4 mr-1" />
              Send to Client
            </Button>
          )}

          {/* Dropdown Menu (Three Dots) */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {/* View Proposal — for sales with pending proposals (requested approval) */}
              {userRole === "sales" && proposal.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => onReview(proposal)} className="cursor-pointer">
                    <span className="flex-1">View Proposal</span>
                    <Eye className="h-4 w-4" />
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* View Detail — for other statuses or admin users */}
              {!(userRole === "sales" && proposal.status === "pending") && (
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
