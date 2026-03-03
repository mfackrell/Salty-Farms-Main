import axios from 'axios';
import { prisma } from '../lib/prisma.js';
import { env } from '../config/env.js';
import { AppError } from '../types/api.js';
import { markdownToSanitizedHtml } from './markdown.service.js';

export class PublishService {
  async publish(runId: string) {
    const run = await prisma.newsletterRun.findUnique({ where: { id: runId }, include: { draft: true } });
    if (!run || !run.draft) throw new AppError('NOT_FOUND', 'Run or draft not found', 404);
    if (!env.OUTBOUND_ZAPIER_WEBHOOK_URL) throw new AppError('CONFIG_ERROR', 'Missing outbound webhook URL', 500);

    const html = markdownToSanitizedHtml(run.draft.markdown);
    const subject = `Monthly Newsletter - ${new Date(`${run.month}-01`).toLocaleString('en-US', { month: 'long', year: 'numeric' })}`;
    const payload = {
      runId,
      month: run.month,
      subject,
      html,
      metadata: { source: 'ai-newsletter-builder' }
    };

    try {
      const response = await axios.post(env.OUTBOUND_ZAPIER_WEBHOOK_URL, payload);
      await prisma.publishLog.create({
        data: {
          runId,
          target: 'zapier',
          requestPayload: payload,
          responseStatus: response.status,
          responseBody: JSON.stringify(response.data),
          success: true
        }
      });
      await prisma.newsletterRun.update({ where: { id: runId }, data: { status: 'PUBLISHED', errorMessage: null } });
      await prisma.newsletterDraft.update({ where: { runId }, data: { html } });
      return { success: true };
    } catch (error) {
      const status = axios.isAxiosError(error) ? error.response?.status ?? null : null;
      const body = axios.isAxiosError(error) ? JSON.stringify(error.response?.data ?? {}) : String(error);
      await prisma.publishLog.create({
        data: {
          runId,
          target: 'zapier',
          requestPayload: payload,
          responseStatus: status,
          responseBody: body,
          success: false
        }
      });
      await prisma.newsletterRun.update({ where: { id: runId }, data: { status: 'FAILED', errorMessage: body.slice(0, 500) } });
      throw new AppError('PUBLISH_FAILED', 'Failed to publish newsletter', 502);
    }
  }
}
