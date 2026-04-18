const revenueRows = [
  ["Verified badge (199/mo per vendor)", "500 vendors = 99,500/mo"],
  ["Featured listing (499/mo)", "100 vendors = 49,900/mo"],
  ["Local business ads", "20,000 - 50,000/mo"],
  ["Google AdSense", "15,000 - 30,000/mo"]
];

const RevenueSection = () => {
  return (
    <section className="glass-card p-5">
      <h3 className="section-title">Revenue Model - Realistic Numbers</h3>
      <div className="divide-y divide-line/70 rounded-xl border border-line/70 bg-panelSoft/80">
        {revenueRows.map(([label, value]) => (
          <div key={label} className="flex flex-col gap-1 px-4 py-3 text-sm md:flex-row md:items-center md:justify-between">
            <span className="text-slate-300">{label}</span>
            <strong className="font-semibold text-white">{value}</strong>
          </div>
        ))}
      </div>
    </section>
  );
};

export default RevenueSection;
