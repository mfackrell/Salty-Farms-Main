import request from 'supertest';
import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://x';
process.env.INBOUND_WEBHOOK_SECRET = 'secret';

const tx = {
  runPostSelection: { deleteMany: vi.fn(), createMany: vi.fn() },
  newsletterRun: { findUnique: vi.fn(), update: vi.fn() }
};

vi.mock('../src/lib/prisma.js', () => ({
  prisma: {
    $transaction: async (cb: (arg: typeof tx) => Promise<void>) => cb(tx),
    newsletterRun: { findMany: vi.fn(), findUnique: vi.fn() },
    post: { findMany: vi.fn() },
    newsletterDraft: { upsert: vi.fn(), findUnique: vi.fn() }
  }
}));

describe('selection endpoint', () => {
  it('replaces selection and sets selecting status', async () => {
    tx.newsletterRun.findUnique.mockResolvedValue({ status: 'RECEIVED' });
    const { createApp } = await import('../src/app.js');

    const res = await request(createApp())
      .put('/api/runs/run_1/selection')
      .send({ postIds: ['p1', 'p2'] });

    expect(res.status).toBe(200);
    expect(tx.runPostSelection.deleteMany).toHaveBeenCalled();
    expect(tx.runPostSelection.createMany).toHaveBeenCalled();
    expect(tx.newsletterRun.update).toHaveBeenCalledWith({ where: { id: 'run_1' }, data: { status: 'SELECTING' } });
  });
});
