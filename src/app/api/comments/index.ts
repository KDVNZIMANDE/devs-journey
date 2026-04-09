import { ApiResponse } from "@/types/api";
import { Comment, CreateCommentInput } from "@/types";

const BASE = "/api/comments";

export const getComments = async (projectId: string): Promise<ApiResponse<Comment[]>> => {
  try {
    const res = await fetch(`${BASE}?projectId=${projectId}`);
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const createComment = async (data: CreateCommentInput): Promise<ApiResponse<Comment>> => {
  try {
    const res = await fetch(BASE, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};