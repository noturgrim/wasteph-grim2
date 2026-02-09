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
    pending_request: { label: "Pending Request", className: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700" },
    requested: { label: "Requested", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" },
    sent_to_sales: { label: "Sent to Sales", className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700" },
    sent_to_client: { label: "Sent to Client", className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700" },
    signed: { label: "Signed", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" },
    hardbound_received: { label: "Hardbound Received", className: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700" },
  };

  const config = statusConfig[status] || { label: status, className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const createColumns = ({
  users = [],
  userRole,
  onRequestContract,
  onSubmitContract,
  onSendToClient,
  onUploadHardbound,
  onViewContract,
  onViewDetails,
}) => [
  {
    accessorKey: "contractNumber",
    header: "Contract No.",
    cell: ({ row }) => {
      const contract = row.original;
      const num = contract.contract?.contractNumber;
      return num ? (
        <span className="font-mono text-sm">{num}</span>
      ) : (
        <span className="text-muted-foreground text-sm">—</span>
      );
    },
  },
  {
    accessorKey: "clientName",
    accessorFn: (row) => row.inquiry?.name || "",
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
    accessorKey: "source",
    header: "Source",
    cell: ({ row }) => {
      const contract = row.original;
      const hasTemplateId = contract.contract?.templateId;
      const hasCustomTemplate = contract.contract?.customTemplateUrl;

      if (hasCustomTemplate) {
        return (
          <Badge variant="outline" className="bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700">
            Custom Template
          </Badge>
        );
      } else if (hasTemplateId) {
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700">
            System Template
          </Badge>
        );
      } else {
        return (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600">
            Manual
          </Badge>
        );
      }
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
              variant="ghost"
              size="sm"
              onClick={() => onRequestContract(contract)}
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              Request Contract
            </Button>
          )}

          {/* Admin: Submit Contract button (requested) */}
          {(userRole === "admin" || userRole === "super_admin") && status === "requested" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSubmitContract(contract)}
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <FileText className="h-4 w-4 mr-1" />
              Submit Contract
            </Button>
          )}

          {/* Sales: Send to Client button (sent_to_sales) */}
          {userRole === "sales" && status === "sent_to_sales" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSendToClient(contract)}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <Send className="h-4 w-4 mr-1" />
              Send to Client
            </Button>
          )}

          {/* Admin: Upload Hardbound button (signed) */}
          {(userRole === "admin" || userRole === "super_admin") && status === "signed" && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUploadHardbound(contract)}
              className="h-8 px-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              <Upload className="h-4 w-4 mr-1" />
              Upload Hardbound
            </Button>
          )}

          {/* Dropdown menu — modal={false} so clicking another row's trigger works */}
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {/* View Contract Details (if requested) */}
              {status !== "pending_request" && (
                <DropdownMenuItem onClick={() => onViewDetails(contract)}>
                  <FileText className="mr-2 h-4 w-4" />
                  View Request Details
                </DropdownMenuItem>
              )}

              {/* View Contract PDF (if exists) */}
              {hasPdf && (
                <DropdownMenuItem onClick={() => onViewContract(contract)}>
                  <Eye className="mr-2 h-4 w-4" />
                  View Contract PDF
                </DropdownMenuItem>
              )}

              {/* Separator before action items (only if there are items above) */}
              {(status !== "pending_request" || hasPdf) &&
                (((userRole === "admin" || userRole === "super_admin") && status === "sent_to_sales") ||
                (userRole === "sales" && status === "pending_request")) ? (
                <DropdownMenuSeparator />
              ) : null}

              {/* Admin: Re-submit if sent_to_sales */}
              {(userRole === "admin" || userRole === "super_admin") && status === "sent_to_sales" && (
                <DropdownMenuItem onClick={() => onSubmitContract(contract)}>
                  <Upload className="mr-2 h-4 w-4" />
                  Re-submit Contract
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
