/**
 * Feature Display Names Constants
 *
 * Centralized mapping of feature names to user-friendly display names.
 * This ensures consistency across the application and prevents duplication.
 *
 * Used for:
 * - Error message generation
 * - UI display
 * - User-facing text
 */

export const FEATURE_DISPLAY_NAMES: Record<string, string> = {
  // Product-related features
  product_slot: 'products',
  max_products: 'products',

  // Category-related features
  categories: 'categories',
  max_categories: 'categories',

  // File and import features
  max_file_upload_size_mb: 'file upload size',
  max_products_per_import: 'products per import',
  max_import_history: 'import history records',

  // History and retention features
  stock_movement_history_days: 'stock movement history days',
  notification_history_limit: 'notification history records',
  notification_check_frequency_hours: 'notification check frequency',
  dashboard_chart_days: 'dashboard chart days',
  data_retention_years: 'data retention years',

  // Premium features
  analytics_access: 'analytics access',
  export_capabilities: 'data export capabilities',
  priority_support: 'priority support',
  bulk_operations: 'bulk operations',
  custom_notification_schedules: 'custom notification schedules',
  advanced_message_templates: 'advanced message templates',
  multiple_whatsapp_numbers: 'multiple WhatsApp numbers',
  scheduled_reports: 'scheduled reports',
  advanced_audit_trail: 'advanced audit trail',
  stock_accuracy_analysis: 'stock accuracy analysis',
  movement_data_export: 'movement data export',
  advanced_sales_analytics: 'advanced sales analytics',
  product_performance_insights: 'product performance insights',
  priority_sms_delivery: 'priority SMS delivery',

  // Legacy/alternative names (for backward compatibility)
  products: 'Product Management',
  api_calls: 'API Calls',
  storage: 'Storage',
  notifications: 'Notifications',
  analytics: 'Analytics',
  export_data: 'Data Export',
  file_upload: 'File Upload',
  advanced_search: 'Advanced Search',
  custom_reports: 'Custom Reports',
  webhooks: 'Webhooks',
  integrations: 'Third-party Integrations',
} as const;

/**
 * Get a user-friendly display name for a feature
 * @param featureName - The internal feature name
 * @returns The user-friendly display name, or a formatted fallback
 */
export function getFeatureDisplayName(featureName: string): string {
  return FEATURE_DISPLAY_NAMES[featureName] || featureName.replace(/_/g, ' ');
}

/**
 * Type for feature display names to ensure type safety
 */
export type FeatureDisplayName = (typeof FEATURE_DISPLAY_NAMES)[keyof typeof FEATURE_DISPLAY_NAMES];
