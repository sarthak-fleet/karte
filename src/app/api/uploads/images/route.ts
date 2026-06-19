import { NextResponse } from 'next/server';

import { loadOwnedPage, requireUser } from '@/lib/api-auth';
import {
  createR2ImageObjectKey,
  isR2Configured,
  uploadImageToR2,
} from '@/lib/r2';
import {
  isSupportedImageContentType,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_SIZE_MB,
} from '@/lib/validation';

export const runtime = 'nodejs';

type UploadKind = 'avatar' | 'project';

function isUploadFile(
  value: FormDataEntryValue | null,
): value is File {
  return Boolean(
    value &&
      typeof value !== 'string' &&
      typeof value.arrayBuffer === 'function' &&
      typeof value.type === 'string' &&
      typeof value.name === 'string',
  );
}

function isUploadKind(value: string): value is UploadKind {
  return value === 'avatar' || value === 'project';
}

export async function POST(req: Request) {
  const auth = await requireUser();
  if ('error' in auth) return auth.error;

  if (!isR2Configured()) {
    return NextResponse.json(
      {
        error:
          'R2 is not configured yet. Add CLOUDFLARE_ACCOUNT_ID, R2_BUCKET_NAME, R2_PUBLIC_BASE_URL, R2_ACCESS_KEY_ID, and R2_SECRET_ACCESS_KEY to your environment.',
      },
      { status: 503 },
    );
  }

  const formData = await req.formData();
  const pageId = formData.get('pageId');
  const kind = formData.get('kind');
  const file = formData.get('file');

  if (typeof pageId !== 'string' || !pageId) {
    return NextResponse.json({ error: 'pageId is required' }, { status: 400 });
  }

  if (typeof kind !== 'string' || !isUploadKind(kind)) {
    return NextResponse.json(
      { error: 'kind must be avatar or project' },
      { status: 400 },
    );
  }

  if (!isUploadFile(file)) {
    return NextResponse.json({ error: 'file is required' }, { status: 400 });
  }

  const page = await loadOwnedPage(pageId, auth.userId);

  if (!page) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!file.size) {
    return NextResponse.json({ error: 'File is empty' }, { status: 400 });
  }

  if (!isSupportedImageContentType(file.type)) {
    return NextResponse.json(
      { error: 'Only JPG, PNG, WebP, GIF, and AVIF images are supported' },
      { status: 400 },
    );
  }

  if (file.size > MAX_IMAGE_UPLOAD_BYTES) {
    return NextResponse.json(
      {
        error: `Images must be ${MAX_IMAGE_UPLOAD_SIZE_MB}MB or smaller`,
      },
      { status: 400 },
    );
  }

  try {
    const objectKey = createR2ImageObjectKey({
      pageId,
      kind,
      fileName: file.name,
      contentType: file.type,
    });

    const { url } = await uploadImageToR2({
      objectKey,
      body: Buffer.from(await file.arrayBuffer()),
      contentType: file.type,
    });

    return NextResponse.json({ url, objectKey });
  } catch (error) {
    console.error('Failed to upload image to R2', error);

    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 },
    );
  }
}
