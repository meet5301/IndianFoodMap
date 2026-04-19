import { Helmet } from "react-helmet-async";
import { DEFAULT_OG_IMAGE, getCanonicalUrl } from "../utils/seo";

const toAbsoluteUrl = (value) => {
  if (!value) {
    return "";
  }

  return /^https?:\/\//i.test(value) ? value : getCanonicalUrl(value);
};

const Seo = ({
  title,
  description,
  path = "/",
  image = DEFAULT_OG_IMAGE,
  type = "website",
  noindex = false,
  keywords = "",
  schema = null
}) => {
  const canonical = getCanonicalUrl(path);
  const imageUrl = toAbsoluteUrl(image);
  const robots = noindex ? "noindex, nofollow" : "index, follow";

  return (
    <Helmet prioritizeSeoTags>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />
      {keywords ? <meta name="keywords" content={keywords} /> : null}

      <meta property="og:type" content={type} />
      <meta property="og:site_name" content="IndiaFoodMap" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      {imageUrl ? <meta property="og:image" content={imageUrl} /> : null}

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      {imageUrl ? <meta name="twitter:image" content={imageUrl} /> : null}

      {schema ? <script type="application/ld+json">{JSON.stringify(schema)}</script> : null}
    </Helmet>
  );
};

export default Seo;
