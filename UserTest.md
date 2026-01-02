Based on the AGENTS.md documentation and project structure, here are the main user flows with proper user stories and acceptance criteria:

🏠 CUSTOMER USER FLOWS
Flow 1: Plan Discovery & Build Request
Epic: As a prospective homeowner, I want to find and request sustainable building plans so that I can build my dream home.

US1.1 - Plan Discovery
User Story: As a prospective customer, I want to browse sustainable building plans with intuitive filters so that I can shortlist designs that fit my needs.

Acceptance Criteria:

✅ I can filter plans by style, bedrooms, bathrooms, floors, area, and budget
✅ Plan catalog displays in a responsive grid with skeleton loading states
✅ Empty results show helpful messaging with filter adjustment suggestions
✅ Filter state persists in URL query parameters for sharing/bookmarking
✅ Plan detail page shows media gallery, specifications, and regional cost estimates
✅ Cost estimates are calculated using backend pricing rules for my region
Technical Implementation:

/api/plans endpoint with Postgres indexes for filtering
React catalog with TanStack Query for state management
Regional pricing service integration
US1.2 - Build Request Submission
User Story: As a customer, I want to submit a request-to-build with my requirements so that an agent can follow up with a personalized quote.

Acceptance Criteria:

✅ Multi-step form validates all required fields before submission
✅ I can upload supporting documents (lot surveys, inspiration photos)
✅ Form captures customizations, budget range, timeline, and location
✅ I receive immediate confirmation email after submission
✅ Internal staff receive notification of new lead
✅ My request appears in agent dashboard for assignment
Technical Implementation:

S3 presigned URLs for file uploads
Celery tasks for email notifications
WebSocket notifications to admin portal
Flow 2: Property Discovery & Viewing
US1.3 - Property Search & Viewing
User Story: As a property seeker, I want to discover listings and schedule viewings so that I can evaluate available homes.

Acceptance Criteria:

✅ I can search properties by price, type, bedrooms, bathrooms, area, location
✅ Results include pagination and sorting options
✅ Property detail page shows gallery, map, agent contact, and related listings
✅ I can submit inquiries and schedule viewing appointments
✅ I receive confirmation email/SMS for scheduled viewings
✅ Agent receives notification and calendar entry for viewing
Technical Implementation:

/api/properties with full-text search capabilities
Map integration for location display
Calendar integration for viewing scheduling
👔 AGENT USER FLOWS
Flow 3: Lead Management & Qualification
US2.1 - Lead Inbox Management
User Story: As an agent, I want a lead inbox and qualification workflow so that I can triage customer interest efficiently.

Acceptance Criteria:

✅ Dashboard shows all assigned leads with status indicators
✅ I can sort leads by priority, date, status, and potential value
✅ Unread leads are clearly highlighted with badge counts
✅ I can update lead status with activity logging
✅ Internal notes are saved and visible to team members
✅ Real-time notifications when new leads arrive or status changes
Technical Implementation:

WebSocket updates for real-time notifications
Activity logging with audit trail
Role-based permissions for lead access
Flow 4: Quote Generation & Management
US2.2 - Quote Builder & Delivery
User Story: As an agent, I want to generate and send quotes with regional pricing so that customers receive accurate estimates.

Acceptance Criteria:

✅ Quote builder calculates line items using regional multipliers
✅ I can add allowances, options, and custom items
✅ Generated quotes render as professional PDF/HTML
✅ Customer receives quote via email with e-signature capability
✅ I can track quote status (sent, viewed, accepted, declined)
✅ Accepted quotes automatically convert to projects
Technical Implementation:

Regional pricing engine with multiplier calculations
PDF generation service
Digital signature integration
Quote status tracking with webhooks
Flow 5: Project Management & Collaboration
US3.1 - Project Tracking Dashboard
User Story: As an agent/project manager, I want real-time collaboration tools so that I can coordinate with customers and teammates.

Acceptance Criteria:

✅ Project dashboard shows milestone timeline and progress
✅ I can update project status and add progress photos
✅ Real-time chat with customers and team members
✅ Task management with due dates and assignments
✅ Document sharing with version control
✅ Automated notifications for milestone changes
Technical Implementation:

WebSocket chat with typing indicators
File versioning system
Task management API with calendar integration
🛡️ ADMIN USER FLOWS
Flow 6: Content & Catalog Management
US2.3 - Catalog Administration
User Story: As an admin, I want to manage catalogs, regions, and notification templates so that the platform stays current.

Acceptance Criteria:

✅ CRUD operations for plans, properties, regions, pricing rules
✅ Draft/publish workflow prevents incomplete content going live
✅ Media asset library with upload and organization capabilities
✅ Audit trail tracks all content changes with user attribution
✅ Global settings (legal pages, contact info) with preview functionality
✅ Notification template editor with variable substitution
Technical Implementation:

DRF admin APIs with versioning
Media management with S3 integration
Template engine for notifications
Flow 7: Analytics & Business Intelligence
US3.2 - Analytics Dashboard
User Story: As an executive stakeholder, I want comprehensive analytics so that I can understand platform performance and make data-driven decisions.

Acceptance Criteria:

✅ Lead funnel metrics (lead → quote → project conversion rates)
✅ Agent performance analytics with leaderboards
✅ Revenue tracking and forecasting
✅ Regional performance comparisons
✅ Customer satisfaction and retention metrics
✅ Export capabilities for external reporting (CSV, PDF)
Technical Implementation:

Analytics aggregation service
Data visualization components
Export service with scheduled reports
🔄 CROSS-CUTTING USER FLOWS
Flow 8: Authentication & Onboarding
US0.2 - Secure Authentication
User Story: As any user, I want secure authentication so that my data is protected and I can access role-appropriate features.

Acceptance Criteria:

✅ Email verification required for account activation
✅ Role-based access control (customer, agent, admin)
✅ Password reset with secure token generation
✅ JWT token management with refresh capabilities
✅ Route guards prevent unauthorized access
✅ Session management with automatic logout
Flow 9: Communication & Notifications
US-COMM - Multi-Channel Communication
User Story: As any user, I want timely notifications through multiple channels so that I stay informed about important updates.

Acceptance Criteria:

✅ Email notifications for all major workflow events
✅ SMS notifications for time-sensitive events (viewing confirmations)
✅ In-app notifications with read/unread status
✅ WebSocket real-time updates for active sessions
✅ Notification preferences management
✅ Template-based messaging with personalization
📊 Success Metrics by Flow
Customer Flows
Plan discovery → Build request conversion rate: >15%
Property inquiry → Viewing scheduled rate: >25%
Customer satisfaction score: >4.2/5
Agent Flows
Lead response time: <2 hours
Quote → Project conversion rate: >30%
Agent productivity: >5 active projects per agent
Admin Flows
Content update frequency: Daily
System uptime: >99.5%
User onboarding completion rate: >80%
These user flows represent the core value propositions of the Green Tech Africa platform, ensuring sustainable construction and transparent real estate transactions across Africa.