# MakeHappen

Task and performance tracking for the MakeHappen event company.

## Setup

1. Copy `.env.example` to `.env.local` and set `MONGODB_URI` and `AUTH_SECRET`.
2. Start MongoDB.
3. Install and seed:

```bash
npm install
npm run seed
npm run dev
```

The seed creates the owner plus the Planning, Production, Installment, and Finance teams, and the default event types. The owner signs in with `SEED_OWNER_EMAIL` and `SEED_OWNER_PASSWORD` from `.env.local`.

Assignment emails use `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, and `MAIL_FROM`. If mail is not configured, creating an event still succeeds and the event page says the notice was not sent.
