import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api/client";
import { getOpenStatusLabel, getRatingSummary, getWhatsAppUrl } from "../utils/vendorDisplay";
import Seo from "../components/Seo";
import { buildVendorSeoFallback } from "../utils/seoTemplates";

const VendorDetailPage = () => {
  const { slugOrId } = useParams();
  const [vendor, setVendor] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [reviewForm, setReviewForm] = useState({ reviewerName: "", rating: 5, comment: "" });
  const [message, setMessage] = useState("");

  const loadVendor = async () => {
    setLoading(true);
    try {
      const data = await api.getVendor(slugOrId);
      setVendor(data.vendor);
      setReviews(data.reviews || []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendor().catch(() => {
      setVendor(null);
    });
  }, [slugOrId]);

  const schema = useMemo(() => {
    if (!vendor) {
      return null;
    }

    return {
      "@context": "https://schema.org",
      "@type": "Restaurant",
      name: vendor.name,
      description: vendor.seoDescription || vendor.description,
      address: {
        "@type": "PostalAddress",
        addressLocality: vendor.area,
        addressRegion: vendor.city,
        addressCountry: "IN"
      },
      aggregateRating: {
        "@type": "AggregateRating",
        ratingValue: vendor.ratingAverage || 0,
        reviewCount: vendor.ratingCount || 0
      }
    };
  }, [vendor]);

  const submitReview = async (event) => {
    event.preventDefault();
    setMessage("");

    try {
      await api.addReview(vendor._id, reviewForm);
      setReviewForm({ reviewerName: "", rating: 5, comment: "" });
      setMessage("Review added");
      await loadVendor();
    } catch (error) {
      setMessage(error.message);
    }
  };

  if (loading) {
    return <main className="page-wrap">Loading vendor...</main>;
  }

  if (!vendor) {
    return <main className="page-wrap">Vendor not found.</main>;
  }

  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${vendor.name} in ${vendor.area}, ${vendor.city}`)}`;
  const chatUrl = getWhatsAppUrl(vendor.whatsappNumber, `Hi ${vendor.name}, I want to know more about your stall in ${vendor.area}.`);
  const status = getOpenStatusLabel(vendor);
  const rating = getRatingSummary(vendor);
  const fallbackSeo = buildVendorSeoFallback(vendor);

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Seo
        title={vendor.seoTitle || fallbackSeo.title}
        description={vendor.seoDescription || vendor.description || fallbackSeo.description}
        path={`/vendor/${vendor.slug || vendor._id || slugOrId}`}
        image={vendor.imageUrl || undefined}
        type="restaurant"
        keywords={fallbackSeo.keywords}
        schema={schema}
      />

      <section className="glass-card p-5">
        <p className="text-xs uppercase tracking-[0.2em] text-amber-300">SEO Vendor Page</p>
        <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">{vendor.name}</h1>
        <p className="mt-2 text-slate-300">{vendor.area}, {vendor.city}</p>
        <div className="mt-3 flex flex-wrap gap-2 text-sm">
          <span className={`rounded-md border px-2 py-1 ${status.tone}`}>{status.label}</span>
          <span className="rounded-md border border-line bg-panelSoft px-2 py-1">Rating {rating.average} ({rating.count})</span>
          <span className="rounded-md border border-line bg-panelSoft px-2 py-1">Price {vendor.priceRange}</span>
          <span className="rounded-md border border-line bg-panelSoft px-2 py-1">{vendor.category}</span>
          {vendor.timings ? <span className="rounded-md border border-line bg-panelSoft px-2 py-1">Timings {vendor.timings}</span> : null}
        </div>
        {vendor.imageUrl ? <img src={vendor.imageUrl} alt={vendor.name} className="mt-4 h-52 w-full rounded-xl object-cover sm:h-64" /> : null}
        <p className="mt-4 text-sm text-slate-300">{vendor.description || "No description yet."}</p>
        {vendor.menuItems?.length ? (
          <div className="mt-4">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">Menu</h2>
            <div className="mt-2 flex flex-wrap gap-2">
              {vendor.menuItems.map((item) => (
                <span key={item} className="rounded-md border border-line bg-panelSoft px-2 py-1 text-sm text-slate-200">
                  {item}
                </span>
              ))}
            </div>
          </div>
        ) : null}
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
          <Link to="/find-stall" className="btn-ghost w-full text-center sm:w-auto">
            Find more stalls
          </Link>
          <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-primary w-full text-center sm:w-auto">
            Share on WhatsApp
          </a>
          {chatUrl ? (
            <a href={chatUrl} target="_blank" rel="noreferrer" className="btn-ghost w-full text-center sm:w-auto">
              Chat vendor
            </a>
          ) : null}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <article className="glass-card p-5">
          <h2 className="section-title">Add Review</h2>
          <div className="mb-3 rounded-xl border border-line bg-panelSoft p-3">
            <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Rating summary</p>
            <p className="mt-1 font-display text-2xl font-semibold text-white">
              {rating.average} / 5
            </p>
            <p className="text-sm text-slate-300">Based on {rating.count} customer reviews</p>
          </div>
          <form onSubmit={submitReview} className="space-y-2">
            <input
              className="input-ui"
              placeholder="Your name"
              value={reviewForm.reviewerName}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, reviewerName: event.target.value }))}
              required
            />
            <select
              className="input-ui"
              value={reviewForm.rating}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, rating: Number(event.target.value) }))}
            >
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
            <textarea
              className="input-ui"
              rows="4"
              placeholder="Comment"
              value={reviewForm.comment}
              onChange={(event) => setReviewForm((prev) => ({ ...prev, comment: event.target.value }))}
            />
            <button className="btn-primary w-full sm:w-auto" type="submit">
              Submit review
            </button>
          </form>
          {message ? <p className="mt-3 text-sm text-amber-200">{message}</p> : null}
        </article>

        <article className="glass-card p-5">
          <h2 className="section-title">Recent Reviews</h2>
          <div className="space-y-3">
            {reviews.length ? (
              reviews.map((review) => (
                <div key={review._id} className="rounded-xl border border-line bg-panelSoft p-3">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="font-semibold text-white">{review.reviewerName}</p>
                    <p className="rounded-full border border-line bg-panel px-2 py-1 text-xs text-amber-200">{review.rating}/5</p>
                  </div>
                  <p className="mt-1 text-sm text-slate-300">{review.comment || "No comment"}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-400">No reviews yet.</p>
            )}
          </div>
        </article>
      </section>
    </main>
  );
};

export default VendorDetailPage;
