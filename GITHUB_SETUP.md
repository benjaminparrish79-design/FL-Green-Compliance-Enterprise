# GitHub Repository Setup Guide

This guide explains how to export FL Green Compliance to GitHub and set up CI/CD.

## Step 1: Create GitHub Repository

1. Go to [GitHub](https://github.com/new)
2. Create a new repository named `fl-green-compliance`
3. Choose visibility (public/private)
4. Do NOT initialize with README (we have one)
5. Click "Create repository"

## Step 2: Export Project to GitHub

```bash
# Navigate to project directory
cd /home/ubuntu/fl-green-compliance

# Add GitHub remote
git remote add github https://github.com/YOUR_USERNAME/fl-green-compliance.git

# Push to GitHub
git branch -M main
git push -u github main
```

## Step 3: Configure GitHub Secrets

Go to your repository → Settings → Secrets and variables → Actions

Add these secrets:

```
DEPLOYMENT_TOKEN=your-deployment-token
SNYK_TOKEN=your-snyk-token (optional)
STRIPE_SECRET_KEY=sk_test_...
OPENWEATHER_API_KEY=...
TWILIO_ACCOUNT_SID=...
TWILIO_AUTH_TOKEN=...
DATABASE_URL=postgresql://...
```

## Step 4: Enable Branch Protection

Go to Settings → Branches → Add rule

Configure for `main` branch:
- Require status checks to pass before merging
- Require code reviews before merging (1 review)
- Dismiss stale pull request approvals
- Require branches to be up to date before merging

## Step 5: Set Up Environments

Go to Settings → Environments

Create two environments:

### Development
- Auto-deployment: None
- Deployment branches: develop

### Production
- Auto-deployment: None
- Deployment branches: main
- Required reviewers: Add team members

## Step 6: Configure Actions

Go to Actions → General

- Allow all actions and reusable workflows
- Fork pull request workflows from outside collaborators: Require approval for first-time contributors
- Workflow permissions: Read and write permissions

## Step 7: Enable Dependabot

Go to Settings → Code security and analysis

- Enable Dependabot alerts
- Enable Dependabot security updates
- Enable Dependabot version updates

## Step 8: Set Up Notifications

Go to Settings → Notifications

Configure where to receive alerts for:
- Failed deployments
- Security vulnerabilities
- Workflow failures

## Workflow Files

The project includes two GitHub Actions workflows:

### `.github/workflows/ci-cd.yml`
Runs on every push and pull request:
- TypeScript type checking
- Unit tests
- Security scanning
- Build verification
- Automated deployment to production (main branch only)

### `.github/workflows/security.yml`
Runs on schedule and on push to main:
- Dependency vulnerability checks
- CodeQL security analysis
- Code linting
- Outdated package detection

## Deployment

### Automatic Deployment (Main Branch)

When you push to `main`:
1. Tests run automatically
2. Security checks execute
3. If all pass, automatic deployment triggers
4. Production environment is updated

### Manual Deployment (Develop Branch)

For develop branch:
1. Tests and security checks run
2. Manual approval required
3. Deploy via GitHub Actions manually

## Monitoring

After setup, monitor:
- GitHub Actions tab for workflow status
- Security tab for vulnerabilities
- Dependabot alerts for dependency updates
- Deployment status in Environments tab

## Troubleshooting

### Workflow Fails
- Check workflow logs in Actions tab
- Verify secrets are configured correctly
- Ensure branch protection rules aren't blocking

### Deployment Issues
- Check deployment logs
- Verify environment variables
- Review recent commits

### Security Alerts
- Review Dependabot alerts
- Update vulnerable packages
- Run `pnpm audit` locally

## Best Practices

1. **Always use branches** - Never commit directly to main
2. **Require reviews** - Use pull requests for all changes
3. **Keep secrets safe** - Never commit API keys
4. **Monitor workflows** - Check Actions tab regularly
5. **Update dependencies** - Review and merge Dependabot PRs
6. **Test locally** - Run `pnpm test` before pushing
7. **Write good commits** - Use conventional commit format

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)
- [Branch Protection Rules](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [Secrets Management](https://docs.github.com/en/actions/security-guides/encrypted-secrets)

---

For questions or issues, contact: dev@flgcompliance.com
