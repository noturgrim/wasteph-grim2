import { useState, useRef } from "react";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { toast } from "sonner";
import { api } from "@admin/services/api";

const ProfilePictureUpload = ({ open, onOpenChange, currentUser, onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef(null);

  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const validateFile = (file) => {
    if (!file) {
      toast.error("No file selected");
      return false;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast.error("Invalid file type. Please upload a JPG, PNG, WEBP, or GIF image.");
      return false;
    }

    if (file.size > MAX_FILE_SIZE) {
      toast.error("File too large. Maximum size is 5MB.");
      return false;
    }

    return true;
  };

  const handleFileSelect = (file) => {
    if (!validateFile(file)) {
      return;
    }

    setSelectedFile(file);

    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelect(e.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file first");
      return;
    }

    setUploading(true);

    try {
      const response = await api.updateProfilePicture(currentUser.id, selectedFile);

      if (response.success) {
        toast.success("Profile picture updated successfully!");

        // Call the success callback to refresh user data
        if (onUploadSuccess) {
          onUploadSuccess();
        }

        // Reset state
        setSelectedFile(null);
        setPreviewUrl(null);
        onOpenChange(false);
      }
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      toast.error(error.message || "Failed to upload profile picture");
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleClose = () => {
    if (!uploading) {
      handleRemove();
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Profile Picture</DialogTitle>
          <DialogDescription>
            Choose an image to upload as your profile picture. Max size: 5MB. Supported formats: JPG, PNG, WEBP, GIF.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Preview Area */}
          <div className="flex justify-center">
            <Avatar className="h-32 w-32 border-4 border-gray-200 dark:border-gray-700">
              {previewUrl ? (
                <AvatarImage src={previewUrl} alt="Preview" />
              ) : currentUser?.profilePictureUrl ? (
                <AvatarImage src={currentUser.profilePictureUrl} alt={currentUser.firstName} />
              ) : (
                <AvatarFallback className="bg-gradient-to-br from-green-400 to-emerald-500 text-white text-4xl font-semibold">
                  {currentUser?.firstName?.[0] || currentUser?.email?.[0] || "U"}
                </AvatarFallback>
              )}
            </Avatar>
          </div>

          {/* Upload Area */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive
                ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-400"
                : "border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500"
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              onChange={handleFileInputChange}
              className="hidden"
              disabled={uploading}
            />

            {selectedFile ? (
              <div className="space-y-2">
                <Camera className="h-8 w-8 mx-auto text-green-600 dark:text-green-400" />
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedFile.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemove}
                  disabled={uploading}
                  className="mt-2"
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <Upload className="h-8 w-8 mx-auto text-gray-400 dark:text-gray-500" />
                <div>
                  <Button
                    type="button"
                    variant="link"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                  >
                    Click to upload
                  </Button>
                  <span className="text-sm text-gray-600 dark:text-gray-300"> or drag and drop</span>
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">PNG, JPG, WEBP, GIF up to 5MB</p>
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={uploading}
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!selectedFile || uploading}
            className="bg-green-600 hover:bg-green-700"
          >
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ProfilePictureUpload;
