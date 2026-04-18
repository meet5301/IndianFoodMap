import { useEffect, useMemo, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import { api } from "../api/client";
import VendorCard from "../components/VendorCard";

const SEARCH_HISTORY_KEY = "ifm_search_history";
const MAX_HISTORY_ITEMS = 12;

const loadSearchHistory = () => {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (_error) {
    return [];
  }
};

const saveSearchHistory = (entry) => {
  const previous = loadSearchHistory();
  const next = [entry, ...previous.filter((item) => item.key !== entry.key)].slice(0, MAX_HISTORY_ITEMS);
  localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(next));
};

const haversineKm = (lat1, lon1, lat2, lon2) => {
  const toRad = (value) => (value * Math.PI) / 180;
  const earthRadiusKm = 6371;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);

  return 2 * earthRadiusKm * Math.asin(Math.sqrt(a));
};

const quickAreas = [
  "Ambawadi",
  "Akhbarnagar",
  "Asarwa",
  "Bapunagar",
  "Bhat",
  "Bodakdev",
  "Bopal",
  "CG Road",
  "Chandkheda",
  "Ellisbridge",
  "Ghatlodia",
  "Ghodasar",
  "Gota",
  "Gurukul",
  "Hebatpur",
  "Iscon",
  "Jodhpur",
  "Juhapura",
  "Kankaria",
  "Khokhra",
  "Law Garden",
  "Makarba",
  "Maninagar",
  "Memnagar",
  "Mithakhali",
  "Motera",
  "Naranpura",
  "Naroda",
  "Narol",
  "Navrangpura",
  "Nehrunagar",
  "Old Vadaj",
  "Paldi",
  "Prahlad Nagar",
  "Rakhial",
  "Ranip",
  "S G Highway",
  "Sabarmati",
  "Satellite",
  "Sarkhej",
  "Sarkhej Gandhinagar Highway",
  "Shahibaug",
  "Shilaj",
  "Sindhu Bhavan",
  "Sola",
  "South Bopal",
  "Thaltej",
  "Usmanpura",
  "Vadaj",
  "Vaishnodevi Circle",
  "Vatva",
  "Vastral",
  "Vastrapur",
  "Vejalpur",
  "Vasna",
  "Zundal"
];

const markerIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const getDirectionsUrl = ({ destinationLat, destinationLng, origin }) => {
  const destination = `${destinationLat},${destinationLng}`;

  if (origin?.lat && origin?.lng) {
    return `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination}&travelmode=driving`;
  }

  return `https://www.google.com/maps/dir/?api=1&destination=${destination}&travelmode=driving`;
};

const FindStallPage = () => {
  const [vendors, setVendors] = useState([]);
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filters, setFilters] = useState({ search: "", area: "", openNow: false, radiusKm: "5" });
  const [error, setError] = useState("");
  const [userLocation, setUserLocation] = useState(null);
  const [areaLocation, setAreaLocation] = useState(null);
  const [showAreaMenu, setShowAreaMenu] = useState(false);
  const [areaMenuSearch, setAreaMenuSearch] = useState("");
  const [locationStatus, setLocationStatus] = useState("");
  const areaOptions = areas.length ? areas : quickAreas;
  const filteredAreaOptions = areaOptions.filter((area) => area.toLowerCase().includes(areaMenuSearch.trim().toLowerCase()));

  const loadVendors = async (query = filters) => {
    setLoading(true);
    setError("");

    const hasMeaningfulSearch = Boolean(query.search.trim() || query.area.trim() || query.openNow || userLocation);
    if (hasMeaningfulSearch) {
      saveSearchHistory({
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        key: JSON.stringify({
          search: query.search.trim(),
          area: query.area.trim(),
          openNow: Boolean(query.openNow),
          radiusKm: query.radiusKm,
          location: (userLocation || areaLocation) ? { lat: (userLocation || areaLocation).lat, lng: (userLocation || areaLocation).lng } : null
        }),
        search: query.search.trim(),
        area: query.area.trim(),
        openNow: Boolean(query.openNow),
        radiusKm: query.radiusKm,
        location: (userLocation || areaLocation) ? { lat: (userLocation || areaLocation).lat, lng: (userLocation || areaLocation).lng } : null,
        at: new Date().toISOString()
      });
    }

    try {
      const requestQuery = {
        search: query.search.trim(),
        area: query.area.trim(),
        city: "Ahmedabad",
        limit: 200
      };

      if (query.openNow) {
        requestQuery.openNow = true;
      }

      const searchCenter = userLocation || areaLocation;

      if (searchCenter && query.radiusKm) {
        requestQuery.lat = searchCenter.lat;
        requestQuery.lng = searchCenter.lng;
        requestQuery.radiusKm = query.radiusKm;
      }

      const payload = await api.getVendors(requestQuery);
      setVendors(payload.vendors || []);
    } catch (err) {
      setError(err.message);
      setVendors([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVendors(filters);
    api.getKnownAreas()
      .then((data) => setAreas(data.areas || []))
      .catch(() => setAreas([]));
    sessionStorage.removeItem("ifm_osm_points_find_stall");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const hasSearch = filters.search.trim().length > 0 || filters.area.trim().length > 0 || filters.openNow || Boolean(userLocation);
    const delay = setTimeout(() => {
      if (hasSearch) {
        loadVendors(filters);
      }
    }, 350);

    return () => clearTimeout(delay);
  }, [filters.search, filters.area, filters.openNow, filters.radiusKm, userLocation, areaLocation]);

  useEffect(() => {
    let alive = true;

    if (!filters.area) {
      setAreaLocation(null);
      return () => {
        alive = false;
      };
    }

    api.resolveAreaLocation(filters.area)
      .then((data) => {
        if (!alive) {
          return;
        }

        const nextLat = Number(data.coordinates.latitude);
        const nextLng = Number(data.coordinates.longitude);

        if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
          setAreaLocation({ lat: nextLat, lng: nextLng });
        } else {
          setAreaLocation(null);
        }
      })
      .catch(() => {
        if (alive) {
          setAreaLocation(null);
        }
      });

    return () => {
      alive = false;
    };
  }, [filters.area]);

  useEffect(() => {
    if (!showAreaMenu) {
      setAreaMenuSearch("");
    }
  }, [showAreaMenu]);

  const center = useMemo(() => {
    if (userLocation) {
      return [userLocation.lat, userLocation.lng];
    }

    if (areaLocation) {
      return [areaLocation.lat, areaLocation.lng];
    }

    const first = vendors[0];
    if (!first?.location?.coordinates?.length) {
      return [23.0225, 72.5714];
    }
    return [first.location.coordinates[1], first.location.coordinates[0]];
  }, [vendors, userLocation, areaLocation]);

  const vendorsWithDistance = useMemo(() => {
    if (!userLocation) {
      return vendors;
    }

    return [...vendors]
      .map((vendor) => {
        const coords = vendor.location?.coordinates;
        if (!coords || coords.length < 2) {
          return { ...vendor, distanceKm: Number.POSITIVE_INFINITY };
        }

        const distanceKm = haversineKm(userLocation.lat, userLocation.lng, coords[1], coords[0]);
        return { ...vendor, distanceKm };
      })
      .sort((left, right) => left.distanceKm - right.distanceKm);
  }, [vendors, userLocation]);

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus("Your browser does not support location access.");
      return;
    }

    setLocationStatus("Fetching your location...");
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude
        });
        setLocationStatus("Showing nearest stalls from your location.");
        setFilters((prev) => ({ ...prev, search: prev.search }));
      },
      () => {
        setLocationStatus("Location access denied. You can still search by area.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    await loadVendors(filters);
  };

  const suggestedAreas = areas.length ? areas.slice(0, 6) : quickAreas;

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Helmet>
        <title>Find Stall Near You - IndiaFoodMap</title>
        <meta name="description" content="Customer page to quickly find nearby stalls and check whether they are open." />
      </Helmet>

      <section className="glass-card relative z-30 p-5">
        <h1 className="font-display text-3xl font-bold">Find a Stall</h1>
        <p className="mt-2 text-sm text-slate-300">Quick customer view to check where stalls are and whether they are currently open.</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-ghost" onClick={useMyLocation}>
            Find by live location
          </button>
          {userLocation ? (
            <button type="button" className="btn-ghost" onClick={() => setUserLocation(null)}>
              Clear location
            </button>
          ) : null}
        </div>
        {locationStatus ? <p className="mt-2 text-xs text-slate-400">{locationStatus}</p> : null}

        <form onSubmit={onSubmit} className="relative z-40 mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-5">
          <input
            className="input-ui"
            placeholder="Search by stall name, category, or menu"
            value={filters.search}
            onChange={(event) => setFilters((prev) => ({ ...prev, search: event.target.value }))}
          />
          <div className="relative sm:col-span-1">
            <button
              type="button"
              className="input-ui flex items-center justify-between text-left"
              onClick={() => setShowAreaMenu((prev) => !prev)}
            >
              <span className="truncate">{filters.area || "All areas"}</span>
              <span className="text-xs text-slate-400">▾</span>
            </button>
            {showAreaMenu ? (
              <div className="absolute left-0 right-0 top-full z-50 mt-2 rounded-xl border border-line bg-panelSoft p-2 shadow-xl shadow-black/30">
                <input
                  autoFocus
                  className="input-ui mb-2 h-10 text-sm"
                  placeholder="Search area"
                  value={areaMenuSearch}
                  onChange={(event) => setAreaMenuSearch(event.target.value)}
                />
                <div className="max-h-[264px] overflow-auto pr-1">
                <button
                  type="button"
                  className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${filters.area ? "text-slate-200 hover:bg-panel" : "bg-amber-300/10 text-amber-200"}`}
                  onClick={() => {
                    setFilters((prev) => ({ ...prev, area: "" }));
                    setShowAreaMenu(false);
                  }}
                >
                  All areas
                </button>
                {filteredAreaOptions.length ? filteredAreaOptions.map((area) => (
                  <button
                    key={area}
                    type="button"
                    className={`block w-full rounded-lg px-3 py-2 text-left text-sm ${filters.area === area ? "bg-amber-300/10 text-amber-200" : "text-slate-200 hover:bg-panel"}`}
                    onClick={() => {
                      setFilters((prev) => ({ ...prev, area }));
                      setShowAreaMenu(false);
                    }}
                  >
                    {area}
                  </button>
                )) : (
                  <p className="px-3 py-2 text-sm text-slate-400">No matching areas.</p>
                )}
                </div>
              </div>
            ) : null}
          </div>
          <label className="flex items-center gap-2 rounded-lg border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200">
            <input
              type="checkbox"
              checked={filters.openNow}
              onChange={(event) => setFilters((prev) => ({ ...prev, openNow: event.target.checked }))}
            />
            Open only
          </label>
          <select
            className="input-ui"
            value={filters.radiusKm}
            onChange={(event) => setFilters((prev) => ({ ...prev, radiusKm: event.target.value }))}
            disabled={!userLocation && !areaLocation}
          >
            <option value="1">1 km radius</option>
            <option value="3">3 km radius</option>
            <option value="5">5 km radius</option>
            <option value="10">10 km radius</option>
          </select>
          <button className="btn-primary sm:col-span-2 xl:col-span-1" type="submit" disabled={loading}>
            {loading ? "Searching..." : "Search"}
          </button>
        </form>
        <div className="mt-3 flex flex-wrap gap-2">
          {areaOptions.slice(0, 6).map((area) => (
            <button
              key={area}
              type="button"
              className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs text-slate-200 transition hover:border-amber-300 hover:text-white"
              onClick={() => setFilters((prev) => ({ ...prev, area }))}
            >
              {area}
            </button>
          ))}
        </div>
        {userLocation || areaLocation ? (
          <p className="mt-2 text-xs text-slate-400">
            Radius filter is active around {userLocation ? "your current location" : `${filters.area} area`}.
          </p>
        ) : (
          <p className="mt-2 text-xs text-slate-400">Select an area or enable live location to use the radius filter.</p>
        )}
        {error ? <p className="mt-3 text-sm text-amber-200">{error}</p> : null}
      </section>

      <section className="glass-card relative z-10 overflow-hidden p-3">
        <MapContainer center={center} zoom={12} className="h-[38vh] min-h-[260px] w-full rounded-xl sm:h-[42vh] md:h-[420px]">
          <TileLayer attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>' url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {vendors.map((vendor) => {
            const coords = vendor.location?.coordinates;
            if (!coords || coords.length < 2) {
              return null;
            }

            return (
              <Marker key={vendor._id} position={[coords[1], coords[0]]} icon={markerIcon}>
                <Popup>
                  <div className="space-y-1.5">
                    <p className="m-0 text-sm font-semibold">{vendor.name}</p>
                    <p className="m-0 text-xs text-slate-700">{vendor.category || "Street food"} • {vendor.area}, {vendor.city}</p>
                    <p className="m-0 text-xs text-slate-700">Open now: {vendor.isOpenNow ? "Yes" : "No"}</p>
                    <p className="m-0 text-xs text-slate-700">Timing: {vendor.timings || "Not specified"}</p>
                    {vendor.ratingCount ? <p className="m-0 text-xs text-slate-700">Rating: {vendor.ratingAverage?.toFixed?.(1) || vendor.ratingAverage} ({vendor.ratingCount})</p> : null}
                    {vendor.menuItems?.length ? <p className="m-0 text-xs text-slate-700">Menu: {vendor.menuItems.slice(0, 4).join(", ")}</p> : null}
                    <div className="flex flex-wrap gap-2 pt-1">
                      <Link className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800" to={`/vendor/${vendor.slug || vendor._id}`}>
                        View details
                      </Link>
                      <a
                        className="rounded-full border border-slate-300 px-2 py-1 text-xs font-medium text-slate-800"
                        href={getDirectionsUrl({
                          destinationLat: coords[1],
                          destinationLng: coords[0],
                          origin: userLocation
                        })}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Get directions
                      </a>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
        <p className="mt-2 text-xs text-slate-500">
          Showing only verified vendor records from your application database.
        </p>
      </section>

      <section className="glass-card p-3 sm:p-5">
        <h2 className="section-title">Results ({vendors.length})</h2>
        {vendorsWithDistance.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 sm:gap-2 lg:grid-cols-3 xl:grid-cols-4">
            {vendorsWithDistance.map((vendor) => (
              <VendorCard key={vendor._id} vendor={vendor} distanceKm={vendor.distanceKm} />
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">No stalls matched your filter.</p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="btn-ghost" onClick={() => setFilters({ search: "", area: "", openNow: false, radiusKm: "5" })}>
                Clear filters
              </button>
              {suggestedAreas.map((area) => (
                <button
                  key={area}
                  type="button"
                  className="rounded-full border border-line bg-panelSoft px-3 py-1 text-xs text-slate-200 transition hover:border-amber-300 hover:text-white"
                  onClick={() => setFilters((prev) => ({ ...prev, area }))}
                >
                  Try {area}
                </button>
              ))}
            </div>
          </div>
        )}
      </section>
    </main>
  );
};

export default FindStallPage;
