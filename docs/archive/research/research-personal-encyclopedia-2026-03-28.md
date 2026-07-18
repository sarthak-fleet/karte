# Personal Encyclopedia / Personal Wiki Research Report

**Date:** 2026-03-28
**Context:** Research for LinkChat -- exploring a personal encyclopedia feature for a link-in-bio platform
**Scope:** UI/UX patterns, technical approaches, competitive landscape, data sources, privacy

---

## Table of Contents

1. [whoami.wiki Deep Dive](#1-whoamiwiki-deep-dive)
2. [Personal Wiki Tools Landscape](#2-personal-wiki-tools-landscape)
3. [Wikipedia-Style UI Approaches](#3-wikipedia-style-ui-approaches)
4. [AI-Generated Biography Tools](#4-ai-generated-biography-tools)
5. [Data Sources for Personal Encyclopedias](#5-data-sources-for-personal-encyclopedias)
6. [UX Patterns for Browsable Personal Content](#6-ux-patterns-for-browsable-personal-content)
7. [Privacy Considerations](#7-privacy-considerations)
8. [Competitive Landscape & Opportunity Analysis](#8-competitive-landscape--opportunity-analysis)
9. [Synthesis: What to Build for LinkChat](#9-synthesis-what-to-build-for-linkchat)

---

## 1. whoami.wiki Deep Dive

### What It Is

whoami.wiki is an open-source project (MIT license, TypeScript 82.2%, MDX 11.7%) that creates a personal encyclopedia using MediaWiki as the underlying engine. Created by Jeremy Philemon (San Francisco), the project launched in March 2026 and gained rapid traction (296 GitHub stars, 162 commits, press coverage in Boing Boing and HNGN within days).

### Origin Story

Jeremy visited his grandmother and found 1,351 loose photographs spanning decades in a cupboard. He installed MediaWiki on a local server and within two evenings had a full encyclopedia entry for his grandmother's wedding: infobox, scanned photos with captions, linked names, and real Wikipedia articles for the venue and the political climate of the era. He then expanded it by feeding in his own Facebook, Instagram, and WhatsApp archives -- 100,000 messages and thousands of voice notes spanning a decade. The model tracked how relationships evolved over years and surfaced episodes he had forgotten.

### How It Works

1. **You bring data exports** -- photos, messages, documents, location data, health records, audio, files
2. **AI agents draft wiki pages** -- compatible with Claude Code, Codex, and OpenCode
3. **You review and edit** -- standard MediaWiki editing interface
4. **Everything stays local** -- "Your wiki and archive live on your machine. Nothing is stored remotely."

### Article Structure

Articles follow standard MediaWiki/Wikipedia conventions:
- **Infobox** (top-right panel) with key facts: dates, locations, people involved
- **Lead paragraph** establishing context and significance
- **Chronological sections** organized by time period or theme
- **Internal links** connecting people, places, and events across articles
- **Photo galleries** with captions providing visual context
- **Categories** grouping pages by theme (e.g., "Family," "Travel," "Career")
- **Talk pages** for clarifying gaps and consolidating research notes
- **Revision history** tracking how pages evolve as new data is added

### Data Sources Supported

- Photo albums (organized by event/location, EXIF metadata for dates and GPS)
- Chat histories (WhatsApp, Facebook Messenger, etc.)
- PDFs, text files, spreadsheets
- Location data (Google Maps timeline)
- Health records (lab panels, medical tests)
- Voice memos with timestamps
- Transaction records (banks, payment services)
- Streaming history (Shazam tracks)
- Travel bookings (Uber trips, ticketing records)
- iCloud Drive, Google Drive backups

### Tech Stack

- Next.js web interface + desktop application + CLI
- MediaWiki as the wiki engine
- Plugin system (`plugins/whoami/`)
- Evaluation suite for quality assessment
- Claude Code skills integration (`.claude/skills/`)
- GitHub Actions CI/CD

### Key Insight for LinkChat

whoami.wiki is a **self-hosted, developer-oriented tool**. It requires installing MediaWiki, running AI agents locally, and managing data exports manually. There is no hosted/SaaS version. This is the gap: nobody has made a **hosted, consumer-friendly** personal encyclopedia that non-technical users can create and share via a simple URL. That is exactly what LinkChat could offer.

---

## 2. Personal Wiki Tools Landscape

### Notion Personal Wikis

**How people structure life documentation in Notion:**
- Top-level "Home" page with sections: Notes, Work, Life, Planning
- Nested subpages for infinite depth
- Database-backed content with properties (dates, tags, statuses)
- Customized with icons, cover images, fonts
- Column layouts for visual organization
- Templates for recurring content types

**Notion's "Life Wiki" template** is one of the most popular on their marketplace, organizing everything from health and religion to career projects. Key pattern: a single hub page linking to all life domains.

**Strengths:** Beautiful, flexible, familiar to millions of users
**Weaknesses:** Not designed for biographical/encyclopedia content; no Wikipedia-style conventions; private by default (sharing is clunky); no AI generation

### Obsidian Life Wikis

**How the Obsidian community approaches personal knowledge:**
- Plain-text Markdown files in a local "vault"
- Bi-directional links (`[[double bracket]]` syntax) creating a knowledge graph
- Flat folder structure with tags and metadata over deep hierarchies
- Templates with auto-tagging and auto-placement
- Graph visualization showing connections between notes
- Community plugins: Dataview (database queries), Calendar, Templater

**Key 2025-2026 trend:** Plain text vaults are now processable by AI coding agents natively, reducing knowledge management overhead from 30-40% to under 10%.

**LifeHQ** (Obsidian-based) is a complete "Life Operating System" with dashboards, workflows, and tools.

**Strengths:** Powerful linking, local-first, extensible
**Weaknesses:** Steep learning curve, not shareable/public-facing, ugly default UI, requires manual curation

### TiddlyWiki

**Unique characteristics:**
- Single HTML file (extremely portable)
- "Tiddlers" -- smallest semantically meaningful chunks of content
- Non-linear navigation (not hierarchical)
- Some users document "literally every aspect of their life"
- Used as combined journal, habit tracker, expense tracker, diet tracker, workout tracker

**Strengths:** Radical simplicity, portable, highly customizable
**Weaknesses:** Dated UI, not suitable for public-facing content, no AI integration

### Key Pattern Across All Tools

Every personal wiki tool is designed for **private, personal use**. None of them are optimized for **public-facing, shareable biographical content**. They are note-taking tools repurposed for life documentation, not purpose-built personal encyclopedias.

---

## 3. Wikipedia-Style UI Approaches

### Existing CSS/Templates for Wikipedia-Like Pages

**VectorWiktor** (most relevant):
- Static site template that mimics MediaWiki's "Vector" skin
- Only requires 3 files: `wiktor.html`, `wiktor/logo.png`, `wiktor/wiktor.css`
- CSS "shamelessly lifted off MediaWiki, simplified and trimmed"
- Includes: client-side table of contents, Lunr-based search, syntax highlighting
- Not responsive ("looks ok on small screen but not yet made to scale")
- Live demos: idmdepot.com, iamhow.com

**HTML5 Wikipedia Clones:**
- Multiple GitHub repos with pure HTML/CSS Wikipedia replicas
- html5-templates.com has a minimalistic Wikipedia layout template
- SourceCodester has a Wikipedia clone with HTML/CSS/JS and API integration
- eloybernardez/Wikipedia-clone: responsive Wikipedia main page replica

**Wikipedia React Components (npm package):**
- `wikipedia-react-components` -- React building blocks for Wikipedia-like UIs
- Mimics the OOUI style guide and Wikipedia mobile site components
- **Last updated 7 years ago** -- abandoned, not usable for production

### Wikipedia's Actual Article Anatomy

A standard Wikipedia biography article has this structure:

```
[Article Title]
[Infobox - right-aligned panel]
  - Photo/portrait
  - Born: date, location
  - Died: date, location (if applicable)
  - Occupation
  - Years active
  - Known for
  - Notable works
  - Spouse(s)
  - Children

[Lead Section - no heading, max ~400 words]
  Summary of the person's life and significance

[Table of Contents - auto-generated from headings]

== Early life ==
== Education ==
== Career ==
  === Early career ===
  === Breakthrough ===
== Personal life ==
== Legacy ==
== See also ==
== References ==
== External links ==

[Categories at bottom: e.g., "People from Chicago", "21st-century musicians"]
```

### Recommendation for LinkChat

Do NOT use MediaWiki or its CSS directly. Instead, build a custom Wikipedia-inspired UI with Tailwind CSS that:
- Borrows the *information architecture* (infobox, lead, sections, TOC, categories)
- Uses modern typography and spacing (not MediaWiki's dated look)
- Fits the LinkChat glassmorphism/dark theme aesthetic
- Is fully responsive from the ground up
- Integrates seamlessly with the existing `[slug]` public page system

---

## 4. AI-Generated Biography Tools

### Landscape Overview

The AI memoir/biography space has exploded in 2025-2026. Tools fall into three categories:

#### Category 1: AI Bio Generators (text-in, text-out)
- **Typli.ai, HyperWrite, Hypotenuse, QuillBot, Jasper, Easy-Peasy.AI**
- Input: name, occupation, achievements, interests
- Output: 1-3 paragraph professional bio
- Use case: LinkedIn, social media profiles, author pages
- **Relevance to LinkChat:** Low -- these are simple text generators, not structured encyclopedias

#### Category 2: AI Memoir / Life Story Services (interview-based)
- **StoryWorth** ($99/year) -- weekly email questions, compiled into hardcover book, 1M+ books produced
- **Remento** ($99/year) -- voice-based storytelling, audio QR codes in printed book (appeared on Shark Tank)
- **Life Story AI** ($49+) -- AI biographer "Lisa" conducts interviews via WhatsApp voice
- **StoriedLife** -- conversations become memoir chapters, exportable as PDF or printed book
- **Autobiographer** ($99/year or $16/month) -- speak stories aloud, AI transforms to narratives
- **Tell Mel** ($25.99-$229) -- live AI phone interviews that adapt based on responses
- **Memoirji** (free) -- WhatsApp-based, 9 guided themes
- **ChatMemoir** -- chat-based, automatic chapter organization

**Key pattern:** All of these produce a **linear book** (chapters, pages). None produce a **browsable, interlinked encyclopedia**. The output is a PDF or printed book, not a living digital artifact.

#### Category 3: AI-Powered Personal Encyclopedia (whoami.wiki)
- Only one player: whoami.wiki
- Produces interconnected wiki articles, not linear narrative
- Open-source, self-hosted, developer-oriented
- No consumer-friendly hosted version exists

### Gap Analysis

| Feature | Bio Generators | Memoir Services | whoami.wiki | **LinkChat Opportunity** |
|---------|---------------|-----------------|-------------|------------------------|
| Structured articles | No | No | Yes | Yes |
| Interlinked content | No | No | Yes | Yes |
| Browsable/navigable | No | No | Yes | Yes |
| Public-facing URL | No | No | No (local) | Yes |
| Consumer-friendly | Yes | Yes | No | Yes |
| No install required | Yes | Yes | No | Yes |
| AI-generated | Yes | Yes | Yes | Yes |
| Mobile-optimized | N/A | Some | No | Yes |
| Integrated with social | No | No | No | Yes |

**The clear opportunity:** A hosted, consumer-friendly personal encyclopedia that generates browsable, interlinked articles from user data and is accessible via a public URL -- essentially whoami.wiki's concept with StoryWorth's accessibility, embedded in a link-in-bio platform.

---

## 5. Data Sources for Personal Encyclopedias

### Tier 1: Easy to Integrate (user uploads or pastes)

| Source | Data Available | Format | Parsing Complexity |
|--------|---------------|--------|-------------------|
| Resume/CV upload | Work history, education, skills, contact | PDF/DOCX | Low -- many APIs available (Skima AI, Affinda, RChilli parse 200+ data points) |
| Plain text bio | Free-form life narrative | Text | Low -- LLM can structure directly |
| LinkedIn profile export | Connections, jobs, education, skills, recommendations | CSV files in ZIP | Medium |
| Photo uploads | Images + EXIF (date, location, camera) | JPEG/PNG/HEIF | Low -- EXIF libraries widely available |

### Tier 2: Moderate Integration (data export downloads)

| Source | Data Available | Format | Notes |
|--------|---------------|--------|-------|
| Facebook data export | Posts, photos, messages, friends, events, check-ins | JSON/HTML in ZIP | User must request via Meta's Download Your Information tool; can take up to 2 weeks |
| Instagram data export | Posts, stories, messages, followers, searches, settings | JSON in ZIP | Available via Accounts Center |
| Google Takeout | Gmail, Drive, Calendar, Photos, Maps timeline, YouTube history, Search history | Various (JSON, MBOX, etc.) | Most comprehensive single export available |
| WhatsApp export | Messages, media, voice notes per chat | TXT + media files | Per-chat export, not bulk |
| Twitter/X data export | Tweets, DMs, followers, likes, bookmarks | JSON in ZIP | Available via Settings |
| Spotify/Apple Music | Listening history, playlists | JSON/CSV | Available via privacy tools |

### Tier 3: Advanced (API-based or specialized)

| Source | Data Available | Feasibility |
|--------|---------------|-------------|
| Social media APIs (live) | Posts, followers, engagement | Increasingly restricted; Meta Content Library requires researcher access; most platforms have deprecated public APIs |
| Photo face recognition | People identification across photos | Privacy-sensitive; Apple/Google do this locally but don't expose APIs |
| Bank/financial data | Transaction history for life events | Plaid API exists but extremely sensitive |
| Health data | Fitness, medical records | Apple HealthKit export exists; HIPAA concerns |
| Email parsing | Life events, travel confirmations, receipts | Gmail API available but privacy nightmare |

### Realistic Data Strategy for LinkChat (MVP)

For a 6-day sprint, focus on **Tier 1 only**:
1. **Text input** -- user writes or pastes bio, career history, interests
2. **Resume/CV upload** -- parse with an LLM (no need for dedicated parser API)
3. **Photo uploads** -- already supported via R2; add EXIF extraction for dates/locations
4. **Existing LinkChat data** -- links, projects, sections, info blocks already in the system

For v2, add data export import (Instagram JSON, LinkedIn CSV).

---

## 6. UX Patterns for Browsable Personal Content

### Information Architecture Models

**Model 1: Wikipedia-style (article-centric)**
- Each topic is a standalone article with internal cross-links
- Navigation via search, categories, and "See also" links
- Best for: deep, richly interconnected content
- Example: whoami.wiki

**Model 2: Timeline-centric**
- Content organized along a chronological axis
- Users scroll through time, expanding events
- Best for: career history, life milestones
- Example: LinkedIn profile, resume timeline layouts

**Model 3: Category/Hub-centric (Notion-style)**
- Central hub page linking to themed sections
- Sections: Career, Education, Hobbies, Travel, Family
- Best for: organized browsing of distinct life domains
- Example: Notion Life Wiki

**Model 4: Graph/Network-centric (Obsidian-style)**
- Visual node graph showing connections between entities
- Click nodes to explore related content
- Best for: power users, discovery-oriented exploration
- Example: Obsidian graph view, knowledge graph visualizations

### Recommended Hybrid for LinkChat

Combine Models 1 + 2 + 3:

```
[Person's Public Profile Page]  <-- existing LinkChat [slug] page
  |
  +-- [Wiki Tab / Section]
       |
       +-- Overview Article (lead paragraph + infobox)
       |
       +-- Category Navigation
       |     +-- Career & Work
       |     +-- Education
       |     +-- Projects & Creations
       |     +-- Interests & Hobbies
       |     +-- Travel & Places
       |     +-- Life Milestones
       |
       +-- Timeline View (toggle)
       |     +-- 2024: Started at Company X
       |     +-- 2022: Graduated from Y
       |     +-- 2020: Built Project Z
       |
       +-- Individual Articles
             +-- [Article: "Career at Company X"]
             +-- [Article: "University of Y"]
             +-- [Article: "Project Z"]
             (each with infobox, sections, related articles)
```

### Navigation Patterns

1. **Breadcrumbs**: `Profile > Wiki > Career > Company X` -- shows location in hierarchy
2. **Table of Contents**: Auto-generated from headings within each article (Wikipedia-style, sticky sidebar on desktop)
3. **Related Articles**: "See also" section at bottom of each article linking to connected content
4. **Category Tags**: Clickable tags on each article leading to filtered views
5. **Search**: Full-text search across all articles (essential once content grows)
6. **Back to Profile**: Always-visible link back to the main link-in-bio page

### Mobile UX Considerations

- TOC becomes a collapsible dropdown at top of article
- Infobox stacks above content (not floated right)
- Categories become horizontal scrollable chips
- Article list uses cards rather than text links
- Timeline becomes a vertical scrollable list with expand/collapse

---

## 7. Privacy Considerations

### The Core Tension

Personal encyclopedias contain the most intimate data imaginable -- life events, relationships, health, finances, locations. Users want rich, detailed content but also granular control over who sees what.

### How Existing Tools Handle It

| Tool | Privacy Model | Sharing |
|------|--------------|---------|
| whoami.wiki | 100% local, nothing remote | No sharing mechanism |
| Obsidian | Local files, optional sync | Publish plugin (all-or-nothing) |
| Notion | Cloud-hosted, private by default | Share individual pages via link |
| TiddlyWiki | Single HTML file, local | Upload HTML to hosting manually |
| StoryWorth | Cloud-hosted | Share printed book physically |
| LinkChat (current) | Cloud-hosted, public via slug | Entire page is public |

### Privacy Controls Needed for LinkChat Wiki Feature

**Article-Level Visibility:**
- Public (anyone with the URL)
- Unlisted (accessible via direct link but not listed in navigation)
- Private (only visible to the owner, useful for drafts)

**Section-Level Redaction:**
- Allow users to mark specific sections within articles as private
- Redacted sections show "[Private section]" placeholder to visitors

**Category-Level Controls:**
- Toggle entire categories public/private (e.g., keep "Career" public, "Family" private)

**Data Handling:**
- All data stored in existing Turso database (already encrypted at rest)
- No data shared with third parties beyond the AI model used for generation
- Clear data deletion: user can delete individual articles or entire wiki
- GDPR compliance: export all wiki data, right to deletion

**AI Generation Privacy:**
- Make it explicit that uploaded data (resume, photos, text) is sent to an LLM for processing
- Option to use user's own API key (LinkChat already supports this via `smApiKey`)
- No training on user data (use API providers with data processing agreements)

### GDPR-Specific Requirements

- Granular consent: separate opt-in for each data processing purpose
- Right to access: user can export all wiki content
- Right to erasure: user can delete any/all content
- Data minimization: only collect data needed for article generation
- Consent withdrawal must be as easy as giving consent

---

## 8. Competitive Landscape & Opportunity Analysis

### Direct Competitors (personal encyclopedia space)

| Competitor | Type | Status | Key Limitation |
|-----------|------|--------|----------------|
| whoami.wiki | Self-hosted wiki | Active (March 2026, growing fast) | Developer-only, requires MediaWiki install |
| Notion Life Wiki | Cloud wiki | Mature | Not designed for public-facing biographical content |
| Obsidian Life PKM | Local wiki | Mature | Not shareable, requires manual curation |

### Adjacent Competitors (link-in-bio with rich profiles)

| Competitor | Type | Status | Key Limitation |
|-----------|------|--------|----------------|
| Linktree | Link-in-bio | Dominant | Simple link list, no rich content |
| Bento | Grid-based bio page | **Shut down Feb 2026** (acquired by Linktree) | Dead |
| Beacons | Creator platform | Growing | Monetization-focused, no wiki/encyclopedia |
| Taap.bio | Bento-style grid | Growing | Visual layout, no structured content |
| Bio.link | Simple bio page | Stable | Minimal features |
| Wiki.link | Link-in-bio | Small | Clean and ad-free but just links, no wiki features despite the name |

### Adjacent Competitors (AI life documentation)

| Competitor | Type | Key Limitation |
|-----------|------|----------------|
| StoryWorth | AI memoir book | Linear book output, not browsable web content |
| Remento | Voice memoir | Audio-focused, book output |
| Life Story AI | AI biographer | Book output, not web-native |
| StoriedLife | AI memoir | PDF/print output |

### The White Space

**Nobody is doing this:** A hosted, consumer-friendly personal encyclopedia that generates browsable, interlinked, Wikipedia-style articles from user data and is accessible via a public URL integrated with a link-in-bio platform.

This is the intersection of:
- whoami.wiki's concept (personal encyclopedia with AI agents)
- StoryWorth's accessibility (guided, no-code, consumer-friendly)
- Linktree's distribution model (public URL, link-in-bio)
- Wikipedia's information architecture (articles, infoboxes, categories, linking)

### Timing Assessment

- whoami.wiki launched days ago (March 2026) and is generating significant press/buzz
- The "personal AI" and "digital legacy" narratives are peaking in cultural conversation
- Bento's shutdown created a wave of users looking for richer bio page alternatives
- AI memoir tools proved market demand (StoryWorth: 1M+ books)
- **Timing verdict: 1-4 week momentum window. Ideal for a sprint.**

---

## 9. Synthesis: What to Build for LinkChat

### The Feature: "Your Wiki"

A personal encyclopedia feature integrated into LinkChat's existing link-in-bio platform. Users get a `yourslug.linkchat.com/wiki` that contains AI-generated, Wikipedia-style articles about their life, career, projects, and interests.

### Core Value Proposition

"Everyone deserves their own Wikipedia page. Now you have one."

### MVP Scope (6-Day Sprint)

**Day 1-2: Data Collection & Article Generation**
- User pastes text (bio, career summary, interests) into a form
- User uploads resume/CV (parsed by LLM into structured data)
- User's existing LinkChat data (links, projects, sections, info blocks) is pulled in automatically
- LLM generates a set of interconnected articles from this data

**Day 3-4: Wikipedia-Style Article UI**
- Article page with: title, infobox (right-aligned on desktop), lead paragraph, sections with headings, auto-generated TOC
- Category navigation (Career, Education, Projects, Interests)
- Internal links between articles (clicking a project name goes to that project's article)
- "Related Articles" sidebar or footer
- Responsive design (infobox stacks on mobile, TOC becomes dropdown)
- Fits the existing LinkChat dark/glass theme OR a clean Wikipedia-light theme

**Day 5: Dashboard & Privacy**
- Dashboard page for managing wiki articles (list, edit, delete, reorder)
- Article visibility toggle (public/unlisted/private)
- "Regenerate" button to re-run AI on updated data
- Manual edit capability (rich text or Markdown editor)

**Day 6: Integration & Polish**
- Wiki tab/link on the existing public profile page
- `/[slug]/wiki` route for the wiki landing page
- `/[slug]/wiki/[article-slug]` route for individual articles
- SEO metadata for wiki pages
- Share buttons on articles

### Article Types (Generated by AI)

1. **Overview** -- main biographical article (always generated)
2. **Career articles** -- one per job/company from resume
3. **Education articles** -- one per school/degree
4. **Project articles** -- one per LinkChat project (already in system)
5. **Interest articles** -- based on stated hobbies/interests
6. **Skills article** -- aggregated from resume and info blocks

### Infobox Fields (for Overview Article)

```
Name
Photo (from existing avatar)
Occupation
Location
Education
Known for
Website (existing LinkChat links)
Social profiles (existing LinkChat links)
```

### Database Schema Addition

```sql
-- New tables needed
wikiArticles:
  id (text, PK)
  pageId (text, FK -> pages)
  slug (text, unique per page)
  title (text)
  category (text) -- career, education, project, interest, overview, custom
  infoboxData (text, JSON) -- structured key-value pairs for infobox
  leadParagraph (text) -- opening summary
  content (text) -- full article body in Markdown
  visibility (text) -- public, unlisted, private
  sortOrder (integer)
  generatedFrom (text) -- source data reference
  createdAt (text)
  updatedAt (text)

wikiCategories:
  id (text, PK)
  pageId (text, FK -> pages)
  name (text)
  slug (text)
  sortOrder (integer)
```

### Technical Approach

- **Article generation:** Send user data to LLM (via existing SaaS Maker integration or direct API) with a system prompt that instructs Wikipedia-style article generation
- **Article rendering:** Custom React components styled with Tailwind (NOT MediaWiki CSS)
  - `<WikiArticle>` -- full article layout
  - `<WikiInfobox>` -- right-aligned fact panel
  - `<WikiTOC>` -- table of contents
  - `<WikiInternalLink>` -- links between articles
  - `<WikiCategoryNav>` -- category browser
- **Routing:** Add `/[slug]/wiki` and `/[slug]/wiki/[articleSlug]` to the existing App Router
- **Dashboard:** Add a `/dashboard/wiki` page for managing articles

### Viral Mechanics

1. **Share individual articles** -- "Check out my career page" is more shareable than "here's my link tree"
2. **"Get Your Own Wikipedia Page"** -- the call-to-action writes itself
3. **Social proof** -- article view counts visible on public pages
4. **SEO play** -- each article is a separate, indexable page with structured content
5. **Comparison/reaction content** -- "my Wikipedia page" is inherently shareable on TikTok/Instagram

### Monetization Path

- Free: 3 articles, basic infobox
- Pro: Unlimited articles, custom categories, analytics on article views, priority AI generation
- This fits the existing LinkChat model of free basic + paid premium features

### Risk Assessment

| Risk | Severity | Mitigation |
|------|----------|-----------|
| AI generates inaccurate content | High | User review/edit before publishing; "AI-generated" badge; manual edit capability |
| Users don't provide enough data | Medium | Start with existing LinkChat data (links, projects, info blocks); progressive enhancement |
| Privacy concerns | Medium | Article-level visibility controls; clear data handling disclosure |
| Low engagement after creation | Medium | "Your wiki needs updating" prompts; weekly auto-suggestions for new articles |
| whoami.wiki moves to hosted model | Low | Different market (they target power users; LinkChat targets casual users/creators) |
| Wikipedia trademark concerns | Low | Never use "Wikipedia" in branding; use "personal encyclopedia" or "your wiki" |

### What Makes This Compelling

1. **Nobody else is doing hosted personal encyclopedias** -- clear white space
2. **whoami.wiki just proved the concept** and generated massive press, but is developer-only
3. **AI memoir tools proved demand** (StoryWorth: 1M+ books sold at $99 each)
4. **Bento's shutdown** left users seeking richer bio alternatives
5. **Built on existing infrastructure** -- LinkChat already has user data, profiles, AI integration, and public pages
6. **The cultural moment** -- "everyone wants their own Wikipedia page" is an evergreen desire that AI finally makes possible

---

## Appendix A: Key Technical References

### Wikipedia Article Structure (for LLM Prompting)

When generating articles, the LLM system prompt should instruct:

```
Generate a Wikipedia-style encyclopedia article about [person/topic].

Structure:
1. Lead paragraph (2-3 sentences summarizing the subject)
2. Infobox data (JSON with key facts)
3. Sections with == Heading == format
4. Internal links using [[double brackets]] for connected topics
5. Categories at the bottom

Tone: Neutral, third-person, encyclopedic. Factual, not promotional.
Length: 200-500 words per article.
```

### Data Export Formats (for v2 import)

| Platform | Export Location | Key Files |
|----------|----------------|-----------|
| Instagram | Settings > Your Activity > Download Your Information | `content/posts_1.json`, `content/profile.json` |
| Facebook | Settings > Your Information > Download Your Information | `posts/your_posts.json`, `profile_information/profile_information.json` |
| LinkedIn | Settings > Data Privacy > Get a Copy of Your Data | `Positions.csv`, `Education.csv`, `Skills.csv`, `Profile.csv` |
| Google | takeout.google.com | `Location History/`, `My Activity/`, `Google Photos/` |
| Twitter/X | Settings > Your Account > Download an Archive | `data/tweets.js`, `data/profile.js` |

### Resume Parser Options (if needed beyond LLM)

- **Affinda**: 95% accuracy, 56 languages, 250M+ documents processed
- **Skima AI**: 200+ data points extracted, PDF/DOCX/HTML/TXT/image support
- **RChilli**: 40+ languages
- **ResumeReaderAPI**: Clean JSON output
- For MVP: just send the resume text/PDF to the LLM directly -- simpler and cheaper

---

## Appendix B: Source Links

### whoami.wiki
- https://whoami.wiki/
- https://whoami.wiki/blog/personal-encyclopedias
- https://github.com/whoami-wiki/whoami

### Personal Wiki Tools
- https://www.notion.com/help/guides/personal-wiki
- https://www.notion.com/templates/life-wiki
- https://obsidian.md/
- https://www.glukhov.org/post/2025/07/obsidian-for-personal-knowledge-management/
- https://tiddlywiki.com/
- https://medevel.com/tiddlywiki-12-use-cases-and-5-tips-for-new-users/

### Wikipedia-Style UI
- https://github.com/alexivkin/VectorWiktor
- https://html5-templates.com/preview/wikipedia.html
- https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Layout
- https://en.wikipedia.org/wiki/Wikipedia:Manual_of_Style/Infoboxes
- https://www.npmjs.com/package/wikipedia-react-components

### AI Biography/Memoir Tools
- https://life-story.ai/
- https://www.storiedlife.ai/
- https://welcome.storyworth.com/
- https://www.remento.co/
- https://memoirji.com/blog/best-ai-memoir-tools-2025/

### Link-in-Bio Competitors
- https://wiki.link/
- https://own.page/blog/bento-alternatives
- https://taap.bio/blog/linktree-alternatives-free

### Data & Privacy
- https://zapier.com/blog/download-facebook-twitter-instagram/
- https://www.clym.io/blog/what-is-granular-consent-and-what-are-its-gdpr-implications
- https://contabo.com/blog/how-to-set-up-a-self-hosted-wiki-complete-guide/

### UX Patterns
- https://blog.logrocket.com/ux-design/organizing-categorizing-content-information-architecture/
- https://www.pencilandpaper.io/articles/ux-pattern-analysis-navigation
- https://www.yfiles.com/resources/how-to/guide-to-visualizing-knowledge-graphs
