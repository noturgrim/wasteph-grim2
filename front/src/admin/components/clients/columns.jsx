import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown, ChevronDown, CalendarDays } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    active: { label: "Active", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" },
    inactive: { label: "Inactive", className: "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600" },
    suspended: { label: "Suspended", className: "bg-red-100 text-red-700 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700" },
  };

  const config = statusConfig[status] || { label: status, className: "" };

  return (
    <Badge variant="outline" className={config.className}>
      {config.label}
    </Badge>
  );
};

const CONTRACT_STATUS_CONFIG = {
  hardbound_received: { label: "Hardbound", className: "bg-indigo-100 text-indigo-700 border-indigo-300 dark:bg-indigo-900 dark:text-indigo-300 dark:border-indigo-700" },
  signed: { label: "Signed", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" },
  sent_to_client: { label: "Sent to Client", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" },
  sent_to_sales: { label: "Sent to Sales", className: "bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-900 dark:text-cyan-300 dark:border-cyan-700" },
  requested: { label: "Requested", className: "bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-900 dark:text-yellow-300 dark:border-yellow-700" },
  pending_request: { label: "Pending", className: "bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600" },
};

const getContractStatusBadge = (status) => {
  const config = CONTRACT_STATUS_CONFIG[status] || { label: status, className: "" };
  return (
    <Badge variant="outline" className={`${config.className} text-xs`}>
      {config.label}
    </Badge>
  );
};

const formatPeriod = (startDate, endDate) => {
  const start = startDate ? format(new Date(startDate), "MMM dd, yyyy") : null;
  const end = endDate ? format(new Date(endDate), "MMM dd, yyyy") : null;
  if (start && end) return `${start} – ${end}`;
  if (start) return `From ${start}`;
  return null;
};

export const createClientColumns = ({ userRole, onView, onEdit, onDelete, onAutoSchedule }) => [
  {
    accessorKey: "companyName",
    header: ({ column }) => {
      const isSorted = column.getIsSorted();
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm">
              Company
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
    cell: ({ row }) => (
      <div className="font-medium">{row.original.companyName}</div>
    ),
  },
  {
    accessorKey: "contactPerson",
    header: "Contact",
    cell: ({ row }) => row.original.contactPerson || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.email || "-"}</span>
    ),
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    accessorKey: "industry",
    header: "Industry",
    cell: ({ row }) => {
      const industryMap = {
        food_and_beverage: "Food & Beverage",
        retail: "Retail",
        manufacturing: "Manufacturing",
        healthcare: "Healthcare",
        hospitality: "Hospitality",
        education: "Education",
        construction: "Construction",
        real_estate: "Real Estate",
        logistics: "Logistics",
        agriculture: "Agriculture",
        technology: "Technology",
        government: "Government",
        residential: "Residential",
        other: "Other",
      };
      const val = row.original.industry;
      return val ? (industryMap[val] || val) : "-";
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "contracts",
    header: "Contract",
    cell: ({ row }) => {
      const contracts = row.original.contracts || [];
      if (contracts.length === 0) {
        return <Badge variant="outline" className="bg-gray-100 text-gray-500 border-gray-300 dark:bg-gray-800 dark:text-gray-400 dark:border-gray-600 text-xs">N/A</Badge>;
      }
      const latest = contracts[0];
      if (contracts.length === 1) return getContractStatusBadge(latest.status);

      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-1 cursor-pointer"
              aria-label={`View ${contracts.length} contracts`}
            >
              {getContractStatusBadge(latest.status)}
              <span className="text-xs text-muted-foreground">+{contracts.length - 1}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-1.5" align="start">
            <p className="text-xs font-medium text-muted-foreground px-1 pb-1">
              {contracts.length} Contracts
            </p>
            {contracts.map((c) => (
              <div key={c.contractNumber} className="flex items-center justify-between gap-3 px-1">
                <span className="text-xs font-mono text-muted-foreground">{c.contractNumber}</span>
                {getContractStatusBadge(c.status)}
              </div>
            ))}
          </PopoverContent>
        </Popover>
      );
    },
  },
  {
    accessorKey: "contractDates",
    header: "Contract Period",
    cell: ({ row }) => {
      const contracts = row.original.contracts || [];
      if (contracts.length === 0) {
        return <span className="text-muted-foreground text-xs">N/A</span>;
      }
      const latest = contracts[0];
      const latestPeriod = formatPeriod(latest.contractStartDate, latest.contractEndDate);
      if (!latestPeriod) return <span className="text-muted-foreground text-xs">N/A</span>;

      if (contracts.length === 1) {
        return <span className="text-sm">{latestPeriod}</span>;
      }

      return (
        <Popover>
          <PopoverTrigger asChild>
            <button
              className="inline-flex items-center gap-1 cursor-pointer text-sm"
              aria-label={`View ${contracts.length} contract periods`}
            >
              {latestPeriod}
              <span className="text-xs text-muted-foreground">+{contracts.length - 1}</span>
              <ChevronDown className="h-3 w-3 text-muted-foreground" />
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-2 space-y-1.5" align="start">
            <p className="text-xs font-medium text-muted-foreground px-1 pb-1">
              {contracts.length} Contracts
            </p>
            {contracts.map((c) => (
              <div key={c.contractNumber} className="flex items-center justify-between gap-3 px-1">
                <span className="text-xs font-mono text-muted-foreground">{c.contractNumber}</span>
                <span className="text-xs">
                  {formatPeriod(c.contractStartDate, c.contractEndDate) || "N/A"}
                </span>
              </div>
            ))}
          </PopoverContent>
        </Popover>
      );
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
      const date = row.original.createdAt;
      return date ? format(new Date(date), "MMM dd, yyyy") : "-";
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const client = row.original;
      const hasSignedContract = (client.contracts || []).some(
        (c) =>
          (c.status === "signed" || c.status === "hardbound_received") &&
          c.contractStartDate &&
          c.contractEndDate,
      );
      return (
        <div className="flex items-center justify-end gap-2">
          <DropdownMenu modal={false}>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-8 w-8 p-0">
                <span className="sr-only">Open menu</span>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onView(client)}>
              <Eye className="mr-2 h-4 w-4" />
              View Details
            </DropdownMenuItem>
            {hasSignedContract && (
              <DropdownMenuItem onClick={() => onAutoSchedule(client)}>
                <CalendarDays className="mr-2 h-4 w-4" />
                Auto Schedule
              </DropdownMenuItem>
            )}
            {(userRole === "admin" || userRole === "super_admin") && (
              <>
                <DropdownMenuItem onClick={() => onEdit(client)}>
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => onDelete(client)}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
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
