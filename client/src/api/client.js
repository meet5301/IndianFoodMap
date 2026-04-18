const getDefaultApiBaseUrl = () => {
  if (typeof window === "undefined") {
    return "/api";
  }

  const { protocol, hostname, port } = window.location;
  const isLocalhost = hostname === "localhost" || hostname === "127.0.0.1";

  if (isLocalhost) {
    return "/api";
  }

  const originPort = port ? `:${port}` : "";
  return `${protocol}//${hostname}${originPort}/api`;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || getDefaultApiBaseUrl();
const LOCAL_API_FALLBACK = "http://localhost:5000/api";

const buildApiCandidates = () => {
  const candidates = [API_BASE_URL];

  const shouldUseLocalhostFallback =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");

  if (shouldUseLocalhostFallback && API_BASE_URL.startsWith("/") && !candidates.includes(LOCAL_API_FALLBACK)) {
    candidates.push(LOCAL_API_FALLBACK);
  }

  return candidates;
};

const API_CANDIDATES = buildApiCandidates();

const apiRequest = async (path, options = {}) => {
  let lastNetworkError = null;

  for (const baseUrl of API_CANDIDATES) {
    try {
      return await fetch(`${baseUrl}${path}`, options);
    } catch (error) {
      if (error instanceof TypeError) {
        lastNetworkError = error;
        continue;
      }

      throw error;
    }
  }

  if (lastNetworkError) {
    throw new Error("Unable to connect to API. Ensure backend is running and API URL is configured correctly.");
  }

  throw new Error("API request failed.");
};

const getAuthHeaders = () => {
  const token = localStorage.getItem("ifm_token");

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`
  };
};

const parseResponse = async (response) => {
  const rawBody = await response.text();
  let payload = {};

  if (rawBody) {
    try {
      payload = JSON.parse(rawBody);
    } catch (_error) {
      payload = { message: rawBody };
    }
  }

  if (!response.ok) {
    const error = new Error(payload.message || rawBody || "Something went wrong");
    error.status = response.status;
    throw error;
  }

  return payload;
};

export const api = {
  async register(payload) {
    const response = await apiRequest("/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async login(payload) {
    const response = await apiRequest("/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async me() {
    const response = await apiRequest("/auth/me", {
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },
  async requestOtp(payload) {
    const response = await apiRequest("/auth/otp/request", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async verifyOtp(payload) {
    const response = await apiRequest("/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async getOverviewStats() {
    const response = await apiRequest("/vendors/stats/overview");
    return parseResponse(response);
  },
  async getKnownAreas() {
    const response = await apiRequest("/vendors/areas");
    return parseResponse(response);
  },
  async resolveAreaLocation(area) {
    const query = new URLSearchParams({ area }).toString();
    const response = await apiRequest(`/vendors/areas/resolve?${query}`);
    return parseResponse(response);
  },
  async getLiveOsmFoodPoints(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiRequest(`/vendors/osm/live${query ? `?${query}` : ""}`);
    return parseResponse(response);
  },
  async getOsmPointDetail(pointId) {
    const [osmType, osmId] = String(pointId || "").split("-");

    if (!osmType || !osmId) {
      throw new Error("Invalid OSM point id");
    }

    const response = await apiRequest(`/vendors/osm/detail/${osmType}/${osmId}`);
    return parseResponse(response);
  },
  async getVendors(params = {}) {
    const query = new URLSearchParams(params).toString();
    const response = await apiRequest(`/vendors${query ? `?${query}` : ""}`);
    return parseResponse(response);
  },
  async getMyVendors() {
    const response = await apiRequest("/vendors/mine", {
      headers: getAuthHeaders()
    });
    return parseResponse(response);
  },
  async importAhmedabadVendors(payload) {
    const response = await apiRequest("/vendors/import/osm", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });
    return parseResponse(response);
  },
  async getVendor(slugOrId) {
    const response = await apiRequest(`/vendors/${slugOrId}`);
    return parseResponse(response);
  },
  async createVendor(payload) {
    const response = await apiRequest("/vendors", {
      method: "POST",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });

    return parseResponse(response);
  },
  async updateVendor(vendorId, payload) {
    const response = await apiRequest(`/vendors/${vendorId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", ...getAuthHeaders() },
      body: JSON.stringify(payload)
    });

    return parseResponse(response);
  },
  async deleteVendor(vendorId) {
    const response = await apiRequest(`/vendors/${vendorId}`, {
      method: "DELETE",
      headers: getAuthHeaders()
    });

    return parseResponse(response);
  },
  async addReview(vendorId, payload) {
    const response = await apiRequest(`/vendors/${vendorId}/reviews`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload)
    });

    return parseResponse(response);
  }
};
