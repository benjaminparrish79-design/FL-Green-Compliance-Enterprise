# Contributing to FL Green Compliance Enterprise™

Thank you for your interest in contributing to FL Green Compliance! This document provides guidelines and instructions for contributing to the project.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Report security issues privately to security@flgcompliance.com
- No harassment or discrimination

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10.4.1+
- PostgreSQL 15+
- Git

### Development Setup

```bash
# Clone the repository
git clone https://github.com/yourusername/fl-green-compliance.git
cd fl-green-compliance

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local

# Run database migrations
pnpm db:push

# Start development server
pnpm dev
```

## Development Workflow

### Branch Naming

- `feature/description` - New features
- `fix/description` - Bug fixes
- `docs/description` - Documentation updates
- `refactor/description` - Code refactoring
- `test/description` - Test additions

### Commit Messages

Follow conventional commits:

```
feat: add weather-based compliance alerts
fix: resolve geofence breach detection
docs: update API documentation
test: add tests for work order assignment
refactor: optimize database queries
```

### Pull Request Process

1. Create a feature branch from `develop`
2. Make your changes with clear, descriptive commits
3. Add tests for new functionality
4. Run `pnpm check` to verify TypeScript
5. Run `pnpm test` to run the test suite
6. Run `pnpm format` to format code
7. Create a pull request with a clear description
8. Address review feedback
9. Merge when approved

## Code Standards

### TypeScript

- Use strict mode (`strict: true`)
- Avoid `any` types - use proper typing
- Export types from modules
- Use interfaces for object shapes
- Add JSDoc comments for public APIs

### Testing

- Write tests for new features
- Aim for 70%+ code coverage
- Use Vitest for unit tests
- Test both success and error paths
- Mock external dependencies

### Database

- Use Drizzle ORM for all queries
- Create migrations for schema changes
- Test migrations on clean database
- Document complex queries
- Use transactions for multi-step operations

### Frontend

- Use React hooks and functional components
- Prefer composition over inheritance
- Use shadcn/ui components for consistency
- Add loading and error states
- Test responsive design

### API

- Use tRPC for all backend procedures
- Validate inputs with Zod
- Return typed responses
- Document procedures with JSDoc
- Handle errors gracefully

## Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run specific test file
pnpm test server/auth.test.ts

# Generate coverage report
pnpm test --coverage
```

## Documentation

- Update README.md for significant changes
- Add JSDoc comments to functions
- Document new API endpoints
- Update ARCHITECTURE.md for structural changes
- Add examples for complex features

## Performance

- Profile before optimizing
- Use database indexes for frequently queried fields
- Implement pagination for large datasets
- Cache expensive computations
- Monitor bundle size

## Security

- Never commit secrets or API keys
- Use environment variables for configuration
- Validate all user input
- Sanitize output
- Follow OWASP guidelines
- Report vulnerabilities privately

## Deployment

- Test thoroughly before merging to main
- Use semantic versioning for releases
- Create release notes
- Update CHANGELOG.md
- Tag releases in Git

## Questions?

- Check existing issues and PRs
- Read the documentation
- Ask in discussions
- Email: dev@flgcompliance.com

## License

By contributing, you agree that your contributions will be licensed under the same license as the project.

---

Thank you for contributing to FL Green Compliance! 🎉
