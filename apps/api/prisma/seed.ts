import { PrismaClient, RunStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const posts = await Promise.all(
    [
      {
        externalPostId: 'fb_seed_1',
        message: 'Community food drive launch with 80 families served.',
        postedAt: new Date('2026-03-01T10:00:00Z')
      },
      {
        externalPostId: 'fb_seed_2',
        message: 'Youth group volunteer day at the garden beds.',
        postedAt: new Date('2026-03-10T13:30:00Z')
      }
    ].map((post) =>
      prisma.post.upsert({
        where: { externalPostId: post.externalPostId },
        update: post,
        create: post
      })
    )
  );

  const run = await prisma.newsletterRun.create({
    data: {
      month: '2026-03',
      status: RunStatus.SELECTING
    }
  });

  await prisma.runPostSelection.createMany({
    data: posts.map((post) => ({ runId: run.id, postId: post.id }))
  });
}

main().finally(async () => {
  await prisma.$disconnect();
});
