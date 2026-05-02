'use client';

import { useState } from 'react';

import {
  Button,
  Card,
  FormField,
  Select,
  Textarea,
  Toggle,
} from '@/components/ui';
import {
  CHAT_POSITIONS,
  type ChatPosition,
} from '@/lib/themes';

interface ChatSettingsProps {
  pageId: string;
  initialChatEnabled: boolean;
  initialSystemPrompt: string;
  initialChatPosition: ChatPosition;
}

export function ChatSettings({
  pageId,
  initialChatEnabled,
  initialSystemPrompt,
  initialChatPosition,
}: ChatSettingsProps) {
  const [chatEnabled, setChatEnabled] = useState(initialChatEnabled);
  const [systemPrompt, setSystemPrompt] = useState(initialSystemPrompt);
  const [chatPosition, setChatPosition] = useState(initialChatPosition);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const res = await fetch(`/api/pages/${pageId}/chat-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatEnabled,
          chatSystemPrompt: systemPrompt,
          chatPosition,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setMessage(data.error || 'Failed to save');
        return;
      }

      setMessage('Saved successfully');
    } catch {
      setMessage('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-2xl font-bold text-white">Chat Settings</h1>

      <Card className="space-y-6">
        {/* Enable Chat Toggle */}
        <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h3 className="text-sm font-medium text-white">Enable Chat</h3>
            <p className="text-xs text-gray-400">
              Allow visitors to chat with your AI assistant
            </p>
          </div>
          <Toggle checked={chatEnabled} onChange={setChatEnabled} />
        </div>

        {/* Chat Position */}
        <FormField
          label="Chat Position"
          htmlFor="chatPosition"
          description="Keep the widget anchored at the bottom, with your preferred side."
        >
          <Select
            id="chatPosition"
            value={chatPosition}
            onChange={(e) => setChatPosition(e.target.value as ChatPosition)}
          >
            {CHAT_POSITIONS.map((position) => (
              <option
                key={position.value}
                value={position.value}
                className="bg-gray-900"
              >
                {position.label}
              </option>
            ))}
          </Select>
        </FormField>

        {/* System Prompt */}
        <FormField
          label="System Prompt"
          htmlFor="systemPrompt"
          description="Instructions for how the AI should behave when chatting with visitors"
        >
          <Textarea
            id="systemPrompt"
            rows={6}
            value={systemPrompt}
            onChange={(e) => setSystemPrompt(e.target.value)}
            placeholder="e.g. You are a helpful assistant representing [name]. Answer questions based on the info blocks provided..."
          />
        </FormField>

        {/* Save Button */}
        <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="w-full sm:w-auto"
          >
            {saving ? 'Saving...' : 'Save'}
          </Button>
          {message && (
            <p
              className={`text-sm ${
                message.includes('success')
                  ? 'text-green-400'
                  : 'text-red-400'
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
