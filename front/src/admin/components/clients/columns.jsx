import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getStatusBadge = (status) => {
  const statusConfig = {
    active: { label: "Active", className: "bg-green-600 hover:bg-green-700 text-white" },
    inactive: { label: "Inactive", className: "bg-gray-200 hover:bg-gray-300 text-gray-700" },
    suspended: { label: "Suspended", className: "bg-red-100 hover:bg-red-200 text-red-700" },
  };

  const config = statusConfig[status] || { label: status, className: "" };

  return (
    <Badge variant="default" className={config.className}>
      {config.label}
    </Badge>
  );
};

export const createClientColumns = ({ onView, onEdit, onDelete }) => [
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
      <a href={`mailto:${row.original.email}`} className="text-blue-600 hover:underline text-sm">
        {row.original.email}
      </a>
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
    cell: ({ row }) => row.original.industry || "-",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => getStatusBadge(row.original.status),
  },
  {
    accessorKey: "contractStatus",
    header: "Contract",
    cell: ({ row }) => {
      const cs = row.original.contractStatus;
      if (cs === "hardbound_received") {
        return (
          <div className="flex flex-col gap-1">
            <Badge className="bg-green-600 text-white text-xs">Signed</Badge>
            <Badge className="bg-emerald-700 text-white text-xs">Hardbound Received</Badge>
          </div>
        );
      }
      if (cs === "signed") {
        return <Badge className="bg-green-600 text-white text-xs">Signed</Badge>;
      }
      return <span className="text-muted-foreground text-sm">—</span>;
    },
  },
  {
    accessorKey: "contractDates",
    header: "Contract Period",
    cell: ({ row }) => {
      const { contractStartDate, contractEndDate } = row.original;
      const start = contractStartDate ? format(new Date(contractStartDate), "MMM dd, yyyy") : null;
      const end = contractEndDate ? format(new Date(contractEndDate), "MMM dd, yyyy") : null;
      if (start && end) return `${start} – ${end}`;
      if (start) return `From ${start}`;
      return "-";
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
      return (
        <DropdownMenu>
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
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
