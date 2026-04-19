const DEFAULT_SITE_URL = "https://indiafoodmap.in";

const normalizeSiteUrl = (url) => {
  const raw = String(url || "").trim();

  if (!raw) {
    return DEFAULT_SITE_URL;
  }

  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
};

export const getSiteUrl = () => {
  const envUrl = import.meta.env.VITE_SITE_URL;

  if (envUrl) {
    return normalizeSiteUrl(envUrl);
  }

  if (typeof window !== "undefined" && window.location?.origin) {
    return normalizeSiteUrl(window.location.origin);
  }

  return DEFAULT_SITE_URL;
};

export const getCanonicalUrl = (path = "/") => {
  const siteUrl = getSiteUrl();
  const cleanPath = String(path || "/").trim();

  if (/^https?:\/\//i.test(cleanPath)) {
    return cleanPath;
  }

  const normalizedPath = cleanPath.startsWith("/") ? cleanPath : `/${cleanPath}`;
  return `${siteUrl}${normalizedPath}`;
};

export const DEFAULT_OG_IMAGE = "/social-preview.svg";
