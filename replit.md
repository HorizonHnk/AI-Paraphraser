# AI Paraphrasing Tool

## Overview

This is a full-stack AI-powered paraphrasing tool built with React, Express, and OpenAI integration. The application allows users to transform text using different paraphrasing modes (Standard, Creative, Formal, Casual) while providing real-time text comparison and statistics. The tool emphasizes clean, productivity-focused design inspired by Material Design and Notion aesthetics.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Technology Stack:**
- **Framework:** React with TypeScript
- **Routing:** Wouter (lightweight client-side routing)
- **State Management:** TanStack Query (React Query) for server state management
- **Styling:** Tailwind CSS with custom design system
- **UI Components:** Radix UI primitives with shadcn/ui component library
- **Build Tool:** Vite

**Design System:**
- Custom theme system supporting light/dark modes
- Typography: Inter font family for UI, JetBrains Mono for monospace elements
- Consistent spacing primitives (Tailwind units: 2, 4, 6, 8)
- Color system using CSS variables with HSL values
- Component variants using class-variance-authority (CVA)

**Key Frontend Features:**
- Dual-panel text editor interface (original text vs. paraphrased output)
- Real-time text difference highlighting
- Four paraphrasing modes with visual mode selector
- Character/word count statistics
- Copy-to-clipboard functionality
- Synchronized scrolling between text panels
- Responsive layout (desktop: side-by-side, mobile: stacked)
- AI-powered plagiarism checker with originality scoring and AI content detection

### Backend Architecture

**Technology Stack:**
- **Framework:** Express.js
- **Runtime:** Node.js with ES modules
- **Development:** tsx for TypeScript execution in dev mode
- **Production Build:** esbuild for server bundling

**API Structure:**
- RESTful API endpoint: `POST /api/paraphrase`
  - Request validation using Zod schemas
  - Response includes original text, paraphrased text, mode, and statistics (word/character counts)
- RESTful API endpoint: `POST /api/check-plagiarism`
  - Analyzes text for originality, AI-generated content detection, and flagged passages
  - Returns originality score, AI content probability, risk level, flagged passages with severity, and recommendations

**Development vs Production:**
- Development: Vite dev server with HMR (Hot Module Replacement)
- Production: Static file serving from pre-built dist directory
- Separate entry points: `index-dev.ts` and `index-prod.ts`

**Request Flow:**
1. Client sends text and selected mode to `/api/paraphrase`
2. Server validates request using Zod schema
3. OpenAI integration processes text with mode-specific prompts
4. Response includes paraphrased text and statistics
5. Client displays results with difference highlighting

**Error Handling:**
- Schema validation errors return 400 with details
- OpenAI errors return 500 with error messages
- Client-side error display via toast notifications

### Data Storage Solutions

**Current Implementation:**
- In-memory storage using Map-based data structures
- User model defined with id, username fields
- Storage interface (IStorage) provides abstraction layer

**Database Configuration:**
- Drizzle ORM configured for PostgreSQL via `drizzle.config.ts`
- Schema defined in `shared/schema.ts`
- Migration support via `db:push` npm script
- Neon Database serverless PostgreSQL support configured

**Note:** The application currently uses in-memory storage. Database integration is configured but not actively used for paraphrasing functionality, which is stateless.

### Authentication and Authorization

**Current State:**
- Basic user model defined (User, InsertUser types)
- Storage methods for user creation and retrieval
- No active authentication implementation in paraphrasing flow
- Session management configured via connect-pg-simple package

**Design Decision:** The paraphrasing tool is designed as a stateless utility that doesn't require user authentication for core functionality. Authentication infrastructure is scaffolded for future features.

## External Dependencies

### Third-Party Services

**OpenAI Integration:**
- Uses Replit's AI Integrations service (OpenAI-compatible API)
- Configuration via environment variables:
  - `AI_INTEGRATIONS_OPENAI_BASE_URL`
  - `AI_INTEGRATIONS_OPENAI_API_KEY`
- Four mode-specific system prompts for different paraphrasing styles
- Response processing includes text cleaning and word counting

**Database Service:**
- Neon Database (serverless PostgreSQL)
- Connection via `DATABASE_URL` environment variable
- Drizzle ORM for schema management and migrations

### UI Component Libraries

**Radix UI Primitives:**
- Comprehensive set of unstyled, accessible UI components
- Used for: dialogs, dropdowns, popovers, tooltips, tabs, accordions, and more
- Provides keyboard navigation and ARIA compliance

**shadcn/ui:**
- Component library built on Radix UI
- Customized with project design tokens
- Configuration in `components.json` with "new-york" style
- Path aliases for clean imports (@/components, @/lib, @/hooks)

### Development Tools

**Build and Development:**
- Vite with React plugin and runtime error overlay
- Replit-specific plugins: cartographer, dev-banner (development only)
- PostCSS with Tailwind CSS and Autoprefixer
- TypeScript with strict mode enabled

**Code Quality:**
- TypeScript for type safety
- Zod for runtime validation
- ESLint-compatible configuration

### Frontend Libraries

**State and Data:**
- @tanstack/react-query: Server state management and caching
- wouter: Lightweight routing (< 2KB alternative to React Router)
- react-hook-form with @hookform/resolvers: Form state management

**Utilities:**
- clsx + tailwind-merge: Utility-first CSS class management
- date-fns: Date manipulation
- lucide-react: Icon library
- embla-carousel-react: Carousel functionality

**Design Rationale:**
- Lightweight bundle size prioritized (wouter over React Router)
- Modern React patterns (hooks-first approach)
- Strong TypeScript integration across the stack
- Separation of concerns (shared schemas between client/server)