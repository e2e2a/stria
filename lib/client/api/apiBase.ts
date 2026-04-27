const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');

export function apiUrl(path: string) {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
}

export async function readJsonResponse<T>(res: Response, fallbackMessage: string): Promise<T> {
  const json = await res.json().catch(() => null);
  if (!res.ok) {
    const message = json && typeof json === 'object' && 'message' in json ? String(json.message) : fallbackMessage;
    throw new Error(message);
  }
  return json as T;
}
