import type { Knex } from 'knex';

export async function seed(knex: Knex): Promise<void> {
  // Clear existing data
  await knex('tier_feature_definitions').del();

  // Free tier features
  const freeTierFeatures = [
    {
      tier: 'free',
      feature_name: 'max_products',
      feature_limit: 50,
      feature_enabled: true,
      description: 'Maximum number of active products for free tier',
    },
    {
      tier: 'free',
      feature_name: 'max_categories',
      feature_limit: 20,
      feature_enabled: true,
      description: 'Maximum number of product categories for free tier',
    },
    {
      tier: 'free',
      feature_name: 'max_file_upload_size_mb',
      feature_limit: 5,
      feature_enabled: true,
      description: 'Maximum file upload size in MB for Excel imports',
    },
    {
      tier: 'free',
      feature_name: 'max_products_per_import',
      feature_limit: 200,
      feature_enabled: true,
      description: 'Maximum number of products per Excel import',
    },
    {
      tier: 'free',
      feature_name: 'max_import_history',
      feature_limit: 10,
      feature_enabled: true,
      description: 'Maximum number of import history records to keep',
    },
    {
      tier: 'free',
      feature_name: 'stock_movement_history_days',
      feature_limit: 30,
      feature_enabled: true,
      description: 'Number of days to keep stock movement history',
    },
    {
      tier: 'free',
      feature_name: 'notification_history_limit',
      feature_limit: 50,
      feature_enabled: true,
      description: 'Maximum number of notification history records to keep',
    },
    {
      tier: 'free',
      feature_name: 'notification_check_frequency_hours',
      feature_limit: 6,
      feature_enabled: true,
      description: 'Standard check frequency for notifications in hours',
    },
    {
      tier: 'free',
      feature_name: 'dashboard_chart_days',
      feature_limit: 7,
      feature_enabled: true,
      description: 'Number of days for dashboard charts',
    },
    {
      tier: 'free',
      feature_name: 'data_retention_years',
      feature_limit: 1,
      feature_enabled: true,
      description: 'Data retention period in years',
    },
    {
      tier: 'free',
      feature_name: 'analytics_access',
      feature_limit: null,
      feature_enabled: false,
      description: 'Access to advanced analytics features',
    },
    {
      tier: 'free',
      feature_name: 'export_capabilities',
      feature_limit: null,
      feature_enabled: false,
      description: 'Data export capabilities',
    },
    {
      tier: 'free',
      feature_name: 'priority_support',
      feature_limit: null,
      feature_enabled: false,
      description: 'Priority email support',
    },
    {
      tier: 'free',
      feature_name: 'bulk_operations',
      feature_limit: null,
      feature_enabled: false,
      description: 'Bulk product operations',
    },
    {
      tier: 'free',
      feature_name: 'custom_notification_schedules',
      feature_limit: null,
      feature_enabled: false,
      description: 'Custom notification schedules',
    },
    {
      tier: 'free',
      feature_name: 'advanced_message_templates',
      feature_limit: null,
      feature_enabled: false,
      description: 'Advanced message templates with branding',
    },
    {
      tier: 'free',
      feature_name: 'multiple_whatsapp_numbers',
      feature_limit: null,
      feature_enabled: false,
      description: 'Multiple WhatsApp numbers support',
    },
    {
      tier: 'free',
      feature_name: 'scheduled_reports',
      feature_limit: null,
      feature_enabled: false,
      description: 'Scheduled automated reports',
    },
  ];

  // Premium tier features
  const premiumTierFeatures = [
    {
      tier: 'premium',
      feature_name: 'max_products',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Unlimited products for premium tier',
    },
    {
      tier: 'premium',
      feature_name: 'max_categories',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Unlimited product categories for premium tier',
    },
    {
      tier: 'premium',
      feature_name: 'max_file_upload_size_mb',
      feature_limit: 20,
      feature_enabled: true,
      description: 'Maximum file upload size in MB for Excel imports (premium)',
    },
    {
      tier: 'premium',
      feature_name: 'max_products_per_import',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Unlimited products per Excel import',
    },
    {
      tier: 'premium',
      feature_name: 'max_import_history',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Complete import history for premium tier',
    },
    {
      tier: 'premium',
      feature_name: 'stock_movement_history_days',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Unlimited stock movement history',
    },
    {
      tier: 'premium',
      feature_name: 'notification_history_limit',
      feature_limit: null, // unlimited
      feature_enabled: true,
      description: 'Complete notification history with analytics',
    },
    {
      tier: 'premium',
      feature_name: 'notification_check_frequency_hours',
      feature_limit: 1, // minimum 1 hour
      feature_enabled: true,
      description: 'Custom notification check frequency (1-24 hours)',
    },
    {
      tier: 'premium',
      feature_name: 'dashboard_chart_days',
      feature_limit: null, // unlimited custom date ranges
      feature_enabled: true,
      description: 'Custom date range reports for premium tier',
    },
    {
      tier: 'premium',
      feature_name: 'data_retention_years',
      feature_limit: 3,
      feature_enabled: true,
      description: 'Extended data retention period in years',
    },
    {
      tier: 'premium',
      feature_name: 'analytics_access',
      feature_limit: null,
      feature_enabled: true,
      description: 'Access to advanced analytics features',
    },
    {
      tier: 'premium',
      feature_name: 'export_capabilities',
      feature_limit: null,
      feature_enabled: true,
      description: 'Full data export capabilities',
    },
    {
      tier: 'premium',
      feature_name: 'priority_support',
      feature_limit: null,
      feature_enabled: true,
      description: 'Priority email support (24-hour response)',
    },
    {
      tier: 'premium',
      feature_name: 'bulk_operations',
      feature_limit: null,
      feature_enabled: true,
      description: 'Bulk product operations',
    },
    {
      tier: 'premium',
      feature_name: 'custom_notification_schedules',
      feature_limit: null,
      feature_enabled: true,
      description: 'Custom notification schedules',
    },
    {
      tier: 'premium',
      feature_name: 'advanced_message_templates',
      feature_limit: null,
      feature_enabled: true,
      description: 'Advanced message templates with branding',
    },
    {
      tier: 'premium',
      feature_name: 'multiple_whatsapp_numbers',
      feature_limit: null,
      feature_enabled: true,
      description: 'Multiple WhatsApp numbers support',
    },
    {
      tier: 'premium',
      feature_name: 'scheduled_reports',
      feature_limit: null,
      feature_enabled: true,
      description: 'Scheduled automated reports',
    },
    {
      tier: 'premium',
      feature_name: 'advanced_audit_trail',
      feature_limit: null,
      feature_enabled: true,
      description: 'Advanced audit trail with user tracking',
    },
    {
      tier: 'premium',
      feature_name: 'stock_accuracy_analysis',
      feature_limit: null,
      feature_enabled: true,
      description: 'Stock accuracy analysis and reconciliation reports',
    },
    {
      tier: 'premium',
      feature_name: 'movement_data_export',
      feature_limit: null,
      feature_enabled: true,
      description: 'Movement data export (Excel/CSV)',
    },
    {
      tier: 'premium',
      feature_name: 'advanced_sales_analytics',
      feature_limit: null,
      feature_enabled: true,
      description: 'Advanced sales analytics with profit margin analysis',
    },
    {
      tier: 'premium',
      feature_name: 'product_performance_insights',
      feature_limit: null,
      feature_enabled: true,
      description: 'Product performance insights and analytics',
    },
    {
      tier: 'premium',
      feature_name: 'priority_sms_delivery',
      feature_limit: null,
      feature_enabled: true,
      description: 'Priority SMS delivery when WhatsApp fails',
    },
  ];

  // Insert all features
  await knex('tier_feature_definitions').insert([...freeTierFeatures, ...premiumTierFeatures]);
}
