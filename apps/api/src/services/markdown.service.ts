import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function markdownToSanitizedHtml(markdown: string): string {
  const html = marked.parse(markdown) as string;
  return sanitizeHtml(html, {
    allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2', 'h3']),
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      img: ['src', 'alt']
    }
  });
}
