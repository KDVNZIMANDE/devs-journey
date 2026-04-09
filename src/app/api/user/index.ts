import { ApiResponse } from "@/types/api";
import { User, UpdateUserInput, CreateUserInput } from "@/types";

const BASE = "/api/user";

export const createUser = async (data: CreateUserInput): Promise<ApiResponse<User>> => {
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

export const getUserProfile = async (): Promise<ApiResponse<User>> => {
  try {
    const res = await fetch(BASE);
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const updateUserProfile = async (data: UpdateUserInput): Promise<ApiResponse<User>> => {
  try {
    const res = await fetch(BASE, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    return res.json();
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : "Unknown error" };
  }
};

export const checkUserExists = async (): Promise<boolean> => {
  try {
    const res = await fetch(`${BASE}/exists`);
    const data = await res.json();
    return data.exists === true;
  } catch {
    return false;
  }
};