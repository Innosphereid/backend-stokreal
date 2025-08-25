import { SubscriptionPlan } from './index';

// Feature Name Constants
// Centralized definition of all feature names used throughout the codebase
// This prevents magic strings and provides a single source of truth
export const FEATURE_NAMES = {
  // Product-related features
  PRODUCT_SLOT: 'product_slot',

  // Category-related features
  CATEGORIES: 'categories',

  // Tier limit features
  MAX_PRODUCTS: 'max_products',
  MAX_CATEGORIES: 'max_categories',
  MAX_FILE_UPLOAD_SIZE_MB: 'max_file_upload_size_mb',
  MAX_PRODUCTS_PER_IMPORT: 'max_products_per_import',
  MAX_IMPORT_HISTORY: 'max_import_history',
  STOCK_MOVEMENT_HISTORY_DAYS: 'stock_movement_history_days',
  NOTIFICATION_HISTORY_LIMIT: 'notification_history_limit',
  NOTIFICATION_CHECK_FREQUENCY_HOURS: 'notification_check_frequency_hours',
  DASHBOARD_CHART_DAYS: 'dashboard_chart_days',
  DATA_RETENTION_YEARS: 'data_retention_years',

  // Premium features
  ANALYTICS_ACCESS: 'analytics_access',
  EXPORT_CAPABILITIES: 'export_capabilities',
  PRIORITY_SUPPORT: 'priority_support',
  BULK_OPERATIONS: 'bulk_operations',
  CUSTOM_NOTIFICATION_SCHEDULES: 'custom_notification_schedules',
  ADVANCED_MESSAGE_TEMPLATES: 'advanced_message_templates',
  MULTIPLE_WHATSAPP_NUMBERS: 'multiple_whatsapp_numbers',
  SCHEDULED_REPORTS: 'scheduled_reports',
  ADVANCED_AUDIT_TRAIL: 'advanced_audit_trail',
  STOCK_ACCURACY_ANALYSIS: 'stock_accuracy_analysis',
  MOVEMENT_DATA_EXPORT: 'movement_data_export',
  ADVANCED_SALES_ANALYTICS: 'advanced_sales_analytics',
  PRODUCT_PERFORMANCE_INSIGHTS: 'product_performance_insights',
  PRIORITY_SMS_DELIVERY: 'priority_sms_delivery',
} as const;

// Type for feature names to ensure type safety
export type FeatureName = (typeof FEATURE_NAMES)[keyof typeof FEATURE_NAMES];

// Tier Status Interface
export interface TierStatus {
  user_id: string;
  subscription_plan: SubscriptionPlan;
  subscription_expires_at: Date | null;
  is_active: boolean;
  days_until_expiration: number | null;
  grace_period_active: boolean;
  grace_period_expires_at: Date | null;
  tier_features: TierFeatures;
  current_usage: CurrentUsage;
}

// Tier Features Interface
export interface TierFeatures {
  max_products: number | 'unlimited';
  max_file_upload_size_mb: number;
  analytics_access: boolean;
  export_capabilities: boolean;
  priority_support: boolean;
  [key: string]: number | string | boolean;
}

// Current Usage Interface
export interface CurrentUsage {
  products_count: number;
  storage_used_mb: number;
  api_calls_today: number;
  notifications_sent_today: number;
  [key: string]: number;
}

// Feature Availability Interface
export interface FeatureAvailability {
  features: Record<string, FeatureInfo>;
}

export interface FeatureInfo {
  available: boolean;
  limit_reached?: boolean;
  current_usage?: number;
  max_allowed?: number | 'unlimited';
  requires_upgrade: boolean;
  max_size_mb?: number;
  upgrade_message?: string;
}

// Usage Statistics Interface
export interface UsageStatistics {
  period: 'daily' | 'weekly' | 'monthly';
  date_range: {
    start: string;
    end: string;
  };
  usage: UsageDetails;
}

export interface UsageDetails {
  products: UsageMetric;
  api_calls: UsageMetric;
  storage: UsageMetric;
  notifications: UsageMetric;
  [key: string]: UsageMetric;
}

export interface UsageMetric {
  current_count: number;
  max_allowed: number | 'unlimited';
  percentage_used: number;
  status: 'within_limit' | 'approaching_limit' | 'limit_exceeded';
}

// Tier Validation Request/Response Interfaces
export interface TierValidationRequest {
  user_id: string;
  required_tier: SubscriptionPlan;
  feature: string;
  action: string;
}

export interface TierValidationResponse {
  user_id: string;
  current_tier: SubscriptionPlan;
  access_granted: boolean;
  feature_available: boolean;
  usage_within_limits: boolean;
  tier_info: {
    subscription_expires_at: Date | null;
    grace_period_active: boolean;
  };
}

export interface TierValidationErrorResponse {
  current_tier: SubscriptionPlan;
  required_tier: SubscriptionPlan;
  feature: string;
  upgrade_url: string;
  upgrade_message: string;
}

// Tier Change Notification Interface
export interface TierChangeNotification {
  user_id: string;
  previous_tier: SubscriptionPlan;
  new_tier: SubscriptionPlan;
  change_reason: 'upgrade' | 'downgrade' | 'expiration' | 'manual';
  effective_date: Date;
  message: string;
}

// API Request/Response Types for Tier Endpoints
export interface TierStatusApiResponse {
  status: number;
  message: string;
  data: TierStatus;
}

export interface FeatureAvailabilityApiResponse {
  status: number;
  message: string;
  data: FeatureAvailability;
}

export interface UsageStatisticsApiResponse {
  status: number;
  message: string;
  data: UsageStatistics;
}

export interface TierValidationApiResponse {
  status: number;
  message: string;
  data: TierValidationResponse;
}

export interface TierValidationApiErrorResponse {
  status: number;
  message: string;
  error: string;
  data: TierValidationErrorResponse;
}

// Query Parameters for Tier Endpoints
export interface FeatureAvailabilityQuery {
  feature?: string;
  action?: string;
}

export interface UsageStatisticsQuery {
  period?: 'daily' | 'weekly' | 'monthly';
}

// Internal Validation Types
export interface InternalTierValidationRequest {
  user_id: string;
  required_tier: SubscriptionPlan;
  feature: string;
  action: string;
}

export interface InternalTierValidationResponse {
  user_id: string;
  current_tier: SubscriptionPlan;
  access_granted: boolean;
  feature_available: boolean;
  usage_within_limits: boolean;
  tier_info: {
    subscription_expires_at: Date | null;
    grace_period_active: boolean;
  };
}

// Feature Definition Types
export interface TierFeatureDefinition {
  id: string;
  tier: SubscriptionPlan;
  feature_name: string;
  feature_limit: number | null;
  feature_enabled: boolean;
  description: string;
  created_at: Date;
  updated_at: Date;
}

// User Feature Usage Types
export interface UserTierFeature {
  id: string;
  user_id: string;
  feature_name: string;
  current_usage: number;
  usage_limit: number | null;
  last_reset_at: Date;
  created_at: Date;
  updated_at: Date;
}

// Tier History Types
export interface TierHistory {
  id: string;
  user_id: string;
  previous_plan: SubscriptionPlan | null;
  new_plan: SubscriptionPlan;
  change_reason: string;
  changed_by: string | null;
  effective_date: Date;
  notes: string | null;
  created_at: Date;
}
