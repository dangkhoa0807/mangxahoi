import type { ApiResponse } from "~/types/api";
import type { Comment } from "~/types/model";

export const postComment = async (data: {
  content: string;
  image: File | null;
}) => {
  return useAPI<ApiResponse<Comment>>(`/api/comment`, {
    method: "POST",
    body: data,
  });
};

export const getComments = async (data: {
  postId: string;
  cursor: string | null;
  limit: number;
  sortBy: "newest" | "oldest" | "popular";
}) => {
  return useAPI<ApiResponse<Comment>>(`/api/comment`, {
    method: "GET",
    body: data,
  });
};
