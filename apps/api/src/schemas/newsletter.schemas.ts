import { z } from 'zod';

export const facebookWebhookSchema = z.object({
  source: z.literal('facebook'),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  posts: z.array(
    z.object({
      externalPostId: z.string().min(1),
      message: z.string().min(1),
      postedAt: z.string().datetime(),
      permalink: z.string().url().optional(),
      mediaUrl: z.string().url().optional()
    })
  )
});

export const selectionSchema = z.object({
  postIds: z.array(z.string().min(1))
});

export const draftPatchSchema = z.object({
  markdown: z.string().min(1)
});
