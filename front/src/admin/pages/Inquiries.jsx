import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { api } from "../services/api";
import { toast } from "sonner";
import { Plus, Loader2, SlidersHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";

import { DataTable } from "../components/DataTable";
import { FacetedFilter } from "../components/FacetedFilter";
import { SearchInput } from "../components/SearchInput";
import { StatusBadge } from "../components/StatusBadge";
import { DeleteConfirmationModal } from "../components/modals";
import { createColumns } from "./inquiries/columns";
import { format } from "date-fns";

export default function Inquiries() {
  const { user } = useAuth();
  const [inquiries, setInquiries] = useState([]);
  const [allInquiries, setAllInquiries] = useState([]); // Store all inquiries for counting
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [statusFilter, setStatusFilter] = useState([]);
  const [sourceFilter, setSourceFilter] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialogs
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isConvertDialogOpen, setIsConvertDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState(null);

  // Form data
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    message: "",
    source: "phone",
  });

  // Submission states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // Fetch all inquiries (for counts)
  useEffect(() => {
    fetchAllInquiries();
  }, []);

  // Fetch filtered inquiries
  useEffect(() => {
    fetchInquiries();
  }, [statusFilter, sourceFilter, searchTerm]);

  const fetchAllInquiries = async () => {
    try {
      const response = await api.getInquiries({});
      setAllInquiries(response.data || response);
    } catch (error) {
      console.error("Failed to fetch all inquiries:", error);
    }
  };

  const fetchInquiries = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInquiries({
        status: statusFilter.length > 0 ? statusFilter.join(",") : undefined,
        source: sourceFilter.length > 0 ? sourceFilter.join(",") : undefined,
        search: searchTerm || undefined,
      });
      setInquiries(response.data || response);
    } catch (error) {
      toast.error(error.message || "Failed to fetch inquiries");
    } finally {
      setIsLoading(false);
    }
  };

  // Get count for each status from all inquiries
  const getStatusCount = (status) => {
    return allInquiries.filter((inquiry) => inquiry.status === status).length;
  };

  // Get count for each source from all inquiries
  const getSourceCount = (source) => {
    return allInquiries.filter((inquiry) => inquiry.source === source).length;
  };

  // Form validation
  const validateForm = () => {
    const errors = {};

    if (!formData.name?.trim()) {
      errors.name = "Name is required.";
    }

    if (!formData.email?.trim()) {
      errors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = "Please enter a valid email address.";
    }

    if (!formData.message?.trim()) {
      errors.message = "Message is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // CRUD Handlers
  const handleCreateInquiry = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await api.createInquiry(formData);
      toast.success("Inquiry created successfully");
      setIsCreateDialogOpen(false);
      resetFormData();
      setFormErrors({});
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to create inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateInquiry = async (e) => {
    e.preventDefault();

    // Validate required fields
    const errors = {};
    if (!formData.name.trim()) {
      errors.name = "Name is required";
    }
    if (!formData.email.trim()) {
      errors.email = "Email is required";
    }
    if (!formData.message.trim()) {
      errors.message = "Message is required";
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await api.updateInquiry(selectedInquiry.id, {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        message: formData.message,
        source: formData.source,
        status: formData.status,
        notes: formData.notes,
      });
      toast.success("Inquiry updated successfully");
      setIsEditDialogOpen(false);
      setFormErrors({});
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to update inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConvertToLead = async () => {
    setIsSubmitting(true);
    try {
      await api.convertInquiryToLead(selectedInquiry.id);
      toast.success("Inquiry converted to lead successfully");
      setIsConvertDialogOpen(false);
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to convert inquiry");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteInquiry = (inquiry) => {
    setSelectedInquiry(inquiry);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.deleteInquiry(selectedInquiry.id);
      toast.success("Inquiry deleted successfully");
      fetchAllInquiries();
      fetchInquiries();
    } catch (error) {
      toast.error(error.message || "Failed to delete inquiry");
      throw error;
    }
  };

  const resetFormData = () => {
    setFormData({
      name: "",
      email: "",
      phone: "",
      company: "",
      message: "",
      source: "phone",
    });
  };

  // Table columns setup
  const columns = createColumns({
    onView: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsViewDialogOpen(true);
    },
    onEdit: (inquiry) => {
      setSelectedInquiry(inquiry);
      setFormData({
        name: inquiry.name,
        email: inquiry.email,
        phone: inquiry.phone || "",
        company: inquiry.company || "",
        message: inquiry.message,
        source: inquiry.source || "phone",
        status: inquiry.status,
        notes: inquiry.notes || "",
      });
      setIsEditDialogOpen(true);
    },
    onConvert: (inquiry) => {
      setSelectedInquiry(inquiry);
      setIsConvertDialogOpen(true);
    },
    onDelete: handleDeleteInquiry,
    userRole: user?.role,
  });

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Inquiries</h1>
          <p className="text-muted-foreground">Manage inquiry leads</p>
        </div>
        <Button onClick={() => {
          resetFormData();
          setFormErrors({});
          setIsCreateDialogOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Add Inquiry
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search inquiries..."
          />

          <FacetedFilter
            title="Status"
            options={["new", "contacted", "qualified", "converted", "closed"]}
            selectedValues={statusFilter}
            onSelectionChange={setStatusFilter}
            getCount={getStatusCount}
          />

          <FacetedFilter
            title="Source"
            options={["website", "facebook", "email", "phone", "walk-in", "cold-approach"]}
            selectedValues={sourceFilter}
            onSelectionChange={setSourceFilter}
            getCount={getSourceCount}
          />
        </div>

        {/* View Options */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm">
              <SlidersHorizontal className="mr-2 h-4 w-4" />
              View
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-[150px]">
            <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {columns
              .filter((column) => column.accessorKey)
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.accessorKey}
                    className="capitalize"
                    checked={true}
                  >
                    {column.accessorKey}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={inquiries}
        isLoading={isLoading}
        emptyMessage="No inquiries found"
        pageSize={10}
        showViewOptions={false}
      />

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Inquiry</DialogTitle>
            <DialogDescription>
              Create a new inquiry from phone, email, or other sources
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateInquiry} className="space-y-4">
            <div>
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => {
                  setFormData({ ...formData, name: e.target.value });
                  if (formErrors.name) {
                    setFormErrors({ ...formErrors, name: null });
                  }
                }}
                className={formErrors.name ? "border-red-500" : ""}
              />
              {formErrors.name && (
                <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => {
                  setFormData({ ...formData, email: e.target.value });
                  if (formErrors.email) {
                    setFormErrors({ ...formErrors, email: null });
                  }
                }}
                className={formErrors.email ? "border-red-500" : ""}
              />
              {formErrors.email && (
                <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="company">Company</Label>
              <Input
                id="company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="source">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(val) =>
                  setFormData({ ...formData, source: val })
                }
              >
                <SelectTrigger id="source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="cold-approach">Cold Approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="message">Message *</Label>
              <Textarea
                id="message"
                rows={4}
                value={formData.message}
                onChange={(e) => {
                  setFormData({ ...formData, message: e.target.value });
                  if (formErrors.message) {
                    setFormErrors({ ...formErrors, message: null });
                  }
                }}
                className={formErrors.message ? "border-red-500" : ""}
              />
              {formErrors.message && (
                <p className="text-sm text-red-500 mt-1">{formErrors.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Create Inquiry
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit Inquiry</DialogTitle>
            <DialogDescription>
              Update the inquiry here. Click save changes when you're done.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleUpdateInquiry} className="space-y-4 mt-4">
            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <Label htmlFor="edit-name" className="text-right pt-2">Name</Label>
              <div className="flex-1">
                <Input
                  id="edit-name"
                  value={formData.name}
                  onChange={(e) => {
                    setFormData({ ...formData, name: e.target.value });
                    if (formErrors.name) {
                      setFormErrors({ ...formErrors, name: null });
                    }
                  }}
                  className={formErrors.name ? "border-red-500" : ""}
                />
                {formErrors.name && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.name}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <Label htmlFor="edit-email" className="text-right pt-2">Email</Label>
              <div className="flex-1">
                <Input
                  id="edit-email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => {
                    setFormData({ ...formData, email: e.target.value });
                    if (formErrors.email) {
                      setFormErrors({ ...formErrors, email: null });
                    }
                  }}
                  className={formErrors.email ? "border-red-500" : ""}
                />
                {formErrors.email && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.email}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">Phone Number</Label>
              <Input
                id="edit-phone"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label htmlFor="edit-company" className="text-right">Company</Label>
              <Input
                id="edit-company"
                value={formData.company}
                onChange={(e) =>
                  setFormData({ ...formData, company: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label htmlFor="edit-source" className="text-right">Source</Label>
              <Select
                value={formData.source}
                onValueChange={(val) =>
                  setFormData({ ...formData, source: val })
                }
              >
                <SelectTrigger id="edit-source">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="website">Website</SelectItem>
                  <SelectItem value="phone">Phone</SelectItem>
                  <SelectItem value="facebook">Facebook</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="walk-in">Walk-in</SelectItem>
                  <SelectItem value="cold-approach">Cold Approach</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-center gap-4">
              <Label htmlFor="edit-status" className="text-right">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  setFormData({ ...formData, status: val })
                }
              >
                <SelectTrigger id="edit-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">New</SelectItem>
                  <SelectItem value="contacted">Contacted</SelectItem>
                  <SelectItem value="qualified">Qualified</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <Label htmlFor="edit-message" className="text-right pt-2">Message</Label>
              <div className="flex-1">
                <Textarea
                  id="edit-message"
                  rows={4}
                  value={formData.message}
                  onChange={(e) => {
                    setFormData({ ...formData, message: e.target.value });
                    if (formErrors.message) {
                      setFormErrors({ ...formErrors, message: null });
                    }
                  }}
                  className={formErrors.message ? "border-red-500" : ""}
                />
                {formErrors.message && (
                  <p className="text-sm text-red-500 mt-1">{formErrors.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-[120px_1fr] items-start gap-4">
              <Label htmlFor="edit-notes" className="text-right pt-2">Notes</Label>
              <Textarea
                id="edit-notes"
                rows={3}
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                placeholder="Add internal notes"
              />
            </div>

            <DialogFooter className="mt-6">
              <Button type="submit" disabled={isSubmitting} className="w-full sm:w-auto">
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Convert to Lead Dialog */}
      <Dialog open={isConvertDialogOpen} onOpenChange={setIsConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert to Lead</DialogTitle>
            <DialogDescription>
              This will create a new lead from this inquiry. You can add service
              details later in the Leads page.
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-3">
              <div className="rounded-lg border p-4 space-y-2">
                <p>
                  <strong>Name:</strong> {selectedInquiry.name}
                </p>
                <p>
                  <strong>Email:</strong> {selectedInquiry.email}
                </p>
                <p>
                  <strong>Phone:</strong> {selectedInquiry.phone || "N/A"}
                </p>
                <p>
                  <strong>Company:</strong> {selectedInquiry.company || "N/A"}
                </p>
              </div>

              <p className="text-sm text-muted-foreground">
                The inquiry message will be added as a note in the lead. Service
                requirement fields (address, waste type, volume) can be filled
                in the Leads page.
              </p>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsConvertDialogOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button onClick={handleConvertToLead} disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Convert to Lead
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Inquiry Details</DialogTitle>
            <DialogDescription>
              View complete inquiry information
            </DialogDescription>
          </DialogHeader>

          {selectedInquiry && (
            <div className="space-y-6">
              {/* Contact Information */}
              <div>
                <h3 className="text-sm font-semibold mb-3 text-foreground">Contact Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Name</p>
                    <p className="text-sm font-medium">{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{selectedInquiry.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Phone</p>
                    <p className="text-sm font-medium">{selectedInquiry.phone || "N/A"}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Company</p>
                    <p className="text-sm font-medium">{selectedInquiry.company || "N/A"}</p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-3 text-foreground">Inquiry Details</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">Source</p>
                    <p className="text-sm font-medium capitalize">{selectedInquiry.source?.replace("-", " ")}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <div className="mt-1">
                      <StatusBadge status={selectedInquiry.status} />
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Created</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedInquiry.createdAt), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Last Updated</p>
                    <p className="text-sm font-medium">
                      {format(new Date(selectedInquiry.updatedAt), "MMM dd, yyyy 'at' hh:mm a")}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-semibold mb-2 text-foreground">Message</h3>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {selectedInquiry.message}
                </p>
              </div>

              {selectedInquiry.notes && (
                <div className="border-t pt-4">
                  <h3 className="text-sm font-semibold mb-2 text-foreground">Internal Notes</h3>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                    {selectedInquiry.notes}
                  </p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={confirmDelete}
        title="Delete"
        itemName={selectedInquiry?.name || selectedInquiry?.email}
        itemType="inquiry"
        actionsList={[
          "Permanently delete this inquiry",
          "Remove all associated data",
          "This cannot be undone"
        ]}
        warningMessage="This action cannot be undone."
      />
    </div>
  );
}
