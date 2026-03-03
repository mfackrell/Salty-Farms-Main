import { OpenAI } from 'openai';
import { env } from '../config/env.js';

const markdownOnlyRule = 'Return Markdown only.';
const noHallucinationRule = 'Only use details inferable from the provided content. If information is missing, state that details are forthcoming.';
const editorRole = 'You are a professional church newsletter editor.';

export const promptBuilders = {
  generateArticleFromPost: (post: { message: string; permalink?: string | null }) =>
    `${editorRole}\nTask: Write one short article from a single source post.\nFormat constraints: ${markdownOnlyRule}\nSafety constraints: ${noHallucinationRule}\nSource post:\n- Message: ${post.message}\n- Link: ${post.permalink ?? 'N/A'}`,
  generateMonthlyHighlights: (posts: string[]) =>
    `${editorRole}\nTask: Create monthly highlights from source posts.\nFormat constraints: ${markdownOnlyRule}\nSafety constraints: ${noHallucinationRule}\nSource posts:\n${posts.join('\n- ')}`,
  generateScripture: (month: string) =>
    `${editorRole}\nTask: Suggest one scripture section for month ${month} with a brief reflection and prayer.\nFormat constraints: ${markdownOnlyRule}`,
  generateCurrentNeeds: (posts: string[]) =>
    `${editorRole}\nTask: Extract current needs as a Markdown list.\nFormat constraints: ${markdownOnlyRule}\nSafety constraints: ${noHallucinationRule}\nSource posts:\n${posts.join('\n- ')}`,
  generateUpcomingEvents: (posts: string[]) =>
    `${editorRole}\nTask: Extract upcoming events in Markdown.\nFormat constraints: ${markdownOnlyRule}\nSafety constraints: ${noHallucinationRule}\nSource posts:\n${posts.join('\n- ')}`,
  generateVolunteerSpotlight: (posts: string[]) =>
    `${editorRole}\nTask: Create a volunteer spotlight in Markdown from source posts.\nFormat constraints: ${markdownOnlyRule}\nSafety constraints: ${noHallucinationRule}\nSource posts:\n${posts.join('\n- ')}`,
  aggregateNewsletter: (input: { month: string; sections: Record<string, string>; styleGuide: string }) =>
    `${editorRole}\nTask: Assemble a final newsletter for ${input.month}.\nFormat constraints: ${markdownOnlyRule}\nStyle: ${input.styleGuide}.\nProcess:\n1. Preserve facts from source sections without adding new claims.\n2. Smooth transitions and consistent tone.\n3. Output one complete newsletter containing: Title, Opening note, Highlights, Stories/Articles, Scripture, Current needs, Upcoming events, Volunteer spotlight, Closing.\nSource sections:\n${JSON.stringify(
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
            { role: 'system', content: `${editorRole} ${markdownOnlyRule} ${noHallucinationRule}` },
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
