export type SubscriptionPlan = 'free' | 'premium';
export type UserRole = 'user' | 'admin';
export type SortOrder = 'asc' | 'desc';

// Re-export feature names and types from tier types
export { FEATURE_NAMES, FeatureName, TierStatus } from './tier';

export interface ApiResponse<T = unknown> {
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginationMeta {
  page?: number;
  limit: number;
  total?: number;
  totalPages?: number;
  hasNext?: boolean;
  hasPrev?: boolean;
  next_cursor?: string;
}

export interface PaginatedResponse<T = unknown> extends ApiResponse<T> {
  meta: PaginationMeta;
}

export interface DatabaseRecord {
  id: string; // Changed from number to string for UUID
  created_at: Date;
  updated_at: Date;
}

export interface User extends DatabaseRecord {
  email: string;
  password_hash: string;
  full_name: string;
  phone?: string | undefined;
  whatsapp_number?: string | undefined;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at?: Date | undefined;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date | undefined;
  role: UserRole;
}

export interface CreateUserRequest {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
  whatsapp_number?: string;
}

export interface UpdateUserRequest {
  email?: string;
  full_name?: string;
  phone?: string;
  whatsapp_number?: string;
  is_active?: boolean;
  password?: string;
  password_hash?: string; // Added for direct password hash updates
  last_login?: Date;
  subscription_plan?: SubscriptionPlan;
  subscription_expires_at?: Date;
  email_verified?: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: SortOrder;
  search?: string;
}
