export function extractDriveImageId(url: string): string | null {
  if (!url) return null;
  
  // Format 1: https://drive.google.com/file/d/FILE_ID/view
  const match1 = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
  if (match1) return match1[1];
  
  // Format 2: https://drive.google.com/open?id=FILE_ID
  const match2 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
  if (match2) return match2[1];

  // Format 3: https://drive.google.com/uc?id=FILE_ID
  if (url.includes('drive.google.com/uc')) {
     const match3 = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
     if (match3) return match3[1];
  }

  return null;
}

export function getDriveImageUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  
  // If it's already a valid image URL (not a drive view link)
  if (!url.includes('drive.google.com')) return url;
  
  const id = extractDriveImageId(url);
  if (id) {
    return `https://drive.google.com/uc?export=view&id=${id}`;
  }
  
  return url;
}
