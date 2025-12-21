import { createClient } from "./client";

export interface CandidateComment {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  avatar: string | null;
  comment: string;
  mentioned_ids: string[];
  created_at: string;
  updated_at: string;
}

// Function to insert a new comment
export async function insertCandidateComment(
  userId: string,
  schoolId: string,
  applicationId: string,
  comment: string,
  mentionedIds: string[]
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("insert_candidate_comment", {
      p_user_id: userId,
      p_school_id: schoolId,
      p_application_id: applicationId,
      p_comment: comment,
      p_mentioned_ids: mentionedIds
    });

    if (error) {
      throw new Error(error.message || "Failed to insert comment");
    }

    return {
      commentId: data,
      error: null
    };
  } catch (err) {
    console.error("Error inserting comment:", err);
    return {
      commentId: null,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Function to fetch comments for an application
export async function getCandidateComments(applicationId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("get_candidate_comments", {
      p_application_id: applicationId,
    });

    if (error) {
      throw new Error(error.message || "Failed to fetch comments");
    }

    // Transform the data to match our interface
    const comments: CandidateComment[] = (data || []).map((item: {
      id: string;
      user_id: string;
      first_name: string;
      last_name: string;
      avatar: string | null;
      comment: string;
      mentioned_ids?: string[];
      created_at: string;
      updated_at: string;
    }) => ({
      id: item.id,
      user_id: item.user_id,
      first_name: item.first_name,
      last_name: item.last_name,
      avatar: item.avatar,
      comment: item.comment,
      mentioned_ids: item.mentioned_ids || [],
      created_at: item.created_at,
      updated_at: item.updated_at
    }));

    return {
      comments,
      error: null
    };
  } catch (err) {
    console.error("Error fetching comments:", err);
    return {
      comments: [],
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Function to update an existing comment
export async function updateCandidateComment(
  commentId: string,
  comment: string,
  mentionedIds: string[]
) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("update_candidate_comment", {
      p_comment_id: commentId,
      p_comment: comment,
      p_mentioned_ids: mentionedIds
    });

    if (error) {
      throw new Error(error.message || "Failed to update comment");
    }

    return {
      success: data,
      error: null
    };
  } catch (err) {
    console.error("Error updating comment:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}

// Function to delete a comment
export async function deleteCandidateComment(commentId: string) {
  try {
    const supabase = createClient();
    const { data, error } = await supabase.rpc("delete_candidate_comment", {
      p_comment_id: commentId
    });

    if (error) {
      throw new Error(error.message || "Failed to delete comment");
    }

    return {
      success: data,
      error: null
    };
  } catch (err) {
    console.error("Error deleting comment:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred",
    };
  }
}