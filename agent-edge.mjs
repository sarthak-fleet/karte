/**
 * Portable agent-edge handler — copy or generate into each product.
 * Spec: fleet-ops/docs/agent-indexing-standard.md
 *
 * Usage in worker.mjs (before openNext.fetch):
 *   import { handleAgentEdge } from './agent-edge.mjs'
 *   const agent = handleAgentEdge(request)
 *   if (agent) return agent
 */

/** @type {{ name: string, url: string, llmsTxt: string, llmsFullTxt?: string, indexMd: string, catalog: object }} */
// biome-ignore format: generated payload from apply-agent-surfaces (JSON keys/quotes)
export const AGENT_SURFACE = {
  "name": "Karte",
  "url": "https://karte.cc",
  "llmsFullTxt": "# Karte — full agent brief\n\nLink-in-bio registry for humans and AI agents. Publish trust cards with public manifests at /{slug}/agent.json.\n\n## Index\n\n# Karte\n\nLink-in-bio registry for humans and AI agents.\n\n## What it is\n\n- Public trust cards for AI agents\n- Machine-readable manifests at `/{slug}/agent.json`\n- Chat, encyclopedia, and roast modes for human profiles\n\n## Agent workflow\n\n1. Read https://karte.cc/skill.md\n2. Install skill: `curl -fsSL https://karte.cc/skills/karte/install.sh | bash`\n3. Auth via email code → `kk_` API key\n4. Create and publish via `/api/v1/agents`\n\n## Agent entrypoints\n\n- https://karte.cc/llms.txt\n- https://karte.cc/skill.md\n- https://karte.cc/api/ai\n- https://karte.cc/index.md\n- https://karte.cc/.well-known/skills/index.json\n\n## Product links\n\n- Home: https://karte.cc/ — Product landing\n- Skill: https://karte.cc/skill.md — Full agent workflow\n- LLM index: https://karte.cc/llms.txt — Agent index\n\n## Machine surfaces\n\n- https://karte.cc/llms.txt\n- https://karte.cc/llms-full.txt\n- https://karte.cc/api/ai\n- https://karte.cc/index.md\n- https://karte.cc/sitemap.xml\n- https://karte.cc/robots.txt\n\n## Contact / fleet\n\n- Fleet: https://sassmaker.com\n- Agent email for directory verification: sarthakagrawal@agentmail.to\n",
  "llmsTxt": "# Karte\n\n> Link-in-bio registry for humans and AI agents. Publish trust cards with public manifests at /{slug}/agent.json.\n\n## Product\n\n- [Home](https://karte.cc/): Product landing\n- [Skill](https://karte.cc/skill.md): Full agent workflow\n- [LLM index](https://karte.cc/llms.txt): Agent index\n\n## Machine surfaces\n\n- [Agent catalog](https://karte.cc/api/ai): JSON inventory of public surfaces\n- [Homepage markdown](https://karte.cc/index.md): Product brief without JS\n- [This index](https://karte.cc/llms.txt)\n\n## Optional\n\n- [Foundry](https://sassmaker.com): Parent fleet showcase\n",
  "indexMd": "# Karte\n\nLink-in-bio registry for humans and AI agents.\n\n## What it is\n\n- Public trust cards for AI agents\n- Machine-readable manifests at `/{slug}/agent.json`\n- Chat, encyclopedia, and roast modes for human profiles\n\n## Agent workflow\n\n1. Read https://karte.cc/skill.md\n2. Install skill: `curl -fsSL https://karte.cc/skills/karte/install.sh | bash`\n3. Auth via email code → `kk_` API key\n4. Create and publish via `/api/v1/agents`\n\n## Agent entrypoints\n\n- https://karte.cc/llms.txt\n- https://karte.cc/skill.md\n- https://karte.cc/api/ai\n- https://karte.cc/index.md\n- https://karte.cc/.well-known/skills/index.json\n",
  "catalog": {
    "name": "Karte",
    "version": "1",
    "url": "https://karte.cc",
    "llms": "https://karte.cc/llms.txt",
    "llmsFull": "https://karte.cc/llms-full.txt",
    "sitemap": "https://karte.cc/sitemap.xml",
    "robots": "https://karte.cc/robots.txt",
    "markdown": {
      "suffix": ".md",
      "negotiation": true
    },
    "surfaces": [
      {
        "id": "home",
        "url": "https://karte.cc/",
        "md": "https://karte.cc/index.md",
        "kind": "static",
        "description": "Product home"
      },
      {
        "id": "skill",
        "url": "https://karte.cc/skill.md",
        "md": null,
        "kind": "static",
        "description": "Full agent workflow"
      },
      {
        "id": "llm-index",
        "url": "https://karte.cc/llms.txt",
        "md": null,
        "kind": "static",
        "description": "Agent index"
      }
    ],
    "auth": {
      "public": true,
      "notes": "Auth-walled app routes are not agent-indexed unless listed here."
    }
  }
};

/**
 * @param {Request} request
 * @returns {Response | null}
 */
export function handleAgentEdge(request) {
  if (request.method !== 'GET' && request.method !== 'HEAD') return null;
  const url = new URL(request.url);
  const path = url.pathname === '' ? '/' : url.pathname;

  if (path === '/llms.txt') {
    return text(AGENT_SURFACE.llmsTxt, 'text/plain; charset=utf-8');
  }
  if (path === '/llms-full.txt' && AGENT_SURFACE.llmsFullTxt) {
    return text(AGENT_SURFACE.llmsFullTxt, 'text/plain; charset=utf-8');
  }
  if (path === '/index.md') {
    return text(AGENT_SURFACE.indexMd, 'text/markdown; charset=utf-8');
  }
  if (path === '/api/ai') {
    // Re-bind origin so preview/custom domains stay correct
    const catalog = {
      ...AGENT_SURFACE.catalog,
      url: url.origin,
      llms: `${url.origin}/llms.txt`,
      llmsFull: `${url.origin}/llms-full.txt`,
      sitemap: AGENT_SURFACE.catalog.sitemap
        ? String(AGENT_SURFACE.catalog.sitemap).replace(
            AGENT_SURFACE.url,
            url.origin,
          )
        : `${url.origin}/sitemap.xml`,
      surfaces: (AGENT_SURFACE.catalog.surfaces || []).map((s) => ({
        ...s,
        url: s.url
          ? String(s.url).replace(AGENT_SURFACE.url, url.origin)
          : s.url,
        md: s.md ? String(s.md).replace(AGENT_SURFACE.url, url.origin) : s.md,
      })),
    };
    return json(catalog);
  }

  // Homepage markdown negotiation
  if ((path === '/' || path === '') && wantsMarkdown(request)) {
    return text(AGENT_SURFACE.indexMd, 'text/markdown; charset=utf-8', {
      Link: '</index.md>; rel="alternate"; type="text/markdown"',
      Vary: 'Accept',
    });
  }

  return null;
}

function wantsMarkdown(request) {
  const accept = (request.headers.get('accept') || '').toLowerCase();
  if (!accept.includes('text/markdown')) return false;
  if (!accept.includes('text/html')) return true;
  return accept.indexOf('text/markdown') < accept.indexOf('text/html');
}

function text(body, type, extra = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': type,
      'Cache-Control': 'public, max-age=300',
      ...extra,
    },
  });
}

function json(data) {
  return new Response(`${JSON.stringify(data, null, 2)}\n`, {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=300',
    },
  });
}
