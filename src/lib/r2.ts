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
