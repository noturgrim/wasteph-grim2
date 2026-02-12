import { useState, useEffect } from "react";
import { api } from "@admin/services/api";
import { toast } from "sonner";
import SMTPSettingsForm from "@admin/components/settings/SMTPSettingsForm";
import { Loader2 } from "lucide-react";

export default function Settings() {
  const [smtpSettings, setSmtpSettings] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    fetchSMTPSettings();
  }, []);

  const fetchSMTPSettings = async () => {
    try {
      setIsLoading(true);
      const response = await api.getSMTPSettings();
      setSmtpSettings(response.data);
    } catch (error) {
      console.error("Failed to fetch SMTP settings:", error);
      toast.error("Failed to load SMTP settings");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSMTPSettings = async (formData) => {
    try {
      setIsSaving(true);
      await api.updateSMTPSettings(formData);
      toast.success("SMTP settings saved successfully");
      await fetchSMTPSettings();
      return true;
    } catch (error) {
      console.error("Failed to save SMTP settings:", error);
      toast.error(error.message || "Failed to save SMTP settings");
      return false;
    } finally {
      setIsSaving(false);
    }
  };

  const handleTestSMTPConnection = async (formData) => {
    try {
      setIsTesting(true);
      const response = await api.testSMTPConnection(formData);
      if (response.success) {
        return {
          success: true,
          message: "SMTP connection successful! Email server is configured correctly.",
        };
      } else {
        return {
          success: false,
          message: response.message || "Connection failed",
        };
      }
    } catch (error) {
      console.error("SMTP test failed:", error);
      return {
        success: false,
        message: error.message || "Failed to test connection",
      };
    } finally {
      setIsTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">System Settings</h1>
        <p className="text-muted-foreground">
          Configure application settings and integrations
        </p>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <SMTPSettingsForm
          settings={smtpSettings}
          onSave={handleSaveSMTPSettings}
          onTest={handleTestSMTPConnection}
          isSaving={isSaving}
          isTesting={isTesting}
        />
      )}
    </div>
  );
}
