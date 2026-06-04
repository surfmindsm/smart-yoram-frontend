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
- Source maps are disabled in both development and production (for performance)
- Login credentials: admin/changeme
- Build configuration uses CRACO for webpack customization (see `craco.config.js`)
- TypeScript path alias: `@/*` maps to `./src/*`

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

**Source Layout (`src/`):**
- `components/` — feature components (Community, Landing, chat subfolders included)
- `pages/` — route-level pages
- `services/` — API services (one file per domain: `communityService.ts`, `financialApi.ts`, etc.)
- `hooks/`, `contexts/`, `lib/`, `utils/`, `constants/`, `types/`, `data/`, `api/`
- `setupProxy.js` — CRA dev proxy to legacy backend at `http://localhost:8000` (also set via `"proxy"` field in `package.json`)
- TS path alias `@/*` → `./src/*`

**UI Component Versions:**
- `/src/components/ui/`: **Active** — current shadcn/ui components (USE THIS)
- `/src/components/ui_old/`, `/src/components/ui2/`: deprecated, do not add to

**Component Organization:**
- Lazy loading throughout `App.tsx` for code splitting (React.lazy + Suspense)

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

**Member Management:**
- `AddMemberModal.tsx`: Collapsible sections modal for adding new members
  - All sections are collapsible using `<details>` elements with shadcn styling
  - Basic info and church info sections default to open (`open` attribute)
  - Uses border, rounded corners, and ChevronDown icons for visual feedback
  - Section spacing: `space-y-4` for compact layout
  - Saves to `members` table and related tables (`member_contacts`, `sacraments`, `transfers`, `member_vehicles`)
  - Uses Supabase client directly for relation tables
- `AddMemberWizard.tsx`: Alternative 5-step wizard approach (not currently used)
  - Collects basic info, ministry info, contacts, sacraments/transfers, vehicles
- `MemberManagement.tsx`: View/edit member details
  - Detail modal loads and displays relation table data
  - Uses `members` Edge Function for CRUD operations
  - Supports member fields: `name_eng`, `marital_status`, `spouse_name`, `married_on`, etc.

### Supabase Integration

**Edge Functions:**
- Located in `admin-dashboard/supabase/functions/` (~55 functions; run `ls supabase/functions/` for the current set)
- Organized by feature:

**Financial Management:**
- `accounting`: General ledger, transactions, budget tracking
- `offerings`: Church offerings and donations management
- `budgets`: Budget planning and allocation
- `receipts`: Receipt generation and management

**Member & Attendance:**
- `members`: Member CRUD operations and profile management
- `attendances`: Worship service attendance tracking
- `member_contacts`, `sacraments`, `transfers`: Member relation data

**Community Features:**
- `community-sharing`: Marketplace for sharing/selling items
- `community-requests`: Item request management
- `community-applications`: User applications to join communities
- `church-applications`: Church registration applications

**Communication & Content:**
- `announcements`: Church announcements management
- `bulletins`: Weekly bulletin creation and distribution
- `sermons`: Sermon archive and management
- `daily-verses`: Daily Bible verse distribution
- `system-announcements`: Platform-wide announcements
- `send-sms`: SMS notification service
- `send-announcement-notification`, `send-chat-notification`: Push notifications
- `send-pastoral-care-notification`, `send-custom-notification`: Targeted notifications
- `send-temp-password`, `send-contact-email`: Email services

**AI & Chatbot:**
- `ai-chat`: OpenAI GPT integration for church chatbot
- `gpt-licenses`: GPT API usage license management

**User Management:**
- `users`: User profile and settings
- `email-verification`: Email verification flow
- `invite-user`: User invitation system
- `reset-password`: Password reset functionality
- `permission-groups`: Role-based access control

**Pastoral Care:**
- `prayer-requests`: Prayer request submission and management
- `pastoral-care`: Pastoral visit and care tracking
- `important-dates`: Important church dates and anniversaries

**Church Services:**
- `worship-services`: Service schedule and management
- `music-teams`: Worship team management
- `music-seekers`: Musicians seeking to join teams
- `job-posts`: Church job postings
- `my-posts`: User's community posts

**Utilities & Admin:**
- `statistics`: Dashboard analytics
- `excel`: Excel data export functionality
- `excel-test`: Excel generation testing
- `dashboard-todos`: Admin task management
- `wishlists`: Community wishlists
- `church-news`: Church news feed

**Data Migration Functions:**
- `migrate-denominations`, `migrate-offerings`, `reorganize-offerings`
- `check-*`: Schema validation utilities
- `cleanup-duplicates`: Data cleanup
- `add-denomination-column`: Schema updates

**Deployment Notes:**
- Deploy single function: `supabase functions deploy <name>`
- Deploy all: `npm run supabase:functions:deploy`
- View logs in Supabase Dashboard
- Test locally: `supabase functions serve <name>`

**Database Schema:**
- PostgreSQL with migrations in `/supabase/migrations/`
- Row Level Security (RLS) policies for data access control
- Church ID 9998 represents "no church affiliation"

**Key Tables by Category:**

*Member Management:*
- `members`: Core member information (76 columns including custom fields)
- `member_contacts`: Additional contact methods (phone, email variants)
- `member_vehicles`: Vehicle registration data
- `sacraments`: Baptism, confirmation, communion records
- `transfers`: Church transfer in/out history

*Financial:*
- `accounting_entries`: General ledger transactions
- `offerings`: Church offerings and donations
- `budgets`: Budget planning and categories
- `receipts`: Financial receipt records

*Community:*
- `community_sharing`: Item sharing/sales marketplace
- `community_requests`: Item request posts
- `community_applications`: User join requests
- `wishlists`: User wishlists

*Content & Communication:*
- `announcements`: Church announcements with categories
- `bulletins`: Weekly bulletins
- `sermons`: Sermon archive
- `daily_verses`: Daily Bible verse distribution
- `prayer_requests`: Prayer request submissions

*Church Operations:*
- `churches`: Church profiles and settings
- `users`: User accounts and permissions
- `worship_services`: Service schedules
- `attendances`: Attendance records
- `pastoral_care`: Pastoral visit tracking

*AI & Chat:*
- `agents`: AI chatbot configurations
- `conversations`: Chat conversation history
- `gpt_licenses`: API usage tracking

**Storage:**
- Supabase Storage for file uploads (images, documents)
- Direct client uploads for better performance
- Bucket: `community-images` for community feature images

### Data Transformation Patterns

**Date Handling:**
- Use `formatCreatedAt()` from `src/utils/dateUtils.ts` for null-safe formatting
- Fallback text: "등록일 없음" for missing dates
- Korean locale formatting (`ko-KR`)
- **DatePicker component**: Uses local timezone for date selection to avoid timezone bugs
  - Located in `src/components/ui/date-picker.tsx`
  - Converts selected dates using `getFullYear()`, `getMonth()`, `getDate()` to avoid UTC conversion issues
  - Format: `YYYY-MM-DD` using local timezone

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
- Lucide React for consistent iconography (ChevronDown, ChevronRight, etc.)
- class-variance-authority for component variants
- Collapsible sections using native `<details>` and `<summary>` elements
- Styling pattern: `border rounded-lg group` with `list-none` on summary
- Animation: `group-open:rotate-180 transition-transform` for chevron icons

**Form Patterns:**
- `CommunityPostForm.tsx`: Unified form for community features
- File uploads via Supabase Storage with progress tracking
- Real-time validation and user feedback
- Collapsible sections for better UX in long forms (see AddMemberModal)

### Landing Page & App Download System

**Landing Page Structure:**
- Public-facing landing page at `/landing` route
- Modular component architecture in `/src/components/Landing/`
- Sections: Header, Hero, Features, Community, Process, FAQ, AppDownload, Footer
- Scroll animations using Intersection Observer API (`useIntersectionObserver` hook)
- Responsive design with mobile-first approach

**App Download & Dynamic Links:**
- `/download` route provides universal app download redirect
- Device detection via `appDownload.ts` utility (iOS/Android/Desktop)
- Automatic redirection: iOS → App Store, Android → Google Play
- QR codes use production URL from `REACT_APP_PRODUCTION_URL` env variable
- App Store links use short format: `https://apps.apple.com/app/id{APP_ID}`
- Desktop users see both app store options with manual selection
- 3-second countdown before automatic redirect on mobile devices

**Environment Variables:**
- `REACT_APP_PRODUCTION_URL`: Production domain for QR codes (e.g., `https://churchround.com`)
- Required for QR codes to work properly (not localhost)
- Must restart dev server after changing env variables

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
- Job postings (partially migrated - still has legacy dependencies)
- Music team recruitment (partially migrated)
- Church events (legacy API)

**Recently Completed:**
- Prayer requests: Migrated to Supabase
- Announcements: Fully migrated with category support
- Bulletins: Migrated with file upload support

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

### Common Patterns and Best Practices

**Authentication in Edge Functions:**
- Use temporary tokens: `temp_token_{user_id}_{timestamp}`
- Validate user existence and active status
- Set proper `church_id` and `author_id` from user context
- Check permissions before data access

**File Upload Pattern:**
- Direct Supabase Storage uploads for better performance
- Generate unique file paths: `community/{year}/{month}/{uuid}.ext`
- Store public URLs in database, not file objects
- Support multiple file types (images, documents, Excel files)

**Error Handling:**
- Always return JSON responses from Edge Functions
- Include Korean error messages for user-facing errors
- Use try-catch blocks with proper logging
- Graceful degradation when optional features fail

**Data Transformation:**
- Services layer handles snake_case ↔ camelCase conversion
- Use utility functions for consistent date formatting
- Validate and sanitize user input before database operations

**Relational Data Patterns:**
- One-to-many relationships handled through separate tables
- Use foreign keys with cascade delete where appropriate
- Fetch related data separately when needed (not always joined)
- Example: Members have separate tables for contacts, vehicles, sacraments, transfers

### Build Configuration & Polyfills

**CRACO Configuration (`craco.config.js`):**
- Custom webpack configuration for Node.js polyfills
- Required for Excel/Word generation in browser (xlsx, docx packages)
- **Polyfilled Modules**: http, https, stream, buffer, crypto, url, path, querystring, zlib
- **Global Providers**: `process`, `Buffer`
- **Disabled Modules**: fs, net, tls, child_process (not available in browser)

**Source Map Configuration:**
- Disabled in both dev and production (`GENERATE_SOURCEMAP=false`)
- Improves build performance and reduces bundle size
- CI environment variable set to `false` to ignore warnings

**Build Performance:**
- CRACO used instead of ejecting create-react-app
- Code splitting with React.lazy and Suspense
- Bundle analysis: `npm run build:analyze`
- Typical build time: 2-3 minutes for production

### Testing

**Test Setup:**
- Jest with React Testing Library
- Test configuration in `setupTests.ts`
- Run tests: `npm test`
- Type checking: `npm run type-check` (separate from tests)

### Key npm Scripts
- `start`: Development server with CRACO
- `build`: Production build (CI=false, no source maps)
- `build:analyze`: Bundle analysis with webpack-bundle-analyzer
- `test`: Run Jest tests
- `type-check`: TypeScript type checking without emitting files
- `lint`: ESLint with max 0 warnings
- `lint:fix`: Auto-fix linting issues

### Deployment

**Vercel Deployment:**
- Automatic deployment via Vercel GitHub integration
- Root directory: `admin-dashboard`
- Environment variables configured in Vercel dashboard
- See `DEPLOYMENT_SETUP.md` for detailed setup instructions
- GitHub Actions handle build verification, Vercel handles deployment

**Environment Variables (for Vercel):**
- `REACT_APP_SUPABASE_URL`: Supabase project URL
- `REACT_APP_SUPABASE_ANON_KEY`: Supabase anonymous key
- `REACT_APP_PRODUCTION_URL`: Production domain for QR codes

### AI Integration

**AI Chatbot System:**
- **Components**: `AIChat.tsx`, `AIAgentManagement.tsx`, `chat/` directory
- **Backend**: `ai-chat` Edge Function with OpenAI GPT-4 integration
- **Features**:
  - Context-aware responses using church database
  - Custom agent personalities and instructions
  - Conversation history persistence
  - Multi-agent support (different agents for different purposes)
  - Church data sources integration (announcements, attendance, members, services)
- **Implementation Details**: See `AI_대화_데이터베이스_연동_백엔드_요청사항.md`
- **License Management**: GPT usage tracked and limited per church
- **Chat UI**: Markdown support, code highlighting, responsive design

### Common Components

**Layout & Navigation:**
- `Layout.tsx`: Main application layout with sidebar navigation
- `PrivateRoute.tsx`: Authentication wrapper for protected routes
- Sidebar includes all major feature sections (dashboard, members, community, etc.)
- Responsive design with mobile menu support

**Forms & Modals:**
- Extensive use of shadcn/ui components (Dialog, Select, Input, etc.)
- Form validation with react-hook-form + zod
- Modal patterns for create/edit operations
- Collapsible sections for complex forms

**Data Display:**
- Tables with sorting, filtering, pagination
- Charts with recharts library
- Date pickers with Korean locale
- File upload components with progress tracking

### Financial Management System

**Accounting Module:**
- `AccountingManagement.tsx`: General ledger and transaction tracking
- `accounting` Edge Function: CRUD operations for financial entries
- Features: income/expense tracking, budget comparison, financial reports
- Multi-category support for detailed financial analysis

**Offerings Management:**
- Tracks church offerings and donations by service
- Categorization by offering type (regular, special, missions, etc.)
- Integration with member records for donor tracking
- Monthly and yearly offering reports

**Budget Planning:**
- Budget creation and allocation by category
- Budget vs. actual comparison
- Multi-year budget planning
- Department/ministry budget allocation

**Receipt Generation:**
- Automated receipt creation for donations
- PDF receipt generation and storage
- Tax receipt support for annual giving statements
- Receipt tracking and reprint functionality

### Excel Data Export

**Excel Export Functionality:**
- `excel` Edge Function: Server-side Excel generation
- Export capabilities for all major data types:
  - Member directories
  - Attendance reports
  - Financial statements
  - Offering summaries
- Uses `xlsx` library for Excel file generation
- Supports custom formatting and multi-sheet workbooks
- Direct download or storage in Supabase Storage

### GPT & AI License Management

**License System:**
- `GptLicenseManagement.tsx`: Admin interface for GPT usage tracking
- `gpt-licenses` Edge Function: License CRUD and quota management
- Per-church license allocation
- Usage tracking and quota enforcement
- Automatic renewal and expiration handling
- Integration with AI chatbot for usage validation

## Important Reference Documents

Located in the repository root:

**`AI_대화_데이터베이스_연동_백엔드_요청사항.md`:**
- Detailed specifications for AI chatbot database integration
- Church data context loading for AI responses
- API endpoint designs and data structures
- Caching strategies and performance optimization
- Security and permission management guidelines

**`BACKEND_LOGIN_HISTORY_API_REQUIREMENTS.md`:**
- Login history tracking API specifications
- Security audit trail implementation
- Database schema for login records
- IP-based location tracking
- Anomaly detection and alerting

**`DEPLOYMENT_SETUP.md`:**
- Vercel deployment configuration
- GitHub Actions CI/CD pipeline
- Environment variable setup
- Build and deployment workflow

**`AGENTS.md`:**
- Repository guidelines and coding conventions
- Build and test command reference
- Commit message standards
- Pull request guidelines