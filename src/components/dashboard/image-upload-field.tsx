'use client';

import { useId, useRef, useState } from 'react';

import {
  ALLOWED_IMAGE_CONTENT_TYPES,
  isSupportedImageContentType,
  MAX_IMAGE_UPLOAD_BYTES,
  MAX_IMAGE_UPLOAD_SIZE_MB,
} from '@/lib/validation';

interface ImageUploadFieldProps {
  pageId?: string;
  kind: 'avatar' | 'project';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  helpText?: string;
  onUploadingChange?: (uploading: boolean) => void;
}

export function ImageUploadField({
  pageId,
  kind,
  label,
  value,
  onChange,
  placeholder,
  helpText,
  onUploadingChange,
}: ImageUploadFieldProps) {
  const inputId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>(
    'success',
  );

  function updateMessage(nextMessage: string, type: 'error' | 'success') {
    setMessage(nextMessage);
    setMessageType(type);
  }

  function setUploadingState(nextUploading: boolean) {
    setUploading(nextUploading);
    onUploadingChange?.(nextUploading);
  }

  async function handleFileSelect(event: React.ChangeEvent<HTMLInputElement>) {
    const selectedFile = event.target.files?.[0];
    event.target.value = '';

    if (!selectedFile) {
      return;
    }

    if (!pageId) {
      updateMessage('Create the page first before uploading images.', 'error');
      return;
    }

    if (!isSupportedImageContentType(selectedFile.type)) {
      updateMessage(
        'Only JPG, PNG, WebP, GIF, and AVIF images are supported.',
        'error',
      );
      return;
    }

    if (selectedFile.size > MAX_IMAGE_UPLOAD_BYTES) {
      updateMessage(
        `Images must be ${MAX_IMAGE_UPLOAD_SIZE_MB}MB or smaller.`,
        'error',
      );
      return;
    }

    setUploadingState(true);
    setMessage('');

    try {
      const formData = new FormData();
      formData.append('pageId', pageId);
      formData.append('kind', kind);
      formData.append('file', selectedFile);

      const response = await fetch('/api/uploads/images', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(data?.error ?? 'Failed to upload image');
      }

      if (!data?.url || typeof data.url !== 'string') {
        throw new Error('Upload finished without a file URL.');
      }

      onChange(data.url);
      updateMessage('Image uploaded successfully.', 'success');
    } catch (error) {
      updateMessage(
        error instanceof Error ? error.message : 'Failed to upload image.',
        'error',
      );
    } finally {
      setUploadingState(false);
    }
  }

  const preview = value.trim();
  const canUpload = Boolean(pageId);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label
          htmlFor={inputId}
          className="block text-sm font-medium text-karte-text"
        >
          {label}
        </label>
        <span className="text-xs text-karte-text-4">
          Upload from device or paste a URL
        </span>
      </div>

      {preview && (
        <div
          className={`mb-3 overflow-hidden border border-karte-border-emphasis bg-white/5 ${
            kind === 'avatar'
              ? 'h-20 w-20 rounded-full bg-cover bg-center'
              : 'h-40 w-full rounded-2xl bg-cover bg-center'
          }`}
          style={{ backgroundImage: `url(${preview})` }}
        />
      )}

      <div className="mb-3 flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!canUpload || uploading}
          onClick={() => fileInputRef.current?.click()}
          className="rounded-full bg-white/[0.05] px-4 py-2 text-sm font-medium text-karte-text transition-colors duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.08] disabled:cursor-not-allowed disabled:opacity-50"
        >
          {uploading
            ? 'Uploading...'
            : `Upload ${kind === 'avatar' ? 'Avatar' : 'Image'}`}
        </button>
        <button
          type="button"
          disabled={!preview}
          onClick={() => {
            onChange('');
            setMessage('');
          }}
          className="rounded-lg border border-karte-border-emphasis px-4 py-2 text-sm text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Clear
        </button>
        <span className="text-xs text-karte-text-4">
          Up to {MAX_IMAGE_UPLOAD_SIZE_MB}MB. JPG, PNG, WebP, GIF, AVIF.
        </span>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ALLOWED_IMAGE_CONTENT_TYPES.join(',')}
        onChange={handleFileSelect}
        className="hidden"
      />

      <input
        id={inputId}
        type="url"
        value={value}
        onChange={(event) => {
          onChange(event.target.value);
          if (messageType === 'success') {
            setMessage('');
          }
        }}
        placeholder={placeholder}
        className="w-full rounded-lg bg-white/[0.045] px-4 py-2.5 text-sm text-karte-text placeholder:text-karte-text-4 outline-none ring-1 ring-inset ring-transparent transition-all duration-200 ease-[var(--karte-ease)] hover:bg-white/[0.06] focus:bg-white/[0.06] focus:ring-karte-accent/35"
      />

      <p className="mt-2 text-xs text-karte-text-4">
        {helpText ?? 'Upload an image from this device or paste a public URL.'}
        {!canUpload && ' Create the page first to unlock uploads.'}
      </p>

      {message && (
        <p
          className={`mt-2 text-sm ${
            messageType === 'success' ? 'text-green-400' : 'text-red-400'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
