import { NextResponse } from "next/server";

export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

function apiResponse<T>(body: ApiResponse<T>, status: number) {
  return NextResponse.json(body, { status });
}

export function ok<T>(action: string, data?: T, userId = "anonymous", status = 200) {
  console.log(`[SUCCESS] [${userId}] ${action}`);
  return apiResponse<T>({ success: true, data }, status);
}

export function fail(message: string, action: string, userId = "anonymous", status = 400) {
  console.error(`[FAILED ${status}] [${userId}] ${action} — ${message}`);
  return apiResponse({ success: false, message }, status);
}