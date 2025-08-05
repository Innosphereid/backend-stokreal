export interface ApiResponse<T = any> {
  message: string;
  data?: T;
  timestamp: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface PaginatedResponse<T = any> extends ApiResponse<T> {
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
  subscription_plan: 'free' | 'premium';
  subscription_expires_at?: Date | undefined;
  is_active: boolean;
  email_verified: boolean;
  last_login?: Date | undefined;
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
  last_login?: Date;
  subscription_plan?: 'free' | 'premium';
  subscription_expires_at?: Date;
  email_verified?: boolean;
}

export interface QueryParams {
  page?: number;
  limit?: number;
  sort?: string;
  order?: 'asc' | 'desc';
  search?: string;
}

export interface Post extends DatabaseRecord {
  title: string;
  content: string;
  author_id: string; // Changed from number to string for UUID
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  author_id: string; // Changed from number to string for UUID
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
}
