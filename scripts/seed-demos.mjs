#!/usr/bin/env node
// Emits idempotent SQL to seed the four demo profiles.
// Run: node scripts/seed-demos.mjs > /tmp/demos.sql
//      pnpm exec wrangler d1 execute linkchat-auth --remote --file=/tmp/demos.sql
//
// Avatars:
//   - DiceBear "micah" style — colorful, Discord/illustration-quality
//     portraits with persona-tinted backgrounds and varied seeds.
//
// Project images:
//   - Google S2 favicon endpoint at sz=256 → real site logos. Stable,
//     no auth required, always 200.

const NOW = Date.now();
const DEMO_USER_ID = "demo-user-karte-cc";
const DEMO_EMAIL = "demo@karte.cc";

function q(value) {
  if (value === null || value === undefined) return "NULL";
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "1" : "0";
  return "'" + String(value).replace(/'/g, "''") + "'";
}

function json(obj) {
  return q(JSON.stringify(obj));
}

function logo(domain) {
  // Google's S2 favicon endpoint serves the highest-resolution icon a
  // site advertises (PWA / apple-touch-icon, up to 256px). No auth,
  // always 200, stable.
  return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=256";
}

// Discord-style portrait avatars. `micah` is colorful and expressive
// — looks closer to hand-illustrated than auto-generated initials.
// Force a smiling / pleased expression so every persona reads warm
// regardless of seed: smile mouth + raised eyebrows.
function avatar(seed, bg) {
  return (
    "https://api.dicebear.com/9.x/micah/svg?seed=" +
    encodeURIComponent(seed) +
    "&backgroundColor=" +
    bg +
    "&backgroundType=gradientLinear,solid" +
    "&mouth=smile,laughing,smirk" +
    "&eyebrows=up,upDown" +
    "&eyes=eyes,smiling"
  );
}

const personas = [
  {
    slug: "naval",
    displayName: "Naval Ravikant",
    bio: "Investor and writer. Co-founder of AngelList. Author of the Almanack. Writes one or two tweets every few months and they all get screenshotted.",
    location: "San Francisco",
    avatarUrl: avatar("naval-zen-investor", "f2c879,fff5d6"),
    petUrl: "https://api.dicebear.com/9.x/lorelei/svg?seed=naval-ravikant&backgroundColor=transparent",
    theme: { presetId: "paper" },
    accent: "#f2c879",
    chatPrompt: "You answer as Naval Ravikant: investor, AngelList co-founder, author of The Almanack of Naval Ravikant. Voice: aphoristic, terse, calm. Short sentences. Recurring themes: leverage (labor / capital / code), specific knowledge, wealth vs status, the long game, happiness as a skill. Honest when something is uncertain. If asked about new investments, redirect to AngelList syndicates.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/naval" },
      { title: "AngelList", url: "https://www.angellist.com" },
      { title: "The Almanack", url: "https://www.navalmanack.com" },
      { title: "Personal site", url: "https://nav.al" },
      { title: "Podcast archive", url: "https://nav.al/podcast" },
    ],
    projects: [
      {
        title: "AngelList",
        url: "https://www.angellist.com",
        imageUrl: logo("angellist.com"),
        description: "The default OS for startup investing — syndicates, rolling funds, banking for founders. Now powers most US seed deals.",
      },
      {
        title: "The Almanack of Naval Ravikant",
        url: "https://www.navalmanack.com",
        imageUrl: logo("navalmanack.com"),
        description: "A decade of tweets, podcasts, and essays on wealth and happiness, edited by Eric Jorgenson. Free PDF, available everywhere.",
      },
      {
        title: "Spearhead",
        url: "https://spearhead.co",
        imageUrl: logo("spearhead.co"),
        description: "Program (with Naval as a partner) that funds founders becoming angel investors. Builds a network of operators who back the next wave.",
      },
    ],
    info: [
      { type: "text", title: "On wealth", content: "Seek wealth, not money or status. Wealth is assets that earn while you sleep. Money is how we transfer time and wealth. Status is your place in the social hierarchy. Don't seek to be the highest-paid worker — seek to be the owner." },
      { type: "text", title: "On leverage", content: "There are three sources of leverage: labor, capital, and code/media. The last two are permissionless. Code and media are the most accessible leverage available to a young person today — anyone can write a tweet or ship an app. The whole point of leverage is to be lazy intelligently." },
      { type: "text", title: "On happiness", content: "Happiness is a choice and a skill, not something you find. It is the absence of desire. The fewer desires you have, the more present you can be. Most negative emotions are evolutionary holdovers we no longer need. You can choose to put them down." },
      { type: "text", title: "On long-term games", content: "Play long-term games with long-term people. Compound interest works in business, in relationships, and in knowledge. The compounding only works if the people, the products, and the principles persist over decades, not quarters." },
      { type: "text", title: "On specific knowledge", content: "Specific knowledge is knowledge you cannot be trained for. If society can train you, it can train someone else and replace you. Specific knowledge is found by pursuing your genuine curiosity, not by following a paint-by-numbers career." },
      { type: "text", title: "On reading", content: "Read what you love until you love to read. The medium doesn't matter — books, blogs, threads — it's the act of pursuing curiosity that builds the muscle. Mathematics and persuasion are the two skills that compound the most over a lifetime." },
      { type: "faq", title: "Are you taking new investments?", content: "I invest via AngelList syndicates — anyone can join. Direct deals are rare. Subscribe to a syndicate on AngelList and you'll see what I see in real time." },
      { type: "faq", title: "How can I get rich without getting lucky?", content: "Build specific knowledge, take accountability under your own name, and apply leverage. Pick a business model with permissionless leverage. Then play long-term games with long-term people." },
      { type: "faq", title: "Where do I start reading you?", content: "The Almanack of Naval Ravikant — free PDF at navalmanack.com. Edited by Eric Jorgenson, it's the cleanest possible compression of a decade of writing." },
      { type: "faq", title: "Do you meditate?", content: "Yes. The best form of meditation, in my experience, is just sitting and doing nothing. Boredom is the antechamber to insight. Phones killed boredom; reclaim it." },
      { type: "faq", title: "What books should every founder read?", content: "Influence by Cialdini, Sapiens by Harari, The Beginning of Infinity by Deutsch, Antifragile by Taleb, and the collected essays of Charlie Munger. Read them slowly. Re-read." },
    ],
  },
  {
    slug: "levelsio",
    displayName: "Pieter Levels",
    bio: "Indie hacker. Built 100+ startups, kept the ones that worked: Nomad List, RemoteOK, PhotoAI, InteriorAI. Public MRR. Solo by design. AI maximalist.",
    location: "Lisbon",
    avatarUrl: avatar("levelsio-indie-hacker", "67e8f9,3b82f6"),
    petUrl: "https://api.dicebear.com/9.x/lorelei/svg?seed=pieter-levels&backgroundColor=transparent",
    theme: { presetId: "aurora" },
    accent: "#67e8f9",
    chatPrompt: "You answer as Pieter Levels (levelsio): indie hacker. Voice: blunt, casual, lots of 'ok', 'lol', 'imo', occasional all-lowercase. Big on 'ship fast, share MRR, work from anywhere'. Strong opinions on AI tools, consumer AI as the new app store, building solo, ignoring VC. If asked about MRR, give the public number. If asked for advice, push them to start something today.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/levelsio" },
      { title: "Personal site", url: "https://levels.io" },
      { title: "Nomad List", url: "https://nomadlist.com" },
      { title: "RemoteOK", url: "https://remoteok.com" },
      { title: "PhotoAI", url: "https://photoai.com" },
      { title: "InteriorAI", url: "https://interiorai.com" },
    ],
    projects: [
      {
        title: "PhotoAI",
        url: "https://photoai.com",
        imageUrl: logo("photoai.com"),
        description: "Train a model on your face, generate professional photos in any setting. Solo built, $80k+ MRR. The poster child for solo-AI products.",
      },
      {
        title: "Nomad List",
        url: "https://nomadlist.com",
        imageUrl: logo("nomadlist.com"),
        description: "The largest community of digital nomads. Ranks 1,000+ cities by cost, weather, internet, safety. Open page: every MRR + visitor number is public.",
      },
      {
        title: "RemoteOK",
        url: "https://remoteok.com",
        imageUrl: logo("remoteok.com"),
        description: "Remote-only job board for tech, design, marketing. Pioneered transparent salary listings. Still mostly the original PHP codebase.",
      },
      {
        title: "InteriorAI",
        url: "https://interiorai.com",
        imageUrl: logo("interiorai.com"),
        description: "Restyle any room in any aesthetic. Drop a photo, pick a vibe, get four renders in seconds. Built in a weekend, scaled with PhotoAI.",
      },
    ],
    info: [
      { type: "text", title: "On shipping", content: "Just ship. Done is better than perfect. Most of my startups are launched in a weekend with $200 in domain names and a Stripe checkout. If it sticks, you iterate. If not, you kill it. Either way you learned something. Most people are paralyzed by polishing — ship the ugly version first." },
      { type: "text", title: "On working solo", content: "I don't hire and I don't raise. I run everything solo — maybe a contractor here and there. Less coordination, more shipping. The internet rewards consistency more than scale. A team of one with AI is more productive than a team of ten with meetings." },
      { type: "text", title: "On build-in-public", content: "Tweeting the MRR chart works. People root for you, give you feedback, share your stuff. The downside (haters) is way smaller than the upside (distribution). Build in public, charge from day one. Free customers churn the worst." },
      { type: "text", title: "On AI products", content: "Solo founders + AI APIs is the new App Store. You can ship a real product in a week now. The bottleneck is no longer engineering — it's taste and distribution. Pick a problem you have, build the smallest fix, charge $20/mo. The unit economics are insane right now." },
      { type: "text", title: "On distribution", content: "Twitter is the cheapest customer acquisition in tech history if you build in public. Daily posting + screenshots of MRR + transparent failures = a flywheel. SEO is a bonus, not a strategy. Hand-craft your audience for the first 10k followers." },
      { type: "text", title: "On the daily routine", content: "Wake when I wake. Coffee. Code. Tweet. Lunch outside. Code. Walk. Sleep. No meetings. No standups. No managers. The freedom to structure a day this way is the whole point of running a one-person business." },
      { type: "faq", title: "How much MRR do you make?", content: "All public on nomadlist.com/open and photoai.com/open. PhotoAI alone is well into 6 figures monthly. Everything updates live, no spin. Total across products: north of $200k/mo last I checked." },
      { type: "faq", title: "Are you hiring?", content: "No. Solo founder by design. Best way to work with me: build something I would use, ping me on X. I do swap notes with other indie hackers though — happy to chat if you're shipping." },
      { type: "faq", title: "What stack do you use?", content: "PHP + jQuery + KISS. Server-rendered, no frameworks. Same stack since 2014. Boring and proud. The 'best' stack is the one you ship with. Hosting is single-server. SQLite for most things." },
      { type: "faq", title: "Where do you live?", content: "Lisbon mostly. I travel less than I used to. Found a city I actually like — weather, food, internet, taxes are all reasonable. Highly recommend." },
      { type: "faq", title: "How do I get started as a solo founder?", content: "Pick a problem you yourself have. Build the smallest thing that solves 60% of it. Charge for it on day one. Tweet about the journey. Most of the people who never start are stuck on step one — overthinking the problem." },
      { type: "faq", title: "Are you an AI maximalist?", content: "Yes, sincerely. AI APIs gave solo founders the leverage that only big teams used to have. If you're not building with AI today, you're shipping next year's product slower than someone who started in 2023." },
    ],
  },
  {
    slug: "pg",
    displayName: "Paul Graham",
    bio: "Programmer, writer, investor. Co-founded Y Combinator. Wrote the essays. Still writing them — How to Do Great Work and Founder Mode are recent.",
    location: "Cambridge, MA",
    avatarUrl: avatar("paul-graham-essayist", "fef3c7,f5f5dc"),
    petUrl: "https://api.dicebear.com/9.x/lorelei/svg?seed=paul-graham&backgroundColor=transparent",
    theme: { presetId: "paper" },
    accent: "#a8a29e",
    chatPrompt: "You answer as Paul Graham: YC co-founder, essayist at paulgraham.com. Voice: clear, plain, slightly dry. Short paragraphs in real life, similar here. Frequently reference: 'Do things that don't scale', 'Make something people want', default-alive, founder mode, the bus ticket theory, How to Do Great Work. Honest when something is uncertain. Quotes you would never say: any startup buzzword.",
    links: [
      { title: "Essays", url: "http://www.paulgraham.com/articles.html" },
      { title: "Twitter / X", url: "https://twitter.com/paulg" },
      { title: "Y Combinator", url: "https://www.ycombinator.com" },
      { title: "Hacker News", url: "https://news.ycombinator.com" },
      { title: "How to Do Great Work", url: "http://www.paulgraham.com/greatwork.html" },
    ],
    projects: [
      {
        title: "Y Combinator",
        url: "https://www.ycombinator.com",
        imageUrl: logo("ycombinator.com"),
        description: "Seed accelerator that funded Airbnb, Stripe, Dropbox, Reddit, Coinbase, Doordash, and ~5,000 other startups since 2005. Still the default for early founders.",
      },
      {
        title: "Hacker News",
        url: "https://news.ycombinator.com",
        imageUrl: logo("ycombinator.com"),
        description: "A social-news site for the intellectually curious. Read by founders, programmers, and people who like good writing. Twenty years and still readable.",
      },
      {
        title: "How to Do Great Work",
        url: "http://www.paulgraham.com/greatwork.html",
        imageUrl: logo("paulgraham.com"),
        description: "A 2023 essay distilling everything I've noticed about how people end up doing great work. The longest essay I've written, on purpose.",
      },
      {
        title: "Viaweb (sold to Yahoo!)",
        url: "http://www.paulgraham.com/vwfaq.html",
        imageUrl: logo("paulgraham.com"),
        description: "One of the first web applications: an online store builder. Acquired by Yahoo! in 1998 and became Yahoo! Store. Source of most of the early lessons.",
      },
    ],
    info: [
      { type: "text", title: "Do things that don't scale", content: "Almost every successful startup begins by doing things that don't scale: recruiting users one by one, doing things manually, providing absurdly good support. Software scales; the early company often doesn't, and shouldn't try to. The most common reason founders resist unscalable work is laziness disguised as strategy." },
      { type: "text", title: "Make something people want", content: "The YC motto. Most failed startups have an answer to 'why we'll succeed' that's 90% theory and 10% evidence. The reverse ratio is the goal. Talk to users. Watch them use the thing. Then watch them not use it. Then ask why." },
      { type: "text", title: "Default alive vs default dead", content: "A startup is default alive if, on its current growth and burn rate, it will reach profitability before running out of money. Most founders convince themselves they're alive when they're dead. Run the calculation. Then run it again with assumptions you'd defend in court." },
      { type: "text", title: "Founder mode", content: "The standard advice — hire good people and trust them — works only if 'good people' means 'people who can be trusted with this thing.' That's a smaller set than the advice implies. Founders should stay involved deeper than they're told to. The companies that have stayed great were run by founders who never fully delegated." },
      { type: "text", title: "On how to do great work", content: "Choose a field you have a natural aptitude for, that interests you most, and that offers the most scope to do great work. Then do something hard. Try to notice what other people don't. Stay in it longer than is reasonable. Bus ticket collectors are not eccentrics; they're prototypes." },
      { type: "text", title: "Bus ticket theory of genius", content: "The people who do great work are often the ones who care more about something obscure than seems reasonable. Their interest is the only reliable predictor of which problems they'll be capable of solving. The 'why' before the 'how'." },
      { type: "text", title: "On startups that look stupid", content: "Most genuinely good startup ideas look bad initially. If they looked obviously good, somebody would already be doing them. Idiotically simple, idiotically narrow, or idiotically grand — all three are signatures of an idea worth pursuing." },
      { type: "faq", title: "How do I apply to YC?", content: "Apply at ycombinator.com/apply. The application is short by design. Write the way you'd talk to a friend about what you're building. Don't pitch — describe. Specifics beat adjectives every time." },
      { type: "faq", title: "Do you still write?", content: "Yes — paulgraham.com/articles.html has the full archive. New essays come out when an idea is actually new, not on a schedule. The good ones I keep editing for months." },
      { type: "faq", title: "What essay should I read first?", content: "If you've never read me, start with 'How to Start a Startup' (2005). Then 'Do Things That Don't Scale' (2013). If you have time, 'How to Do Great Work' (2023) is the longest and probably the most useful." },
      { type: "faq", title: "How do you spot great founders?", content: "Earnestness. The good ones care about the problem more than the company. They give detailed answers to specific questions and admit ignorance freely. The bad ones give buzzwords." },
    ],
  },
  {
    slug: "karpathy",
    displayName: "Andrej Karpathy",
    bio: "AI researcher, educator. Back at OpenAI working on midtraining and synthetic data. Building Eureka Labs on the side. Built nanoGPT, Zero-to-Hero, micrograd. Coined 'vibe coding'. Previously Director of AI at Tesla.",
    location: "Stanford, CA",
    avatarUrl: avatar("karpathy-ai-teacher", "a78bfa,7c3aed"),
    petUrl: "https://api.dicebear.com/9.x/lorelei/svg?seed=andrej-karpathy&backgroundColor=transparent",
    theme: { presetId: "aurora" },
    accent: "#a78bfa",
    chatPrompt: "You answer as Andrej Karpathy: AI researcher, currently back at OpenAI building a team on midtraining and synthetic data generation. Founder of Eureka Labs (AI + education) — running on the side. Creator of nanoGPT, micrograd, the Zero-to-Hero series. Voice: deeply technical but accessible, fond of analogies (LLM as a compressed wikipedia, software 1.0 / 2.0 / 3.0, vibe coding, LLMs as the new OS). Patient teacher. If asked something speculative, mark it as a guess.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/karpathy" },
      { title: "Personal site", url: "https://karpathy.ai" },
      { title: "GitHub", url: "https://github.com/karpathy" },
      { title: "YouTube — Zero to Hero", url: "https://www.youtube.com/@AndrejKarpathy" },
      { title: "Eureka Labs", url: "https://eurekalabs.ai" },
    ],
    projects: [
      {
        title: "Eureka Labs",
        url: "https://eurekalabs.ai",
        imageUrl: logo("eurekalabs.ai"),
        description: "AI + education startup. Building AI-native teaching assistants for technical content, starting with deep learning. First course: LLM101n.",
      },
      {
        title: "nanoGPT",
        url: "https://github.com/karpathy/nanoGPT",
        imageUrl: null,
        description: "The simplest, fastest repo for training/finetuning medium-sized GPTs. ~300 lines of code that produce real models. Reproduces GPT-2 on a single node.",
      },
      {
        title: "Neural Networks: Zero to Hero",
        url: "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
        imageUrl: null,
        description: "A YouTube course that builds a backprop autodiff library, then a transformer, then a GPT, from scratch. ~10 long lectures, no slides, all code. Free.",
      },
      {
        title: "micrograd",
        url: "https://github.com/karpathy/micrograd",
        imageUrl: null,
        description: "A tiny scalar-valued autograd engine in ~100 lines of pure Python. The smallest possible thing that's still a neural network library.",
      },
    ],
    info: [
      { type: "text", title: "On LLMs as compression", content: "You can think of an LLM as a lossy compression of the internet. The pretraining data is the message, the weights are the compressed representation. Inference is decompression conditioned on a prompt. The compression ratio is what makes LLMs feel like they 'know' so much in so few parameters." },
      { type: "text", title: "On software 1.0 / 2.0 / 3.0", content: "Software 1.0 is code you write. 2.0 is weights you train. 3.0 is prompts you set. The boundary keeps moving — more and more of what a program does is decided at training time, not coding time. We're now firmly in the 3.0 era for many tasks; 1.0 still owns the system-level stuff." },
      { type: "text", title: "On the bitter lesson", content: "The biggest predictor of progress in AI has been compute and data, not clever architectures. Sutton's 'bitter lesson' keeps being right: general methods that leverage compute win over hand-crafted ones. Architecture matters at the margin; scale matters in the limit." },
      { type: "text", title: "On vibe coding", content: "When you mostly describe what you want and the LLM mostly writes the code, you're not really programming anymore — you're vibing. Useful but dangerous: you accept code you wouldn't have written. Best for prototypes, throwaways, and places where 'mostly right' is good enough. Not yet for production-critical paths." },
      { type: "text", title: "On the LLM as an OS", content: "The base model is the kernel. Tools are syscalls. The context window is RAM. Multi-agent setups are processes. Thinking of LLM apps in OS terms helps reason about why some things are slow, why some are hard, and what the abstractions should look like. The 'LLM OS' will eventually have a filesystem, a scheduler, and proper IPC." },
      { type: "text", title: "On the midtraining era", content: "Pretraining is mostly solved at the frontier. The interesting frontier now is midtraining: how to teach a base model new skills, new behaviors, new factuality, without retraining from scratch. Synthetic data is a huge lever — generate a million high-quality examples, fine-tune, ship." },
      { type: "text", title: "On learning AI in 2025", content: "Don't start with papers. Start with code. micrograd → nanoGPT → a real fine-tune on a single GPU. Then read whatever paper you want; you'll have intuition the paper assumes. Most online ML courses are still backprop-first; modern ML is data-and-compute-first." },
      { type: "faq", title: "Are you back at OpenAI?", content: "Yes. I returned to OpenAI to build a small team working on midtraining and synthetic data generation. Eureka Labs continues on the side — it's a long-term bet on AI-native education." },
      { type: "faq", title: "Are you accepting students?", content: "Eureka Labs is the public answer. The first course is LLM101n — sign up at eurekalabs.ai. Otherwise the YouTube playlist is free and covers most of the same ground at a deeper level." },
      { type: "faq", title: "Where should I start with deep learning?", content: "The Zero-to-Hero YouTube playlist. Start with micrograd (one lecture), then build up to GPT. No prerequisites beyond comfortable Python. Watch on 1x, code along, don't skip the exercises. It'll take ~30 hours and you'll understand transformers better than 90% of people who use them." },
      { type: "faq", title: "What hardware should I learn on?", content: "A single consumer GPU (RTX 4090) gets you very far. For learning, even free Colab is enough — nanoGPT trains a tiny Shakespeare model in minutes. The constraint is rarely hardware; it's reps." },
      { type: "faq", title: "What's the future of programming?", content: "More and more of it will be done in English, less in C++. But the people who can read both will be the ones building the most interesting systems. Don't stop learning the low-level stuff just because you can vibe code now." },
    ],
  },
];

const out = [];
out.push("-- Seed: 4 demo profiles. Idempotent (DELETE before INSERT).");
out.push("");

out.push("DELETE FROM user WHERE id = " + q(DEMO_USER_ID) + ";");
out.push(
  "INSERT INTO user (id, name, email, emailVerified, image, createdAt, updatedAt) VALUES (" +
    [q(DEMO_USER_ID), q("Karte Demos"), q(DEMO_EMAIL), 1, "NULL", NOW, NOW].join(", ") +
    ");",
);
out.push("");

for (const p of personas) {
  const pageId = "demo-page-" + p.slug;
  out.push("-- " + p.displayName);
  out.push("DELETE FROM links WHERE pageId = " + q(pageId) + ";");
  out.push("DELETE FROM projects WHERE pageId = " + q(pageId) + ";");
  out.push("DELETE FROM infoBlocks WHERE pageId = " + q(pageId) + ";");
  out.push("DELETE FROM pages WHERE id = " + q(pageId) + ";");

  const themeWithAccent = { presetId: p.theme.presetId, accentColor: p.accent };
  out.push(
    "INSERT INTO pages (id, userId, slug, displayName, bio, avatarUrl, themeConfig, published, chatEnabled, chatSystemPrompt, dmMode, encyclopediaEnabled, roastEnabled, newspaperEnabled, location, petUrl, petEnabled, createdAt, updatedAt) VALUES (" +
      [
        q(pageId),
        q(DEMO_USER_ID),
        q(p.slug),
        q(p.displayName),
        q(p.bio),
        q(p.avatarUrl),
        json(themeWithAccent),
        1,
        1,
        q(p.chatPrompt),
        q("off"),
        1,
        1,
        1,
        q(p.location),
        q(p.petUrl),
        1,
        NOW,
        NOW,
      ].join(", ") +
      ");",
  );

  p.links.forEach((l, i) => {
    out.push(
      "INSERT INTO links (id, pageId, title, url, sortOrder, enabled) VALUES (" +
        [q("demo-link-" + p.slug + "-" + i), q(pageId), q(l.title), q(l.url), i, 1].join(", ") +
        ");",
    );
  });

  p.projects.forEach((pr, i) => {
    out.push(
      "INSERT INTO projects (id, pageId, title, url, imageUrl, description, sortOrder, enabled) VALUES (" +
        [
          q("demo-project-" + p.slug + "-" + i),
          q(pageId),
          q(pr.title),
          q(pr.url),
          q(pr.imageUrl),
          q(pr.description),
          i,
          1,
        ].join(", ") +
        ");",
    );
  });

  p.info.forEach((ib, i) => {
    out.push(
      "INSERT INTO infoBlocks (id, pageId, type, title, content, sortOrder) VALUES (" +
        [
          q("demo-info-" + p.slug + "-" + i),
          q(pageId),
          q(ib.type),
          q(ib.title),
          q(ib.content),
          i,
        ].join(", ") +
        ");",
    );
  });

  out.push("");
}

process.stdout.write(out.join("\n") + "\n");
