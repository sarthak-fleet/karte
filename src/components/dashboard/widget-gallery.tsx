'use client';

import { useState } from 'react';

import {
  Badge,
  Button,
  FormField,
  Input,
  Label,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import { linkCardVariants } from '@/components/public/widgets';

// One row in the gallery: heading + 1-line desc on the left, live preview
// of the widget on the right. Self-contained so we can drop new sections
// in without restructuring the page.
function GalleryRow({
  id,
  name,
  description,
  meta,
  children,
}: {
  id: string;
  name: string;
  description: string;
  meta?: ReadonlyArray<string>;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr] lg:gap-10">
      <div>
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
          {id}
        </p>
        <h3 className="mt-1.5 text-[15px] font-semibold tracking-[-0.005em] text-karte-text">
          {name}
        </h3>
        <p className="mt-2 text-[13px] leading-[1.55] text-karte-text-3">
          {description}
        </p>
        {meta && meta.length > 0 && (
          <ul className="mt-3 space-y-1">
            {meta.map((line) => (
              <li
                key={line}
                className="font-mono text-[11px] text-karte-text-4"
              >
                {line}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="rounded-2xl bg-white/[0.02] p-6">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h2 className="mb-6 text-[11px] font-medium uppercase tracking-[0.24em] text-karte-text-2">
      {children}
    </h2>
  );
}

function ColumnHeader({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-2 font-mono text-[10px] uppercase tracking-[0.2em] text-karte-text-4">
      {children}
    </p>
  );
}

export function WidgetGallery() {
  const [toggle1, setToggle1] = useState(true);
  const [toggle2, setToggle2] = useState(false);

  const previewLink = {
    id: 'preview',
    title: 'Read the latest essay',
    url: 'https://example.com',
    icon: '✍️',
    imageUrl: null,
    body: 'A short, one-line description that adds context the title can’t carry.',
  };

  return (
    <div className="space-y-16">
      {/* ── INPUTS ───────────────────────────────────────────── */}
      <section>
        <SectionTitle>Inputs</SectionTitle>
        <div className="space-y-10">
          <GalleryRow
            id="ui.Input"
            name="Text input"
            description="Single-line text. Used for slugs, titles, URLs, names."
            meta={['props: ComponentPropsWithoutRef<input>']}
          >
            <FormField label="Display name" htmlFor="demo-input">
              <Input
                id="demo-input"
                placeholder="e.g. Sarthak Agrawal"
                defaultValue=""
              />
            </FormField>
          </GalleryRow>

          <GalleryRow
            id="ui.Textarea"
            name="Multi-line textarea"
            description="Long-form content. Bio, system prompt, message body."
            meta={['props: ComponentPropsWithoutRef<textarea>']}
          >
            <FormField
              label="Bio"
              htmlFor="demo-textarea"
              description="A few sentences about you. Visible on your public profile."
            >
              <Textarea
                id="demo-textarea"
                rows={3}
                placeholder="Engineer building AI-native tools…"
              />
            </FormField>
          </GalleryRow>

          <GalleryRow
            id="ui.Select"
            name="Dropdown select"
            description="One-of-N choice from a fixed set. Section type, theme preset, language."
            meta={['props: ComponentPropsWithoutRef<select>']}
          >
            <FormField label="Section type" htmlFor="demo-select">
              <Select id="demo-select" defaultValue="text">
                <option value="text">Text block</option>
                <option value="cta">Call-to-action</option>
                <option value="contact">Contact form</option>
                <option value="blog">Blog entry</option>
                <option value="social">Social links</option>
              </Select>
            </FormField>
          </GalleryRow>

          <GalleryRow
            id="ui.Toggle"
            name="Toggle switch"
            description="Binary on/off. Publish, enable mode, opt-in."
            meta={[
              'props: { checked, onChange, disabled?, className? }',
              'on-color: karte-accent',
            ]}
          >
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-6 rounded-xl bg-white/[0.025] px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-karte-text">
                    Encyclopedia mode
                  </p>
                  <p className="text-[12px] text-karte-text-3">
                    Generate a Wikipedia-style page from your sources.
                  </p>
                </div>
                <Toggle checked={toggle1} onChange={setToggle1} />
              </div>
              <div className="flex items-center justify-between gap-6 rounded-xl bg-white/[0.025] px-4 py-3">
                <div>
                  <p className="text-[13px] font-medium text-karte-text">
                    Roast mode
                  </p>
                  <p className="text-[12px] text-karte-text-3">
                    Generate a roast page (off by default).
                  </p>
                </div>
                <Toggle checked={toggle2} onChange={setToggle2} />
              </div>
            </div>
          </GalleryRow>
        </div>
      </section>

      {/* ── BUTTONS ──────────────────────────────────────────── */}
      <section>
        <SectionTitle>Buttons</SectionTitle>
        <GalleryRow
          id="ui.Button"
          name="Button"
          description="4 variants × 3 sizes. Primary for the single canonical action per surface, secondary for siblings, ghost for tertiary, danger for destructive."
          meta={[
            "variant: 'primary' | 'secondary' | 'ghost' | 'danger'",
            "size: 'sm' | 'md' | 'lg'",
          ]}
        >
          <div className="space-y-6">
            <div>
              <ColumnHeader>Primary</ColumnHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Button size="sm">Small</Button>
                <Button size="md">Medium</Button>
                <Button size="lg">Large</Button>
              </div>
            </div>
            <div>
              <ColumnHeader>Secondary</ColumnHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="secondary" size="sm">
                  Small
                </Button>
                <Button variant="secondary" size="md">
                  Medium
                </Button>
                <Button variant="secondary" size="lg">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <ColumnHeader>Ghost</ColumnHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="ghost" size="sm">
                  Small
                </Button>
                <Button variant="ghost" size="md">
                  Medium
                </Button>
                <Button variant="ghost" size="lg">
                  Large
                </Button>
              </div>
            </div>
            <div>
              <ColumnHeader>Danger</ColumnHeader>
              <div className="flex flex-wrap items-center gap-3">
                <Button variant="danger" size="sm">
                  Delete
                </Button>
                <Button variant="danger" size="md">
                  Remove forever
                </Button>
                <Button variant="danger" size="lg">
                  Destroy
                </Button>
              </div>
            </div>
          </div>
        </GalleryRow>
      </section>

      {/* ── TAGS / LABELS / BADGES ───────────────────────────── */}
      <section>
        <SectionTitle>Tags &amp; labels</SectionTitle>
        <div className="space-y-10">
          <GalleryRow
            id="ui.Label"
            name="Field label"
            description="The line that sits above a form control. Use FormField when paired with a description."
          >
            <Label>Display name</Label>
            <Label className="mt-3">Bio</Label>
            <Label className="mt-3">Slug</Label>
          </GalleryRow>

          <GalleryRow
            id="ui.Badge"
            name="Pill badge"
            description="Inline tag for status, type, count. Optional onRemove for filter chips."
          >
            <div className="flex flex-wrap gap-2">
              <Badge>Text block</Badge>
              <Badge>Contact form</Badge>
              <Badge>Enabled</Badge>
              <Badge>v1</Badge>
              <Badge onRemove={() => {}} removeLabel="Remove tag">
                Filter chip
              </Badge>
            </div>
          </GalleryRow>
        </div>
      </section>

      {/* ── LINK CARD VARIANTS (Generative UI catalog) ───────── */}
      <section>
        <SectionTitle>Link card widgets</SectionTitle>
        <p className="mb-6 max-w-2xl text-[13px] leading-[1.55] text-karte-text-3">
          The AI Revamp assistant picks one of these per link based on the
          data available and the row&apos;s visual budget. Each variant is
          named — those ids appear in stored layout plans.
        </p>
        <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {linkCardVariants.map((variant) => {
            // Square + hero look best when given a real image — synthesize
            // an accent gradient as a stand-in for the catalog preview.
            const hasImage = variant.requires.includes('imageUrl');
            const data = {
              ...previewLink,
              imageUrl: hasImage
                ? `https://images.unsplash.com/photo-1517089596392-fb9a9033e05b?w=600&q=80`
                : null,
            };
            const ctx = { accentColor: '#67e8f9', slug: 'demo' };
            return (
              <div
                key={variant.id}
                className="flex flex-col gap-4 rounded-2xl bg-white/[0.02] p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-karte-text-4">
                      {variant.id}
                    </p>
                    <p className="mt-1 text-[13px] font-semibold text-karte-text">
                      {variant.size}
                    </p>
                  </div>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                      variant.budget === 'high'
                        ? 'bg-karte-accent/[0.10] text-karte-accent-soft'
                        : variant.budget === 'medium'
                          ? 'bg-white/[0.06] text-karte-text-2'
                          : 'bg-white/[0.03] text-karte-text-4'
                    }`}
                  >
                    {variant.budget}
                  </span>
                </div>
                <p className="text-[12px] leading-[1.5] text-karte-text-3">
                  {variant.bestFor}
                </p>
                <p className="font-mono text-[10px] text-karte-text-4">
                  requires: {variant.requires.join(', ')}
                </p>
                <div className="mt-auto">{variant.render(data, ctx)}</div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── FUTURE WIDGETS ───────────────────────────────────── */}
      <section>
        <SectionTitle>Roadmap</SectionTitle>
        <div className="rounded-2xl bg-white/[0.02] p-6">
          <p className="text-[13px] leading-[1.55] text-karte-text-3">
            Coming next, per{' '}
            <span className="text-karte-text">docs/plans/generative-ui.md</span>
            :
          </p>
          <ul className="mt-3 space-y-2 font-mono text-[12px] text-karte-text-3">
            <li>
              <span className="text-karte-text-2">project.*</span> — line /
              square / wide / hero (image-bearing projects benefit from
              larger shapes)
            </li>
            <li>
              <span className="text-karte-text-2">section.*</span> — card /
              wide / full (mostly text content, less visual variation)
            </li>
            <li>
              <span className="text-karte-text-2">info-block.*</span> — chip
              / card (small structured facts — location, role, languages)
            </li>
          </ul>
        </div>
      </section>
    </div>
  );
}
