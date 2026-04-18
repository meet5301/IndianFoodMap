export const getWhatsAppUrl = (number, text) => {
  if (!number) {
    return "";
  }

  const cleaned = String(number).replace(/[^\d]/g, "");
  const message = text ? `?text=${encodeURIComponent(text)}` : "";

  return `https://wa.me/${cleaned}${message}`;
};

export const formatDistanceKm = (distanceKm) => {
  if (!Number.isFinite(distanceKm)) {
    return "";
  }

  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m away`;
  }

  return `${distanceKm.toFixed(1)} km away`;
};

export const getOpenStatusLabel = (vendor) => {
  const isOpen = Boolean(vendor?.isOpenNow);

  if (isOpen) {
    return {
      label: "Open now",
      tone: "bg-emerald-500/20 text-emerald-200 border-emerald-500/30"
    };
  }

  return {
    label: "Closed now",
    tone: "bg-slate-600/40 text-slate-300 border-slate-600/40"
  };
};

export const getRatingSummary = (vendor) => {
  const average = Number(vendor?.ratingAverage || 0);
  const count = Number(vendor?.ratingCount || 0);

  return {
    average: average.toFixed(1),
    count
  };
};