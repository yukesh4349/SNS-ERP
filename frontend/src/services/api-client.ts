const apiBaseUrl =
  (process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:5000").replace(/\/$/, "");

import { readSession, clearSession } from "../lib/session-storage";

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const session = readSession();
  
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(init.headers as Record<string, string> ?? {}),
  };

  if (session?.accessToken && session.accessToken !== "undefined" && session.accessToken.split(".").length === 3) {
    headers["Authorization"] = `Bearer ${session.accessToken}`;
  }

  const response = await fetch(`${apiBaseUrl}${cleanPath}`, {
    ...init,
    headers,
  });

  const text = await response.text();
  let data = {} as T & { message?: string };
  
  try {
    data = text ? (JSON.parse(text) as T & { message?: string }) : ({} as T & { message?: string });
  } catch {
    // Response is not valid JSON
    data = {} as T & { message?: string };
  }

  if (!response.ok) {
    if (response.status === 401) {
      // Don't immediately redirect to login here, as it might be a transient error
      // or the AuthProvider might be about to refresh the token.
      // However, we should still clear the session if the token is definitely invalid.
      // clearSession(); 
      console.warn(`Unauthorized access to ${cleanPath}. Session might be expired.`);
    }
    
    const errorMessage = (data as any).message || (data as any).error || text || `HTTP ${response.status}`;
    console.error(`API Error [${response.status}] ${cleanPath}:`, errorMessage);
    throw new Error(errorMessage);
  }

  return data;
}

export { apiBaseUrl };
