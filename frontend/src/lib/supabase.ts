import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const BUCKET = process.env.NEXT_PUBLIC_SUPABASE_BUCKET ?? 'storage';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Upload a file to Supabase Storage and return its public URL.
 * @param file      The File object to upload.
 * @param folder    Sub-folder inside the bucket (e.g. "avatars", "chat", "documents").
 * @param fileName  Optional custom file name; defaults to a timestamped unique name.
 */
export async function uploadFile(
  file: File,
  folder: 'avatars' | 'chat' | 'documents',
  fileName?: string,
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'bin';
  const name = fileName ?? `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;
  const path = `${folder}/${name}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

/** Convenience wrapper — upload a profile avatar, keyed by userId. */
export function uploadAvatar(file: File, userId: string) {
  return uploadFile(file, 'avatars', `${userId}.${file.name.split('.').pop() ?? 'png'}`);
}

/** Convenience wrapper — upload a chat attachment. */
export function uploadChatFile(file: File) {
  return uploadFile(file, 'chat');
}

/** Convenience wrapper — upload a leave / academic document. */
export function uploadDocument(file: File) {
  return uploadFile(file, 'documents');
}

// --- localStorage helpers for profile photo (no DB migration needed) ---

const PHOTO_KEY = (userId: string) => `sns_profile_photo_${userId}`;

export function saveProfilePhotoLocally(userId: string, url: string) {
  try { localStorage.setItem(PHOTO_KEY(userId), url); } catch { /* ignore */ }
}

export function getProfilePhotoLocally(userId: string): string | null {
  try { return localStorage.getItem(PHOTO_KEY(userId)); } catch { return null; }
}
