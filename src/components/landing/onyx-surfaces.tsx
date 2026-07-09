/**
 * Card III — The inbound desk.
 *
 * Editorial typographic list with leader-dot rules between title and
 * description, like an old-school table of contents. "Newspaper —
 * Above the fold." drops the "Daily." from the original — newspaper
 * regenerates on demand, not on a schedule, and overpromising daily
 * would be a feature claim we can't back.
 */
const SURFACES: ReadonlyArray<{ i: string; t: string; b: string }> = [
  { i: 'i.', t: 'Chat', b: 'Answers the repeat questions first.' },
  { i: 'ii.', t: 'Email', b: 'Give inbound a dedicated front door.' },
  { i: 'iii.', t: 'Leads', b: 'Capture who asked and why.' },
  { i: 'iv.', t: 'Proof', b: 'Projects, links, and modes that back you up.' },
];

export function OnyxSurfaces() {
  return (
    <div className="onyx-surfaces">
      <div className="onyx-eyebrow center">· THE INBOUND DESK ·</div>
      <h2 className="onyx-h2 center">
        One memory.
        <br />
        <em>Four ways to handle inbound.</em>
      </h2>
      <ol className="onyx-surfaces-list">
        {SURFACES.map((s) => (
          <li key={s.i}>
            <span className="onyx-sf-i">{s.i}</span>
            <span className="onyx-sf-t">{s.t}</span>
            <span className="onyx-sf-dots" aria-hidden="true" />
            <span className="onyx-sf-b">{s.b}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
