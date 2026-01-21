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
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { updateShowcase } from "../../../services/showcaseService";

export function EditShowcaseDialog({ isOpen, onClose, onSuccess, showcase }) {
  const [formData, setFormData] = useState({
    title: "",
    tagline: "",
    description: "",
    image: "",
    link: "",
    displayOrder: 0,
  });

  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (showcase) {
      setFormData({
        title: showcase.title || "",
        tagline: showcase.tagline || "",
        description: showcase.description || "",
        image: showcase.image || "",
        link: showcase.link || "",
        displayOrder: showcase.displayOrder || 0,
      });
    }
  }, [showcase]);

  const validateForm = () => {
    const errors = {};
    if (!formData.title?.trim()) {
      errors.title = "Title is required";
    }
    if (!formData.description?.trim()) {
      errors.description = "Description is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      await updateShowcase(showcase.id, formData);
      onSuccess();
    } catch (error) {
      console.error("Error updating showcase:", error);
      setFormErrors({ submit: error.message || "Failed to update showcase" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenChange = (open) => {
    if (!open) {
      setFormErrors({});
      onClose();
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Showcase</DialogTitle>
          <DialogDescription>
            Update the showcase item details
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-destructive">*</span>
              </Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="Enter showcase title"
                className={formErrors.title ? "border-destructive" : ""}
              />
              {formErrors.title && (
                <p className="text-sm text-destructive">{formErrors.title}</p>
              )}
            </div>

            {/* Tagline */}
            <div className="space-y-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input
                id="tagline"
                value={formData.tagline}
                onChange={(e) => handleChange("tagline", e.target.value)}
                placeholder="Enter tagline (optional)"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">
                Description <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleChange("description", e.target.value)}
                placeholder="Enter description"
                rows={4}
                className={formErrors.description ? "border-destructive" : ""}
              />
              {formErrors.description && (
                <p className="text-sm text-destructive">
                  {formErrors.description}
                </p>
              )}
            </div>

            {/* Image URL */}
            <div className="space-y-2">
              <Label htmlFor="image">Image URL</Label>
              <Input
                id="image"
                value={formData.image}
                onChange={(e) => handleChange("image", e.target.value)}
                placeholder="https://example.com/image.jpg"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Enter a direct URL to the image
              </p>
            </div>

            {/* Link */}
            <div className="space-y-2">
              <Label htmlFor="link">External Link</Label>
              <Input
                id="link"
                value={formData.link}
                onChange={(e) => handleChange("link", e.target.value)}
                placeholder="https://example.com (optional)"
                type="url"
              />
              <p className="text-xs text-muted-foreground">
                Optional link for "Read More" button
              </p>
            </div>

            {/* Display Order */}
            <div className="space-y-2">
              <Label htmlFor="displayOrder">Display Order</Label>
              <Input
                id="displayOrder"
                type="number"
                value={formData.displayOrder}
                onChange={(e) =>
                  handleChange("displayOrder", parseInt(e.target.value) || 0)
                }
                placeholder="0"
              />
              <p className="text-xs text-muted-foreground">
                Higher numbers appear first
              </p>
            </div>

            {formErrors.submit && (
              <p className="text-sm text-destructive">{formErrors.submit}</p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                "Update Showcase"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
