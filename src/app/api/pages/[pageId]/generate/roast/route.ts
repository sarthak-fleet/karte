import type { PageSettings } from '@/db/schema';
import { ROAST_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { generateProfileMode } from '@/lib/generate-mode';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  return generateProfileMode(req, pageId, {
    mode: 'roast',
    enabledLabel: 'Roast',
    isEnabled: (page) => Boolean(page.roastEnabled),
    buildSystemPrompt: (page) => {
      const settings = (page.pageSettings as PageSettings | null)?.roast;
      let systemPrompt = ROAST_SYSTEM_PROMPT;
      if (settings?.tone && settings.tone !== 'Savage') {
        systemPrompt += `\n\nIMPORTANT: Write the roast in a "${settings.tone}" tone. ${
          settings.tone === 'Friendly'
            ? 'Keep it light-hearted and good-natured. Tease rather than roast.'
            : settings.tone === 'Sarcastic'
              ? 'Be dripping with sarcasm and irony. Use dry wit and deadpan humor.'
              : ''
        }`;
      }
      return systemPrompt;
    },
    buildPrompt: (memoryContext) =>
      `Roast this person based on this profile research packet:\n\n${memoryContext}`,
  });
}
