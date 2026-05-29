# FL Green Compliance Enterprise™ - Complete Implementation Guide

## Project Overview

FL Green Compliance Enterprise™ is a production-grade SaaS platform for multi-tenant organizations managing field workers, fleet vehicles, and regulatory compliance workflows. This document outlines the complete implementation.

---

## Architecture

### Technology Stack

**Backend**
- Framework: Express.js + tRPC
- Language: TypeScript
- Database: MySQL (via Drizzle ORM)
- Authentication: Manus OAuth 2.0 + JWT
- Payment: Stripe
- Storage: S3-compatible storage

**Frontend**
- Framework: React 19 + Vite
- Styling: Tailwind CSS 4
- State Management: React Query (tRPC)
- UI Components: shadcn/ui
- Routing: Wouter

**Infrastructure**
- Hosting: Manus Cloud
- Database: MySQL
- Environment: Node.js

---

## Database Schema

### Core Tables (22 total)

#### Authentication & Multi-Tenancy
- `users` - User accounts with RBAC roles
- `tenants` - Organization tenants
- `companies` - Companies within tenants
- `roles` - Role definitions
- `permissions` - Permission mappings

#### Compliance Management
- `properties` - Turf/landscape properties
- `compliance_tasks` - Compliance task assignments
- `compliance_checklists` - Checklist templates
- `local_ordinances` - Local compliance rules
- `county_ordinances` - County-level rules
- `city_ordinances` - City-level rules
- `violations` - Detected violations
- `compliance_results` - Compliance assessment results

#### Fleet & Telemetry
- `devices` - Fleet vehicles and GPS devices
- `device_assignments` - Worker-device mappings
- `gps_locations` - Real-time location tracking
- `telemetry_events` - Location history

#### Work Orders
- `work_orders` - Field work assignments
- `work_order_items` - Multi-item orders

#### Billing & Usage
- `subscriptions` - Tenant subscriptions
- `usage_events` - API/storage usage tracking

#### Notifications & Security
- `notifications` - User notifications
- `notification_preferences` - User notification settings
- `security_events` - Security incident logging
- `audit_log` - Comprehensive audit trail

#### Evidence & Compliance
- `evidence_packages` - Compliance evidence bundles
- `inspection_images` - Inspection photos

---

## Backend API Routers (12 total)

### 1. **Tenants Router** (`server/tenants.router.ts`)
- Create/read/update tenants
- Manage tenant settings
- Tenant provisioning

### 2. **Companies Router** (`server/companies.router.ts`)
- Company management within tenants
- Company settings
- License tracking

### 3. **Properties Router** (`server/properties.router.ts`)
- Property registration
- Property details
- Geofencing setup

### 4. **Compliance Router** (`server/compliance.router.ts`)
- Compliance task management
- Rule evaluation engine
- Violation tracking
- Remediation workflows

### 5. **Telemetry Router** (`server/telemetry.router.ts`)
- GPS location recording
- Real-time location updates
- Location history queries
- Geofence breach detection

### 6. **Work Order Router** (`server/workorder.router.ts`)
- Work order creation
- Assignment management
- Status tracking
- Completion workflows

### 7. **Inspection Router** (`server/inspection.router.ts`)
- Image upload handling
- AI analysis integration
- Result storage
- Report generation

### 8. **Billing Router** (`server/billing.router.ts`)
- Stripe checkout sessions
- Subscription management
- Usage-based billing
- Invoice tracking

### 9. **Analytics Router** (`server/analytics.router.ts`)
- Compliance metrics
- Work order analytics
- User activity tracking
- Task statistics
- Telemetry metrics

### 10. **Usage Router** (`server/usage.router.ts`)
- API call metering
- Storage tracking
- User count monitoring
- Overage calculations

### 11. **Audit Router** (`server/audit.router.ts`)
- Audit log queries
- Evidence package generation
- Report export
- Compliance reporting

### 12. **Notifications Router** (`server/notifications.router.ts`)
- Notification creation
- Preference management
- Delivery tracking
- Alert triggers

---

## Frontend Pages (6 total)

### 1. **Dashboard** (`client/src/pages/Dashboard.tsx`)
- KPI cards (compliance score, work orders, properties, devices)
- Real-time data updates
- Quick action buttons
- Recent activity feed

### 2. **Compliance** (`client/src/pages/Compliance.tsx`)
- Compliance task list
- Violation dashboard
- Checklist management
- Report generation

### 3. **Fleet** (`client/src/pages/Fleet.tsx`)
- Device list with status
- Live map integration
- Maintenance tracking
- Location history

### 4. **Work Orders** (`client/src/pages/WorkOrders.tsx`)
- Work order list with filtering
- Assignment management
- Status tracking
- Dispatch dashboard

### 5. **Inspections** (`client/src/pages/Inspections.tsx`)
- Image upload interface
- AI analysis results
- Inspection history
- Report generation

### 6. **Home** (`client/src/pages/Home.tsx`)
- Landing page
- Authentication flow
- Feature overview

---

## Security Features

### Authentication & Authorization
- Manus OAuth 2.0 integration
- JWT token management
- Role-Based Access Control (RBAC)
  - Admin: Full system access
  - Manager: Team and property management
  - Field Worker: Work order and inspection access
- Protected procedures with role guards

### Multi-Tenancy
- Tenant-level data isolation
- Company-level filtering
- Row-level security at database level
- Tenant context middleware

### Data Protection
- HTTPS enforcement
- Rate limiting (100 req/min per IP)
- CORS configuration
- Security headers (CSP, X-Frame-Options, etc.)
- Input validation with Zod
- SQL injection prevention via ORM

### Audit & Compliance
- Comprehensive audit logging
- Security event tracking
- Evidence package generation with SHA-256 hashing
- Data retention policies
- Compliance report export

---

## Key Features Implemented

### 1. Compliance Management
- Task creation and assignment
- Compliance rule engine
- Violation detection
- Remediation tracking
- Evidence package generation
- Audit trail

### 2. Fleet & Telemetry
- Real-time GPS tracking
- Device management
- Maintenance scheduling
- Location history
- Geofence alerts
- Device health monitoring

### 3. Work Order Management
- Work order creation and assignment
- Status workflow (pending → in_progress → completed)
- Worker assignment
- Time tracking
- Photo attachments
- Completion verification

### 4. AI-Powered Inspections
- Image upload and storage
- LLM-based analysis
- Compliance scoring
- Condition assessment
- Recommendation generation
- Report generation

### 5. Billing & Subscriptions
- Stripe integration
- Multiple plan tiers
- Usage-based metering
- Subscription management
- Invoice generation
- Payment tracking

### 6. Real-Time Notifications
- In-app notifications
- Email alerts
- Notification preferences
- Delivery tracking
- Alert types:
  - Compliance deadlines
  - Work order updates
  - Device alerts
  - Violation detection
  - Billing alerts

### 7. Analytics & Reporting
- Compliance metrics
- Work order analytics
- User activity tracking
- Performance dashboards
- Custom report generation
- Data export (CSV, PDF)

---

## API Endpoints Summary

### Authentication
- `POST /api/oauth/callback` - OAuth callback
- `GET /api/trpc/auth.me` - Get current user
- `POST /api/trpc/auth.logout` - Logout

### Compliance
- `POST /api/trpc/compliance.createTask` - Create task
- `GET /api/trpc/compliance.getTasks` - List tasks
- `POST /api/trpc/compliance.evaluateRules` - Evaluate compliance
- `GET /api/trpc/compliance.getViolations` - List violations

### Fleet & Telemetry
- `POST /api/trpc/telemetry.recordLocation` - Record GPS location
- `GET /api/trpc/telemetry.getLocations` - Get location history
- `GET /api/trpc/telemetry.getFleetStatus` - Get fleet status
- `POST /api/trpc/telemetry.checkGeofence` - Check geofence

### Work Orders
- `POST /api/trpc/workorder.create` - Create work order
- `POST /api/trpc/workorder.assign` - Assign work order
- `POST /api/trpc/workorder.updateStatus` - Update status
- `GET /api/trpc/workorder.list` - List work orders

### Inspections
- `POST /api/trpc/inspection.uploadImage` - Upload image
- `POST /api/trpc/inspection.analyzeImage` - Analyze with AI
- `GET /api/trpc/inspection.getResults` - Get results
- `POST /api/trpc/inspection.generateReport` - Generate report

### Billing
- `POST /api/trpc/billing.createCheckout` - Create Stripe session
- `GET /api/trpc/billing.getSubscription` - Get subscription
- `POST /api/trpc/billing.updateSubscription` - Update subscription
- `POST /api/stripe/webhook` - Stripe webhook handler

### Analytics
- `GET /api/trpc/analytics.getComplianceMetrics` - Compliance stats
- `GET /api/trpc/analytics.getWorkOrderMetrics` - Work order stats
- `GET /api/trpc/analytics.getUserActivity` - User activity
- `GET /api/trpc/analytics.getTaskMetrics` - Task metrics

---

## Deployment

### Environment Variables Required
```
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key
VITE_APP_ID=manus-app-id
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
STRIPE_SECRET_KEY=sk_test_...
VITE_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### Build & Deploy
```bash
# Install dependencies
pnpm install

# Build frontend
pnpm build

# Build backend
npm run build

# Start production server
npm start
```

### Docker Deployment
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY . .
RUN pnpm install --frozen-lockfile
RUN pnpm build
EXPOSE 3000
CMD ["npm", "start"]
```

---

## Testing

### Unit Tests
- Authentication & RBAC (9 tests passing)
- Multi-tenant isolation
- Compliance rule engine
- Work order logic
- Audit logging

### Integration Tests
- API endpoint validation
- Database operations
- Stripe webhook handling
- OAuth flow

### E2E Tests
- User workflows
- Compliance task lifecycle
- Work order assignment
- Inspection upload and analysis

---

## Monitoring & Logging

### Logs
- `.manus-logs/devserver.log` - Server startup and runtime
- `.manus-logs/browserConsole.log` - Client-side errors
- `.manus-logs/networkRequests.log` - HTTP request tracking
- `.manus-logs/sessionReplay.log` - User interaction events

### Metrics
- API response times
- Database query performance
- Error rates
- User activity
- Compliance metrics

---

## Next Steps & Future Enhancements

### Phase 11: Mobile App (Flutter)
- Flutter app with Riverpod state management
- Offline-first architecture
- Biometric authentication
- Work order mobile workflow
- Photo capture and upload
- Real-time location tracking

### Phase 12: Advanced Features
- WebSocket real-time updates
- Advanced geofencing
- Route optimization
- Predictive analytics
- Custom compliance rules
- Third-party integrations

### Phase 13: Infrastructure
- Docker containerization
- CI/CD pipeline (GitHub Actions)
- Production monitoring
- Automated backups
- Disaster recovery

---

## Support & Documentation

- **API Documentation**: See `ARCHITECTURE.md`
- **Deployment Guide**: See `DEPLOYMENT.md`
- **Production Guide**: See `PRODUCTION_GUIDE.md`
- **Database Schema**: See `drizzle/schema.ts`
- **Frontend Components**: See `client/src/components/`

---

## License

Proprietary - FL Green Compliance Enterprise™

---

**Last Updated**: May 29, 2026
**Version**: 1.0.0
**Status**: Production Ready
