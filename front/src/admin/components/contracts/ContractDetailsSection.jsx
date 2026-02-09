import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";

const CONTRACT_TYPE_LABELS = {
  long_term_variable: "LONG TERM GARBAGE VARIABLE CHARGE",
  long_term_fixed:
    "LONG TERM GARBAGE FIXED CHARGE (MORE THAN 50,000 PHP / MONTH)",
  fixed_rate_term: "FIXED RATE TERM",
  garbage_bins: "GARBAGE BINS",
  garbage_bins_disposal: "GARBAGE BINS WITH DISPOSAL",
};

const COLLECTION_SCHEDULE_LABELS = {
  daily: "Daily",
  weekly: "Weekly",
  monthly: "Monthly",
  bi_weekly: "Bi-Weekly",
  other: "Other",
};

const INDUSTRY_LABELS = {
  food_and_beverage: "Food & Beverage",
  retail: "Retail",
  manufacturing: "Manufacturing",
  healthcare: "Healthcare",
  hospitality: "Hospitality",
  education: "Education",
  construction: "Construction",
  real_estate: "Real Estate",
  logistics: "Logistics",
  agriculture: "Agriculture",
  technology: "Technology",
  government: "Government",
  residential: "Residential",
  other: "Other",
};

export function ContractDetailsSection({ contract }) {
  const contractData = contract?.contract || {};

  // Resolve clientIndustry: column first, fallback to contractData JSON
  let clientIndustry = contractData.clientIndustry || "";
  if (!clientIndustry && contractData.contractData) {
    try {
      const parsed =
        typeof contractData.contractData === "string"
          ? JSON.parse(contractData.contractData)
          : contractData.contractData;
      clientIndustry = parsed.clientIndustry || "";
    } catch { /* ignore */ }
  }

  // Parse signatories if it's a JSON string
  let signatories = [];
  if (contractData.signatories) {
    try {
      const parsed =
        typeof contractData.signatories === "string"
          ? JSON.parse(contractData.signatories)
          : contractData.signatories;

      // Ensure it's an array
      signatories = Array.isArray(parsed) ? parsed : [];
    } catch (e) {
      console.error("Failed to parse signatories:", e);
      signatories = [];
    }
  }

  const DetailRow = ({ label, value, required = false }) => {
    if (!value && !required) return null;

    return (
      <div className="grid grid-cols-3 gap-2 py-2 border-b border-gray-100 dark:border-gray-800 last:border-0">
        <div className="text-sm font-medium text-muted-foreground">
          {label}
          {required && !value && <span className="text-red-500 ml-1">*</span>}
        </div>
        <div className="col-span-2 text-sm">
          {value || (
            <span className="text-muted-foreground italic">Not provided</span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Contract Type */}
      {contractData.contractType && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Contract Type
          </h4>
          <Badge variant="outline" className="text-xs font-normal">
            {CONTRACT_TYPE_LABELS[contractData.contractType] ||
              contractData.contractType}
          </Badge>
        </div>
      )}

      {/* Client Information */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Client Information
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
          <DetailRow
            label="Client Name"
            value={contractData.clientName}
            required
          />
          <DetailRow label="Company Name" value={contractData.companyName} />
          <DetailRow
            label="Industry"
            value={clientIndustry ? (INDUSTRY_LABELS[clientIndustry] || clientIndustry) : null}
          />
          <DetailRow
            label="Email"
            value={contractData.clientEmailContract}
            required
          />
          <DetailRow
            label="Client Address"
            value={contractData.clientAddress}
          />
        </div>
      </div>

      {/* Contract Details */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Contract Details
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
          <DetailRow
            label="Contract Start"
            value={
              contractData.contractStartDate
                ? format(
                    new Date(contractData.contractStartDate),
                    "MMM dd, yyyy",
                  )
                : null
            }
            required
          />
          <DetailRow
            label="Contract End"
            value={
              contractData.contractEndDate
                ? format(new Date(contractData.contractEndDate), "MMM dd, yyyy")
                : null
            }
            required
          />
          <DetailRow
            label="Service Address"
            value={
              contractData.serviceLatitude && contractData.serviceLongitude
                ? `${contractData.serviceLatitude}, ${contractData.serviceLongitude}`
                : null
            }
            required
          />
          {contractData.serviceLatitude && contractData.serviceLongitude && (
            <div className="col-span-3 text-xs text-muted-foreground pt-1 flex items-center gap-2">
              <span>Latitude: {contractData.serviceLatitude}</span>
              <span>Longitude: {contractData.serviceLongitude}</span>
            </div>
          )}
        </div>
      </div>

      {/* Collection & Service Details */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Collection & Service Details
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
          <DetailRow
            label="Collection Schedule"
            value={
              contractData.collectionSchedule === "other"
                ? `Other: ${contractData.collectionScheduleOther || "Not specified"}`
                : COLLECTION_SCHEDULE_LABELS[contractData.collectionSchedule]
            }
            required
          />
          <DetailRow
            label="Waste Allowance"
            value={contractData.wasteAllowance}
          />
          <DetailRow
            label="Rate per KG"
            value={contractData.ratePerKg}
            required
          />
        </div>
      </div>

      {/* Signatories */}
      {signatories && signatories.length > 0 && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Signatories
          </h4>
          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-1">
            {signatories.map((signatory, index) => (
              <div key={index} className="text-sm py-1">
                <span className="font-medium">{signatory.name}</span>
                <span className="text-muted-foreground">
                  {" "}
                  - {signatory.position}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Special Clauses & Requests */}
      <div>
        <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
          Special Clauses & Requests
        </h4>
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 space-y-3">
          {contractData.specialClauses && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Special Clauses
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {contractData.specialClauses}
              </p>
            </div>
          )}
          {contractData.clientRequests && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Client Requests
              </p>
              <p className="text-sm whitespace-pre-wrap">
                {contractData.clientRequests}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Request Notes */}
      {contractData.requestNotes && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Request Notes from Sales
          </h4>
          <div className="bg-blue-50 dark:bg-blue-950 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap">
              {contractData.requestNotes}
            </p>
          </div>
        </div>
      )}

      {/* Custom Contract Template */}
      {contractData.customTemplateUrl && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Custom Contract Template
          </h4>
          <div className="bg-purple-50 dark:bg-purple-950 border border-purple-200 dark:border-purple-800 rounded-lg p-3">
            <p className="text-sm text-purple-900 dark:text-purple-100 mb-2">
              Client provided a custom contract template
            </p>
            <a
              href={`${import.meta.env.VITE_API_URL || "http://localhost:5000/api"}/contracts/${contractData.id}/custom-template`}
              download
              className="inline-flex items-center gap-2 text-sm text-purple-700 dark:text-purple-300 hover:underline"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10"
                />
              </svg>
              Download Template
            </a>
          </div>
        </div>
      )}

      {/* Admin Notes (with change log) */}
      {contractData.adminNotes && (
        <div>
          <h4 className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">
            Admin Notes & Changes
          </h4>
          <div className="bg-yellow-50 dark:bg-yellow-950 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3">
            <p className="text-sm whitespace-pre-wrap text-yellow-900 dark:text-yellow-100">
              {contractData.adminNotes}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
