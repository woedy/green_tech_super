# Product Overview

Green Tech Africa is a construction and real estate platform serving the African market. The system manages the complete lifecycle of construction projects, property listings, and client interactions.

## Core Features

- Property catalog and listings management
- Construction project planning and tracking
- Build request and quote management
- User account management (customers, agents, admins)
- Real-time notifications via WebSockets
- Financial tracking and reporting
- Location-based services
- Lead management system

## User Roles

- **Public Users**: Browse properties and plans, submit build requests
- **Agents**: Manage client projects, respond to quotes, track construction
- **Admins**: Full system access, user management, content management

## Architecture

Multi-frontend architecture with three separate React applications:
- `green-tech-africa`: Public-facing website
- `green-agent-frontend`: Agent portal
- `green-admin-frontend`: Admin dashboard

Single Django REST API backend serving all frontends with role-based access control.
