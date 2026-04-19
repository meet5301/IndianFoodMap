import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Seo from "../components/Seo";

const SEARCH_HISTORY_KEY = "ifm_search_history";

const loadSearchHistory = () => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
};

const formatSearchLabel = (entry) => {
  const parts = [];

  if (entry.search) {
    parts.push(entry.search);
  }

  if (entry.area) {
    parts.push(entry.area);
  }

  if (entry.openNow) {
    parts.push("open now");
  }

  if (entry.radiusKm && entry.radiusKm !== "5") {
    parts.push(`${entry.radiusKm} km`);
  }

  if (entry.location) {
    parts.push("live location");
  }

  return parts.length ? parts.join(" • ") : "Recent stall search";
};

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [history, setHistory] = useState(() => loadSearchHistory());

  useEffect(() => {
    setHistory(loadSearchHistory());
  }, []);

  const stats = useMemo(() => {
    const totalSearches = history.length;
    const liveSearches = history.filter((entry) => entry.location).length;
    const openNowSearches = history.filter((entry) => entry.openNow).length;

    return { totalSearches, liveSearches, openNowSearches };
  }, [history]);

  const switchToVendor = () => {
    localStorage.setItem("ifm_access_mode", "vendor");
    navigate("/auth?intent=add-stall&next=/add-vendor");
  };

  const handleLogout = () => {
    logout();
    navigate("/auth", { replace: true });
  };

  const clearHistory = () => {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
    setHistory([]);
  };

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Seo
        title="Profile | IndiaFoodMap"
        description="Customer profile with recent search history and account shortcuts."
        path="/profile"
        noindex
      />

      <section className="glass-card p-5">
        <p className="label-kicker">Customer profile</p>
        <h1 className="mt-3 font-display text-3xl font-bold text-white">Your profile</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-300">
          Keep track of your recent stall searches, switch to vendor onboarding when you want to add a stall, and manage your session from one place.
        </p>

        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Account</p>
            <p className="mt-1 font-display text-2xl font-bold">{user?.name || "Customer"}</p>
            <p className="text-xs text-slate-400">{user?.email || "Signed in user"}</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Searches</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.totalSearches}</p>
            <p className="text-xs text-slate-400">saved searches</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Live / open</p>
            <p className="mt-1 font-display text-2xl font-bold">{stats.liveSearches + stats.openNowSearches}</p>
            <p className="text-xs text-slate-400">location and open-now queries</p>
          </article>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link to="/find-stall" className="btn-primary">
            Back to Find Stall
          </Link>
          <button type="button" className="btn-ghost" onClick={switchToVendor}>
            Switch to Add Vendor
          </button>
          <button type="button" className="btn-ghost" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </section>

      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title">Recent Searches</h2>
            <p className="text-sm text-slate-300">Your last search filters are stored locally on this device.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={clearHistory} disabled={!history.length}>
            Clear history
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {history.length ? (
            history.map((entry) => (
              <article key={entry.id} className="rounded-xl border border-line bg-panelSoft p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold text-white">{formatSearchLabel(entry)}</p>
                    <p className="mt-1 text-xs text-slate-400">
                      {entry.area ? `Area: ${entry.area}` : "All areas"}
                      {entry.search ? ` • Search: ${entry.search}` : ""}
                    </p>
                  </div>
                  <p className="text-xs text-slate-400">{new Date(entry.at).toLocaleString()}</p>
                </div>
              </article>
            ))
          ) : (
            <p className="text-sm text-slate-400">No searches yet. Use Find Stall and your recent filters will appear here.</p>
          )}
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title">Quick shortcuts</h2>
        <div className="grid gap-3 lg:grid-cols-2">
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h3 className="font-display text-xl font-bold text-white">Resume discovery</h3>
            <p className="mt-2 text-sm text-slate-300">Jump back to the main discovery board whenever you want to search for stalls again.</p>
            <Link to="/find-stall" className="mt-3 inline-block btn-primary">
              Find stalls
            </Link>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h3 className="font-display text-xl font-bold text-white">Start adding a stall</h3>
            <p className="mt-2 text-sm text-slate-300">Switch into vendor mode and continue to the stall submission flow.</p>
            <button type="button" className="mt-3 btn-primary" onClick={switchToVendor}>
              Add vendor
            </button>
          </article>
        </div>
      </section>
    </main>
  );
};

export default ProfilePage;