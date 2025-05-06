# Architecture Overview

## Overview

This repository contains a full-stack web application for a Mortgage Payoff Calculator. The application allows users to calculate how early mortgage payments can save them money over time. Users can create and manage mortgage details, simulate different payment scenarios, and visualize amortization schedules.

The application follows a modern client-server architecture with a React frontend and Express.js backend. It leverages PostgreSQL for data storage via Drizzle ORM, and implements authentication through Replit Auth.

## System Architecture

The system follows a three-tier architecture:

1. **Client Layer**: A React application with TypeScript, built using Vite and styled with Tailwind CSS and shadcn/ui components.
2. **Server Layer**: An Express.js server running on Node.js that serves the API endpoints and handles static file serving in production.
3. **Data Layer**: PostgreSQL database accessed through Drizzle ORM for data persistence.

### Key Design Decisions

- **Monorepo Structure**: The project uses a monorepo approach where both client and server code live in the same repository, with shared types and schemas in a common directory.
- **SSR-like Setup**: While not a full server-side rendering solution, the Express server serves the client application and API routes, providing a similar deployment model.
- **API-First Design**: The backend exposes RESTful APIs consumed by the React frontend, keeping a clear separation of concerns.
- **TypeScript Throughout**: TypeScript is used across the entire stack to ensure type safety and provide better developer experience.
- **Shared Schema Definitions**: Database schemas are defined using Drizzle ORM and shared between frontend and backend through the shared directory.

## Key Components

### Frontend

1. **React Application**: Built with React and TypeScript, utilizing the following libraries:
   - **React Query**: For data fetching, caching, and state management
   - **shadcn/ui + Radix UI**: For accessible UI components
   - **Tailwind CSS**: For styling
   - **React Hook Form + Zod**: For form validation
   - **Wouter**: For routing

2. **Component Structure**:
   - UI components: Reusable UI elements in `client/src/components/ui/`
   - Feature components: Domain-specific components in `client/src/components/mortgage/`
   - Pages: Page components in `client/src/pages/`
   - Hooks: Custom React hooks in `client/src/hooks/`
   - Utils: Utility functions in `client/src/utils/`

### Backend

1. **Express Server**: Handles API requests and serves the frontend in production:
   - API Routes: Defined in `server/routes.ts`
   - Authentication: Implemented in `server/replitAuth.ts` and `server/auth.ts`
   - Database Access: Abstracted through `server/storage.ts`

2. **API Structure**:
   - `/api/auth/*`: Authentication endpoints
   - `/api/mortgages`: Mortgage management endpoints
   - `/api/mortgages/:id/scenarios`: Scenario management endpoints for specific mortgages

### Data Layer

1. **Database Schema**: Defined in `shared/schema.ts` using Drizzle ORM:
   - `users`: Stores user information
   - `sessions`: Stores authentication session data
   - `mortgages`: Stores mortgage information
   - `scenarios`: Stores payment scenarios for mortgages

2. **Data Access**:
   - Drizzle ORM is used to interact with the PostgreSQL database
   - Repository pattern implemented in `server/storage.ts` to abstract database operations

## Data Flow

1. **Authentication Flow**:
   - User authentication is handled through Replit Auth
   - Sessions are stored in the PostgreSQL database using the `sessions` table
   - Express middleware validates authentication state for protected routes

2. **Mortgage Management Flow**:
   - Authenticated users can create, read, update, and delete mortgages
   - Each mortgage is associated with a user through the `userId` field
   - React Query is used to manage client-side state and synchronize with the server

3. **Scenario Simulation Flow**:
   - Users can create different payment scenarios for a mortgage
   - The application calculates amortization schedules based on the mortgage details and additional payment amounts
   - Visualization components show the impact of different payment strategies

## External Dependencies

### Frontend Dependencies

- **@radix-ui/***: UI primitives for building accessible components
- **@tanstack/react-query**: Data fetching and state management
- **@hookform/resolvers**: Form validation integration
- **chart.js**: Data visualization
- **wouter**: Client-side routing
- **zod**: Schema validation

### Backend Dependencies

- **express**: Web server framework
- **@neondatabase/serverless**: PostgreSQL client for serverless environments
- **drizzle-orm**: SQL ORM for TypeScript
- **passport**: Authentication middleware
- **connect-pg-simple**: PostgreSQL session store for Express
- **openid-client**: OpenID Connect client for Replit Auth

## Deployment Strategy

The application is configured for deployment on Replit with the following setup:

1. **Development Mode**:
   - Uses `npm run dev` to start a development server
   - Vite provides hot module replacement for frontend code

2. **Production Build**:
   - Frontend: Vite builds static assets to `dist/public/`
   - Backend: esbuild bundles server code to `dist/index.js`

3. **Production Deployment**:
   - The Express server serves static assets from the build directory
   - Environment variables are used to configure database connections and other settings
   - Uses PostgreSQL database provisioned through Replit

4. **Configuration**:
   - `.replit` defines the Replit environment setup
   - `vite.config.ts` configures the frontend build
   - `drizzle.config.ts` configures the database schema migration

### Database Migration Strategy

Drizzle ORM is used for database schema management with the following approach:

1. Schemas are defined in `shared/schema.ts`
2. `npm run db:push` command is used to push schema changes to the database
3. Migrations are stored in the `migrations` directory

## Security Considerations

1. **Authentication**: Uses Replit Auth for secure user authentication
2. **Data Validation**: Zod schemas validate user input on both client and server
3. **Session Management**: Secure cookie-based session management with PostgreSQL backing store
4. **CSRF Protection**: Implemented through session token validation
5. **XSS Protection**: React's built-in XSS protection and proper content sanitization

## Future Extensibility

The architecture enables easy extension in the following areas:

1. **Additional Financial Features**: The component-based approach allows for adding new financial calculation features
2. **User Customization**: The data model supports adding user preferences and settings
3. **Integration with Financial Services**: The API-first design enables integration with external financial services
4. **Performance Optimizations**: Server-side rendering could be added for improved initial load performance