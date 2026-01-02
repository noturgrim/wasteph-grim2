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
  Download,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Pencil
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    pending: { label: "Pending Review", variant: "secondary" },
    approved: { label: "Approved", variant: "default" },
    rejected: { label: "Rejected", variant: "destructive" },
    sent: { label: "Sent to Client", variant: "success" },
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

export const createColumns = ({ users = [], onView, onApprove, onReject, onEdit, onDownload }) => [
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
          onClick={() => onView(proposal)}
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
    accessorKey: "totalAmount",
    header: "Total Amount",
    cell: ({ row }) => {
      const proposal = row.original;
      try {
        const data = typeof proposal.proposalData === 'string'
          ? JSON.parse(proposal.proposalData)
          : proposal.proposalData;

        const total = data?.pricing?.total || 0;
        return `₱${parseFloat(total).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
      } catch (error) {
        return "-";
      }
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
          {/* Approve Button - shown for pending proposals */}
          {proposal.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onApprove(proposal)}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <CheckCircle2 className="h-4 w-4 mr-1" />
              Approve
            </Button>
          )}

          {/* Reject Button - shown for pending proposals */}
          {proposal.status === "pending" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onReject(proposal)}
              className="h-8 px-2 text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <XCircle className="h-4 w-4 mr-1" />
              Reject
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
              <DropdownMenuItem onClick={() => onView(proposal)} className="cursor-pointer">
                <span className="flex-1">View Detail</span>
                <Eye className="h-4 w-4" />
              </DropdownMenuItem>

              {proposal.status === "pending" && (
                <DropdownMenuItem onClick={() => onEdit(proposal)} className="cursor-pointer">
                  <span className="flex-1">Edit Proposal</span>
                  <Pencil className="h-4 w-4" />
                </DropdownMenuItem>
              )}

              {proposal.pdfUrl && (
                <DropdownMenuItem onClick={() => onDownload(proposal)} className="cursor-pointer">
                  <span className="flex-1">Download PDF</span>
                  <Download className="h-4 w-4" />
                </DropdownMenuItem>
              )}

              <DropdownMenuSeparator />

              {proposal.status === "pending" && (
                <>
                  <DropdownMenuItem onClick={() => onApprove(proposal)} className="cursor-pointer">
                    <span className="flex-1">Approve</span>
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  </DropdownMenuItem>

                  <DropdownMenuItem onClick={() => onReject(proposal)} className="cursor-pointer text-destructive">
                    <span className="flex-1">Reject</span>
                    <XCircle className="h-4 w-4 text-destructive" />
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
