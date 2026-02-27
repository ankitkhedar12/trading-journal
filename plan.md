# Day Trading Journal - Development Plan

This document outlines the step-by-step plan for building the Day Trading Journal application with a modern, "anti-gravity" Material Design aesthetic, responsive layout, and dark/light mode support.

## Phase 1: Project Setup and Initial Scaffolding

1.  **Repository Setup:**
    *   Initialize a new Git repository (if not already done for both backend and frontend seperately).
    *   Set up the project directory structure.

2.  **Frontend Initialization:**
    *   Initialize a new React application using Vite (e.g., `npm create vite@latest frontend -- --template react-ts`).
    *   Install necessary dependencies:
        *   `react-router-dom` (routing)
        *   `@mui/material`, `@emotion/react`, `@emotion/styled` (MUI UI library)
        *   `@mui/icons-material` (MUI Icons)
        *   `framer-motion` (animations/physics engine)
        *   `lucide-react` (additional modern icons if needed)
        *   `recharts` or `chart.js` with `react-chartjs-2` (for the cumulative PnL chart)
        *   `date-fns` or `dayjs` (for calendar logic)

3.  **Backend Initialization (NestJS):**
    *   Initialize a new NestJS application globally installed CLI (e.g., `nest new backend`).
    *   Install backend dependencies:
        *   `@nestjs/config` (environment variables)
        *   `@prisma/client`, `prisma` (ORM)
        *   `@nestjs/jwt` (for simple Auth)

4.  **Database Setup (Supabase & Prisma):**
    *   Create a new Supabase project to get database credentials.
    *   Here are creds (fuxsiH-hirrot-3kafxi, https://yhhfksanxqsthicqxefs.supabase.co, sb_publishable_kIM4SZEdNYiZ_YtjzSniqA_UoTCOhLh)
    *   Initialize Prisma in the NestJS application (`npx prisma init`).
    *   Configure Prisma schema to connect to the Supabase database.
    *   Define the initial database schema (e.g., `Trade` model with fields: symbol, volume, entryPrice, closePrice, pnl, etc., mirroring the imported CSV format).

## Phase 2: Core Design System & Theme Configuration (React)

1.  **MUI Theme Setup:**
    *   Create a custom MUI theme extending the default Material Design system.
    *   Configure both **Light** and **Dark** modes within the theme. Ensure seamless switching.
    *   Define the color palette:
        *   Primary (Google-blue accents).
        *   Success (Green for profit).
        *   Error (Red for loss).
        *   Backgrounds (clean white/dark gray).
    *   Define typography using a modern font (Use fonts given in Fonts folder).

2.  **Global Styles:**
    *   Implement global CSS for the subtle gray physics grid background pattern.
    *   Ensure the background adapts gracefully between light and dark modes.

3.  **Authentication & Layout Component Component:**
    *   Create a simple hardcoded login flow (No signup, `ankitkhedar12@gmail.com` / `Test@123`).
    *   Create a main layout wrapping the application.
    *   Add standard Navigation: Dashboard, Journal, Reports, Settings, Import Data.
    *   Implement the floating, semi-transparent status bar at the bottom with bouncing tech stack icons (using Framer Motion).
    *   Implement a persistent Theme Toggle button (Light/Dark mode) and navigation bar with good logo contrast.

## Phase 3: Frontend Component Development

1.  **Dashboard View (The Core Hub):**
    *   **Cumulative PnL Chart Component:** Ensure chart points drift into place.
    *   **Monthly Calendar Component:** Interactive days that shift contextually.
2.  **Journal View (Daily Notes):**
    *   Create a view mapping trading days to reflections/lessons learned.
    *   Floating inputs for journaling thoughts.
3.  **Import Data View (Interactive Physics):**
    *   **Dropzone Component:** Visual tumbling effects on CSV load.
4.  **Processed Trades List Component:** Data table for parsed trades.

## Phase 4: API Development and Integration

1.  **API Endpoints (NestJS):**
    *   Create endpoints to handle trade data:
        *   `GET /trades` (fetch all or filtered trades).
        *   `POST /trades/import` (receive parsed CSV data and save to database).
        *   `GET /dashboard/summary` (calculate data for the chart and calendar view).

2.  **Frontend Integration:**
    *   Update React components to fetch real data from the NestJS backend instead of mock data.
    *   Handle data fetching states (loading, error) with appropriate UI cues.
    *   Implement the CSV parsing logic on the frontend (e.g., using `PapaParse` library) before sending to the backend, or handle file upload directly.

## Phase 5: Polish, Responsive Design, and Final Fixes

1.  **Responsiveness Check:**
    *   Ensure all components stack and resize correctly on mobile, tablet, and desktop screens.
    *   Adjust Framer Motion animations to be performant on less capable devices if necessary.
2.  **Animation Polish:**
    *   Fine-tune physics parameters (spring stiffness, damping) in Framer Motion to get the "playful yet clean" aesthetic perfectly tuned.
3.  **Review and Testing:**
    *   End-to-end testing of the import flow.
    *   Verify data accuracy on the dashboard views.

## Next Steps

1.  Review and approve this plan.
2.  Once approved, we will begin with **Phase 1: Project Setup and Initial Scaffolding**. Let me know if you are ready to proceed with scaffolding the React and NestJS apps!
