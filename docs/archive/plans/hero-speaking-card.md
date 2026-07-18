# Hero speaking-card — implementation note

**Status:** Prepped. Will ship when the full Claude Design deck lands.
**Goal:** Keep the chat / DM-deflection wedge alive in card 01 without breaking the calling-card aesthetic.

## The problem this solves

The new calling-card design moves the chat demo out of the hero (chat reappears as a later card, "How it speaks"). That's the right aesthetic move but the wrong conversion move on its own — a Linktree user landing on card 01 sees an elegant link page, doesn't know the card answers, and may bounce before scrolling.

## The fix

The card itself speaks. One typed line below the name, gold ink, typewriter animation, restrained. Tells the visitor in three words that this card is alive without breaking the design.

## Visual spec

```
              ✦ A calling card for one link

                       Karte.
              The internet's calling card.

       [italic gold, ~14px, typewriter, cycles]
      "Ask me about my rates →"

       A single, beautifully made page for every link
       you carry. No templates. No clutter. Just your
       name, set in foil.

              [Claim your card →]   [See live cards]
```

Position: directly under the headline, above the existing sub-line. Centered. Typography matches the deck — gold italic serif, smaller than the H1 but visible. The arrow signals it's a cue, not a static label.

## Lines to cycle

Three to five short visitor-style questions, rotating every ~5 seconds. In the design's voice:

- "Ask me about my rates →"
- "Ask what I'm building →"
- "Ask when I'm free →"
- "Ask if I'm hiring →"
- "Ask anything →"

Lines should feel like questions a real visitor would type. The cycling is the wedge: visitor watches the card *answer different questions* over a few seconds and understands the product without any "AI" or "chat" copy needed.

## Behavior

- Types each line at ~30ms per char (matches existing HeroChatDemo TYPE_MS).
- Pauses ~2.5s after a line completes, then erases (backspace style) and types the next.
- On hover the cycle pauses; on click, opens the chat surface (deferred to later card if the hero card doesn't include a chat surface yet).
- Honors `prefers-reduced-motion` — shows the first line statically, no cycling.

## Implementation

Reuse the existing `TypedText` or `HeroChatDemo`'s typewriter logic — pull out a small `<CardSpeakingLine />` component:

```tsx
<CardSpeakingLine
  lines={[
    'Ask me about my rates →',
    'Ask what I\'m building →',
    'Ask when I\'m free →',
  ]}
  className="font-serif italic text-karte-gold/80"
/>
```

~40 lines of new code, mostly extracted from existing typewriter components.

## What this does NOT do

- Doesn't replace the chat card later in the deck — that one still ships, with the full interactive demo.
- Doesn't add an input field to the hero — the speaking line is read-only. Keeps the hero pure calling card.
- Doesn't break the visual restraint of the design — one italic line, gold, in the natural reading flow.

## Decision recorded

User 2026-05-28: "Ok I will let you take care of A. I'm fine with it."

Ships as part of the calling-card hero implementation, not as a standalone PR. Holding until the full design deck arrives so it can be designed *into* the card instead of layered on top.
