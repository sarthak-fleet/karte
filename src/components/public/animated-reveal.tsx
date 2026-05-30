'use client';

import { type CSSProperties, type ReactNode, useEffect, useRef, useState } from 'react';

import { useReducedMotion } from '@/lib/use-reduced-motion';

/**
 * Wraps children in a one-shot fade-up animation triggered when the
 * element enters the viewport. CSS-only animation, IntersectionObserver
 * for the trigger. Honors `prefers-reduced-motion` — users with it set
 * see content immediately, no animation.
 *
 * Stagger via the `delay` prop in ms. Negligible JS cost (one observer,
 * one state flip).
 */
export function AnimatedReveal({
  children,
  delay = 0,
  className,
  as: As = 'div',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
  as?: 'div' | 'section' | 'article';
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const reducedMotion = useReducedMotion();
  const [intersected, setIntersected] = useState(false);
  // Reduced-motion users skip the observer and render fully visible
  // from the start — derived at render so the effect doesn't have to
  // setState synchronously to handle that branch.
  const visible = reducedMotion || intersected;

  useEffect(() => {
    if (reducedMotion) return;
    const node = ref.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setIntersected(true);
            observer.disconnect();
            return;
          }
        }
      },
      { threshold: 0.08, rootMargin: '0px 0px -40px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [reducedMotion]);

  const style: CSSProperties = {
    transition:
      'opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), transform 700ms cubic-bezier(0.16, 1, 0.3, 1)',
    transitionDelay: visible ? `${delay}ms` : '0ms',
    opacity: visible ? 1 : 0,
    transform: visible ? 'translateY(0)' : 'translateY(16px)',
    willChange: visible ? 'auto' : 'transform, opacity',
  };

  return (
    <As ref={ref as never} className={className} style={style}>
      {children}
    </As>
  );
}
