import { ApiResponse, PaginatedResponse, PaginationMeta } from '@/types';

export const createApiResponse = <T = any>(message: string, data?: T): ApiResponse<T> => {
  const response: ApiResponse<T> = {
    message,
    timestamp: new Date().toISOString(),
  };

  if (data !== undefined) {
    response.data = data;
  }

  return response;
};

export const createSuccessResponse = <T = any>(message: string, data?: T): ApiResponse<T> => {
  return createApiResponse(message, data);
};

export const createErrorResponse = (message: string, error?: string): any => {
  const response: any = {
    error: error || 'Error',
    message,
    timestamp: new Date().toISOString(),
  };

  return response;
};

export const createPaginatedResponse = <T = any>(
  data: T[],
  meta: PaginationMeta,
  message: string = 'Data retrieved successfully'
): PaginatedResponse<T[]> => {
  return {
    message,
    data,
    meta,
    timestamp: new Date().toISOString(),
  };
};

export const calculatePaginationMeta = (
  page: number,
  limit: number,
  total: number
): PaginationMeta => {
  const totalPages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};
