import type { ReactNode } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth";
import { Layout } from "./components/Layout";
import { AuthPage } from "./pages/Auth";
import { DashboardPage } from "./pages/Dashboard";
import { LinksPage } from "./pages/Links";
import { LinkDetailPage } from "./pages/LinkDetail";
import { ApiKeysPage } from "./pages/ApiKeys";

function Guard({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  if (!ready) return <div className="grid min-h-screen place-items-center text-mist-500">Booting Relay…</div>;
  if (!user) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<AuthPage mode="login" />} />
      <Route path="/register" element={<AuthPage mode="register" />} />
      <Route
        path="/app"
        element={
          <Guard>
            <Layout />
          </Guard>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="links" element={<LinksPage />} />
        <Route path="links/:id" element={<LinkDetailPage />} />
        <Route path="keys" element={<ApiKeysPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
