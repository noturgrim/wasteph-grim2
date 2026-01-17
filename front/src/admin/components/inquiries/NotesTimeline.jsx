import { useState, useEffect } from "react";
import { format } from "date-fns";
import { Loader2, Send, MessageSquare, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { api } from "../../services/api";
import { toast } from "sonner";

const getInitials = (firstName, lastName) => {
  return `${firstName?.[0] || ""}${lastName?.[0] || ""}`.toUpperCase();
};

const getAvatarColor = (userId) => {
  const colors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-orange-500",
    "bg-pink-500",
    "bg-teal-500",
  ];
  const index = userId ? userId.charCodeAt(0) % colors.length : 0;
  return colors[index];
};

export const NotesTimeline = ({ inquiryId, initialNotes = [] }) => {
  const [notes, setNotes] = useState(initialNotes);
  const [newNote, setNewNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    // Load notes on mount
    handleLoadNotes();
  }, [inquiryId]);

  const handleLoadNotes = async () => {
    try {
      setIsLoading(true);
      const response = await api.getInquiryNotes(inquiryId);
      setNotes(response.data || []);
    } catch (error) {
      console.error("Error loading notes:", error);
      toast.error("Failed to load notes");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    
    if (!newNote.trim()) {
      toast.error("Note cannot be empty");
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await api.addInquiryNote(inquiryId, newNote.trim());

      const createdNote = response.data;
      setNotes([createdNote, ...notes]);
      setNewNote("");
      setIsAddingNote(false);
      toast.success("Note added successfully");
    } catch (error) {
      console.error("Error adding note:", error);
      toast.error(error.message || "Failed to add note");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) {
      handleAddNote(e);
    } else if (e.key === "Escape") {
      setIsAddingNote(false);
      setNewNote("");
    }
  };

  return (
    <div className="space-y-4">
      {/* Notes Timeline */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-2 hover:opacity-70 transition-opacity"
            aria-expanded={isExpanded}
            aria-label={isExpanded ? "Collapse activity timeline" : "Expand activity timeline"}
          >
            <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
              <MessageSquare className="h-4 w-4" />
              Activity Timeline
              {notes.length > 0 && (
                <span className="text-xs text-muted-foreground font-normal">
                  ({notes.length})
                </span>
              )}
            </h3>
            {isExpanded ? (
              <ChevronUp className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
          {isExpanded && !isAddingNote && (
            <Button
              onClick={() => setIsAddingNote(true)}
              size="sm"
              variant="outline"
            >
              <Send className="mr-2 h-4 w-4" />
              Add Note
            </Button>
          )}
        </div>

        {isExpanded && (
          <>
            {/* Add Note Form */}
            {isAddingNote && (
          <form onSubmit={handleAddNote} className="space-y-2 mb-4 p-4 border rounded-lg bg-muted/30">
            <Textarea
              value={newNote}
              onChange={(e) => setNewNote(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a note... (Ctrl+Enter to submit)"
              rows={3}
              disabled={isSubmitting}
              className="resize-none"
              autoFocus
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-muted-foreground">
                Notes are visible to all team members
              </p>
              <div className="flex gap-2">
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setIsAddingNote(false);
                    setNewNote("");
                  }}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting || !newNote.trim()}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Adding...
                    </>
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Submit
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        )}

        <div className="h-[300px] overflow-y-auto pr-2 scrollbar-thin">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : notes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-2 opacity-20" />
              <p className="text-sm">No notes yet</p>
              <p className="text-xs">Add the first note to start tracking activity</p>
            </div>
          ) : (
            <div className="space-y-4">
              {notes.map((note) => (
                <div key={note.id} className="flex gap-3">
                  <Avatar className={`h-8 w-8 flex-shrink-0 ${getAvatarColor(note.createdBy?.id)}`}>
                    <AvatarFallback className="text-white text-xs">
                      {getInitials(note.createdBy?.firstName, note.createdBy?.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 space-y-1">
                    <div className="flex items-baseline gap-2">
                      <p className="text-sm font-medium">
                        {note.createdBy?.firstName} {note.createdBy?.lastName}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(note.createdAt), "MMM dd, yyyy 'at' h:mm a")}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {note.content}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
          </>
        )}
      </div>
    </div>
  );
};

