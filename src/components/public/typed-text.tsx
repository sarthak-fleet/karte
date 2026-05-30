'use client';

import { useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/lib/use-reduced-motion';

interface TypedTextProps {
  text: string;
  /** ms per character */
  speed?: number;
  /** Delay before the first character */
  startDelay?: number;
  className?: string;
  /** If true, shows blinking cursor until typing completes */
  cursor?: boolean;
  /** Accent color for the cursor */
  cursorColor?: string;
}

/**
 * Types `text` out character-by-character the first time the element
 * enters the viewport. Cheap IntersectionObserver trigger, JS setTimeout
 * for the typing loop. prefers-reduced-motion → instant full text.
 *
 * Used on mode-card previews so the AI surfaces feel *written* into
 * being as you scroll past them rather than appearing pre-rendered.
 */
export function TypedText({
  text,
  speed = 22,
  startDelay = 0,
  className,
  cursor = false,
  cursorColor,
}: TypedTextProps) {
  const ref = useRef<HTMLSpanElement | null>(null);
  const reduced = useReducedMotion();
  // Reduced-motion users skip the observer + typing loop entirely and
  // see the final text immediately — derived at render so no setState
  // is needed inside an effect to handle that branch.
  const [intersected, setIntersected] = useState(false);
  const [idx, setIdx] = useState(0);
  const started = reduced || intersected;
  // Typing reaches done when the index catches up. Derived rather
  // than stored so we don't have to setState in the typing effect.
  const done = reduced || idx >= text.length;

  useEffect(() => {
    if (reduced) return;
    const node = ref.current;
    if (!node) return;
    const obs = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setTimeout(() => setIntersected(true), startDelay);
            obs.disconnect();
            return;
          }
        }
      },
      { threshold: 0.2, rootMargin: '0px 0px -40px 0px' },
    );
    obs.observe(node);
    return () => obs.disconnect();
  }, [startDelay, reduced]);

  useEffect(() => {
    if (!started || reduced || done) return;
    const t = setTimeout(() => setIdx((i) => i + 1), speed);
    return () => clearTimeout(t);
  }, [started, idx, text, speed, reduced, done]);

  return (
    <span ref={ref} className={className}>
      {reduced || done ? text : text.slice(0, idx)}
      {cursor && !done && started && !reduced && (
        <span
          aria-hidden="true"
          className="ml-0.5 inline-block h-[1em] w-[2px] -translate-y-[1px] align-middle"
          style={{
            backgroundColor: cursorColor ?? 'currentColor',
            animation: 'typed-cursor-blink 1s steps(2) infinite',
          }}
        />
      )}
      <style>{`@keyframes typed-cursor-blink { 50% { opacity: 0; } }`}</style>
    </span>
  );
}
