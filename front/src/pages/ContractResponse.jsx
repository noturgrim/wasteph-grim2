import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Loader2,
  AlertCircle,
  FileText,
  Upload,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const API_URL = import.meta.env.VITE_API_URL;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ContractResponse = () => {
  const { contractId } = useParams();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const fileInputRef = useRef(null);

  const [stage, setStage] = useState("loading"); // loading, confirmation, uploading, success, error
  const [message, setMessage] = useState("");
  const [contractDetails, setContractDetails] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [fileError, setFileError] = useState("");

  // Load contract details
  useEffect(() => {
    const loadContractDetails = async () => {
      if (!token) {
        setStage("error");
        setMessage("Invalid or missing authentication token");
        return;
      }

      try {
        const response = await fetch(
          `${API_URL}/contracts/public/${contractId}/status?token=${token}`,
        );
        const data = await response.json();

        if (response.ok) {
          if (data.data.alreadySigned) {
            setStage("error");
            setMessage(
              "This contract has already been signed. Please contact us if you need assistance.",
            );
          } else {
            setContractDetails(data.data);
            setStage("confirmation");
          }
        } else {
          setStage("error");
          setMessage(
            data.message || data.error || "Failed to load contract details",
          );
        }
      } catch (error) {
        console.error("Error loading contract:", error);
        setStage("error");
        setMessage(
          "An error occurred while loading the contract. Please try again or contact us directly.",
        );
      }
    };

    loadContractDetails();
  }, [contractId, token]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    setFileError("");

    if (!file) {
      setSelectedFile(null);
      return;
    }

    if (file.type !== "application/pdf") {
      setFileError("Only PDF files are allowed");
      setSelectedFile(null);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setFileError("File size must be less than 10MB");
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setStage("uploading");

    try {
      const formData = new FormData();
      formData.append("signedContract", selectedFile);

      const response = await fetch(
        `${API_URL}/contracts/public/${contractId}/submit?token=${token}`,
        {
          method: "POST",
          body: formData,
        },
      );

      const data = await response.json();

      if (response.ok) {
        setStage("success");
        setMessage(
          data.message || "Your signed contract has been received successfully",
        );
      } else {
        setStage("error");
        setMessage(
          data.message || data.error || "Failed to upload your signed contract",
        );
      }
    } catch (error) {
      console.error("Error uploading contract:", error);
      setStage("error");
      setMessage(
        "An error occurred while uploading your contract. Please try again or contact us directly.",
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-0 shadow-lg">
        <CardHeader className="text-center border-b border-gray-200">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center">
              <FileText className="h-8 w-8 text-green-700" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold">
            {stage === "loading" && "Loading Contract..."}
            {stage === "confirmation" && "Upload Signed Contract"}
            {stage === "uploading" && "Uploading..."}
            {stage === "success" && "Contract Received"}
            {stage === "error" && "Unable to Process"}
          </CardTitle>
          {stage === "confirmation" && (
            <CardDescription className="text-base mt-2">
              Please upload your signed copy of the contract below
            </CardDescription>
          )}
        </CardHeader>

        <CardContent className="space-y-6 mt-6">
          {/* Loading State */}
          {stage === "loading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Loading contract details...</p>
            </div>
          )}

          {/* Confirmation State */}
          {stage === "confirmation" && contractDetails && (
            <div className="space-y-6">
              {/* Contract Details */}
              <div className="bg-white border border-gray-200 rounded-lg p-5 space-y-4 shadow-sm">
                <h3 className="font-semibold text-lg text-gray-900 border-b border-gray-200 pb-2">
                  Contract Information
                </h3>

                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Company:</span>
                    <span className="font-medium">
                      {contractDetails.companyName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Contact Person:</span>
                    <span className="font-medium">
                      {contractDetails.clientName || "N/A"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Sent Date:</span>
                    <span className="font-medium">
                      {contractDetails.sentAt
                        ? new Date(contractDetails.sentAt).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Upload className="h-5 w-5 mt-0.5 text-blue-600" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900">
                      Upload your signed contract
                    </p>
                    <p className="text-sm mt-1 text-blue-700">
                      Please sign the attached contract PDF and upload the
                      signed copy here. Only PDF files are accepted (max 10MB).
                    </p>
                  </div>
                </div>
              </div>

              {/* File Upload */}
              <div className="space-y-3">
                <div
                  className="rounded-lg p-6 text-center cursor-pointer bg-white border-0 shadow-md hover:shadow-lg transition-shadow duration-200"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {selectedFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <FileText className="h-5 w-5 text-green-600" />
                      <span className="text-sm text-green-700 font-medium">
                        {selectedFile.name}
                      </span>
                      <span className="text-xs text-gray-500">
                        ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-2">
                      <Upload className="h-8 w-8 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Click to select your signed contract PDF
                      </p>
                      <p className="text-xs text-gray-400">
                        PDF only, max 10MB
                      </p>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </div>

                {fileError && (
                  <p className="text-sm text-red-600">{fileError}</p>
                )}
              </div>

              {/* Action Button */}
              <div className="flex justify-end pt-2">
                <Button
                  onClick={handleUpload}
                  disabled={!selectedFile}
                  className="px-6 !bg-green-600 hover:!bg-green-700 !text-white border-0 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Signed Contract
                </Button>
              </div>
            </div>
          )}

          {/* Uploading State */}
          {stage === "uploading" && (
            <div className="flex flex-col items-center justify-center py-12">
              <Loader2 className="h-16 w-16 animate-spin text-blue-600 mb-4" />
              <p className="text-gray-600">Uploading your signed contract...</p>
            </div>
          )}

          {/* Success State */}
          {stage === "success" && (
            <div className="flex flex-col items-center justify-center py-6">
              <div className="rounded-full bg-green-100 p-4 mb-4">
                <CheckCircle className="h-16 w-16 text-green-600" />
              </div>

              <h3 className="text-xl font-semibold mb-2 text-center">
                Thank You!
              </h3>

              <p className="text-gray-700 text-center mb-6">{message}</p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-5 w-full">
                <h4 className="font-semibold text-green-900 mb-3">
                  What happens next?
                </h4>
                <ul className="text-sm text-green-800 space-y-2">
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your signed contract has been securely received</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>Your account has been set up in our system</span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      A team member will contact you shortly to discuss
                      onboarding and next steps
                    </span>
                  </li>
                  <li className="flex items-start">
                    <span className="mr-2">•</span>
                    <span>
                      You will receive a confirmation email with your account
                      details
                    </span>
                  </li>
                </ul>
              </div>
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

              <p className="text-gray-700 text-center mb-6">{message}</p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-5 w-full">
                <p className="text-sm text-red-800 mb-2 font-medium">
                  Possible reasons:
                </p>
                <ul className="text-sm text-red-700 space-y-1">
                  <li>• This link has already been used</li>
                  <li>• The link is invalid</li>
                  <li>• The uploaded file was not a valid PDF</li>
                </ul>
              </div>
            </div>
          )}

          {/* Contact Information */}
          {(stage === "error" || stage === "success") && (
            <div className="border-t border-gray-200 pt-6">
              <h4 className="font-semibold text-gray-900 mb-3 text-center">
                Need Assistance?
              </h4>
              <div className="text-sm text-gray-600 space-y-2">
                <p className="text-center">
                  <strong className="text-green-700">Email:</strong>{" "}
                  <a
                    href="mailto:info@wasteph.com"
                    className="text-blue-600 hover:underline"
                  >
                    info@wasteph.com
                  </a>
                </p>
                <p className="text-center">
                  <strong className="text-green-700">Phone:</strong>{" "}
                  <a
                    href="tel:+639562461503"
                    className="text-blue-600 hover:underline"
                  >
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

export default ContractResponse;
