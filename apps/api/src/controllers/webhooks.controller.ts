import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { facebookWebhookSchema } from '../schemas/newsletter.schemas.js';
import { GenerationService } from '../services/generation.service.js';
import { ok } from '../types/api.js';

const generationService = new GenerationService();

export async function ingestFacebookPosts(req: Request, res: Response) {
  const secret = req.header('x-webhook-secret');
  if (secret !== env.INBOUND_WEBHOOK_SECRET) {
    return res.status(401).json({ data: null, error: { code: 'UNAUTHORIZED', message: 'Invalid webhook secret' } });
  }

  const body = facebookWebhookSchema.parse(req.body);

  const posts = await Promise.all(
    body.posts.map((post) =>
      prisma.post.upsert({
        where: { externalPostId: post.externalPostId },
        update: {
          message: post.message,
          postedAt: new Date(post.postedAt),
          permalink: post.permalink,
          mediaUrl: post.mediaUrl
        },
        create: {
          externalPostId: post.externalPostId,
          message: post.message,
          postedAt: new Date(post.postedAt),
          permalink: post.permalink,
          mediaUrl: post.mediaUrl
        }
      })
    )
  );

  const run = await prisma.newsletterRun.create({
    data: { month: body.month, status: 'RECEIVED' }
  });

  if (posts.length === 0) {
    return res.status(201).json(ok({ runId: run.id, importedCount: 0 }));
  }

  await prisma.runPostSelection.createMany({
    data: posts.map((post) => ({ runId: run.id, postId: post.id }))
  });

  const generated = await generationService.generateForRun(run.id);

  return res.status(201).json(ok({
    runId: run.id,
    importedCount: posts.length,
    draftId: generated.draft.id,
    sectionCount: generated.sections.length
  }));
}
