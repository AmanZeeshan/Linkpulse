import { FormEvent, useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth";
import { ApiError } from "../api";
import { Button, ErrorText, Input, Label } from "../components/ui";

const features = [
  "JWT auth and hashed API keys",
  "Custom slugs with collision control",
  "Geo, device, browser, referrer ingest",
  "Expiring links and QR payloads",
  "Sliding-window rate limits",
  "Aggregated analytics dashboard",
];

export function AuthPage({ mode }: { mode: "login" | "register" }) {
  const { user, login, register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(mode === "login" ? "demo@relay.dev" : "");
  const [password, setPassword] = useState(mode === "login" ? "Demo1234!" : "");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to="/app" replace />;

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(name, email, password);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <section className="relative hidden overflow-hidden border-r border-ink-600 p-12 lg:flex lg:flex-col lg:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-signal font-display text-lg font-extrabold text-ink-950">
              R
            </span>
            <span className="font-display text-2xl font-bold">Relay</span>
          </div>
          <h1 className="mt-16 max-w-md font-display text-5xl font-extrabold leading-[1.05] tracking-tight">
            Short links.
            <br />
            Full telemetry.
          </h1>
          <p className="mt-5 max-w-md text-mist-300">
            A backend-forward URL platform: authenticated APIs, hashed keys, click pipelines, and an analytics surface
            that would not embarrass a production service.
          </p>
        </div>
        <ul className="grid grid-cols-2 gap-3">
          {features.map((f) => (
            <li key={f} className="rounded-xl border border-ink-600 bg-ink-800/70 px-4 py-3 text-sm text-mist-300">
              {f}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid place-items-center p-6">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4">
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-signal">
              {mode === "login" ? "Access" : "Create account"}
            </div>
            <h2 className="mt-2 font-display text-3xl font-bold">
              {mode === "login" ? "Sign in to Relay" : "Join Relay"}
            </h2>
          </div>

          {mode === "register" && (
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} required />
            </div>
          )}
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div>
            <Label>Password</Label>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          <ErrorText>{error}</ErrorText>
          <Button type="submit" disabled={busy} className="w-full">
            {busy ? "Working…" : mode === "login" ? "Enter dashboard" : "Create account"}
          </Button>
          <p className="text-sm text-mist-500">
            {mode === "login" ? (
              <>
                No account?{" "}
                <Link className="text-signal" to="/register">
                  Register
                </Link>
              </>
            ) : (
              <>
                Already using Relay?{" "}
                <Link className="text-signal" to="/">
                  Sign in
                </Link>
              </>
            )}
          </p>
          {mode === "login" && (
            <p className="rounded-lg border border-ink-600 bg-ink-800 px-3 py-2 font-mono text-xs text-mist-500">
              Demo seeded:  demo@relay.dev / Demo1234!
            </p>
          )}
        </form>
      </section>
    </div>
  );
}
