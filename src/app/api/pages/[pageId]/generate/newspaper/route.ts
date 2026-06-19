import type { PageSettings } from '@/db/schema';
import { NEWSPAPER_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { generateProfileMode } from '@/lib/generate-mode';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  return generateProfileMode(req, pageId, {
    mode: 'newspaper',
    enabledLabel: 'Newspaper',
    isEnabled: (page) => Boolean(page.newspaperEnabled),
    buildSystemPrompt: (page) => {
      const settings = (page.pageSettings as PageSettings | null)?.newspaper;
      let systemPrompt = NEWSPAPER_SYSTEM_PROMPT;
      const promptAdditions: string[] = [];

      if (settings?.name) {
        promptAdditions.push(
          `Use "${settings.name}" as the newspaper masthead name instead of generating one.`,
        );
      }
      if (settings?.tone && settings.tone !== 'Prestigious') {
        promptAdditions.push(`Write in a "${settings.tone}" newspaper tone. ${
          settings.tone === 'Tabloid'
            ? 'Use sensational headlines, exclamation marks, and dramatic language like a tabloid paper.'
            : settings.tone === 'Local'
              ? 'Write in a warm, community-focused local newspaper style. Make it feel homey and personal.'
              : ''
        }`);
      }

      if (promptAdditions.length > 0) {
        systemPrompt += '\n\nIMPORTANT: ' + promptAdditions.join(' ');
      }
      return systemPrompt;
    },
    buildPrompt: (memoryContext) =>
      `Write a newspaper front page about this person using this source desk:\n\n${memoryContext}`,
  });
}
