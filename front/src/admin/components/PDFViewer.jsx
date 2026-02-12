import { useState, useEffect } from "react";
import { X, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const IMAGE_TYPES = ["image/jpeg", "image/png", "image/gif", "image/webp"];

/**
 * Reusable PDF/Image Viewer Component
 * Displays PDF or images in a full-screen modal with loading and error states
 */
export function PDFViewer({
  fileUrl,
  fileName,
  fileType,
  onClose,
  title = "File Preview",
  isOpen = true,
}) {
  const isImage = fileType && IMAGE_TYPES.includes(fileType);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  // ESC key to close JUST the viewer (not underlying dialogs)
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape" && isOpen) {
        e.stopPropagation();
        e.preventDefault();
        onClose();
      }
    };
    // Use capture phase so we intercept before other listeners (e.g. dialogs)
    window.addEventListener("keydown", handleEsc, true);
    return () => window.removeEventListener("keydown", handleEsc, true);
  }, [onClose, isOpen]);

  // Reset states when fileUrl changes
  useEffect(() => {
    if (fileUrl) {
      setIsLoading(true);
      setHasError(false);
    }
  }, [fileUrl]);

  const handleLoad = () => {
    setIsLoading(false);
    setHasError(false);
  };

  const handleError = (e) => {
    console.error("PDF load error:", e);
    setIsLoading(false);
    setHasError(true);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 bg-black/90 flex items-center justify-center p-4 sm:p-6">
      <div className="relative w-full h-full max-w-7xl flex flex-col bg-white dark:bg-[#111111] rounded-xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-[#111111] shrink-0">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
              {title}
            </h2>
            {fileName && (
              <span className="text-sm text-gray-500 dark:text-gray-400 truncate hidden sm:block">
                · {fileName}
              </span>
            )}
          </div>

          {/* Close Button */}
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClose();
            }}
            className="flex items-center gap-2"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Close</span>
          </Button>
        </div>

        {/* PDF Content */}
        <div className="flex-1 relative bg-gray-50 dark:bg-[#0a0a0a] overflow-hidden">
          {/* Loading State */}
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] z-10">
              <div className="flex flex-col items-center gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-green-600" />
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Loading...
                </p>
              </div>
            </div>
          )}

          {/* Error State */}
          {hasError && !isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50 dark:bg-[#0a0a0a] z-10">
              <div className="text-center px-6 max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-50 dark:bg-red-900/20 mb-4">
                  <AlertCircle className="h-8 w-8 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  Failed to load file
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  The file could not be displayed. Please try again or contact support.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}

          {/* Content: img for images, iframe for PDFs and other docs */}
          {fileUrl ? (
            isImage ? (
              <div className="w-full h-full flex items-center justify-center p-4 overflow-auto bg-gray-100 dark:bg-black">
                <img
                  src={fileUrl}
                  alt={fileName || "Image"}
                  className="max-w-full max-h-full object-contain"
                  onLoad={handleLoad}
                  onError={handleError}
                />
              </div>
            ) : (
              <iframe
                src={fileUrl}
                className="w-full h-full border-0 bg-white"
                title={fileName || "Document Viewer"}
                onLoad={handleLoad}
                onError={handleError}
              />
            )
          ) : !isLoading && (
            <div className="flex items-center justify-center h-full">
              <div className="text-center px-6 max-w-md">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-yellow-50 dark:bg-yellow-900/20 mb-4">
                  <AlertCircle className="h-8 w-8 text-yellow-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  No file available
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  The file could not be loaded. Please try again.
                </p>
                <Button variant="outline" onClick={onClose}>
                  Close
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Click outside to close */}
      <div
        className="absolute inset-0 -z-10"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          onClose();
        }}
        aria-hidden="true"
      />
    </div>
  );
}
