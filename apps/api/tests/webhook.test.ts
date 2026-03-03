import request from 'supertest';
import { beforeEach, describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://x';
process.env.INBOUND_WEBHOOK_SECRET = 'secret';

const upsert = vi.fn();
const create = vi.fn();

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    post: { upsert },
    newsletterRun: { create }
  }
}));

describe('webhook endpoint', () => {
  beforeEach(() => {
    upsert.mockResolvedValue({ id: 'p1' });
    create.mockResolvedValue({ id: 'run_1' });
  });

  it('rejects invalid secret', async () => {
    const { createApp } = await import('../src/app.js');
    const res = await request(createApp()).post('/api/webhooks/zapier/facebook-posts').send({});
    expect(res.status).toBe(401);
  });

  it('imports posts and creates run', async () => {
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

    expect(res.status).toBe(201);
    expect(res.body.data.importedCount).toBe(1);
    expect(upsert).toHaveBeenCalled();
    expect(create).toHaveBeenCalled();
  });
});
