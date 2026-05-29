# FL Green Compliance Enterprise™ - Architecture Documentation

## Overview

FL Green Compliance Enterprise™ is a production-grade SaaS platform for managing field operations, compliance workflows, and fleet management for lawn care and landscaping companies. The system provides real-time GPS tracking, AI-powered compliance analysis, work order management, and comprehensive audit logging.

## Technology Stack

### Backend
- **Framework**: Express.js 4 + tRPC 11
- **Language**: TypeScript 5.9
- **Database**: MySQL/TiDB via Drizzle ORM
- **Authentication**: Manus OAuth 2.0
- **LLM Integration**: OpenAI API (via Manus)
- **Storage**: S3 (via Manus)

### Frontend
- **Framework**: React 19 + Vite
- **Styling**: Tailwind CSS 4
- **State Management**: React Query (TanStack Query)
- **UI Components**: shadcn/ui
- **Routing**: Wouter

### Infrastructure
- **Hosting**: Manus Cloud (Node.js runtime)
- **Database**: Managed MySQL/TiDB
- **Authentication**: Manus OAuth Server
- **Storage**: S3-compatible storage

## Database Schema

### Core Tables

#### `users`
- User identity and authentication
- Fields: id, openId, email, name, role, tenantId, companyId
- Roles: admin, manager, field_worker

#### `tenants`
- Multi-tenant organization boundaries
- Fields: id, tenantId, name, contactEmail, industry

#### `companies`
- Customer organizations within tenants
- Fields: id, companyId, tenantId, name, address, phone

#### `properties`
- Managed properties/locations
- Fields: id, propertyId, companyId, address, squareFeet, latitude, longitude

#### `applications`
- Fertilizer/pesticide applications
- Fields: id, propertyId, applicationDate, treatmentType, nitrogenRate, phosphorusRate

#### `complianceResults`
- Compliance check results
- Fields: id, applicationId, complianceStatus, score, violations

#### `complianceTasks`
- Compliance workflow tasks
- Fields: id, taskId, companyId, title, status, dueDate, priority

#### `violations`
- Detected compliance violations
- Fields: id, violationId, applicationId, severity, status, remediationDate

#### `ordinances`
- Compliance rules and regulations
- Fields: id, ordinanceId, type, jurisdiction, rule, limit

#### `workOrders`
- Field work assignments
- Fields: id, workOrderId, companyId, title, status, assignedTo, dueDate

#### `devices`
- Fleet vehicles and equipment
- Fields: id, deviceId, companyId, name, deviceType, status

#### `gpsLocations`
- Real-time GPS telemetry data
- Fields: id, deviceId, latitude, longitude, accuracy, speed, timestamp

#### `auditLog`
- Comprehensive audit trail
- Fields: id, userId, companyId, eventType, resourceType, action, changes, timestamp

## API Architecture

### Authentication & Authorization

```
publicProcedure → No authentication required
protectedProcedure → User must be authenticated
adminProcedure → User must have admin role
managerProcedure → User must have admin or manager role
```

### Multi-Tenancy

All procedures enforce tenant isolation through:
1. **Tenant Context**: Middleware extracts tenantId from user
2. **Row-Level Filtering**: All queries filter by tenantId/companyId
3. **Access Control**: Users can only access data from their tenant/company

### Core Routers

#### `auth`
- `me`: Get current user
- `logout`: Clear session

#### `tenants`
- `create`: Create new tenant
- `list`: List all tenants

#### `companies`
- `create`: Create company
- `list`: List companies for tenant

#### `properties`
- `create`: Register property
- `list`: List properties for company
- `get`: Get property details

#### `applications`
- `create`: Record application
- `list`: List applications
- `get`: Get application details

#### `workOrders`
- `create`: Create work order
- `list`: List work orders
- `get`: Get work order details

#### `workorder`
- `assign`: Assign work order to user
- `updateStatus`: Update work order status
- `getMyWorkOrders`: Get user's assigned work orders
- `getStats`: Get work order statistics

#### `devices`
- `create`: Register device
- `list`: List devices
- `get`: Get device details

#### `compliance`
- `createTask`: Create compliance task
- `getComplianceScore`: Calculate compliance score
- `getViolations`: List violations
- `checkApplicationCompliance`: Evaluate application compliance

#### `telemetry`
- `recordLocation`: Record GPS location
- `getCurrentLocation`: Get device current location
- `getLocationHistory`: Get location history
- `getFleetLocations`: Get all device locations
- `getDeviceStats`: Get device statistics

#### `inspection`
- `analyzeImage`: Analyze image with AI
- `analyzeApplication`: Analyze application compliance

#### `system`
- `getAuditLog`: Get audit log entries
- `notifyOwner`: Send notification to project owner

## Data Flow

### Work Order Lifecycle

```
1. Manager creates work order (pending)
2. Manager assigns to field worker (assigned)
3. Field worker updates status (in_progress)
4. Field worker completes work (completed)
5. Audit log records all changes
```

### Compliance Workflow

```
1. Application recorded (fertilizer/pesticide)
2. Compliance engine evaluates against ordinances
3. Violations detected and recorded
4. Manager notified of violations
5. Remediation tracked and verified
6. Compliance score calculated
```

### GPS Telemetry

```
1. Device records location (latitude, longitude, accuracy)
2. Location stored in gpsLocations table
3. Dashboard queries current locations
4. Fleet view displays all device positions
5. Location history available for playback
```

### AI Inspection

```
1. User uploads image
2. Image sent to LLM for analysis
3. Analysis results returned (condition, recommendations)
4. Results stored and displayed
5. Follow-up tasks generated if needed
```

## Security Features

### Authentication
- Manus OAuth 2.0 for user authentication
- JWT-based session management
- Secure cookie storage with HttpOnly flag

### Authorization
- Role-based access control (RBAC)
- Tenant-level data isolation
- Company-level access restrictions

### Data Protection
- All data encrypted in transit (HTTPS)
- Sensitive data hashed in database
- Audit logging for all operations

### Audit Trail
- Comprehensive event logging
- User action tracking
- Resource change history
- Immutable audit records

## Performance Considerations

### Database Optimization
- Indexes on frequently queried columns (tenantId, companyId, deviceId)
- Efficient queries with Drizzle ORM
- Connection pooling for database

### Caching
- React Query for frontend caching
- Automatic cache invalidation on mutations
- Optimistic updates for instant feedback

### Real-Time Updates
- WebSocket infrastructure ready for live updates
- GPS location streaming capability
- Work order status notifications

## Deployment

### Environment Variables
- `DATABASE_URL`: MySQL connection string
- `JWT_SECRET`: Session signing secret
- `VITE_APP_ID`: OAuth application ID
- `OAUTH_SERVER_URL`: OAuth server endpoint
- `BUILT_IN_FORGE_API_KEY`: LLM/Storage API key

### Build Process
```bash
pnpm build        # Build frontend + backend
pnpm start        # Start production server
```

### Production Deployment
- Node.js runtime on Manus Cloud
- Automatic HTTPS/TLS
- Managed database backups
- Built-in monitoring and logging

## Testing

### Test Coverage
- Authentication & RBAC: 8 tests
- Multi-tenancy isolation: 1 test
- Total: 9 passing tests

### Running Tests
```bash
pnpm test         # Run all tests
pnpm check        # TypeScript type checking
```

## Development Workflow

### Local Development
```bash
pnpm dev          # Start dev server (http://localhost:3000)
```

### Adding Features
1. Update database schema in `drizzle/schema.ts`
2. Generate migration: `pnpm drizzle-kit generate`
3. Apply migration: `webdev_execute_sql`
4. Add query helpers in `server/db.ts`
5. Create procedures in `server/routers.ts`
6. Build UI components in `client/src/pages/`
7. Write tests in `server/*.test.ts`

## Future Enhancements

### Phase 6: Billing & Subscriptions
- Stripe payment integration
- Subscription plan management
- Usage tracking and billing

### Phase 7: Mobile App
- Flutter mobile application
- Offline-first sync
- Biometric authentication

### Phase 8: Advanced Analytics
- Compliance trend analysis
- Worker performance metrics
- Fleet utilization reports

### Phase 9: Integrations
- Third-party API integrations
- Webhook support
- Data export capabilities

## Support & Documentation

- API Documentation: See tRPC procedures in `server/routers.ts`
- Database Schema: See `drizzle/schema.ts`
- Frontend Components: See `client/src/components/`
- Configuration: See `.env` variables

## License

Proprietary - FL Green Compliance Enterprise™
