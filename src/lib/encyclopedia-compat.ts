import type { EncyclopediaContent } from './generated-page-types';

/**
 * Old encyclopedia format (before Novel editor migration).
 * Kept for backwards compatibility with existing DB records.
 */
interface LegacyEncyclopediaContent {
  leadParagraph: string;
  infobox: Record<string, string>;
  sections: { heading: string; content: string }[];
  categories: string[];
}

function isLegacyFormat(
  content: unknown,
): content is LegacyEncyclopediaContent {
  return (
    typeof content === 'object' &&
    content !== null &&
    'leadParagraph' in content &&
    'sections' in content &&
    !('markdown' in content)
  );
}

/**
 * Convert legacy encyclopedia content (leadParagraph + sections[])
 * to the new format (markdown as HTML string + infobox + categories).
 */
function convertLegacyToNew(
  legacy: LegacyEncyclopediaContent,
): EncyclopediaContent {
  const parts: string[] = [];

  // Lead paragraph
  if (legacy.leadParagraph) {
    parts.push(`<p>${escapeHtml(legacy.leadParagraph)}</p>`);
  }

  // Sections
  for (const section of legacy.sections) {
    if (section.heading) {
      parts.push(`<h2>${escapeHtml(section.heading)}</h2>`);
    }
    if (section.content) {
      // Split on double newlines to create paragraphs
      const paragraphs = section.content.split(/\n\n+/).filter(Boolean);
      for (const p of paragraphs) {
        parts.push(`<p>${escapeHtml(p)}</p>`);
      }
    }
  }

  return {
    markdown: parts.join('\n'),
    infobox: legacy.infobox,
    categories: legacy.categories,
  };
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Normalize any encyclopedia content to the current format.
 * If the content is in the legacy format, convert it automatically.
 */
export function normalizeEncyclopediaContent(
  content: unknown,
): EncyclopediaContent | null {
  if (!content || typeof content !== 'object') return null;

  if (isLegacyFormat(content)) {
    return convertLegacyToNew(content);
  }

  // Already in new format
  if ('markdown' in content) {
    return content as EncyclopediaContent;
  }

  return null;
}
