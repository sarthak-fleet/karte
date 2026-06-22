#!/usr/bin/env node
// Emits idempotent SQL to seed the four demo profiles.
// Run: node scripts/seed-demos.mjs > /tmp/demos.sql
//      pnpm exec wrangler d1 execute linkchat-auth --remote --file=/tmp/demos.sql
//
// Avatars: public profile avatars where available, via Unavatar. This keeps
// the top-left identity and roaming image visually aligned with how the
// demo person actually looks. Falls back at render-time if the host fails.
//
// Project images: Google S2 favicon endpoint at sz=256 → real site
// logos. Stable, no auth required.
//
// Content is sourced from each persona's public surfaces (nav.al,
// levels.io, paulgraham.com, karpathy.ai). Quotes are paraphrases of
// publicly-shared positions, not invented statements.

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
  return "https://www.google.com/s2/favicons?domain=" + domain + "&sz=256";
}

function publicAvatar(handle) {
  return "https://unavatar.io/x/" + encodeURIComponent(handle);
}

const personas = [
  {
    slug: "naval",
    displayName: "Naval Ravikant",
    bio: "Investor, writer, founder. Co-founded AngelList (2010) with Babak Nivi after Epinions and Vast.com. Author of The Almanack of Naval Ravikant — a free PDF that became a generation's intro to wealth, leverage, and how to think. Early investor in Twitter, Uber, Postmates, Notion, OpenDoor, Stack Overflow, and a few hundred others. The model for 'aphorism Twitter' before that was a category. Two skills matter most: how to build, and how to sell.",
    location: "San Francisco",
    avatarUrl: publicAvatar("naval"),
    petUrl: publicAvatar("naval"),
    theme: { presetId: "paper" },
    accent: "#f2c879",
    chatPrompt: "You answer as Naval Ravikant. Voice: aphoristic, terse, calm. Short sentences. Recurring beats: the only two skills (build and sell), leverage (labor / capital / code/media), specific knowledge, wealth vs status, happiness as a skill, long-term games with long-term people, vibe coding + AI as a motorcycle for the mind, David Deutsch's epistemology, ambient iteration, simplicity through refinement. Honest when something is uncertain. Don't give financial advice; if pressed, redirect to AngelList syndicates.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/naval" },
      { title: "AngelList", url: "https://www.angellist.com" },
      { title: "The Almanack", url: "https://www.navalmanack.com" },
      { title: "Personal site", url: "https://nav.al" },
      { title: "Podcast archive", url: "https://nav.al/podcast" },
      { title: "Spearhead", url: "https://spearhead.co" },
      { title: "Airchat", url: "https://www.air.chat" },
    ],
    projects: [
      {
        title: "AngelList",
        url: "https://www.angellist.com",
        imageUrl: logo("angellist.com"),
        description: "The default OS for startup investing — syndicates, rolling funds, banking for founders. Now powers most US seed deals. Founded 2010 with Babak Nivi.",
      },
      {
        title: "The Almanack of Naval Ravikant",
        url: "https://www.navalmanack.com",
        imageUrl: logo("navalmanack.com"),
        description: "A decade of tweets, podcasts, and essays on wealth and happiness, edited by Eric Jorgenson. Free PDF, available everywhere. The compressed reading list.",
      },
      {
        title: "Spearhead",
        url: "https://spearhead.co",
        imageUrl: logo("spearhead.co"),
        description: "Program that funds founders becoming angel investors. Builds a network of operators who back the next wave. With Sam Lessin and Naval as partners.",
      },
      {
        title: "Airchat",
        url: "https://www.air.chat",
        imageUrl: logo("air.chat"),
        description: "Voice-first social experiment. People talk, the app transcribes. An attempt to bring sincerity and pace back to the feed. With Brian Norgard.",
      },
      {
        title: "Naval Podcast",
        url: "https://nav.al/podcast",
        imageUrl: logo("nav.al"),
        description: "Long-form conversations on wealth, happiness, philosophy, and how to think clearly. The episodes with Babak and the solo ones are the canonical entry points.",
      },
    ],
    info: [
      { type: "text", title: "The two skills", content: "There are only two skills you have to have in life: how to build, and how to sell. If you can do both, you can build a startup. If you can do just one, find a co-founder who has the other." },
      { type: "text", title: "On wealth", content: "Seek wealth, not money or status. Wealth is assets that earn while you sleep. Money is how we transfer time and wealth. Status is your place in the social hierarchy. Don't seek to be the highest-paid worker — seek to be the owner." },
      { type: "text", title: "On leverage", content: "There are three sources of leverage: labor, capital, and code/media. The last two are permissionless. Code and media are the most accessible leverage available to a young person today — anyone can write a tweet or ship an app. The whole point of leverage is to be lazy intelligently." },
      { type: "text", title: "On happiness", content: "Happiness is a choice and a skill, not something you find. It is the absence of desire. The fewer desires you have, the more present you can be. Most negative emotions are evolutionary holdovers we no longer need. You can choose to put them down." },
      { type: "text", title: "On long-term games", content: "Play long-term games with long-term people. Compound interest works in business, in relationships, and in knowledge. The compounding only works if the people, the products, and the principles persist over decades, not quarters." },
      { type: "text", title: "On specific knowledge", content: "Specific knowledge is knowledge you cannot be trained for. If society can train you, it can train someone else and replace you. Specific knowledge is found by pursuing your genuine curiosity, not by following a paint-by-numbers career." },
      { type: "text", title: "On reading", content: "Read what you love until you love to read. The medium doesn't matter — books, blogs, threads — it's the act of pursuing curiosity that builds the muscle. Mathematics and persuasion are the two skills that compound the most over a lifetime." },
      { type: "text", title: "On David Deutsch", content: "Skip most books. For epistemology, read David Deutsch — full stop. The Beginning of Infinity rewires how you think about knowledge, progress, and what constitutes a good explanation. Good explanations are hard to vary." },
      { type: "text", title: "On AI as leverage", content: "AI is a motorcycle for the mind. Not just automation — transformative leverage. The same way capital let one person command the labor of a thousand, AI lets one person command the cognitive output of many. Vibe coding and personal app stores are the next computing shift." },
      { type: "text", title: "On the team you build", content: "The team you build is the company you build. Hiring is recruiting; recruiting is fundamentally a technology game. Most companies fail at recruiting because they treat it as a process problem instead of a product problem." },
      { type: "text", title: "On simplicity", content: "Good products are hard to vary. Simplicity emerges through refinement, not by starting simple. The simplest solution that works has usually been through 20 iterations of more complex ones that didn't." },
      { type: "faq", title: "Are you taking new investments?", content: "I invest via AngelList syndicates — anyone can join. Direct deals are rare. Subscribe to a syndicate on AngelList and you'll see what I see in real time. I don't do public financial advice." },
      { type: "faq", title: "How can I get rich without getting lucky?", content: "Build specific knowledge, take accountability under your own name, and apply leverage. Pick a business model with permissionless leverage (code or media). Then play long-term games with long-term people. The tweetstorm version of this is on twitter.com/naval." },
      { type: "faq", title: "Where do I start reading you?", content: "The Almanack of Naval Ravikant — free PDF at navalmanack.com. Edited by Eric Jorgenson, it's the cleanest possible compression of a decade of writing. Then the podcast archive at nav.al/podcast." },
      { type: "faq", title: "Do you meditate?", content: "Yes. The best form of meditation, in my experience, is just sitting and doing nothing. Boredom is the antechamber to insight. Phones killed boredom; reclaim it." },
      { type: "faq", title: "What books should every founder read?", content: "Influence by Cialdini, Sapiens by Harari, The Beginning of Infinity by Deutsch (especially this), Antifragile by Taleb, and the collected essays of Charlie Munger. Read them slowly. Re-read." },
      { type: "faq", title: "What's your view on AI?", content: "Net positive, by a lot. The leverage is real; the disruption is real; the panic is mostly cyclical. Focus on what you can build with it, not what might happen because of it. Anyone not building with AI today is shipping next year's product slower than someone who started yesterday." },
      { type: "faq", title: "Should I take VC?", content: "Only if your business genuinely needs the speed VC buys. Most don't. Bootstrapping with code/media leverage is more accessible than ever. If you can ship without capital, you should — your equity compounds and you stay free." },
      { type: "text", title: "Personal history", content: "Born in Delhi, India in 1974. Immigrated to New York with my mother at age 9. Stuyvesant High School. Dartmouth (computer science + economics, 1996). My mother raised my brother and me on her own — the kind of background where the only currency you trust is the one you make yourself. That shaped a lot of the wealth-creation framework." },
      { type: "text", title: "Early ventures", content: "Epinions in 1999 (consumer reviews, sold to Shopping.com 2003 — most of the founders got nothing because of preferred-stock terms, a story I tell as a cautionary tale). Then Vast.com (vertical search). Then Hit Forge. Then AngelList in 2010 — the one that worked." },
      { type: "text", title: "On Babak Nivi", content: "Babak and I co-founded AngelList in 2010. Most of the AngelList ideas — syndicates, the open investor network, founder-first banking — came from Babak's product instinct. The Almanack book pulls from years of conversations between us." },
      { type: "text", title: "Early investments", content: "Twitter (2009), Uber (2010), Postmates, Notion, Stack Overflow, OpenDoor, Clubhouse, and a few hundred others through AngelList syndicates. Most of the returns come from the right tail — a handful of bets carry the portfolio." },
      { type: "text", title: "On Twitter as a medium", content: "Twitter is the best mass-mediated salon ever built. The tweetstorm format (numbered list, one beat per tweet) is the right unit for compressing an essay into a thread that travels. Most of the Almanack started as tweetstorms." },
      { type: "text", title: "On Bitcoin and crypto", content: "Early adopter. Wrote about Bitcoin in 2013-2014 when most people in tech were still ignoring it. The interesting case was never the price — it was the political case: a money you cannot inflate. The interesting case still is. Most of the rest of crypto is theater." },
      { type: "text", title: "On schools vs the internet", content: "Schools are not for learning; they are for credentialing. If you actually want to learn, the internet has the world's best teachers waiting. The leverage gap between an internet-native learner and a school-bound one keeps widening. Mathematics, persuasion, and code are the compounding subjects." },
      { type: "text", title: "On choosing peers", content: "You become the average of the five people you spend the most time with — and on the internet, you choose them. Curate ruthlessly. Block freely. The follow-button and the mute-button are the most important career tools nobody talks about." },
      { type: "text", title: "On status vs wealth", content: "Status is zero-sum. For you to gain, someone else must lose. Wealth is positive-sum — you create value, others benefit. Avoid status games. They look fun until you notice everyone playing them is miserable." },
      { type: "text", title: "More aphorisms", content: "If you can't see yourself working with someone for life, don't work with them for a day. · The world rewards specificity. · Most schools are wage-slave factories. · Reading is faster than listening. Doing is faster than reading. · Inspiration is perishable — act on it the day it arrives. · No one is going to value you more than you value yourself. · The market is asleep; wake it up by being useful." },
      { type: "faq", title: "What do you actually read?", content: "Foundational books over current ones. Sapiens (Harari), The Beginning of Infinity (Deutsch — start here), Antifragile (Taleb), Influence (Cialdini), Charlie Munger's almanack. For fiction: anything Borges. Re-read the good ones rather than chasing new ones." },
      { type: "faq", title: "Do you live in San Francisco?", content: "Mostly, yes. With time in New York and travel. SF is the best place in the world for tech ambition; the worst place for some other things. Trade-offs." },
      { type: "faq", title: "What about India?", content: "India is going to mint more billion-dollar internet companies in the next ten years than the last thirty. The combination of cheap broadband + UPI + a billion-person market hitting smartphone saturation is the most under-appreciated trend of the decade. I'm proud of the country my mother left and excited about where it's heading." },
    ],
  },
  {
    slug: "levelsio",
    displayName: "Pieter Levels",
    bio: "Indie hacker. Solo founder by design. Born in Eindhoven, Netherlands; spent years in Bali and Bangkok before settling in Lisbon. Built 100+ startups in public — kept the ones that worked: Nomad List, RemoteOK, PhotoAI, InteriorAI, Hoodmaps. Combined revenue peaked around $420k/mo in September 2024 (publicly tracked on nomadlist.com/open). No employees, no funding, no meetings. AI maximalist; PHP partisan.",
    location: "Lisbon",
    avatarUrl: publicAvatar("levelsio"),
    petUrl: publicAvatar("levelsio"),
    theme: { presetId: "aurora" },
    accent: "#67e8f9",
    chatPrompt: "You answer as Pieter Levels (levelsio). Voice: blunt, casual, lots of 'ok', 'lol', 'imo', occasional all-lowercase, no fluff. Big on 'ship fast, share MRR, work from anywhere, ignore the haters'. Strong opinions: solo > teams, bootstrap > VC, AI APIs = new App Store, transparency > polish, PHP + jQuery > frameworks. If asked about MRR, give the public number (~$420k/mo combined at peak). If asked for advice, push them to start something today, not next quarter.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/levelsio" },
      { title: "Personal site", url: "https://levels.io" },
      { title: "Nomad List", url: "https://nomadlist.com" },
      { title: "RemoteOK", url: "https://remoteok.com" },
      { title: "PhotoAI", url: "https://photoai.com" },
      { title: "InteriorAI", url: "https://interiorai.com" },
      { title: "Hoodmaps", url: "https://hoodmaps.com" },
      { title: "Open page (MRR)", url: "https://nomadlist.com/open" },
    ],
    projects: [
      {
        title: "PhotoAI",
        url: "https://photoai.com",
        imageUrl: logo("photoai.com"),
        description: "Train a model on your face, generate professional photos in any setting. Solo built. Hit $61k MRR in July 2023; combined revenue across products peaked at $420k/mo in 2024. The poster child for solo-AI products.",
      },
      {
        title: "Nomad List",
        url: "https://nomadlist.com",
        imageUrl: logo("nomadlist.com"),
        description: "The largest community of digital nomads. Ranks 1,000+ cities by cost, weather, internet, safety. Started in 2014 from a Google Sheet. Open page at nomadlist.com/open updates every MRR + visitor number live.",
      },
      {
        title: "RemoteOK",
        url: "https://remoteok.com",
        imageUrl: logo("remoteok.com"),
        description: "Remote-only job board for tech, design, marketing. Pioneered transparent salary listings. Hit $101k MRR in April 2021. Still mostly the original PHP codebase from 2015.",
      },
      {
        title: "InteriorAI",
        url: "https://interiorai.com",
        imageUrl: logo("interiorai.com"),
        description: "Restyle any room in any aesthetic. Drop a photo, pick a vibe, get four renders in seconds. Built in a weekend, scaled with PhotoAI's pipeline.",
      },
      {
        title: "Hoodmaps",
        url: "https://hoodmaps.com",
        imageUrl: logo("hoodmaps.com"),
        description: "Crowdsourced neighborhood maps. Where to live, where to avoid, where the tourists are. Color-coded by vibe. One of the cult-favorite Levels projects.",
      },
      {
        title: "12 Startups in 12 Months",
        url: "https://levels.io/12-startups-12-months",
        imageUrl: logo("levels.io"),
        description: "The 2014 challenge that launched everything. One product per month, in public, with revenue updates on Twitter. Most of the durable products (Nomad List, RemoteOK) came out of this run.",
      },
    ],
    info: [
      { type: "text", title: "On shipping", content: "Just ship. Done is better than perfect. Most of my startups are launched in a weekend with $200 in domain names and a Stripe checkout. If it sticks, you iterate. If not, you kill it. Either way you learned something. Most people are paralyzed by polishing — ship the ugly version first." },
      { type: "text", title: "On working solo", content: "I don't hire and I don't raise. I run everything solo — maybe a contractor here and there. Less coordination, more shipping. The internet rewards consistency more than scale. A team of one with AI is more productive than a team of ten with meetings." },
      { type: "text", title: "On build-in-public", content: "Tweeting the MRR chart works. People root for you, give you feedback, share your stuff. The downside (haters) is way smaller than the upside (distribution). The real work starts when everyone has stopped talking about you. Build in public, charge from day one. Free customers churn the worst." },
      { type: "text", title: "On AI products", content: "Solo founders + AI APIs is the new App Store. You can ship a real product in a week now. I built multiplayer games almost 100% by AI in 2024. The bottleneck is no longer engineering — it's taste and distribution. Pick a problem you have, build the smallest fix, charge $20/mo. The unit economics are insane right now." },
      { type: "text", title: "On distribution", content: "Twitter is the cheapest customer acquisition in tech history if you build in public. Daily posting + screenshots of MRR + transparent failures = a flywheel. SEO is a bonus, not a strategy. Hand-craft your audience for the first 10k followers." },
      { type: "text", title: "On the daily routine", content: "Wake when I wake. Coffee. Code. Tweet. Lunch outside. Code. Walk. Sleep. No meetings. No standups. No managers. The freedom to structure a day this way is the whole point of running a one-person business. Working from cafés around Europe is the bonus." },
      { type: "text", title: "On travel", content: "If I hadn't traveled in my early 20s, I'd be working an office job somewhere boring. Extended travel rewires how you think about cost of living, freedom, and what you actually need. I've lived in 50+ countries via Nomad List. Now mostly Lisbon — found a city I actually like." },
      { type: "text", title: "On VC", content: "Bootstrap. VC is great for capital-intensive businesses; it's wrong for almost everything I build. The moment you take money you lose the freedom to kill a product on a Tuesday because you got bored. Solo + bootstrapped is a feature, not a constraint." },
      { type: "text", title: "On haters", content: "Show MRR publicly and you'll get haters. Tweet a job board update from a beach in Bali and you'll get haters. Worth it. The visibility of haters is also the visibility of users — they're the same dial." },
      { type: "faq", title: "How much MRR do you make?", content: "All public on nomadlist.com/open and photoai.com/open. PhotoAI alone was well into 6 figures monthly. Total across products peaked at ~$420k/mo in September 2024 (mentioned on Lex Fridman podcast). Everything updates live, no spin." },
      { type: "faq", title: "Are you hiring?", content: "No. Solo founder by design. Best way to work with me: build something I would use, ping me on X. I do swap notes with other indie hackers though — happy to chat if you're shipping." },
      { type: "faq", title: "What stack do you use?", content: "PHP + jQuery + KISS. Server-rendered, no frameworks. Same stack since 2014. Boring and proud. The 'best' stack is the one you ship with. Hosting is single-server. SQLite for most things." },
      { type: "faq", title: "Where do you live?", content: "Lisbon mostly. I travel less than I used to. Found a city I actually like — weather, food, internet, taxes are all reasonable. Highly recommend." },
      { type: "faq", title: "How do I get started as a solo founder?", content: "Pick a problem you yourself have. Build the smallest thing that solves 60% of it. Charge for it on day one. Tweet about the journey. Most of the people who never start are stuck on step one — overthinking the problem." },
      { type: "faq", title: "Are you an AI maximalist?", content: "Yes, sincerely. AI APIs gave solo founders the leverage that only big teams used to have. If you're not building with AI today, you're shipping next year's product slower than someone who started in 2023. PhotoAI exists because of this exact shift." },
      { type: "faq", title: "Should I do 12 Startups in 12 Months?", content: "Yes if you've never shipped anything. The challenge isn't to build 12 successful businesses — it's to lose your fear of launching. Most of mine flopped. Two became real businesses. The math works because of the asymmetric upside." },
      { type: "faq", title: "What's your view on remote work?", content: "It's not the future — it's the present, you just haven't moved yet. The companies still demanding RTO are losing their best people quietly. RemoteOK was built on this thesis in 2015 and the thesis got more right every year." },
      { type: "faq", title: "Cheap question — should I quit my job?", content: "If you have 6+ months of runway and a product idea you'd ship even if you didn't quit: yes. If you don't have either: no, build it on the side first. Quitting without a product is not bravery, it's pressure." },
      { type: "text", title: "Personal history", content: "Born in Eindhoven, Netherlands in 1986. Dropped out of business school in Amsterdam. First real job: building Panda (a music recommendation product) which got me a B1 visa to the US. Lost the visa, started traveling. The 12-startups-in-12-months challenge (December 2013 → November 2014) is when the public-builder identity crystallized. Most of the durable products (Nomad List, RemoteOK) came out of that 12-month sprint." },
      { type: "text", title: "On the digital nomad years", content: "Lived in 50+ countries via Nomad List. Long stretches in Bali, Chiang Mai, Bangkok, Lisbon, Berlin. The Chiang Mai years (~2014-2017) were the indie-hacker Mecca era — me, Tyler Tringas, Marc Köhlbrugge, and a dozen others working out of café Maya. Most of what I think about distribution and remote work was learned during that stretch." },
      { type: "text", title: "On the dev stack", content: "MacBook Pro, single 27\" monitor, no fancy keyboard. Server: a single beefy VPS (DigitalOcean, then Hetzner). Backend: PHP + jQuery + plain HTML, SQLite for most stores, MySQL where I need joins. Hosting cost across all products: tiny fraction of MRR. The boring stack is the productive stack." },
      { type: "text", title: "On AI tools", content: "Cursor + Claude is the daily driver. I let the AI write ~70% of the code now. The trick is to give it specific, narrow tasks and review every diff. The 2024 multiplayer game I shipped was almost entirely AI-written. The skill that matters is not coding; it's product taste and prompt taste." },
      { type: "text", title: "On Stripe", content: "Stripe is the reason I can run all these businesses solo. Without Stripe Atlas + Stripe Tax + Stripe Billing, I'd need an accountant. Pay them their cut and never look back. Same for Mux for video, Replicate for AI, Cloudflare for CDN. Pay for the boring boxes; spend your time on the product." },
      { type: "text", title: "Failed startups (the 12 that didn't make it)", content: "Most of the 12 Startups list failed. AvatarAI's Avengers version (DMCA'd). PlayMyInbox. Tubelytics. Go Fucking Do It (productivity-shame app). Luggage Losers. ThisHousedoesNotExist. Each was a few weeks of building + a launch + a few months of slow death. The math works because the survivors compound. Failure is cheap when you ship in a weekend." },
      { type: "text", title: "On Twitter algorithm changes", content: "The 2023-2024 algorithm shifts made indie-hacker tweets reach further than they used to. The 'build in public' meta is now mainstream. The bad news: more competition for the same eyeballs. The good news: the format works." },
      { type: "text", title: "On the haters", content: "Public MRR attracts envy. Tweet from a beach in Bali, attract more envy. I just mute. Engagement is the wrong metric — distribution is. The haters who quote-dunk me also expose me to their audience. Net positive." },
      { type: "text", title: "On crypto", content: "Skeptical. Built one crypto product, didn't take off, didn't try again. The space is mostly speculation; the few useful things (stablecoins for cross-border payments) get drowned out. PayPal/Stripe solve my payment problems. I have no real-world friction crypto fixes." },
      { type: "text", title: "On schedules / productivity", content: "I don't follow productivity advice. No 5am wake-up. No Pomodoro. No standing desk theater. I work when the energy is there, walk away when it isn't, often code for 8 hours straight if the problem is interesting. The freedom to be inconsistent is the actual perk of running a one-person company." },
      { type: "faq", title: "Where do you host?", content: "Single VPS per app on Hetzner (or DigitalOcean for the older ones). Cloudflare on the edge. No Kubernetes, no microservices, no AWS bill that needs decoding. Cost: <2% of revenue. The infra-as-cost-discipline thing is one of the more underrated indie advantages." },
      { type: "faq", title: "What's next?", content: "Honestly: more of the same. Ship products as they occur to me. Public MRR. Travel less. Try not to burn out. The thing about doing this since 2014 is that the rhythm is the product. The specific apps come and go." },
      { type: "faq", title: "Do you read Hacker News?", content: "Daily. Don't post much — the audience is great but the comments turn savage when an indie hacker shows up. Reddit r/SaaS is friendlier. Twitter is where my actual community lives." },
      { type: "faq", title: "What language should a new dev learn?", content: "JavaScript first (web is universal) or Python (AI is universal). Don't fall for the framework-of-the-week trap. Learn one stack deeply enough to ship. The rest is portable." },
    ],
  },
  {
    slug: "pg",
    displayName: "Paul Graham",
    bio: "Programmer, writer, investor. Born 1964; Cornell undergrad, Harvard PhD in computer science. Co-founded Viaweb in 1995 (sold to Yahoo! for ~$50M in 1998 — became Yahoo! Store). Co-founded Y Combinator in 2005 with Jessica Livingston (his wife), Robert Morris, and Trevor Blackwell. Funded Airbnb, Stripe, Dropbox, Reddit, Coinbase, ~5,000 others. Still writing essays at paulgraham.com — How to Do Great Work (2023) and Founder Mode (2024) are the recent big ones. Lisp partisan; designed Arc (which runs Hacker News) and Bel.",
    location: "Cambridge, MA",
    avatarUrl: publicAvatar("paulg"),
    petUrl: publicAvatar("paulg"),
    theme: { presetId: "paper" },
    accent: "#a8a29e",
    chatPrompt: "You answer as Paul Graham: YC co-founder, essayist at paulgraham.com. Voice: clear, plain, slightly dry. Short paragraphs in real life, similar here. Frequent reference points: 'Do things that don't scale', 'Make something people want', default-alive, founder mode, the bus ticket theory, How to Do Great Work, 'mean people fail', startup = growth. Honest when something is uncertain. Quotes you would never say: any startup buzzword, hot-take provocations.",
    links: [
      { title: "Essays", url: "http://www.paulgraham.com/articles.html" },
      { title: "Twitter / X", url: "https://twitter.com/paulg" },
      { title: "Y Combinator", url: "https://www.ycombinator.com" },
      { title: "Hacker News", url: "https://news.ycombinator.com" },
      { title: "How to Do Great Work", url: "http://www.paulgraham.com/greatwork.html" },
      { title: "Founder Mode", url: "http://www.paulgraham.com/foundermode.html" },
      { title: "Arc", url: "http://www.paulgraham.com/arc.html" },
    ],
    projects: [
      {
        title: "Y Combinator",
        url: "https://www.ycombinator.com",
        imageUrl: logo("ycombinator.com"),
        description: "Seed accelerator co-founded with Jessica Livingston, Robert Morris, and Trevor Blackwell in 2005. Funded Airbnb, Stripe, Dropbox, Reddit, Coinbase, Doordash, Twitch, ~5,000 startups. The default for early founders.",
      },
      {
        title: "How to Do Great Work",
        url: "http://www.paulgraham.com/greatwork.html",
        imageUrl: logo("paulgraham.com"),
        description: "A 2023 essay distilling everything I've noticed about how people end up doing great work. The longest essay I've written, on purpose. Choose a field, do something hard, notice what others don't, stay in it longer than is reasonable.",
      },
      {
        title: "Founder Mode",
        url: "http://www.paulgraham.com/foundermode.html",
        imageUrl: logo("paulgraham.com"),
        description: "2024 essay arguing that the standard 'hire good people and trust them' advice works only for a narrow set of 'good people' and that founders should stay involved deeper than they are told to. Coined a phrase that escaped the essay.",
      },
      {
        title: "Hacker News",
        url: "https://news.ycombinator.com",
        imageUrl: logo("ycombinator.com"),
        description: "A social-news site for the intellectually curious. Built on Arc, the Lisp dialect Robert Morris and I designed. Twenty years and still readable. The signal-to-noise survives because of moderation, not algorithms.",
      },
      {
        title: "Viaweb (acquired by Yahoo!)",
        url: "http://www.paulgraham.com/vwfaq.html",
        imageUrl: logo("paulgraham.com"),
        description: "One of the first web applications: an online store builder. Acquired by Yahoo! in 1998 for ~$50M and became Yahoo! Store. Most of the early YC playbook was the Viaweb playbook, written down.",
      },
      {
        title: "Arc / Bel (Lisp dialects)",
        url: "http://www.paulgraham.com/arc.html",
        imageUrl: logo("paulgraham.com"),
        description: "A new Lisp dialect designed for exploratory programming. Arc powers Hacker News. Bel is the formal-spec successor — a meditation on what a simpler Lisp could look like. Niche, but the niche is on purpose.",
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
      { type: "text", title: "On mean people", content: "Mean people fail. Not because the universe is fair, but because meanness corrupts judgment. Founders who treat employees, users, and counterparties as opponents tend to make worse decisions over time. The trait shows up early; it doesn't get better." },
      { type: "text", title: "On relentlessly resourceful", content: "The single trait that separates founders who make it from founders who don't is being relentlessly resourceful. Not smart. Not visionary. Resourceful — meaning: when you're blocked, you find a way through. Mostly through doing the unglamorous work nobody told you was your job." },
      { type: "text", title: "Startup = growth", content: "A startup is a company designed to grow fast. Newly founded does not make a company a startup, nor does it being in technology, or taking VC funding. The only essential thing is growth. Everything we associate with startups follows from this." },
      { type: "text", title: "On Lisp", content: "Lisp is what every programming language is converging toward, slowly. Macros, first-class functions, REPL-driven development — the features arrive in mainstream languages 20-40 years after Lisp had them. Arc and Bel are partly bets on what's still missing." },
      { type: "text", title: "On life is short", content: "Life is short. The way to be happier and more productive is to cut out the things that don't matter and pursue, with intensity, the things that do. Most people fill their lives with the wrong things and then wonder why they're tired." },
      { type: "faq", title: "How do I apply to YC?", content: "Apply at ycombinator.com/apply. The application is short by design. Write the way you'd talk to a friend about what you're building. Don't pitch — describe. Specifics beat adjectives every time." },
      { type: "faq", title: "Do you still write?", content: "Yes — paulgraham.com/articles.html has the full archive. New essays come out when an idea is actually new, not on a schedule. The good ones I keep editing for months. Founder Mode (2024) and How to Do Great Work (2023) are the most recent big ones." },
      { type: "faq", title: "What essay should I read first?", content: "If you've never read me, start with 'How to Start a Startup' (2005). Then 'Do Things That Don't Scale' (2013). If you have time, 'How to Do Great Work' (2023) is the longest and probably the most useful. 'Hackers and Painters' is the entry point for non-startup readers." },
      { type: "faq", title: "How do you spot great founders?", content: "Earnestness. The good ones care about the problem more than the company. They give detailed answers to specific questions and admit ignorance freely. The bad ones give buzzwords and dodge specifics. Relentlessly resourceful is a close second — the trait shows up when you ask about an obstacle." },
      { type: "faq", title: "Should I learn Lisp?", content: "If you want to be a better programmer in any language: yes, at least for a few months. The Lisp brain rewires you. You don't have to use it in production. Most of what Common Lisp could do in 1984 is now showing up in Python or TypeScript or Rust — but having seen the originals helps you recognize the patterns." },
      { type: "faq", title: "What do you think of LLM coding?", content: "It's real and it's going to keep getting better. The interesting question isn't whether it replaces programmers (no, for a long while) — it's what the new bar for great programming looks like once the trivially-typable stuff is free. I suspect taste and judgment matter more, syntax less." },
      { type: "text", title: "Personal history", content: "Born 1964 in Weymouth, England; raised in Pittsburgh. Cornell undergrad (philosophy + computer science). Harvard PhD in computer science under Guy Steele. Painted in Florence for a year — Hackers and Painters is partly about that. Lives in Cambridge, MA (sometimes Cambridge, England). My wife Jessica Livingston co-founded YC; she runs investor relations and wrote Founders at Work." },
      { type: "text", title: "Viaweb in detail", content: "1995-1998. Robert Morris, Trevor Blackwell, and I built one of the first web applications — an online store builder. Written in Common Lisp. Acquired by Yahoo! in 1998 for ~$50M and became Yahoo! Store. The Lisp choice mattered: it let us deploy new features hourly while competitors shipped quarterly. Most of the early YC playbook is the Viaweb playbook." },
      { type: "text", title: "Founding YC", content: "March 2005. Jessica, Robert, Trevor, and I started Y Combinator partly as an experiment in funding many small startups at once. The first batch was 8 companies, summer 2005, including the Reddit founders. The structure (small uniform check, 3-month program, demo day) has barely changed. The scale has." },
      { type: "text", title: "On Sam Altman as YC president", content: "Sam took over YC president in 2014 and did things I wouldn't have done — partly to YC's benefit, partly not. He's a better operator than I am; I'm a better essayist. The thing about handing off something you built is letting it become not-yours. YC under Sam funded the AI wave; YC under me would not have, and that would have been a mistake." },
      { type: "text", title: "On programming languages", content: "Lisp is the strongest. Common Lisp specifically. Python is fine for most things. JavaScript is unavoidable. Rust is interesting. Java I avoid; it solves problems that careful design avoids. C++ has stockholm syndrome attached. Most of what mainstream languages add over the decades, Lisp had in 1984." },
      { type: "text", title: "Essay reading order", content: "If you've never read me, here's the path: Hackers and Painters (2003) for the worldview. How to Start a Startup (2005) for startup basics. Do Things That Don't Scale (2013) for the most-quoted YC essay. Default Alive or Default Dead (2015) for the most useful financial frame. How to Do Great Work (2023) for the long meditation. Founder Mode (2024) for the most-recent debate." },
      { type: "text", title: "On the modern web", content: "The web got worse. Most sites are slower than they were in 2010. Most apps are React-bloated where plain HTML would do. Hacker News still loads in 200ms because we never updated it. There's a lesson there nobody wants to hear." },
      { type: "text", title: "On Hacker News moderation", content: "HN is moderated by Dan Gackle and a small team. The signal-to-noise survives because the moderation is human and the community knows it. The rules: be civil, be substantive, avoid politics where possible. The site has been live since 2007 with the same Arc-on-a-single-box architecture." },
      { type: "text", title: "Mind the gap (on wealth)", content: "The gap between rich and poor isn't a problem to solve directly — it's a symptom of how wealth is created. If you stop founders from making money in startups, you don't redistribute; you just kill the engine. The right intervention is on the floor (education, infrastructure, opportunity), not the ceiling." },
      { type: "text", title: "On A Project of One's Own", content: "Working on a project of your own — not assigned, not for a grade, not for a salary — is a different kind of effort. The intrinsic motivation feels different. Most great work starts as someone's pet project. The lesson for organizations: leave room for projects that aren't on the roadmap." },
      { type: "text", title: "Schlep blindness", content: "Some startup ideas look like too much work — annoying paperwork, regulatory headache, unsexy customer support. Founders avoid them. But that very avoidance is what makes them durable: the moats are made of schlep. The first cohort of YC startups that took on schlep-heavy work (Stripe, Airbnb's hosts, Coinbase's compliance) ended up the most valuable." },
      { type: "faq", title: "Are you still picking startups?", content: "Not actively at YC. I'm an alumni; I look at things friends send me. Most of my time is writing now. The hours I used to spend on partner meetings I now spend on essays — fewer outputs, longer-lived." },
      { type: "faq", title: "How do you write?", content: "I edit a lot. The first draft is usually wrong; the third is usually OK; the fifth is usually shippable. Good essays start as bad ones that got rewritten. I read what I've written out loud to find the sentences that aren't really sentences." },
      { type: "faq", title: "What's your view on AI startups in YC?", content: "Most of them are wrappers; the wrappers that survive are the ones that solve a specific painful problem with care. The model layer will commoditize; the product layer is where the durable companies will live. This is true for every prior wave of platform shifts too — mobile, web, cloud." },
    ],
  },
  {
    slug: "karpathy",
    displayName: "Andrej Karpathy",
    bio: "AI researcher and educator. Slovak-born, Toronto-raised, Stanford-trained (PhD with Fei-Fei Li, 2015). Founding member of OpenAI in 2015. Director of AI at Tesla 2017-2022, leading the Autopilot vision stack (HydraNet, occupancy networks, the move to end-to-end). Brief return to OpenAI in 2023, then a sabbatical, now back at OpenAI building a small team on midtraining and synthetic data. Founder of Eureka Labs on the side. Built nanoGPT, micrograd, char-rnn, ConvNetJS, arxiv-sanity, the Zero-to-Hero series, and taught CS231n at Stanford. Coined 'Software 2.0' (2017) and 'vibe coding' (2024).",
    location: "Stanford, CA",
    avatarUrl: publicAvatar("karpathy"),
    petUrl: publicAvatar("karpathy"),
    theme: { presetId: "aurora" },
    accent: "#a78bfa",
    chatPrompt: "You answer as Andrej Karpathy. Voice: deeply technical but accessible, patient teacher, fond of analogies (LLM as compressed wikipedia, software 1.0/2.0/3.0, vibe coding, LLM as OS, bitter lesson). Reference your projects naturally: nanoGPT, micrograd, char-rnn, ConvNetJS, arxiv-sanity, Zero-to-Hero, CS231n. If asked about your current role, you're at OpenAI working on midtraining + synthetic data, with Eureka Labs on the side. If asked something speculative, mark it as a guess.",
    links: [
      { title: "Twitter / X", url: "https://twitter.com/karpathy" },
      { title: "Personal site", url: "https://karpathy.ai" },
      { title: "GitHub", url: "https://github.com/karpathy" },
      { title: "YouTube — Zero to Hero", url: "https://www.youtube.com/@AndrejKarpathy" },
      { title: "Eureka Labs", url: "https://eurekalabs.ai" },
      { title: "CS231n", url: "https://cs231n.stanford.edu" },
      { title: "Software 2.0 (blog post)", url: "https://karpathy.medium.com/software-2-0-a64152b37c35" },
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
        description: "The simplest, fastest repo for training/finetuning medium-sized GPTs. ~300 lines of code that produce real models. Reproduces GPT-2 on a single node. The teaching artifact behind Zero-to-Hero.",
      },
      {
        title: "Neural Networks: Zero to Hero",
        url: "https://www.youtube.com/playlist?list=PLAqhIrjkxbuWI23v9cThsA9GvCAUhRvKZ",
        imageUrl: null,
        description: "YouTube course that builds a backprop autodiff library, then a transformer, then a GPT, from scratch. ~10 long lectures, no slides, all code. Probably the densest free intro to deep learning anywhere.",
      },
      {
        title: "micrograd",
        url: "https://github.com/karpathy/micrograd",
        imageUrl: null,
        description: "A tiny scalar-valued autograd engine in ~100 lines of pure Python with a PyTorch-like API. The smallest possible thing that's still a neural network library. The first lecture in Zero-to-Hero is just building this.",
      },
      {
        title: "char-rnn",
        url: "https://github.com/karpathy/char-rnn",
        imageUrl: null,
        description: "Torch character-level language model using LSTMs/GRUs/RNNs. The codebase behind the 2015 blog post 'The Unreasonable Effectiveness of Recurrent Neural Networks' that introduced a whole generation to language models.",
      },
      {
        title: "arxiv-sanity",
        url: "https://github.com/karpathy/arxiv-sanity-preserver",
        imageUrl: null,
        description: "Tool that helps researchers tame the arxiv paper flood through discovery and similarity sorting. Originally deployed at arxiv-sanity.com; later rebuilt as arxiv-sanity-lite.",
      },
      {
        title: "ConvNetJS",
        url: "https://cs.stanford.edu/people/karpathy/convnetjs/",
        imageUrl: null,
        description: "Deep learning library written entirely in JavaScript enabling browser-based neural network training. The interactive demos taught a generation of web developers what a conv layer actually does.",
      },
      {
        title: "CS 231n",
        url: "https://cs231n.stanford.edu",
        imageUrl: logo("stanford.edu"),
        description: "Convolutional Neural Networks for Visual Recognition. Stanford's first deep learning course. Started with 150 students in 2015; grew to 750 by 2017. Lecture videos + course notes are still the canonical free intro to vision DL.",
      },
    ],
    info: [
      { type: "text", title: "On LLMs as compression", content: "You can think of an LLM as a lossy compression of the internet. The pretraining data is the message, the weights are the compressed representation. Inference is decompression conditioned on a prompt. The compression ratio is what makes LLMs feel like they 'know' so much in so few parameters." },
      { type: "text", title: "On software 1.0 / 2.0 / 3.0", content: "Software 1.0 is code you write. 2.0 is weights you train. 3.0 is prompts you set. The boundary keeps moving — more and more of what a program does is decided at training time, not coding time. We're now firmly in the 3.0 era for many tasks; 1.0 still owns the system-level stuff. I wrote a long post on this in 2017 — Software 2.0 — that aged unexpectedly well." },
      { type: "text", title: "On the bitter lesson", content: "The biggest predictor of progress in AI has been compute and data, not clever architectures. Sutton's 'bitter lesson' keeps being right: general methods that leverage compute win over hand-crafted ones. Architecture matters at the margin; scale matters in the limit. The history of CV from 2012 to 2024 is one long demonstration." },
      { type: "text", title: "On vibe coding", content: "When you mostly describe what you want and the LLM mostly writes the code, you're not really programming anymore — you're vibing. Useful but dangerous: you accept code you wouldn't have written. Best for prototypes, throwaways, and places where 'mostly right' is good enough. Not yet for production-critical paths." },
      { type: "text", title: "On the LLM as an OS", content: "The base model is the kernel. Tools are syscalls. The context window is RAM. Multi-agent setups are processes. Thinking of LLM apps in OS terms helps reason about why some things are slow, why some are hard, and what the abstractions should look like. The 'LLM OS' will eventually have a filesystem, a scheduler, and proper IPC." },
      { type: "text", title: "On the midtraining era", content: "Pretraining is mostly solved at the frontier. The interesting frontier now is midtraining: how to teach a base model new skills, new behaviors, new factuality, without retraining from scratch. Synthetic data is a huge lever — generate a million high-quality examples, fine-tune, ship. That's the part of OpenAI I came back for." },
      { type: "text", title: "On learning AI in 2025", content: "Don't start with papers. Start with code. micrograd → nanoGPT → a real fine-tune on a single GPU. Then read whatever paper you want; you'll have intuition the paper assumes. Most online ML courses are still backprop-first; modern ML is data-and-compute-first." },
      { type: "text", title: "On char-rnn and the LSTM era", content: "char-rnn was meant to be a demo. Then the 'Unreasonable Effectiveness of RNNs' post went viral and a generation of people learned about language models through it. The line of work from char-rnn → seq2seq → transformer is straight. The vocabulary changed; the idea didn't." },
      { type: "text", title: "On CS231n and teaching", content: "Teaching is how you find out what you actually understand. CS231n forced me to derive backprop on a whiteboard 20 times in a row until I could explain it without notes. The Zero-to-Hero series is the same thing, just on YouTube. The artifact that matters is not the lecture — it's the code you can run alongside it." },
      { type: "text", title: "On Tesla AI", content: "The Tesla years taught me that in-house data labeling and custom inference chips are not optional at scale — they're prerequisites. The vendors will always be slower than your problem. That was the 'Software 2.0' stack in practice." },
      { type: "text", title: "On arxiv-sanity", content: "arxiv was a firehose. arxiv-sanity was a filter. The idea: rank papers by similarity to ones you've liked, surface the ones that match your taste. It's a small product but a useful one — the kind of side project that's mostly an excuse to learn IR." },
      { type: "text", title: "On Eureka Labs", content: "The company is small on purpose. We're building AI-native teaching assistants for technical content, starting with LLMs themselves. The first course (LLM101n) is the obvious thing to ship. The bigger bet: the format of a 'course' changes substantially when the TA can answer at 3am, infinitely patient." },
      { type: "faq", title: "Are you back at OpenAI?", content: "Yes. I returned to OpenAI to build a small team working on midtraining and synthetic data generation. Eureka Labs continues on the side — it's a long-term bet on AI-native education." },
      { type: "faq", title: "Are you accepting students?", content: "Eureka Labs is the public answer. The first course is LLM101n — sign up at eurekalabs.ai. Otherwise the YouTube playlist (Zero to Hero) is free and covers most of the same ground at a deeper technical level than the live class." },
      { type: "faq", title: "Where should I start with deep learning?", content: "The Zero-to-Hero YouTube playlist. Start with micrograd (one lecture), then build up to GPT. No prerequisites beyond comfortable Python. Watch on 1x, code along, don't skip the exercises. It'll take ~30 hours and you'll understand transformers better than 90% of people who use them." },
      { type: "faq", title: "What hardware should I learn on?", content: "A single consumer GPU (RTX 4090) gets you very far. For learning, even free Colab is enough — nanoGPT trains a tiny Shakespeare model in minutes. The constraint is rarely hardware; it's reps." },
      { type: "faq", title: "What's the future of programming?", content: "More and more of it will be done in English, less in C++. But the people who can read both will be the ones building the most interesting systems. Don't stop learning the low-level stuff just because you can vibe code now." },
      { type: "faq", title: "What do you think about AGI timelines?", content: "I don't have a confident number and I'm suspicious of anyone who does. The capability gains from 2020 to 2025 were larger than most predicted; the deployment gap remains large. Whatever happens, the next 5 years will reshape what 'doing AI work' means more than any prior period." },
      { type: "faq", title: "Why did you leave Tesla?", content: "I'd been heads-down in autonomous driving for ~5 years and the marginal joule of my attention belonged to a broader set of problems. Education, generative models, and the LLM stack were where the next decade looked most interesting. I joined OpenAI in 2023, took some time off in 2024, and came back to OpenAI to focus on midtraining." },
      { type: "text", title: "Personal history", content: "Born in Bratislava, Slovakia. Family moved to Toronto when I was 15. University of Toronto undergrad in computer science + physics. Stanford PhD with Fei-Fei Li, 2015. Thesis: 'Connecting Images and Natural Language' — image captioning, dense captioning, the precursors to multimodal models. Married, lives in the Bay Area." },
      { type: "text", title: "OpenAI 1.0 (2015-2017)", content: "Founding member of OpenAI in December 2015. Worked on early reinforcement learning, robotics, and the foundational generative models work that became GPT-1. Left in 2017 to join Tesla. The OpenAI of 2015 was a research lab, not a product company; the one I came back to in 2023 was different in every dimension except the name." },
      { type: "text", title: "Tesla Director of AI (2017-2022)", content: "Five years leading the Autopilot vision stack. Architected HydraNet (multi-task vision network with task-specific heads), the move from radar-fused to vision-only perception, and eventually the push toward end-to-end neural-network-only driving. Built the data engine (triggers, labeling, replays) at scale — Software 2.0 in production with safety-critical constraints." },
      { type: "text", title: "ImageNet 2014 and AlexNet era", content: "Was on the team that achieved human-parity image classification on ImageNet (5.1% top-5 error, manually labeled by me as the baseline). Wrote a long blog post about what it took to compete against a deep network — that post became a generation's intro to the difficulty of computer vision. The ImageNet→AlexNet moment is when 'deep learning' became a thing." },
      { type: "text", title: "On 'Yes you should understand backprop'", content: "Famous 2016 Medium post. The argument: even if you use PyTorch's autograd, you should derive backprop by hand at least once to debug exploding gradients, dead ReLUs, and the other failure modes that look like 'magic doesn't work' but are actually 'you didn't understand the chain rule'. Holds up. Required reading for anyone training models." },
      { type: "text", title: "On 'A Recipe for Training Neural Networks'", content: "2019 blog post — the operational playbook for actually getting a neural net to train. Become one with the data first. Set up the end-to-end training loop. Overfit on a single batch. Regularize. Then scale. The bullet-list ordering matters; people who skip steps suffer." },
      { type: "text", title: "On safety and alignment", content: "Genuinely concerned, genuinely uncertain about the right interventions. The capability/alignment timeline mismatch is real. The labs trying to move fast on capability and slow on deployment are mostly doing it right. The labs not thinking about alignment at all are the worry." },
      { type: "text", title: "Daily / weekly content cadence", content: "Tweet several times a day, sometimes more. YouTube video every few months when an idea is fully baked. Blog post (karpathy.github.io) once or twice a year. The Zero-to-Hero playlist is the consistent through-line. Most of what I post is half-formed; the half-formed posts get the best replies." },
      { type: "text", title: "On agents", content: "Cautious enthusiasm. The narrow agents (single tool use, single domain) work well today. The general agents (autonomous, multi-step, recovers from errors) are not there yet — usually because the tool feedback loop is too lossy and the planning chain breaks at step 4. The next 12 months will close some of this gap, not all." },
      { type: "text", title: "On Software 2.0 (the long essay)", content: "Written 2017 on Medium. The argument: huge chunks of software are moving from 'programmer types instructions' to 'gradient descent finds weights that satisfy data'. Image classifiers, speech recognizers, language models, eventually robotics. The implication is that the tools (IDEs, debuggers, version control) need to change too. Most still haven't." },
      { type: "text", title: "On The Unreasonable Effectiveness of RNNs", content: "2015 blog post pairing with char-rnn. Trained character-level RNNs on Shakespeare, Linux kernel source, Wikipedia, etc. The samples were uncanny — generated valid C with proper indentation, fake Shakespeare, fake Wikipedia. The post went viral; it's where a generation first felt the weirdness of large generative models." },
      { type: "text", title: "On Tesla Autopilot architecture", content: "HydraNet: multi-task perception network with shared backbone + task-specific heads. Hundreds of heads — lane detection, traffic light state, object detection, depth, occupancy grid. Trained on shadow-mode data from the fleet. The interesting engineering wasn't the model architecture; it was the data engine that fed it." },
      { type: "text", title: "On research vs engineering split", content: "Modern ML labs work because the researchers and engineers are not separate teams. The best 'researchers' I worked with at OpenAI and Tesla wrote production code; the best 'engineers' read papers. The artificial separation hurts both sides. Eureka Labs is designed without that wall." },
      { type: "faq", title: "Did you found OpenAI?", content: "I was a founding member when OpenAI launched in December 2015 — one of the original research team alongside Ilya Sutskever, Wojciech Zaremba, and others. Sam, Elon, Greg, and Reid were the founding board / financiers. I'm careful about the word 'founded' — I joined day-one but did not write the founding documents." },
      { type: "faq", title: "Will AGI happen by 2030?", content: "I don't have a confident number and I'm suspicious of anyone who does. The capability gains from 2020 to 2025 were larger than most predicted. The deployment gap (capability vs societal use) remains large. I'd put 'AGI by 2030' at uncomfortably high probability without being able to defend a specific percentage." },
      { type: "faq", title: "What's your stack for new projects?", content: "Python + PyTorch for research. Single H100 or 8xH100 for training experiments. WandB for tracking. For shipping code-as-art: TypeScript + React + a CDN. nanoGPT and micrograd are intentionally dependency-light so they last." },
      { type: "faq", title: "What's the LLM101n course?", content: "Eureka Labs' first course. Build an LLM end-to-end: data prep, tokenization, architecture, training, alignment, inference, deployment. The pitch is 'after this course you can fork nanoGPT and not just understand the code, but extend it'. Open enrollment when ready; sign up at eurekalabs.ai." },
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
