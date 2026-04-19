import { useEffect, useMemo, useRef, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import HeroSection from "../components/HeroSection";
import BrandMark from "../components/BrandMark";
import VendorCard from "../components/VendorCard";

const HomePage = () => {
  const [stats, setStats] = useState({ totalVendors: 0, totalReviews: 0, totalCities: 0 });
  const [vendors, setVendors] = useState([]);
  const [knownAreas, setKnownAreas] = useState([]);
  const [search, setSearch] = useState("");
  const [selectedArea, setSelectedArea] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [openNowOnly, setOpenNowOnly] = useState(false);
  const [loading, setLoading] = useState(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState("");
  const [liveTime, setLiveTime] = useState(() => new Date());
  const featuredSectionRef = useRef(null);

  const loadHomeData = async () => {
    setLoading(true);
    try {
      const [statsData, vendorsPayload, areasPayload] = await Promise.all([
        api.getOverviewStats(),
        api.getVendors({ city: "Ahmedabad", limit: 30 }),
        api.getKnownAreas().catch(() => ({ areas: [] }))
      ]);

      setStats(statsData);
      setVendors(vendorsPayload.vendors || []);
      setKnownAreas(Array.isArray(areasPayload.areas) ? areasPayload.areas : []);
      setLastUpdatedAt(new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }));
    } catch (_error) {
      setStats({ totalVendors: 0, totalReviews: 0, totalCities: 0 });
      setVendors([]);
      setKnownAreas([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHomeData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setLiveTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const popularAreas = useMemo(() => {
    const counts = vendors.reduce((acc, vendor) => {
      if (vendor.area) {
        acc[vendor.area] = (acc[vendor.area] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([area]) => area);
  }, [vendors]);

  const availableAreas = useMemo(() => {
    return Array.from(new Set([...knownAreas, ...popularAreas]));
  }, [knownAreas, popularAreas]);

  const popularCategories = useMemo(() => {
    const counts = vendors.reduce((acc, vendor) => {
      const category = vendor.category?.trim();
      if (category) {
        acc[category] = (acc[category] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([category]) => category);
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return vendors.filter((vendor) => {
      const matchesArea = selectedArea ? vendor.area === selectedArea : true;
      const matchesCategory = selectedCategory ? vendor.category === selectedCategory : true;
      const matchesOpenNow = openNowOnly ? Boolean(vendor.isOpenNow) : true;
      const matchesSearch = normalizedSearch
        ? [vendor.name, vendor.category, vendor.area, vendor.city]
            .filter(Boolean)
            .some((field) => field.toLowerCase().includes(normalizedSearch))
        : true;

      return matchesArea && matchesCategory && matchesOpenNow && matchesSearch;
    });
  }, [vendors, search, selectedArea, selectedCategory, openNowOnly]);

  const featuredVendors = filteredVendors.slice(0, 6);
  const openNowCount = useMemo(() => vendors.filter((vendor) => vendor.isOpenNow).length, [vendors]);

  const clearFilters = () => {
    setSearch("");
    setSelectedArea("");
    setSelectedCategory("");
    setOpenNowOnly(false);
  };

  useEffect(() => {
    const hasActiveFilters = Boolean(search.trim() || selectedArea || selectedCategory || openNowOnly);

    if (!hasActiveFilters || !featuredSectionRef.current) {
      return;
    }

    featuredSectionRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [search, selectedArea, selectedCategory, openNowOnly]);

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Helmet>
        <title>IndiaFoodMap - Hyperlocal Street Food Discovery</title>
        <meta
          name="description"
          content="Discover unlisted street food vendors with map-based discovery and SEO-ready vendor pages."
        />
      </Helmet>

      <HeroSection />

      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <article className="glass-card p-4">
          <p className="label-kicker">Search first</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Find the exact stall, fast</h2>
          <p className="mt-2 text-sm text-slate-300">Use area filters, live search, and open-now status to narrow the result in seconds.</p>
        </article>
        <article className="glass-card p-4">
          <p className="label-kicker">Instant connect</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Chat on WhatsApp</h2>
          <p className="mt-2 text-sm text-slate-300">Every vendor card includes direct contact and share links so discovery turns into action.</p>
        </article>
        <article className="glass-card p-4">
          <p className="label-kicker">SEO ready</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Vendor pages that rank</h2>
          <p className="mt-2 text-sm text-slate-300">Each stall can have a searchable page, review data, and structured content for local discovery.</p>
        </article>
        <article className="glass-card p-4">
          <p className="label-kicker">Owner flow</p>
          <h2 className="mt-3 font-display text-2xl font-bold text-white">Add and manage stalls</h2>
          <p className="mt-2 text-sm text-slate-300">Owners can submit listings, update details, and move from visibility to verified growth.</p>
        </article>
      </section>

      <section className="glass-card p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="section-title mb-2 flex items-center gap-2">
              <BrandMark className="h-4 w-4 text-accent" />
              Live Discovery
            </h2>
            <p className="text-sm text-slate-300">Search stalls directly, apply area filters, and quickly find vendors that are open now.</p>
          </div>
          <button type="button" className="btn-ghost" onClick={loadHomeData}>
            {loading ? "Refreshing..." : "Refresh data"}
          </button>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <input
            className="input-ui sm:col-span-2 xl:col-span-2"
            placeholder="Search by stall name, category, or area"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <select className="input-ui" value={selectedArea} onChange={(event) => setSelectedArea(event.target.value)}>
            <option value="">All areas</option>
            {availableAreas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <label className="flex items-center justify-between rounded-xl border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200 sm:col-span-1">
            Open now only
            <input type="checkbox" checked={openNowOnly} onChange={(event) => setOpenNowOnly(event.target.checked)} />
          </label>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400">Quick areas:</span>
          {availableAreas.slice(0, 5).map((area) => (
            <button
              key={area}
              type="button"
              className={`chip-filter ${selectedArea === area ? "chip-filter-active" : ""}`}
              onClick={() => setSelectedArea((prev) => (prev === area ? "" : area))}
            >
              {area}
            </button>
          ))}
          <button type="button" className="chip-filter" onClick={clearFilters}>
            Clear filters
          </button>
        </div>

        {popularCategories.length ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-xs text-slate-400">Top categories:</span>
            {popularCategories.map((category) => (
              <button
                key={category}
                type="button"
                className={`chip-filter ${selectedCategory === category ? "chip-filter-active" : ""}`}
                onClick={() => setSelectedCategory((prev) => (prev === category ? "" : category))}
              >
                {category}
              </button>
            ))}
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Matching now</p>
            <p className="mt-1 font-display text-2xl font-bold">{filteredVendors.length}</p>
            <p className="text-xs text-slate-400">vendors</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Last synced</p>
            <p className="mt-1 font-display text-2xl font-bold">{lastUpdatedAt || "--:--"}</p>
            <p className="text-xs text-slate-400">today</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Live clock</p>
            <p className="mt-1 font-display text-2xl font-bold">
              {liveTime.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
            </p>
            <p className="text-xs text-slate-400">today</p>
          </article>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title flex items-center gap-2">
          <BrandMark className="h-4 w-4 text-accent" />
          Choose Your Mode
        </h2>
        <div className="grid gap-3 md:grid-cols-2">
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <p className="inline-block rounded-full bg-amber-300/20 px-2 py-1 text-xs font-semibold text-amber-200">Stall Owner</p>
            <h3 className="mt-2 font-display text-2xl font-bold">List your stall</h3>
            <p className="mt-2 text-sm text-slate-300">Login to submit your stall and publish your searchable vendor page.</p>
            <Link to="/auth?intent=add-stall&next=/add-vendor" className="mt-3 inline-block btn-primary">Login to add stall</Link>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <p className="inline-block rounded-full bg-emerald-300/20 px-2 py-1 text-xs font-semibold text-emerald-200">Customer</p>
            <h3 className="mt-2 font-display text-2xl font-bold">Find nearby stalls</h3>
            <p className="mt-2 text-sm text-slate-300">Use the Find Stall page to explore nearby options with map and open-now status.</p>
            <Link to="/find-stall" className="mt-3 inline-block btn-primary">Find a stall</Link>
          </article>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title flex items-center gap-2">
          <BrandMark className="h-4 w-4 text-accent" />
          Platform Snapshot
        </h2>
        <div className="mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="stat-tile">
            <p className="font-display text-2xl font-bold">{stats.totalVendors}</p>
            <p className="text-xs text-slate-400">Vendors</p>
          </article>
          <article className="stat-tile">
            <p className="font-display text-2xl font-bold">{stats.totalReviews}</p>
            <p className="text-xs text-slate-400">Reviews</p>
          </article>
          <article className="stat-tile">
            <p className="font-display text-2xl font-bold">{stats.totalCities}</p>
            <p className="text-xs text-slate-400">Cities</p>
          </article>
          <article className="stat-tile">
            <p className="font-display text-2xl font-bold">{openNowCount}</p>
            <p className="text-xs text-slate-400">Open now</p>
          </article>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h3 className="font-semibold text-white">Find near me</h3>
            <p className="mt-2 text-sm text-slate-300">Location-based stall search with radius filters.</p>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h3 className="font-semibold text-white">Open now status</h3>
            <p className="mt-2 text-sm text-slate-300">See whether a vendor is currently open or closed.</p>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h3 className="font-semibold text-white">Reviews & WhatsApp</h3>
            <p className="mt-2 text-sm text-slate-300">Read feedback and chat with vendors instantly.</p>
          </article>
        </div>
      </section>

      <section className="glass-card p-5 scroll-mt-24" ref={featuredSectionRef}>
        <div className="flex items-center justify-between gap-3">
          <h2 className="section-title mb-0 flex items-center gap-2">
            <BrandMark className="h-4 w-4 text-accent" />
            Featured Vendors
          </h2>
          <Link to="/find-stall" className="text-sm font-semibold text-amber-300 underline-offset-4 hover:underline">
            Open discovery page
          </Link>
        </div>

        {featuredVendors.length ? (
          <div className="mt-4 flex snap-x snap-mandatory gap-2 overflow-x-auto pb-2 lg:grid lg:overflow-visible lg:pb-0 lg:grid-cols-3 xl:grid-cols-4">
            {featuredVendors.map((vendor) => (
              <div key={vendor._id} className="min-w-[88%] snap-start sm:min-w-[70%] md:min-w-[48%] lg:min-w-0 lg:flex-1">
                <VendorCard vendor={vendor} />
              </div>
            ))}
          </div>
        ) : (
          <div className="surface-muted mt-4 text-sm text-slate-300">
            No vendors match your current filters. Clear filters and try again.
          </div>
        )}
      </section>

      <footer className="glass-card overflow-hidden p-0">
        <div className="grid gap-0 border-b border-line/60 lg:grid-cols-4">
          <section className="border-b border-line/60 p-6 lg:border-b-0 lg:border-r">
            <h3 className="font-display text-3xl font-bold text-white">
              India<span className="text-accent">Food</span>Map
            </h3>
            <p className="mt-3 text-sm text-slate-300">Connecting food lovers with local heroes. Discover. Support. Enjoy.</p>
          </section>
          <section className="border-b border-line/60 p-6 lg:border-b-0 lg:border-r">
            <p className="section-title mb-3">Quick Links</p>
            <div className="space-y-2">
              <Link to="/find-stall" className="footer-link block">Find Stall</Link>
              <Link to="/find-stall" className="footer-link block">Map Discovery</Link>
              <Link to="/auth" className="footer-link block">Login</Link>
              <Link to="/auth?intent=add-stall&next=/add-vendor" className="footer-link block">Add Your Stall</Link>
            </div>
          </section>
          <section className="border-b border-line/60 p-6 lg:border-b-0 lg:border-r">
            <p className="section-title mb-3">Support</p>
            <div className="space-y-2 text-sm text-slate-300">
              <p>Help Center</p>
              <p>Contact Us</p>
              <p>Privacy Policy</p>
              <p>Terms and Conditions</p>
            </div>
          </section>
          <section className="p-6">
            <p className="section-title mb-3">Newsletter</p>
            <p className="text-sm text-slate-300">Get updates about new stalls and features.</p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <input className="input-ui" placeholder="Enter your email" />
              <button type="button" className="btn-primary px-3 sm:w-auto">Go</button>
            </div>
          </section>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 px-6 py-3 text-xs text-slate-400">
          <p>o 2026 IndiaFoodMap. All rights reserved.</p>
          <p>Made for India's street food.</p>
        </div>
      </footer>
    </main>
  );
};

export default HomePage;
