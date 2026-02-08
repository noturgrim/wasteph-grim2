import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  XCircle,
  Loader2,
  AlertCircle,
  FileText,
  AlertTriangle,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const ProposalResponse = () => {
  const { proposalId, action } = useParams(); // action: 'approve' or 'reject'
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");

  const [stage, setStage] = useState("loading"); // 'loading', 'confirmation', 'processing', 'success', 'error'
  const [message, setMessage] = useState("");
  const [proposalDetails, setProposalDetails] = useState(null);
  const [responseData, setResponseData] = useState(null);

  // Load proposal details for confirmation
  useEffect(() => {
    const loadProposalDetails = async () => {
      if (!token) {
        setStage("error");
        setMessage("Invalid or missing authentication token");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/proposals/public/${proposalId}/status?token=${token}`
        );
        const data = await response.json();

        if (response.ok) {
          setProposalDetails(data.data);
          setStage("confirmation");
        } else {
          setStage("error");
          setMessage(
            data.message || data.error || "Failed to load proposal details"
          );
        }
      } catch (error) {
        console.error("Error loading proposal:", error);
        setStage("error");
        setMessage(
          "An error occurred while loading the proposal. Please try again or contact us directly."
        );
      }
    };

    loadProposalDetails();
  }, [proposalId, token]);

  // Handle user confirmation
  const handleConfirm = async () => {
    setStage("processing");

    try {
      const endpoint =
        action === "approve"
          ? `/proposals/public/${proposalId}/approve`
          : `/proposals/public/${proposalId}/reject`;

      const response = await fetch(`${API_URL}${endpoint}?token=${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (response.ok) {
        setStage("success");
        setMessage(
          data.message || "Your response has been recorded successfully"
        );
        setResponseData(data.data);
      } else {
        setStage("error");
        setMessage(
          data.message || data.error || "Failed to record your response"
        );
      }
    } catch (error) {
      console.error("Error recording response:", error);
      setStage("error");
      setMessage(
        "An error occurred while processing your response. Please try again or contact us directly."
      );
    }
  };

  const handleCancel = () => {
    window.close(); // Close the tab
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-green-50 via-white to-green-50 p-4 pt-24 md:pt-4">
      {/* WastePH Logo Header - Responsive */}
      <div className="absolute top-4 left-4 md:top-8 md:left-8">
        <div className="flex items-center gap-2">
          <h1 className="text-xl md:text-3xl font-bold tracking-wider text-[#104806]">
            WASTE <span className="text-[#104806]">•</span> PH
          </h1>
        </div>
        <p className="text-[10px] md:text-xs tracking-widest text-[#2a6b1f] mt-1">
          PRIVATE WASTE MANAGEMENT
        </p>
      </div>

      <Card className="w-full max-w-2xl border-green-200 shadow-2xl bg-white">
        <CardHeader className="space-y-2 pb-6 border-b border-green-100">
          <CardTitle className="text-3xl font-bold text-[#104806] tracking-wide">
            {stage === "loading" && "Loading Proposal..."}
            {stage === "confirmation" &&
              `${action === "approve" ? "Approve" : "Decline"} Proposal`}
            {stage === "processing" && "Processing Your Response..."}
            {stage === "success" && "Response Recorded"}
            {stage === "error" && "Unable to Process"}
          </CardTitle>
          {stage === "confirmation" && (
            <CardDescription className="text-gray-600 text-base">
              Please confirm your decision for Proposal{" "}
              <span className="font-semibold text-[#104806]">
                {proposalDetails.proposalNumber || proposalId}
              </span>
            </CardDescription>
          )}
        </CardHeader>

        <CardContent>
          {/* Loading State */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-20 w-20 animate-spin text-[#104806] mb-6" />
              <p className="text-gray-600 text-lg font-medium">
                Loading proposal details...
              </p>
            </div>
          )}

          {/* Confirmation State */}
          {stage === "confirmation" && proposalDetails && (
            <div className="space-y-6">
              {/* View PDF Button - Prominent */}
              <div className="flex justify-center">
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() =>
                    window.open(
                      `${API_URL}/proposals/public/${proposalId}/pdf?token=${token}`,
                      "_blank"
                    )
                  }
                  className="text-[#104806] hover:text-[#0a3004] hover:bg-green-50 border-[#104806] border-2 cursor-pointer font-semibold"
                >
                  <FileText className="h-5 w-5 mr-2" />
                  View Full Proposal PDF
                </Button>
              </div>

              {/* Proposal Details */}
              <div className="bg-gradient-to-br from-green-50 to-white border-2 border-[#104806] rounded-lg p-6 space-y-4">
                <h3 className="font-bold text-xl text-[#104806] border-b-2 border-green-200 pb-2">
                  Proposal Information
                </h3>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide">
                      Proposal Number
                    </p>
                    <p className="text-base font-bold text-gray-900">
                      {proposalDetails.proposalNumber || proposalId}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide">
                      Status
                    </p>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${
                        proposalDetails.clientResponse === "approved"
                          ? "bg-green-600 text-white"
                          : proposalDetails.clientResponse === "rejected"
                          ? "bg-red-600 text-white"
                          : proposalDetails.status === "sent"
                          ? "bg-blue-600 text-white"
                          : "bg-yellow-600 text-white"
                      }`}
                    >
                      {proposalDetails.clientResponse?.toUpperCase() ||
                        proposalDetails.status?.toUpperCase() ||
                        "PENDING"}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide">
                      Sent Date
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {proposalDetails.sentAt
                        ? new Date(proposalDetails.sentAt).toLocaleDateString(
                            "en-US",
                            {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            }
                          )
                        : "N/A"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide">
                      Valid Until
                    </p>
                    <p className="text-base font-medium text-gray-900">
                      {proposalDetails.expiresAt
                        ? new Date(
                            proposalDetails.expiresAt
                          ).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })
                        : "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Confirmation Warning */}
              <div
                className={`border-2 rounded-lg p-6 ${
                  action === "approve"
                    ? "bg-green-50 border-green-600"
                    : "bg-orange-50 border-orange-600"
                }`}
              >
                <div className="flex items-start gap-4">
                  <AlertTriangle
                    className={`h-8 w-8 shrink-0 mt-1 ${
                      action === "approve"
                        ? "text-green-700"
                        : "text-orange-700"
                    }`}
                  />
                  <div className="space-y-2">
                    <p
                      className={`text-lg font-bold ${
                        action === "approve"
                          ? "text-green-900"
                          : "text-orange-900"
                      }`}
                    >
                      {action === "approve"
                        ? "Ready to Accept This Proposal?"
                        : "Declining This Proposal?"}
                    </p>
                    <p
                      className={`text-sm leading-relaxed ${
                        action === "approve"
                          ? "text-green-800"
                          : "text-orange-800"
                      }`}
                    >
                      {action === "approve"
                        ? proposalDetails.requiresContract === false
                          ? "By clicking 'Confirm Approval' below, you agree to the terms and conditions outlined in this proposal. Our team will begin coordinating your service immediately."
                          : "By clicking 'Confirm Approval' below, you agree to the terms and conditions outlined in this proposal. Our team will begin preparing your contract immediately."
                        : "If you decline, this proposal will be marked as rejected. You can still contact us to discuss alternative options or modifications."}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Processing State */}
          {stage === "processing" && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-20 w-20 animate-spin text-[#104806] mb-6" />
              <p className="text-gray-700 text-lg font-semibold">
                Processing your response...
              </p>
              <p className="text-gray-500 text-sm mt-2">
                Please wait, do not close this window
              </p>
            </div>
          )}

          {/* Success State */}
          {stage === "success" && (
            <div className="py-8 space-y-8">
              {/* Success Icon & Header */}
              <div className="flex flex-col items-center">
                <div
                  className={`rounded-full p-6 mb-6 ${
                    action === "approve"
                      ? "bg-gradient-to-br from-green-100 to-green-50"
                      : "bg-gradient-to-br from-orange-100 to-orange-50"
                  }`}
                >
                  {action === "approve" ? (
                    <CheckCircle
                      className="h-24 w-24 text-[#104806]"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <XCircle
                      className="h-24 w-24 text-orange-600"
                      strokeWidth={2.5}
                    />
                  )}
                </div>

                <h3 className="text-3xl font-bold mb-3 text-center text-[#104806]">
                  {action === "approve"
                    ? "Thank You for Your Approval!"
                    : "Response Received"}
                </h3>

                <p className="text-gray-700 text-center text-lg max-w-md">
                  {message}
                </p>
              </div>

              {/* 2-Column Grid Layout */}
              {action === "approve" && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Left: What Happens Next */}
                  <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-600 rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-[#104806] mb-5 text-xl flex items-center gap-2">
                      <CheckCircle className="h-6 w-6" />
                      What Happens Next?
                    </h4>
                    <div className="space-y-4">
                      {proposalDetails.requiresContract === false ? (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              1
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              Our team has been notified and will begin
                              coordinating your service immediately
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              2
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              A dedicated team member will contact you to
                              schedule and confirm the service details
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              3
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              You'll receive a confirmation with all the service
                              logistics and timeline
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              1
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              Our sales team has been notified and will review
                              your approval immediately
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              2
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              We'll finalize the contract details and prepare all
                              documentation
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              3
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              You'll receive the final contract document via
                              email within 1-2 business days
                            </p>
                          </div>
                          <div className="flex items-start gap-3">
                            <div className="bg-[#104806] text-white rounded-full w-7 h-7 flex items-center justify-center shrink-0 mt-0.5 font-bold text-sm">
                              4
                            </div>
                            <p className="text-sm text-gray-800 leading-relaxed">
                              A dedicated team member will contact you to discuss
                              service implementation
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Right: Need Assistance */}
                  <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-600 rounded-xl p-6 shadow-sm">
                    <h4 className="font-bold text-[#104806] mb-5 text-xl uppercase tracking-wide">
                      Need Assistance?
                    </h4>
                    <div className="space-y-5">
                      <div>
                        <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide mb-2">
                          Email
                        </p>
                        <a
                          href="mailto:sales@waste.ph"
                          className="text-lg font-bold text-[#104806] hover:underline block"
                        >
                          sales@waste.ph
                        </a>
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide mb-2">
                          Phone
                        </p>
                        <div className="space-y-2">
                          <a
                            href="tel:+639562461503"
                            className="text-lg font-bold text-[#104806] hover:underline block"
                          >
                            0956-246-1503
                          </a>
                          <a
                            href="tel:+639277966751"
                            className="text-lg font-bold text-[#104806] hover:underline block"
                          >
                            0927-796-6751
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {action === "reject" && (
                <div className="bg-gradient-to-br from-orange-50 to-white border-2 border-orange-400 rounded-xl p-6 shadow-sm">
                  <h4 className="font-bold text-orange-900 mb-3 text-lg">
                    We Understand
                  </h4>
                  <p className="text-sm text-orange-800 leading-relaxed">
                    We appreciate you taking the time to review our proposal. If
                    you have any questions or would like to discuss alternative
                    options, customized solutions, or pricing adjustments,
                    please don't hesitate to reach out to our team. We're here
                    to help!
                  </p>
                </div>
              )}

              {/* Reference Footer */}
              {responseData && (
                <div className="border-t-2 border-green-100 pt-6">
                  <p className="text-sm text-gray-600 text-center font-medium">
                    Reference:{" "}
                    <span className="font-bold text-[#104806]">
                      {responseData.proposalNumber || responseData.proposalId}
                    </span>
                    <br />
                    <span className="text-xs text-gray-500">
                      Recorded on{" "}
                      {new Date(responseData.respondedAt).toLocaleDateString(
                        "en-US",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        }
                      )}
                    </span>
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {stage === "error" && (
            <div className="flex flex-col items-center justify-center py-8">
              <div className="rounded-full bg-gradient-to-br from-red-100 to-red-50 p-6 mb-6 shadow-md">
                <AlertCircle
                  className="h-24 w-24 text-red-600"
                  strokeWidth={2.5}
                />
              </div>

              <h3 className="text-3xl font-bold mb-3 text-center text-red-900">
                Oops! Something Went Wrong
              </h3>

              <p className="text-gray-700 text-center mb-8 text-lg max-w-md leading-relaxed">
                {message}
              </p>

              <div className="bg-gradient-to-br from-red-50 to-white border-2 border-red-300 rounded-xl p-6 w-full shadow-sm">
                <p className="text-sm text-red-900 mb-3 font-bold uppercase tracking-wide">
                  Possible Reasons:
                </p>
                <ul className="text-sm text-red-800 space-y-2">
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      This link has already been used to submit a response
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>The proposal has expired and is no longer valid</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-red-600 font-bold">•</span>
                    <span>
                      The authentication token is invalid or corrupted
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* Contact Information - Error State Only (Success has it in grid) */}
          {stage === "error" && (
            <div className="border-t-2 border-green-100 pt-6 mt-6">
              <h4 className="font-bold text-[#104806] mb-4 text-center text-lg uppercase tracking-wide">
                Need Assistance?
              </h4>
              <div className="bg-gradient-to-br from-green-50 to-white rounded-lg p-5 space-y-3 border border-green-200">
                <div className="text-center">
                  <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide mb-1">
                    Email
                  </p>
                  <a
                    href="mailto:sales@waste.ph"
                    className="text-base font-bold text-[#104806] hover:underline"
                  >
                    sales@waste.ph
                  </a>
                </div>
                <div className="flex items-center justify-center gap-6">
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide mb-1">
                      Phone
                    </p>
                    <a
                      href="tel:+639562461503"
                      className="text-base font-bold text-[#104806] hover:underline"
                    >
                      0956-246-1503
                    </a>
                  </div>
                  <div className="text-center">
                    <p className="text-sm font-semibold text-[#2a6b1f] uppercase tracking-wide mb-1">
                      Phone
                    </p>
                    <a
                      href="tel:+639277966751"
                      className="text-base font-bold text-[#104806] hover:underline"
                    >
                      0927-796-6751
                    </a>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>

        {/* Card Footer - Action Buttons for Confirmation */}
        {stage === "confirmation" && proposalDetails && (
          <CardFooter className="flex justify-end gap-4 pt-6 border-t-2 border-green-100">
            <Button
              variant="outline"
              size="lg"
              onClick={handleCancel}
              className="text-gray-700 hover:bg-gray-100 border-gray-400 cursor-pointer transition-all font-semibold px-8"
            >
              Cancel
            </Button>
            <Button
              size="lg"
              onClick={handleConfirm}
              className={
                action === "approve"
                  ? "bg-[#104806] hover:bg-[#0a3004] active:bg-[#062002] text-white transition-all cursor-pointer font-bold px-10 shadow-lg hover:shadow-xl"
                  : "bg-red-600 hover:bg-red-700 active:bg-red-800 text-white transition-all cursor-pointer font-bold px-10 shadow-lg hover:shadow-xl"
              }
            >
              {action === "approve"
                ? "✓ Confirm Approval"
                : "✗ Confirm Decline"}
            </Button>
          </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default ProposalResponse;
