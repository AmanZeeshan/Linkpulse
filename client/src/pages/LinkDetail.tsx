import { FormEvent, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Copy, Download } from "lucide-react";
import { api, ApiError, type LinkAnalytics } from "../api";
import { Badge, Button, Card, ErrorText, Input, Label, RangePills, copy, fmt, when } from "../components/ui";
import { ClicksChart, Donut, RankedBars } from "../components/Charts";

export function LinkDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<LinkAnalytics | null>(null);
  const [error, setError] = useState("");
  const [note, setNote] = useState("");

  const [originalUrl, setOriginalUrl] = useState("");
  const [slug, setSlug] = useState("");
  const [title, setTitle] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [isActive, setIsActive] = useState(true);

  async function load() {
    if (!id) return;
    const res = await api.linkAnalytics(id, range);
    setData(res);
    setOriginalUrl(res.link.originalUrl);
    setSlug(res.link.slug);
    setTitle(res.link.title ?? "");
    setExpiresAt(res.link.expiresAt ? res.link.expiresAt.slice(0, 16) : "");
    setIsActive(res.link.isActive);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, [id, range]);

  async function save(e: FormEvent) {
    e.preventDefault();
    if (!id) return;
    setError("");
    try {
      await api.updateLink(id, {
        originalUrl,
        slug,
        title: title || null,
        expiresAt: expiresAt ? new Date(expiresAt).toISOString() : null,
        isActive,
      });
      setNote("Saved");
      setTimeout(() => setNote(""), 1200);
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Update failed");
    }
  }

  async function remove() {
    if (!id || !confirm("Delete this link and all of its click history?")) return;
    await api.deleteLink(id);
    navigate("/app/links");
  }

  async function downloadCsv() {
    if (!id || !data) return;
    const body = await api.exportClicks(id);
    const blob = new Blob([body], { type: "text/csv" });
    const href = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = href;
    a.download = `${data.link.slug}-clicks.csv`;
    a.click();
    URL.revokeObjectURL(href);
  }

  if (!data) return <p className="text-mist-500">{error || "Loading link…"}</p>;

  return (
    <div className="space-y-6">
      <Link to="/app/links" className="inline-flex items-center gap-2 text-sm text-mist-500 hover:text-mist-100">
        <ArrowLeft size={14} /> All links
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-3xl font-bold">/{data.link.slug}</h1>
            <Badge status={data.link.status} />
          </div>
          <p className="mt-2 max-w-2xl truncate text-sm text-mist-500">{data.link.originalUrl}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button
              variant="soft"
              onClick={async () => {
                await copy(data.link.shortUrl);
                setNote("Copied short URL");
                setTimeout(() => setNote(""), 1200);
              }}
            >
              <Copy size={14} /> {data.link.shortUrl}
            </Button>
            <Button variant="ghost" onClick={downloadCsv}>
              <Download size={14} /> Export CSV
            </Button>
          </div>
        </div>
        <div className="rounded-2xl border border-ink-600 bg-white p-2">
          <img src={data.link.qrUrl} alt="QR code" className="h-36 w-36" />
        </div>
      </header>

      <div className="flex items-center justify-between">
        <div className="grid grid-cols-3 gap-3">
          {[
            ["Period clicks", data.totals.clicks],
            ["Unique IPs", data.totals.uniqueClicks],
            ["Lifetime", data.totals.lifetimeClicks],
          ].map(([label, value]) => (
            <Card key={String(label)} className="px-4 py-3">
              <div className="text-[11px] uppercase tracking-wider text-mist-500">{label}</div>
              <div className="font-display text-2xl font-bold">{fmt(Number(value))}</div>
            </Card>
          ))}
        </div>
        <RangePills value={range} onChange={setRange} />
      </div>

      <Card className="p-5">
        <ClicksChart data={data.timeseries} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-4">
        <Card className="p-5">
          <h2 className="mb-2 text-sm text-mist-300">Countries</h2>
          <RankedBars data={data.countries} color="#3dffb0" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm text-mist-300">Devices</h2>
          <Donut data={data.devices} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm text-mist-300">Browsers</h2>
          <Donut data={data.browsers} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-2 text-sm text-mist-300">Referrers</h2>
          <RankedBars data={data.referrers} color="#ff8a4c" />
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-[1fr_1.2fr]">
        <Card className="p-5">
          <h2 className="mb-4 font-display text-xl font-bold">Configure</h2>
          <form onSubmit={save} className="space-y-3">
            <div>
              <Label>Destination</Label>
              <Input value={originalUrl} onChange={(e) => setOriginalUrl(e.target.value)} />
            </div>
            <div>
              <Label>Slug</Label>
              <Input value={slug} onChange={(e) => setSlug(e.target.value)} />
            </div>
            <div>
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Expiration</Label>
              <Input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
            </div>
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
              Active
            </label>
            <ErrorText>{error}</ErrorText>
            {note && <p className="text-sm text-signal">{note}</p>}
            <div className="flex gap-2">
              <Button type="submit">Save changes</Button>
              <Button type="button" variant="danger" onClick={remove}>
                Delete
              </Button>
            </div>
          </form>
        </Card>

        <Card className="overflow-hidden">
          <div className="border-b border-ink-600 px-5 py-3 text-sm text-mist-300">Latest hits</div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-mist-500">
                <tr>
                  <th className="px-5 py-2 font-medium">When</th>
                  <th className="px-5 py-2 font-medium">Geo</th>
                  <th className="px-5 py-2 font-medium">Client</th>
                  <th className="px-5 py-2 font-medium">Referrer</th>
                </tr>
              </thead>
              <tbody>
                {data.recent.map((c) => (
                  <tr key={c.id} className="border-t border-ink-600">
                    <td className="px-5 py-2 font-mono text-xs">{when(c.clickedAt)}</td>
                    <td className="px-5 py-2">
                      {c.city ? `${c.city}, ` : ""}
                      {c.country}
                    </td>
                    <td className="px-5 py-2 text-mist-300">
                      {c.device} · {c.browser} · {c.os}
                    </td>
                    <td className="px-5 py-2 font-mono text-xs">{c.referrer}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
}
