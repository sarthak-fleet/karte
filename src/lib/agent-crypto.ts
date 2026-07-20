const API_KEY_PREFIX = 'kk_';

function pepper(): string {
  return (
    process.env.BETTER_AUTH_SECRET ||
    process.env.AUTH_SECRET ||
    'karte-dev-pepper'
  );
}

export async function hashSecret(value: string): Promise<string> {
  const data = new TextEncoder().encode(`${pepper()}:${value}`);
  const digest = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function generateApiKeyRaw(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  const body = btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  return `${API_KEY_PREFIX}${body}`;
}

export function apiKeyPrefix(rawKey: string): string {
  return rawKey.slice(0, 12);
}

export function isApiKeyFormat(value: string): boolean {
  return (
    value.startsWith(API_KEY_PREFIX) && value.length > API_KEY_PREFIX.length + 8
  );
}

export function generateAuthCode(): string {
  const [randomValue = 0] = crypto.getRandomValues(new Uint32Array(1));
  const n = randomValue % 1_000_000;
  return n.toString().padStart(6, '0');
}
