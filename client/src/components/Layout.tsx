import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { KeyRound, LayoutDashboard, Link2, LogOut } from "lucide-react";
import { useAuth } from "../auth";
import { cn } from "./ui";

const items = [
  { to: "/app", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/app/links", label: "Links", icon: Link2 },
  { to: "/app/keys", label: "API keys", icon: KeyRound },
];

export function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[240px_1fr]">
      <aside className="border-b border-ink-600 bg-ink-900/80 lg:border-b-0 lg:border-r">
        <div className="flex items-center justify-between px-5 py-5 lg:block">
          <div className="flex items-center gap-2">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-signal font-display text-sm font-extrabold text-ink-950">
              R
            </span>
            <div>
              <div className="font-display text-lg font-bold leading-none">Relay</div>
              <div className="mt-1 font-mono text-[10px] uppercase tracking-[0.18em] text-mist-500">telemetry</div>
            </div>
          </div>
          <nav className="flex gap-1 lg:mt-8 lg:flex-col">
            {items.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    "flex items-center gap-2 rounded-lg px-3 py-2 text-sm",
                    isActive ? "bg-ink-700 text-signal" : "text-mist-300 hover:bg-ink-800 hover:text-mist-100",
                  )
                }
              >
                <item.icon size={16} />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
        <div className="hidden border-t border-ink-600 px-5 py-4 lg:block">
          <div className="truncate text-sm">{user?.name}</div>
          <div className="truncate font-mono text-xs text-mist-500">{user?.email}</div>
          <button
            className="mt-3 flex items-center gap-2 text-sm text-mist-500 hover:text-mist-100"
            onClick={() => {
              logout();
              navigate("/");
            }}
          >
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 p-5 lg:p-8">
        <Outlet />
      </main>
    </div>
  );
}
