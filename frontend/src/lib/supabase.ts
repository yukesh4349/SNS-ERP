import { apiBaseUrl } from '../services/api-client';
import { readSession } from './session-storage';

/**
 * Upload a file to the backend and return its public URL.
 * @param file      The File object to upload.
 * @param folder    Sub-folder inside the bucket (e.g. "avatars", "chat", "documents").
 * @param fileName  Optional custom file name (currently ignored in favor of backend generation).
 */
export async function uploadFile(
  file: File,
  folder: 'avatars' | 'chat' | 'documents' | 'announcements',
  fileName?: string,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);

  const session = readSession();
  const headers: Record<string, string> = {};
  if (session?.accessToken) {
    headers['Authorization'] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${apiBaseUrl}/uploads/${folder}`, {
    method: 'POST',
    body: formData,
    headers,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(errorText || 'File upload failed');
  }

  const data = await response.json();
  return `${apiBaseUrl}${data.url}`;
}

/** Convenience wrapper — upload a profile avatar, keyed by userId. */
export function uploadAvatar(file: File, userId: string) {
  return uploadFile(file, 'avatars');
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
