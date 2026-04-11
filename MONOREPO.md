# DinLipi Monorepo (Milestone 1)

This milestone scaffolds the multi-app structure while preserving the current Expo app at the repository root.

## Structure

- `apps/web` - Web client starter (Vite + React + TypeScript)
- `apps/admin` - Admin panel starter (Vite + React + TypeScript)
- `services/api` - REST API starter (Express + TypeScript)
- `packages/shared` - Shared cross-app types

## Current Mobile App

The existing Expo mobile app remains in the repository root for stability.
Planned next step is to migrate it into `apps/mobile` in a controlled phase.

## Quick Commands

From repository root:

- `npm run web:dev` - run web app
- `npm run admin:dev` - run admin app
- `npm run api:dev` - run API service
