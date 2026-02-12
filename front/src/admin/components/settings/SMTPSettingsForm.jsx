import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, XCircle, Eye, EyeOff } from "lucide-react";

export default function SMTPSettingsForm({
  settings,
  onSave,
  onTest,
  isSaving,
  isTesting,
}) {
  const [formData, setFormData] = useState({
    host: settings?.host || "",
    port: settings?.port || "587",
    secure: settings?.secure === "true" || settings?.secure === true || false,
    user: settings?.user || "",
    password: settings?.password || "",
    from_name: settings?.from_name || "WastePH",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [testResult, setTestResult] = useState(null);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setTestResult(null); // Clear test result when form changes
  };

  const handleTest = async () => {
    setTestResult(null);
    const result = await onTest(formData);
    setTestResult(result);
  };

  const handleSave = async () => {
    const success = await onSave(formData);
    if (success) {
      setTestResult(null);
    }
  };

  const isFormValid =
    formData.host && formData.port && formData.user && formData.password;

  return (
    <Card>
      <CardHeader>
        <CardTitle>SMTP Configuration</CardTitle>
        <CardDescription>
          Configure email server settings for sending notifications and documents
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          {/* SMTP Host */}
          <div className="space-y-2">
            <Label htmlFor="smtp-host">SMTP Host *</Label>
            <Input
              id="smtp-host"
              placeholder="smtp.gmail.com"
              value={formData.host}
              onChange={(e) => handleChange("host", e.target.value)}
            />
          </div>

          {/* SMTP Port */}
          <div className="space-y-2">
            <Label htmlFor="smtp-port">SMTP Port *</Label>
            <Input
              id="smtp-port"
              type="number"
              placeholder="587"
              value={formData.port}
              onChange={(e) => handleChange("port", e.target.value)}
            />
          </div>

          {/* SMTP User */}
          <div className="space-y-2">
            <Label htmlFor="smtp-user">SMTP Username *</Label>
            <Input
              id="smtp-user"
              type="email"
              placeholder="your-email@domain.com"
              value={formData.user}
              onChange={(e) => handleChange("user", e.target.value)}
            />
          </div>

          {/* SMTP Password */}
          <div className="space-y-2">
            <Label htmlFor="smtp-password">SMTP Password *</Label>
            <div className="relative">
              <Input
                id="smtp-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter password"
                value={formData.password}
                onChange={(e) => handleChange("password", e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>

          {/* From Name */}
          <div className="space-y-2">
            <Label htmlFor="smtp-from-name">Sender Name</Label>
            <Input
              id="smtp-from-name"
              placeholder="WastePH"
              value={formData.from_name}
              onChange={(e) => handleChange("from_name", e.target.value)}
            />
          </div>

          {/* SMTP Secure */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="smtp-secure"
              checked={formData.secure}
              onCheckedChange={(checked) => handleChange("secure", checked)}
            />
            <Label htmlFor="smtp-secure" className="cursor-pointer">
              Use SSL/TLS (Port 465)
            </Label>
          </div>
        </div>

        {/* Test Result */}
        {testResult && (
          <Alert
            variant={testResult.success ? "default" : "destructive"}
            className={
              testResult.success
                ? "border-green-200 bg-green-50 text-green-900"
                : ""
            }
          >
            {testResult.success ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <XCircle className="h-4 w-4" />
            )}
            <AlertDescription>{testResult.message}</AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            onClick={handleTest}
            disabled={!isFormValid || isTesting || isSaving}
            variant="outline"
          >
            {isTesting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Testing...
              </>
            ) : (
              "Test Connection"
            )}
          </Button>

          <Button
            onClick={handleSave}
            disabled={!isFormValid || isSaving || isTesting}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Settings"
            )}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          * Required fields. Changes take effect immediately after saving.
        </p>
      </CardContent>
    </Card>
  );
}
