import { ComponentsStorybook } from '@/components/dashboard/components-storybook';

export default function ComponentsStorybookPage() {
  return (
    <div className="mx-auto max-w-4xl px-2 py-8 sm:py-10">
      <header className="mb-8">
        <p className="text-[11px] font-medium uppercase tracking-[0.22em] text-karte-accent">
          ◆ Generative UI catalog
        </p>
        <h1 className="mt-3 text-3xl font-semibold tracking-[-0.02em] text-karte-text">
          Components the AI can pick
        </h1>
        <p className="mt-3 max-w-2xl text-[14.5px] leading-[1.6] text-karte-text-3">
          When a visitor chats with your page, the AI returns a structured
          response — prose plus zero or more of these components, picked from a
          closed catalog. Each card below is a live render with sample data so
          you can see exactly what shows up.
        </p>
        <p className="mt-2 max-w-2xl text-[13px] leading-[1.55] text-karte-text-4">
          Components inherit your page&rsquo;s accent color via CSS variables.
          The gold-foil treatment is the default; profiles with other accents
          (cyan, purple) render the same shapes in their own tint.
        </p>
      </header>

      <ComponentsStorybook />
    </div>
  );
}
