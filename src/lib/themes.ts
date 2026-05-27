export const THEME_PRESETS = [
  {
    id: 'karte',
    label: 'Karte Default',
    description:
      'Editorial dark — off-black, hairline borders, single cyan accent. Matches the marketing site.',
    gradientFrom: '#67e8f9',
    gradientTo: '#0a0a0a',
    accentColor: '#67e8f9',
  },
  {
    id: 'atelier',
    label: 'Atelier Noir',
    description: 'Graphite, champagne, and restrained product polish.',
    gradientFrom: '#f2c879',
    gradientTo: '#b95c3c',
    accentColor: '#f2c879',
  },
  {
    id: 'aurora',
    label: 'Aurora Glass',
    description: 'Cool cyan, deep glass, and crisp digital highlights.',
    gradientFrom: '#22d3ee',
    gradientTo: '#34d399',
    accentColor: '#67e8f9',
  },
  {
    id: 'sunset',
    label: 'Sunset Signal',
    description: 'Warm coral, amber light, and high-energy contrast.',
    gradientFrom: '#fb7185',
    gradientTo: '#f59e0b',
    accentColor: '#fdba74',
  },
  {
    id: 'violet',
    label: 'Electric Violet',
    description: 'Indigo, magenta, and a louder creator glow.',
    gradientFrom: '#8b5cf6',
    gradientTo: '#ec4899',
    accentColor: '#c4b5fd',
  },
  {
    id: 'forest',
    label: 'Forest Studio',
    description: 'Emerald, lime, and a grounded portfolio feel.',
    gradientFrom: '#10b981',
    gradientTo: '#84cc16',
    accentColor: '#bef264',
  },
  {
    id: 'editorial',
    label: 'Editorial Ink',
    description: 'Ink, ivory, and restrained newspaper polish.',
    gradientFrom: '#f4efe4',
    gradientTo: '#64748b',
    accentColor: '#f8fafc',
  },
  {
    id: 'midnight',
    label: 'Midnight Chrome',
    description: 'Graphite, silver, and commercial product sheen.',
    gradientFrom: '#94a3b8',
    gradientTo: '#38bdf8',
    accentColor: '#e2e8f0',
  },
  {
    id: 'studio',
    label: 'Studio Bloom',
    description: 'Rose, blue, and soft creative direction.',
    gradientFrom: '#f472b6',
    gradientTo: '#60a5fa',
    accentColor: '#f9a8d4',
  },
  {
    id: 'terminal',
    label: 'Terminal Club',
    description: 'Black, acid green, and hacker-room energy.',
    gradientFrom: '#a3e635',
    gradientTo: '#14b8a6',
    accentColor: '#d8ff6f',
  },
] as const;

export type ThemePresetId = (typeof THEME_PRESETS)[number]['id'];
export type ChatPosition = 'bottom-right' | 'bottom-left';

export type ThemeConfig = {
  presetId?: ThemePresetId;
  gradientFrom?: string;
  gradientTo?: string;
  accentColor?: string;
  chatPosition?: ChatPosition;
};

export const CHAT_POSITIONS = [
  { value: 'bottom-right', label: 'Bottom right' },
  { value: 'bottom-left', label: 'Bottom left' },
] as const;

export function isChatPosition(value: string): value is ChatPosition {
  return CHAT_POSITIONS.some((position) => position.value === value);
}

export const DEFAULT_THEME_PRESET = THEME_PRESETS[0];

export function isThemePresetId(value: string): value is ThemePresetId {
  return THEME_PRESETS.some((preset) => preset.id === value);
}

export function resolveThemeConfig(config?: ThemeConfig | null) {
  const preset = THEME_PRESETS.find((item) => item.id === config?.presetId)
    ?? DEFAULT_THEME_PRESET;

  return {
    presetId: preset.id,
    label: preset.label,
    description: preset.description,
    gradientFrom: config?.gradientFrom ?? preset.gradientFrom,
    gradientTo: config?.gradientTo ?? preset.gradientTo,
    accentColor: config?.accentColor ?? preset.accentColor,
    chatPosition: config?.chatPosition ?? 'bottom-right',
  };
}
