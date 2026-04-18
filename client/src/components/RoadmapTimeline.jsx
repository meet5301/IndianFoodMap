const items = [
  "Ahmedabad MVP in 2 weeks with 50 manually onboarded vendors",
  "Community submit flow and creator campaign in week 3-4",
  "SEO optimized vendor pages and sitemap in month 2",
  "Expand to second city in month 3",
  "Monetization from month 4 through verified badges and featured listings"
];

const RoadmapTimeline = () => {
  return (
    <section className="glass-card p-5">
      <h3 className="section-title">Launch Roadmap - Phase Wise</h3>
      <ol className="space-y-3">
        {items.map((item, index) => (
          <li key={item} className="flex items-start gap-3 border-b border-line/60 pb-3 last:border-b-0 last:pb-0">
            <span className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full border border-slate-600 text-xs font-semibold text-slate-200">
              {index + 1}
            </span>
            <p className="text-sm text-slate-300">{item}</p>
          </li>
        ))}
      </ol>
    </section>
  );
};

export default RoadmapTimeline;
