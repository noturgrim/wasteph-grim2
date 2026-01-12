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
import { ArrowLeft } from "lucide-react";
import { api } from "../../services/api";
import { toast } from "sonner";
import { StepIndicator } from "./proposal-steps/StepIndicator";
import { Step1ServiceType } from "./proposal-steps/Step1ServiceType";
import { Step2ClientInfo } from "./proposal-steps/Step2ClientInfo";
import { Step2ServiceDetails } from "./proposal-steps/Step2ServiceDetails";
import { Step4Pricing } from "./proposal-steps/Step4Pricing";
import { Step5Terms } from "./proposal-steps/Step5Terms";
import { NavigationFooter } from "./proposal-steps/NavigationFooter";


export function RequestProposalDialog({ open, onOpenChange, inquiry, onSuccess }) {
  // Multi-step form state
  const [currentStep, setCurrentStep] = useState(1);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewPdfBase64, setPreviewPdfBase64] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [defaultTemplate, setDefaultTemplate] = useState(null);
  const [tempProposalId, setTempProposalId] = useState(null);
  const [services, setServices] = useState([
    { name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 },
  ]);
  const [pricing, setPricing] = useState({
    taxRate: 12,
    discount: 0,
  });
  const [terms, setTerms] = useState({
    paymentTerms: "Net 30",
    schedule: "",
    notes: "",
  });

  // Client info state
  const [clientInfo, setClientInfo] = useState({
    clientName: "",
    clientPosition: "",
    clientCompany: "",
    clientAddress: "",
    proposalDate: new Date().toISOString().split('T')[0],
    validityDays: 30,
  });

  // Service Type selection (primary selector)
  const [selectedServiceType, setSelectedServiceType] = useState("");

  // Template selection state
  const [templates, setTemplates] = useState({});
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [suggestedTemplate, setSuggestedTemplate] = useState(null);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState(false);

  // Template-specific fields (dynamic based on service type)
  const [templateFields, setTemplateFields] = useState({});

  // Fetch templates, suggestions, and existing proposal data
  useEffect(() => {
    const fetchData = async () => {
      setIsLoadingTemplates(true);
      try {
        // Fetch all templates grouped by category
        const templatesResponse = await api.getTemplatesByCategory();
        setTemplates(templatesResponse.data || templatesResponse);

        // Pre-populate service type from inquiry (if available)
        if (inquiry?.serviceType) {
          setSelectedServiceType(inquiry.serviceType);
        }

        // Pre-populate client info from inquiry
        if (inquiry) {
          setClientInfo({
            clientName: inquiry.name || "",
            clientPosition: inquiry.position || "",
            clientCompany: inquiry.company || "",
            clientAddress: inquiry.address || "",
            proposalDate: new Date().toISOString().split('T')[0],
            validityDays: 30,
          });
        }

        // Fetch suggested template based on inquiry OR selected service type
        if (inquiry?.id || selectedServiceType) {
          try {
            let suggested;
            if (inquiry?.id) {
              const suggestionResponse = await api.suggestTemplateForInquiry(inquiry.id);
              suggested = suggestionResponse.data || suggestionResponse;
            }

            if (suggested) {
              setSuggestedTemplate(suggested);
              setSelectedTemplate(suggested);
              setDefaultTemplate(suggested);

              // Initialize template-specific fields based on config
              initializeTemplateFields(suggested);
            }
          } catch (error) {
            console.error("Failed to fetch template suggestion:", error);
            // Fall back to default template
            const defaultResponse = await api.getDefaultProposalTemplate();
            const defaultTpl = defaultResponse.data || defaultResponse;
            setDefaultTemplate(defaultTpl);
            setSelectedTemplate(defaultTpl);
          }
        }

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
            // Populate template-specific fields
            if (existingData.wasteAllowance || existingData.excessRate) {
              setTemplateFields({
                wasteAllowance: existingData.wasteAllowance || 0,
                excessRate: existingData.excessRate || 0,
              });
            }
          } catch (error) {
            console.error("Failed to fetch existing proposal:", error);
            toast.error("Could not load rejected proposal data");
          }
        } else {
          // Reset to default values for new proposals
          setServices([{ name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
          setPricing({ taxRate: 12, discount: 0 });
          setTerms({ paymentTerms: "Net 30", schedule: "", notes: "" });
          setTemplateFields({ wasteAllowance: 0, excessRate: 0 });
        }
      } catch (error) {
        console.error("Failed to fetch templates:", error);
        toast.error("Could not load proposal templates");
      } finally {
        setIsLoadingTemplates(false);
      }
    };

    if (open) {
      fetchData();
    }
  }, [open, inquiry]);

  // Helper: Initialize template-specific fields based on template config
  const initializeTemplateFields = (template) => {
    if (!template?.templateConfig) {
      setTemplateFields({});
      return;
    }

    const config = typeof template.templateConfig === "string"
      ? JSON.parse(template.templateConfig)
      : template.templateConfig;

    const fields = {};

    // Compactor Hauling fields
    if (config.hasWasteAllowance) fields.wasteAllowance = 0;
    if (config.hasExcessRate) fields.excessRate = 0;

    // Fixed Monthly fields
    if (config.hasContractDuration) fields.contractDuration = 12;
    if (config.hasMonthlyRate) fields.monthlyRate = 0;
    if (config.hasPickupSchedule) fields.pickupSchedule = "";

    // Clearing Project fields
    if (config.hasEquipment) fields.equipment = [];
    if (config.hasLaborCrew) fields.laborCrew = { numberOfWorkers: 0, daysRequired: 0, ratePerDay: 0 };
    if (config.hasProjectDuration) fields.projectDuration = "";

    // One Time Hauling fields
    if (config.hasTruckType) fields.truckType = "";
    if (config.hasNumberOfTrips) fields.numberOfTrips = 1;
    if (config.hasRatePerTrip) fields.ratePerTrip = 0;

    // Long Term fields
    if (config.hasRatePerKg) fields.ratePerKg = 0;
    if (config.hasMinimumCharge) fields.minimumMonthlyCharge = 0;
    if (config.hasWeighingMethod) fields.weighingMethod = "";

    // Recyclables fields
    if (config.hasRecyclableTypes) fields.recyclableTypes = [];
    if (config.hasPurchaseRates) fields.purchaseRates = {};

    // Hazardous Waste fields
    if (config.requiresManifest) fields.manifestNumber = "";
    if (config.requiresLicense) fields.transportLicense = "";

    setTemplateFields(fields);
  };

  // Handle service type selection (primary selector)
  const handleServiceTypeChange = async (serviceType) => {
    setSelectedServiceType(serviceType);

    // Create mock inquiry for template suggestion
    const mockInquiry = { serviceType };

    try {
      // Map service type to template type
      const serviceTypeMap = {
        waste_collection: "compactor_hauling",
        hazardous: "hazardous_waste",
        fixed_monthly: "fixed_monthly",
        clearing: "clearing_project",
        one_time: "one_time_hauling",
        long_term: "long_term",
        recyclables: "recyclables_purchase",
      };

      const templateType = serviceTypeMap[serviceType];
      if (!templateType) return;

      // Find template by type
      let foundTemplate = null;
      Object.values(templates).forEach((categoryTemplates) => {
        const template = categoryTemplates.find((t) => t.templateType === templateType);
        if (template) foundTemplate = template;
      });

      if (foundTemplate) {
        // Fetch full template details
        const response = await api.getProposalTemplateById(foundTemplate.id);
        const fullTemplate = response.data || response;
        setSelectedTemplate(fullTemplate);
        setDefaultTemplate(fullTemplate);
        setSuggestedTemplate(fullTemplate);

        // Initialize fields for this service
        initializeTemplateFields(fullTemplate);
      }
    } catch (error) {
      console.error("Failed to load template for service type:", error);
      toast.error("Could not load template");
    }
  };

  const handleTemplateChange = async (templateId) => {
    setIsLoadingTemplates(true);
    try {
      // Find the selected template from the templates object
      let foundTemplate = null;
      Object.values(templates).forEach((categoryTemplates) => {
        const template = categoryTemplates.find((t) => t.id === templateId);
        if (template) foundTemplate = template;
      });

      if (foundTemplate) {
        // Fetch full template details
        const response = await api.getProposalTemplateById(templateId);
        const fullTemplate = response.data || response;
        setSelectedTemplate(fullTemplate);
        setDefaultTemplate(fullTemplate);

        // Initialize template-specific fields based on config
        initializeTemplateFields(fullTemplate);
      }
    } catch (error) {
      console.error("Failed to fetch template details:", error);
      toast.error("Could not load template details");
    } finally {
      setIsLoadingTemplates(false);
    }
  };

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
    if (!defaultTemplate) {
      toast.error("Template not loaded");
      return;
    }

    if (!selectedServiceType) {
      toast.error("Please select a service type");
      return;
    }

    if (!clientInfo.clientName) {
      toast.error("Please enter the client name");
      return;
    }

    setIsLoadingPreview(true);
    try {
      const calculatedPricing = calculatePricing();
      const validityDate = new Date();
      validityDate.setDate(validityDate.getDate() + (parseInt(clientInfo.validityDays) || 30));

      // Use placeholder services for now since pricing UI is not implemented yet
      const placeholderServices = [{
        name: "Waste Collection Service",
        description: "Standard waste collection and disposal service",
        quantity: 1,
        unitPrice: 5000,
        subtotal: 5000,
      }];

      // Prepare sample data for preview (NO DATABASE SAVE)
      const sampleData = {
        services: placeholderServices,
        pricing: {
          subtotal: 5000,
          tax: 600,
          discount: 0,
          total: 5600,
          taxRate: 12,
        },
        terms,
        clientInfo: {
          ...clientInfo,
          validityDays: parseInt(clientInfo.validityDays) || 30,
        },
        validityDate: validityDate.toISOString(),
        clientName: clientInfo.clientName || inquiry?.name || "Client Name",
        clientEmail: inquiry?.email || "client@example.com",
        clientCompany: clientInfo.clientCompany || inquiry?.company || "",
        clientPosition: clientInfo.clientPosition || "",
        clientAddress: clientInfo.clientAddress || inquiry?.address || "",
        proposalDate: clientInfo.proposalDate,
        // Include template-specific fields
        ...templateFields,
      };

      // Generate HTML preview (no database save)
      const response = await api.previewProposalTemplate(defaultTemplate.htmlTemplate, sampleData);
      setPreviewPdfBase64(response.data.renderedHtml);
      setShowPreview(true);
    } catch (error) {
      toast.error("Failed to generate preview");
      console.error("Preview error:", error);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleSubmit = async () => {
    // Use placeholder services for now since pricing UI is not implemented yet
    const placeholderServices = [{
      name: "Waste Collection Service",
      description: "Standard waste collection and disposal service",
      quantity: 1,
      unitPrice: 5000,
      subtotal: 5000,
    }];

    const proposalDataPayload = {
      services: placeholderServices,
      pricing: {
        subtotal: 5000,
        tax: 600,
        discount: 0,
        total: 5600,
        taxRate: 12,
      },
      terms,
      clientInfo,
      // Include template-specific fields
      ...templateFields,
    };

    setIsSubmitting(true);
    try {
      // Check if we're updating an existing rejected proposal or creating a new one
      const isRevision = inquiry?.proposalId && inquiry?.proposalStatus === "rejected";

      if (isRevision) {
        // Update existing proposal
        await api.updateProposal(inquiry.proposalId, {
          proposalData: proposalDataPayload,
          templateId: selectedTemplate?.id, // Include template ID
        });
        toast.success("Proposal revised and resubmitted successfully");
      } else {
        // Create new proposal
        await api.createProposal({
          inquiryId: inquiry.id,
          templateId: selectedTemplate?.id, // Include template ID
          proposalData: proposalDataPayload,
        });
        toast.success("Proposal request submitted successfully");
      }

      onOpenChange(false);
      if (onSuccess) onSuccess();

      // Reset form
      setServices([{ name: "", description: "", quantity: 1, unitPrice: 0, subtotal: 0 }]);
      setPricing({ taxRate: 12, discount: 0 });
      setTerms({ paymentTerms: "Net 30", schedule: "", notes: "" });
      setClientInfo({
        clientName: "",
        clientPosition: "",
        clientCompany: "",
        clientAddress: "",
        proposalDate: new Date().toISOString().split('T')[0],
        validityDays: 30,
      });
      setShowPreview(false);
      setPreviewPdfBase64("");
      setCurrentStep(1); // Reset to first step
    } catch (error) {
      toast.error(error.message || "Failed to submit proposal request");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-step navigation functions
  const goToNextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  const goToPrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goToStep = (stepNumber) => {
    setCurrentStep(stepNumber);
  };

  // Reset step when dialog closes
  useEffect(() => {
    if (!open) {
      setCurrentStep(1);
    }
  }, [open]);

  const calculatedPricing = calculatePricing();
  const validityDate = new Date();
  validityDate.setDate(validityDate.getDate() + (parseInt(terms.validityDays) || 30));

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      onOpenChange(isOpen);
      if (!isOpen) setShowPreview(false);
    }}>
      <DialogContent className="!w-[900px] !max-w-[90vw] !h-[92vh] !max-h-[92vh] flex flex-col p-0">
        {!showPreview ? (
          /* MULTI-STEP FORM VIEW */
          <>
            {/* Header */}
            <div className="px-6 py-3 border-b shrink-0">
              <DialogHeader>
                <DialogTitle className="text-xl">
                  {inquiry?.proposalStatus === "rejected" ? "Revise Proposal" : "Create Proposal"}
                </DialogTitle>
                <DialogDescription>
                  {inquiry?.name} ({inquiry?.email})
                </DialogDescription>
              </DialogHeader>
            </div>

            {/* Step Indicator */}
            <div className="shrink-0">
              <StepIndicator currentStep={currentStep} onStepClick={goToStep} />
            </div>

            {/* Form Content - Scrollable Area */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              <div className="max-w-3xl mx-auto space-y-4">
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

                {/* STEP 1: Service Type Selection */}
                {currentStep === 1 && (
                  <Step1ServiceType
                    selectedServiceType={selectedServiceType}
                    onServiceTypeChange={handleServiceTypeChange}
                    selectedTemplate={selectedTemplate}
                  />
                )}

                {/* STEP 2: Client & Proposal Info */}
                {currentStep === 2 && (
                  <Step2ClientInfo
                    clientInfo={clientInfo}
                    onClientInfoChange={setClientInfo}
                    inquiry={inquiry}
                  />
                )}

                {/* STEP 3: Service-Specific Details */}
                {currentStep === 3 && (
                  <Step2ServiceDetails
                    selectedServiceType={selectedServiceType}
                    selectedTemplate={selectedTemplate}
                    templateFields={templateFields}
                    onTemplateFieldsChange={setTemplateFields}
                  />
                )}

                {/* STEP 4: Pricing & Charges */}
                {currentStep === 4 && (
                  <Step4Pricing
                    services={services}
                    pricing={pricing}
                    calculatedPricing={calculatedPricing}
                    onPricingChange={setPricing}
                    onServiceChange={handleServiceChange}
                  />
                )}

                {/* STEP 5: Terms & Conditions */}
                {currentStep === 5 && (
                  <Step5Terms
                    terms={terms}
                    onTermsChange={setTerms}
                  />
                )}
              </div>
            </div>

            {/* Multi-Step Navigation Footer */}
            <div className="shrink-0">
              <NavigationFooter
                currentStep={currentStep}
                totalSteps={5}
                onPrevious={goToPrevStep}
                onNext={goToNextStep}
                onPreview={handlePreview}
                onCancel={() => onOpenChange(false)}
                canProceed={true}
                isLoadingPreview={isLoadingPreview}
                isDefaultTemplateLoaded={!!defaultTemplate}
                hasSelectedService={!!selectedServiceType}
              />
            </div>
          </>
        ) : (
          /* PREVIEW VIEW - Show actual rendered template */
          <>
            <div className="px-6 pt-6 shrink-0">
              <div className="bg-green-50 dark:bg-green-950 rounded-lg p-3 text-sm">
                <p className="text-green-900 dark:text-green-100">
                  📄 This is how the proposal will look when sent to <strong>{inquiry?.name}</strong>
                </p>
              </div>
            </div>

            {/* Scrollable Preview Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {isLoadingPreview ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center space-y-2">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground">Generating preview...</p>
                  </div>
                </div>
              ) : (
                <div className="border rounded-lg overflow-hidden bg-white">
                  <iframe
                    srcDoc={previewPdfBase64}
                    title="Proposal Preview"
                    className="w-full h-[600px] border-0"
                    sandbox="allow-same-origin"
                  />
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 shrink-0">
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
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
