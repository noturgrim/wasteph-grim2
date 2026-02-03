import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { UserCircle } from "lucide-react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

const getRoleBadge = (role) => {
  const roleConfig = {
    super_admin: { label: "Super Admin", className: "bg-purple-100 text-purple-700 border-purple-300 dark:bg-purple-900 dark:text-purple-300 dark:border-purple-700" },
    admin: { label: "Admin", className: "bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-900 dark:text-blue-300 dark:border-blue-700" },
    sales: { label: "Sales", className: "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" },
    social_media: { label: "Social Media", className: "bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900 dark:text-orange-300 dark:border-orange-700" },
  };
  const config = roleConfig[role] || { label: role, className: "" };
  return <Badge variant="outline" className={config.className}>{config.label}</Badge>;
};

export function ViewUserDialog({ open, onOpenChange, user }) {
  if (!user) return null;

  const formatDate = (date) => (date ? format(new Date(date), "MMM dd, yyyy") : "-");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserCircle className="h-5 w-5 text-blue-600" />
            User Details
          </DialogTitle>
          <DialogDescription>
            Full details for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5">
          {/* Header card */}
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Name</p>
                <p className="text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </p>
              </div>
              <div className="flex gap-2 items-center">
                {getRoleBadge(user.role)}
                <Badge variant="outline" className={user.isActive ? "bg-green-100 text-green-700 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700" : "bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600"}>
                  {user.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Contact
            </h4>
            <div>
              <p className="text-sm text-muted-foreground">Email</p>
              <a href={`mailto:${user.email}`} className="text-blue-600 hover:underline text-sm">
                {user.email}
              </a>
            </div>
          </div>

          {/* Account Details */}
          <div>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-2">
              Account Details
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-sm text-muted-foreground">Role</p>
                <p className="text-sm font-medium capitalize">{user.role.replace("_", " ")}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Master Sales</p>
                <p className="text-sm">
                  {user.role === "sales" ? (user.isMasterSales ? "Yes" : "No") : "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-sm">{user.isActive ? "Active" : "Inactive"}</p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="border-t pt-3">
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>Created: {formatDate(user.createdAt)}</span>
              <span>Updated: {formatDate(user.updatedAt)}</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
