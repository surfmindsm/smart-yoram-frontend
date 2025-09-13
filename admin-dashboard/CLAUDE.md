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
```

### Notes
- Backend server must be running on http://localhost:8000
- Uses proxy configuration in package.json for API calls
- Source maps are disabled in both development and production

## Architecture Overview

### Core Structure
This is a React 19 + TypeScript church management admin dashboard with extensive lazy loading and modular architecture.

### Key Architectural Patterns

**Authentication Flow:**
- JWT-based authentication via localStorage ('access_token')
- PrivateRoute wrapper protects authenticated routes
- API interceptor automatically adds auth headers
- Login credentials: admin/changeme

**API Configuration:**
- Primary API: `https://api.surfmind-team.com/api/v1`
- Falls back to proxy mode for development
- `getApiUrl()` utility handles proxy vs direct API calls
- All API services extend the base axios instance in `src/services/api.ts`

**Component Organization:**
- Main components in `/src/components/`
- Community-specific components in `/src/components/Community/`
- UI primitives in `/src/components/ui/` (Radix UI + Tailwind)
- Lazy loading throughout App.tsx for code splitting

**State Management:**
- No global state manager - uses React hooks and local state
- API services handle data fetching and transformation
- Services pattern: separate service files for each domain (communityService, api, etc.)

### Critical Services

**`communityService.ts`:**
- Handles all community-related API calls (job postings, music team recruitment, etc.)
- Complex data transformation between snake_case (backend) and camelCase (frontend)
- Special handling for null/missing date fields - uses "등록일 없음" as fallback

**`api.ts`:**
- Base axios configuration with auth interceptors
- Handles API URL resolution (proxy vs direct)
- Contains auth utilities and token management

### Data Transformation Patterns

**Date Handling:**
- Backend often returns null for created_at fields
- Use `formatCreatedAt()` from `src/utils/dateUtils.ts` which gracefully handles null values
- Always provide fallback text "등록일 없음" for missing dates

**Field Mapping:**
- Backend uses snake_case, frontend uses camelCase
- Services layer handles transformation
- Author names: prioritize `author_name` over `user_name` for display

**Church ID Special Cases:**
- Church ID 9998 represents "no church" and should display as null
- Handle this in data transformation layers

### UI Components

**Design System:**
- Tailwind CSS with custom components
- Radix UI primitives for accessibility
- Lucide React for icons
- Custom variants using class-variance-authority

**Form Patterns:**
- Extensive use of controlled components
- Form validation typically inline with submit handlers
- File uploads handled with multipart/form-data

### Korean Language Support
- Primary language is Korean
- Error messages and user-facing text in Korean
- Date formatting uses Korean locale (`ko-KR`)

### Development Notes

**Deployment Environment:**
- Production API: https://api.surfmind-team.com/api/v1
- Development proxy: http://localhost:8000
- Frontend served on http://localhost:3000

**Known Issues:**
- Backend sometimes returns null for created_at fields - handle gracefully
- Some APIs return data in different response formats - services layer normalizes this

**Testing:**
- React Testing Library setup included
- No specific test patterns established yet