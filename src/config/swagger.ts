import swaggerJsdoc from 'swagger-jsdoc';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Express Node.js TypeScript Boilerplate API',
      version: '1.0.0',
      description:
        'A comprehensive Node.js boilerplate with TypeScript, Express, PostgreSQL, and Knex',
      contact: {
        name: 'API Support',
        email: 'support@example.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api/v1',
        description: 'Development server',
      },
      {
        url: 'https://api.example.com/api/v1',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'JWT token for authentication',
        },
        cookieAuth: {
          type: 'apiKey',
          in: 'cookie',
          name: 'auth_token',
          description: 'Authentication cookie',
        },
      },
      schemas: {
        // Common schemas
        ApiResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Response message',
            },
            data: {
              type: 'object',
              description: 'Response data',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Response timestamp',
            },
          },
          required: ['message', 'timestamp'],
        },
        ErrorResponse: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'Error message',
            },
            message: {
              type: 'string',
              description: 'Error description',
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
              description: 'Error timestamp',
            },
          },
          required: ['error', 'timestamp'],
        },
        ValidationError: {
          type: 'object',
          properties: {
            field: {
              type: 'string',
              description: 'Field name with validation error',
            },
            message: {
              type: 'string',
              description: 'Validation error message',
            },
          },
          required: ['field', 'message'],
        },
        PaginationMeta: {
          type: 'object',
          properties: {
            page: {
              type: 'integer',
              description: 'Current page number',
            },
            limit: {
              type: 'integer',
              description: 'Number of items per page',
            },
            total: {
              type: 'integer',
              description: 'Total number of items',
            },
            totalPages: {
              type: 'integer',
              description: 'Total number of pages',
            },
            hasNext: {
              type: 'boolean',
              description: 'Whether there is a next page',
            },
            hasPrev: {
              type: 'boolean',
              description: 'Whether there is a previous page',
            },
          },
          required: ['page', 'limit', 'total', 'totalPages', 'hasNext', 'hasPrev'],
        },
        PaginatedResponse: {
          allOf: [
            { $ref: '#/components/schemas/ApiResponse' },
            {
              type: 'object',
              properties: {
                meta: {
                  $ref: '#/components/schemas/PaginationMeta',
                },
              },
              required: ['meta'],
            },
          ],
        },

        // User schemas
        User: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
              description: 'User ID',
            },
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            first_name: {
              type: 'string',
              description: 'First name',
            },
            last_name: {
              type: 'string',
              description: 'Last name',
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user is active',
            },
            last_login: {
              type: 'string',
              format: 'date-time',
              description: 'Last login timestamp',
            },
            created_at: {
              type: 'string',
              format: 'date-time',
              description: 'Account creation timestamp',
            },
            updated_at: {
              type: 'string',
              format: 'date-time',
              description: 'Last update timestamp',
            },
          },
          required: ['id', 'email', 'username', 'first_name', 'last_name', 'is_active'],
        },
        CreateUserRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            first_name: {
              type: 'string',
              description: 'First name',
            },
            last_name: {
              type: 'string',
              description: 'Last name',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
            },
          },
          required: ['email', 'username', 'first_name', 'last_name', 'password'],
        },
        UpdateUserRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            first_name: {
              type: 'string',
              description: 'First name',
            },
            last_name: {
              type: 'string',
              description: 'Last name',
            },
            is_active: {
              type: 'boolean',
              description: 'Whether the user is active',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
            },
          },
        },

        // Auth schemas
        RegisterRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            username: {
              type: 'string',
              description: 'Username',
            },
            first_name: {
              type: 'string',
              description: 'First name',
            },
            last_name: {
              type: 'string',
              description: 'Last name',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
            },
            confirm_password: {
              type: 'string',
              format: 'password',
              description: 'Password confirmation',
            },
          },
          required: [
            'email',
            'username',
            'first_name',
            'last_name',
            'password',
            'confirm_password',
          ],
        },
        RegisterResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['message', 'data', 'timestamp'],
        },
        LoginRequest: {
          type: 'object',
          properties: {
            email: {
              type: 'string',
              format: 'email',
              description: 'User email address',
            },
            password: {
              type: 'string',
              format: 'password',
              description: 'Password',
            },
            remember_me: {
              type: 'boolean',
              description: 'Whether to remember the user',
            },
          },
          required: ['email', 'password'],
        },
        LoginResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              properties: {
                user: {
                  $ref: '#/components/schemas/User',
                },
                tokens: {
                  type: 'object',
                  properties: {
                    access_token: {
                      type: 'string',
                      description: 'JWT access token',
                    },
                    refresh_token: {
                      type: 'string',
                      description: 'JWT refresh token',
                    },
                  },
                  required: ['access_token', 'refresh_token'],
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['message', 'data', 'timestamp'],
        },

        // Cookie schemas
        CookieRequest: {
          type: 'object',
          properties: {
            name: {
              type: 'string',
              description: 'Cookie name',
            },
            value: {
              type: 'string',
              description: 'Cookie value',
            },
            options: {
              type: 'object',
              properties: {
                maxAge: {
                  type: 'integer',
                  description: 'Cookie max age in milliseconds',
                },
                httpOnly: {
                  type: 'boolean',
                  description: 'Whether the cookie is HTTP only',
                },
                secure: {
                  type: 'boolean',
                  description: 'Whether the cookie is secure',
                },
                sameSite: {
                  type: 'string',
                  enum: ['strict', 'lax', 'none'],
                  description: 'Same site policy',
                },
              },
            },
          },
          required: ['name', 'value'],
        },
        CookieResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Success message',
            },
            data: {
              type: 'object',
              properties: {
                cookies: {
                  type: 'object',
                  description: 'Cookie data',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['message', 'timestamp'],
        },

        // CORS schemas
        CorsConfig: {
          type: 'object',
          properties: {
            origin: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Allowed origins',
            },
            methods: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Allowed HTTP methods',
            },
            allowedHeaders: {
              type: 'array',
              items: {
                type: 'string',
              },
              description: 'Allowed headers',
            },
            credentials: {
              type: 'boolean',
              description: 'Whether credentials are allowed',
            },
          },
        },
        CorsValidationResponse: {
          type: 'object',
          properties: {
            message: {
              type: 'string',
              description: 'Validation message',
            },
            data: {
              type: 'object',
              properties: {
                isValid: {
                  type: 'boolean',
                  description: 'Whether the CORS setup is valid',
                },
                issues: {
                  type: 'array',
                  items: {
                    type: 'string',
                  },
                  description: 'List of validation issues',
                },
              },
            },
            timestamp: {
              type: 'string',
              format: 'date-time',
            },
          },
          required: ['message', 'timestamp'],
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'Authentication and authorization endpoints',
      },
      {
        name: 'Users',
        description: 'User management endpoints',
      },
      {
        name: 'Cookies',
        description: 'Cookie management endpoints',
      },
      {
        name: 'CORS',
        description: 'CORS configuration and testing endpoints',
      },
      {
        name: 'Health',
        description: 'Health check and system status endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export default options;
