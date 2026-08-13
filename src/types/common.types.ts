// src/types/common.types.ts

export type UUID = string; // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx

export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, any>;
}

export interface AsyncState<T> {
  data: T | null;
  loading: boolean;
  error: ApiError | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}
