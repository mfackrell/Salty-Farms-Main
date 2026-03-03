import { describe, expect, it } from 'vitest';
import { markdownToSanitizedHtml } from '../src/services/markdown.service.js';

describe('markdown sanitization', () => {
  it('strips script tags', () => {
    const html = markdownToSanitizedHtml('# Test\n<script>alert(1)</script>');
    expect(html).not.toContain('<script>');
  });
});
