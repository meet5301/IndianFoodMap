export const getWhatsAppUrl = (number, text) => {
  if (!number) {
    return "";
  }

  const cleaned = String(number).replace(/[^\d]/g, "");
  const message = text ? `?text=${encodeURIComponent(text)}` : "";

  return `https://wa.me/${cleaned}${message}`;
};

const TIME_RANGE_REGEX = /(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\s*(?:-|to|until|till|–|—)\s*(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i;

const parseTimeToken = (hour, minute = "00", period = "") => {
  const nextHour = Number(hour);
  const nextMinute = Number(minute);

  if (!Number.isFinite(nextHour) || !Number.isFinite(nextMinute)) {
    return null;
  }

  let normalizedHour = nextHour;
  const normalizedPeriod = String(period).toLowerCase();

  if (normalizedPeriod === "am" && normalizedHour === 12) {
    normalizedHour = 0;
  }

  if (normalizedPeriod === "pm" && normalizedHour < 12) {
    normalizedHour += 12;
  }

  if (!normalizedPeriod && normalizedHour > 23) {
    return null;
  }

  return normalizedHour * 60 + nextMinute;
};

const parseTimingWindow = (vendor) => {
  const openingTime = String(vendor?.openingTime || "").trim();
  const closingTime = String(vendor?.closingTime || "").trim();

  if (openingTime && closingTime) {
    const openingMatch = openingTime.match(/^(\d{1,2})(?::(\d{2}))?$/);
    const closingMatch = closingTime.match(/^(\d{1,2})(?::(\d{2}))?$/);
    const openMinutes = openingMatch ? parseTimeToken(openingMatch[1], openingMatch[2], "") : null;
    const closeMinutes = closingMatch ? parseTimeToken(closingMatch[1], closingMatch[2], "") : null;

    if (openMinutes !== null && closeMinutes !== null) {
      return { openMinutes, closeMinutes };
    }
  }

  const timings = String(vendor?.timings || "").trim().toLowerCase();

  if (!timings) {
    return null;
  }

  if (/(24\s*hours|24\/7|open\s*all\s*day|round\s*the\s*clock)/i.test(timings)) {
    return { openMinutes: 0, closeMinutes: 24 * 60 };
  }

  const match = timings.match(TIME_RANGE_REGEX);

  if (!match) {
    return null;
  }

  const openMinutes = parseTimeToken(match[1], match[2], match[3]);
  const closeMinutes = parseTimeToken(match[4], match[5], match[6]);

  if (openMinutes === null || closeMinutes === null) {
    return null;
  }

  return { openMinutes, closeMinutes };
};

export const isVendorOpenNow = (vendor, referenceDate = new Date()) => {
  const window = parseTimingWindow(vendor);

  if (!window) {
    return Boolean(vendor?.isOpenNow);
  }

  const currentMinutes = referenceDate.getHours() * 60 + referenceDate.getMinutes();
  const { openMinutes, closeMinutes } = window;

  if (openMinutes === closeMinutes) {
    return true;
  }

  if (openMinutes < closeMinutes) {
    return currentMinutes >= openMinutes && currentMinutes < closeMinutes;
  }

  return currentMinutes >= openMinutes || currentMinutes < closeMinutes;
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
  const isOpen = isVendorOpenNow(vendor);

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