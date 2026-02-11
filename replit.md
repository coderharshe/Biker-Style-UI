# RideGuard - Replit Configuration

## Overview

RideGuard is a biker community and safety platform built as a mobile-first application using React Native with Expo. It connects bikers through group ride coordination, SOS emergency alerts, gamified exploration tasks, and a leaderboard system. The app features a dark theme with glassmorphism UI, neon orange/electric blue accents, and uses primarily mock data with local state management. The backend is a lightweight Express server with PostgreSQL database support via Drizzle ORM, though most app functionality currently runs client-side with AsyncStorage.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend (Expo/React Native)
- **Framework**: Expo SDK 54 with React Native 0.81, targeting mobile-first web
- **Routing**: expo-router with file-based routing. Tab navigation with 5 tabs (Home, Groups, Tasks, Leaderboard, Profile) plus modal screens (SOS)
- **State Management**: Local component state with React hooks, AsyncStorage for persistence (user session), React Query (`@tanstack/react-query`) for server state
- **UI**: Dark theme only (both `dark` and `light` color schemes map to the same dark values in `constants/colors.ts`). Uses Rajdhani font family, Feather icons, glassmorphism-style cards, and Reanimated for animations
- **Key Libraries**: react-native-reanimated (animations), react-native-gesture-handler, expo-haptics (tactile feedback), expo-linear-gradient, expo-blur

### App Screen Structure
- `/` - Splash screen with auto-redirect (checks AsyncStorage for logged-in user)
- `/login` - Login/signup with email, password, bike type selection (stored in AsyncStorage, no real auth)
- `/(tabs)/` - Main tab navigator: Home (Advanced Dashboard), Groups, Tasks, Leaderboard, Profile
- `/sos` - Emergency SOS modal screen with pulsing animations

### Home Dashboard (Advanced - 7 Sections)
1. **Smart Greeting + Ride Status Banner** - Time-based greeting, user name, ride status badge (Active/Group/Not Riding), today's ride goal progress bar (KM tracker)
2. **Ride Conditions Intelligence** - Weather, temp, wind, humidity, road risk level (Low/Med/High color-coded), suggested ride time window
3. **Live Rider Map** - Dark styled map with animated rider markers (blue user, orange riders, red SOS), floating stat chips, "LIVE" indicator, markers drift with reanimated
4. **SOS Quick Action Panel** - Pulse-animated SOS button, avg response time, available helpers count
5. **Ride Analytics** - Weekly KM + hours card, safety score with mini bar, bike health (tire %, service due, fuel efficiency)
6. **Gamification** - XP progress bar with glow, level title, today's missions with completion state
7. **Community Pulse Feed** - Horizontal scrolling cards with live community events and timestamps
- Uses `dashboardData` from `data/mockData.ts` for all section data
- Animated counters, map marker drift, XP bar glow, and floating chip entrance animations

### Backend (Express)
- **Runtime**: Node.js with Express 5, TypeScript compiled via tsx (dev) or esbuild (prod)
- **API Pattern**: Routes registered in `server/routes.ts`, prefixed with `/api`
- **Storage**: `server/storage.ts` defines an `IStorage` interface with a `MemStorage` in-memory implementation. Currently only has basic user CRUD
- **CORS**: Dynamic CORS setup supporting Replit domains and localhost for Expo web dev
- **Static Serving**: In production, serves built Expo web assets from `dist/` directory

### Database (PostgreSQL + Drizzle)
- **ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema**: Defined in `shared/schema.ts` - currently only a `users` table (id, username, password)
- **Validation**: drizzle-zod generates Zod schemas from Drizzle table definitions
- **Migrations**: Managed via `drizzle-kit push` command, output to `./migrations`
- **Note**: The database is provisioned but minimally used - most data is mock data in `data/mockData.ts`

### Data Layer
- **Mock Data**: `data/mockData.ts` contains all app data - riders, group rides, tasks, badges, chat messages, SOS helpers. This is the primary data source for the frontend
- **Shared Types**: TypeScript interfaces defined in mockData.ts (Rider, GroupRide, Task, Badge, ChatMessage, SOSHelper)
- **Schema sharing**: `shared/schema.ts` is shared between frontend and backend via path alias `@shared/*`

### Build & Deploy
- **Dev**: Two processes - `expo:dev` for Expo web dev server, `server:dev` for Express API
- **Production Build**: `expo:static:build` creates static web bundle, `server:build` bundles Express server with esbuild, `server:prod` serves the built assets
- **Landing Page**: `server/templates/landing-page.html` shown when no static build exists

## External Dependencies

- **PostgreSQL**: Database via `DATABASE_URL` environment variable, used with Drizzle ORM
- **AsyncStorage**: `@react-native-async-storage/async-storage` for client-side session persistence
- **Expo Services**: Font loading (Rajdhani), haptic feedback, image picking, location services, splash screen management
- **Replit Environment**: Uses `REPLIT_DEV_DOMAIN`, `REPLIT_DOMAINS`, `REPLIT_INTERNAL_APP_DOMAIN` for CORS and URL configuration
- **No external auth service**: Authentication is simulated with AsyncStorage
- **No external APIs**: All data is mock/local