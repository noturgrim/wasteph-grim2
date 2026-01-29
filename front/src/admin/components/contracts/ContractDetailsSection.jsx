import { Badge } from "@/components/ui/badge";

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

export function ContractDetailsSection({ contract }) {
  const contractData = contract?.contract || {};

  // Parse signatories if it's a JSON string
  let signatories = [];
  if (contractData.signatories) {
    try {
      signatories =
        typeof contractData.signatories === "string"
          ? JSON.parse(contractData.signatories)
          : contractData.signatories;
    } catch (e) {
      console.error("Failed to parse signatories:", e);
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
            label="Contract Duration"
            value={contractData.contractDuration}
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
