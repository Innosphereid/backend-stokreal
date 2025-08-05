# Testing Documentation

This directory contains comprehensive tests for the StokReal backend API, covering unit tests, integration tests, security tests, and performance tests.

## Test Structure

```
src/tests/
├── services/           # Unit tests for services
│   ├── AuthService.test.ts
│   └── UserService.test.ts
├── integration/        # Integration tests for endpoints
│   └── auth-endpoints.test.ts
├── security/          # Security tests
│   └── security.test.ts
├── performance/       # Performance tests
│   └── performance.test.ts
├── setup.ts          # Test configuration
└── README.md         # This file
```

## Running Tests

### All Tests

```bash
npm test
```

### Specific Test Categories

#### Unit Tests

```bash
npm run test:unit
```

Tests individual service methods in isolation with mocked dependencies.

#### Integration Tests

```bash
npm run test:integration
```

Tests complete API endpoints with mocked external dependencies.

#### Security Tests

```bash
npm run test:security
```

Tests security measures including JWT handling, input validation, and rate limiting.

#### Performance Tests

```bash
npm run test:performance
```

Tests response times and load handling capabilities.

### Coverage Reports

```bash
npm run test:coverage
```

Generates detailed coverage reports in HTML format.

### Continuous Integration

```bash
npm run test:ci
```

Runs tests in CI mode with coverage reporting.

## Test Coverage Requirements

- **Minimum Coverage**: 90% for all metrics (branches, functions, lines, statements)
- **Response Time**: All endpoints must respond within 500ms
- **Security**: Comprehensive security testing for all endpoints
- **Performance**: Load testing with concurrent requests

## Test Categories

### 1. Unit Tests (`services/`)

Tests individual service methods with mocked dependencies:

- **AuthService**: Registration, login, email verification, password reset
- **UserService**: CRUD operations, user management, statistics
- **JWTUtils**: Token generation, verification, refresh
- **PasswordUtils**: Password hashing and verification

### 2. Integration Tests (`integration/`)

Tests complete API endpoints:

- **Authentication Endpoints**: Register, login, logout, refresh
- **Email Verification**: Token verification flow
- **Password Reset**: Forgot password and reset password
- **Input Validation**: Request validation and error handling
- **Rate Limiting**: Rate limiting behavior
- **Security Headers**: HTTP security headers

### 3. Security Tests (`security/`)

Comprehensive security testing:

- **JWT Security**: Token validation, expiration, signature verification
- **Input Validation**: SQL injection, XSS, NoSQL injection prevention
- **Rate Limiting**: IP and email-based rate limiting
- **Password Security**: Strong password requirements, secure hashing
- **Error Handling**: No exposure of internal errors or stack traces
- **HTTP Security**: Security headers, CORS, request size limits

### 4. Performance Tests (`performance/`)

Performance and load testing:

- **Response Time**: All endpoints under 500ms
- **Load Testing**: Concurrent request handling
- **Database Performance**: Query efficiency and pagination
- **Memory Usage**: Memory leak detection
- **Error Handling Performance**: Fast error responses

## Test Configuration

### Environment Variables

Tests use a separate test environment with the following configuration:

```env
NODE_ENV=test
JWT_SECRET=test-jwt-secret-key-for-testing-purposes-only
DB_NAME=stokreal_test
MAIL_LOG_ONLY=true
```

### Mocking Strategy

- **External Services**: Email, database, external APIs
- **Time-dependent Operations**: JWT expiration, rate limiting
- **Random Operations**: UUID generation, token creation

### Test Data

- **Valid Test Data**: Realistic but safe test data
- **Invalid Test Data**: Edge cases and malicious inputs
- **Performance Data**: Large datasets for load testing

## Writing New Tests

### Unit Test Template

```typescript
import { ServiceName } from '../../services/ServiceName';

describe('ServiceName', () => {
  let service: ServiceName;

  beforeEach(() => {
    service = new ServiceName();
  });

  describe('methodName', () => {
    it('should handle success case', async () => {
      // Arrange
      const input = {
        /* test data */
      };

      // Act
      const result = await service.methodName(input);

      // Assert
      expect(result).toEqual(expectedOutput);
    });

    it('should handle error case', async () => {
      // Arrange
      const invalidInput = {
        /* invalid data */
      };

      // Act & Assert
      await expect(service.methodName(invalidInput)).rejects.toThrow('Expected error message');
    });
  });
});
```

### Integration Test Template

```typescript
import request from 'supertest';
import { app } from '../../index';

describe('Endpoint Integration Tests', () => {
  it('should handle valid request', async () => {
    const response = await request(app).post('/api/v1/endpoint').send(validData).expect(200);

    expect(response.body).toMatchObject(expectedResponse);
  });
});
```

## Best Practices

### 1. Test Isolation

- Each test should be independent
- Use `beforeEach` to reset state
- Mock external dependencies

### 2. Descriptive Test Names

- Use descriptive test names that explain the scenario
- Follow the pattern: "should [expected behavior] when [condition]"

### 3. Arrange-Act-Assert Pattern

- **Arrange**: Set up test data and mocks
- **Act**: Execute the method being tested
- **Assert**: Verify the expected outcome

### 4. Comprehensive Coverage

- Test happy path scenarios
- Test error conditions
- Test edge cases
- Test security vulnerabilities

### 5. Performance Considerations

- Keep tests fast and efficient
- Use appropriate timeouts
- Clean up resources after tests

## Debugging Tests

### Verbose Output

```bash
npm run test:debug
```

### Watch Mode

```bash
npm run test:watch
```

### Specific Test File

```bash
npm test -- AuthService.test.ts
```

### Coverage for Specific File

```bash
npm run test:coverage -- --collectCoverageFrom="src/services/AuthService.ts"
```

## Continuous Integration

Tests are configured to run in CI environments with:

- Coverage reporting
- Parallel test execution
- Failure reporting
- Performance monitoring

## Security Testing Checklist

- [ ] JWT token validation
- [ ] SQL injection prevention
- [ ] XSS prevention
- [ ] Rate limiting
- [ ] Input validation
- [ ] Error handling
- [ ] Security headers
- [ ] CORS configuration
- [ ] Request size limits
- [ ] Password security

## Performance Testing Checklist

- [ ] Response time under 500ms
- [ ] Concurrent request handling
- [ ] Memory usage monitoring
- [ ] Database query optimization
- [ ] Error handling performance
- [ ] Rate limiting performance

## Troubleshooting

### Common Issues

1. **Test Timeouts**: Increase timeout in `jest.config.js`
2. **Memory Leaks**: Check for unclosed connections or timers
3. **Mock Issues**: Ensure mocks are properly reset between tests
4. **Environment Variables**: Verify test environment configuration

### Debug Commands

```bash
# Run specific test with verbose output
npm test -- --verbose AuthService.test.ts

# Run tests with coverage for specific file
npm run test:coverage -- --collectCoverageFrom="src/services/AuthService.ts"

# Debug mode with open handles detection
npm run test:debug
```
