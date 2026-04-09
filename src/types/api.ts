export type ApiResponse<T = unknown> = {
  success: boolean;
  data?: T;
  message?: string;
};

export type PaginatedResponse<T> = {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type ApiError = {
  error: string;
  issues?: Record<string, string[]>;
};