# Repository Guidelines

## Project Structure & Module Organization
- Primary app lives in `admin-dashboard/`; React + TypeScript source under `admin-dashboard/src` with feature areas split into `pages/`, reusable UI in `components/`, shared logic in `hooks/`, data helpers in `lib/` and `utils/`, and service calls in `services/` or `api/`.
- End-to-end configuration for Tailwind, CRACO, and webpack overrides sits in `admin-dashboard/tailwind.config.js`, `craco.config.js`, and `webpack.config.js`.
- Supabase schemas, migrations, and helper scripts are kept in `/supabase` and `admin-dashboard/supabase/`; deployment and infra guides live in `/infrastructure` and `/docs`.
- Static assets and entry HTML are in `admin-dashboard/public`; generated build output goes to `admin-dashboard/build` (do not edit manually).

## Build, Test, and Development Commands
- Install dependencies: `cd admin-dashboard && npm install`.
- Run dev server at `http://localhost:3000`: `npm start` (uses CRACO; backend expected at `http://localhost:8000` per proxy).
- Production build: `npm run build` (sourcemaps disabled; respects CRACO overrides).
- Type safety: `npm run type-check`.
- Linting: `npm run lint` (strict, fails on warnings); auto-fix with `npm run lint:fix`.
- Tests: `npm test` (Jest + React Testing Library; watch mode).
- Supabase maintenance: `npm run supabase:status`, `:push`, `:pull`, `:generate-types` (writes to `src/types/database.types.ts`).

## Coding Style & Naming Conventions
- TypeScript-first; prefer explicit types on public functions and React props. Keep components small and composable.
- React components in PascalCase (`MemberTable.tsx`); hooks prefixed with `use*`; utility modules in `camelCase`.
- Follow ESLint rules from `eslintConfig`; align with Tailwind utility-first styling and keep class lists ordered by layout → color → state when possible.
- Use `src/constants/` for shared literals and `src/types/` for DTOs; avoid duplicating API shapes inline.

## Testing Guidelines
- Place component and hook tests alongside sources using `*.test.tsx` or `*.test.ts`. Favor React Testing Library for behavior over implementation details.
- Stub network calls at the boundary (services/api) and cover error paths for forms, data mutations, and permission-sensitive flows.
- Before pushing, ensure `npm test` and `npm run lint` both pass; add regression tests when fixing bugs.

## Commit & Pull Request Guidelines
- Commit messages are short, imperative summaries (often in Korean); include the scope or feature (e.g., `메시지 전송`, `Fix: 교회 정보 수정 문제 해결`).
- Each PR should describe the change, link related issues/tasks, list key commands run, and include before/after screenshots or payload examples for UI or API changes.
- Keep diffs small and focused; note any schema or Supabase changes and attach the corresponding SQL or generated type updates.

## Security & Configuration Tips
- Do not commit secrets; prefer environment variables managed outside VCS. Verify `setupProxy.js` targets the correct backend for your environment.
- When touching Supabase, sync schema files and regenerate types to keep frontend models aligned with the database.
