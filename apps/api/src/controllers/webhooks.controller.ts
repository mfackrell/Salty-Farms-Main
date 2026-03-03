import { Request, Response } from 'express';
import { RunStatus } from '@prisma/client';
import { env } from '../config/env.js';
import { prisma } from '../lib/prisma.js';
import { facebookWebhookSchema } from '../schemas/newsletter.schemas.js';
import { AppError, ok } from '../types/api.js';

export async function ingestFacebookPosts(req: Request, res: Response) {
  const secret = req.header('x-webhook-secret');
  if (secret !== env.INBOUND_WEBHOOK_SECRET) {
    throw new AppError('UNAUTHORIZED', 'Invalid webhook secret', 401);
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
    data: { month: body.month, status: RunStatus.RECEIVED }
  });

  return res.status(201).json(ok({ runId: run.id, importedCount: posts.length }));
}
