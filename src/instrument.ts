import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: 'https://20ce3b523b48c42b4903e17cd62e5902@o4507860939767808.ingest.us.sentry.io/4509797410013184',

  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  tracesSampleRate: 1.0,
  sendDefaultPii: true,

  // Enable structured logging
  enableLogs: true,

  // Disable debug mode to prevent cluttering terminal
  debug: false,
});
