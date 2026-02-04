import { useState, useEffect, useRef } from "react";
import { toast } from "../utils/toast";
import { Plus, Pencil, Trash2, Eye, EyeOff, Calendar, Image as ImageIcon, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import { AddShowcaseDialog } from "../components/showcase/AddShowcaseDialog";
import { EditShowcaseDialog } from "../components/showcase/EditShowcaseDialog";
import {
  fetchAllShowcases,
  deleteShowcase,
  toggleShowcaseStatus,
} from "../../services/showcaseService";

const Showcase = () => {
  const [showcases, setShowcases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingShowcase, setEditingShowcase] = useState(null);
  const [deletingShowcase, setDeletingShowcase] = useState(null);
  const [stats, setStats] = useState({ total: 0, active: 0, inactive: 0 });
  const [togglingId, setTogglingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadShowcases();
    }
  }, []);

  const loadShowcases = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const data = await fetchAllShowcases();
      setShowcases(data || []);
      
      // Calculate stats
      const total = data?.length || 0;
      const active = data?.filter(s => s.isActive).length || 0;
      const inactive = total - active;
      setStats({ total, active, inactive });
    } catch (error) {
      console.error("Error loading showcases:", error);
      // Check if it's a database/table error
      if (error.message.includes("500") || error.message.includes("Internal Server Error")) {
        toast.error("Database error. Please run 'npm run db:push' in the backend directory to create the showcase table.");
      } else {
        toast.error("Failed to load showcases");
      }
      setShowcases([]);
      setStats({ total: 0, active: 0, inactive: 0 });
    } finally {
      setLoading(false);
    }
  };

  const handleAddSuccess = () => {
    setIsAddDialogOpen(false);
    hasFetchedRef.current = false;
    loadShowcases();
    toast.success("Showcase created successfully");
  };

  const handleEditSuccess = () => {
    setEditingShowcase(null);
    hasFetchedRef.current = false;
    loadShowcases();
    toast.success("Showcase updated successfully");
  };

  const handleToggleStatus = async (showcase) => {
    setTogglingId(showcase.id);
    try {
      await toggleShowcaseStatus(showcase.id);
      toast.success(
        `Showcase ${showcase.isActive ? "deactivated" : "activated"} successfully`
      );
      hasFetchedRef.current = false;
      loadShowcases();
    } catch (error) {
      console.error("Error toggling showcase status:", error);
      toast.error("Failed to toggle showcase status");
    } finally {
      setTogglingId(null);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deletingShowcase) return;

    setDeletingId(deletingShowcase.id);
    try {
      await deleteShowcase(deletingShowcase.id);
      toast.success("Showcase deleted successfully");
      setDeletingShowcase(null);
      hasFetchedRef.current = false;
      loadShowcases();
    } catch (error) {
      console.error("Error deleting showcase:", error);
      toast.error("Failed to delete showcase");
    } finally {
      setDeletingId(null);
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
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total Showcases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {stats.active}
            </div>
          </CardContent>
        </Card>
        <Card className="dark:border-white/10 dark:bg-black/40">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Inactive</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-slate-600">
              {stats.inactive}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Card */}
      <Card className="dark:border-white/10 dark:bg-black/40">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Showcase Items</CardTitle>
              <CardDescription>
                Manage community impact showcase items displayed on the website
              </CardDescription>
            </div>
            <Button
              onClick={() => setIsAddDialogOpen(true)}
              className="bg-linear-to-r from-[#15803d] to-[#16a34a] hover:opacity-90"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Showcase
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Showcase List */}
          <div className="space-y-4">
            {loading ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-[#15803d]" />
                <p className="text-muted-foreground">Loading showcases...</p>
              </div>
            ) : showcases.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-muted-foreground">
                  No showcases found. Create your first showcase to get started.
                </p>
              </div>
            ) : (
              showcases.map((showcase) => (
                <div
                  key={showcase.id}
                  className="group rounded-lg border p-4 transition-all hover:shadow-lg border-slate-200 bg-white hover:border-[#15803d]/50 dark:border-white/10 dark:bg-white/5"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    {/* Left Section: Image + Content */}
                    <div className="flex flex-1 gap-4">
                      {/* Image */}
                      {showcase.image ? (
                        <img
                          src={showcase.image}
                          alt={showcase.title}
                          className="h-24 w-24 flex-shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <div className="flex h-24 w-24 flex-shrink-0 items-center justify-center rounded-lg bg-muted">
                          <ImageIcon className="h-8 w-8 text-muted-foreground" />
                        </div>
                      )}

                      {/* Content */}
                      <div className="flex-1 space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                          <h3
                            className="text-lg font-bold text-slate-900 dark:text-white"
                          >
                            {showcase.title}
                          </h3>
                          <Badge
                            className={
                              showcase.isActive
                                ? "bg-green-500/10 text-green-600 border-green-500/20"
                                : "bg-slate-500/10 text-slate-600 border-slate-500/20"
                            }
                          >
                            {showcase.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                        {showcase.tagline && (
                          <p
                            className="text-sm text-slate-600 dark:text-white/60"
                          >
                            {showcase.tagline}
                          </p>
                        )}
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Created {formatDate(showcase.createdAt)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Right Section: Actions */}
                    <div className="flex gap-2 sm:flex-col lg:flex-row">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleToggleStatus(showcase)}
                        disabled={togglingId === showcase.id}
                        className="flex-1 hover:bg-[#15803d]/10 hover:text-[#15803d] sm:flex-none"
                      >
                        {togglingId === showcase.id ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {showcase.isActive ? "Deactivating..." : "Activating..."}
                          </>
                        ) : showcase.isActive ? (
                          <>
                            <EyeOff className="mr-2 h-4 w-4" />
                            Deactivate
                          </>
                        ) : (
                          <>
                            <Eye className="mr-2 h-4 w-4" />
                            Activate
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setEditingShowcase(showcase)}
                        disabled={togglingId === showcase.id}
                        className="hover:bg-[#15803d]/10 hover:text-[#15803d]"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setDeletingShowcase(showcase)}
                        disabled={togglingId === showcase.id}
                        className="hover:bg-red-500/10 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

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

      <Dialog open={!!deletingShowcase} onOpenChange={() => setDeletingShowcase(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Showcase</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{deletingShowcase?.title}"? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeletingShowcase(null)}
              disabled={deletingId === deletingShowcase?.id}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deletingId === deletingShowcase?.id}
              className="bg-red-600 hover:bg-red-700"
            >
              {deletingId === deletingShowcase?.id ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Showcase;
