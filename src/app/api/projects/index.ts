import { ApiResponse } from "@/types/api";
import { Project, CreateProjectInput, UpdateProjectInput } from "@/types";

const BASE = "/api/projects";

export const getProjects = async (): Promise<ApiResponse<Project[]>> => {
  try {
    const res = await fetch(BASE);
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const getProject = async (id: string): Promise<ApiResponse<Project>> => {
  try {
    const res = await fetch(`${BASE}/${id}`);
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const createProject = async (data: CreateProjectInput): Promise<ApiResponse<Project>> => {
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

export const updateProject = async (id: string, data: UpdateProjectInput): Promise<ApiResponse<Project>> => {
  try {
    const res = await fetch(`${BASE}/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const completeProject = async (id: string): Promise<ApiResponse<Project>> => {
  try {
    const res = await fetch(`${BASE}/${id}`, { method: "DELETE" });
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};