'use client';

import { useCallback,useState } from 'react';

type Props = {
  hasKey: boolean;
  hasAiConfig: boolean;
  aiEndpointUrl: string;
  aiModel: string;
  isUsingDefaultAi?: boolean;
};

export function AiKeySettings({
  hasKey,
  hasAiConfig,
  aiEndpointUrl: initialUrl,
  aiModel: initialModel,
  isUsingDefaultAi = false,
}: Props) {
  // SaaS Maker key (for RAG/chat document indexing)
  const [aiKey, setAiKey] = useState('');
  const [configured, setConfigured] = useState(hasKey);

  // Custom AI endpoint
  const [endpointUrl, setEndpointUrl] = useState(initialUrl);
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState(initialModel);
  const [aiConfigured, setAiConfigured] = useState(hasAiConfig);

  // Model discovery
  const [discoveredModels, setDiscoveredModels] = useState<{ id: string; name?: string }[]>([]);
  const [loadingModels, setLoadingModels] = useState(false);

  // Shared state
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSaveSmKey() {
    if (!aiKey.trim()) return;
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch('/api/settings/ai-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ aiKey: aiKey.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to save');
        return;
      }

      setMessage('Document index key saved successfully');
      setConfigured(true);
      setAiKey('');
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  async function handleSaveAiConfig() {
    if (!endpointUrl.trim() || !model.trim()) return;
    // apiKey is required only if not already configured (updating URL/model without changing key is fine)
    if (!aiConfigured && !apiKey.trim()) return;

    setSaving(true);
    setMessage('');

    try {
      const payload: Record<string, string> = {
        aiEndpointUrl: endpointUrl.trim(),
        aiModel: model.trim(),
      };
      // Only send apiKey if user entered one (avoid overwriting with empty)
      if (apiKey.trim()) {
        payload.aiApiKey = apiKey.trim();
      }

      const res = await fetch('/api/settings/ai-key', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to save AI config');
        return;
      }

      setMessage('AI configuration saved successfully');
      setAiConfigured(true);
      setApiKey('');
    } catch {
      setMessage('Failed to save AI config');
    } finally {
      setSaving(false);
    }
  }

  const handleDiscoverModels = useCallback(async () => {
    const url = endpointUrl.trim();
    const key = apiKey.trim();
    if (!url || !key) return;

    setLoadingModels(true);
    setDiscoveredModels([]);

    try {
      const res = await fetch('/api/ai/models', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ endpointUrl: url, apiKey: key }),
      });

      if (!res.ok) {
        setMessage('Could not fetch models. Check your endpoint and key.');
        return;
      }

      const data = await res.json();
      setDiscoveredModels(data.models || []);
      if (data.models?.length > 0 && !model) {
        setModel(data.models[0].id);
      }
    } catch {
      setMessage('Failed to discover models');
    } finally {
      setLoadingModels(false);
    }
  }, [endpointUrl, apiKey, model]);

  return (
    <div className="space-y-6">
      {/* Document Index Key (SaaS Maker — for RAG/chat) */}
      <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-1 text-lg font-semibold text-white">Document Index Key</h2>
        <p className="mb-4 text-sm text-gray-400">
          {configured
            ? 'Your document index key is configured. Enter a new key to update it.'
            : 'Required for the chat feature — powers document search and retrieval.'}
        </p>

        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="password"
            value={aiKey}
            onChange={(e) => setAiKey(e.target.value)}
            placeholder={configured ? '••••••••••••••••' : 'Enter your document index key'}
            className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
          />
          <button
            onClick={handleSaveSmKey}
            disabled={saving || !aiKey.trim()}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save'}
          </button>
        </div>

        {!configured && (
          <p className="mt-3 text-xs text-yellow-400/80">
            Chat will not work until a document index key is configured.
          </p>
        )}
      </div>

      {/* Custom AI Endpoint */}
      <div className="rounded-2xl border border-white/20 bg-white/5 p-6 backdrop-blur-xl">
        <h2 className="mb-1 text-lg font-semibold text-white">AI Endpoint</h2>
        <p className="mb-4 text-sm text-gray-400">
          {isUsingDefaultAi
            ? 'Karte AI is configured by default. Add your own endpoint only if you want to override it.'
            : aiConfigured
            ? 'Your AI endpoint is configured. Update any field below.'
            : 'Connect any OpenAI-compatible endpoint to power AI features.'}
        </p>

        <div className="space-y-3">
          {/* Endpoint URL */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Endpoint URL</label>
            <input
              type="text"
              value={endpointUrl}
              onChange={(e) => setEndpointUrl(e.target.value)}
              placeholder="https://api.example.com/v1"
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
            />
          </div>

          {/* API Key */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={aiConfigured ? '••••••••••••••••' : 'Enter your API key'}
              className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
            />
          </div>

          {/* Model */}
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-400">Model</label>
            <div className="flex gap-2">
              {discoveredModels.length > 0 ? (
                <select
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white outline-none focus:border-white/30"
                >
                  {discoveredModels.map((m) => (
                    <option key={m.id} value={m.id} className="bg-gray-900">
                      {m.name || m.id}
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="gpt-4o, claude-3-5-sonnet, etc."
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-gray-500 outline-none focus:border-white/30"
                />
              )}
              <button
                onClick={handleDiscoverModels}
                disabled={loadingModels || !endpointUrl.trim() || !apiKey.trim()}
                className="shrink-0 rounded-lg border border-white/10 px-3 py-2 text-xs font-medium text-gray-300 transition hover:border-white/30 hover:text-white disabled:opacity-50"
              >
                {loadingModels ? 'Loading...' : 'Discover'}
              </button>
            </div>
            {discoveredModels.length > 0 && (
              <button
                onClick={() => setDiscoveredModels([])}
                className="mt-1 text-xs text-gray-500 hover:text-gray-300"
              >
                Switch to manual entry
              </button>
            )}
          </div>

          {/* Save button */}
          <button
            onClick={handleSaveAiConfig}
            disabled={saving || !endpointUrl.trim() || !model.trim() || (!aiConfigured && !apiKey.trim())}
            className="w-full rounded-lg bg-white px-4 py-2 text-sm font-medium text-gray-900 transition hover:bg-gray-100 disabled:opacity-50 sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save AI Config'}
          </button>
        </div>

        {!aiConfigured && (
          <p className="mt-3 text-xs text-yellow-400/80">
            AI features (roast, newspaper, encyclopedia, chat) require an AI endpoint.
          </p>
        )}
      </div>

      {message && (
        <p className={`text-sm ${message.includes('success') ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}
    </div>
  );
}
