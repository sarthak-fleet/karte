/**
 * Card II — How it works.
 *
 * Three Roman-numeral steps with leader rule, gold gradient numerals.
 * "Pick your modes" intentionally drops 'voice' from the original
 * design copy — we don't have a voice setting and the user asked it
 * be removed from any persona/copy that promises it.
 */
const STEPS: ReadonlyArray<{ i: string; t: string; b: string }> = [
  {
    i: 'I',
    t: 'Feed it your memory',
    b: 'Links, projects, FAQs, boundaries.',
  },
  {
    i: 'II',
    t: 'Pick your modes',
    b: 'Chat, Encyclopedia, Newspaper, Roast.',
  },
  {
    i: 'III',
    t: 'Share one link',
    b: 'Same link, every visitor. The page does the talking.',
  },
];

export function OnyxHow() {
  return (
    <div className="onyx-how">
      <div className="onyx-eyebrow center">· HOW IT WORKS ·</div>
      <h2 className="onyx-h2 center">
        Three steps. <em>One afternoon.</em>
      </h2>
      <div className="onyx-how-grid">
        {STEPS.map((s) => (
          <div key={s.i} className="onyx-how-step">
            <div className="onyx-how-num">{s.i}</div>
            <div className="onyx-how-rule" aria-hidden="true" />
            <div className="onyx-how-title">{s.t}</div>
            <div className="onyx-how-body">{s.b}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
