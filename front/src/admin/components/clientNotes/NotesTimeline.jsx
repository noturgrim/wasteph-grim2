import { useState } from "react";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Phone,
  MapPin,
  Mail,
  Users,
  MoreHorizontal,
  Edit,
  Trash2,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EditNoteDialog } from "./EditNoteDialog";
import { DeleteConfirmationModal } from "../modals/DeleteConfirmationModal";

const getInteractionIcon = (type) => {
  const icons = {
    phone_call: Phone,
    site_visit: MapPin,
    email: Mail,
    meeting: Users,
    other: MoreHorizontal,
  };
  const Icon = icons[type] || MoreHorizontal;
  return <Icon className="h-4 w-4" />;
};

const getInteractionLabel = (type) => {
  const labels = {
    phone_call: "Phone Call",
    site_visit: "Site Visit",
    email: "Email",
    meeting: "Meeting",
    other: "Other",
  };
  return labels[type] || type;
};

const getInteractionColor = (type) => {
  const colors = {
    phone_call: "bg-blue-100 text-blue-700",
    site_visit: "bg-green-100 text-green-700",
    email: "bg-purple-100 text-purple-700",
    meeting: "bg-orange-100 text-orange-700",
    other: "bg-gray-100 text-gray-700",
  };
  return colors[type] || colors.other;
};

export const NotesTimeline = ({ notes, onEdit, onDelete, currentUserId, userRole, isMasterSales }) => {
  const [selectedNote, setSelectedNote] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  const canEditDelete = (note) => {
    if (userRole === "admin" || userRole === "super_admin" || isMasterSales) {
      return true;
    }
    return note.createdBy === currentUserId;
  };

  const handleEdit = (note) => {
    setSelectedNote(note);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (note) => {
    setSelectedNote(note);
    setIsDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (selectedNote) {
      await onDelete(selectedNote.id);
      setIsDeleteModalOpen(false);
      setSelectedNote(null);
    }
  };

  if (!notes || notes.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No notes found</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] pr-4">
        <div className="space-y-4">
          {notes.map((note, index) => (
            <div key={note.id} className="relative">
              {/* Timeline line */}
              {index !== notes.length - 1 && (
                <div className="absolute left-[11px] top-10 bottom-0 w-0.5 bg-border" />
              )}

              <Card className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex gap-3 flex-1">
                      <div className="flex-shrink-0 mt-1">
                        <div
                          className={`h-6 w-6 rounded-full flex items-center justify-center ${getInteractionColor(note.interactionType)}`}
                        >
                          {getInteractionIcon(note.interactionType)}
                        </div>
                      </div>

                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <CardTitle className="text-base">{note.subject}</CardTitle>
                          <Badge
                            className={getInteractionColor(note.interactionType)}
                          >
                            {getInteractionLabel(note.interactionType)}
                          </Badge>
                        </div>
                        <div className="text-xs text-muted-foreground space-y-0.5">
                          <div>
                            {format(new Date(note.interactionDate), "EEEE, MMMM dd, yyyy 'at' h:mm a")}
                          </div>
                          <div>
                            Logged by {note.creatorFirstName} {note.creatorLastName} on{" "}
                            {format(new Date(note.createdAt), "MMM dd, yyyy")}
                          </div>
                        </div>
                      </div>
                    </div>

                    {canEditDelete(note) && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(note)}>
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleDelete(note)}
                            className="text-red-600"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-0">
                  <p className="text-sm whitespace-pre-wrap text-muted-foreground">
                    {note.content}
                  </p>
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </ScrollArea>

      <EditNoteDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        note={selectedNote}
        onSuccess={onEdit}
      />

      <DeleteConfirmationModal
        open={isDeleteModalOpen}
        onOpenChange={setIsDeleteModalOpen}
        onConfirm={handleConfirmDelete}
        title="Delete Note"
        description="Are you sure you want to delete this note? This action cannot be undone."
      />
    </>
  );
};
