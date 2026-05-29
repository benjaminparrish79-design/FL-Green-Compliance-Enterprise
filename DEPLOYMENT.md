# FL Green Compliance Enterprise™ - Deployment Guide

## Overview

This guide covers deploying FL Green Compliance to production on Manus Cloud.

## Pre-Deployment Checklist

- [ ] All tests passing (`pnpm test`)
- [ ] TypeScript compilation successful (`pnpm check`)
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Backup of production database created
- [ ] Team notified of deployment

## Environment Setup

### Development Environment

```bash
# Install dependencies
pnpm install

# Start dev server
pnpm dev

# Run tests
pnpm test

# Type check
pnpm check
```

### Production Environment Variables

Required environment variables for production:

```env
# Database
DATABASE_URL=mysql://user:password@host:3306/fl_green_compliance

# Authentication
JWT_SECRET=<secure-random-secret>
VITE_APP_ID=<oauth-app-id>
OAUTH_SERVER_URL=https://api.manus.im
VITE_OAUTH_PORTAL_URL=https://portal.manus.im

# APIs
BUILT_IN_FORGE_API_URL=https://api.manus.im
BUILT_IN_FORGE_API_KEY=<api-key>
VITE_FRONTEND_FORGE_API_KEY=<frontend-api-key>

# Owner Info
OWNER_OPEN_ID=<owner-id>
OWNER_NAME=<owner-name>

# Analytics (optional)
VITE_ANALYTICS_ENDPOINT=https://analytics.manus.im
VITE_ANALYTICS_WEBSITE_ID=<website-id>
```

## Deployment Process

### 1. Build Application

```bash
# Build frontend and backend
pnpm build

# Verify build output
ls -la dist/
```

### 2. Database Migration

```bash
# Generate migration from schema changes
pnpm drizzle-kit generate

# Review generated SQL
cat drizzle/migrations/*.sql

# Apply migration via webdev_execute_sql tool
# (Use Manus Management UI or CLI)
```

### 3. Deploy to Production

Using Manus Management UI:

1. Navigate to Project Settings
2. Click "Publish" button
3. Review deployment configuration
4. Confirm deployment
5. Monitor deployment progress

Or using CLI:

```bash
# Deploy to production
manus-deploy --project fl-green-compliance
```

### 4. Post-Deployment Verification

```bash
# Check application health
curl https://fl-green-compliance.manus.space/health

# Verify database connection
curl https://fl-green-compliance.manus.space/api/trpc/auth.me

# Check logs
manus logs --project fl-green-compliance --follow
```

## Rollback Procedure

### If Deployment Fails

1. **Identify the issue**
   ```bash
   # Check recent logs
   manus logs --project fl-green-compliance --lines 100
   ```

2. **Rollback to previous version**
   ```bash
   # Using Manus Management UI:
   # - Go to Version History
   # - Select previous stable version
   # - Click "Rollback"
   
   # Or using CLI:
   manus rollback --project fl-green-compliance --version <version-id>
   ```

3. **Verify rollback**
   ```bash
   curl https://fl-green-compliance.manus.space/health
   ```

### Database Rollback

If database migration fails:

1. **Restore from backup**
   ```bash
   # Contact database administrator
   # Restore from pre-deployment backup
   ```

2. **Verify data integrity**
   ```bash
   # Run integrity checks
   SELECT COUNT(*) FROM users;
   SELECT COUNT(*) FROM companies;
   ```

## Monitoring & Maintenance

### Health Checks

Monitor application health:

```bash
# Check server status
manus status --project fl-green-compliance

# View metrics
manus metrics --project fl-green-compliance

# Check error rates
manus logs --project fl-green-compliance --filter "ERROR"
```

### Performance Monitoring

- Monitor database query performance
- Track API response times
- Monitor memory usage
- Check error rates

### Backup Strategy

- Daily automated database backups
- Weekly full system backups
- Monthly backup verification
- 30-day backup retention

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed

**Symptom**: `Error: connect ECONNREFUSED`

**Solution**:
```bash
# Verify DATABASE_URL
echo $DATABASE_URL

# Test database connection
mysql -h <host> -u <user> -p <database>

# Check network connectivity
ping <database-host>
```

#### 2. OAuth Callback Error

**Symptom**: `Invalid redirect URI`

**Solution**:
- Verify `VITE_OAUTH_PORTAL_URL` matches OAuth app settings
- Check OAuth app configuration in Manus dashboard
- Ensure HTTPS is enabled

#### 3. API Key Invalid

**Symptom**: `401 Unauthorized`

**Solution**:
```bash
# Verify API keys
echo $BUILT_IN_FORGE_API_KEY
echo $VITE_FRONTEND_FORGE_API_KEY

# Regenerate keys if needed
# (Use Manus Management UI)
```

#### 4. Out of Memory

**Symptom**: `JavaScript heap out of memory`

**Solution**:
- Increase Node.js memory limit
- Optimize database queries
- Clear cache
- Scale to larger instance

#### 5. Database Timeout

**Symptom**: `Query timeout`

**Solution**:
- Increase query timeout
- Optimize slow queries
- Add database indexes
- Scale database resources

### Debug Mode

Enable debug logging:

```bash
# Set debug environment variable
DEBUG=fl-green-compliance:* pnpm start

# View detailed logs
manus logs --project fl-green-compliance --level debug
```

## Performance Tuning

### Database Optimization

```sql
-- Add indexes for frequently queried columns
CREATE INDEX idx_users_tenant ON users(tenantId);
CREATE INDEX idx_companies_tenant ON companies(tenantId);
CREATE INDEX idx_devices_company ON devices(companyId);
CREATE INDEX idx_workorders_company ON workOrders(companyId);
CREATE INDEX idx_gpslocations_device ON gpsLocations(deviceId);
```

### Caching Strategy

- Enable Redis caching for frequently accessed data
- Cache compliance scores for 1 hour
- Cache device locations for 5 minutes
- Invalidate cache on mutations

### Query Optimization

- Use database indexes
- Avoid N+1 queries
- Batch operations
- Use connection pooling

## Security Hardening

### SSL/TLS

- All traffic encrypted with HTTPS
- TLS 1.2 or higher required
- Certificate auto-renewal enabled

### Rate Limiting

- API rate limiting: 1000 requests/minute per user
- Login attempts: 5 per minute per IP
- File uploads: 10 MB per file

### Data Protection

- Sensitive data encrypted at rest
- Passwords hashed with bcrypt
- Audit logging enabled
- Regular security audits

## Disaster Recovery

### Recovery Time Objectives (RTO)

- Critical systems: 1 hour
- Non-critical systems: 4 hours

### Recovery Point Objectives (RPO)

- Database: 1 hour
- Files: 1 day

### Disaster Recovery Plan

1. **Identify incident**
2. **Activate recovery procedures**
3. **Restore from backup**
4. **Verify data integrity**
5. **Resume operations**
6. **Post-incident review**

## Support & Escalation

### Support Channels

- Email: support@flgreencompliance.com
- Phone: +1-XXX-XXX-XXXX
- Slack: #support-channel

### Escalation Path

1. Level 1: Support team (response time: 1 hour)
2. Level 2: Engineering team (response time: 30 minutes)
3. Level 3: DevOps team (response time: 15 minutes)

## Maintenance Windows

### Scheduled Maintenance

- Tuesdays 2-4 AM UTC
- Quarterly security patches
- Monthly performance optimization
- Advance notice: 7 days

### Emergency Maintenance

- Critical security patches: Immediate
- System outages: Immediate
- Data corruption: Immediate

## Changelog

### Version 1.0.0 (Current)

- Initial production release
- Multi-tenant architecture
- Compliance management
- GPS telemetry
- Work order management
- AI-powered inspections
- Comprehensive audit logging

See ARCHITECTURE.md for detailed feature documentation.
