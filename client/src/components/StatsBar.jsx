const StatItem = ({ label, value }) => {
  return (
    <article className="stat-item">
      <h3>{value}</h3>
      <p>{label}</p>
    </article>
  );
};

const StatsBar = ({ stats, loading }) => {
  return (
    <section className="stats-grid">
      <StatItem label="Total Vendors" value={loading ? "..." : stats.totalVendors} />
      <StatItem label="Total Reviews" value={loading ? "..." : stats.totalReviews} />
      <StatItem label="Cities Live" value={loading ? "..." : stats.totalCities} />
      <StatItem label="Stack" value="MERN" />
    </section>
  );
};

export default StatsBar;
