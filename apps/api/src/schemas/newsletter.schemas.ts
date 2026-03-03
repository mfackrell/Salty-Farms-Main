import { z } from 'zod';

export const facebookPostSchema = z.object({
  externalPostId: z.string(),
  message: z.string(),
  postedAt: z.string(),
  permalink: z.string().optional().nullable(),
  mediaUrl: z.string().optional().nullable()
});

export const facebookWebhookSchema = z.object({
  source: z.literal('facebook'),
  month: z.string().regex(/^\d{4}-\d{2}$/),
  posts: z.array(facebookPostSchema)
});

export const selectionSchema = z.object({
  postIds: z.array(z.string().min(1))
});

export const draftPatchSchema = z.object({
  markdown: z.string().min(1)
});
