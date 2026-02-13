# Project: AIConfigBridge

## Tech Stack
- TypeScript
- Node.js (monorepo with workspaces)
- Vite (web frontend)

## Key Commands
- `npm install` - Install all dependencies
- `npm run dev` - Start development (runs all workspaces)
- `npm run build` - Build all packages
- `npm run test` - Run tests

## Architecture
- `/core` - Core engine (parsers, transformers, adapters)
- `/web` - Web UI (Vue 3)
- `/cli` - CLI tool

## Code Style
- Use TypeScript strict mode
- No `any` types
- Use ES modules
- Follow existing code patterns in each module

## Workflow Rules
- Complete one small task at a time
- Commit after each task using `git add . && git commit -m "..."`
- Always run typecheck and lint before committing
