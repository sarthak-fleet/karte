import type { PageSettings } from '@/db/schema';
import { ENCYCLOPEDIA_SYSTEM_PROMPT } from '@/lib/ai-prompts';
import { generateProfileMode } from '@/lib/generate-mode';

export async function POST(
  req: Request,
  { params }: { params: Promise<{ pageId: string }> },
) {
  const { pageId } = await params;
  return generateProfileMode(req, pageId, {
    mode: 'encyclopedia',
    enabledLabel: 'Encyclopedia',
    isEnabled: (page) => Boolean(page.encyclopediaEnabled),
    buildSystemPrompt: (page) => {
      const settings = (page.pageSettings as PageSettings | null)?.encyclopedia;
      let systemPrompt = ENCYCLOPEDIA_SYSTEM_PROMPT;
      if (settings?.style && settings.style !== 'Formal Wikipedia') {
        systemPrompt += `\n\nIMPORTANT: Write in a "${settings.style}" style. ${
          settings.style === 'Casual'
            ? 'Use a conversational, relaxed tone. Less formal than Wikipedia — more like an entertaining blog post in encyclopedia format.'
            : settings.style === 'Academic'
              ? 'Use rigorous academic language with proper citations-style references, formal analysis, and scholarly framing.'
              : ''
        }`;
      }
      return systemPrompt;
    },
    buildPrompt: (memoryContext) =>
      `Write a Wikipedia-style encyclopedia article about this person using this source file:\n\n${memoryContext}`,
    onError: (error) => {
      console.error('Failed to generate encyclopedia', {
        message: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : undefined,
        responseBody:
          typeof error === 'object' && error && 'responseBody' in error
            ? (error as { responseBody?: unknown }).responseBody
            : undefined,
        cause:
          error instanceof Error && error.cause instanceof Error
            ? { name: error.cause.name, message: error.cause.message }
            : undefined,
      });
    },
  });
}
