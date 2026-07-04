import 'server-only';

import { getCloudflareContext } from '@opennextjs/cloudflare';

type ImageUploadKind = 'avatar' | 'project';

interface R2HttpMetadata {
  contentType?: string;
  cacheControl?: string;
  contentDisposition?: string;
}
interface R2BucketLike {
  put(
    key: string,
    value: ArrayBuffer | ArrayBufferView | Uint8Array | string,
    options?: { httpMetadata?: R2HttpMetadata },
  ): Promise<unknown>;
}

function getEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function getR2Bucket(): R2BucketLike | null {
  try {
    const { env } = getCloudflareContext();
    return (
      (env as unknown as { IMAGES_BUCKET?: R2BucketLike }).IMAGES_BUCKET ?? null
    );
  } catch {
    return null;
  }
}

function getFileExtension(fileName: string, contentType: string): string {
  const extensionFromName = fileName.split('.').pop()?.toLowerCase();

  if (extensionFromName && /^[a-z0-9]+$/.test(extensionFromName)) {
    return extensionFromName;
  }

  switch (contentType) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    case 'image/gif':
      return 'gif';
    case 'image/avif':
      return 'avif';
    default:
      return 'bin';
  }
}

function encodeObjectKeyForUrl(objectKey: string): string {
  return objectKey
    .split('/')
    .map((segment) => encodeURIComponent(segment))
    .join('/');
}

export function isR2Configured(): boolean {
  if (!getEnv('R2_PUBLIC_BASE_URL')) return false;
  return getR2Bucket() !== null;
}

export function createR2ImageObjectKey(args: {
  pageId: string;
  kind: ImageUploadKind;
  fileName: string;
  contentType: string;
}): string {
  const extension = getFileExtension(args.fileName, args.contentType);

  return `pages/${args.pageId}/${args.kind}/${Date.now()}-${crypto.randomUUID()}.${extension}`;
}

export function buildR2PublicUrl(objectKey: string): string {
  const baseUrl = (getEnv('R2_PUBLIC_BASE_URL') ?? '').replace(/\/+$/, '');
  if (!baseUrl) {
    throw new Error(
      'Missing required environment variable: R2_PUBLIC_BASE_URL',
    );
  }
  return `${baseUrl}/${encodeObjectKeyForUrl(objectKey)}`;
}

export async function uploadImageToR2(args: {
  objectKey: string;
  body: Buffer;
  contentType: string;
}) {
  const bucket = getR2Bucket();
  if (!bucket) {
    throw new Error('R2 binding IMAGES_BUCKET is not configured');
  }

  await bucket.put(args.objectKey, args.body as unknown as ArrayBuffer, {
    httpMetadata: {
      contentType: args.contentType,
      cacheControl: 'public, max-age=31536000, immutable',
      contentDisposition: 'inline',
    },
  });

  return {
    objectKey: args.objectKey,
    url: buildR2PublicUrl(args.objectKey),
  };
}

// ── Inbound email body storage (private, not exposed via public URL) ──
// Email bodies are stored under pages/{pageId}/inbox/ and read back via
// the R2 binding directly — never through R2_PUBLIC_BASE_URL, since these
// are private user correspondence.

type R2BucketFull = R2BucketLike & {
  get(key: string): Promise<{
    body: ReadableStream;
    arrayBuffer(): Promise<ArrayBuffer>;
  } | null>;
  delete(key: string): Promise<void>;
};

function getR2BucketFull(): R2BucketFull | null {
  try {
    const { env } = getCloudflareContext();
    return (
      (env as unknown as { IMAGES_BUCKET?: R2BucketFull }).IMAGES_BUCKET ?? null
    );
  } catch {
    return null;
  }
}

export function createEmailBodyObjectKey(pageId: string): string {
  return `pages/${pageId}/inbox/${Date.now()}-${crypto.randomUUID()}.eml`;
}

export async function uploadEmailBodyToR2(args: {
  objectKey: string;
  body: Uint8Array | ArrayBuffer | string;
}): Promise<void> {
  const bucket = getR2BucketFull();
  if (!bucket) {
    throw new Error('R2 binding IMAGES_BUCKET is not configured');
  }
  await bucket.put(args.objectKey, args.body as unknown as ArrayBuffer, {
    httpMetadata: {
      contentType: 'message/rfc822',
      cacheControl: 'private, no-store',
    },
  });
}

export async function getEmailBodyFromR2(
  objectKey: string,
): Promise<Uint8Array | null> {
  const bucket = getR2BucketFull();
  if (!bucket) return null;
  const obj = await bucket.get(objectKey);
  if (!obj) return null;
  const buf = await obj.arrayBuffer();
  return new Uint8Array(buf);
}

export async function deleteEmailBodyFromR2(objectKey: string): Promise<void> {
  const bucket = getR2BucketFull();
  if (!bucket) return;
  await bucket.delete(objectKey);
}
