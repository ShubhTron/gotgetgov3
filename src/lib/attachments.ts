import { supabase } from './supabase';
import type { AttachmentPayload } from '../types/circles';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Determine attachment type from a File's MIME type */
export function getAttachmentType(file: File): AttachmentPayload['type'] {
  if (file.type.startsWith('image/')) return 'image';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('audio/')) return 'audio';
  return 'document';
}

/** Human-readable file size */
export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// ─── Upload ───────────────────────────────────────────────────────────────────

/**
 * Uploads a file to the `chat-attachments` Supabase Storage bucket.
 *
 * Returns `{ url: null, error: 'storage_not_configured' }` if the bucket
 * does not exist yet so callers can fall back gracefully.
 */
export async function uploadAttachment(
  file: File,
  conversationId: string,
): Promise<{ url: string | null; error?: string }> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const path = `${conversationId}/${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error } = await supabase.storage
    .from('chat-attachments')
    .upload(path, file, { cacheControl: '3600', upsert: false });

  if (error) {
    // Bucket not created yet → graceful no-op
    if (
      error.message.toLowerCase().includes('bucket not found') ||
      error.message.toLowerCase().includes('bucket')
    ) {
      return { url: null, error: 'storage_not_configured' };
    }
    return { url: null, error: error.message };
  }

  const { data } = supabase.storage.from('chat-attachments').getPublicUrl(path);
  return { url: data.publicUrl };
}
