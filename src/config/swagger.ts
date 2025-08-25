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

        // Product schemas
        CreateProductRequest: {
          type: 'object',
          required: ['name', 'unit', 'selling_price', 'current_stock'],
          properties: {
            name: { type: 'string', example: 'Indomie Goreng' },
            product_master_id: { type: 'string', example: 'master-uuid-123' },
            sku: { type: 'string', example: 'SKU-20240601-001' },
            barcode: { type: 'string', example: '8991234567890' },
            description: { type: 'string', example: 'Mie goreng instan 80g' },
            unit: { type: 'string', example: 'pcs' },
            cost_price: { type: 'number', example: 2500 },
            selling_price: { type: 'number', example: 3000 },
            current_stock: { type: 'number', example: 100 },
            minimum_stock: { type: 'number', example: 10 },
            search_tags: { type: 'array', items: { type: 'string' }, example: ['mie', 'instan'] },
            category_id: { type: 'string', example: 'cat-uuid-123' },
          },
        },
        UpdateProductRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Indomie Goreng' },
            product_master_id: { type: 'string', example: 'master-uuid-123' },
            sku: { type: 'string', example: 'SKU-20240601-001' },
            barcode: { type: 'string', example: '8991234567890' },
            description: { type: 'string', example: 'Mie goreng instan 80g' },
            unit: { type: 'string', example: 'pcs' },
            cost_price: { type: 'number', example: 2500 },
            selling_price: { type: 'number', example: 3000 },
            current_stock: { type: 'number', example: 100 },
            minimum_stock: { type: 'number', example: 10 },
            search_tags: { type: 'array', items: { type: 'string' }, example: ['mie', 'instan'] },
            category_id: { type: 'string', example: 'cat-uuid-123' },
            is_active: { type: 'boolean', example: true },
          },
        },
        Product: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'prod-uuid-123' },
            user_id: { type: 'string', example: 'user-uuid-123' },
            product_master_id: { type: 'string', example: 'master-uuid-123' },
            name: { type: 'string', example: 'Indomie Goreng' },
            sku: { type: 'string', example: 'SKU-20240601-001' },
            barcode: { type: 'string', example: '8991234567890' },
            description: { type: 'string', example: 'Mie goreng instan 80g' },
            unit: { type: 'string', example: 'pcs' },
            cost_price: { type: 'number', example: 2500 },
            selling_price: { type: 'number', example: 3000 },
            current_stock: { type: 'number', example: 100 },
            minimum_stock: { type: 'number', example: 10 },
            is_active: { type: 'boolean', example: true },
            search_tags: { type: 'array', items: { type: 'string' }, example: ['mie', 'instan'] },
            category_id: { type: 'string', example: 'cat-uuid-123' },
            created_at: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00Z' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
          },
        },
        PaginatedProductResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
                next_cursor: { type: 'string', example: 'prod-uuid-456' },
              },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        ProductResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/Product' },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        ProductStatsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                total_products: { type: 'integer', example: 100 },
                active_products: { type: 'integer', example: 90 },
                low_stock_products: { type: 'integer', example: 5 },
                total_value: { type: 'number', example: 300000 },
                tier_limits: {
                  type: 'object',
                  properties: {
                    products_limit: { type: 'integer', example: 50 },
                    products_used: { type: 'integer', example: 10 },
                    products_remaining: { type: 'integer', example: 40 },
                  },
                },
              },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        ProductSearchResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Product' },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        ProductMasterSuggestionsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', example: 'master-uuid-123' },
                  name: { type: 'string', example: 'Indomie Goreng' },
                  popularity_score: { type: 'number', example: 100 },
                  search_tags: {
                    type: 'array',
                    items: { type: 'string' },
                    example: ['mie', 'instan'],
                  },
                },
              },
            },
          },
        },

        // Category schemas
        CreateCategoryRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string', example: 'Makanan' },
            description: { type: 'string', example: 'Kategori makanan dan minuman' },
            color: { type: 'string', example: '#FF0000' },
            sort_order: { type: 'integer', example: 1 },
            parent_id: { type: 'string', example: 'cat-uuid-parent' },
            is_active: { type: 'boolean', example: true },
          },
        },
        UpdateCategoryRequest: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Makanan' },
            description: { type: 'string', example: 'Kategori makanan dan minuman' },
            color: { type: 'string', example: '#FF0000' },
            sort_order: { type: 'integer', example: 1 },
            parent_id: { type: 'string', example: 'cat-uuid-parent' },
            is_active: { type: 'boolean', example: true },
          },
        },
        Category: {
          type: 'object',
          properties: {
            id: { type: 'string', example: 'cat-uuid-123' },
            user_id: { type: 'string', example: 'user-uuid-123' },
            name: { type: 'string', example: 'Makanan' },
            description: { type: 'string', example: 'Kategori makanan dan minuman' },
            color: { type: 'string', example: '#FF0000' },
            sort_order: { type: 'integer', example: 1 },
            parent_id: { type: 'string', example: 'cat-uuid-parent' },
            is_active: { type: 'boolean', example: true },
            created_at: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00Z' },
            updated_at: { type: 'string', format: 'date-time', example: '2024-06-01T12:00:00Z' },
            deleted_at: { type: 'string', format: 'date-time', nullable: true, example: null },
          },
        },
        PaginatedCategoryResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
            meta: {
              type: 'object',
              properties: {
                page: { type: 'integer', example: 1 },
                limit: { type: 'integer', example: 10 },
                total: { type: 'integer', example: 100 },
                totalPages: { type: 'integer', example: 10 },
                hasNext: { type: 'boolean', example: true },
                hasPrev: { type: 'boolean', example: false },
                next_cursor: { type: 'string', example: 'cat-uuid-456' },
              },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        CategoryResponse: {
          type: 'object',
          properties: {
            data: { $ref: '#/components/schemas/Category' },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        CategoryStatsResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                total_categories: { type: 'integer', example: 20 },
                root_categories: { type: 'integer', example: 5 },
                subcategories: { type: 'integer', example: 15 },
                tier_limits: {
                  type: 'object',
                  properties: {
                    categories_limit: { type: 'integer', example: 20 },
                    categories_used: { type: 'integer', example: 5 },
                    categories_remaining: { type: 'integer', example: 15 },
                  },
                },
              },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        CategorySearchResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'array',
              items: { $ref: '#/components/schemas/Category' },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
        },
        CategoryHierarchyResponse: {
          type: 'object',
          properties: {
            data: {
              type: 'object',
              properties: {
                root: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/Category' },
                },
                subcategories: {
                  type: 'object',
                  additionalProperties: {
                    type: 'array',
                    items: { $ref: '#/components/schemas/Category' },
                  },
                },
              },
            },
            tier_info: {
              type: 'object',
              properties: {
                current_tier: { type: 'string', example: 'free' },
                products_used: { type: 'integer', example: 10 },
                products_limit: { type: 'integer', example: 50 },
                categories_used: { type: 'integer', example: 5 },
                categories_limit: { type: 'integer', example: 20 },
              },
            },
          },
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
      {
        name: 'Products',
        description: 'Product management endpoints',
      },
      {
        name: 'Categories',
        description: 'Category management endpoints',
      },
    ],
  },
  apis: ['./src/routes/*.ts', './src/controllers/*.ts'], // Path to the API docs
};

export default options;
