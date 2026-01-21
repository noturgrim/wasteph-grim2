import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "../utils/toast";
import { Plus, Pencil, Trash2, Eye, EyeOff } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

import { AddShowcaseDialog } from "../components/showcase/AddShowcaseDialog";
import { EditShowcaseDialog } from "../components/showcase/EditShowcaseDialog";
import { DeleteConfirmationModal } from "../components/modals";
import {
  fetchAllShowcases,
  deleteShowcase,
  toggleShowcaseStatus,
} from "../../services/showcaseService";

const Showcase = () => {
  const { user } = useAuth();
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState(null);
  const [deletingShowcase, setDeletingShowcase] = useState(null);

  useEffect(() => {
    loadShowcases();
  }, []);

  const loadShowcases = async () => {
    try {
      setLoading(true);
      const data = await fetchAllShowcases();
      setShowcases(data || []);
    } catch (error) {
      console.error("Error loading showcases:", error);
      // Check if it's a database/table error
      if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
        toast.error("Database error. Please run 'npm run db:push' in the backend directory to create the showcase table.");
      } else {
        toast.error("Failed to load showcases");
      }
      setShowcases([]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    loadShowcases();
    toast.success("Showcase created successfully");
  };

  const handleEditSuccess = () => {
    setEditingShowcase(null);
    loadShowcases();
    toast.success("Showcase updated successfully");
  };

  const handleToggleStatus = async (showcase) => {
    try {
      await toggleShowcaseStatus(showcase.id);
      toast.success(
        `Showcase ${showcase.isActive ? "deactivated" : "activated"} successfully`
      );
      loadShowcases();
    } catch (error) {
      console.error("Error toggling showcase status:", error);
      toast.error("Failed to toggle showcase status");
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingShowcase) return;

    try {
      await deleteShowcase(deletingShowcase.id);
      toast.success("Showcase deleted successfully");
      setDeletingShowcase(null);
      loadShowcases();
    } catch (error) {
      console.error("Error deleting showcase:", error);
      toast.error("Failed to delete showcase");
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Showcase</h1>
          <p className="text-muted-foreground">
            Manage community impact showcase items displayed on the website
          </p>
        </div>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Showcase
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[80px]">Image</TableHead>
              <TableHead>Title</TableHead>
              <TableHead>Tagline</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-[100px]">Status</TableHead>
              <TableHead className="w-[150px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : showcases.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No showcases found. Create your first showcase to get started.
                </TableCell>
              </TableRow>
            ) : (
              showcases.map((showcase) => (
                <TableRow key={showcase.id}>
                  <TableCell>
                    {showcase.image ? (
                      <img
                        src={showcase.image}
                        alt={showcase.title}
                        className="h-12 w-12 rounded object-cover"
                      />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded bg-muted text-xs text-muted-foreground">
                        No image
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="font-medium">
                    {showcase.title}
                  </TableCell>
                  <TableCell className="max-w-[300px] truncate text-sm text-muted-foreground">
                    {showcase.tagline || "-"}
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDate(showcase.createdAt)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={showcase.isActive ? "default" : "secondary"}
                    >
                      {showcase.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleToggleStatus(showcase)}
                        title={
                          showcase.isActive
                            ? "Deactivate showcase"
                            : "Activate showcase"
                        }
                      >
                        {showcase.isActive ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setEditingShowcase(showcase)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeletingShowcase(showcase)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Dialogs */}
      <AddShowcaseDialog
        isOpen={isAddDialogOpen}
        onClose={() => setIsAddDialogOpen(false)}
        onSuccess={handleAddSuccess}
      />

      {editingShowcase && (
        <EditShowcaseDialog
          isOpen={!!editingShowcase}
          onClose={() => setEditingShowcase(null)}
          onSuccess={handleEditSuccess}
          showcase={editingShowcase}
        />
      )}

      <DeleteConfirmationModal
        isOpen={!!deletingShowcase}
        onClose={() => setDeletingShowcase(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete Showcase"
        description={`Are you sure you want to delete "${deletingShowcase?.title}"? This action cannot be undone.`}
      />
    </div>
  );
};

export default Showcase;
