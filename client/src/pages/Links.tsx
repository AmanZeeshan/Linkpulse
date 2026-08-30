import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Plus, Copy, Check } from "lucide-react";
import { api, ApiError, type Link as LinkRow } from "../api";
import { Badge, Button, Card, ErrorText, Input, Label, Select, copy, fmt, when } from "../components/ui";

export function LinksPage() {
  const [items, setItems] = useState<LinkRow[]>([]);
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);

  async function load() {
    const res = await api.links({ page, q, status });
    setItems(res.items);
    setPageCount(res.pageCount);
  }

  useEffect(() => {
    load().catch(console.error);
  }, [page, status]);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Inventory</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Links</h1>
        </div>
        <Button onClick={() => setOpen(true)}>
          <Plus size={16} /> New short URL
        </Button>
      </header>

      <div className="flex flex-wrap gap-2">
        <form
          className="flex min-w-[16rem] flex-1 gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            setPage(1);
            load();
          }}
        >
          <Input placeholder="Search slug, title, or destination" value={q} onChange={(e) => setQ(e.target.value)} />
          <Button type="submit" variant="soft">
            Search
          </Button>
        </form>
        <Select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="disabled">Disabled</option>
        </Select>
      </div>

      {open && <CreatePanel onClose={() => setOpen(false)} onCreated={() => { setOpen(false); load(); }} />}

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-600 text-xs uppercase tracking-wider text-mist-500">
            <tr>
              <th className="px-5 py-3 font-medium">Slug</th>
              <th className="px-5 py-3 font-medium">Destination</th>
              <th className="px-5 py-3 font-medium">Clicks</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {items.map((row) => (
              <tr key={row.id} className="border-b border-ink-600 last:border-0">
                <td className="px-5 py-3 font-mono">
                  <Link to={`/app/links/${row.id}`} className="text-signal hover:underline">
                    /{row.slug}
                  </Link>
                </td>
                <td className="max-w-[22rem] truncate px-5 py-3 text-mist-300">{row.title || row.originalUrl}</td>
                <td className="px-5 py-3 font-mono">{fmt(row.clickCount)}</td>
                <td className="px-5 py-3">
                  <Badge status={row.status} />
                </td>
                <td className="px-5 py-3 font-mono text-xs text-mist-500">{when(row.createdAt)}</td>
                <td className="px-5 py-3">
                  <button
                    className="text-mist-500 hover:text-mist-100"
                    onClick={async () => {
                      await copy(row.shortUrl);
                      setCopied(row.id);
                      setTimeout(() => setCopied(null), 1200);
                    }}
                  >
                    {copied === row.id ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-10 text-center text-mist-500">
                  No links yet. Create one to start ingesting clicks.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <div className="flex items-center justify-end gap-2 text-sm">
        <Button variant="ghost" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
          Prev
        </Button>
        <span className="font-mono text-mist-500">
          {page} / {pageCount}
        </span>
        <Button variant="ghost" disabled={page >= pageCount} onClick={() => setPage((p) => p + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

function CreatePanel({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [originalUrl, setOriginalUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api.createLink({
        originalUrl,
        slug: slug || undefined,
        title: title || undefined,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
      });
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="p-5">
      <form onSubmit={submit} className="grid gap-4 md:grid-cols-2">
        <div className="md:col-span-2">
          <Label>Destination URL</Label>
          <Input required type="url" placeholder="https://…" value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} />
        </div>
        <div>
          <Label>Custom slug (optional)</Label>
          <Input placeholder="launch-week" value={slug} onChange={(e) => setSlug(e.target.value)} />
        </div>
        <div>
          <Label>Title</Label>
          <Input placeholder="Campaign name" value={title} onChange={(e) => setTitle(e.target.value)} />
        </div>
        <div>
          <Label>Expires at (optional)</Label>
          <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </div>
        <div className="flex items-end gap-2">
          <Button type="submit" disabled={busy}>
            {busy ? "Creating…" : "Create"}
          </Button>
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <div className="md:col-span-2">
          <ErrorText>{error}</ErrorText>
        </div>
      </form>
    </Card>
  );
}
