<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

# EnglishFlow — AI Development Guidelines

## Project Overview

EnglishFlow is an English-learning web application focused on vocabulary, spaced repetition using the Leitner system, and learning progress.

## Tech Stack

- Next.js 16 App Router
- TypeScript
- Tailwind CSS
- Supabase Auth and PostgreSQL
- Zod for validation
- Vitest for unit tests
- Vercel for deployment

## Architecture

- Use feature-based architecture.
- Keep routing and page composition in `src/app`.
- Keep business logic inside `src/features`.
- Place reusable UI components in `src/components/ui`.
- Place shared infrastructure in `src/lib`.
- Prefer Server Components by default.
- Use Client Components only when interactivity requires them.
- Follow SOLID principles where they improve maintainability.
- Avoid premature abstractions and unnecessary dependencies.

## Design System

- Visual style: Neo-Brutalism / Retro Web.
- Use bold typography, thick black borders, hard shadows, vibrant colors, and playful interactions.
- Reuse design tokens from `src/app/globals.css`.
- Reuse shared UI components instead of duplicating Tailwind classes.
- Maintain accessible contrast, keyboard navigation, and visible focus states.

## Responsive Design

- Always follow a mobile-first approach.
- Support widths from 320px upward.
- Use Tailwind responsive utilities consistently.
- Prefer fluid layouts and typography.
- Avoid horizontal overflow.
- Verify layouts at 320px, 375px, 430px, 768px, and 1440px.
- Ensure touch targets are comfortable on mobile devices.

## Authentication and Security

- Use Supabase SSR clients.
- Validate untrusted inputs on the server with Zod.
- Enforce authorization server-side and with Supabase RLS.
- Never expose service-role keys, passwords, tokens, or cookies.
- Avoid revealing whether an email is registered.
- Handle rate limits and authentication errors safely.
- Do not commit `.env.local` or other secrets.

## Testing and Quality

- Add Vitest tests for validation and business logic.
- Run TypeScript, ESLint, and relevant tests before committing.
- Add Playwright end-to-end tests as the project grows.
- Prefer small, testable changes.

## Git Workflow

- Use Conventional Commits.
- Keep commits focused and descriptive.
- Review `git status` and staged changes before committing.
- Never commit secrets.
- Deploy to Vercel through the GitHub workflow.

## AI Collaboration Rules

- Guide development one small step at a time.
- Explain why code is needed, not just what to paste.
- Let the developer write code and execute commands.
- Do not rewrite unrelated code.
- Ask before introducing significant dependencies or architectural changes.
- Recommend appropriate tests and Git commits.
- Prioritize security, readability, and maintainability.

<!-- END:nextjs-agent-rules -->
