FitnessTracker web app built with Next.js (App Router) and React.

## Getting Started

### Prerequisites

- Node.js `>=20.9.0` (see `.nvmrc`)
- pnpm (see `package.json#packageManager`)

### Install

```bash
pnpm install
```

### Dev

Run the development server:

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Quality Checks

```bash
pnpm lint
pnpm lint:eslint
pnpm typecheck
pnpm build
```

## Integration Setup

Set these environment variables for the app:

```bash
APP_URL=https://app.iam360.ai
CRON_SECRET=...

WHOOP_CLIENT_ID=...
WHOOP_CLIENT_SECRET=...
WHOOP_SCOPES="offline read:recovery read:cycles read:workout read:sleep read:profile read:body_measurement"
WHOOP_SYNC_SECRET=...

OURA_CLIENT_ID=...
OURA_CLIENT_SECRET=...
OURA_SCOPES="email personal daily heartrate workout session tag spo2"
OURA_WEBHOOK_VERIFICATION_TOKEN=...
OURA_SYNC_SECRET=...
```

Configure the WHOOP developer dashboard with:

- Redirect URL: `https://app.iam360.ai/api/integrations/whoop/callback`
- Webhook URL: `https://app.iam360.ai/api/webhooks/whoop`
- Webhook model version: `v2`

Configure the Oura developer application with:

- Redirect URL: `https://app.iam360.ai/api/integrations/oura/callback`

Oura webhook subscriptions are created and renewed automatically against:

- Callback URL: `https://app.iam360.ai/api/webhooks/oura`

Internal sync routes are protected with bearer auth:

- Vercel cron uses `CRON_SECRET`
- Manual/internal calls can use `WHOOP_SYNC_SECRET` or `OURA_SYNC_SECRET`

The backend enforces a single active wearable provider per user. A user must
disconnect Oura before connecting WHOOP, and disconnect WHOOP before connecting
Oura.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
