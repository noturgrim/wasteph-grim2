import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, ArrowLeft, Eye } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";

export function RequestProposalDialog({ open, onOpenChange, inquiry, onSuccess }) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewHtml, setPreviewHtml] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [services, setServices] = useState([
    { name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 },
  ]);
  const [pricing, setPricing] = useState({
    taxRate: 12,
    discount: 0,
  });
  const [terms, setTerms] = useState({
    paymentTerms: "Net 30",
    validityDays: 30,
    notes: "",
  });

  // Fetch default template and existing proposal data on mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch default template
        const response = await api.getDefaultProposalTemplate();
        setDefaultTemplate(response.data || response);

        // If inquiry has a rejected proposal, fetch and populate it
        if (inquiry?.proposalId && inquiry?.proposalStatus === "rejected") {
          try {
            const proposalResponse = await api.getProposalById(inquiry.proposalId);
            const proposal = proposalResponse.data || proposalResponse;

            // Parse existing proposal data
            const existingData = typeof proposal.proposalData === "string"
              ? JSON.parse(proposal.proposalData)
              : proposal.proposalData;

            // Populate form with existing data
            if (existingData.services && existingData.services.length > 0) {
              setServices(existingData.services);
            }
            if (existingData.pricing) {
              setPricing({
                taxRate: existingData.pricing.taxRate || 12,
                discount: existingData.pricing.discount || 0,
              });
            }
            if (existingData.terms) {
              setTerms(existingData.terms);
            }
          } catch (error) {
            console.error("Failed to fetch existing proposal:", error);
            toast.error("Could not load rejected proposal data");
          }
        } else {
          // Reset to default values for new proposals
          setServices([{ name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
          setPricing({ taxRate: 12, discount: 0 });
          setTerms({ paymentTerms: "Net 30", validityDays: 30, notes: "" });
        }
      } catch (error) {
        console.error("Failed to fetch default template:", error);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, inquiry]);

  const handleAddService = () => {
    setServices([
      ...services,
      { name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 },
    ]);
  };

  const handleRemoveService = (index) => {
    setServices(services.filter((_, i) => i !== index));
  };

  const handleServiceChange = (index, field, value) => {
    const updatedServices = [...services];
    updatedServices[index][field] = value;

    // Recalculate subtotal
    if (field === "quantity" || field === "unitPrice") {
      const quantity = parseFloat(updatedServices[index].quantity) || 0;
      const unitPrice = parseFloat(updatedServices[index].unitPrice) || 0;
      updatedServices[index].subtotal = quantity * unitPrice;
    }

    setServices(updatedServices);
  };

  const calculatePricing = () => {
    const subtotal = services.reduce((sum, service) => sum + (service.subtotal || 0), 0);
    const discount = parseFloat(pricing.discount) || 0;
    const subtotalAfterDiscount = subtotal - discount;
    const tax = (subtotalAfterDiscount * (pricing.taxRate / 100)) || 0;
    const total = subtotalAfterDiscount + tax;

    return {
      subtotal,
      tax,
      discount,
      total,
      taxRate: pricing.taxRate,
    };
  };

  const handlePreview = async (e) => {
    e.preventDefault();

    // Validation
    if (services.length === 0 || !services[0].name) {
      toast.error("Please add at least one service");
      return;
    }

    if (!defaultTemplate) {
      toast.error("Template not loaded");
      return;
    }

    setIsLoadingPreview(true);
    try {
      const calculatedPricing = calculatePricing();
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + (parseInt(terms.validityDays) || 30));

      // Prepare sample data for preview
      const sampleData = {
        services: services.map(s => ({
          name: s.name,
          description: s.description || "",
          quantity: parseFloat(s.quantity),
          unitPrice: parseFloat(s.unitPrice),
          subtotal: parseFloat(s.subtotal),
        })),
        pricing: calculatedPricing,
        terms: {
          ...terms,
          validityDays: parseInt(terms.validityDays) || 30,
        },
        validityDate: validityDate.toISOString(),
        clientName: inquiry?.name || "Client Name",
        clientEmail: inquiry?.email || "client@example.com",
        clientCompany: inquiry?.company || "",
      };

      const response = await api.previewProposalTemplate(defaultTemplate.htmlTemplate, sampleData);
      setPreviewHtml(response.data.renderedHtml);
      setShowPreview(true);
    } catch (error) {
      toast.error("Failed to generate preview");
      console.error("Preview error:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    const calculatedPricing = calculatePricing();

    const proposalDataPayload = {
      services: services.map(s => ({
        name: s.name,
        description: s.description || "",
        quantity: parseFloat(s.quantity),
        unitPrice: parseFloat(s.unitPrice),
        subtotal: parseFloat(s.subtotal),
      })),
      pricing: calculatedPricing,
      terms,
    };

    setIsSubmitting(true);
    try {
      // Check if we're updating an existing rejected proposal or creating a new one
      const isRevision = inquiry?.proposalId && inquiry?.proposalStatus === "rejected";

      if (isRevision) {
        // Update existing proposal
        await api.updateProposal(inquiry.proposalId, {
          proposalData: proposalDataPayload,
        });
        toast.success("Proposal revised and resubmitted successfully");
      } else {
        // Create new proposal
        await api.createProposal({
          inquiryId: inquiry.id,
          proposalData: proposalDataPayload,
        });
        toast.success("Proposal request submitted successfully");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();

      // Reset form
      setServices([{ name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
      setPricing({ taxRate: 12, discount: 0 });
      setTerms({ paymentTerms: "Net 30", validityDays: 30, notes: "" });
      setShowPreview(false);
    } catch (error) {
      toast.error(error.message || "Failed to submit proposal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculatedPricing = calculatePricing();
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (parseInt(terms.validityDays) || 30));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setShowPreview(false);
    }}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {showPreview
              ? "Preview Proposal"
              : inquiry?.proposalStatus === "rejected"
                ? "Revise Proposal"
                : "Request Proposal"}
          </DialogTitle>
          <DialogDescription>
            {showPreview
              ? "Review the proposal before submitting"
              : inquiry?.proposalStatus === "rejected"
                ? `Revise the rejected proposal for ${inquiry?.name} (${inquiry?.email})`
                : `Create a proposal request for ${inquiry?.name} (${inquiry?.email})`
            }
          </DialogDescription>
        </DialogHeader>

        {!showPreview ? (
          /* FORM VIEW */
          <form onSubmit={handlePreview} className="space-y-6">
          {/* Rejection Reason Banner */}
          {inquiry?.proposalStatus === "rejected" && inquiry?.proposalRejectionReason && (
            <div className="bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-sm font-semibold text-red-900 dark:text-red-100 mb-1">
                Rejection Reason:
              </p>
              <p className="text-sm text-red-700 dark:text-red-300">
                {inquiry.proposalRejectionReason}
              </p>
            </div>
          )}

          {/* Services Section */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <Label className="text-base font-semibold">Services</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddService}
              >
                <Plus className="h-4 w-4 mr-1" />
                Add Service
              </Button>
            </div>

            <div className="space-y-4">
              {services.map((service, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <Label className="text-sm font-medium">Service {index + 1}</Label>
                    {services.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveService(index)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Label htmlFor={`service-name-${index}`}>Service Name *</Label>
                      <Input
                        id={`service-name-${index}`}
                        value={service.name}
                        onChange={(e) => handleServiceChange(index, "name", e.target.value)}
                        placeholder="e.g., Weekly Garbage Collection"
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label htmlFor={`service-description-${index}`}>Description</Label>
                      <Textarea
                        id={`service-description-${index}`}
                        value={service.description}
                        onChange={(e) => handleServiceChange(index, "description", e.target.value)}
                        placeholder="Service details..."
                        rows={2}
                      />
                    </div>

                    <div>
                      <Label htmlFor={`service-quantity-${index}`}>Quantity</Label>
                      <Input
                        id={`service-quantity-${index}`}
                        type="number"
                        min="1"
                        step="1"
                        value={service.quantity}
                        onChange={(e) => handleServiceChange(index, "quantity", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor={`service-unitPrice-${index}`}>Unit Price (₱)</Label>
                      <Input
                        id={`service-unitPrice-${index}`}
                        type="number"
                        min="0"
                        step="0.01"
                        value={service.unitPrice}
                        onChange={(e) => handleServiceChange(index, "unitPrice", e.target.value)}
                        required
                      />
                    </div>

                    <div className="col-span-2">
                      <Label>Subtotal</Label>
                      <div className="text-lg font-semibold text-green-600">
                        ₱{service.subtotal.toFixed(2)}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Section */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Pricing</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="discount">Discount (₱)</Label>
                <Input
                  id="discount"
                  type="number"
                  min="0"
                  step="0.01"
                  value={pricing.discount}
                  onChange={(e) => setPricing({ ...pricing, discount: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="taxRate">Tax Rate (%)</Label>
                <Input
                  id="taxRate"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={pricing.taxRate}
                  onChange={(e) => setPricing({ ...pricing, taxRate: e.target.value })}
                />
              </div>
            </div>

            {/* Pricing Summary */}
            <div className="mt-4 bg-slate-50 dark:bg-slate-900 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>Subtotal:</span>
                <span className="font-medium">₱{calculatedPricing.subtotal.toFixed(2)}</span>
              </div>
              {calculatedPricing.discount > 0 && (
                <div className="flex justify-between text-sm text-red-600">
                  <span>Discount:</span>
                  <span className="font-medium">- ₱{calculatedPricing.discount.toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span>Tax ({pricing.taxRate}%):</span>
                <span className="font-medium">₱{calculatedPricing.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-lg font-bold border-t pt-2">
                <span>Total:</span>
                <span className="text-green-600">₱{calculatedPricing.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Terms Section */}
          <div className="border-t pt-4">
            <Label className="text-base font-semibold mb-3 block">Terms & Conditions</Label>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="paymentTerms">Payment Terms</Label>
                <Input
                  id="paymentTerms"
                  value={terms.paymentTerms}
                  onChange={(e) => setTerms({ ...terms, paymentTerms: e.target.value })}
                  placeholder="Net 30"
                />
              </div>

              <div>
                <Label htmlFor="validityDays">Validity (Days)</Label>
                <Input
                  id="validityDays"
                  type="number"
                  min="1"
                  value={terms.validityDays}
                  onChange={(e) => setTerms({ ...terms, validityDays: e.target.value })}
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="notes">Additional Notes</Label>
                <Textarea
                  id="notes"
                  value={terms.notes}
                  onChange={(e) => setTerms({ ...terms, notes: e.target.value })}
                  placeholder="Any additional terms or notes..."
                  rows={3}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoadingPreview || !defaultTemplate}>
              <Eye className="h-4 w-4 mr-2" />
              {isLoadingPreview ? "Generating..." : "Preview"}
            </Button>
          </DialogFooter>
        </form>
        ) : (
          /* PREVIEW VIEW - Show actual rendered template */
          <div className="space-y-4">
            {isLoadingPreview ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Generating preview...</p>
                </div>
              </div>
            ) : (
              <>
                <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm">
                  <p className="text-green-900 dark:text-green-100">
                    📄 This is how the proposal will look when sent to <strong>{inquiry?.name}</strong>
                  </p>
                </div>

                {/* Rendered HTML Preview */}
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={previewHtml}
                    title="Proposal Preview"
                    className="w-full h-[600px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              </>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowPreview(false)}
                disabled={isSubmitting || isLoadingPreview}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Edit
              </Button>
              <Button onClick={handleSubmit} disabled={isSubmitting || isLoadingPreview}>
                {isSubmitting ? "Submitting..." : "Confirm & Submit"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
