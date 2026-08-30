const TOKEN_KEY = "relay_token";

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
  }
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers);
  if (!headers.has("Content-Type") && init.body) headers.set("Content-Type", "application/json");
  const token = getToken();
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const res = await fetch(path, { ...init, headers });
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get("content-type") ?? "";
  if (contentType.includes("text/csv")) {
    return (await res.text()) as T;
  }

  const data = contentType.includes("application/json") ? await res.json() : await res.text();
  if (!res.ok) {
    const err = data?.error ?? {};
    throw new ApiError(res.status, err.code ?? "ERROR", err.message ?? res.statusText, err.details);
  }
  return data as T;
}

export type User = { id: string; email: string; name: string; createdAt: string };

export type Link = {
  id: string;
  originalUrl: string;
  slug: string;
  title: string | null;
  expiresAt: string | null;
  isActive: boolean;
  clickCount: number;
  createdAt: string;
  updatedAt: string;
  shortUrl: string;
  qrUrl: string;
  expired: boolean;
  status: "active" | "expired" | "disabled";
};

export type NamedCount = { name: string; count: number };
export type Point = { t: string; clicks: number };

export const api = {
  register: (body: { name: string; email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/register", { method: "POST", body: JSON.stringify(body) }),
  login: (body: { email: string; password: string }) =>
    request<{ token: string; user: User }>("/api/auth/login", { method: "POST", body: JSON.stringify(body) }),
  me: () => request<{ user: User }>("/api/auth/me"),
  overview: (range: string) => request<Overview>(`/api/analytics/overview?range=${range}`),
  links: (params: { page?: number; q?: string; status?: string }) => {
    const q = new URLSearchParams();
    if (params.page) q.set("page", String(params.page));
    if (params.q) q.set("q", params.q);
    if (params.status) q.set("status", params.status);
    return request<{ items: Link[]; page: number; total: number; pageCount: number }>(`/api/links?${q}`);
  },
  createLink: (body: { originalUrl: string; slug?: string; title?: string; expiresAt?: string | null }) =>
    request<{ link: Link }>("/api/links", { method: "POST", body: JSON.stringify(body) }),
  getLink: (id: string) => request<{ link: Link }>(`/api/links/${id}`),
  updateLink: (id: string, body: Partial<{ originalUrl: string; slug: string; title: string | null; expiresAt: string | null; isActive: boolean }>) =>
    request<{ link: Link }>(`/api/links/${id}`, { method: "PATCH", body: JSON.stringify(body) }),
  deleteLink: (id: string) => request<{ ok: boolean }>(`/api/links/${id}`, { method: "DELETE" }),
  linkAnalytics: (id: string, range: string) => request<LinkAnalytics>(`/api/links/${id}/analytics?range=${range}`),
  exportClicks: (id: string) => request<string>(`/api/links/${id}/export`),
  keys: () => request<{ keys: ApiKeyRow[] }>("/api/keys"),
  createKey: (name: string) =>
    request<{ key: ApiKeyRow & { key: string; warning: string } }>("/api/keys", {
      method: "POST",
      body: JSON.stringify({ name }),
    }),
  revokeKey: (id: string) => request<{ ok: boolean }>(`/api/keys/${id}`, { method: "DELETE" }),
};

export type ApiKeyRow = {
  id: string;
  name: string;
  keyPrefix: string;
  createdAt: string;
  lastUsedAt: string | null;
};

export type Overview = {
  range: string;
  totals: { links: number; clicks: number; uniqueClicks: number };
  timeseries: Point[];
  countries: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  referrers: NamedCount[];
  topLinks: Link[];
  recent: {
    id: string;
    slug: string;
    title: string | null;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    referrer: string | null;
    clickedAt: string;
  }[];
};

export type LinkAnalytics = {
  link: Link;
  range: string;
  totals: { clicks: number; uniqueClicks: number; lifetimeClicks: number };
  timeseries: Point[];
  countries: NamedCount[];
  devices: NamedCount[];
  browsers: NamedCount[];
  os: NamedCount[];
  referrers: NamedCount[];
  recent: {
    id: string;
    country: string | null;
    city: string | null;
    device: string | null;
    browser: string | null;
    os: string | null;
    referrer: string | null;
    clickedAt: string;
  }[];
};
