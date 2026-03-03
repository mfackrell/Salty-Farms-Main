import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { ok } from '../types/api.js';
import { draftPatchSchema, selectionSchema } from '../schemas/newsletter.schemas.js';
import { GenerationService } from '../services/generation.service.js';
import { markdownToSanitizedHtml } from '../services/markdown.service.js';
import { PublishService } from '../services/publish.service.js';

const generationService = new GenerationService();
const publishService = new PublishService();

export async function listRuns(_req: Request, res: Response) {
  const runs = await prisma.newsletterRun.findMany({
    orderBy: { createdAt: 'desc' },
    take: 20
  });
  return res.json(ok(runs));
}

export async function getRun(req: Request, res: Response) {
  const run = await prisma.newsletterRun.findUnique({
    where: { id: req.params.runId },
    include: {
      selections: { include: { post: true } },
      sections: { orderBy: { sortOrder: 'asc' } },
      draft: true
    }
  });
  const posts = await prisma.post.findMany({ orderBy: { postedAt: 'desc' } });
  return res.json(ok({ run, posts }));
}

export async function updateSelection(req: Request, res: Response) {
  const body = selectionSchema.parse(req.body);
  const runId = req.params.runId;

  await prisma.$transaction(async (tx) => {
    await tx.runPostSelection.deleteMany({ where: { runId } });
    if (body.postIds.length) {
      await tx.runPostSelection.createMany({
        data: body.postIds.map((postId) => ({ runId, postId }))
      });
    }
    const run = await tx.newsletterRun.findUnique({ where: { id: runId } });
    if (run && run.status !== 'PUBLISHED') {
      await tx.newsletterRun.update({ where: { id: runId }, data: { status: 'SELECTING' } });
    }
  });

  return res.json(ok({ runId, postIds: body.postIds }));
}

export async function generateRun(req: Request, res: Response) {
  const result = await generationService.generateForRun(req.params.runId);
  return res.json(ok(result));
}

export async function patchDraft(req: Request, res: Response) {
  const body = draftPatchSchema.parse(req.body);
  const draft = await prisma.newsletterDraft.upsert({
    where: { runId: req.params.runId },
    update: { markdown: body.markdown },
    create: { runId: req.params.runId, markdown: body.markdown }
  });
  return res.json(ok(draft));
}

export async function previewHtml(req: Request, res: Response) {
  const draft = await prisma.newsletterDraft.findUnique({ where: { runId: req.params.runId } });
  const html = markdownToSanitizedHtml(draft?.markdown ?? '');
  return res.json(ok({ html }));
}

export async function publishRun(req: Request, res: Response) {
  const published = await publishService.publish(req.params.runId);
  return res.json(ok(published));
}
