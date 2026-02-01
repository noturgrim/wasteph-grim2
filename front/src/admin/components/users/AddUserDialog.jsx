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

export function AddUserDialog({ open, onOpenChange, onConfirm }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "sales",
    isMasterSales: false,
  });
  const [passwordErrors, setPasswordErrors] = useState([]);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    if (open) {
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "sales",
        isMasterSales: false,
      });
      setPasswordErrors([]);
      setTouched(false);
    }
  }, [open]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (field === "password") {
      setTouched(true);
      const errors = passwordRules.filter((r) => !r.test(value)).map((r) => r.label);
      setPasswordErrors(errors);
    }
  };

  const isPasswordValid = formData.password && passwordErrors.length === 0;
  const passwordsMatch = formData.password === formData.confirmPassword;
  const isFormValid =
    formData.firstName && formData.lastName && formData.email && isPasswordValid && passwordsMatch;

  const handleSubmit = async () => {
    if (!isFormValid) return;

    setIsSubmitting(true);
    try {
      const payload = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        isMasterSales: formData.role === "sales" ? formData.isMasterSales : false,
      };
      await onConfirm(payload);
      // Reset form on success
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        role: "sales",
        isMasterSales: false,
      });
      setPasswordErrors([]);
      setTouched(false);
      onOpenChange(false);
    } catch (error) {
      console.error("Create failed:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New User</DialogTitle>
          <DialogDescription>
            Create a new staff member account
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
                placeholder="John"
              />
            </div>
            <div className="space-y-1">
              <Label>Last Name</Label>
              <Input
                value={formData.lastName}
                onChange={(e) => handleChange("lastName", e.target.value)}
                placeholder="Doe"
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
              placeholder="john@wasteph.com"
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label>Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={formData.password}
              onChange={(e) => handleChange("password", e.target.value)}
              placeholder="Create a strong password..."
            />
            {touched && passwordErrors.length > 0 && (
              <ul className="text-xs text-red-600 space-y-0.5 mt-1">
                {passwordErrors.map((err) => (
                  <li key={err}>— {err}</li>
                ))}
              </ul>
            )}
            {touched && passwordErrors.length === 0 && formData.password && (
              <p className="text-xs text-green-600 mt-1">Password meets all requirements</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1">
            <Label>Confirm Password</Label>
            <Input
              type="password"
              autoComplete="new-password"
              value={formData.confirmPassword}
              onChange={(e) => handleChange("confirmPassword", e.target.value)}
              placeholder="Re-enter your password..."
            />
            {formData.confirmPassword && !passwordsMatch && (
              <p className="text-xs text-red-600 mt-1">Passwords do not match</p>
            )}
          </div>

          {/* Role */}
          <div className="space-y-1">
            <Label>Role</Label>
            <Select
              value={formData.role}
              onValueChange={(value) => handleChange("role", value)}
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
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={isSubmitting || !isFormValid}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create User"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
