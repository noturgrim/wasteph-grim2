import { useState, useEffect, useCallback } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Eye, Send, Loader2 } from "lucide-react";
import { PDFViewer } from "../PDFViewer";
import { api } from "../../services/api";
import { toast } from "../../utils/toast";

export function ReviewGeneratedContractDialog({
  open,
  onOpenChange,
  contract,
  onSendToSales,
  onRefresh,
}) {
  const [activeTab, setActiveTab] = useState("details");
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState("");
  const [isLoadingPdf, setIsLoadingPdf] = useState(false);
  const [showPdfViewer, setShowPdfViewer] = useState(false);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setActiveTab("details");
      setPdfPreviewUrl("");
      setIsLoadingPdf(false);
      setShowPdfViewer(false);
    }
  }, [open]);

  // Reset PDF when contract changes
  useEffect(() => {
    setPdfPreviewUrl("");
    setIsLoadingPdf(false);
  }, [contract?.id]);

  // Handle viewing PDF
  const handleViewPdf = useCallback(async () => {
    if (!contract?.contract) return;
    const contractData = contract.contract;

    setShowPdfViewer(true);

    if (!pdfPreviewUrl && !isLoadingPdf) {
      setIsLoadingPdf(true);

      try {
        const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

        // Fetch the generated PDF
        if (contractData.contractUrl) {
          const response = await fetch(
            `${API_BASE_URL}/contracts/${contractData.id}/pdf`,
            {
              method: "GET",
              credentials: "include",
            }
          );
          if (!response.ok) throw new Error("Failed to fetch PDF");
          const blob = await response.blob();
          const reader = new FileReader();
          reader.onloadend = () => {
            setPdfPreviewUrl(reader.result);
            setIsLoadingPdf(false);
          };
          reader.readAsDataURL(blob);
        }
      } catch (error) {
        console.error("Failed to load PDF:", error);
        toast.error("Failed to load contract PDF");
        setIsLoadingPdf(false);
      }
    }
  }, [contract, pdfPreviewUrl, isLoadingPdf]);

  // Automatically load PDF when switching to PDF tab
  useEffect(() => {
    if (activeTab === "pdf" && !pdfPreviewUrl && !isLoadingPdf && contract) {
      handleViewPdf();
    }
  }, [activeTab, pdfPreviewUrl, isLoadingPdf, contract, handleViewPdf]);

  if (!contract) return null;

  const contractData = contract.contract || {};

  // Parse contract data
  let parsedData = {};
  try {
    parsedData = typeof contractData.contractData === 'string'
      ? JSON.parse(contractData.contractData)
      : contractData.contractData || {};
  } catch (error) {
    console.error("Failed to parse contract data:", error);
  }

  // Parse signatories
  let signatories = [];
  try {
    signatories = typeof parsedData.signatories === 'string'
      ? JSON.parse(parsedData.signatories)
      : parsedData.signatories || [];
  } catch (error) {
    console.error("Failed to parse signatories:", error);
  }

  // Handle send to sales
  const handleSendToSales = async () => {
    try {
      if (onSendToSales) {
        await onSendToSales(contract);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Failed to send to sales:", error);
    }
  };

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending_request: { label: "Pending Request", variant: "secondary" },
      requested: { label: "Requested", variant: "default" },
      ready_for_sales: { label: "Ready for Sales", variant: "success" },
      sent_to_sales: { label: "Sent to Sales", variant: "success" },
      sent_to_client: { label: "Sent to Client", variant: "success" },
      signed: { label: "Signed", variant: "success" },
      hardbound_received: { label: "Hardbound Received", variant: "success" },
    };

    const config = statusConfig[status] || { label: status, variant: "secondary" };

    return (
      <Badge
        variant={config.variant}
        className={
          config.variant === "success"
            ? "bg-green-600 hover:bg-green-700 text-white"
            : ""
        }
      >
        {config.label}
      </Badge>
    );
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <div>
                <DialogTitle>Review Generated Contract</DialogTitle>
                <DialogDescription>
                  {contractData.clientName} - {contractData.companyName}
                </DialogDescription>
              </div>
              {getStatusBadge(contractData.status)}
            </div>
          </DialogHeader>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="details">Contract Details</TabsTrigger>
              <TabsTrigger value="pdf">
                View PDF
                {contractData.contractUrl && (
                  <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">
                    Generated
                  </Badge>
                )}
              </TabsTrigger>
            </TabsList>

            {/* Contract Details Tab */}
            <TabsContent value="details" className="flex-1 overflow-y-auto space-y-4 mt-4">
              {/* Client Information */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Client Information</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Client Name</p>
                    <p className="font-medium">{parsedData.clientName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Company Name</p>
                    <p className="font-medium">{parsedData.companyName || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Email</p>
                    <p className="font-medium">{parsedData.clientEmailContract || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Address</p>
                    <p className="font-medium">{parsedData.clientAddress || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Contract Details */}
              <div className="border rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3">Contract Details</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <p className="text-muted-foreground">Contract Type</p>
                    <p className="font-medium capitalize">{parsedData.contractType?.replace(/_/g, ' ') || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Duration</p>
                    <p className="font-medium">{parsedData.contractDuration || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Collection Schedule</p>
                    <p className="font-medium capitalize">
                      {parsedData.collectionSchedule?.replace(/_/g, ' ') || "N/A"}
                      {parsedData.collectionScheduleOther && ` - ${parsedData.collectionScheduleOther}`}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Waste Allowance</p>
                    <p className="font-medium">{parsedData.wasteAllowance || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Rate per Kg</p>
                    <p className="font-medium">{parsedData.ratePerKg || "N/A"}</p>
                  </div>
                </div>
              </div>

              {/* Service Location */}
              {(parsedData.serviceLatitude || parsedData.serviceLongitude) && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Service Location</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Latitude</p>
                      <p className="font-medium">{parsedData.serviceLatitude || "N/A"}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Longitude</p>
                      <p className="font-medium">{parsedData.serviceLongitude || "N/A"}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Special Clauses */}
              {parsedData.specialClauses && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Special Clauses</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{parsedData.specialClauses}</p>
                </div>
              )}

              {/* Client Requests */}
              {parsedData.clientRequests && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2">Client Requests</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{parsedData.clientRequests}</p>
                </div>
              )}

              {/* Signatories */}
              {signatories.length > 0 && (
                <div className="border rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3">Signatories</h3>
                  <div className="space-y-2">
                    {signatories.map((signatory, index) => (
                      <div key={index} className="flex justify-between items-center text-sm border-b pb-2 last:border-b-0">
                        <span className="font-medium">{signatory.name}</span>
                        <span className="text-muted-foreground">{signatory.position}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </TabsContent>

            {/* PDF Tab */}
            <TabsContent value="pdf" className="flex-1 overflow-hidden mt-4">
              <div className="h-full border rounded-lg overflow-hidden bg-gray-50">
                {isLoadingPdf ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="flex flex-col items-center gap-4">
                      <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                      <p className="text-sm font-medium text-gray-600">Loading contract PDF...</p>
                    </div>
                  </div>
                ) : pdfPreviewUrl ? (
                  <iframe
                    src={pdfPreviewUrl}
                    className="w-full h-full border-0"
                    title="Contract PDF Preview"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <p className="text-sm text-muted-foreground mb-4">
                        {contractData.contractUrl ? "Click to load PDF" : "No PDF generated yet"}
                      </p>
                      {contractData.contractUrl && (
                        <Button onClick={handleViewPdf} variant="outline">
                          <Eye className="mr-2 h-4 w-4" />
                          Load PDF
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>

            {contractData.status === "ready_for_sales" && (
              <Button
                onClick={handleSendToSales}
                className="bg-green-600 hover:bg-green-700"
              >
                <Send className="mr-2 h-4 w-4" />
                Send to Sales
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Full-screen PDF Viewer */}
      {showPdfViewer && pdfPreviewUrl && (
        <PDFViewer
          fileUrl={pdfPreviewUrl}
          fileName={`${parsedData.clientName} - Contract.pdf`}
          title="Contract PDF"
          onClose={() => setShowPdfViewer(false)}
          isOpen={showPdfViewer}
        />
      )}
    </>
  );
}
