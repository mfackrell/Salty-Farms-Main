import { describe, expect, it, vi } from 'vitest';

process.env.DATABASE_URL = 'postgresql://x';
process.env.INBOUND_WEBHOOK_SECRET = 'secret';
process.env.OUTBOUND_ZAPIER_WEBHOOK_URL = 'https://zapier.test/hook';

const axiosPost = vi.fn();
vi.mock('axios', () => ({
  default: { post: axiosPost, isAxiosError: () => true }
}));

const prismaMock = {
  newsletterRun: { findUnique: vi.fn(), update: vi.fn() },
  publishLog: { create: vi.fn() },
  newsletterDraft: { update: vi.fn() }
};
vi.mock('../src/lib/prisma.js', () => ({ prisma: prismaMock }));

describe('publish service', () => {
  it('posts HTML and logs success', async () => {
    prismaMock.newsletterRun.findUnique.mockResolvedValue({
      id: 'run_1',
      month: '2026-03',
      draft: { markdown: '# Hello' }
    });
    axiosPost.mockResolvedValue({ status: 200, data: { ok: true } });

    const { PublishService } = await import('../src/services/publish.service.js');
    const service = new PublishService();
    const result = await service.publish('run_1');

    expect(result.success).toBe(true);
    expect(prismaMock.publishLog.create).toHaveBeenCalled();
    expect(axiosPost).toHaveBeenCalled();
  });
});
