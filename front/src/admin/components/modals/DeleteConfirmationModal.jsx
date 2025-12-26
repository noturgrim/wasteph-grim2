import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AlertTriangle, Loader2 } from "lucide-react";

/**
 * Reusable Delete Confirmation Modal
 *
 * @param {boolean} open - Whether the modal is open
 * @param {Function} onOpenChange - Callback to change open state
 * @param {Function} onConfirm - Callback when delete is confirmed
 * @param {string} title - Modal title (default: "Delete")
 * @param {string} itemName - Name of the item being deleted
 * @param {string} itemType - Type of item (e.g., "inquiry", "lead", "user")
 * @param {Array} actionsList - List of actions that will occur (optional)
 * @param {string} warningMessage - Warning message to display
 */
export function DeleteConfirmationModal({
  open,
  onOpenChange,
  onConfirm,
  title = "Delete",
  itemName,
  itemType = "item",
  actionsList = [],
  warningMessage = "This action cannot be undone.",
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      handleClose();
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <AlertTriangle className="h-5 w-5 text-red-600" />
            <span>{title} {itemType.charAt(0).toUpperCase() + itemType.slice(1)}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-sm text-foreground">
            Are you sure you want to delete {itemName ? (
              <>
                {itemType} with user name <span className="font-semibold">{itemName}</span>
              </>
            ) : (
              `this ${itemType}`
            )}?
          </p>

          {actionsList && actionsList.length > 0 && (
            <div>
              <p className="text-sm text-gray-600 mb-2">This action will:</p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600 ml-4">
                {actionsList.map((action, index) => (
                  <li key={index}>{action}</li>
                ))}
              </ul>
            </div>
          )}

          {warningMessage && (
            <p className="text-red-600 font-medium text-sm">
              {warningMessage}
            </p>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <AlertTriangle className="mr-2 h-4 w-4" />
                {title} {itemType.charAt(0).toUpperCase() + itemType.slice(1)}
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
