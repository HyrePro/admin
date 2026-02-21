export type FetchContext = {
  baseUrl?: string;
  headers?: HeadersInit;
  cache?: RequestCache;
};

export async function fetchJson<T>(
  path: string,
  context?: FetchContext,
  init?: RequestInit,
): Promise<T> {
  const url = context?.baseUrl ? `${context.baseUrl}${path}` : path;

  const response = await fetch(url, {
    ...init,
    headers: {
      ...(context?.headers || {}),
      ...(init?.headers || {}),
    },
    cache: context?.cache ?? init?.cache ?? "no-store",
  });

  if (!response.ok) {
    throw new Error(`Request failed (${response.status}) for ${path}`);
  }

  return (await response.json()) as T;
}

