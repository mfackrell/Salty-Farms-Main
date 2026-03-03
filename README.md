# AI Newsletter Builder MVP

## Architecture overview
- **Backend**: Express + TypeScript + Prisma + PostgreSQL. Handles webhook ingestion, run management, GPT section/draft generation, markdown sanitization, and publish forwarding.
- **Frontend**: React + Vite + TanStack Query. Dashboard + run detail workflow for selecting posts, generating, editing markdown, and publishing.
- **Integrations**: Zapier inbound webhook for Facebook posts and outbound webhook for Constant Contact handoff.

## Project tree
```txt
.
├─ apps/
│  ├─ api/
│  │  ├─ src/
│  │  ├─ prisma/
│  │  ├─ tests/
│  │  └─ package.json
│  └─ web/
│     ├─ src/
│     └─ package.json
├─ docker-compose.yml
├─ package.json
└─ .env.example
```

## Setup (local)
1. `cp .env.example .env`
2. `npm install`
3. `docker compose up -d db`
4. `npm run prisma:generate -w apps/api`
5. `npm run prisma:migrate -w apps/api`
6. `npm run prisma:seed -w apps/api`
7. Run services:
   - API: `npm run dev -w apps/api`
   - Web: `npm run dev -w apps/web`

## Setup (Docker)
1. `cp .env.example .env`
2. `docker compose up --build`

## Inbound Zapier URL
`POST http://<host>:4000/api/webhooks/zapier/facebook-posts`

### Example curl
```bash
curl -X POST http://localhost:4000/api/webhooks/zapier/facebook-posts \
  -H "Content-Type: application/json" \
  -H "x-webhook-secret: change_me" \
  -d '{
    "source":"facebook",
    "month":"2026-03",
    "posts":[
      {"externalPostId":"fb_1","message":"Sample post","postedAt":"2026-03-01T10:00:00Z"}
    ]
  }'
```

## OpenAI + Zapier env setup
- Set `OPENAI_API_KEY`
- Optionally override `OPENAI_MODEL` (default `gpt-4o`)
- Set `OUTBOUND_ZAPIER_WEBHOOK_URL` to your Zapier Catch Hook URL for Constant Contact flow

## Dev commands
- `npm run dev`
- `npm run build`
- `npm run test`

## Test commands
- `npm run test -w apps/api`
- `npm run test -w apps/web`

## Publish flow
1. UI calls `/api/runs/:runId/publish`
2. Backend converts markdown to sanitized HTML.
3. Backend POSTs payload to `OUTBOUND_ZAPIER_WEBHOOK_URL`.
4. Request/response is persisted in `PublishLog`.
5. Run status updates to `PUBLISHED` or `FAILED`.

## Assumptions
- Newsletter run is created on every successful webhook batch import.
- Web UI is public MVP; no auth layer is implemented yet.
- Draft preview in UI uses client-side markdown rendering; backend sanitized preview endpoint also exists.

## Known limitations / next improvements
- Add user auth/roles.
- Add richer content editing UX.
- Add better retry/queue orchestration for long generation jobs.
- Add more robust toast notifications.

## Post-build checklist
- [x] Webhook receive works
- [x] Generate works
- [x] Edit works (autosave PATCH)
- [x] Publish sends HTML outbound
