import { SectionType } from '@prisma/client';
import { prisma } from '../lib/prisma.js';
import { AppError } from '../types/api.js';
import { OpenAiService, promptBuilders } from './openai.service.js';

export class GenerationService {
  constructor(private openai = new OpenAiService()) {}

  async generateForRun(runId: string) {
    const run = await prisma.newsletterRun.findUnique({
      where: { id: runId },
      include: { selections: { include: { post: true } } }
    });

    if (!run) throw new AppError('NOT_FOUND', 'Run not found', 404);
    const posts = run.selections.map((s) => s.post);
    if (posts.length === 0) throw new AppError('INVALID_SELECTION', 'Select at least one post');

    await prisma.newsletterRun.update({ where: { id: runId }, data: { status: 'GENERATING', errorMessage: null } });

    const articleOutputs = await Promise.all(
      posts.map((post) =>
        this.openai.generateMarkdown(promptBuilders.generateArticleFromPost(post), 0.4)
      )
    );
    const textPosts = posts.map((p) => p.message);

    const sections = [
      { type: SectionType.HIGHLIGHTS, content: await this.openai.generateMarkdown(promptBuilders.generateMonthlyHighlights(textPosts), 0.4), order: 1 },
      { type: SectionType.SCRIPTURE, content: await this.openai.generateMarkdown(promptBuilders.generateScripture(run.month), 0.4), order: 2 },
      { type: SectionType.CURRENT_NEEDS, content: await this.openai.generateMarkdown(promptBuilders.generateCurrentNeeds(textPosts), 0.4), order: 3 },
      { type: SectionType.UPCOMING_EVENTS, content: await this.openai.generateMarkdown(promptBuilders.generateUpcomingEvents(textPosts), 0.4), order: 4 },
      { type: SectionType.VOLUNTEER_SPOTLIGHT, content: await this.openai.generateMarkdown(promptBuilders.generateVolunteerSpotlight(textPosts), 0.4), order: 5 }
    ];

    await prisma.newsletterSection.deleteMany({ where: { runId } });
    await prisma.newsletterSection.createMany({
      data: [
        ...articleOutputs.map((content, idx) => ({ runId, type: SectionType.ARTICLE, contentMarkdown: content, sortOrder: idx })),
        ...sections.map((s) => ({ runId, type: s.type, contentMarkdown: s.content, sortOrder: s.order }))
      ]
    });

    const aggregateInput: Record<string, string> = {
      articles: articleOutputs.join('\n\n'),
      highlights: sections[0].content,
      scripture: sections[1].content,
      currentNeeds: sections[2].content,
      upcomingEvents: sections[3].content,
      volunteerSpotlight: sections[4].content
    };

    const draftMarkdown = await this.openai.generateMarkdown(
      promptBuilders.aggregateNewsletter({
        sections: aggregateInput,
        month: run.month,
        styleGuide: 'Warm, concise, hopeful, community-focused'
      }),
      0.6
    );

    await prisma.newsletterSection.create({
      data: { runId, type: SectionType.AGGREGATED_DRAFT, contentMarkdown: draftMarkdown, sortOrder: 99 }
    });

    const draft = await prisma.newsletterDraft.upsert({
      where: { runId },
      update: { markdown: draftMarkdown },
      create: { runId, markdown: draftMarkdown }
    });

    await prisma.newsletterRun.update({ where: { id: runId }, data: { status: 'DRAFT_READY' } });
    const finalSections = await prisma.newsletterSection.findMany({ where: { runId }, orderBy: { sortOrder: 'asc' } });

    return { draft, sections: finalSections };
  }
}
