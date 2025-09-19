# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Essential Commands

### Development
```bash
cd admin-dashboard
npm install
npm start  # Starts development server on http://localhost:3000
```

### Build & Analysis
```bash
npm run build                    # Production build with no source maps
npm run build:analyze           # Build with bundle analyzer
npm test                        # Run tests
npm run type-check              # TypeScript type checking
npm run lint                    # ESLint code analysis
npm run lint:fix                # Auto-fix ESLint issues
```

### Supabase Commands
```bash
npm run supabase:status         # Check Supabase local status
npm run supabase:push           # Push schema changes to remote
npm run supabase:pull           # Pull schema changes from remote
npm run supabase:generate-types # Generate TypeScript types
npm run supabase:functions:deploy # Deploy all edge functions
supabase functions deploy <name> # Deploy specific edge function
```

### Notes
- Primary backend: Supabase (Edge Functions + PostgreSQL)
- Legacy API proxy: http://localhost:8000 (still used for some features)
- Source maps are disabled in both development and production
- Login credentials: admin/changeme

## Architecture Overview

### Core Structure
This is a React 19 + TypeScript church management admin dashboard with Supabase backend integration, extensive lazy loading, and modular architecture.

### Key Architectural Patterns

**Dual API Architecture:**
- **Primary**: Supabase Edge Functions (`supabaseApiService.ts`)
- **Legacy**: REST API via proxy (`api.ts`)
- Migration in progress: Community features moved to Supabase, core features still on legacy API
- Use `supabaseApiService` for new features, `api.ts` for legacy endpoints

**Authentication Flow:**
- Dual authentication system:
  - Supabase Auth for new features (`supabaseAuthService.ts`)
  - JWT tokens in localStorage for legacy API
- Temporary token system for Edge Functions: `temp_token_{user_id}_{timestamp}`
- PrivateRoute wrapper protects authenticated routes

**Component Organization:**
- Main components in `/src/components/`
- Community-specific components in `/src/components/Community/`
- UI primitives in `/src/components/ui/` (Radix UI + Tailwind)
- Lazy loading throughout App.tsx for code splitting
- Extensive use of React.Suspense for component lazy loading

**State Management:**
- No global state manager - uses React hooks and local state
- API services handle data fetching and transformation
- Services pattern: separate service files for each domain

### Critical Services

**`supabaseApiService.ts`:**
- New primary service for Supabase integration
- Handles Edge Function invocations
- Direct database queries for simple operations
- Authentication via Supabase Auth

**`communityService.ts`:**
- **Recently migrated to Supabase** for sharing, requests, and sales features
- Complex data transformation between snake_case (backend) and camelCase (frontend)
- Uses Supabase Edge Functions: `community-sharing`, `community-requests`
- Special handling for `is_free` filtering (무료나눔 vs 물품판매)
- Image uploads via Supabase Storage with direct client upload

**`api.ts`:**
- Legacy base axios configuration with auth interceptors
- Still used for: job postings, music team recruitment, church events
- Contains auth utilities and token management for legacy endpoints

### Supabase Integration

**Edge Functions:**
- Located in `/supabase/functions/`
- Key functions: `community-sharing`, `community-requests`, `members`, `attendances`
- All use CORS headers for browser compatibility
- Authentication via custom headers or Supabase Auth
- Deploy with `supabase functions deploy <name>`

**Database Schema:**
- PostgreSQL with migrations in `/supabase/migrations/`
- Key tables: `community_sharing`, `community_requests`, `members`, `churches`
- Row Level Security (RLS) policies for data access control
- Church ID 9998 represents "no church affiliation"

**Storage:**
- Supabase Storage for file uploads (images, documents)
- Direct client uploads for better performance
- Bucket: `community-images` for community feature images

### Data Transformation Patterns

**Date Handling:**
- Use `formatCreatedAt()` from `src/utils/dateUtils.ts` for null-safe formatting
- Fallback text: "등록일 없음" for missing dates
- Korean locale formatting (`ko-KR`)

**Field Mapping:**
- Backend: snake_case, Frontend: camelCase
- Services layer handles bi-directional transformation
- Special cases: `author_name` vs `user_name`, `contact_info` vs `contactInfo`

**Church ID Special Cases:**
- Church ID 9998 = "no church" → display as null
- Handle in transformation layers, not UI components

**Community Feature Filtering:**
- `is_free` field determines 무료나눔 (true) vs 물품판매 (false)
- Multiple falsy value checks: `false`, `'false'`, `0`, `'0'`
- Status filtering removed for broader item visibility

### UI Components

**Design System:**
- Tailwind CSS with custom component variants
- Radix UI primitives for accessibility
- Lucide React for consistent iconography
- class-variance-authority for component variants

**Form Patterns:**
- `CommunityPostForm.tsx`: Unified form for community features
- File uploads via Supabase Storage with progress tracking
- Real-time validation and user feedback

### Korean Language Support
- Primary language: Korean
- Error messages, UI text, and validation in Korean
- Date formatting uses Korean locale
- Community categories and statuses in Korean

### Migration Status

**Completed Migrations:**
- Community sharing (무료나눔): `community-sharing` Edge Function
- Item sales (물품판매): `community-sharing` Edge Function with `is_free=false`
- Item requests (물품요청): `community-requests` Edge Function
- Member management: `members` Edge Function
- Attendance tracking: `attendances` Edge Function

**Pending Migrations:**
- Job postings, music team recruitment (still use legacy API)
- Church events, prayer requests
- Announcements and bulletins (partially migrated)

### Development Workflow

**Adding New Features:**
1. Use Supabase Edge Functions for new endpoints
2. Create migration files for database changes
3. Update `supabaseApiService.ts` with new methods
4. Use existing UI patterns and components
5. Deploy functions with `supabase functions deploy`

**Database Changes:**
1. Create migration file: `supabase/migrations/YYYYMMDDHHMMSS_description.sql`
2. Test locally with `supabase db reset`
3. Deploy with `npm run supabase:push`

**Debugging Edge Functions:**
- Use console.log extensively in Edge Functions
- View logs in Supabase Dashboard
- Test locally with `supabase functions serve`

### Known Issues and Patterns

**CORS Configuration:**
- Edge Functions need specific CORS headers for browser requests
- Use simple CORS setup: `'Access-Control-Allow-Origin': '*'`
- Handle OPTIONS requests with `return new Response('ok', { headers: corsHeaders })`

**Authentication Patterns:**
- Use temporary tokens for Edge Functions: `temp_token_{user_id}_{timestamp}`
- Validate user existence and active status
- Set proper `church_id` and `author_id` from user context

**Image Upload Best Practices:**
- Direct Supabase Storage uploads for better performance
- Generate unique file paths: `community/{year}/{month}/{uuid}.ext`
- Store public URLs in database, not file objects

**Error Handling:**
- Always return JSON responses from Edge Functions
- Include Korean error messages for user-facing errors
- Use try-catch blocks with proper logging