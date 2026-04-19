import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import { MapContainer, Marker, TileLayer, useMapEvents, Polyline, Popup, Tooltip } from "react-leaflet";
import L from "leaflet";
import Seo from "../components/Seo";

const parseCsv = (value) => {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
};

const readFilesAsDataUrls = async (files) => {
  const fileList = Array.from(files || []);

  if (!fileList.length) {
    return [];
  }

  return Promise.all(
    fileList.map(
      (file) =>
        new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(String(reader.result || ""));
          reader.onerror = () => reject(new Error(`Failed to read ${file.name}`));
          reader.readAsDataURL(file);
        })
    )
  );
};

const pinIcon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const defaultCenter = [23.0225, 72.5714];

const MapEvents = ({ onPick }) => {
  useMapEvents({
    click(event) {
      onPick(event.latlng.lat, event.latlng.lng);
    }
  });

  return null;
};

const AddVendorPage = () => {
  const { user } = useAuth();
  const [areas, setAreas] = useState([]);
  const [areaCoordinates, setAreaCoordinates] = useState(null);
  const [pinMode, setPinMode] = useState("area");
  const [locationName, setLocationName] = useState("");
  const [nearbyStreets, setNearbyStreets] = useState([]);
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);
  const [form, setForm] = useState({
    name: "",
    city: "Ahmedabad",
    area: "",
    category: "",
    timings: "",
    openingTime: "",
    closingTime: "",
    description: "",
    imageUrl: "",
    menuItemsCsv: "",
    imagesCsv: "",
    whatsappNumber: "",
    latitude: "",
    longitude: "",
    seoTitle: "",
    seoDescription: "",
    language: "en"
  });
  const [status, setStatus] = useState("");

  useEffect(() => {
    api.getKnownAreas()
      .then((data) => setAreas(data.areas || []))
      .catch(() => setAreas([]));
  }, []);

  useEffect(() => {
    if (!form.area) {
      setAreaCoordinates(null);
      setNearbyStreets([]);
      return;
    }

    let alive = true;

    api.resolveAreaLocation(form.area)
      .then((data) => {
        if (!alive) {
          return;
        }

        const nextLat = Number(data.coordinates.latitude);
        const nextLng = Number(data.coordinates.longitude);

        if (Number.isFinite(nextLat) && Number.isFinite(nextLng)) {
          setAreaCoordinates([nextLat, nextLng]);
          setPinMode("area");
          setForm((prev) => ({
            ...prev,
            latitude: String(nextLat),
            longitude: String(nextLng)
          }));

          // Fetch nearby streets using Overpass API
          const bbox = `${nextLat - 0.01},${nextLng - 0.01},${nextLat + 0.01},${nextLng + 0.01}`;
          const overpassUrl = `https://overpass-api.de/api/interpreter?data=[bbox:${bbox}];(way["highway"];);out geom;`;
          
          fetch(overpassUrl)
            .then((res) => res.text())
            .then((osmData) => {
              if (!alive) return;
              const streets = parseOverpassData(osmData);
              setNearbyStreets(streets.slice(0, 15));
            })
            .catch((err) => {
              console.error("Overpass API failed:", err);
              setNearbyStreets([]);
            });
        }
      })
      .catch(() => {
        if (alive) {
          setAreaCoordinates(null);
          setNearbyStreets([]);
        }
      });

    return () => {
      alive = false;
    };
  }, [form.area]);

  const parseOverpassData = (osmXml) => {
    const parser = new DOMParser();
    const doc = parser.parseFromString(osmXml, "text/xml");
    const ways = doc.getElementsByTagName("way");
    const streets = [];

    for (let i = 0; i < Math.min(ways.length, 20); i++) {
      const way = ways[i];
      const nameTag = way.querySelector("tag[k='name']");
      const nodes = way.getElementsByTagName("nd");
      
      if (nameTag && nodes.length > 1) {
        const coords = [];
        for (let j = 0; j < nodes.length; j++) {
          const lat = nodes[j].getAttribute("lat");
          const lon = nodes[j].getAttribute("lon");
          if (lat && lon) {
            coords.push([parseFloat(lat), parseFloat(lon)]);
          }
        }
        if (coords.length > 1) {
          streets.push({
            name: nameTag.getAttribute("v"),
            coords
          });
        }
      }
    }

    return streets;
  };

  const onChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const onImageFilesChange = (event) => {
    setSelectedImageFiles(Array.from(event.target.files || []));
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    setStatus("Submitting...");

    try {
      const uploadedImages = await readFilesAsDataUrls(selectedImageFiles);
      const additionalImages = parseCsv(form.imagesCsv);
      const openingTime = form.openingTime.trim();
      const closingTime = form.closingTime.trim();

      await api.createVendor({
        ...form,
        menuItems: parseCsv(form.menuItemsCsv),
        timings: form.timings || (openingTime && closingTime ? `${openingTime} - ${closingTime}` : ""),
        openingTime,
        closingTime,
        imageUrl: form.imageUrl.trim() || uploadedImages[0] || "",
        images: [...additionalImages, ...uploadedImages],
        submittedBy: user?.name || "community"
      });
      setStatus("Vendor submitted successfully");
      setForm((prev) => ({
        ...prev,
        name: "",
        city: "Ahmedabad",
        area: "",
        category: "",
        timings: "",
        openingTime: "",
        closingTime: "",
        description: "",
        imageUrl: "",
        menuItemsCsv: "",
        imagesCsv: "",
        whatsappNumber: "",
        latitude: "",
        longitude: "",
        seoTitle: "",
        seoDescription: ""
      }));
      setSelectedImageFiles([]);
    } catch (error) {
      setStatus(error.message);
    }
  };

  const mapCenter = useMemo(() => {
    const lat = Number(form.latitude);
    const lng = Number(form.longitude);

    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }

    if (areaCoordinates) {
      return areaCoordinates;
    }

    return defaultCenter;
  }, [form.latitude, form.longitude, areaCoordinates]);

  const reverseGeocode = async (lat, lng) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      );
      const data = await response.json();
      const address = data.address || {};
      const name = data.name || "";
      const road = address.road || "";
      const neighbourhood = address.neighbourhood || address.suburb || "";
      const displayName = road || neighbourhood || name || `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
      setLocationName(displayName);
    } catch (error) {
      console.error("Reverse geocode failed:", error);
      setLocationName("");
    }
  };

  const updatePin = (lat, lng, source = "manual") => {
    setPinMode(source);
    setForm((prev) => ({
      ...prev,
      latitude: String(Number(lat).toFixed(6)),
      longitude: String(Number(lng).toFixed(6))
    }));
    reverseGeocode(lat, lng);
  };

  return (
    <main className="page-wrap pb-8">
      <Seo
        title="Add Vendor | IndiaFoodMap"
        description="Submit new street food vendors with GPS and SEO metadata."
        path="/add-vendor"
        noindex
      />

      <section className="glass-card p-5">
        <h1 className="font-display text-3xl font-bold">Add Vendor</h1>
        <p className="mt-2 text-sm text-slate-300">
          Vendor onboarding form for Ahmedabad. Select an area, then click or drag on the map to set the exact stall location.
        </p>
        <p className="mt-1 text-xs text-slate-500">Add your food items clearly, for example pav bhaji, dosa, chai, sandwich, or frankie.</p>

        <form onSubmit={onSubmit} className="mt-4 grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Food stall name</label>
            <input className="input-ui" name="name" value={form.name} onChange={onChange} placeholder="Enter food stall name" required />
          </div>
          <input className="input-ui" value="Ahmedabad" disabled />
          <select className="input-ui" name="area" value={form.area} onChange={onChange} required>
            <option value="">Select area</option>
            {areas.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <input className="input-ui" name="category" value={form.category} onChange={onChange} placeholder="Category e.g. Snacks, Chaat, South Indian" required />
          <input className="input-ui" name="whatsappNumber" value={form.whatsappNumber} onChange={onChange} placeholder="Contact number (919...)" />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Opening time</label>
            <input className="input-ui" type="time" name="openingTime" value={form.openingTime} onChange={onChange} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Closing time</label>
            <input className="input-ui" type="time" name="closingTime" value={form.closingTime} onChange={onChange} />
          </div>
          <input className="input-ui sm:col-span-2" name="timings" value={form.timings} onChange={onChange} placeholder="Timings note (optional) e.g. 5 PM - 1 AM" />
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Primary image URL</label>
              <input className="input-ui" name="imageUrl" value={form.imageUrl} onChange={onChange} placeholder="Paste image URL here" />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Upload images</label>
              <input className="input-ui py-2" type="file" accept="image/*" multiple onChange={onImageFilesChange} />
            </div>
          </div>
          <input className="input-ui sm:col-span-2" name="imagesCsv" value={form.imagesCsv} onChange={onChange} placeholder="More image URLs (comma separated)" />
          <input
            className="input-ui sm:col-span-2"
            name="menuItemsCsv"
            value={form.menuItemsCsv}
            onChange={onChange}
            placeholder="Food items you sell (comma separated)"
            required
          />
          <input className="input-ui" name="latitude" value={form.latitude} onChange={onChange} placeholder="Latitude (optional)" />
          <input className="input-ui" name="longitude" value={form.longitude} onChange={onChange} placeholder="Longitude (optional)" />
          <input className="input-ui md:col-span-2" name="seoTitle" value={form.seoTitle} onChange={onChange} placeholder="SEO title" />
          <textarea
            className="input-ui md:col-span-2"
            name="seoDescription"
            value={form.seoDescription}
            onChange={onChange}
            placeholder="SEO description"
            rows="3"
          />
          <textarea
            className="input-ui md:col-span-2"
            name="description"
            value={form.description}
            onChange={onChange}
            placeholder="Vendor description"
            rows="4"
          />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full sm:w-auto">
              Submit Vendor
            </button>
          </div>
        </form>

        <div className="mt-5 rounded-2xl border border-line bg-panelSoft p-3">
          <div className="mb-2 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="font-semibold text-white">Pin exact location</h2>
              <p className="text-xs text-slate-400">Click on the map or drag the marker to set the exact stall location.</p>
            </div>
            <button
              type="button"
              className="btn-ghost text-xs"
              onClick={() => {
                if (!areaCoordinates) {
                  return;
                }

                updatePin(areaCoordinates[0], areaCoordinates[1], "area");
              }}
            >
              Use area center
            </button>
          </div>

          <div className="overflow-hidden rounded-xl border border-line">
            <MapContainer key={`${mapCenter[0]}-${mapCenter[1]}`} center={mapCenter} zoom={17} className="h-[38vh] min-h-[260px] w-full sm:h-[42vh] md:h-[360px]">
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                maxZoom={19}
              />
              <MapEvents onPick={(lat, lng) => updatePin(lat, lng, "manual")} />
              {nearbyStreets.map((street, idx) => {
                const midpoint = street.coords[Math.floor(street.coords.length / 2)] || street.coords[0];
                return (
                  <div key={idx}>
                    <Polyline
                      positions={street.coords}
                      color="#FF6B00"
                      weight={4}
                      opacity={0.8}
                    >
                      <Tooltip permanent sticky className="bg-orange-500 text-white text-xs font-bold border-0">
                        {street.name}
                      </Tooltip>
                      <Popup>
                        <div className="text-sm font-semibold text-slate-900">{street.name}</div>
                      </Popup>
                    </Polyline>
                  </div>
                );
              })}
              {Number.isFinite(Number(form.latitude)) && Number.isFinite(Number(form.longitude)) ? (
                <Marker
                  position={[Number(form.latitude), Number(form.longitude)]}
                  icon={pinIcon}
                  draggable
                  eventHandlers={{
                    dragend(event) {
                      const marker = event.target;
                      const next = marker.getLatLng();
                      updatePin(next.lat, next.lng, "manual");
                    }
                  }}
                />
              ) : null}
            </MapContainer>
          </div>

          <div className="mt-3 space-y-2">
            {form.area && (
              <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2">
                <p className="text-xs text-amber-200/60">Selected Area</p>
                <p className="font-semibold text-amber-100">{form.area}</p>
              </div>
            )}
            {locationName && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2">
                <p className="text-xs text-emerald-200/60">Street / Location Name</p>
                <p className="font-semibold text-emerald-100">{locationName}</p>
              </div>
            )}
            <div className="grid gap-2 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-panelSoft px-3 py-2 text-sm text-slate-300">
                Latitude: <span className="text-white">{form.latitude || "not set"}</span>
              </div>
              <div className="rounded-xl border border-line bg-panelSoft px-3 py-2 text-sm text-slate-300">
                Longitude: <span className="text-white">{form.longitude || "not set"}</span>
              </div>
            </div>
          </div>
          <p className="mt-2 text-xs text-slate-500">Mode: {pinMode === "manual" ? "manual pin" : "area center"}</p>
        </div>

        {status ? <p className="mt-3 text-sm text-amber-200">{status}</p> : null}
      </section>
    </main>
  );
};

export default AddVendorPage;
