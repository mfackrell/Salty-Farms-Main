import { RunStatus } from '@prisma/client';
import { Request, Response } from 'express';
import { prisma } from '../lib/prisma.js';
import { promptBuilders, OpenAiService } from '../services/openai.service.js';
import { ok } from '../types/api.js';

function getMonthRange(month: string) {
  const [yearStr, monthStr] = month.split('-');
  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const start = new Date(Date.UTC(year, monthIndex, 1));
  const end = new Date(Date.UTC(year, monthIndex + 1, 1));

  return { start, end };
}

export async function generateNewsletter(req: Request, res: Response) {
  try {
    const month = String(req.body?.month ?? '').trim();
    console.log('🚀 [GENERATE] Request received for month:', month);

    if (!/^\d{4}-\d{2}$/.test(month)) {
      return res.status(400).json({ error: 'month must match YYYY-MM format' });
    }

    const run = await prisma.newsletterRun.create({
      data: { month, status: RunStatus.GENERATING }
    });
    console.log(`[DB] Created NewsletterRun ${run.id}`);

    const { start, end } = getMonthRange(month);
    console.log('🔍 [DB] Searching for posts containing month:', month);

    const posts = await prisma.post.findMany({
      where: {
        postedAt: {
          gte: start,
          lt: end
        }
      },
      orderBy: { postedAt: 'asc' }
    });

    console.log('📊 [DB] Found ' + posts.length + ' posts.');

    if (posts.length === 0) {
      console.error(`[ERROR] No posts found for ${month}`);
      return res.status(400).json({ error: `No posts found for ${month}` });
    }

    const openAiService = new OpenAiService();
    let draftContent = '';

    try {
      console.log('🤖 [AI] Sending posts to LLM...');
      draftContent = await openAiService.generateMarkdown(
        promptBuilders.aggregateNewsletter({
          month,
          styleGuide: 'Warm, concise, hopeful, community-focused',
          sections: {
            sourcePosts: posts.map((post) => `${post.postedAt.toISOString()}: ${post.message}`).join('\n')
          }
        }),
        0.6
      );
    } catch (error) {
      console.error('❌ [AI ERROR] LLM call failed:', error);
      throw error;
    }

    console.log(`[AI] Draft content length=${draftContent.length}`);
    console.log('📝 [DRAFT] Saving draft. Content length:', draftContent?.length);

    const draft = await prisma.newsletterDraft.create({
      data: {
        runId: run.id,
        markdown: draftContent
      }
    });

    console.log(`[DB] Created NewsletterDraft ${draft.id}`);

    console.log('✅ [RUN] Updating NewsletterRun status to DRAFT_READY');
    await prisma.newsletterRun.update({
      where: { id: run.id },
      data: { status: RunStatus.COMPLETED }
    });

    return res.status(201).json(ok({ runId: run.id, draftId: draft.id }));
  } catch (error) {
    console.error('💥 [FATAL] Newsletter generation crashed:', error);
    return res.status(500).json({ error: 'Failed to generate newsletter' });
  }
}
