import { FormEvent, useEffect, useState } from "react";
import { api, ApiError, type ApiKeyRow } from "../api";
import { Button, Card, ErrorText, Input, Label, copy, when } from "../components/ui";

export function ApiKeysPage() {
  const [keys, setKeys] = useState<ApiKeyRow[]>([]);
  const [name, setName] = useState("CI pipeline");
  const [revealed, setRevealed] = useState<string | null>(null);
  const [error, setError] = useState("");

  async function load() {
    const res = await api.keys();
    setKeys(res.keys);
  }

  useEffect(() => {
    load().catch((e) => setError(e.message));
  }, []);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError("");
    try {
      const res = await api.createKey(name);
      setRevealed(res.key.key);
      setName("");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create key");
    }
  }

  return (
    <div className="space-y-6">
      <header>
        <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">Programmatic access</div>
        <h1 className="mt-1 font-display text-3xl font-bold">API keys</h1>
        <p className="mt-2 max-w-2xl text-sm text-mist-500">
          Keys are stored as SHA-256 hashes. The plaintext secret is shown once. Send it as{" "}
          <code className="font-mono text-mist-100">X-API-Key</code> or{" "}
          <code className="font-mono text-mist-100">Authorization: Bearer sk_live_…</code>. Rate limit: 120 req/min per
          key.
        </p>
      </header>

      <Card className="p-5">
        <form onSubmit={create} className="flex flex-wrap items-end gap-3">
          <div className="min-w-[16rem] flex-1">
            <Label>Key name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          <Button type="submit">Generate key</Button>
        </form>
        <ErrorText>{error}</ErrorText>
        {revealed && (
          <div className="mt-4 rounded-xl border border-signal/40 bg-signal/10 p-4">
            <div className="text-xs uppercase tracking-wider text-signal">Copy now — it will not be shown again</div>
            <div className="mt-2 flex items-center justify-between gap-3">
              <code className="break-all font-mono text-sm">{revealed}</code>
              <Button variant="soft" type="button" onClick={() => copy(revealed)}>
                Copy
              </Button>
            </div>
          </div>
        )}
      </Card>

      <Card className="overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-ink-600 text-xs uppercase tracking-wider text-mist-500">
            <tr>
              <th className="px-5 py-3 font-medium">Name</th>
              <th className="px-5 py-3 font-medium">Prefix</th>
              <th className="px-5 py-3 font-medium">Created</th>
              <th className="px-5 py-3 font-medium">Last used</th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {keys.map((k) => (
              <tr key={k.id} className="border-b border-ink-600 last:border-0">
                <td className="px-5 py-3">{k.name}</td>
                <td className="px-5 py-3 font-mono text-mist-300">{k.keyPrefix}</td>
                <td className="px-5 py-3 font-mono text-xs text-mist-500">{when(k.createdAt)}</td>
                <td className="px-5 py-3 font-mono text-xs text-mist-500">
                  {k.lastUsedAt ? when(k.lastUsedAt) : "Never"}
                </td>
                <td className="px-5 py-3">
                  <Button
                    variant="danger"
                    onClick={async () => {
                      await api.revokeKey(k.id);
                      await load();
                    }}
                  >
                    Revoke
                  </Button>
                </td>
              </tr>
            ))}
            {keys.length === 0 && (
              <tr>
                <td colSpan={5} className="px-5 py-8 text-center text-mist-500">
                  No active keys.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
