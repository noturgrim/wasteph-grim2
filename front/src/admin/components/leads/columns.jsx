import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Eye, Pencil, Trash2, UserPlus, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

export const createColumns = ({ onView, onEdit, onClaim, onDelete, isMasterSales }) => [
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
      const lead = row.original;
      return (
        <button
          onClick={() => onView(lead)}
          className="font-bold underline hover:text-primary cursor-pointer text-left"
        >
          {lead.clientName}
        </button>
      );
    },
  },
  {
    accessorKey: "company",
    header: "Company",
    cell: ({ row }) => row.original.company || "-",
  },
  {
    accessorKey: "email",
    header: "Email",
    cell: ({ row }) => row.original.email || "-",
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => row.original.phone || "-",
  },
  {
    accessorKey: "location",
    header: "Location",
    cell: ({ row }) => row.original.location || "-",
  },
  {
    accessorKey: "isClaimed",
    header: "Status",
    cell: ({ row }) => {
      const isClaimed = row.original.isClaimed;
      return isClaimed ? (
        <Badge variant="secondary" className="bg-gray-100 text-gray-700">
          Claimed
        </Badge>
      ) : (
        <Badge variant="default" className="bg-green-100 text-green-700">
          Available
        </Badge>
      );
    },
  },
  {
    accessorKey: "claimedByUser",
    header: "Claimed By",
    cell: ({ row }) => {
      const claimedByUser = row.original.claimedByUser;
      if (!row.original.isClaimed || !claimedByUser) return "-";
      return `${claimedByUser.firstName} ${claimedByUser.lastName}`;
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
              Time in Pool
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
      const createdAt = new Date(row.original.createdAt);
      return (
        <div className="flex flex-col">
          <span className="text-sm">{format(createdAt, "MMM dd, yyyy")}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(createdAt, { addSuffix: true })}
          </span>
        </div>
      );
    },
  },
  {
    id: "actions",
    cell: ({ row }) => {
      const lead = row.original;
      const isUnclaimed = !lead.isClaimed;

      return (
        <div className="flex items-center gap-2">
          {isUnclaimed && !isMasterSales && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onClaim(lead)}
              className="h-8 px-2 text-green-600 hover:text-green-700 hover:bg-green-50"
            >
              <UserPlus className="h-4 w-4 mr-1" />
              Claim
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
              <DropdownMenuItem onClick={() => onView(lead)} className="cursor-pointer">
                <span className="flex-1">View Detail</span>
                <Eye className="h-4 w-4" />
              </DropdownMenuItem>

              {isMasterSales && (
                <>
                  <DropdownMenuItem onClick={() => onEdit(lead)} className="cursor-pointer">
                    <span className="flex-1">Edit</span>
                    <Pencil className="h-4 w-4" />
                  </DropdownMenuItem>

                  <DropdownMenuSeparator />

                  <DropdownMenuItem
                    onClick={() => onDelete(lead)}
                    className="text-destructive cursor-pointer"
                  >
                    <span className="flex-1">Delete</span>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </DropdownMenuItem>
                </>
              )}

              {isUnclaimed && !isMasterSales && (
                <>
                  <DropdownMenuItem onClick={() => onClaim(lead)} className="cursor-pointer">
                    <span className="flex-1">Claim Lead</span>
                    <UserPlus className="h-4 w-4" />
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
