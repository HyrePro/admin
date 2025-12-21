"use client";

import React, { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Mail,
  Phone,
  MapPin,
  FileText,
  GraduationCap,
  Briefcase,
  Calendar,
  Download,
  ExternalLink,
  StickyNote,
  Send,
  MoreHorizontal,
  Edit3,
  Trash2,
  Loader2
} from "lucide-react";
import { type CandidateInfo as CandidateInfoType } from "@/lib/supabase/api/get-job-application";
import { downloadFile, forceDownload } from "@/lib/utils";
import { useAuth } from '@/context/auth-context';
import { useAuthStore } from '@/store/auth-store';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  insertCandidateComment,
  getCandidateComments,
  updateCandidateComment,
  deleteCandidateComment,
  type CandidateComment
} from "@/lib/supabase/api/candidate-comments";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";

interface CandidateInfoProps {
  candidateInfo: CandidateInfoType;
}

// Separate component for displaying comments to avoid duplication
function CommentItem({ 
  comment, 
  user, 
  isSavingComment,
  onEdit,
  onDelete
}: {
  comment: CandidateComment;
  user: import('@supabase/supabase-js').User | null;
  isSavingComment: boolean;
  onEdit: (id: string, text: string) => void;
  onDelete: (id: string) => void;
}) {
  const [isDeleting, setIsDeleting] = useState(false);

  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format comment text to highlight mentions
  const formatCommentText = (text: string) => {
    // Simple regex to find @mentions and wrap them in a span with styling
    return text.replace(/@(\w+)/g, '<span class="font-semibold text-blue-600">@$1</span>');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete(comment.id);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={`border rounded-lg p-4 transition-opacity duration-700 ${isDeleting ? 'opacity-50' : 'opacity-100'}`}>
      <div className="flex items-start gap-3">
        <Avatar className="size-8">
          {comment.avatar ? (
            <AvatarImage src={comment.avatar} alt={`${comment.first_name} ${comment.last_name}`} />
          ) : (
            <AvatarFallback className="bg-primary text-primary-foreground text-xs">
              {getUserInitials(comment.first_name, comment.last_name)}
            </AvatarFallback>
          )}
        </Avatar>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <span className="font-medium text-gray-900">
              {comment.first_name} {comment.last_name}
            </span>
          </div>
          <p 
            className="mt-1 text-gray-700 whitespace-pre-wrap"
            dangerouslySetInnerHTML={{ __html: formatCommentText(comment.comment) }}
          />
          <div className="mt-2 text-xs text-gray-500">
            {formatDateTime(comment.created_at)}
          </div>
        </div>
        {user?.id === comment.user_id && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8" disabled={isSavingComment || isDeleting}>
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(comment.id, comment.comment)}>
                <Edit3 className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </>
                )}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>
    </div>
  );
}

// Separate component for the comment input area
function CommentInputArea({ 
  newComment, 
  setNewComment, 
  isSavingComment, 
  onAddComment,
  placeholder = "Add a note... (Use @ to mention other users)"
}: {
  newComment: string;
  setNewComment: (text: string) => void;
  isSavingComment: boolean;
  onAddComment: () => void;
  placeholder?: string;
}) {
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  return (
    <div className="border rounded-lg p-3">
      <div className="flex gap-2">
        <Textarea
          ref={textareaRef}
          placeholder={placeholder}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          className="min-h-[40px] flex-1 border-none shadow-none resize-none focus-visible:ring-0 p-0"
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey && !isSavingComment) {
              e.preventDefault();
              onAddComment();
            }
          }}
          disabled={isSavingComment}
        />
        <Button
          onClick={onAddComment}
          disabled={!newComment.trim() || isSavingComment}
          size="icon"
          className="h-8 w-8 rounded-full"
        >
          {isSavingComment ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Send className="h-4 w-4" />
          )}
        </Button>
      </div>
      {isSavingComment && (
        <div className="flex items-center mt-2 text-sm text-gray-500">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Saving your note...
        </div>
      )}
    </div>
  );
}

// Sheet component for displaying all notes
function AllNotesSheet({ 
  open, 
  onOpenChange, 
  comments, 
  user, 
  schoolId,
  candidateInfo,
  refreshComments
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  comments: CandidateComment[];
  user: import('@supabase/supabase-js').User | null;
  schoolId: string | null;
  candidateInfo: CandidateInfoType;
  refreshComments: () => void;
}) {
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  // Helper functions
  const getUserInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  // Format comment text to highlight mentions
  const formatCommentText = (text: string) => {
    // Simple regex to find @mentions and wrap them in a span with styling
    return text.replace(/@(\w+)/g, '<span class="font-semibold text-blue-600">@$1</span>');
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id || !schoolId || isSavingComment) return;

    setIsSavingComment(true);
    try {
      // Extract mentioned users from comment (find @mentions)
      const mentionedIds: string[] = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        // In a real implementation, you would map usernames to user IDs
        // For now, we'll just store the username as ID
        mentionedIds.push(match[1]);
      }

      const { commentId, error } = await insertCandidateComment(
        user.id,
        schoolId,
        candidateInfo.application_id,
        newComment,
        mentionedIds
      );

      if (error) {
        toast.error("Failed to add comment");
        console.error("Error adding comment:", error);
      } else {
        // Refresh comments
        refreshComments();
        setNewComment("");
        toast.success("Comment added successfully");
      }
    } catch (err) {
      console.error("Unexpected error adding comment:", err);
      toast.error("Failed to add comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingCommentText.trim() || isSavingComment) return;

    setIsSavingComment(true);
    try {
      // Extract mentioned users from comment (find @mentions)
      const mentionedIds: string[] = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(editingCommentText)) !== null) {
        // In a real implementation, you would map usernames to user IDs
        // For now, we'll just store the username as ID
        mentionedIds.push(match[1]);
      }

      const { success, error } = await updateCandidateComment(
        editingCommentId,
        editingCommentText,
        mentionedIds
      );

      if (error || !success) {
        toast.error("Failed to update comment");
        console.error("Error updating comment:", error);
      } else {
        // Refresh comments
        refreshComments();
        setEditingCommentId(null);
        setEditingCommentText("");
        toast.success("Comment updated successfully");
      }
    } catch (err) {
      console.error("Unexpected error updating comment:", err);
      toast.error("Failed to update comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isSavingComment) return;
    
    setDeletingCommentId(commentId);
    try {
      const { success, error } = await deleteCandidateComment(commentId);

      if (error || !success) {
        toast.error("Failed to delete comment");
        console.error("Error deleting comment:", error);
      } else {
        // Refresh comments
        refreshComments();
        toast.success("Comment deleted successfully");
      }
    } catch (err) {
      console.error("Unexpected error deleting comment:", err);
      toast.error("Failed to delete comment");
    } finally {
      setDeletingCommentId(null);
    }
  };

  const handleEdit = (id: string, text: string) => {
    setEditingCommentId(id);
    setEditingCommentText(text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-md md:max-w-lg lg:max-w-xl xl:max-w-2xl">
        <SheetHeader>
          <SheetTitle>All Notes</SheetTitle>
          <SheetDescription>
            Manage all notes for {candidateInfo.first_name} {candidateInfo.last_name}
          </SheetDescription>
        </SheetHeader>
        <div className="h-full flex flex-col pt-4">
          <div className="flex-1 overflow-y-auto space-y-4 pl-4 pr-2">
            {comments.length === 0 ? (
              <div className="text-gray-500 italic py-2">No notes yet. Add the first note!</div>
            ) : (
              comments.map((comment) => (
                editingCommentId === comment.id ? (
                  <div key={comment.id} className="border rounded-lg p-4 space-y-3">
                    <Textarea
                      value={editingCommentText}
                      onChange={(e) => setEditingCommentText(e.target.value)}
                      className="min-h-[100px]"
                    />
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancelEdit}
                        disabled={isSavingComment}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={handleUpdateComment}
                        disabled={isSavingComment}
                      >
                        {isSavingComment ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          "Save"
                        )}
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div 
                    key={comment.id} 
                    className={`border rounded-lg p-4 transition-opacity duration-700 ${deletingCommentId === comment.id ? 'opacity-50' : 'opacity-100'}`}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="size-8">
                        {comment.avatar ? (
                          <AvatarImage src={comment.avatar} alt={`${comment.first_name} ${comment.last_name}`} />
                        ) : (
                          <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                            {getUserInitials(comment.first_name, comment.last_name)}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-gray-900">
                            {comment.first_name} {comment.last_name}
                          </span>
                        </div>
                        <p 
                          className="mt-1 text-gray-700 whitespace-pre-wrap"
                          dangerouslySetInnerHTML={{ __html: formatCommentText(comment.comment) }}
                        />
                        <div className="mt-2 text-xs text-gray-500">
                          {formatDateTime(comment.created_at)}
                        </div>
                      </div>
                      {user?.id === comment.user_id && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-8 w-8" 
                              disabled={isSavingComment || deletingCommentId === comment.id}
                            >
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(comment.id, comment.comment)}>
                              <Edit3 className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => handleDeleteComment(comment.id)} 
                              disabled={deletingCommentId === comment.id}
                            >
                              {deletingCommentId === comment.id ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Deleting...
                                </>
                              ) : (
                                <>
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Delete
                                </>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>
                )
              ))
            )}
          </div>
          <div className="pt-4 border-t pb-4 pl-4 pr-2">
            <CommentInputArea
              newComment={newComment}
              setNewComment={setNewComment}
              isSavingComment={isSavingComment}
              onAddComment={handleAddComment}
              placeholder="Add a note... (Use @ to mention other users)"
            />
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function CandidateInfo({ candidateInfo }: CandidateInfoProps) {
  const [isDownloading, setIsDownloading] = React.useState(false);
  const { user } = useAuth();
  const { schoolId } = useAuthStore();
  const [comments, setComments] = useState<CandidateComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [editingCommentId, setEditingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [editingCommentText, setEditingCommentText] = useState("");
  const [loadingComments, setLoadingComments] = useState(true);
  const [isSavingComment, setIsSavingComment] = useState(false);
  const [showAllNotes, setShowAllNotes] = useState(false);

  const formatDate = (dateString?: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })} at ${date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    })}`;
  };

  const handleResumeDownload = async () => {
    if (!candidateInfo.resume_url || isDownloading) return;

    setIsDownloading(true);
    try {
      // Try force download method first
      forceDownload(candidateInfo.resume_url, candidateInfo.resume_file_name || 'resume.pdf');
    } finally {
      // Reset loading state after a short delay
      setTimeout(() => setIsDownloading(false), 1000);
    }
  };

  // Load comments when component mounts
  useEffect(() => {
    const loadComments = async () => {
      if (!candidateInfo.application_id) return;
      
      setLoadingComments(true);
      try {
        const { comments: fetchedComments, error } = await getCandidateComments(candidateInfo.application_id);
        if (error) {
          toast.error("Failed to load comments");
          console.error("Error loading comments:", error);
        } else {
          setComments(fetchedComments);
        }
      } catch (err) {
        console.error("Unexpected error loading comments:", err);
        toast.error("Failed to load comments");
      } finally {
        setLoadingComments(false);
      }
    };

    loadComments();
  }, [candidateInfo.application_id]);

  const refreshComments = async () => {
    try {
      const { comments: updatedComments, error } = await getCandidateComments(candidateInfo.application_id);
      if (error) {
        toast.error("Failed to refresh comments");
        console.error("Error refreshing comments:", error);
      } else {
        setComments(updatedComments);
      }
    } catch (err) {
      console.error("Unexpected error refreshing comments:", err);
      toast.error("Failed to refresh comments");
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !user?.id || !schoolId || isSavingComment) return;

    setIsSavingComment(true);
    try {
      // Extract mentioned users from comment (find @mentions)
      const mentionedIds: string[] = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(newComment)) !== null) {
        // In a real implementation, you would map usernames to user IDs
        // For now, we'll just store the username as ID
        mentionedIds.push(match[1]);
      }

      const { commentId, error } = await insertCandidateComment(
        user.id,
        schoolId,
        candidateInfo.application_id,
        newComment,
        mentionedIds
      );

      if (error) {
        toast.error("Failed to add comment");
        console.error("Error adding comment:", error);
      } else {
        // Refresh comments
        await refreshComments();
        setNewComment("");
        toast.success("Comment added successfully");
      }
    } catch (err) {
      console.error("Unexpected error adding comment:", err);
      toast.error("Failed to add comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleUpdateComment = async () => {
    if (!editingCommentId || !editingCommentText.trim() || isSavingComment) return;

    setIsSavingComment(true);
    try {
      // Extract mentioned users from comment (find @mentions)
      const mentionedIds: string[] = [];
      const mentionRegex = /@(\w+)/g;
      let match;
      while ((match = mentionRegex.exec(editingCommentText)) !== null) {
        // In a real implementation, you would map usernames to user IDs
        // For now, we'll just store the username as ID
        mentionedIds.push(match[1]);
      }

      const { success, error } = await updateCandidateComment(
        editingCommentId,
        editingCommentText,
        mentionedIds
      );

      if (error || !success) {
        toast.error("Failed to update comment");
        console.error("Error updating comment:", error);
      } else {
        // Refresh comments
        await refreshComments();
        setEditingCommentId(null);
        setEditingCommentText("");
        toast.success("Comment updated successfully");
      }
    } catch (err) {
      console.error("Unexpected error updating comment:", err);
      toast.error("Failed to update comment");
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (isSavingComment) return;
    
    // Set the deleting comment ID to trigger the opacity animation
    setDeletingCommentId(commentId);
    
    try {
      const { success, error } = await deleteCandidateComment(commentId);

      if (error || !success) {
        toast.error("Failed to delete comment");
        console.error("Error deleting comment:", error);
      } else {
        // Refresh comments
        await refreshComments();
        toast.success("Comment deleted successfully");
      }
    } catch (err) {
      console.error("Unexpected error deleting comment:", err);
      toast.error("Failed to delete comment");
    } finally {
      // Clear the deleting comment ID
      setDeletingCommentId(null);
    }
  };

  const handleEdit = (id: string, text: string) => {
    setEditingCommentId(id);
    setEditingCommentText(text);
  };

  const handleCancelEdit = () => {
    setEditingCommentId(null);
    setEditingCommentText("");
  };

  return (
    <div className="flex flex-col h-full mt-4">
      <ToastContainer position="top-right" autoClose={3000} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 overflow-hidden px-4">
        {/* Main Content - 2/3 width - Fixed height container without scrolling */}
        <div className="lg:col-span-2 space-y-6 overflow-y-auto">
          {/* Subjects */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Subjects</h4>
            <div className="flex flex-wrap gap-2">
              {candidateInfo.subjects.map((subject) => (
                <Badge
                  key={subject}
                  variant="secondary"
                  className="bg-indigo-50 text-indigo-700 border-indigo-200"
                >
                  {subject}
                </Badge>
              ))}
            </div>
          </div>

          <Separator />

          {/* Grade Levels */}
          {candidateInfo.grade_levels && candidateInfo.grade_levels.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Grade Levels</h4>
              <div className="flex flex-wrap gap-2">
                {candidateInfo.grade_levels.map((grade) => (
                  <Badge
                    key={grade}
                    variant="secondary"
                    className="bg-blue-50 text-blue-600 border-blue-200"
                  >
                    {grade}
                  </Badge>
                ))}
              </div>
          <Separator />
            </div>
          )}
{/* Teaching Experience */}
          {candidateInfo.teaching_experience && candidateInfo.teaching_experience.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                Teaching Experience
              </h4>
              <div className="space-y-3">
                {candidateInfo.teaching_experience.map((exp, index) => (
                  <div key={index} className="rounded-lg px-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <h5 className="font-semibold text-gray-900">{exp.designation}</h5>
                        <div className="text-gray-600">{exp.school},{exp.city}</div>
                        <div className="text-sm text-gray-500">{formatDate(exp.startDate)} - {formatDate(exp.endDate)}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
          <Separator/>

          {/* Education */}
          {candidateInfo.education_qualifications && candidateInfo.education_qualifications.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
                Education Qualifications
              </h4>
              <div className="space-y-3">
                {candidateInfo.education_qualifications.map((edu, index) => (
                  <div key={index} className="rounded-lg px-2">
                    <div className="gap-4">
                      <div>
                        <h5 className="font-semibold text-gray-900 ">{edu.degree} {edu.specialization}</h5>
                        <div className="text-gray-600">{edu.institution}</div>
                        {edu.specialization && (
                          <div className="text-sm text-gray-500 mt-1">                          {formatDate(edu.startDate)} - {formatDate(edu.endDate)} </div>
                        )}
                        
                      </div>
                      <div className="text-right md:text-left">
                        
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Separator />
        </div>

        {/* Sidebar - 1/3 width - Fixed scrolling container */}
        <div className="space-y-6 overflow-y-auto pr-2 flex flex-col">
          {/* Resume */}
          {candidateInfo.resume_url && (
            <div>
              <h4 className="font-medium text-gray-900 mb-3">Resume</h4>
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-gray-500" />
                    <div>
                      <div className="font-medium text-gray-900 md:line-clamp-2">
                        {candidateInfo.resume_file_name || 'Resume.pdf'}
                      </div>
                      <div className="text-xs text-gray-500">PDF Document</div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(candidateInfo.resume_url, '_blank')}
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleResumeDownload}
                    disabled={isDownloading}
                    className="flex items-center gap-2"
                  >
                    <Download className="h-4 w-4" />
                    {isDownloading ? 'Downloading...' : 'Download'}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Notes Section - Independent scrolling container */}
          <div className="flex flex-col flex-1 min-h-0 pl-1">
            <h4 className="font-medium text-gray-900 mb-3 flex items-center gap-2">
              <StickyNote className="h-4 w-4" />
              Notes
            </h4>
            
            {/* Comments Container - Independent scrolling */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Show only the most recent comment */}
              <div className="flex-1 overflow-y-auto pr-2">
                {loadingComments ? (
                  <div className="text-gray-500 py-1">Loading comments...</div>
                ) : comments.length === 0 ? (
                  // No comments - minimal padding
                  <div className="text-gray-500 italic py-1">No notes yet. Add the first note!</div>
                ) : (
                  <>
                    {/* Display only the most recent comment */}
                    {(() => {
                      const latestComment = comments[0]; // Assuming comments are sorted by date, newest first
                      return editingCommentId === latestComment.id ? (
                        <div className="border rounded-lg p-4 space-y-3">
                          <Textarea
                            value={editingCommentText}
                            onChange={(e) => setEditingCommentText(e.target.value)}
                            className="min-h-[100px]"
                          />
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={handleCancelEdit}
                              disabled={isSavingComment}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="sm"
                              onClick={handleUpdateComment}
                              disabled={isSavingComment}
                            >
                              {isSavingComment ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Saving...
                                </>
                              ) : (
                                "Save"
                              )}
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={`transition-opacity duration-700 ${deletingCommentId === latestComment.id ? 'opacity-50' : 'opacity-100'}`}
                        >
                          <CommentItem
                            key={latestComment.id}
                            comment={latestComment}
                            user={user}
                            isSavingComment={isSavingComment}
                            onEdit={handleEdit}
                            onDelete={handleDeleteComment}
                          />
                        </div>
                      );
                    })()}
                    
                    {/* View all notes link */}
                    {comments.length > 0 && (
                      <Button 
                        variant="link" 
                        className="p-0 h-auto font-normal text-blue-600 hover:text-blue-800 self-start mt-2"
                        onClick={() => setShowAllNotes(true)}
                      >
                        View all {comments.length} notes
                      </Button>
                    )}
                  </>
                )}
              </div>
              
              {/* Add New Comment - Always visible at bottom */}
              <div className="mt-1">
                <CommentInputArea
                  newComment={newComment}
                  setNewComment={setNewComment}
                  isSavingComment={isSavingComment}
                  onAddComment={handleAddComment}
                  placeholder="Add a note... (Use @ to mention other users)"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All Notes Sheet */}
      <AllNotesSheet
        open={showAllNotes}
        onOpenChange={setShowAllNotes}
        comments={comments}
        user={user}
        schoolId={schoolId}
        candidateInfo={candidateInfo}
        refreshComments={refreshComments}
      />
    </div>
  );
}