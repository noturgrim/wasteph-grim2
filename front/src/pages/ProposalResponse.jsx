import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, AlertCircle, FileText, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        const response = await fetch(`${API_URL}/proposals/public/${proposalId}/status?token=${token}`);
        const data = await response.json();

        if (response.ok) {
          setProposalDetails(data.data);
          setStage("confirmation");
        } else {
          setStage("error");
          setMessage(data.message || data.error || "Failed to load proposal details");
        }
      } catch (error) {
        console.error("Error loading proposal:", error);
        setStage("error");
        setMessage("An error occurred while loading the proposal. Please try again or contact us directly.");
      }
    };

    loadProposalDetails();
  }, [proposalId, token]);

  // Handle user confirmation
  const handleConfirm = async () => {
    setStage("processing");

    try {
      const endpoint = action === "approve" 
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
        setMessage(data.message || "Your response has been recorded successfully");
        setResponseData(data.data);
      } else {
        setStage("error");
        setMessage(data.message || data.error || "Failed to record your response");
      }
    } catch (error) {
      console.error("Error recording response:", error);
      setStage("error");
      setMessage("An error occurred while processing your response. Please try again or contact us directly.");
    }
  };

  const handleCancel = () => {
    window.close(); // Close the tab
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl shadow-lg">
        <CardHeader className="text-center border-b">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {stage === "loading" && "Loading Proposal..."}
            {stage === "confirmation" && `${action === "approve" ? "Approve" : "Reject"} Proposal`}
            {stage === "processing" && "Processing Your Response..."}
            {stage === "success" && "Response Recorded"}
            {stage === "error" && "Unable to Process"}
          </CardTitle>
          {stage === "confirmation" && (
            <CardDescription className="text-base mt-2">
              Please confirm your decision for this proposal
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6 mt-6">
          {/* Loading State */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading proposal details...</p>
            </div>
          )}

          {/* Confirmation State */}
          {stage === "confirmation" && proposalDetails && (
            <div className="space-y-6">
              {/* Proposal Details */}
              <div className="bg-white border rounded-lg p-5 space-y-4">
                <h3 className="font-semibold text-lg text-gray-900 border-b pb-2">
                  Proposal Information
                </h3>
                
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Proposal ID:</span>
                    <span className="font-medium">{proposalId?.substring(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sent Date:</span>
                    <span className="font-medium">
                      {proposalDetails.sentAt ? new Date(proposalDetails.sentAt).toLocaleDateString() : "N/A"}
                    </span>
                  </div>
                  {proposalDetails.clientResponse && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Current Status:</span>
                      <span className={`font-medium capitalize ${
                        proposalDetails.clientResponse === "approved" ? "text-green-600" : "text-orange-600"
                      }`}>
                        {proposalDetails.clientResponse}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Warning Box */}
              <div className={`border rounded-lg p-4 ${
                action === "approve" 
                  ? "bg-amber-50 border-amber-200" 
                  : "bg-orange-50 border-orange-200"
              }`}>
                <div className="flex items-start gap-3">
                  <AlertTriangle className={`h-5 w-5 mt-0.5 ${
                    action === "approve" ? "text-amber-600" : "text-orange-600"
                  }`} />
                  <div className="flex-1">
                    <p className={`text-sm font-medium ${
                      action === "approve" ? "text-amber-900" : "text-orange-900"
                    }`}>
                      {action === "approve" 
                        ? "You are about to approve this proposal"
                        : "You are about to reject this proposal"
                      }
                    </p>
                    <p className={`text-sm mt-1 ${
                      action === "approve" ? "text-amber-700" : "text-orange-700"
                    }`}>
                      {action === "approve"
                        ? "By approving, you agree to the terms and conditions outlined in the proposal."
                        : "This action will notify our team that you have declined this proposal."
                      }
                    </p>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t">
                <Button
                  onClick={handleCancel}
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirm}
                  className={`px-6 ${
                    action === "approve"
                      ? "bg-green-600 hover:bg-green-700"
                      : "bg-orange-600 hover:bg-orange-700"
                  }`}
                >
                  {action === "approve" ? "Confirm Approval" : "Confirm Rejection"}
                </Button>
              </div>
            </div>
          )}

          {/* Processing State */}
          {stage === "processing" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Processing your response...</p>
            </div>
          )}

          {/* Success State */}
          {stage === "success" && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className={`rounded-full p-4 mb-4 ${
                action === "approve" 
                  ? "bg-green-100" 
                  : "bg-orange-100"
              }`}>
                {action === "approve" ? (
                  <CheckCircle className="h-16 w-16 text-green-600" />
                ) : (
                  <XCircle className="h-16 w-16 text-orange-600" />
                )}
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-center">
                {action === "approve" ? "Thank You!" : "Response Received"}
              </h3>
              
              <p className="text-gray-700 text-center mb-6">
                {message}
              </p>

              {action === "approve" && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-5 w-full">
                  <h4 className="font-semibold text-green-900 mb-3">What happens next?</h4>
                  <ul className="text-sm text-green-800 space-y-2">
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>Our sales team has been notified of your approval</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>They will finalize the contract details and pricing</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>You'll receive the final contract document via email</span>
                    </li>
                    <li className="flex items-start">
                      <span className="mr-2">•</span>
                      <span>A team member will contact you shortly to discuss next steps</span>
                    </li>
                  </ul>
                </div>
              )}

              {action === "reject" && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-5 w-full">
                  <p className="text-sm text-orange-800">
                    We appreciate you taking the time to review our proposal. 
                    If you have any questions or would like to discuss alternative options, 
                    please don't hesitate to contact us.
                  </p>
                </div>
              )}

              {responseData && (
                <div className="border-t pt-4 mt-6 w-full">
                  <p className="text-xs text-gray-500 text-center">
                    Response ID: {responseData.proposalId?.substring(0, 8)}...
                    <br />
                    Recorded at: {new Date(responseData.respondedAt).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Error State */}
          {stage === "error" && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-red-100 p-4 mb-4">
                <AlertCircle className="h-16 w-16 text-red-600" />
              </div>
              
              <h3 className="text-xl font-semibold mb-2 text-center text-red-900">
                Something Went Wrong
              </h3>
              
              <p className="text-gray-700 text-center mb-6">
                {message}
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-5 w-full">
                <p className="text-sm text-red-800 mb-2 font-medium">
                  Possible reasons:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This link has already been used</li>
                  <li>• The link has expired</li>
                  <li>• The link is invalid</li>
                </ul>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(stage === "error" || stage === "success") && (
            <div className="border-t pt-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">
                Need Assistance?
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="text-center">
                  <strong className="text-green-700">Email:</strong>{" "}
                  <a href="mailto:info@wasteph.com" className="text-blue-600 hover:underline">
                    info@wasteph.com
                  </a>
                </p>
                <p className="text-center">
                  <strong className="text-green-700">Phone:</strong>{" "}
                  <a href="tel:+639562461503" className="text-blue-600 hover:underline">
                    +63 956 246 1503
                  </a>
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ProposalResponse;
