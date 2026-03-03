-- Create enums
CREATE TYPE "RunStatus" AS ENUM ('RECEIVED', 'SELECTING', 'GENERATING', 'DRAFT_READY', 'PUBLISHED', 'FAILED');
CREATE TYPE "SectionType" AS ENUM ('ARTICLE', 'HIGHLIGHTS', 'SCRIPTURE', 'CURRENT_NEEDS', 'UPCOMING_EVENTS', 'VOLUNTEER_SPOTLIGHT', 'AGGREGATED_DRAFT');

CREATE TABLE "Post" (
  "id" TEXT PRIMARY KEY,
  "externalPostId" TEXT NOT NULL UNIQUE,
  "message" TEXT NOT NULL,
  "postedAt" TIMESTAMP(3) NOT NULL,
  "permalink" TEXT,
  "mediaUrl" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "NewsletterRun" (
  "id" TEXT PRIMARY KEY,
  "month" TEXT NOT NULL,
  "status" "RunStatus" NOT NULL DEFAULT 'RECEIVED',
  "errorMessage" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL
);

CREATE TABLE "RunPostSelection" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "postId" TEXT NOT NULL,
  CONSTRAINT "RunPostSelection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NewsletterRun"("id") ON DELETE CASCADE,
  CONSTRAINT "RunPostSelection_postId_fkey" FOREIGN KEY ("postId") REFERENCES "Post"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "RunPostSelection_runId_postId_key" ON "RunPostSelection"("runId", "postId");

CREATE TABLE "NewsletterSection" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "type" "SectionType" NOT NULL,
  "title" TEXT,
  "contentMarkdown" TEXT NOT NULL,
  "sortOrder" INTEGER NOT NULL DEFAULT 0,
  CONSTRAINT "NewsletterSection_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NewsletterRun"("id") ON DELETE CASCADE
);
CREATE INDEX "NewsletterSection_runId_type_idx" ON "NewsletterSection"("runId", "type");

CREATE TABLE "NewsletterDraft" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL UNIQUE,
  "markdown" TEXT NOT NULL,
  "html" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "NewsletterDraft_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NewsletterRun"("id") ON DELETE CASCADE
);

CREATE TABLE "PublishLog" (
  "id" TEXT PRIMARY KEY,
  "runId" TEXT NOT NULL,
  "target" TEXT NOT NULL,
  "requestPayload" JSONB NOT NULL,
  "responseStatus" INTEGER,
  "responseBody" TEXT,
  "success" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PublishLog_runId_fkey" FOREIGN KEY ("runId") REFERENCES "NewsletterRun"("id") ON DELETE CASCADE
);
