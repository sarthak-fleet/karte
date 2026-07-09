const FAQ_ENTRIES: { question: string; answer: string }[] = [
  {
    question: 'What is Karte?',
    answer:
      'Karte is a personal page with a public inbound assistant. Visitors can browse your links and projects, ask questions in chat, send contact messages, or use your dedicated page inbox. The goal is simple: fewer low-context DMs and better handoffs when someone actually needs you.',
  },
  {
    question: 'Is Karte free?',
    answer:
      'Karte offers a free tier with core profile, link, project, contact, chat, custom domain, and analytics features. AI-enhanced modes become available when you configure an AI provider key in the dashboard, so creators can start with a public page and add an assistant when ready.',
  },
  {
    question: 'How does the inbound assistant work?',
    answer:
      'You add links, projects, bio sections, FAQs, and boundaries. Karte uses that profile memory to answer visitor questions before they reach your inbox. When someone wants to collaborate, hire, invite, or ask more, the dashboard keeps the thread and context together.',
  },
  {
    question: 'How is Karte different from Carrd, Own.page, or Linktree?',
    answer:
      'Carrd, Own.page, and Linktree help you publish a page quickly. Karte is built around what happens after people arrive: chat, contact, inbound email, leads, analytics, and AI profile modes. It is less a static brochure and more a first-pass agent for public attention.',
  },
  {
    question: 'Does Karte handle email and leads?',
    answer:
      'Yes. Public contact messages, chat conversations, leads, and optional per-page inbound email are dashboard surfaces in Karte. A creator can opt into a handle-based inbox, receive messages tied to the page, and keep visitor context next to the public profile that created it.',
  },
  {
    question: 'Can I use Karte with my own domain?',
    answer:
      'Yes. Karte deploys on Cloudflare Workers and supports custom domains. Each profile gets a public slug-based URL like karte.cc/yourhandle, and you can point your own domain at your profile. Profiles are server-rendered for fast load times and SEO indexing.',
  },
  {
    question: 'What tech stack does Karte use?',
    answer:
      'Karte uses Next.js 16 with the App Router and React Compiler, deployed on Cloudflare Workers via OpenNext. App data lives in Turso (libSQL) through Drizzle ORM, auth uses better-auth with Google OAuth backed by Cloudflare D1, and images are stored in Cloudflare R2.',
  },
];

const FAQ_JSON_LD = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: FAQ_ENTRIES.map((entry) => ({
    '@type': 'Question',
    name: entry.question,
    acceptedAnswer: {
      '@type': 'Answer',
      text: entry.answer,
    },
  })),
};

/**
 * FAQ section for the Karte landing page.
 *
 * Added for Generative Engine Optimization (GEO): AI search engines
 * lift 35-60 word factual passages, so each answer is self-contained
 * and within that range. Rendered outside the scroll-snap Onyx deck so
 * the existing card indices (card i / vi) are untouched. Styled to
 * match the Onyx dark + gold-foil theme.
 */
export function OnyxFaq() {
  return (
    <section className="onyx-faq" aria-label="Frequently asked questions">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
      />
      <div className="onyx-faq-inner">
        <p className="onyx-eyebrow center">
          <span className="onyx-eyebrow-dot" aria-hidden="true" />
          FAQ · CARD VII
        </p>
        <h2 className="onyx-h2 center">
          Questions, <em>answered</em>
        </h2>
        <ol className="onyx-faq-list">
          {FAQ_ENTRIES.map((entry) => (
            <li key={entry.question} className="onyx-faq-item">
              <h3 className="onyx-faq-q">{entry.question}</h3>
              <p className="onyx-faq-a">{entry.answer}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
