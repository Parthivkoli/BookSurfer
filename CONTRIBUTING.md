# Contributing to BookSurfer

Thank you for your interest in contributing to BookSurfer! This document provides guidelines and instructions for contributing.

## Code of Conduct

Be respectful, inclusive, and professional in all interactions.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR-USERNAME/BookSurfer.git`
3. Create a feature branch: `git checkout -b feature/your-feature-name`
4. Install dependencies: `npm install`
5. Start development: `npm run dev`

## Development Guidelines

### Code Style
- Use TypeScript for all new code
- Follow the existing code structure
- Run `npm run lint` before committing
- Format code with Prettier (configured in ESLint)

### Commits
- Use clear, descriptive commit messages
- Reference issues: "Fixes #123" or "Relates to #456"
- Keep commits focused and atomic

### Pull Requests
1. Update documentation if needed
2. Add tests for new features
3. Ensure `npm run build` succeeds
4. Write a clear PR description
5. Link related issues

### Testing
- Write tests for new functionality
- Run tests: `npm run test`
- Aim for 70%+ code coverage
- Test both happy paths and error cases

## Project Structure

```
BookSurfer/
├── app/                 # Next.js app router (pages, layouts)
├── components/          # React components
├── hooks/              # Custom React hooks
├── lib/                # Utilities and services
│   ├── api/           # External API integrations
│   ├── utils.ts       # Helper functions
│   └── auth.ts        # Authentication logic
├── public/            # Static assets
├── types/             # TypeScript type definitions
├── tests/             # Test files
└── docs/              # Documentation
```

## Making Changes

### Bug Fixes
1. Create an issue describing the bug
2. Reference it in your PR: "Fixes #123"
3. Provide before/after behavior
4. Add regression tests

### New Features
1. Discuss in an issue first (optional but recommended)
2. Create a feature branch
3. Follow the existing code patterns
4. Add tests and documentation
5. Submit a PR with clear description

### Documentation Updates
1. Keep docs in `docs/` or root level
2. Use clear, concise language
3. Include examples where helpful
4. Update IMPROVEMENT_ANALYSIS.md if relevant

## Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## Linting & Formatting

```bash
# Run ESLint
npm run lint

# Type checking
npx tsc --noEmit

# Build
npm run build
```

## Environment Setup

See [docs/ENVIRONMENT.md](../docs/ENVIRONMENT.md) for environment variable setup.

## Deployment

- Main branch auto-deploys to Vercel
- Preview deployments for each PR
- See [docs/DEPLOYMENT.md](../docs/DEPLOYMENT.md) for details

## Questions?

- Open an issue with the `question` label
- Check existing issues and discussions
- Check README and docs first

## License

By contributing, you agree your code will be licensed under the MIT License.

---

Thanks for contributing! 🚀
