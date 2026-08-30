import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api, type Overview } from "../api";
import { Card, RangePills, fmt, when } from "../components/ui";
import { ClicksChart, Donut, RankedBars } from "../components/Charts";

export function DashboardPage() {
  const [range, setRange] = useState("7d");
  const [data, setData] = useState<Overview | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    setError("");
    api.overview(range).then(setData).catch((e) => setError(e.message));
  }, [range]);

  if (error) return <p className="text-red-400">{error}</p>;
  if (!data) return <p className="text-mist-500">Loading telemetry…</p>;

  const stats = [
    { label: "Links", value: data.totals.links },
    { label: "Clicks", value: data.totals.clicks },
    { label: "Unique IPs", value: data.totals.uniqueClicks },
    { label: "Top country", value: data.countries[0]?.name ?? "—" },
  ];

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Overview</div>
          <h1 className="mt-1 font-display text-3xl font-bold">Traffic control</h1>
        </div>
        <RangePills value={range} onChange={setRange} />
      </header>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} className="px-5 py-4">
            <div className="text-xs uppercase tracking-wider text-mist-500">{s.label}</div>
            <div className="mt-2 font-display text-3xl font-bold">
              {typeof s.value === "number" ? fmt(s.value) : s.value}
            </div>
          </Card>
        ))}
      </div>

      <Card className="p-5">
        <h2 className="mb-3 text-sm font-medium text-mist-300">Clicks over time</h2>
        <ClicksChart data={data.timeseries} />
      </Card>

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-medium text-mist-300">Geography</h2>
          <RankedBars data={data.countries} color="#3dffb0" />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-medium text-mist-300">Devices</h2>
          <Donut data={data.devices} />
        </Card>
        <Card className="p-5">
          <h2 className="mb-3 text-sm font-medium text-mist-300">Referrers</h2>
          <RankedBars data={data.referrers} color="#ff8a4c" />
        </Card>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <Card className="overflow-hidden">
          <div className="border-b border-ink-600 px-5 py-3 text-sm text-mist-300">Top links</div>
          <ul>
            {data.topLinks.map((l) => (
              <li key={l.id} className="flex items-center justify-between gap-3 border-b border-ink-600 px-5 py-3 last:border-0">
                <div className="min-w-0">
                  <Link to={`/app/links/${l.id}`} className="font-mono text-sm text-signal hover:underline">
                    /{l.slug}
                  </Link>
                  <div className="truncate text-xs text-mist-500">{l.title || l.originalUrl}</div>
                </div>
                <div className="font-mono text-sm">{fmt(l.clickCount)}</div>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="overflow-hidden">
          <div className="border-b border-ink-600 px-5 py-3 text-sm text-mist-300">Recent clicks</div>
          <ul>
            {data.recent.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 border-b border-ink-600 px-5 py-3 text-sm last:border-0">
                <div>
                  <span className="font-mono text-signal">/{c.slug}</span>
                  <span className="ml-2 text-mist-500">
                    {c.city ? `${c.city}, ` : ""}
                    {c.country} · {c.device} · {c.referrer}
                  </span>
                </div>
                <span className="shrink-0 font-mono text-xs text-mist-500">{when(c.clickedAt)}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}
