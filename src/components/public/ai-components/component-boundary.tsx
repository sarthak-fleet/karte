'use client';

import { Component, type ReactNode } from 'react';

import { captureError } from '@/lib/foundry-monitoring';

interface Props {
  children: ReactNode;
  /** Component type for error-reporting context. */
  componentType: string;
}

interface State {
  hasError: boolean;
}

/**
 * Error boundary that wraps each AI-emitted component individually.
 * If one component throws (bad prop shape, runtime issue), the rest
 * of the chat bubble survives. Errors get captured to PostHog with
 * the component type so we can fix the prompt or the component.
 *
 * Class component is required — React still has no hook-based error
 * boundary, and this needs to live in the public bundle so the chat
 * widget can use it.
 */
export class ComponentBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    captureError(error, {
      scope: 'ai-component',
      // captureError's options shape doesn't take a per-component
      // tag, so we lean on `source` to carry the type name. PostHog
      // event filter looks like: scope=ai-component, source=<type>.
      source: this.props.componentType,
    });
  }

  render() {
    if (this.state.hasError) {
      // Silent fallback — don't show a "component crashed" warning to
      // the visitor since these are decorative. The text answer above
      // is the primary content.
      return null;
    }
    return this.props.children;
  }
}
