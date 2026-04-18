import { Link } from "react-router-dom";
import BrandMark from "./BrandMark";

const HeroSection = () => {
  const heroFoodImage =
    "https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=1400&q=80";

  return (
    <section className="grid gap-4 lg:grid-cols-[1.35fr_1fr]">
      <article className="glass-card relative overflow-hidden px-4 py-5 sm:px-6 sm:py-6 md:px-8 md:py-8">
        <div className="relative z-10 grid gap-6 lg:grid-cols-[1fr_0.9fr] lg:items-center">
          <div>
            <p className="label-kicker">Hyperlocal street food discovery</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight text-white sm:text-5xl md:text-6xl">
              India<span className="text-accent">Food</span>Map
            </h1>
            <p className="mt-4 max-w-xl text-base text-slate-300 md:text-[1.05rem]">
              A search-first map and SEO engine for unlisted street food vendors across Indian cities.
            </p>
            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Link to="/find-stall" className="btn-primary">
                Explore Vendors
              </Link>
              <Link to="/add-vendor" className="btn-ghost">
                Add a Vendor
              </Link>
            </div>
          </div>

          <div className="relative mx-auto h-[180px] w-full max-w-[380px] overflow-hidden rounded-2xl border border-amber-500/35 sm:h-[230px]">
            <img
              src={heroFoodImage}
              alt="Indian street food platter"
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/25 to-black/45" />
            <div className="absolute right-4 top-4 mini-badge">Support Local</div>
            <div className="absolute bottom-3 left-3 rounded-lg border border-amber-400/40 bg-black/50 px-3 py-1 text-xs font-semibold text-amber-200">
              Street food spotlight
            </div>
          </div>
        </div>
      </article>

      <aside className="glass-card relative overflow-hidden p-4 sm:p-6">
        <div className="relative z-10">
          <p className="label-kicker">Daily pulse</p>
          <p className="mt-4 font-display text-3xl font-bold text-white sm:text-4xl">Most searched now</p>
          <p className="mt-3 max-w-sm text-base text-slate-300">Pav bhaji, chai and sandwich stalls in Ahmedabad city hotspots.</p>
          <Link to="/find-stall" className="mt-5 inline-flex items-center text-sm font-semibold text-amber-300 underline-offset-4 hover:underline">
            Jump to quick finder {"->"}
          </Link>
          <div className="mt-5 rounded-2xl border border-line/70 bg-panelSoft/70 p-4 text-center sm:p-5">
            <BrandMark className="mx-auto h-16 w-16 text-accent" />
            <p className="mt-2 text-xs uppercase tracking-[0.14em] text-slate-400">Street food kiosk</p>
          </div>
        </div>
      </aside>
    </section>
  );
};

export default HeroSection;
