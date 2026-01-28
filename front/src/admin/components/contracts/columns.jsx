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
  Upload,
  Send,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    pending_request: { label: "Pending Request", variant: "secondary" },
    requested: { label: "Requested", variant: "default" },
    ready_for_sales: { label: "Ready for Sales", variant: "success" },
    sent_to_sales: { label: "Sent to Sales", variant: "success" },
    sent_to_client: { label: "Sent to Client", variant: "success" },
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

export const createColumns = ({
  users = [],
  userRole,
  onRequestContract,
  onUploadContract,
  onSendToSales,
  onSendToClient,
  onViewContract,
  onViewDetails,
}) => [
  {
    accessorKey: "clientName",
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
      const contract = row.original;
      const clientName = contract.inquiry?.name || "N/A";
      return (
        <div className="font-medium">
          {clientName}
        </div>
      );
    },
  },
  {
    accessorKey: "clientEmail",
    header: "Email",
    cell: ({ row }) => {
      const contract = row.original;
      return contract.inquiry?.email || "-";
    },
  },
  {
    accessorKey: "salesPerson",
    header: "Sales Person",
    cell: ({ row }) => {
      const contract = row.original;
      const requestedBy = contract.proposal?.requestedBy;
      const user = users.find((u) => u.id === requestedBy);
      return user ? `${user.firstName} ${user.lastName}` : "Unknown";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const contract = row.original;
      return getStatusBadge(contract.contract?.status);
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
      const contract = row.original;
      const date = contract.contract?.createdAt;
      return date ? format(new Date(date), "MMM dd, yyyy") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const contract = row.original;
      const status = contract.contract?.status;
      const hasPdf = !!contract.contract?.contractPdfUrl;

      return (
        <div className="flex items-center gap-2">
          {/* Sales: Request Contract button (pending_request) */}
          {userRole === "sales" && status === "pending_request" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onRequestContract(contract)}
            >
              <FileText className="mr-2 h-4 w-4" />
              Request Contract
            </Button>
          )}

          {/* Admin: Upload Contract button (requested) */}
          {userRole === "admin" && status === "requested" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onUploadContract(contract)}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Contract
            </Button>
          )}

          {/* Admin: Send to Sales button (ready_for_sales) */}
          {userRole === "admin" && status === "ready_for_sales" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSendToSales(contract)}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Sales
            </Button>
          )}

          {/* Sales: Send to Client button (sent_to_sales) */}
          {userRole === "sales" && status === "sent_to_sales" && (
            <Button
              variant="default"
              size="sm"
              onClick={() => onSendToClient(contract)}
            >
              <Send className="mr-2 h-4 w-4" />
              Send to Client
            </Button>
          )}

          {/* Dropdown menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* View Contract Details (if requested) */}
              {(status !== "pending_request") && (
                <>
                  <DropdownMenuItem onClick={() => onViewDetails(contract)}>
                    <FileText className="mr-2 h-4 w-4" />
                    View Request Details
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* View Contract PDF (if exists) */}
              {hasPdf && (
                <>
                  <DropdownMenuItem onClick={() => onViewContract(contract)}>
                    <Eye className="mr-2 h-4 w-4" />
                    View Contract PDF
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                </>
              )}

              {/* Admin: Re-upload if ready_for_sales or sent_to_sales */}
              {userRole === "admin" && (status === "ready_for_sales" || status === "sent_to_sales") && (
                <DropdownMenuItem onClick={() => onUploadContract(contract)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Re-upload Contract
                </DropdownMenuItem>
              )}

              {/* Sales: Request again if needed */}
              {userRole === "sales" && status === "pending_request" && (
                <DropdownMenuItem onClick={() => onRequestContract(contract)}>
                  <FileText className="mr-2 h-4 w-4" />
                  Request Contract
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      );
    },
  },
];
