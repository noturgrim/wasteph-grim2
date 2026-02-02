import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText } from "lucide-react";

const INTERACTION_TYPES = [
  { value: "phone_call", label: "Phone Call" },
  { value: "site_visit", label: "Site Visit" },
  { value: "email", label: "Email" },
  { value: "meeting", label: "Meeting" },
  { value: "other", label: "Other" },
];

export const EditNoteDialog = ({ open, onOpenChange, note, onSuccess }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    interactionType: "",
    subject: "",
    content: "",
    interactionDate: "",
  });

  useEffect(() => {
    if (note) {
      setFormData({
        interactionType: note.interactionType,
        subject: note.subject,
        content: note.content,
        interactionDate: new Date(note.interactionDate)
          .toISOString()
          .slice(0, 16),
      });
    }
  }, [note]);

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const updateData = {
        ...formData,
        interactionDate: new Date(formData.interactionDate).toISOString(),
      };

      await onSuccess(note.id, updateData);
      onOpenChange(false);
    } catch (error) {
      console.error("Edit note error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!note) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-green-600" />
            Edit Client Note
          </DialogTitle>
          <DialogDescription>
            Update the details of this interaction
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="interactionType">Interaction Type *</Label>
              <Select
                value={formData.interactionType}
                onValueChange={(value) => handleChange("interactionType", value)}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  {INTERACTION_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="interactionDate">Interaction Date *</Label>
              <Input
                id="interactionDate"
                type="datetime-local"
                value={formData.interactionDate}
                onChange={(e) => handleChange("interactionDate", e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject *</Label>
            <Input
              id="subject"
              value={formData.subject}
              onChange={(e) => handleChange("subject", e.target.value)}
              placeholder="Brief summary of the interaction"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="content">Notes *</Label>
            <Textarea
              id="content"
              value={formData.content}
              onChange={(e) => handleChange("content", e.target.value)}
              placeholder="Detailed notes about the interaction"
              rows={8}
              required
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
