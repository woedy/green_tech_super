# Product Overview

Green Tech Africa is a multi-tenant real estate platform with three distinct frontend applications:

## Applications

1. **Public Frontend** (green-tech-africa) - Port 5173
   - Public-facing website for property browsing and information
   - Marketing and informational content

2. **Agent Frontend** (green-agent-frontend) - Port 5174
   - Real estate agent portal
   - Project management and quote handling
   - Client interaction tools

3. **Admin Frontend** (green-admin-frontend) - Port 5175
   - Administrative dashboard
   - Manage plans, properties, users, regions
   - Site content management
   - Notification templates
   - Analytics and reporting

## Backend Services

- **Django Backend** - Port 8000
  - REST API serving all frontends
  - PostgreSQL database
  - Redis for caching and task queue
  - Celery for async task processing

## Domain

Real estate management platform focused on African markets, providing tools for property listings, agent workflows, and administrative oversight.
