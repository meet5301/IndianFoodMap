const CITY_DEFAULT = "Ahmedabad";

const toText = (value, fallback = "") => {
  const normalized = String(value || "").replace(/\s+/g, " ").trim();
  return normalized || fallback;
};

const toTitleCase = (value) =>
  toText(value)
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());

const truncate = (value, maxLength) => {
  const text = toText(value);
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, Math.max(0, maxLength - 1)).trimEnd()}...`;
};

export const AHMEDABAD_SEO_KEYWORDS = [
  "Ahmedabad street food",
  "best street food in Ahmedabad",
  "food stalls in Ahmedabad",
  "Ahmedabad local food",
  "street food near me Ahmedabad",
  "famous food places Ahmedabad",
  "night street food Ahmedabad",
  "Manek Chowk street food",
  "CG Road food stalls",
  "Navrangpura street food"
];

export const buildVendorSeoKeywords = ({ name, area, city, category }) => {
  const safeName = toText(name);
  const safeArea = toTitleCase(area);
  const safeCity = toTitleCase(toText(city, CITY_DEFAULT));
  const safeCategory = toTitleCase(toText(category, "Street Food"));

  const dynamic = [
    `${safeName} ${safeCity}`,
    `${safeCategory} in ${safeArea}`,
    `${safeCategory} in ${safeCity}`,
    `${safeArea} street food`,
    `${safeName} ${safeCategory} ${safeArea}`
  ].filter(Boolean);

  return [...new Set([...dynamic, ...AHMEDABAD_SEO_KEYWORDS])].join(", ");
};

export const buildVendorSeoMeta = ({
  name,
  area,
  city,
  category,
  providedTitle = "",
  providedDescription = ""
}) => {
  const safeName = toTitleCase(name);
  const safeArea = toTitleCase(area);
  const safeCity = toTitleCase(toText(city, CITY_DEFAULT));
  const safeCategory = toTitleCase(toText(category, "Street Food"));

  const hasCustomTitle = toText(providedTitle).length > 0;
  const hasCustomDescription = toText(providedDescription).length > 0;

  const generatedTitle = truncate(
    `${safeName} ${safeCategory} in ${safeArea}, ${safeCity} | IndiaFoodMap`,
    60
  );

  const generatedDescription = truncate(
    `Discover ${safeName}, a popular ${safeCategory.toLowerCase()} stall in ${safeArea}, ${safeCity}. Check timings, menu, reviews and directions on IndiaFoodMap.`,
    158
  );

  return {
    seoTitle: hasCustomTitle ? toText(providedTitle) : generatedTitle,
    seoDescription: hasCustomDescription ? toText(providedDescription) : generatedDescription,
    seoKeywords: buildVendorSeoKeywords({ name: safeName, area: safeArea, city: safeCity, category: safeCategory })
  };
};
