import OpenAI from 'openai';
import { env } from '../config/env.js';

export const promptBuilders = {
  generateArticleFromPost: (post: { message: string; permalink?: string | null }) =>
    `Write a short newsletter article in Markdown from this post.\nPost: ${post.message}\nLink: ${post.permalink ?? 'N/A'}\nRules: warm church/community tone, no fabricated claims, if uncertain say details forthcoming.`,
  generateMonthlyHighlights: (posts: string[]) =>
    `Create Markdown monthly highlights from these posts:\n${posts.join('\n- ')}`,
  generateScripture: (month: string) =>
    `Suggest one scripture section in Markdown for month ${month}, with brief reflection and prayer.` ,
  generateCurrentNeeds: (posts: string[]) =>
    `Extract current needs in Markdown list from posts. If sparse, say details forthcoming.\n${posts.join('\n- ')}`,
  generateUpcomingEvents: (posts: string[]) =>
    `Extract upcoming events in Markdown from posts. Use generic placeholders if unclear and mark details forthcoming.\n${posts.join('\n- ')}`,
  generateVolunteerSpotlight: (posts: string[]) =>
    `Create a volunteer spotlight in Markdown from posts. If no names, keep generic.\n${posts.join('\n- ')}`,
  aggregateNewsletter: (input: { month: string; sections: Record<string, string>; styleGuide: string }) =>
    `Aggregate these Markdown sections into one cohesive newsletter for ${input.month}.\nStyle: ${input.styleGuide}.\nMust include: Title, Opening note, Highlights, Stories/Articles, Scripture, Current needs, Upcoming events, Volunteer spotlight, Closing.\nKeep 600-1200 words unless sparse.\nSections:\n${JSON.stringify(
      input.sections,
      null,
      2
    )}`
};

export class OpenAiService {
  private client = new OpenAI({ apiKey: env.OPENAI_API_KEY });

  async generateMarkdown(prompt: string, temperature: number): Promise<string> {
    const maxAttempts = 3;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const response = await this.client.chat.completions.create({
          model: env.OPENAI_MODEL,
          temperature,
          messages: [
            { role: 'system', content: 'Return Markdown only. Do not fabricate claims not inferable from input.' },
            { role: 'user', content: prompt }
          ]
        });

        return response.choices[0]?.message.content ?? '';
      } catch (error) {
        lastError = error;
        if (attempt < maxAttempts) {
          await new Promise((resolve) => setTimeout(resolve, 300 * 2 ** attempt));
        }
      }
    }

    throw lastError;
  }
}
