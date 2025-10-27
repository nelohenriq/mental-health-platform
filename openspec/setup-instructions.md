# Mental Health Support Platform - Setup Instructions

## Prerequisites

Before starting, ensure you have the following installed:

- **Node.js 20+ LTS** - Download from [nodejs.org](https://nodejs.org/)
- **pnpm** - Install with `npm install -g pnpm`
- **Git** - Version control system
- **VS Code** - Recommended editor with TypeScript support

## 1. Project Initialization

### Clone and Setup Repository
```bash
# Clone the repository (replace with your actual repo)
git clone <your-repo-url>
cd mental-health-platform

# Install dependencies
pnpm install

# Copy environment variables
cp .env.example .env.local
```

### Environment Configuration
Edit `.env.local` with your configuration:

```env
# Database
DATABASE_URL="file:./dev.db"

# NextAuth.js
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret-key-here"

# AI Providers (optional - users can configure their own)
OPENAI_API_KEY="your-openai-key"
GOOGLE_AI_API_KEY="your-gemini-key"
GROQ_API_KEY="your-groq-key"
XAI_API_KEY="your-xai-key"

# Optional: Monitoring
SENTRY_DSN="your-sentry-dsn"
```

## 2. Database Setup

### Initialize Prisma
```bash
# Generate Prisma client
pnpm prisma generate

# Run database migrations
pnpm prisma db push

# (Optional) Seed database with sample data
pnpm prisma db seed
```

### Database Schema
The Prisma schema is located in `prisma/schema.prisma`. Key models include:
- `User` - User accounts and profiles
- `MoodEntry` - Daily mood tracking
- `CBTExercise` - Cognitive behavioral therapy content
- `Conversation` - AI chat conversations
- `UserSettings` - User preferences and AI provider configurations

## 3. Development Server

### Start Development Environment
```bash
# Start Next.js development server
pnpm dev

# In another terminal, start database studio (optional)
pnpm prisma studio
```

The application will be available at:
- **Web App**: http://localhost:3000
- **Database Studio**: http://localhost:5555 (if running Prisma Studio)

## 4. Mobile Development Setup

### Expo CLI Installation
```bash
# Install Expo CLI globally
npm install -g @expo/cli

# Login to Expo (optional, for publishing)
expo login
```

### Mobile App Development
```bash
# Navigate to mobile app directory (if separate)
cd apps/mobile

# Install mobile dependencies
pnpm install

# Start Expo development server
pnpm start

# Or run on specific platform
pnpm ios    # iOS Simulator
pnpm android # Android Emulator
pnpm web    # Web version
```

## 5. AI Provider Configuration

### User API Key Management
The app supports multiple AI providers. Users can configure their own API keys in the settings:

1. **OpenAI GPT-4**: Most reliable for therapeutic conversations
2. **Google Gemini**: Good alternative with strong reasoning
3. **Groq**: Fastest inference for real-time responses
4. **xAI Grok**: Creative responses with good context understanding

### Testing AI Integration
```bash
# Test AI providers (create a test script)
node scripts/test-ai-providers.js
```

## 6. Testing Setup

### Run Test Suite
```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test -- components/Button.test.tsx

# Generate coverage report
pnpm test:coverage
```

### End-to-End Testing
```bash
# Install Playwright browsers
pnpm exec playwright install

# Run E2E tests
pnpm test:e2e
```

## 7. Code Quality Tools

### Linting and Formatting
```bash
# Run ESLint
pnpm lint

# Run Prettier
pnpm format

# Fix linting issues automatically
pnpm lint:fix
```

### Git Hooks Setup
```bash
# Install Husky for git hooks
pnpm prepare

# Git hooks will now run automatically on commit
```

## 8. Build and Deployment

### Production Build
```bash
# Build for production
pnpm build

# Start production server locally
pnpm start
```

### Deployment to Vercel
```bash
# Install Vercel CLI
npm install -g vercel

# Deploy to Vercel
vercel

# For production deployment
vercel --prod
```

### Database Deployment
For production, switch from SQLite to MongoDB:

1. **MongoDB Atlas**: Cloud-hosted MongoDB with free tier
2. **Railway**: Affordable MongoDB hosting
3. **AWS DocumentDB**: Managed MongoDB-compatible service

Update your `DATABASE_URL` in production environment variables.

## 9. Monitoring and Analytics

### Vercel Analytics
Automatically enabled with Vercel deployment. View metrics at:
- https://vercel.com/your-project/analytics

### Sentry Error Tracking
```bash
# Configure Sentry in next.config.js
# Add your DSN to environment variables
```

### Custom Analytics (Optional)
Consider adding PostHog for detailed user behavior analytics.

## 10. Development Workflow

### Monorepo Management with Turborepo
```bash
# Run all tasks
pnpm run build

# Run specific app
pnpm run dev --filter=web

# Run with Turborepo cache
pnpm run build --cache-dir=.turbo
```

### Recommended VS Code Extensions
- TypeScript and JavaScript Language Features
- Tailwind CSS IntelliSense
- Prisma
- Prettier
- ESLint

## 11. Troubleshooting

### Common Issues

**Database Connection Issues**
```bash
# Reset database
pnpm prisma migrate reset

# Re-generate client
pnpm prisma generate
```

**Build Errors**
```bash
# Clear Next.js cache
rm -rf .next

# Clear node_modules and reinstall
rm -rf node_modules pnpm-lock.yaml
pnpm install
```

**AI Provider Errors**
- Check API keys in `.env.local`
- Verify API quotas and billing
- Test with different providers

### Performance Optimization
```bash
# Analyze bundle size
pnpm build --analyze

# Run Lighthouse audit
pnpm lighthouse
```

## 12. Next Steps

After setup is complete:

1. **Review the codebase structure** in the `src/` directory
2. **Customize the UI** using the design system in `components/ui/`
3. **Add your therapeutic content** to the database
4. **Configure AI prompts** for mental health conversations
5. **Test user flows** for mood tracking and CBT exercises

## Support

For issues or questions:
- Check the [Next.js documentation](https://nextjs.org/docs)
- Review [Prisma documentation](https://www.prisma.io/docs)
- Check [tRPC documentation](https://trpc.io/docs)
- Join the community Discord or GitHub discussions

Happy coding! 🚀