import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://x';
process.env.INBOUND_WEBHOOK_SECRET = 'secret';

vi.mock('../src/services/generation.service.js', () => ({
  GenerationService: class {
    async generateForRun() {
      return {
        draft: { markdown: '# Draft' },
        sections: [{ type: 'HIGHLIGHTS', contentMarkdown: 'hello' }]
      };
    }
  }
}));

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    newsletterRun: { findMany: vi.fn(), findUnique: vi.fn() },
    post: { findMany: vi.fn() },
    $transaction: vi.fn(),
    newsletterDraft: { upsert: vi.fn(), findUnique: vi.fn() }
  }
}));

describe('generate endpoint', () => {
  it('queues background generation and returns accepted status', async () => {
    const { createApp } = await import('../src/app.js');
    const res = await request(createApp()).post('/api/runs/run_1/generate').send({});
    expect(res.status).toBe(202);
    expect(res.body.data.status).toBe('GENERATING');
  });
});
