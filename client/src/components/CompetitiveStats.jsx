const stats = [
  ["0", "Direct competitors India"],
  ["90L+", "Unlisted vendors"],
  ["200+", "SEO pages per city"],
  ["Free", "Maps + hosting MVP"]
];

const CompetitiveStats = () => {
  return (
    <section className="glass-card p-5">
      <h3 className="section-title">Competitive Advantage - Why You Win</h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map(([value, label]) => (
          <article key={label} className="rounded-xl border border-line bg-panelSoft px-4 py-4 text-center">
            <p className="font-display text-3xl font-bold text-white">{value}</p>
            <p className="mt-2 text-xs text-slate-400">{label}</p>
          </article>
        ))}
      </div>
    </section>
  );
};

export default CompetitiveStats;
