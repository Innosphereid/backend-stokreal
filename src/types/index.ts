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
  id: number;
  created_at: Date;
  updated_at: Date;
}

export interface User extends DatabaseRecord {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
  last_login?: Date;
}

export interface CreateUserRequest {
  email: string;
  username: string;
  first_name: string;
  last_name: string;
  password: string;
}

export interface UpdateUserRequest {
  email?: string;
  username?: string;
  first_name?: string;
  last_name?: string;
  is_active?: boolean;
  password?: string;
  last_login?: Date;
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
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  published_at?: Date;
}

export interface CreatePostRequest {
  title: string;
  content: string;
  author_id: number;
  status?: 'draft' | 'published' | 'archived';
}

export interface UpdatePostRequest {
  title?: string;
  content?: string;
  status?: 'draft' | 'published' | 'archived';
}
