# AI Roast Feature Research Report

**Date**: 2026-03-28
**Purpose**: Comprehensive analysis of the "roast me" / AI roast app space to inform building a roast feature into a link-in-bio platform.

---

## Table of Contents

1. [Wordware's Viral Success: The Gold Standard](#1-wordwares-viral-success-the-gold-standard)
2. [Competitive Landscape: Other Roast Apps](#2-competitive-landscape-other-roast-apps)
3. [UI Patterns and Output Formats](#3-ui-patterns-and-output-formats)
4. [Viral Mechanics: What Makes Roast Content Shareable](#4-viral-mechanics-what-makes-roast-content-shareable)
5. [Technical Approaches](#5-technical-approaches)
6. [Monetization Models](#6-monetization-models)
7. [Actionable Insights for LinkChat](#7-actionable-insights-for-linkchat)
8. [Risk Assessment](#8-risk-assessment)

---

## 1. Wordware's Viral Success: The Gold Standard

### The Numbers

- **8.1 million users** in approximately 3 weeks
- **$100K+ revenue** in the last 7 days of the viral period (just from the Twitter project)
- **400K+ new users** on the Wordware.ai platform
- **272K users** registered on wordware.ai
- **226K new users** in a single peak day
- **106K people per hour** at peak traffic
- **6,151 ProductHunt upvotes** (claimed as top launch ever)
- **$45K infrastructure costs** in the first 3 days (Anthropic, Vercel, scrapers)
- **20K new users per day** sustained even after viral peak subsided

### How It Worked (UX Flow)

1. User visits twitter.wordware.ai
2. Enters their Twitter/X handle (no account creation required)
3. AI scrapes public profile data + recent tweets via a fallback system (Twitter API, Apify, SocialData API)
4. AI analyzes personality through chained prompts using structured JSON output
5. Results display on a personalized webpage with multiple analysis sections
6. User can share via one-click sharing with auto-generated OG image/social card

### Output Categories (The Full Breakdown)

The roast generates analysis across these specific sections:

| Section | Description |
|---------|-------------|
| **Personality Summary** | One-sentence distillation of Twitter persona |
| **The Roast** | One paragraph of rapid-fire jokes, "edgy and provocative, mean a little, not cringy" |
| **Strengths** | Positive traits identified from tweets |
| **Weaknesses** | Negative traits the AI identifies |
| **Love Life** | Predictions about romantic persona |
| **Money** | Financial behavior patterns |
| **Health** | Wellness-related observations |
| **Others' Perspective** | How the account appears to outsiders |
| **Biggest Goal** | Inferred primary life objective |
| **Celebrity Comparison** | A famous person similar to you |
| **Pickup Lines** | Humorous romantic suggestions based on persona |
| **Previous Life** | What you were in a past life |
| **Spirit Animal** | Personality-to-animal matching |
| **Thing to Buy** | Product recommendation |
| **Career** | Professional trajectory insights |
| **Life Suggestion** | General advice |

### Critical UX Decision That Changed Everything

The roast section was initially placed at the bottom of the page. After user feedback revealed it was "the most fun part," they moved it to the top. This single UX change was a major inflection point for virality. People came for the roast, stayed for the personality analysis.

### Shareable Output

- Each user gets a unique URL (twitter.wordware.ai/[handle])
- When shared on Twitter/X, the link generates an OG card showing a condensed version of the personality analysis
- The Twitter card acts as a teaser, driving clicks back to the full analysis page
- One-click share button pre-populates a tweet with the link

### Monetization Strategy

- **Free**: Basic roast visible to everyone
- **$1 paywall**: Full detailed personality analysis unlocked for a small fee
- **Dynamic paywall toggle**: They could turn the paywall on/off to control virality vs. revenue vs. infrastructure costs
- **Email capture**: Required email for certain features, captured 700K leads
- **Stripe integration**: STRIPE_PRICE_ID and STRIPE_PRODUCT_ID for paid unlocks

### Why It Went Viral: Key Factors

1. **Zero friction**: No signup, no credit card, just enter a handle
2. **Personal and accurate**: Roasts felt eerily specific because they analyzed actual tweet content
3. **Shareable by design**: OG images + one-click sharing turned every user into a distribution channel
4. **Platform-native**: Built for Twitter users, shared on Twitter -- perfect alignment
5. **Influencer amplification**: Politicians, comedians, public figures participated organically
6. **Edgy but safe**: "Be edgy and provocative, be mean a little. Don't be cringy" -- the perfect tone
7. **Social proof loop**: Seeing friends' roasts created FOMO and curiosity
8. **Timing**: Summer 2024, AI hype cycle, people looking for fun AI use cases

---

## 2. Competitive Landscape: Other Roast Apps

### A. Social Media Profile Roasters

#### Roast Master by Monica AI (roast.monica.im)
- **Platforms**: Instagram, TikTok, Facebook, Threads, Twitter/X, LinkedIn
- **Model**: Free (part of Monica AI ecosystem)
- **Categories**: Strengths/Weaknesses, Love Life, Others' Perception, MBTI type, Spirit Animal, Fortune, Life Motto, Compatibility
- **Differentiator**: Multi-platform support, MBTI integration, works on private accounts
- **AI**: GPT-4o, Llama 3.1, Claude 3.5 Sonnet (multi-model)
- **URL**: https://roast.monica.im/

#### PleaseRoast (pleaseroast.com)
- **Platform**: Instagram only
- **Model**: Freemium (few free roasts/day, paid for extensive reports)
- **Output**: "Roast cards" -- visual cards for social sharing
- **Features**: Profile versioning (track roasts over time), media analysis (photos/videos)
- **Data**: Caches profile pictures for 90 days
- **URL**: https://pleaseroast.com/

#### Insta Personality (instapersonality.gcoapps.com)
- **Platform**: Instagram
- **Model**: Free
- **Output**: Roast + custom bio + strengths/weaknesses + celebrity lookalike
- **Creator**: Solo developer Oyale Peter
- **Differentiator**: Analyzes "overall vibe" including style, tone, and content
- **URL**: https://instapersonality.gcoapps.com/

#### Roast vs Boast by Sider AI
- **Platforms**: Multiple social profiles
- **Model**: Free (browser extension)
- **Differentiator**: Dual mode -- generates both a "roast" and a "boast" for any profile, then friends vote on which fits better
- **URL**: https://roast-vs-boast.sider.ai/

### B. LinkedIn Profile Roasters

#### RoastLinkedIn.com
- **Output**: Hilarious roasts + actionable improvement tips
- **Model**: Free
- **URL**: https://roastlinkedin.com/

#### LinkedinRoaster by Taplio
- **Output**: Funny, honest roasts + actionable tips
- **Model**: Free
- **Differentiator**: Built by Taplio (established LinkedIn tool), so it feeds into their paid LinkedIn toolkit
- **URL**: https://linkedin-roaster.taplio.com/

#### MyFeedIn LinkedIn Roaster
- **Output**: Brutally honest feedback on professional presence
- **Model**: Free
- **URL**: https://myfeedin.co/free-tools/linkedin-profile-roaster

### C. GitHub Profile Roasters

#### RoastGit (roastgit.in)
- **AI**: Analyzes repos, commits, activity
- **Model**: Free, no signup
- **URL**: https://www.roastgit.in/

#### GitHub Roast (github-roast.pages.dev)
- **AI**: Google Gemini API
- **Analyzes**: Profile, repos, stars, activities
- **URL**: https://github-roast.pages.dev/

#### Multiple open-source projects on GitHub
- jacksonkasi0/roast-me, programORdie2/github-roaster, Ajeet1606/roast-github
- All follow the same pattern: enter username, fetch public data, prompt LLM

### D. Resume Roasters

#### RoastMyResume (multiple versions)
- rostmyresume.xyz, roast-my-resume.com, roastmyresu.me, roastmyresume.pro
- **Model**: Free upload, AI generates roast + actionable feedback
- **Format**: Upload PDF/image, get roast + ATS tips + improvement suggestions
- **Differentiator**: Practical value wrapped in humor

#### CVRoaster.com
- **Model**: "Senior HR Executive" AI persona
- **URL**: https://www.cvroaster.com/

### E. Photo/Selfie Roasters

#### RoastedBy.ai
- **Input**: Upload a photo or selfie
- **Output**: Witty one-liner or short paragraph roast
- **Styles**: Default, Crypto Douche, New York, Southern American, South London, Surfer Dude, Valley Girl, Adult (18+)
- **Model**: Free, no signup
- **URL**: https://www.roastedby.ai/

#### AI RoastBot (airoastbot.com)
- **Input**: Upload any photo
- **Output**: At least 5 AI-powered roasts per photo
- **URL**: https://www.airoastbot.com/

#### Roast App (iOS, App Store)
- **Input**: Photos
- **Output**: Multiple roasts from cute to brutal
- **Model**: Free with limits
- **URL**: https://apps.apple.com/us/app/roast-app-ai-roast-bot/id6743675883

### F. Dating Profile Optimizers (Roast-Adjacent)

#### ROAST Dating (roast.dating)
- **Not a comedy roast** -- positioned as a dating profile optimizer
- **Input**: Screenshots of dating profiles (Tinder, Bumble, Hinge)
- **Output**: Photo scores, profile text feedback, actionable improvement plan
- **Pricing**: $6.99 (Starter), $12.99 (Hacker), $97 (Expert with 1:1 call)
- **Data**: 100K+ diverse opinions database, 10K+ expert-reviewed profiles
- **URL**: https://roast.dating/

---

## 3. UI Patterns and Output Formats

### Pattern 1: The Personality Page (Wordware Style)
- Dedicated URL per user (twitter.wordware.ai/[handle])
- Long-scroll page with multiple sections
- Each section has a header + emoji + generated text
- Roast at the top (most engaging), personality analysis below
- Share button generates OG image for social card

**Best for**: Deep engagement, return visits, shareability

### Pattern 2: The Shareable Card (Receiptify / Spotify Wrapped Style)
- Single visual card (1080x1080 or 1200x630)
- Downloadable as PNG
- Designed for Instagram Stories, Twitter, or messaging
- Contains key stats/highlights in a visually appealing layout
- Brand watermark for organic distribution

**Best for**: Maximum shareability, brand awareness, social proof

### Pattern 3: The Roast Stream (Real-time Generation)
- Text appears word-by-word as the AI generates it
- Creates anticipation and engagement
- Similar to watching a ChatGPT response stream
- Users screenshot mid-generation for "reaction content"

**Best for**: Entertainment value, time-on-page, TikTok reaction content

### Pattern 4: The Score Card (Rating Format)
- Numerical scores across categories (0-100 or letter grades)
- Radar/spider chart visualization
- Category breakdown with brief commentary
- Overall "rating" that becomes the shareable headline

**Best for**: Gamification, competition between friends, repeat usage

### Pattern 5: The Dual Mode (Roast vs Boast)
- User gets both a brutal roast AND a glowing compliment
- Friends vote on which is more accurate
- Creates engagement through the voting mechanic
- Doubles the shareability (share the roast AND the boast)

**Best for**: Broader audience appeal, engagement through interaction

### Key Visual Elements Across All Formats

- **Dark backgrounds** with bright accent colors (fire emojis, orange/red tones)
- **Profile picture prominently displayed** (connects roast to real person)
- **Bold typography** for key roast lines
- **Category icons/emojis** for visual scanning
- **Brand watermark** on shareable assets
- **CTA button** ("Get Your Roast" / "Roast a Friend") for viral loop

---

## 4. Viral Mechanics: What Makes Roast Content Shareable

### The Psychology

1. **Self-deprecating humor**: People enjoy laughing at themselves publicly -- it signals confidence
2. **Curiosity gap**: "What will the AI say about ME?" -- irresistible to find out
3. **Social proof / FOMO**: Seeing friends share roasts triggers "I need to try this too"
4. **Validation through humor**: Even a roast feels like attention, and people crave being "seen"
5. **Competitive dynamics**: "My roast is funnier than yours" creates comparison sharing
6. **Identity expression**: Sharing a roast says "I'm self-aware and have a sense of humor"

### The Viral Loop

```
User sees friend's roast on feed
    --> Curiosity drives them to try it
        --> They get their own roast
            --> Results feel personal and funny
                --> They share to their feed
                    --> Their friends see it
                        --> Loop repeats
```

### Platform-Specific Sharing Formats That Work

| Platform | Best Format | Why It Works |
|----------|-------------|--------------|
| Twitter/X | Link with OG card + quote | Drives clicks, shows preview, enables commentary |
| Instagram Stories | Screenshot or downloadable card | Visual-first, ephemeral urgency, swipe-up link |
| TikTok | Screen recording of results generating | "React" content format, shows genuine surprise |
| LinkedIn | Text post + screenshot | Professional humor angle, "even AI says I need help" |
| iMessage/WhatsApp | Direct link or screenshot | Private sharing drives group dynamics |

### What Makes Roasts Specifically Shareable (vs. generic AI output)

- **Specificity**: Generic compliments are boring. Specific roasts feel magical
- **Brevity**: Best roasts are 1-2 sentences. Easy to screenshot, easy to read
- **Relatability**: Roasts about universal behaviors ("you post motivational quotes at 2am") resonate
- **Surprise**: The AI noticing something you didn't expect creates genuine reactions
- **Edge**: Slightly mean but not cruel. The sweet spot is "I'm laughing but that actually hurt"

### Optimal Roast Tone: The Wordware Formula

Direct quote from Wordware's prompt engineering: **"Be edgy and provocative, be mean a little. Don't be cringy."**

This translates to:
- Observations, not insults (attack the behavior, not the person)
- Specific references to actual content (not generic burns)
- Cultural references and memes mixed with genuine analysis
- A compliment buried in the roast (makes it feel fair)
- Avoiding anything that could be genuinely hurtful (no appearance, identity, etc.)

---

## 5. Technical Approaches

### Data Collection Methods

| Method | How It Works | Pros | Cons |
|--------|-------------|------|------|
| **API Access** | Use platform APIs (Twitter API, GitHub API) | Reliable, structured data, fast | Expensive, rate limited, Twitter API increasingly restricted |
| **Web Scraping** | Apify, Puppeteer, custom scrapers | Access to public data, flexible | Fragile, platform changes break scrapers, legal gray area |
| **User Upload** | User pastes text, uploads screenshots, or provides URL | Zero infrastructure cost, always works | Friction, user may cherry-pick data |
| **OAuth Login** | User authenticates, app reads their data | Rich data access, reliable | High friction, privacy concerns, platform approval needed |
| **Hybrid Fallback** | Multiple methods with automatic fallback | Reliable at scale | Complex to maintain |

**Wordware's approach**: Hybrid fallback system using Twitter API Token + Cookie auth, Apify scraping, and SocialData API as fallbacks.

**For a link-in-bio platform**: The unique advantage is you ALREADY HAVE the user's data. Their bio, links, content, and profile are in your system. No scraping needed.

### AI Model Selection

| Model | Used By | Strengths for Roasting |
|-------|---------|----------------------|
| **Claude 3.5 Sonnet / Claude 4** | Wordware (likely), Monica AI | Best at nuanced humor, avoids truly offensive content, strong structured output |
| **GPT-4o** | Monica AI, various tools | Good at witty one-liners, fast, reliable JSON mode |
| **Gemini** | GitHub Roast tools | Good for developer-focused humor, generous free tier |
| **Llama 3.1** | Monica AI (as fallback) | Free/cheap, can run locally, less filtered |

### Prompt Engineering Patterns

**Chain of prompts** (Wordware's approach):
1. **Data extraction prompt**: Parse raw profile data into structured personality signals
2. **Personality analysis prompt**: Generate insights across categories (strengths, weaknesses, etc.)
3. **Roast generation prompt**: Use personality insights to craft targeted humor
4. **Formatting prompt**: Structure output as JSON for consistent UI rendering

**Single prompt** (simpler apps):
- One large prompt with profile data + instructions + output schema
- Faster but lower quality
- Works for simpler roast formats (single paragraph)

### Structured Output

All successful roast apps use JSON mode / structured generation to ensure consistent output:

```json
{
  "summary": "One-sentence personality distillation",
  "roast": "The main roast paragraph",
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "loveLife": "Romantic prediction",
  "spiritAnimal": "Animal + explanation",
  "celebrityMatch": "Celebrity + why",
  "score": 72,
  "categories": {
    "humor": 8,
    "authenticity": 6,
    "cringe": 4,
    "influence": 5
  }
}
```

### Shareable Image Generation

**Approach 1: Vercel OG / Satori** (recommended)
- Generate OG images dynamically at the edge
- HTML/CSS to SVG conversion
- Fast, scalable, no browser needed
- Used by Wordware (hosted on Vercel)

**Approach 2: html-to-image / Puppeteer**
- Render HTML card, screenshot as PNG
- More flexible design options
- Heavier infrastructure requirements

**Approach 3: Canvas API**
- Client-side generation
- No server cost
- Limited design flexibility

### Wordware's Full Tech Stack (from GitHub repo)

| Component | Technology |
|-----------|-----------|
| Framework | Next.js (TypeScript) |
| Database | Neon (PostgreSQL via Drizzle ORM) |
| AI Backend | Wordware AI Agent API (prompt chaining, JSON mode) |
| Scraping | Twitter API + Apify + SocialData API (fallback system) |
| Payments | Stripe |
| Analytics | PostHog |
| Email/Newsletter | Loops API |
| Hosting | Vercel |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |

---

## 6. Monetization Models

### What Works in the Roast App Space

| Model | Example | Revenue | Conversion |
|-------|---------|---------|------------|
| **Micro-paywall ($1-2)** | Wordware (full analysis unlock) | $100K+ in 7 days | High volume, low price |
| **Freemium daily limits** | PleaseRoast (few free/day) | Steady recurring | Drives repeat usage |
| **Tiered pricing** | ROAST Dating ($7 / $13 / $97) | Higher ARPU | Lower volume |
| **Lead generation** | LinkedinRoaster by Taplio | Indirect (feeds paid tool) | High conversion to main product |
| **Free + brand building** | Monica AI Roast Master | Platform awareness | Drives ecosystem adoption |
| **Share to unlock** | Various apps | Zero cost, maximum virality | Trade revenue for distribution |

### AI App Revenue Benchmarks (2024-2025)

- AI apps generated **$4.5 billion** in IAP revenue (136% YoY growth)
- Revenue per install: **$0.63+** after 60 days for AI apps (2x overall median)
- Hard paywalls convert at **12.11%** vs freemium at **2.18%** (6x difference)
- AI apps earn **41% more per user** but churn 30% faster
- Best performing model: **Hybrid** -- early subscription gating + selective free access + usage-based layers

### Recommended Monetization for LinkChat

For a link-in-bio platform, the roast feature should serve dual purposes:

1. **Viral acquisition tool** (free, shareable, drives new users to the platform)
2. **Premium feature upsell** (basic roast free, full personality analysis as premium)

Specific strategy:
- Free: See your roast (1 paragraph) + 3 personality traits
- Share to unlock: Additional categories (love life, spirit animal, etc.)
- Premium ($1-2 one-time or included in paid plan): Full analysis, downloadable card, roast history, pair comparisons

---

## 7. Actionable Insights for LinkChat

### The Unique Advantage

LinkChat already has the data. Unlike every other roast app that needs to scrape, API-call, or ask users to upload, a link-in-bio platform has:
- User's bio text
- Profile picture
- All their links (social profiles, projects, content)
- Their chosen aesthetic/theme
- Their link click data and analytics
- Visitor demographics

This means you can generate roasts that are MORE specific and accurate than any competitor, with ZERO additional data collection friction.

### Proposed Feature: "Roast My Page"

#### Core Concept
An AI-powered personality analysis and roast based on someone's link-in-bio page. Any visitor can request a roast of any public LinkChat page, and the page owner can share their roast.

#### Output Sections (Inspired by Wordware but adapted for link-in-bio)

1. **The Roast** (always free, always at the top) -- 2-3 sentence brutal-but-funny takedown of their entire online persona based on their links, bio, and aesthetic choices
2. **Vibe Check Score** -- 0-100 score with letter grade on overall link-in-bio quality
3. **Link Personality Type** -- A fun archetype ("The Hustler", "The Aesthetic Queen", "The Side Project Graveyard", "The LinkedIn Warrior", etc.)
4. **Red Flags** -- What their link choices say about them that they wish you didn't notice
5. **Best Link** -- The one link that actually slaps, with explanation
6. **Worst Link** -- The one link they should delete immediately
7. **Spirit Platform** -- Which social platform they truly belong on based on their vibe
8. **Celebrity Page Match** -- "Your page gives [celebrity] energy"
9. **Bio Autopsy** -- Dissection of their bio text choices
10. **Visitor's First Impression** -- What someone thinks in the first 3 seconds

#### Shareable Card Design

Generate a 1080x1080 card (Instagram-ready) and 1200x630 card (Twitter/OG-ready) containing:
- User's profile picture
- Their Vibe Check Score (large, prominent)
- Link Personality Type
- The Roast (1-2 sentences)
- LinkChat branding/watermark
- QR code or short URL to their page

#### Viral Loop Design

```
Page owner clicks "Roast My Page"
    --> Gets personalized roast + score
        --> Downloads shareable card + gets unique URL
            --> Shares on Instagram/TikTok/Twitter
                --> Friends see it, want their own
                    --> Friends create LinkChat pages to get roasted
                        --> New users, new pages, new roasts
                            --> Loop repeats
```

Critical addition: **"Roast Their Page"** -- visitors can also generate roasts of OTHER people's pages. This creates a second viral vector where people roast their friends' pages and share the results.

#### Implementation Priority (6-Day Sprint)

| Day | Task |
|-----|------|
| Day 1 | Data extraction logic (parse page content into structured signals), AI prompt engineering |
| Day 2 | Roast generation API (structured JSON output), streaming UI |
| Day 3 | Results page UI (sections, score visualization, animations) |
| Day 4 | Shareable card generation (Satori/Vercel OG), OG meta tags |
| Day 5 | Share flow (one-click share to Twitter, download card, copy link), rate limiting |
| Day 6 | Polish, paywall logic, analytics tracking, deploy |

#### Technical Approach for LinkChat

- **Data source**: Read directly from your own database (user's page data, bio, links, theme)
- **AI model**: Claude (best at nuanced humor + structured output) via Anthropic API
- **Prompt chain**:
  1. Extract personality signals from page data
  2. Generate roast + analysis in structured JSON
  3. Format for display
- **Image generation**: @vercel/og with Satori for shareable cards
- **Caching**: Cache roast results per user (regenerate on demand, not on every visit)
- **Rate limiting**: 1 free roast per page per day for visitors, unlimited for page owners

### Differentiation Opportunities

1. **"Roast My Page" vs "Roast My Profile"** -- no other roast tool focuses on link-in-bio pages. This is an unclaimed niche.
2. **Dual-target virality** -- both page owners AND visitors can generate roasts
3. **Built-in distribution** -- the roast links back to the LinkChat page, driving traffic
4. **Actionable humor** -- "Your page would be better if..." combines entertainment with genuine value
5. **Pair comparison** -- "Who has the better page?" comparison roast between two users
6. **Roast history** -- Track how your page improves over time (gamification)
7. **Seasonal roasts** -- Different roast styles for holidays, trends, cultural moments

---

## 8. Risk Assessment

### Risks to Monitor

| Risk | Severity | Mitigation |
|------|----------|------------|
| Offensive content | High | Strict prompt engineering, content filtering, tone guidelines ("edgy not cringy") |
| API costs at scale | Medium | Cache aggressively, rate limit, use paywall as cost control lever (Wordware's toggle strategy) |
| Legal/privacy | Low | Only analyze public page data you already own, no scraping external profiles |
| Trend saturation | Medium | Differentiate through link-in-bio niche, don't be "another Twitter roaster" |
| Single-use engagement | Medium | Add pair comparisons, roast history, seasonal refreshes to drive repeat usage |
| Infrastructure overload | Medium | Edge caching, queue system for generation, graceful degradation |

### Content Safety Guidelines

Based on Wordware's approach and industry best practices:
- Attack behaviors and choices, never identity or appearance
- Reference specific content from the page (not generic insults)
- Include a genuine compliment within every roast
- Avoid topics: mental health, body image, sexuality, race, religion
- Maximum "savagery level" should feel like a clever friend, not a bully
- Allow users to regenerate if they don't like the result
- Provide an option to delete/hide their roast

---

## Appendix: Key URLs and References

### Wordware
- Product: https://twitter.wordware.ai/
- GitHub (open source): https://github.com/wordware-ai/twitter
- Blog post: https://blog.wordware.ai/twitter-roast-ai-with-llm-orchestration
- Founder's launch story: https://kozera.substack.com/p/story-of-the-legendary-launch-wordware
- Growth case study: https://www.willyshinn.com/p/strategy-spotlight-from-0-to-4-million

### Competitor Products
- Monica Roast Master: https://roast.monica.im/
- PleaseRoast: https://pleaseroast.com/
- Insta Personality: https://instapersonality.gcoapps.com/
- Roast vs Boast: https://roast-vs-boast.sider.ai/
- RoastLinkedIn: https://roastlinkedin.com/
- LinkedinRoaster by Taplio: https://linkedin-roaster.taplio.com/
- RoastGit: https://www.roastgit.in/
- GitHub Roast: https://github-roast.pages.dev/
- RoastedBy.ai: https://www.roastedby.ai/
- ROAST Dating: https://roast.dating/
- RoastMyResume: https://www.roast-my-resume.com/

### Technical References
- Vercel OG Image Generation: https://vercel.com/docs/og-image-generation
- Satori (HTML/CSS to SVG): https://github.com/vercel/satori

### Viral Format Precedents
- Receiptify (Spotify receipt format): https://receiptifyinsights.com/
- Spotify Wrapped (annual shareable cards)
- 16Personalities MBTI: https://www.16personalities.com/
