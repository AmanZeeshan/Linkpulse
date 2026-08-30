import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "danger" | "soft" }) {
  const styles = {
    primary: "bg-signal text-ink-950 hover:brightness-110",
    ghost: "bg-transparent text-mist-100 border border-ink-600 hover:bg-ink-700",
    danger: "bg-red-500/15 text-red-300 border border-red-500/30 hover:bg-red-500/25",
    soft: "bg-ink-700 text-mist-100 hover:bg-ink-600",
  }[variant];
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition disabled:opacity-50",
        styles,
        className,
      )}
      {...props}
    />
  );
}

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "w-full rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-mist-100 outline-none placeholder:text-mist-500 focus:border-signal/60",
        className,
      )}
      {...props}
    />
  );
}

export function Select({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "rounded-lg border border-ink-600 bg-ink-900 px-3 py-2 text-sm text-mist-100 outline-none focus:border-signal/60",
        className,
      )}
      {...props}
    />
  );
}

export function Label({ children }: { children: ReactNode }) {
  return <label className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-mist-500">{children}</label>;
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("rounded-2xl border border-ink-600 bg-ink-800/80 shadow-panel", className)}>{children}</div>
  );
}

export function Badge({ status }: { status: "active" | "expired" | "disabled" }) {
  const map = {
    active: "bg-signal/15 text-signal",
    expired: "bg-amber-400/15 text-amber-300",
    disabled: "bg-mist-500/15 text-mist-500",
  };
  return (
    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium uppercase tracking-wide", map[status])}>
      {status}
    </span>
  );
}

export function RangePills({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="flex rounded-lg border border-ink-600 p-0.5">
      {["24h", "7d", "30d", "90d"].map((r) => (
        <button
          key={r}
          onClick={() => onChange(r)}
          className={cn(
            "rounded-md px-2.5 py-1 font-mono text-xs",
            value === r ? "bg-signal text-ink-950" : "text-mist-500 hover:text-mist-100",
          )}
        >
          {r}
        </button>
      ))}
    </div>
  );
}

export function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return <p className="text-sm text-red-400">{children}</p>;
}

export function fmt(n: number) {
  return new Intl.NumberFormat("en-US").format(n);
}

export function when(iso: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(iso));
}

export async function copy(text: string) {
  await navigator.clipboard.writeText(text);
}
