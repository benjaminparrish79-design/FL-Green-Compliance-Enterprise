# FL Green Compliance Enterprise™ - Production Deployment Guide

## Overview

This guide covers deploying FL Green Compliance to production with security hardening, performance optimization, and monitoring.

## Pre-Deployment Checklist

### Security Requirements
- [ ] Enable HTTPS on all endpoints
- [ ] Configure CORS for production domains
- [ ] Set up rate limiting (100 requests/minute per IP)
- [ ] Enable request validation and sanitization
- [ ] Implement API key management for integrations
- [ ] Configure encryption for sensitive data at rest
- [ ] Set security headers (CSP, X-Frame-Options, HSTS)
- [ ] Enable CSRF protection
- [ ] Configure secure session cookies (HttpOnly, Secure, SameSite)

### Database Requirements
- [ ] Set up automated backups (daily, with 30-day retention)
- [ ] Configure replication for high availability
- [ ] Enable query logging for performance monitoring
- [ ] Set up connection pooling (max 20 connections)
- [ ] Configure row-level security (RLS) policies
- [ ] Create database indexes for common queries
- [ ] Test disaster recovery procedures

### Monitoring & Observability
- [ ] Set up application performance monitoring (APM)
- [ ] Configure centralized logging (ELK stack or similar)
- [ ] Set up error tracking (Sentry or similar)
- [ ] Configure health check endpoints
- [ ] Set up alerting for critical errors
- [ ] Configure uptime monitoring
- [ ] Set up performance dashboards

### Environment Configuration
- [ ] Configure production environment variables
- [ ] Set up Stripe live keys (not sandbox)
- [ ] Configure OAuth production credentials
- [ ] Set up email service (SendGrid, Mailgun)
- [ ] Configure S3 buckets for file storage
- [ ] Set up CDN for static assets
- [ ] Configure DNS records

## Deployment Steps

### 1. Pre-Deployment Testing

```bash
# Run all tests
pnpm test

# Type checking
pnpm check

# Build verification
pnpm build
```

### 2. Database Migration

```bash
# Generate migrations
pnpm drizzle-kit generate

# Review migration SQL
cat drizzle/[latest].sql

# Apply migration (via webdev_execute_sql or direct connection)
# Verify migration success
```

### 3. Environment Setup

```bash
# Set production environment variables
export NODE_ENV=production
export DATABASE_URL=mysql://user:pass@prod-db:3306/flgc
export STRIPE_SECRET_KEY=sk_live_...
export VITE_STRIPE_PUBLISHABLE_KEY=pk_live_...
export STRIPE_WEBHOOK_SECRET=whsec_...
```

### 4. Application Deployment

```bash
# Build production bundle
pnpm build

# Start production server
NODE_ENV=production node dist/index.js
```

### 5. Post-Deployment Verification

- [ ] Test user authentication flow
- [ ] Verify all API endpoints respond correctly
- [ ] Test payment processing with live Stripe keys
- [ ] Verify database connectivity and queries
- [ ] Test file upload and storage
- [ ] Verify email notifications
- [ ] Check monitoring and alerting

## Performance Optimization

### Database Optimization
- Add indexes on frequently queried columns
- Optimize query performance with EXPLAIN ANALYZE
- Implement connection pooling
- Set up query caching for read-heavy operations

### API Optimization
- Implement pagination for large datasets
- Add response compression (gzip)
- Cache API responses (1 hour default)
- Implement request batching for bulk operations

### Frontend Optimization
- Lazy load components
- Code splitting for routes
- Image optimization and CDN delivery
- Minify and bundle assets
- Enable browser caching

### Infrastructure Optimization
- Use CDN for static assets
- Implement load balancing
- Auto-scaling for traffic spikes
- Database read replicas for scaling reads

## Security Hardening

### API Security
- Rate limiting: 100 requests/minute per IP
- Request validation with Zod
- SQL injection prevention (Drizzle ORM)
- XSS protection (React escaping)
- CSRF tokens for state-changing operations

### Data Security
- Encryption at rest for sensitive data
- Encryption in transit (TLS 1.3)
- Secure password hashing (bcrypt)
- PII data masking in logs
- Secure key management

### Authentication & Authorization
- JWT token expiration (1 hour)
- Refresh token rotation
- RBAC enforcement at procedure level
- Multi-tenancy isolation
- Session management

### Compliance
- GDPR compliance (data export, deletion)
- CCPA compliance (privacy policy, opt-out)
- PCI DSS compliance (Stripe handling)
- SOC 2 compliance (audit logging)
- HIPAA compliance (if applicable)

## Monitoring & Alerting

### Key Metrics to Monitor
- API response time (target: <200ms)
- Error rate (target: <0.1%)
- Database query time (target: <100ms)
- CPU usage (alert: >80%)
- Memory usage (alert: >85%)
- Disk usage (alert: >90%)
- Active connections (alert: >100)

### Alerts to Configure
- High error rate (>1%)
- Database connection failures
- Payment processing failures
- Authentication failures
- Rate limit violations
- Disk space low (<10%)
- Memory pressure

### Logging Strategy
- Application logs: INFO level
- Error logs: All errors with stack traces
- Audit logs: All user actions
- Performance logs: Slow queries (>1s)
- Security logs: Failed auth, permission violations

## Backup & Disaster Recovery

### Backup Strategy
- Daily full backups
- Hourly incremental backups
- 30-day retention
- Off-site backup storage
- Regular backup restoration testing

### Disaster Recovery
- RTO (Recovery Time Objective): 1 hour
- RPO (Recovery Point Objective): 1 hour
- Documented recovery procedures
- Regular DR drills
- Failover testing

## Scaling Strategy

### Horizontal Scaling
- Load balancer (NGINX or similar)
- Multiple application instances
- Database read replicas
- Cache layer (Redis)
- CDN for static assets

### Vertical Scaling
- Increase server CPU/RAM
- Database optimization
- Connection pooling
- Query optimization
- Caching strategy

## Maintenance

### Regular Tasks
- Security patches (weekly)
- Dependency updates (monthly)
- Database maintenance (weekly)
- Log rotation and cleanup
- Certificate renewal (before expiry)

### Monitoring Tasks
- Review error logs (daily)
- Check performance metrics (daily)
- Audit security logs (weekly)
- Backup verification (weekly)
- Capacity planning (monthly)

## Rollback Procedure

If deployment fails:

1. **Immediate Action**
   - Revert to previous application version
   - Revert database migrations (if applicable)
   - Verify system stability

2. **Post-Incident**
   - Document what went wrong
   - Identify root cause
   - Update deployment procedures
   - Schedule remediation

## Support & Escalation

### Support Channels
- Email: support@flgcompliance.com
- Phone: +1-XXX-XXX-XXXX
- Chat: In-app support chat
- Status Page: status.flgcompliance.com

### Escalation Path
1. Level 1: Support team (response: 1 hour)
2. Level 2: Engineering team (response: 15 minutes)
3. Level 3: On-call engineer (response: 5 minutes)

## References

- [Deployment Architecture](./ARCHITECTURE.md)
- [API Documentation](./API.md)
- [Security Guidelines](./SECURITY.md)
- [Troubleshooting Guide](./TROUBLESHOOTING.md)
