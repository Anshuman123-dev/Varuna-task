export const API_BASE = (import.meta as any).env.VITE_API_BASE || 'http://localhost:4000';
const TIMEOUT_MS = 10000; // 10 seconds

export class ApiTimeoutError extends Error {
  constructor() {
    super('Backend connection timeout - using fallback data');
    this.name = 'ApiTimeoutError';
  }
}

async function fetchWithTimeout(url: string, options: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error: any) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      throw new ApiTimeoutError();
    }
    throw error;
  }
}

export async function apiGetWithFallback<T>(
  path: string,
  fallbackData: T
): Promise<{ data: T; isFallback: boolean }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}${path}`);
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, isFallback: false };
  } catch (error) {
    console.warn(`API call failed for ${path}, using fallback data:`, error);
    // Notify that fallback is being used
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fallback-data-used'));
    }
    return { data: fallbackData, isFallback: true };
  }
}

export async function apiPostWithFallback<T>(
  path: string,
  body: any,
  fallbackData: T
): Promise<{ data: T; isFallback: boolean }> {
  try {
    const res = await fetchWithTimeout(`${API_BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body)
    });
    if (!res.ok) throw new Error(await res.text());
    const data = await res.json();
    return { data, isFallback: false };
  } catch (error) {
    console.warn(`API call failed for ${path}, using fallback data:`, error);
    // Notify that fallback is being used
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('fallback-data-used'));
    }
    return { data: fallbackData, isFallback: true };
  }
}

// Keep original functions for backward compatibility
export async function apiGet<T>(path: string): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function apiPost<T>(path: string, body: any): Promise<T> {
  const res = await fetchWithTimeout(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
