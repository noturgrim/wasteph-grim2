import { useState, useEffect } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";
import { PDFViewer } from "../PDFViewer";

// Sample contract data for preview
const SAMPLE_CONTRACT_DATA = {
  contractNumber: "CONT-20260131-0001",
  contractDate: "January 31, 2026",
  clientName: "Juan Dela Cruz",
  companyName: "Sample Company Inc.",
  clientEmail: "juan.delacruz@sample.com",
  clientAddress: "123 Sample Street, Manila, Philippines",
  contractType: "Long Term Variable Rate",
  contractDuration: "12 months",
  serviceLatitude: "14.5995",
  serviceLongitude: "120.9842",
  collectionSchedule: "Weekly",
  collectionScheduleOther: "",
  wasteAllowance: "500 kg/month",
  ratePerKg: "PHP 3.50/kg",
  specialClauses: "Regular waste collection every Monday and Thursday. Additional charges apply for hazardous materials.",
  clientRequests: "Provide separate bins for recyclable materials",
  signatories: [
    { name: "Maria Santos", position: "Company Representative" },
    { name: "Jose Reyes", position: "Service Provider" },
  ],
};

export function ContractTemplatePreviewDialog({ open, onOpenChange, template }) {
  const [pdfBase64, setPdfBase64] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && template) {
      generatePreview();
    }
  }, [open, template]);

  const generatePreview = async () => {
    if (!template) return;

    try {
      setLoading(true);
      setPdfBase64(null);

      const response = await api.previewContractTemplate(
        template.htmlTemplate,
        SAMPLE_CONTRACT_DATA
      );

      if (response.success) {
        setPdfBase64(response.data);
      }
    } catch (error) {
      toast.error(error.message || "Failed to generate preview");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>
            Preview: {template?.name || "Contract Template"}
          </DialogTitle>
          <DialogDescription>
            Preview with sample data
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <span className="ml-3">Generating preview...</span>
            </div>
          ) : pdfBase64 ? (
            <PDFViewer pdfBase64={pdfBase64} />
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No preview available
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
