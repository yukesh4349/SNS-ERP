export function extractDriveImageId(url: string): string | null {
  if (!url) return null;
  
  // Format 1: https://drive.google.com/file/d/FILE_ID/...
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  
  // Format 2: https://drive.google.com/open?id=FILE_ID or ?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  // Format 3: https://drive.google.com/uc?...id=FILE_ID
  const match3 = url.match(/drive\.google\.com\/uc\?.*id=([a-zA-Z0-9_-]+)/);
  if (match3) return match3[1];

  // Format 4: https://lh3.googleusercontent.com/d/FILE_ID
  const match4 = url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (match4) return match4[1];

  return null;
}

export function getDriveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  
  // Check if it's a Google Drive URL
  if (trimmed.includes('drive.google.com') || trimmed.includes('googleusercontent.com')) {
    const id = extractDriveImageId(trimmed);
    if (id) {
      // Modern Google Drive image embed format that bypasses deprecation
      return `https://drive.google.com/thumbnail?id=${id}&sz=w1600`;
    }
  }
  
  return trimmed;
}
