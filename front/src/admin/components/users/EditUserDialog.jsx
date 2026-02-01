import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2 } from "lucide-react";

const passwordRules = [
  { test: (p) => p.length >= 8, label: "At least 8 characters" },
  { test: (p) => /[A-Z]/.test(p), label: "One uppercase letter" },
  { test: (p) => /[a-z]/.test(p), label: "One lowercase letter" },
  { test: (p) => /\d/.test(p), label: "One number" },
  { test: (p) => /[!@#$%^&*(),.?":{}|<>]/.test(p), label: "One special character" },
];

export function EditUserDialog({ open, onOpenChange, user, currentUserId, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({});
  const [passwordErrors, setPasswordErrors] = useState([]);

  useEffect(() => {
    if (user) {
      setFormData({
        firstName: user.firstName || "",
        lastName: user.lastName || "",
        email: user.email || "",
        role: user.role || "sales",
        isMasterSales: user.isMasterSales || false,
        isActive: user.isActive !== undefined ? user.isActive : true,
        password: "",
        confirmPassword: "",
      });
      setPasswordErrors([]);
    }
  }, [user, open]);

  if (!user) return null;

  const isSelf = user.id === currentUserId;

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      if (value) {
        const errors = passwordRules.filter((r) => !r.test(value)).map((r) => r.label);
        setPasswordErrors(errors);
      } else {
        setPasswordErrors([]);
      }
    }
  };

  const passwordsMatch = !formData.password || formData.password === formData.confirmPassword;

  const handleSubmit = async () => {
    if (formData.password && (passwordErrors.length > 0 || !passwordsMatch)) return;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        isMasterSales: formData.role === "sales" ? formData.isMasterSales : false,
        isActive: formData.isActive,
      };
      if (formData.password) {
        payload.password = formData.password;
      }
      await onConfirm(payload);
      onOpenChange(false);
    } catch (error) {
      console.error("Update failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit User</DialogTitle>
          <DialogDescription>
            Update details for {user.firstName} {user.lastName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Name */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <Label>First Name</Label>
              <Input
                value={formData.firstName}
                onChange={(e) => handleChange("firstName", e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
              />
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <Label>Email</Label>
            <Input
              type="email"
              autoComplete="off"
              value={formData.email}
              onChange={(e) => handleChange("email", e.target.value)}
            />
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value)}
              disabled={isSelf}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="super_admin">Super Admin</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="sales">Sales</SelectItem>
                <SelectItem value="social_media">Social Media</SelectItem>
              </SelectContent>
            </Select>
            {isSelf && (
              <p className="text-xs text-muted-foreground">You cannot change your own role</p>
            )}
          </div>

          {/* Master Sales — only for sales role */}
          {formData.role === "sales" && (
            <div className="flex items-center justify-between">
              <div>
                <Label>Master Sales</Label>
                <p className="text-xs text-muted-foreground">Can add leads to the pool</p>
              </div>
              <Checkbox
                checked={formData.isMasterSales}
                onCheckedChange={(checked) => handleChange("isMasterSales", checked)}
              />
            </div>
          )}

          {/* Active status */}
          <div className="flex items-center justify-between">
            <div>
              <Label>Active</Label>
              <p className="text-xs text-muted-foreground">Inactive users cannot log in</p>
            </div>
            <Checkbox
              checked={formData.isActive}
              onCheckedChange={(checked) => handleChange("isActive", checked)}
              disabled={isSelf}
            />
          </div>
          {isSelf && (
            <p className="text-xs text-muted-foreground -mt-3">
              You cannot deactivate your own account
            </p>
          )}

          {/* Password reset */}
          <div className="space-y-1">
            <Label>New Password <span className="text-muted-foreground font-normal">(optional — leave blank to keep current)</span></Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Enter new password..."
            />
            {formData.password && passwordErrors.length > 0 && (
              <ul className="text-xs text-red-600 space-y-0.5 mt-1">
                {passwordErrors.map((err) => (
                  <li key={err}>— {err}</li>
                ))}
              </ul>
            )}
          </div>

          {/* Confirm Password — only shown when changing password */}
          {formData.password && (
            <div className="space-y-1">
              <Label>Confirm Password</Label>
              <Input
                type="password"
                autoComplete="new-password"
                value={formData.confirmPassword}
                onChange={(e) => handleChange("confirmPassword", e.target.value)}
                placeholder="Re-enter new password..."
              />
              {formData.confirmPassword && !passwordsMatch && (
                <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || (formData.password && (passwordErrors.length > 0 || !passwordsMatch))}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
