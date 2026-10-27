# Contributing

## Branch workflow

```text
feature/* → development → staging → main
```

- Create feature and fix branches from `development` and open pull requests back to it.
- Promote a tested candidate from `development` into `staging` through a pull request.
- Validate that candidate against the intended services, then promote `staging` into `main`.
- Keep commits focused. Include what changed, why, and the checks performed in each pull request.
- After a direct hotfix to `main`, synchronize it back into `staging` and `development` before starting the next release.

These are source branches. Deployment targets, service credentials, approval rules, and branch protection are configured separately; this document does not assert that those controls are enabled.

## Local checks

```bash
npm ci
cp .env.example .env.local
npm run lint
npm run typecheck
npm run build
```

Use a configured Supabase dataset for data-backed UI checks. Keep new service integrations server-side, update `.env.example` when configuration changes, and include screenshots for visible UI changes. Read `AGENTS.md` and the installed Next.js documentation before editing framework code.

## Before opening a pull request

- Keep credentials and local environment files out of commits.
- Update the README or focused documentation when setup or behavior changes.
- Explain external prerequisites and any validation you could not perform.
- Preserve existing contributor credits and third-party notices.
