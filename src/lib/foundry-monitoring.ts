"use client";

import posthog from "posthog-js";

import { maybeReloadOnChunkError } from "./chunk-reload";

const PROJECT_SLUG = "linkchat";

function route() {
  if (typeof window === "undefined") return undefined;
  return `${window.location.origin}${window.location.pathname}`;
}

function messageFrom(error: unknown) {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return String(error);
}

export function capturePageCrash(error: unknown, source: "window_error" | "unhandled_rejection") {
  posthog.capture("foundry_page_crash", {
    project_id: PROJECT_SLUG,
    route: route(),
    source,
    message: messageFrom(error),
    stack: error instanceof Error ? error.stack : undefined,
  });
}

type ErrorBoundaryScope =
  | "root"
  | "global"
  | "public-profile"
  | "encyclopedia"
  | "roast"
  | "newspaper"
  | "dashboard"
  | "ai-component"
  | "unknown";

/**
 * Emits an "error_captured" event for an error surfaced by a React error
 * boundary (error.tsx / global-error.tsx). Safe to call from the client —
 * never throws, so it is safe to call from inside an error boundary.
 */
export function captureError(
  error: unknown,
  options: { scope?: ErrorBoundaryScope; digest?: string; source?: string } = {},
) {
  try {
    posthog.capture("error_captured", {
      project_id: PROJECT_SLUG,
      route: route(),
      scope: options.scope ?? "unknown",
      digest: options.digest,
      source: options.source ?? "error_boundary",
      message: messageFrom(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  } catch {
    // Never let monitoring throw inside an error boundary.
  }
}

/**
 * Emits an "action_failed" event for a non-fatal failure (e.g. an AI
 * generation or API call that failed but did not crash a boundary).
 */
export function captureActionFailure(
  error: unknown,
  options: { action: string; source?: string } = { action: "unknown" },
) {
  try {
    posthog.capture("action_failed", {
      project_id: PROJECT_SLUG,
      route: route(),
      action: options.action,
      source: options.source ?? "client",
      message: messageFrom(error),
    });
  } catch {
    // Never let monitoring throw.
  }
}

export function installBrowserMonitoring() {
  if (typeof window === "undefined") return () => {};

  const onError = (event: ErrorEvent) => {
    // Stale-chunk crashes get a silent reload before they ever reach
    // PostHog or the React error boundary — the user is about to be
    // sent to a fresh page, no need to surface UI or log a crash.
    if (maybeReloadOnChunkError(event.error ?? event.message)) return;
    capturePageCrash(event.error ?? event.message, "window_error");
  };
  const onUnhandledRejection = (event: PromiseRejectionEvent) => {
    if (maybeReloadOnChunkError(event.reason)) return;
    capturePageCrash(event.reason, "unhandled_rejection");
  };

  window.addEventListener("error", onError);
  window.addEventListener("unhandledrejection", onUnhandledRejection);

  return () => {
    window.removeEventListener("error", onError);
    window.removeEventListener("unhandledrejection", onUnhandledRejection);
  };
}
