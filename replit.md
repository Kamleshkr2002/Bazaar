# Campus Bazaar - Student Marketplace Platform

## Overview

Campus Bazaar is a full-stack marketplace application designed for college students to buy and sell items within their campus community. The platform enables students to list textbooks, electronics, furniture, clothing, and other items, fostering a sustainable campus economy. Built with modern web technologies, it features real-time messaging, user authentication via Replit Auth, and a responsive design optimized for both desktop and mobile experiences.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript for type safety and modern component patterns
- **Routing**: Wouter for lightweight client-side routing
- **UI Components**: Radix UI primitives with shadcn/ui design system for consistent, accessible components
- **Styling**: Tailwind CSS with CSS variables for theming support (light/dark modes)
- **State Management**: TanStack Query (React Query) for server state management and caching
- **Form Handling**: React Hook Form with Zod validation for type-safe form validation
- **Build Tool**: Vite for fast development and optimized production builds

### Backend Architecture
- **Runtime**: Node.js with Express.js framework
- **Language**: TypeScript with ES modules for modern JavaScript features
- **API Design**: RESTful API with Socket.IO for real-time messaging capabilities
- **File Structure**: Monorepo structure with shared types and schemas between client and server
- **Development**: Hot module replacement in development with production-ready build process

### Database Layer
- **Database**: MongoDB for flexible document storage with ACID compliance
- **ODM**: Mongoose for schema-based data modeling and validation
- **Connection**: MongoDB Atlas cloud hosting for scalable deployment  
- **Schema**: Strongly typed schemas with automatic TypeScript inference
- **Session Storage**: In-memory sessions for development (can be switched to database-backed)

### Authentication & Authorization
- **Provider**: Replit Auth with OpenID Connect integration
- **Session Management**: Express sessions with PostgreSQL storage for persistence
- **Security**: HTTP-only cookies with secure flags for production environments
- **User Management**: Automatic user creation and profile management

### Real-time Features
- **Messaging**: Socket.IO for real-time chat between buyers and sellers
- **Notifications**: Real-time updates for new messages and item interactions
- **Connection Management**: User presence tracking and room-based messaging

## External Dependencies

### Core Infrastructure
- **Hosting**: Replit platform with integrated development environment
- **Database**: MongoDB Atlas cloud database for document storage and persistence
- **Authentication**: Replit Auth service for user authentication and authorization

### Key Libraries
- **UI Framework**: React ecosystem with Radix UI for accessible components
- **Database**: Mongoose ODM with MongoDB driver for database operations
- **Real-time**: Socket.IO for bidirectional communication
- **Validation**: Zod for runtime type validation and schema definitions
- **HTTP Client**: TanStack Query for API state management
- **Styling**: Tailwind CSS with PostCSS for utility-first styling

### Development Tools
- **Build System**: Vite with TypeScript compilation and hot reload
- **Code Quality**: TypeScript for static type checking
- **Path Resolution**: Custom path aliases for clean import statements
- **Error Handling**: Runtime error overlay for development debugging