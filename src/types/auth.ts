export interface RegisterRequest {
  email: string;
  full_name: string;
  phone?: string;
  whatsapp_number?: string;
  password: string;
  confirm_password: string;
}

export interface RegisterResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    phone?: string | undefined;
    whatsapp_number?: string | undefined;
    subscription_plan: 'free' | 'premium';
    is_active: boolean;
    created_at: Date;
    email_verified: boolean;
  };
}

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: {
    id: string;
    email: string;
    full_name: string;
    subscription_plan: 'free' | 'premium';
    subscription_expires_at?: Date | undefined;
  };
  tokens: {
    access_token: string;
    refresh_token: string;
    expires_in: number;
  };
}

export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
