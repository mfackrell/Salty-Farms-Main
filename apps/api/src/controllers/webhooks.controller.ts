import { Request, Response } from 'express';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { facebookWebhookSchema } from '../schemas/newsletter.schemas.js';
import { GenerationService } from '../services/generation.service.js';
import { ok } from '../types/api.js';
import { logger } from '../lib/logger.js';

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

  void generationService.generateForRun(run.id).catch((error) => {
    logger.error({ error, runId: run.id }, 'Background generation failed after webhook ingestion');
    void prisma.newsletterRun
      .update({
        where: { id: run.id },
        data: { status: 'FAILED', errorMessage: error instanceof Error ? error.message : 'Unknown generation error' }
      })
      .catch((updateError) => {
        logger.error({ error: updateError, runId: run.id }, 'Failed to persist generation failure status');
      });
  });

  return res.status(202).json(ok({
    runId: run.id,
    importedCount: posts.length,
    status: 'GENERATING'
  }));
}
