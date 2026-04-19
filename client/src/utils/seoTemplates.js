const normalize = (value, fallback = "") => String(value || "").replace(/\s+/g, " ").trim() || fallback;

const titleCase = (value, fallback = "") =>
  normalize(value, fallback)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const trimTo = (value, maxLength) => {
  const text = normalize(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

export const AHMEDABAD_PRIMARY_KEYWORDS = [
  "Ahmedabad street food",
  "best street food in Ahmedabad",
  "food stalls in Ahmedabad",
  "street food near me Ahmedabad",
  "famous food places Ahmedabad",
  "night street food Ahmedabad"
];

export const buildVendorSeoFallback = (vendor = {}) => {
  const name = titleCase(vendor.name, "Local Food Stall");
  const area = titleCase(vendor.area, "Ahmedabad");
  const city = titleCase(vendor.city, "Ahmedabad");
  const category = titleCase(vendor.category, "Street Food");

  const title = trimTo(`${name} ${category} in ${area}, ${city} | IndiaFoodMap`, 60);
  const description = trimTo(
    `Discover ${name}, a popular ${category.toLowerCase()} stall in ${area}, ${city}. Check timings, menu, reviews and directions on IndiaFoodMap.`,
    158
  );

  const dynamicKeywords = [
    `${name} ${city}`,
    `${category} in ${area}`,
    `${area} street food`,
    `${name} menu ${area}`,
    `${category} near ${area}`
  ];

  const keywords = [...new Set([...dynamicKeywords, ...AHMEDABAD_PRIMARY_KEYWORDS])].join(", ");

  return { title, description, keywords };
};
