import { ApiResponse } from "@/types/api";
import { Milestone, CreateMilestoneInput } from "@/types";

const BASE = "/api/milestones";

export const getMilestones = async (projectId: string): Promise<ApiResponse<Milestone[]>> => {
  try {
    const res = await fetch(`${BASE}?projectId=${projectId}`);
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const createMilestone = async (data: CreateMilestoneInput): Promise<ApiResponse<Milestone>> => {
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