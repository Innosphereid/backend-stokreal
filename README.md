# Node.js TypeScript Express Boilerplate

A production-ready boilerplate for building REST APIs with Node.js, TypeScript, Express, PostgreSQL, and Knex.js.

## Features

- **TypeScript** - Type safety and modern JavaScript features
- **Express.js** - Fast, unopinionated web framework
- **PostgreSQL** - Robust relational database
- **Knex.js** - SQL query builder and migration tool
- **Model Layer** - Active Record pattern with BaseModel abstraction
- **Controller-Service-Model Architecture** - Clean separation of concerns
- **ESLint & Prettier** - Code linting and formatting
- **Jest** - Testing framework
- **Security** - Helmet, CORS, rate limiting
- **CORS Management** - Comprehensive CORS configuration with environment-based settings
- **JWT Authentication** - Secure token-based authentication with access and refresh tokens
- **Cookie Management** - Secure cookie handling with signed cookies
- **Logging** - Structured logging with custom logger
- **Error Handling** - Centralized error handling
- **Email Service** - Nodemailer integration for transactional emails
- **Environment Configuration** - dotenv for environment variables
- **API Documentation** - RESTful API structure
- **OpenAPI/Swagger Documentation** - Comprehensive API documentation with interactive UI

## Project Structure

```
src/
├── config/           # Configuration files
│   ├── database.ts   # Database configuration
│   ├── jwt.ts        # JWT configuration
│   ├── mailer.ts     # Email service configuration
│   └── knexfile.ts   # Knex configuration
├── mails/            # Email template extensions
│   ├── welcomeEmail.ts       # Welcome email template extension
│   ├── passwordResetEmail.ts # Password reset email template extension
│   ├── verificationEmail.ts  # Email verification template extension
│   └── index.ts      # Email template imports and exports
├── controllers/      # Route controllers (HTTP layer)
│   ├── UserController.ts
│   └── PostController.ts
├── database/         # Database related files
│   ├── migrations/   # Knex migrations
│   └── seeds/        # Database seeds
├── middleware/       # Custom middleware
│   ├── errorHandler.ts
│   └── notFoundHandler.ts
├── models/           # Data access layer (Active Record pattern)
│   ├── BaseModel.ts  # Abstract base model with common operations
│   ├── UserModel.ts  # User-specific database operations
│   ├── PostModel.ts  # Post-specific database operations
│   └── index.ts      # Model exports
├── routes/           # API routes
│   ├── index.ts
│   ├── users.ts
│   └── posts.ts
├── services/         # Business logic layer
│   ├── AuthService.ts # JWT authentication service
│   ├── UserService.ts
│   └── PostService.ts
├── tests/            # Test files
│   ├── setup.ts
│   └── utils/
├── types/            # TypeScript type definitions
│   └── index.ts
├── utils/            # Utility functions
│   ├── jwt.ts        # JWT utilities
│   ├── logger.ts
│   └── response.ts
└── index.ts          # Application entry point
```

## Getting Started

### Prerequisites

- Node.js (v18 or higher)
- PostgreSQL
- npm or yarn

### Installation

1. Clone the repository:

```bash
git clone <repository-url>
cd boilerplate-express-nodejs-typescript
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Update the `.env` file with your database credentials and other configuration.

5. Create the database:

```bash
createdb boilerplate_db
```

6. Run migrations:

```bash
npm run migrate:latest
```

7. Seed the database (optional):

```bash
npm run seed:run
```

### Development

Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:3000` (or the port specified in your `.env` file).

### Building for Production

Build the project:

```bash
npm run build
```

Start the production server:

```bash
npm start
```

## Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build the project for production
- `npm start` - Start production server
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors
- `npm run format` - Format code with Prettier
- `npm run format:check` - Check code formatting
- `npm test` - Run tests
- `npm run test:watch` - Run tests in watch mode
- `npm run test:coverage` - Run tests with coverage
- `npm run migrate:latest` - Run latest migrations
- `npm run migrate:rollback` - Rollback last migration
- `npm run migrate:make <name>` - Create new migration
- `npm run seed:run` - Run database seeds
- `npm run seed:make <name>` - Create new seed file

## Architecture

This boilerplate follows a **Controller → Service → Model → Database** architecture:

### Controllers (HTTP Layer)

- Handle HTTP requests and responses
- Validate request parameters
- Call appropriate service methods
- Return formatted responses

### Services (Business Logic Layer)

- Contain business logic and rules
- Orchestrate operations between models
- Handle complex workflows
- Manage transactions

### Models (Data Access Layer)

- Handle database operations using Active Record pattern
- Provide entity-specific methods
- Manage data validation and relationships
- Extend BaseModel for common functionality

### BaseModel Features

- CRUD operations (create, read, update, delete)
- Pagination and search functionality
- Query building and filtering
- Transaction support
- Common database patterns

## API Documentation

This boilerplate includes comprehensive OpenAPI/Swagger documentation that is automatically generated from your route definitions and TypeScript types.

### Accessing the Documentation

Once the server is running, you can access the interactive API documentation at:

- **Swagger UI**: `http://localhost:3000/api-docs`
- **API Information**: `http://localhost:3000/api/v1/`

### Features

- **Interactive Documentation**: Test API endpoints directly from the browser
- **Automatic Schema Generation**: TypeScript interfaces are automatically converted to OpenAPI schemas
- **Request/Response Examples**: Pre-filled examples for all endpoints
- **Authentication Support**: JWT Bearer token and cookie authentication documentation
- **Error Response Documentation**: Comprehensive error response schemas
- **Environment-specific URLs**: Different server URLs for development and production

### Documentation Structure

The API documentation is organized into the following sections:

#### Authentication

- User registration and login endpoints
- JWT token management
- Password reset and email verification

#### Users

- Complete CRUD operations for user management
- Pagination and search functionality
- User profile management

#### Cookies

- Cookie management and configuration
- Authentication and session cookies
- Cookie validation and security

#### CORS

- CORS configuration and testing
- Origin validation and security
- Preflight request handling

#### Health

- Server health monitoring
- System status and uptime information

### Adding Documentation to New Endpoints

When adding new endpoints, include JSDoc comments with `@swagger` annotations:

```typescript
/**
 * @swagger
 * /api/v1/example:
 *   get:
 *     summary: Example endpoint
 *     tags: [Examples]
 *     description: This is an example endpoint
 *     parameters:
 *       - in: query
 *         name: param
 *         schema:
 *           type: string
 *         description: Example parameter
 *     responses:
 *       200:
 *         description: Success response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiResponse'
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.get('/example', controller.example);
```

### Schema Definitions

The documentation includes comprehensive schema definitions for:

- **Common Responses**: `ApiResponse`, `ErrorResponse`, `ValidationError`
- **Pagination**: `PaginationMeta`, `PaginatedResponse`
- **User Management**: `User`, `CreateUserRequest`, `UpdateUserRequest`
- **Authentication**: `RegisterRequest`, `LoginRequest`, `LoginResponse`
- **Cookies**: `CookieRequest`, `CookieResponse`
- **CORS**: `CorsConfig`, `CorsValidationResponse`

### Authentication in Documentation

The Swagger UI supports two authentication methods:

1. **Bearer Token**: Enter your JWT access token in the Authorize dialog
2. **Cookie Authentication**: Cookies are automatically included in requests

### Customizing Documentation

You can customize the documentation by modifying `src/config/swagger.ts`:

```typescript
const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Your API Title',
      version: '1.0.0',
      description: 'Your API description',
      contact: {
        name: 'Your Name',
        email: 'your-email@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.yourdomain.com/api/v1',
        description: 'Production server',
      },
    ],
    // ... other configuration
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'],
};
```

### Testing with Swagger UI

1. **Start the server**: `npm run dev`
2. **Open Swagger UI**: Navigate to `http://localhost:3000/api-docs`
3. **Authenticate**: Click "Authorize" and enter your JWT token
4. **Test endpoints**: Click on any endpoint and use "Try it out"
5. **View responses**: See real response data and status codes

### Exporting Documentation

You can export the OpenAPI specification as JSON or YAML:

```bash
# Get the OpenAPI specification as JSON
curl http://localhost:3000/api-docs/swagger.json

# Get the OpenAPI specification as YAML
curl http://localhost:3000/api-docs/swagger.yaml
```

### Integration with External Tools

The OpenAPI specification can be used with:

- **Postman**: Import the specification for API testing
- **Insomnia**: Use for API development and testing
- **Code Generation**: Generate client SDKs in various languages
- **API Gateways**: Deploy to AWS API Gateway, Kong, etc.

## API Endpoints

### Health Check

- `GET /health` - Health check endpoint

### Users

- `GET /api/v1/users` - Get all users (with pagination)
- `GET /api/v1/users/:id` - Get user by ID
- `POST /api/v1/users` - Create new user
- `PUT /api/v1/users/:id` - Update user
- `DELETE /api/v1/users/:id` - Delete user

### Authentication

- `POST /api/v1/auth/login` - User login with JWT token generation
- `POST /api/v1/auth/logout` - User logout (clears JWT cookies)
- `POST /api/v1/auth/refresh` - Refresh JWT tokens
- `GET /api/v1/auth/profile` - Get authenticated user profile
- `POST /api/v1/auth/change-password` - Change user password
- `POST /api/v1/auth/reset-password` - Reset password with verification token
- `POST /api/v1/auth/verify-email` - Verify email with verification token
- `POST /api/v1/auth/generate-verification` - Generate verification token

### Posts (Example)

- `GET /api/v1/posts` - Get all posts (with pagination)
- `GET /api/v1/posts/:id` - Get post by ID
- `POST /api/v1/posts` - Create new post
- `PUT /api/v1/posts/:id` - Update post
- `DELETE /api/v1/posts/:id` - Delete post
- `GET /api/v1/posts/author/:authorId` - Get posts by author
- `GET /api/v1/posts/published` - Get published posts only
- `PUT /api/v1/posts/:id/publish` - Publish a post
- `PUT /api/v1/posts/:id/archive` - Archive a post
- `GET /api/v1/posts/stats` - Get post statistics

### Query Parameters (for GET endpoints)

- `page` - Page number (default: 1)
- `limit` - Items per page (default: 10)
- `sort` - Sort field (default: created_at)
- `order` - Sort order: asc/desc (default: desc)
- `search` - Search in relevant fields

## Environment Variables

```env
NODE_ENV=development
PORT=3000

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=boilerplate_db
DB_USER=postgres
DB_PASSWORD=password

# API
API_PREFIX=/api/v1
CORS_ORIGIN=http://localhost:3000

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_VERIFICATION_TOKEN_EXPIRY=1h
JWT_ISSUER=boilerplate-express-nodejs-typescript
JWT_AUDIENCE=boilerplate-users
JWT_ALGORITHM=HS256

# Cookie Configuration
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
COOKIE_DOMAIN=localhost
SESSION_COOKIE_MAX_AGE=86400000
AUTH_COOKIE_MAX_AGE=604800000
CSRF_COOKIE_MAX_AGE=86400000
REMEMBER_COOKIE_MAX_AGE=2592000000

# JWT Cookie Configuration
JWT_ACCESS_COOKIE_NAME=jwt_access
JWT_REFRESH_COOKIE_NAME=jwt_refresh
JWT_ACCESS_COOKIE_MAX_AGE=900000
JWT_REFRESH_COOKIE_MAX_AGE=604800000

# Email Configuration
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAIL_FROM_NAME=Your App Name
MAIL_FROM_ADDRESS=noreply@yourapp.com
MAIL_LOG_ONLY=true
```

## Email Service

This boilerplate includes a comprehensive email service using Nodemailer for sending transactional emails.

### Features

- **Multiple Email Providers**: Support for SMTP, Gmail, and other email services
- **Template Support**: Built-in templates for common email types
- **Development Mode**: Log-only mode for development testing
- **Connection Verification**: Automatic SMTP connection testing
- **Error Handling**: Comprehensive error handling and logging
- **TypeScript Support**: Full type safety for email operations

### Email Configuration

Configure the email service via environment variables:

```env
# Email Configuration
MAIL_HOST=smtp.gmail.com          # SMTP server host
MAIL_PORT=587                     # SMTP server port (587 for TLS, 465 for SSL)
MAIL_SECURE=false                 # true for SSL (port 465), false for TLS (port 587)
MAIL_USER=your-email@gmail.com    # SMTP username
MAIL_PASSWORD=your-app-password   # SMTP password or app password
MAIL_FROM_NAME=Your App Name      # Default sender name
MAIL_FROM_ADDRESS=noreply@yourapp.com  # Default sender email address

# Development Settings
MAIL_LOG_ONLY=true               # Set to true to log emails instead of sending them
```

### Email Service Usage

#### Basic Email Sending

```typescript
import { mailer } from '@/config/mailer';

// Send a basic email
await mailer.sendMail({
  to: 'user@example.com',
  subject: 'Welcome to our platform',
  text: 'Thank you for joining us!',
  html: '<h1>Thank you for joining us!</h1>',
});

// Send to multiple recipients
await mailer.sendMail({
  to: ['user1@example.com', 'user2@example.com'],
  subject: 'Newsletter',
  html: '<p>Your newsletter content here</p>',
});
```

#### Built-in Email Templates

The mailer service is extended with pre-built templates for common email types using TypeScript module augmentation:

```typescript
// Import the extended mailer with all email templates
import { mailer } from '@/mails';

// Welcome email
await mailer.sendWelcomeEmail('user@example.com', 'John Doe');

// Password reset email
await mailer.sendPasswordResetEmail(
  'user@example.com',
  'reset-token-123',
  'https://yourapp.com/reset-password'
);

// Email verification
await mailer.sendVerificationEmail(
  'user@example.com',
  'verification-token-456',
  'https://yourapp.com/verify-email'
);
```

#### Creating Custom Email Templates

You can extend the mailer service with custom email templates by creating new files in the `src/mails/` directory:

```typescript
// src/mails/customEmail.ts
import nodemailer from 'nodemailer';
import { mailer, MailerService } from '@/config/mailer';

// Extend the MailerService interface
declare module '@/config/mailer' {
  interface MailerService {
    sendCustomEmail(
      to: string,
      recipientName: string,
      customMessage: string
    ): Promise<nodemailer.SentMessageInfo>;
  }
}

// Add the method to the prototype
MailerService.prototype.sendCustomEmail = async function (
  to: string,
  recipientName: string,
  customMessage: string
): Promise<nodemailer.SentMessageInfo> {
  const subject = 'Custom Email Subject';
  const text = `Hello ${recipientName},\n\n${customMessage}\n\nBest regards,\nThe Team`;
  const html = `
    <h1>Hello ${recipientName}!</h1>
    <p>${customMessage}</p>
    <p>Best regards,<br>The Team</p>
  `;

  return this.sendMail({ to, subject, text, html });
};
```

Then import your custom template in `src/mails/index.ts`:

```typescript
// src/mails/index.ts
import './welcomeEmail';
import './passwordResetEmail';
import './verificationEmail';
import './customEmail'; // Add your custom template

export { mailer } from '@/config/mailer';
```

Now you can use your custom email template:

```typescript
import { mailer } from '@/mails';

await mailer.sendCustomEmail('user@example.com', 'John Doe', 'This is a custom message');
```

#### Advanced Email Options

```typescript
// Email with attachments
await mailer.sendMail({
  to: 'user@example.com',
  subject: 'Invoice',
  html: '<p>Please find your invoice attached.</p>',
  attachments: [
    {
      filename: 'invoice.pdf',
      content: pdfBuffer,
      contentType: 'application/pdf',
    },
  ],
});

// Email with CC and BCC
await mailer.sendMail({
  to: 'user@example.com',
  cc: 'manager@example.com',
  bcc: 'admin@example.com',
  subject: 'Important Update',
  html: '<p>Important information here</p>',
});
```

### Email Service Integration

#### In Controllers

```typescript
import { Request, Response } from 'express';
import { mailer } from '@/config/mailer';
import { asyncHandler } from '@/middleware/errorHandler';

export const sendWelcomeEmail = asyncHandler(async (req: Request, res: Response) => {
  const { email, name } = req.body;

  try {
    await mailer.sendWelcomeEmail(email, name);
    res.json({
      success: true,
      message: 'Welcome email sent successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to send welcome email',
    });
  }
});
```

#### In Services

```typescript
import { mailer } from '@/config/mailer';

export class UserService {
  async createUser(userData: CreateUserData) {
    // Create user logic...
    const user = await this.userModel.create(userData);

    // Send welcome email
    try {
      await mailer.sendWelcomeEmail(user.email, user.firstName);
    } catch (emailError) {
      // Log error but don't fail user creation
      logger.error('Failed to send welcome email:', emailError);
    }

    return user;
  }

  async requestPasswordReset(email: string) {
    const user = await this.userModel.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    const resetToken = generateResetToken();
    await this.userModel.saveResetToken(user.id, resetToken);

    // Send password reset email
    await mailer.sendPasswordResetEmail(
      email,
      resetToken,
      process.env.FRONTEND_URL + '/reset-password'
    );

    return { message: 'Password reset email sent' };
  }
}
```

### Email Provider Configuration

#### Gmail Configuration

For Gmail, you'll need to use an App Password:

1. Enable 2-Factor Authentication on your Google account
2. Generate an App Password: Google Account → Security → App passwords
3. Use the App Password in your environment variables:

```env
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_SECURE=false
MAIL_USER=your-email@gmail.com
MAIL_PASSWORD=your-16-character-app-password
```

#### Other SMTP Providers

```env
# SendGrid
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USER=apikey
MAIL_PASSWORD=your-sendgrid-api-key

# Mailgun
MAIL_HOST=smtp.mailgun.org
MAIL_PORT=587
MAIL_USER=your-mailgun-username
MAIL_PASSWORD=your-mailgun-password

# Amazon SES
MAIL_HOST=email-smtp.us-east-1.amazonaws.com
MAIL_PORT=587
MAIL_USER=your-ses-access-key
MAIL_PASSWORD=your-ses-secret-key
```

### Development and Testing

#### Development Mode

Set `MAIL_LOG_ONLY=true` in your development environment to log emails instead of sending them:

```typescript
// In development, emails are logged instead of sent
await mailer.sendWelcomeEmail('user@example.com', 'John');
// Output: Email would be sent: { to: 'user@example.com', subject: 'Welcome!', ... }
```

#### Connection Testing

Test your email configuration:

```typescript
import { mailer } from '@/config/mailer';

// Verify SMTP connection
const isConnected = await mailer.verifyConnection();
if (isConnected) {
  console.log('Email service is ready');
} else {
  console.error('Email service connection failed');
}
```

### Error Handling

The email service includes comprehensive error handling:

```typescript
try {
  await mailer.sendMail(emailOptions);
} catch (error) {
  if (error.code === 'EAUTH') {
    // Authentication failed
    logger.error('Email authentication failed');
  } else if (error.code === 'ECONNECTION') {
    // Connection failed
    logger.error('Email server connection failed');
  } else {
    // Other email errors
    logger.error('Email sending failed:', error);
  }
}
```

### Security Best Practices

- **Use App Passwords**: For Gmail and other providers that support them
- **Environment Variables**: Never hardcode email credentials
- **Rate Limiting**: Implement rate limiting for email endpoints
- **Input Validation**: Validate email addresses before sending
- **Error Logging**: Log email errors for monitoring
- **Secure Connections**: Always use TLS/SSL for SMTP connections

### Monitoring and Logging

The email service automatically logs:

- Successful email sends with message IDs
- Failed email attempts with error details
- SMTP connection status
- Development mode email logs

```typescript
// Example log output
// INFO: Email sent successfully to user@example.com { messageId: '12345' }
// ERROR: Failed to send email: Authentication failed
```

## Database Schema

### Users Table

- `id` - Primary key
- `email` - Unique email address
- `username` - Unique username
- `first_name` - User's first name
- `last_name` - User's last name
- `password_hash` - Hashed password
- `is_active` - Account status
- `last_login` - Last login timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

### Posts Table (Example)

- `id` - Primary key
- `title` - Post title
- `content` - Post content
- `author_id` - Foreign key to users table
- `status` - Post status (draft, published, archived)
- `published_at` - Publication timestamp
- `created_at` - Creation timestamp
- `updated_at` - Last update timestamp

## Database CLI Tool

The project includes a custom database CLI tool for easier migration management:

### Creating Migrations

**Interactive Migration Creation:**

```bash
npm run db migrate:make
```

This will prompt you for a migration name and automatically create a file with:

- Timestamp format: `YYYYMMDDHHMMSS`
- Snake_case naming convention
- Basic Knex migration template
- Proper TypeScript structure

**Example:**

- Input: "create products table"
- Output: `20240126143022_create_products_table.ts`

**Traditional Knex Migration:**

```bash
npm run migrate:make migration_name
```

### Creating Seeders

**Interactive Seeder Creation:**

```bash
npm run db seeder:make
```

This will prompt you for a seeder name and automatically create a file with:

- Timestamp format: `YYYYMMDDHHMMSS`
- Snake_case naming convention
- Basic Knex seeder template
- Proper TypeScript structure
- Smart table name extraction

**Examples:**

- Input: "products data" → Output: `20240126143022_products_data.ts` (table: `products`)
- Input: "users seeder" → Output: `20240126143022_users_seeder.ts` (table: `users`)
- Input: "categories" → Output: `20240126143022_categories.ts` (table: `categories`)

**Traditional Knex Seeder:**

```bash
npm run seed:make seeder_name
```

## Creating New Models

To add a new entity to your application:

1. **Create Migration**:

```bash
npm run migrate:make create_entity_table
```

2. **Define Types** in `src/types/index.ts`:

```typescript
export interface Entity extends DatabaseRecord {
  name: string;
  // other fields
}
```

3. **Create Model** in `src/models/EntityModel.ts`:

```typescript
import { BaseModel } from './BaseModel';
import { Entity } from '@/types';

export class EntityModel extends BaseModel<Entity> {
  protected tableName = 'entities';

  // Add entity-specific methods
}
```

4. **Create Service** in `src/services/EntityService.ts`:

```typescript
import { EntityModel } from '@/models';

export class EntityService {
  private entityModel: EntityModel;

  constructor() {
    this.entityModel = new EntityModel();
  }

  // Add business logic methods
}
```

5. **Create Controller** in `src/controllers/EntityController.ts`:

```typescript
import { EntityService } from '@/services/EntityService';

export class EntityController {
  private entityService: EntityService;

  constructor() {
    this.entityService = new EntityService();
  }

  // Add HTTP handlers
}
```

6. **Add Routes** and update exports in respective index files

## Testing

Run tests:

```bash
npm test
```

Run tests with coverage:

```bash
npm run test:coverage
```

## Code Quality

This project uses ESLint and Prettier for code quality and formatting.

Run linting:

```bash
npm run lint
```

Fix linting issues:

```bash
npm run lint:fix
```

Format code:

```bash
npm run format
```

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- Helmet.js for security headers
- CORS configuration
- Rate limiting
- Input validation (implement as needed)
- SQL injection prevention through Knex.js

## Performance

- Compression middleware
- Database connection pooling
- Efficient database queries with indexes
- Pagination for large datasets

## Monitoring

- Structured logging
- Health check endpoint
- Error tracking and reporting
- Performance monitoring (implement as needed)

## Deployment

This boilerplate is ready for deployment on various platforms:

- **Heroku** - Add `Procfile` with `web: npm start`
- **Docker** - Add `Dockerfile` and `docker-compose.yml`
- **AWS/GCP/Azure** - Deploy using their respective services
- **VPS** - Use PM2 for process management

Remember to:

- Set environment variables in production
- Use a production PostgreSQL database
- Enable SSL for database connections
- Set up proper logging and monitoring
- Configure CI/CD pipelines

## Database CLI Commands

### Additional Commands

- `npm run db seeder:make` - Create new seeder with interactive prompt and custom naming
  - Prompts for seeder name in English
  - Creates file with format: `YYYYMMDDHHMMSS_seeder_name.ts`
  - Includes basic Knex seeder template
  - Smart table name extraction from input

### Examples

```bash
# Create a new seeder
npm run db seeder:make
# Input: "products data"
# Output: 20240126143022_products_data.ts

# Create a new migration
npm run db migrate:make
# Input: "create products table"
# Output: 20240126143022_create_products_table.ts
```

## Cookie Management

This boilerplate includes comprehensive cookie management with security features:

### Features

- **Signed Cookies**: All sensitive cookies are cryptographically signed
- **Environment-based Security**: Automatic HTTPS-only cookies in production
- **Multiple Cookie Types**: Session, authentication, CSRF, and remember-me cookies
- **Utility Methods**: Easy-to-use helper methods for cookie operations
- **Configurable**: Extensive configuration options via environment variables

### Cookie Types

1. **Session Cookies**: Short-lived cookies for user sessions
2. **Authentication Cookies**: Secure tokens for user authentication
3. **CSRF Cookies**: Cross-site request forgery protection tokens
4. **Remember Me Cookies**: Long-lived cookies for persistent login

### Cookie API Endpoints

- `POST /api/v1/cookies/set` - Set a custom cookie
- `GET /api/v1/cookies` - Get all cookies
- `DELETE /api/v1/cookies/:name` - Clear a specific cookie
- `POST /api/v1/cookies/auth` - Set authentication cookie
- `DELETE /api/v1/cookies/auth` - Clear authentication cookie
- `POST /api/v1/cookies/session` - Set session cookie
- `DELETE /api/v1/cookies/session` - Clear session cookie
- `GET /api/v1/cookies/config` - Get cookie configuration
- `GET /api/v1/cookies/validate` - Validate current cookies

### CORS

- `GET /api/v1/cors/config` - Get CORS configuration
- `POST /api/v1/cors/check-origin` - Check if origin is allowed
- `GET /api/v1/cors/origins` - Get allowed origins
- `GET /api/v1/cors/methods` - Get allowed HTTP methods
- `GET /api/v1/cors/headers` - Get allowed headers
- `GET /api/v1/cors/test-preflight` - Test CORS preflight
- `GET /api/v1/cors/request-info` - Get request CORS info
- `GET /api/v1/cors/validate` - Validate CORS setup

### Usage in Controllers

```typescript
import { Request, Response } from 'express';

export const loginController = (req: Request, res: Response) => {
  const authToken = 'your-jwt-token';

  // Set authentication cookie
  res.setAuthCookie(authToken);

  // Set session cookie
  res.setSessionCookie('session-id-123');

  res.json({ message: 'Login successful' });
};

export const logoutController = (req: Request, res: Response) => {
  // Clear authentication and session cookies
  res.clearAuthCookie();
  res.clearSessionCookie();

  res.json({ message: 'Logout successful' });
};
```

### Cookie Configuration

Configure cookies via environment variables:

```env
# Cookie Security
COOKIE_SECRET=your-super-secret-cookie-key-change-this-in-production
COOKIE_DOMAIN=localhost

# Cookie Names (optional - defaults provided)
SESSION_COOKIE_NAME=session
AUTH_COOKIE_NAME=auth_token
CSRF_COOKIE_NAME=csrf_token
REMEMBER_COOKIE_NAME=remember_token

# Cookie Max Ages (in milliseconds)
SESSION_COOKIE_MAX_AGE=86400000      # 24 hours
AUTH_COOKIE_MAX_AGE=604800000        # 7 days
CSRF_COOKIE_MAX_AGE=86400000         # 24 hours
REMEMBER_COOKIE_MAX_AGE=2592000000   # 30 days
```

### Security Features

- **HTTPS Only**: Cookies are automatically marked as secure in production
- **HttpOnly**: Sensitive cookies are not accessible via JavaScript
- **SameSite**: CSRF protection with appropriate SameSite settings
- **Signed Cookies**: Cryptographic signing prevents tampering
- **Domain Restriction**: Cookies are restricted to specified domains
- **Expiration**: All cookies have appropriate expiration times

### Middleware Integration

The cookie middleware automatically adds utility methods to Express request and response objects:

```typescript
// Available on all requests
req.authToken; // Extracted auth token (if present)
req.sessionId; // Extracted session ID (if present)
req.cookieUtils; // Cookie utility methods

// Available on all responses
res.setCookie(name, value, type);
res.setAuthCookie(token);
res.clearAuthCookie();
res.setSessionCookie(sessionId);
res.clearSessionCookie();
```

## CORS Management

This boilerplate includes comprehensive Cross-Origin Resource Sharing (CORS) management with environment-specific configurations and security features.

### Features

- **Environment-based Configuration**: Different CORS settings for development, staging, and production
- **Dynamic Origin Validation**: Flexible origin checking with support for arrays, wildcards, and functions
- **Security Middleware**: Additional CORS-related security checks and headers
- **Logging and Monitoring**: Detailed CORS request logging and metrics
- **Validation Tools**: Built-in configuration validation and testing endpoints

### CORS Configuration

Configure CORS via environment variables:

```env
# CORS Configuration
CORS_ORIGIN=http://localhost:3000,http://localhost:3001
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400,http://localhost:3001
CORS_METHODS=GET,HEAD,PUT,PATCH,POST,DELETE
CORS_ALLOWED_HEADERS=Origin,X-Requested-With,Content-Type,Accept,Authorization
CORS_CREDENTIALS=true
CORS_MAX_AGE=86400
CORS_EXPOSED_HEADERS=X-Total-Count,X-Page-Count
CORS_BLOCK_SUSPICIOUS=false
```

### Environment-Specific Behavior

#### Development

- **Permissive Origins**: Allows common localhost ports by default
- **Detailed Logging**: Logs all CORS requests for debugging
- **Credentials Enabled**: Supports cookie-based authentication

#### Production

- **Strict Origins**: Only explicitly allowed origins are permitted
- **Security Warnings**: Alerts for insecure configurations
- **Suspicious Origin Detection**: Blocks private IP ranges if enabled

### CORS API Endpoints

- `GET /api/v1/cors/config` - Get current CORS configuration
- `POST /api/v1/cors/check-origin` - Check if an origin is allowed
- `GET /api/v1/cors/origins` - Get allowed origins
- `GET /api/v1/cors/methods` - Get allowed HTTP methods
- `GET /api/v1/cors/headers` - Get allowed headers
- `GET /api/v1/cors/test-preflight` - Test CORS preflight requests
- `GET /api/v1/cors/request-info` - Get current request CORS information
- `GET /api/v1/cors/validate` - Validate CORS configuration

### Usage Examples

#### Basic CORS Configuration

```typescript
// The CORS configuration is automatically applied
// No additional code needed in controllers

// Access CORS utilities
import { CorsUtils } from '@/config/cors';

// Check if origin is allowed
const isAllowed = CorsUtils.isOriginAllowed('https://example.com');

// Get configuration summary
const config = CorsUtils.getConfigSummary();
```

#### Custom Origin Validation

```typescript
// In your middleware or controller
const origin = req.get('Origin');
if (origin && !CorsUtils.isOriginAllowed(origin)) {
  return res.status(403).json({ error: 'Origin not allowed' });
}
```

### CORS Middleware Stack

The boilerplate includes multiple CORS-related middleware:

1. **CORS Middleware**: Main CORS handling (from `cors` package)
2. **CORS Logging**: Logs CORS requests for debugging
3. **CORS Security**: Additional security headers and checks
4. **CORS Metrics**: Request tracking and monitoring

### Security Features

- **Origin Validation**: Strict origin checking in production
- **Credentials Handling**: Secure credential management
- **Preflight Caching**: Configurable preflight response caching
- **Security Headers**: Additional security headers for CORS responses
- **Suspicious Origin Detection**: Blocks private IP ranges in production

### Configuration Validation

The system automatically validates CORS configuration on startup:

- Warns about insecure settings in production
- Validates HTTP methods and headers
- Checks for conflicting settings
- Provides configuration recommendations

### Testing CORS

Use the built-in endpoints to test your CORS setup:

```bash
# Test if an origin is allowed
curl -X POST http://localhost:3000/api/v1/cors/check-origin \
  -H "Content-Type: application/json" \
  -d '{"origin": "https://example.com"}'

# Get current configuration
curl http://localhost:3000/api/v1/cors/config

# Validate configuration
curl http://localhost:3000/api/v1/cors/validate
```

### Common CORS Scenarios

#### Allow Multiple Specific Origins

```env
CORS_ORIGIN=https://app.example.com,https://admin.example.com
```

#### Allow All Origins (Development Only)

```env
CORS_ORIGIN=*
```

#### Custom Headers

```env
CORS_ALLOWED_HEADERS=Origin,Content-Type,Authorization,X-Custom-Header
```

#### Disable Credentials

```env
CORS_CREDENTIALS=false
```

### Troubleshooting

1. **CORS Error in Browser**: Check if your origin is in `CORS_ORIGIN`
2. **Preflight Failures**: Verify `CORS_METHODS` includes your HTTP method
3. **Header Issues**: Ensure custom headers are in `CORS_ALLOWED_HEADERS`
4. **Credential Problems**: Check `CORS_CREDENTIALS` setting

### Best Practices

- **Never use `*` for origins in production**
- **Always specify exact origins for production**
- **Enable credentials only when necessary**
- **Use HTTPS origins in production**
- **Regularly validate your CORS configuration**
- **Monitor CORS requests for security issues**

## JWT Authentication

This boilerplate includes a comprehensive JWT (JSON Web Token) authentication system with support for access tokens, refresh tokens, and verification tokens.

### Features

- **Secure Token-Based Authentication**: Stateless authentication using JWT tokens
- **Multiple Token Types**: Access, refresh, and verification tokens with different expiration times
- **HTTP-Only Cookie Storage**: Secure token storage in HTTP-only cookies
- **Token Refresh Mechanism**: Automatic token renewal using refresh tokens
- **Role-Based Access Control**: Middleware for role-based route protection
- **Comprehensive Error Handling**: Custom JWT error classes with proper HTTP status codes
- **TypeScript Support**: Full type safety for JWT operations
- **Extensive Testing**: Unit and integration tests for all JWT functionality

### JWT Configuration

Configure JWT authentication via environment variables:

```env
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
JWT_VERIFICATION_TOKEN_EXPIRY=1h
JWT_ISSUER=boilerplate-express-nodejs-typescript
JWT_AUDIENCE=boilerplate-users
JWT_ALGORITHM=HS256

# JWT Cookie Configuration
JWT_ACCESS_COOKIE_NAME=jwt_access
JWT_REFRESH_COOKIE_NAME=jwt_refresh
JWT_ACCESS_COOKIE_MAX_AGE=900000
JWT_REFRESH_COOKIE_MAX_AGE=604800000
```

### Token Types

#### Access Tokens

- **Purpose**: API authentication and authorization
- **Expiration**: Short-lived (15 minutes default)
- **Storage**: HTTP-only cookies or Authorization header
- **Contains**: User ID, email, role, and permissions

#### Refresh Tokens

- **Purpose**: Generate new access tokens
- **Expiration**: Long-lived (7 days default)
- **Storage**: HTTP-only cookies
- **Contains**: Minimal user information (user ID only)

#### Verification Tokens

- **Purpose**: Email verification, password reset, etc.
- **Expiration**: Short-lived (1 hour default)
- **Storage**: Sent via email or other secure channels
- **Contains**: User ID, email, and purpose

### Authentication Flow

#### Login Process

```typescript
// POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "password123",
  "rememberMe": true
}

// Response
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "1",
      "email": "user@example.com",
      "role": "user",
      "isActive": true
    },
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

#### Token Refresh

```typescript
// POST /api/v1/auth/refresh
// Refresh token automatically extracted from cookies

// Response
{
  "success": true,
  "message": "Tokens refreshed successfully",
  "data": {
    "tokens": {
      "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
  }
}
```

### Middleware Usage

#### Protect Routes with Authentication

```typescript
import { authenticateToken } from '@/middleware/jwtMiddleware';

// Require valid access token
app.get('/api/v1/protected', authenticateToken(), (req, res) => {
  // req.user contains authenticated user information
  res.json({ user: req.user });
});
```

#### Optional Authentication

```typescript
import { optionalAuthentication } from '@/middleware/jwtMiddleware';

// Authentication is optional
app.get('/api/v1/public', optionalAuthentication(), (req, res) => {
  // req.user is available if token is provided, undefined otherwise
  const message = req.user ? `Hello ${req.user.email}` : 'Hello guest';
  res.json({ message });
});
```

#### Role-Based Access Control

```typescript
import { authenticateToken, requireRole } from '@/middleware/jwtMiddleware';

// Require admin role
app.get('/api/v1/admin', authenticateToken(), requireRole('admin'), (req, res) => {
  res.json({ message: 'Admin only content' });
});

// Require one of multiple roles
app.get(
  '/api/v1/moderator',
  authenticateToken(),
  requireRole(['admin', 'moderator']),
  (req, res) => {
    res.json({ message: 'Moderator content' });
  }
);
```

#### Refresh Token Endpoints

```typescript
import { requireRefreshToken } from '@/middleware/jwtMiddleware';

// Require valid refresh token
app.post('/api/v1/auth/refresh', requireRefreshToken(), (req, res) => {
  // Handle token refresh logic
});
```

#### Verification Token Endpoints

```typescript
import { requireVerificationToken } from '@/middleware/jwtMiddleware';

// Require email verification token
app.post(
  '/api/v1/auth/verify-email',
  requireVerificationToken('email_verification'),
  (req, res) => {
    // Handle email verification
  }
);
```

### JWT Utilities

#### Generate Tokens

```typescript
import { JWTUtils } from '@/utils/jwt';

// Generate token pair
const user = { id: '1', email: 'user@example.com', role: 'user' };
const tokens = JWTUtils.generateTokenPair(user);

// Generate verification token
const verificationToken = JWTUtils.generateVerificationToken(
  '1',
  'email_verification',
  'user@example.com'
);
```

#### Verify Tokens

```typescript
import { JWTUtils } from '@/utils/jwt';

try {
  // Verify access token
  const payload = JWTUtils.verifyToken(token, 'access');
  const user = JWTUtils.extractUser(payload);

  // Verify verification token
  const verificationPayload = JWTUtils.verifyVerificationToken(token, 'email_verification');
} catch (error) {
  if (error instanceof TokenExpiredError) {
    // Handle expired token
  } else if (error instanceof TokenInvalidError) {
    // Handle invalid token
  }
}
```

### Cookie Integration

JWT tokens are automatically stored in secure HTTP-only cookies:

```typescript
// Set JWT cookies
res.setJWTCookies(accessToken, refreshToken);

// Clear JWT cookies (logout)
res.clearJWTCookies();

// Set individual cookies
res.setAccessTokenCookie(accessToken);
res.setRefreshTokenCookie(refreshToken);
```

### Error Handling

The JWT system includes comprehensive error handling:

#### JWT Error Types

- **TokenExpiredError**: Token has expired
- **TokenInvalidError**: Token signature is invalid or malformed
- **TokenMissingError**: Required token is not provided
- **JWTError**: Base class for all JWT-related errors

#### Error Response Format

```json
{
  "success": false,
  "message": "access token has expired",
  "error": "TokenExpiredError",
  "timestamp": "2024-01-26T10:30:00.000Z"
}
```

### Security Features

#### Token Security

- **Cryptographic Signatures**: All tokens are cryptographically signed
- **Short-Lived Access Tokens**: Minimize exposure window (15 minutes default)
- **Secure Cookie Storage**: HTTP-only, secure, and SameSite cookies
- **Algorithm Specification**: Prevents algorithm confusion attacks

#### Production Security

- **Strong Secret Keys**: Enforced minimum key length in production
- **HTTPS-Only Cookies**: Automatic secure flag in production
- **Token Expiration Warnings**: Alerts for overly long token expiration times
- **Configuration Validation**: Startup validation of JWT configuration

### Testing

The JWT system includes comprehensive tests:

#### Unit Tests

- JWT utility functions (`src/tests/utils/jwt.test.ts`)
- JWT middleware (`src/tests/middleware/jwtMiddleware.test.ts`)
- AuthService (`src/tests/services/AuthService.test.ts`)

#### Integration Tests

- Complete authentication flow (`src/tests/integration/jwt-auth.test.ts`)
- Token refresh workflow
- Protected route access
- Error handling scenarios

#### Run Tests

```bash
# Run all tests
npm test

# Run JWT-specific tests
npm test -- --testPathPattern=jwt

# Run with coverage
npm run test:coverage
```

### Usage Examples

#### Complete Authentication Implementation

```typescript
import express from 'express';
import { AuthService } from '@/services/AuthService';
import { authenticateToken } from '@/middleware/jwtMiddleware';
import { asyncHandler } from '@/middleware/errorHandler';

const router = express.Router();
const authService = new AuthService();

// Login endpoint
router.post(
  '/login',
  asyncHandler(async (req, res) => {
    const { email, password, rememberMe } = req.body;

    const result = await authService.login({ email, password, rememberMe });

    // Set JWT cookies
    res.setJWTCookies(result.tokens.accessToken, result.tokens.refreshToken);

    res.json({
      success: true,
      message: result.message,
      data: { user: result.user, tokens: result.tokens },
    });
  })
);

// Protected profile endpoint
router.get(
  '/profile',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    const user = await authService.getUserFromToken(req.token!);

    res.json({
      success: true,
      data: { user },
    });
  })
);

// Logout endpoint
router.post(
  '/logout',
  authenticateToken(),
  asyncHandler(async (req, res) => {
    await authService.logout(req.user!.id);

    // Clear JWT cookies
    res.clearJWTCookies();

    res.json({
      success: true,
      message: 'Logout successful',
    });
  })
);
```

### Migration from Session-Based Auth

If migrating from session-based authentication:

1. **Gradual Migration**: JWT middleware supports both token and session authentication
2. **Cookie Compatibility**: Existing cookie utilities are preserved
3. **Error Handling**: JWT errors integrate with existing error handling
4. **User Service**: AuthService integrates with existing UserService

### Best Practices

#### Security

- **Use strong JWT secrets** (32+ characters in production)
- **Keep access tokens short-lived** (15 minutes or less)
- **Store tokens in HTTP-only cookies** (not localStorage)
- **Implement proper token refresh** (before expiration)
- **Validate tokens on every request** (don't trust client-side validation)

#### Performance

- **Cache JWT configuration** (avoid repeated parsing)
- **Use efficient algorithms** (HS256 for symmetric keys)
- **Minimize token payload** (only include necessary claims)
- **Implement token blacklisting** (for immediate revocation if needed)

#### Development

- **Use longer expiration times** in development for convenience
- **Enable debug logging** for JWT operations
- **Test token expiration scenarios** thoroughly
- **Validate configuration** on application startup
