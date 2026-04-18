import { Link } from "react-router-dom";
import { formatDistanceKm, getOpenStatusLabel, getRatingSummary, getWhatsAppUrl } from "../utils/vendorDisplay";

const VendorCard = ({ vendor, distanceKm }) => {
  const shareUrl = `https://wa.me/?text=${encodeURIComponent(`Check out ${vendor.name} in ${vendor.area}, ${vendor.city}`)}`;
  const chatUrl = getWhatsAppUrl(vendor.whatsappNumber, `Hi ${vendor.name}, I want to know more about your stall in ${vendor.area}.`);
  const status = getOpenStatusLabel(vendor);
  const rating = getRatingSummary(vendor);
  const distanceLabel = formatDistanceKm(distanceKm);

  return (
    <article className="glass-card flex h-full min-h-[148px] flex-row overflow-hidden sm:min-h-0 sm:flex-col">
      {vendor.imageUrl ? (
        <img src={vendor.imageUrl} alt={vendor.name} className="h-full w-24 shrink-0 object-cover sm:h-24 sm:w-full md:h-28" />
      ) : (
        <div className="h-full w-24 shrink-0 bg-gradient-to-r from-slate-800 to-slate-900 sm:h-24 sm:w-full md:h-28" />
      )}

      <div className="flex min-w-0 flex-1 flex-col gap-1.5 p-2 sm:gap-1.5 sm:p-2.5">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-1 font-display text-[12px] font-bold text-white sm:text-sm md:text-base">
              {vendor.name}
            </h3>
            <p className="line-clamp-1 text-[9px] text-slate-400 sm:text-[11px]">
              {vendor.area}, {vendor.city}
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-end gap-1">
            <span className={`inline-flex min-w-[72px] items-center justify-center rounded-full border px-2 py-1 text-[9px] font-medium leading-none sm:min-w-[84px] sm:text-[10px] ${status.tone}`}>{status.label}</span>
            <span className="inline-flex min-w-[72px] items-center justify-center rounded-full border border-slate-600 bg-panelSoft px-2 py-1 text-[9px] font-medium leading-none text-slate-200 sm:min-w-[84px] sm:text-[10px]">{vendor.category}</span>
          </div>
        </div>

        <p className="line-clamp-2 text-[10px] leading-tight text-slate-300 sm:text-xs">
          {vendor.description || "Local street food vendor listing."}
        </p>

        <div className="flex flex-wrap gap-1 text-[9px] leading-none sm:text-[11px]">
          <span className="rounded-md border border-line bg-panelSoft px-1.5 py-0.5 text-slate-300">Rating {rating.average} ({rating.count})</span>
          <span className="rounded-md border border-line bg-panelSoft px-1.5 py-0.5 text-slate-300">Price {vendor.priceRange}</span>
          {distanceLabel ? <span className="rounded-md border border-line bg-panelSoft px-1.5 py-0.5 text-slate-300">{distanceLabel}</span> : null}
        </div>

        <p className="line-clamp-1 text-[9px] text-slate-400 sm:text-[11px]">{vendor.timings ? `Timings: ${vendor.timings}` : "Timings not specified"}</p>

        <div className="mt-auto flex flex-row flex-wrap gap-1 pt-1">
          <Link to={`/vendor/${vendor.slug}`} className="btn-primary flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold leading-none shadow-sm shadow-black/20 sm:text-xs">
            View page
          </Link>
          {chatUrl ? (
            <a href={chatUrl} target="_blank" rel="noreferrer" className="btn-ghost flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold leading-none shadow-sm shadow-black/10 sm:text-xs">
              Chat on WhatsApp
            </a>
          ) : null}
          <a href={shareUrl} target="_blank" rel="noreferrer" className="btn-ghost flex min-h-10 flex-1 items-center justify-center rounded-lg px-2 py-1.5 text-center text-[10px] font-semibold leading-none shadow-sm shadow-black/10 sm:text-xs">
            WhatsApp share
          </a>
        </div>
      </div>
    </article>
  );
};

export default VendorCard;
