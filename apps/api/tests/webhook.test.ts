import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://x';
process.env.INBOUND_WEBHOOK_SECRET = 'secret';

const upsert = vi.fn();
const create = vi.fn();
const createMany = vi.fn();
const generateForRun = vi.fn();

vi.mock('../src/services/generation.service.js', () => ({
  GenerationService: class {
    async generateForRun(runId: string) {
      return generateForRun(runId);
    }
  }
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    post: { upsert },
    newsletterRun: { create },
    runPostSelection: { createMany }
  }
}));

describe('webhook endpoint', () => {
  beforeEach(() => {
    upsert.mockResolvedValue({ id: 'p1' });
    create.mockResolvedValue({ id: 'run_1' });
    createMany.mockResolvedValue({ count: 1 });
    generateForRun.mockResolvedValue({
      draft: { id: 'draft_1', markdown: '# Draft' },
      sections: [{ id: 's1' }, { id: 's2' }]
    });
  });

  it('rejects invalid secret', async () => {
    const { createApp } = await import('../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/zapier/facebook-posts').send({});
    expect(res.status).toBe(401);
  });

  it('imports posts, persists selections, and queues background generation', async () => {
    const { createApp } = await import('../src/app.js');
    const res = await request(createApp())
      .post('/api/webhooks/zapier/facebook-posts')
      .set('x-webhook-secret', 'secret')
      .send({
        source: 'facebook',
        month: '2026-03',
        posts: [
          {
            externalPostId: 'fb_1',
            message: 'A',
            postedAt: '2026-03-01T10:00:00Z'
          }
        ]
      });

    expect(res.status).toBe(202);
    expect(res.body.data.importedCount).toBe(1);
    expect(res.body.data.status).toBe('GENERATING');
    expect(createMany).toHaveBeenCalledWith({ data: [{ runId: 'run_1', postId: 'p1' }] });
    expect(generateForRun).toHaveBeenCalledWith('run_1');
  });
});
