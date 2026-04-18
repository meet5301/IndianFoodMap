import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const OwnerPortalPage = () => {
  const { isAuthenticated, user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [areas, setAreas] = useState([]);
  const [error, setError] = useState("");
  const [importArea, setImportArea] = useState("");
  const [importStatus, setImportStatus] = useState("");
  const [editingVendorId, setEditingVendorId] = useState("");
  const [editDrafts, setEditDrafts] = useState({});
  const [actionStatus, setActionStatus] = useState("");

  useEffect(() => {
    api.getKnownAreas()
      .then((data) => setAreas(data.areas || []))
      .catch(() => setAreas([]));

    const load = async () => {
      if (!isAuthenticated) {
        setVendors([]);
        return;
      }

      try {
        const data = await api.getMyVendors();
        setVendors(data.vendors || []);
      } catch (err) {
        setError(err.message);
      }
    };

    load();
  }, [isAuthenticated]);

  const vendorStats = useMemo(() => {
    const total = vendors.length;
    const openNow = vendors.filter((vendor) => vendor.isOpenNow).length;
    const uniqueAreas = new Set(vendors.map((vendor) => vendor.area).filter(Boolean)).size;

    return { total, openNow, uniqueAreas };
  }, [vendors]);

  const buildDraftFromVendor = (vendor) => ({
    name: vendor.name || "",
    city: vendor.city || "Ahmedabad",
    area: vendor.area || "",
    category: vendor.category || "",
    priceRange: vendor.priceRange || "low",
    timings: vendor.timings || "",
    isOpenNow: Boolean(vendor.isOpenNow),
    description: vendor.description || "",
    imageUrl: vendor.imageUrl || "",
    menuItemsCsv: Array.isArray(vendor.menuItems) ? vendor.menuItems.join(", ") : "",
    imagesCsv: Array.isArray(vendor.images) ? vendor.images.join(", ") : "",
    whatsappNumber: vendor.whatsappNumber || "",
    latitude: vendor.location?.coordinates?.[1] ? String(vendor.location.coordinates[1]) : "",
    longitude: vendor.location?.coordinates?.[0] ? String(vendor.location.coordinates[0]) : "",
    seoTitle: vendor.seoTitle || "",
    seoDescription: vendor.seoDescription || "",
    language: vendor.language || "en"
  });

  const startEditing = (vendor) => {
    setEditingVendorId(vendor._id);
    setEditDrafts((prev) => ({
      ...prev,
      [vendor._id]: buildDraftFromVendor(vendor)
    }));
    setActionStatus("");
  };

  const stopEditing = () => {
    setEditingVendorId("");
    setActionStatus("");
  };

  const onEditChange = (vendorId, event) => {
    const { name, type, value, checked } = event.target;
    setEditDrafts((prev) => ({
      ...prev,
      [vendorId]: {
        ...(prev[vendorId] || {}),
        [name]: type === "checkbox" ? checked : value
      }
    }));
  };

  const saveVendor = async (vendorId) => {
    const draft = editDrafts[vendorId] || {};
    setActionStatus("Saving vendor changes...");

    try {
      await api.updateVendor(vendorId, {
        name: draft.name,
        city: draft.city,
        area: draft.area,
        category: draft.category,
        priceRange: draft.priceRange,
        timings: draft.timings,
        isOpenNow: draft.isOpenNow,
        description: draft.description,
        imageUrl: draft.imageUrl,
        images: (draft.imagesCsv || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        menuItems: (draft.menuItemsCsv || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean),
        whatsappNumber: draft.whatsappNumber,
        seoTitle: draft.seoTitle,
        seoDescription: draft.seoDescription,
        language: draft.language,
        latitude: draft.latitude,
        longitude: draft.longitude
      });

      const data = await api.getMyVendors();
      setVendors(data.vendors || []);
      setEditingVendorId("");
      setActionStatus("Vendor updated successfully");
    } catch (err) {
      setActionStatus(err.message);
    }
  };

  const removeVendor = async (vendorId, vendorName) => {
    const confirmed = window.confirm(`Delete ${vendorName}? This cannot be undone.`);
    if (!confirmed) {
      return;
    }

    setActionStatus("Deleting vendor...");

    try {
      await api.deleteVendor(vendorId);
      const data = await api.getMyVendors();
      setVendors(data.vendors || []);
      setActionStatus("Vendor deleted");
    } catch (err) {
      setActionStatus(err.message);
    }
  };

  const handleImport = async (event) => {
    event.preventDefault();
    setImportStatus("Importing... please wait");

    try {
      const result = await api.importAhmedabadVendors({ area: importArea.trim() });
      setImportStatus(`Imported ${result.importedCount} vendors from open data for ${importArea.trim()}`);
      const data = await api.getMyVendors();
      setVendors(data.vendors || []);
    } catch (err) {
      setImportStatus(err.message);
    }
  };

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Helmet>
        <title>Vendor Profile - IndiaFoodMap</title>
        <meta name="description" content="Vendor profile with stall history, counts, and stall management actions." />
      </Helmet>

      <section className="glass-card p-5">
        <p className="label-kicker">Vendor profile</p>
        <h1 className="mt-3 font-display text-3xl font-bold">Your stall dashboard</h1>
        <p className="mt-2 text-sm text-slate-300">
          Use this dashboard to see how many stalls you have added, edit their details, or remove them when needed.
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Added stalls</p>
            <p className="mt-1 font-display text-2xl font-bold">{vendorStats.total}</p>
            <p className="text-xs text-slate-400">total listings</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Open now</p>
            <p className="mt-1 font-display text-2xl font-bold">{vendorStats.openNow}</p>
            <p className="text-xs text-slate-400">currently active stalls</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Areas covered</p>
            <p className="mt-1 font-display text-2xl font-bold">{vendorStats.uniqueAreas}</p>
            <p className="text-xs text-slate-400">localities listed</p>
          </article>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          <Link to="/add-vendor" className="btn-primary w-full text-center sm:w-auto">
            Add another stall
          </Link>
          <Link to="/find-stall" className="btn-ghost w-full text-center sm:w-auto">
            See customer view
          </Link>
        </div>

        {actionStatus ? <p className="mt-4 text-sm text-amber-200">{actionStatus}</p> : null}
        {user ? <p className="mt-2 text-xs text-slate-500">Signed in as {user.email}</p> : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h2 className="font-semibold text-white">Add</h2>
            <p className="mt-1 text-sm text-slate-300">Create another stall listing when you expand your setup.</p>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h2 className="font-semibold text-white">Edit</h2>
            <p className="mt-1 text-sm text-slate-300">Keep timings, menu, and coordinates updated.</p>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h2 className="font-semibold text-white">Delete</h2>
            <p className="mt-1 text-sm text-slate-300">Remove closed or duplicate stalls instantly.</p>
          </article>
          <article className="rounded-xl border border-line bg-panelSoft p-4">
            <h2 className="font-semibold text-white">Import</h2>
            <p className="mt-1 text-sm text-slate-300">Bring in open-data vendors for supported areas.</p>
          </article>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to="/add-vendor" className="btn-primary w-full text-center sm:w-auto">
            Add your stall now
          </Link>
          <Link to="/find-stall" className="btn-ghost w-full text-center sm:w-auto">
            See customer view
          </Link>
        </div>

        {isAuthenticated ? (
          <form onSubmit={handleImport} className="mt-5 rounded-xl border border-line bg-panelSoft p-4">
            <h2 className="font-semibold text-white">Auto Import Ahmedabad Vendors (Open Data)</h2>
            <p className="mt-1 text-xs text-slate-400">
              This does not use Google scraping. Import runs from OpenStreetMap open data.
            </p>
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <select className="input-ui" value={importArea} onChange={(event) => setImportArea(event.target.value)} required>
                <option value="">Select area to import</option>
                {areas.map((area) => (
                  <option key={area} value={area}>
                    {area}
                  </option>
                ))}
              </select>
              <button className="btn-primary sm:w-auto" type="submit">Import by area</button>
            </div>
            {importStatus ? <p className="mt-2 text-sm text-amber-200">{importStatus}</p> : null}
          </form>
        ) : null}
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title">My Submitted Stalls</h2>
        {!isAuthenticated ? (
          <p className="text-sm text-slate-400">Login to view your submitted stalls.</p>
        ) : error ? (
          <p className="text-sm text-amber-200">{error}</p>
        ) : vendors.length ? (
          <div className="grid gap-3 lg:grid-cols-2">
            {vendors.map((vendor) => (
              <article key={vendor._id} className="rounded-xl border border-line bg-panelSoft p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="font-display text-xl font-semibold text-white">{vendor.name}</h3>
                    <p className="mt-1 text-sm text-slate-300">{vendor.area}, {vendor.city}</p>
                  </div>
                  <span className="rounded-full border border-line bg-panel px-2 py-1 text-xs text-slate-200">{vendor.category}</span>
                </div>

                <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-400">
                  <span>Open now: {vendor.isOpenNow ? "Yes" : "No"}</span>
                  <span>Rating: {vendor.ratingAverage || 0} ({vendor.ratingCount || 0})</span>
                </div>

                <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap">
                  <Link to={`/vendor/${vendor.slug}`} className="btn-ghost text-center text-xs">
                    Open vendor page
                  </Link>
                  <button type="button" className="btn-ghost text-xs" onClick={() => startEditing(vendor)}>
                    Edit
                  </button>
                  <button type="button" className="btn-ghost text-xs" onClick={() => removeVendor(vendor._id, vendor.name)}>
                    Delete
                  </button>
                </div>

                {editingVendorId === vendor._id ? (
                  <div className="mt-4 rounded-xl border border-line bg-[#101214] p-4">
                    <div className="mb-3 flex items-center justify-between gap-2">
                      <h4 className="font-semibold text-white">Edit stall</h4>
                      <button type="button" className="text-xs text-slate-400 hover:text-white" onClick={stopEditing}>
                        Cancel
                      </button>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <input className="input-ui" name="name" value={editDrafts[vendor._id]?.name || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Vendor name" />
                      <input className="input-ui" name="city" value={editDrafts[vendor._id]?.city || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="City" />
                      <input className="input-ui" name="area" value={editDrafts[vendor._id]?.area || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Area" />
                      <input className="input-ui" name="category" value={editDrafts[vendor._id]?.category || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Category" />
                      <select className="input-ui" name="priceRange" value={editDrafts[vendor._id]?.priceRange || "low"} onChange={(event) => onEditChange(vendor._id, event)}>
                        <option value="low">Low</option>
                        <option value="mid">Mid</option>
                        <option value="high">High</option>
                      </select>
                      <input className="input-ui" name="timings" value={editDrafts[vendor._id]?.timings || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Timings" />
                      <label className="flex items-center gap-2 rounded-lg border border-line bg-panelSoft px-3 py-2 text-sm text-slate-200">
                        <input type="checkbox" name="isOpenNow" checked={Boolean(editDrafts[vendor._id]?.isOpenNow)} onChange={(event) => onEditChange(vendor._id, event)} />
                        Stall is open now
                      </label>
                      <input className="input-ui" name="menuItemsCsv" value={editDrafts[vendor._id]?.menuItemsCsv || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Menu items (comma separated)" />
                      <input className="input-ui" name="imagesCsv" value={editDrafts[vendor._id]?.imagesCsv || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Images (comma separated)" />
                      <input className="input-ui" name="imageUrl" value={editDrafts[vendor._id]?.imageUrl || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Primary image URL" />
                      <input className="input-ui" name="whatsappNumber" value={editDrafts[vendor._id]?.whatsappNumber || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="WhatsApp number" />
                      <input className="input-ui" name="latitude" value={editDrafts[vendor._id]?.latitude || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Latitude" />
                      <input className="input-ui" name="longitude" value={editDrafts[vendor._id]?.longitude || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Longitude" />
                      <input className="input-ui" name="seoTitle" value={editDrafts[vendor._id]?.seoTitle || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="SEO title" />
                      <textarea className="input-ui" name="seoDescription" value={editDrafts[vendor._id]?.seoDescription || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="SEO description" rows="2" />
                      <textarea className="input-ui" name="description" value={editDrafts[vendor._id]?.description || ""} onChange={(event) => onEditChange(vendor._id, event)} placeholder="Description" rows="3" />
                      <select className="input-ui" name="language" value={editDrafts[vendor._id]?.language || "en"} onChange={(event) => onEditChange(vendor._id, event)}>
                        <option value="en">English</option>
                        <option value="hi">Hindi</option>
                      </select>
                      <button type="button" className="btn-primary sm:col-span-2" onClick={() => saveVendor(vendor._id)}>
                        Save changes
                      </button>
                    </div>
                  </div>
                ) : null}
              </article>
            ))}
          </div>
        ) : (
          <p className="text-sm text-slate-400">No stalls submitted yet. Use the Add Vendor page.</p>
        )}

        {user ? <p className="mt-4 text-xs text-slate-500">Signed in as {user.email}</p> : null}
      </section>
    </main>
  );
};

export default OwnerPortalPage;
