import { useEffect, useMemo, useState } from "react";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";
import Seo from "../components/Seo";

const USER_PAGE_SIZE = 6;
const VENDOR_PAGE_SIZE = 6;

const parseCsv = (value) =>
  String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

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

const toSearchText = (...values) => values.filter(Boolean).join(" ").toLowerCase();

const AdminPage = () => {
  const { user } = useAuth();
  const [overview, setOverview] = useState({ usersCount: 0, vendorsCount: 0 });
  const [users, setUsers] = useState([]);
  const [vendors, setVendors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState("all");
  const [userPage, setUserPage] = useState(1);
  const [vendorSearch, setVendorSearch] = useState("");
  const [vendorCategoryFilter, setVendorCategoryFilter] = useState("all");
  const [vendorOpenFilter, setVendorOpenFilter] = useState("all");
  const [vendorPage, setVendorPage] = useState(1);
  const [confirmDialog, setConfirmDialog] = useState({
    isOpen: false,
    type: "",
    id: "",
    label: ""
  });

  const [userDrafts, setUserDrafts] = useState({});
  const [vendorDrafts, setVendorDrafts] = useState({});
  const [selectedImageFiles, setSelectedImageFiles] = useState([]);

  const [newVendor, setNewVendor] = useState({
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
  });

  const loadData = async () => {
    setLoading(true);
    setStatus("");
    try {
      const [overviewPayload, usersPayload, vendorsPayload] = await Promise.all([
        api.getAdminOverview(),
        api.getAdminUsers(),
        api.getAdminVendors()
      ]);

      setOverview(overviewPayload || { usersCount: 0, vendorsCount: 0 });
      setUsers(usersPayload.users || []);
      setVendors(vendorsPayload.vendors || []);

      const nextUserDrafts = {};
      (usersPayload.users || []).forEach((entry) => {
        nextUserDrafts[entry._id || entry.id] = {
          name: entry.name || "",
          email: entry.email || "",
          role: entry.role || "user",
          isVerified: Boolean(entry.isVerified),
          password: ""
        };
      });
      setUserDrafts(nextUserDrafts);

      const nextVendorDrafts = {};
      (vendorsPayload.vendors || []).forEach((vendor) => {
        nextVendorDrafts[vendor._id] = {
          name: vendor.name || "",
          city: vendor.city || "Ahmedabad",
          area: vendor.area || "",
          category: vendor.category || "",
          timings: vendor.timings || "",
          openingTime: vendor.openingTime || "",
          closingTime: vendor.closingTime || "",
          menuItemsCsv: Array.isArray(vendor.menuItems) ? vendor.menuItems.join(", ") : "",
          whatsappNumber: vendor.whatsappNumber || "",
          latitude: vendor.location?.coordinates?.[1] ? String(vendor.location.coordinates[1]) : "",
          longitude: vendor.location?.coordinates?.[0] ? String(vendor.location.coordinates[0]) : "",
          isOpenNow: Boolean(vendor.isOpenNow)
        };
      });
      setVendorDrafts(nextVendorDrafts);
    } catch (error) {
      setStatus(error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const activeAdmins = useMemo(() => users.filter((entry) => entry.role === "admin").length, [users]);

  const userQuery = userSearch.trim().toLowerCase();
  const vendorQuery = vendorSearch.trim().toLowerCase();

  const filteredUsers = useMemo(() => {
    return users.filter((entry) => {
      const matchesSearch =
        !userQuery ||
        toSearchText(entry.name, entry.email, entry.role).includes(userQuery);
      const matchesRole = userRoleFilter === "all" || entry.role === userRoleFilter;
      return matchesSearch && matchesRole;
    });
  }, [users, userQuery, userRoleFilter]);

  const userTotalPages = Math.max(1, Math.ceil(filteredUsers.length / USER_PAGE_SIZE));

  const paginatedUsers = useMemo(() => {
    const start = (userPage - 1) * USER_PAGE_SIZE;
    return filteredUsers.slice(start, start + USER_PAGE_SIZE);
  }, [filteredUsers, userPage]);

  const vendorCategories = useMemo(() => {
    return Array.from(new Set(vendors.map((vendor) => vendor.category).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b)
    );
  }, [vendors]);

  const filteredVendors = useMemo(() => {
    return vendors.filter((vendor) => {
      const matchesSearch =
        !vendorQuery ||
        toSearchText(vendor.name, vendor.city, vendor.area, vendor.category, vendor.whatsappNumber).includes(vendorQuery);
      const matchesCategory = vendorCategoryFilter === "all" || vendor.category === vendorCategoryFilter;
      const matchesOpen =
        vendorOpenFilter === "all" ||
        (vendorOpenFilter === "open" && Boolean(vendor.isOpenNow)) ||
        (vendorOpenFilter === "closed" && !vendor.isOpenNow);
      return matchesSearch && matchesCategory && matchesOpen;
    });
  }, [vendors, vendorQuery, vendorCategoryFilter, vendorOpenFilter]);

  const vendorTotalPages = Math.max(1, Math.ceil(filteredVendors.length / VENDOR_PAGE_SIZE));

  const paginatedVendors = useMemo(() => {
    const start = (vendorPage - 1) * VENDOR_PAGE_SIZE;
    return filteredVendors.slice(start, start + VENDOR_PAGE_SIZE);
  }, [filteredVendors, vendorPage]);

  useEffect(() => {
    setUserPage(1);
  }, [userSearch, userRoleFilter]);

  useEffect(() => {
    setVendorPage(1);
  }, [vendorSearch, vendorCategoryFilter, vendorOpenFilter]);

  useEffect(() => {
    if (userPage > userTotalPages) {
      setUserPage(userTotalPages);
    }
  }, [userPage, userTotalPages]);

  useEffect(() => {
    if (vendorPage > vendorTotalPages) {
      setVendorPage(vendorTotalPages);
    }
  }, [vendorPage, vendorTotalPages]);

  const onUserDraftChange = (userId, event) => {
    const { name, type, value, checked } = event.target;
    setUserDrafts((prev) => ({
      ...prev,
      [userId]: {
        ...(prev[userId] || {}),
        [name]: type === "checkbox" ? checked : value
      }
    }));
  };

  const onVendorDraftChange = (vendorId, event) => {
    const { name, type, value, checked } = event.target;
    setVendorDrafts((prev) => ({
      ...prev,
      [vendorId]: {
        ...(prev[vendorId] || {}),
        [name]: type === "checkbox" ? checked : value
      }
    }));
  };

  const saveUser = async (userId) => {
    try {
      const draft = userDrafts[userId] || {};
      await api.updateAdminUser(userId, {
        name: draft.name,
        email: draft.email,
        role: draft.role,
        isVerified: Boolean(draft.isVerified),
        password: draft.password || undefined
      });
      setStatus("User updated");
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteUser = async (userId) => {
    try {
      await api.deleteAdminUser(userId);
      setStatus("User deleted");
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const saveVendor = async (vendorId) => {
    try {
      const draft = vendorDrafts[vendorId] || {};
      await api.updateAdminVendor(vendorId, {
        name: draft.name,
        city: draft.city,
        area: draft.area,
        category: draft.category,
        timings: draft.timings,
        openingTime: draft.openingTime,
        closingTime: draft.closingTime,
        menuItems: parseCsv(draft.menuItemsCsv),
        whatsappNumber: draft.whatsappNumber,
        latitude: draft.latitude,
        longitude: draft.longitude,
        isOpenNow: Boolean(draft.isOpenNow)
      });
      setStatus("Vendor updated");
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const deleteVendor = async (vendorId) => {
    try {
      await api.deleteAdminVendor(vendorId);
      setStatus("Vendor deleted");
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const createVendor = async (event) => {
    event.preventDefault();
    try {
      const uploadedImages = await readFilesAsDataUrls(selectedImageFiles);
      const additionalImages = parseCsv(newVendor.imagesCsv);
      const openingTime = newVendor.openingTime.trim();
      const closingTime = newVendor.closingTime.trim();

      await api.createAdminVendor({
        ...newVendor,
        menuItems: parseCsv(newVendor.menuItemsCsv),
        timings: newVendor.timings || (openingTime && closingTime ? `${openingTime} - ${closingTime}` : ""),
        openingTime,
        closingTime,
        imageUrl: newVendor.imageUrl.trim() || uploadedImages[0] || "",
        images: [...additionalImages, ...uploadedImages]
      });
      setStatus("Vendor created from admin panel");
      setNewVendor({
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
      });
      setSelectedImageFiles([]);
      await loadData();
    } catch (error) {
      setStatus(error.message);
    }
  };

  const openDeleteUserConfirm = (userId, label) => {
    setConfirmDialog({ isOpen: true, type: "user", id: userId, label });
  };

  const openDeleteVendorConfirm = (vendorId, label) => {
    setConfirmDialog({ isOpen: true, type: "vendor", id: vendorId, label });
  };

  const closeConfirmDialog = () => {
    setConfirmDialog({ isOpen: false, type: "", id: "", label: "" });
  };

  const onConfirmDelete = async () => {
    try {
      if (confirmDialog.type === "user") {
        await deleteUser(confirmDialog.id);
      }
      if (confirmDialog.type === "vendor") {
        await deleteVendor(confirmDialog.id);
      }
    } finally {
      closeConfirmDialog();
    }
  };

  return (
    <main className="page-wrap space-y-4 pb-8">
      <Seo
        title="Admin Panel | IndiaFoodMap"
        description="Admin controls for users and vendor data in IndiaFoodMap."
        path="/admin"
        noindex
      />

      <section className="glass-card p-5">
        <h1 className="font-display text-3xl font-bold">Admin Control Panel</h1>
        <p className="mt-2 text-sm text-slate-300">Manage users and vendors from one place using admin role access.</p>
        <p className="mt-1 text-xs text-slate-500">Signed in as {user?.email || "admin"}</p>

        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total users</p>
            <p className="mt-1 font-display text-2xl font-bold">{overview.usersCount || 0}</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Total vendors</p>
            <p className="mt-1 font-display text-2xl font-bold">{overview.vendorsCount || 0}</p>
          </article>
          <article className="metric-box">
            <p className="text-xs uppercase tracking-[0.15em] text-slate-400">Admins</p>
            <p className="mt-1 font-display text-2xl font-bold">{activeAdmins}</p>
          </article>
        </div>

        <div className="mt-4">
          <button type="button" className="btn-ghost" onClick={loadData} disabled={loading}>
            {loading ? "Refreshing..." : "Refresh admin data"}
          </button>
        </div>
        {status ? <p className="mt-3 text-sm text-amber-200">{status}</p> : null}
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title">Add Vendor As Admin</h2>
        <p className="mb-4 text-sm text-slate-300">
          Same vendor creation flow as the normal Add Vendor page, so the admin panel and public submission stay consistent.
        </p>
        <form onSubmit={createVendor} className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Food stall name</label>
            <input className="input-ui" placeholder="Enter food stall name" value={newVendor.name} onChange={(event) => setNewVendor((prev) => ({ ...prev, name: event.target.value }))} required />
          </div>
          <input className="input-ui" value="Ahmedabad" disabled />
          <input className="input-ui" placeholder="Area / locality" value={newVendor.area} onChange={(event) => setNewVendor((prev) => ({ ...prev, area: event.target.value }))} required />
          <input className="input-ui" placeholder="Category e.g. Snacks, Chaat, South Indian" value={newVendor.category} onChange={(event) => setNewVendor((prev) => ({ ...prev, category: event.target.value }))} required />
          <input className="input-ui" placeholder="Contact number (919...)" value={newVendor.whatsappNumber} onChange={(event) => setNewVendor((prev) => ({ ...prev, whatsappNumber: event.target.value }))} />
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Opening time</label>
            <input className="input-ui" type="time" value={newVendor.openingTime} onChange={(event) => setNewVendor((prev) => ({ ...prev, openingTime: event.target.value }))} />
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Closing time</label>
            <input className="input-ui" type="time" value={newVendor.closingTime} onChange={(event) => setNewVendor((prev) => ({ ...prev, closingTime: event.target.value }))} />
          </div>
          <input className="input-ui sm:col-span-2" placeholder="Timings note (optional) e.g. 5 PM - 1 AM" value={newVendor.timings} onChange={(event) => setNewVendor((prev) => ({ ...prev, timings: event.target.value }))} />
          <div className="sm:col-span-2 grid gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Primary image URL</label>
              <input className="input-ui" placeholder="Paste image URL here" value={newVendor.imageUrl} onChange={(event) => setNewVendor((prev) => ({ ...prev, imageUrl: event.target.value }))} />
            </div>
            <div>
              <label className="mb-1 block text-xs uppercase tracking-[0.2em] text-slate-400">Upload images</label>
              <input className="input-ui py-2" type="file" accept="image/*" multiple onChange={(event) => setSelectedImageFiles(Array.from(event.target.files || []))} />
            </div>
          </div>
          <input className="input-ui sm:col-span-2" placeholder="More image URLs (comma separated)" value={newVendor.imagesCsv} onChange={(event) => setNewVendor((prev) => ({ ...prev, imagesCsv: event.target.value }))} />
          <input className="input-ui sm:col-span-2" placeholder="Food items you sell (comma separated)" value={newVendor.menuItemsCsv} onChange={(event) => setNewVendor((prev) => ({ ...prev, menuItemsCsv: event.target.value }))} required />
          <input className="input-ui" placeholder="Latitude (optional)" value={newVendor.latitude} onChange={(event) => setNewVendor((prev) => ({ ...prev, latitude: event.target.value }))} />
          <input className="input-ui" placeholder="Longitude (optional)" value={newVendor.longitude} onChange={(event) => setNewVendor((prev) => ({ ...prev, longitude: event.target.value }))} />
          <input className="input-ui sm:col-span-2" placeholder="SEO title" value={newVendor.seoTitle} onChange={(event) => setNewVendor((prev) => ({ ...prev, seoTitle: event.target.value }))} />
          <textarea className="input-ui sm:col-span-2" rows="3" placeholder="SEO description" value={newVendor.seoDescription} onChange={(event) => setNewVendor((prev) => ({ ...prev, seoDescription: event.target.value }))} />
          <textarea className="input-ui sm:col-span-2" rows="4" placeholder="Vendor description" value={newVendor.description} onChange={(event) => setNewVendor((prev) => ({ ...prev, description: event.target.value }))} />
          <div className="sm:col-span-2">
            <button type="submit" className="btn-primary w-full sm:w-auto">Create vendor</button>
          </div>
        </form>
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title">Manage Users</h2>
        <div className="mb-3 grid gap-2 md:grid-cols-2">
          <input
            className="input-ui"
            placeholder="Search users by name, email, role"
            value={userSearch}
            onChange={(event) => setUserSearch(event.target.value)}
          />
          <select className="input-ui" value={userRoleFilter} onChange={(event) => setUserRoleFilter(event.target.value)}>
            <option value="all">All roles</option>
            <option value="admin">Admin only</option>
            <option value="user">User only</option>
          </select>
        </div>
        <div className="space-y-3">
          {paginatedUsers.map((entry) => {
            const userId = entry._id || entry.id;
            const draft = userDrafts[userId] || {};
            return (
              <article key={userId} className="rounded-xl border border-line bg-panelSoft p-3">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <input className="input-ui" name="name" value={draft.name || ""} onChange={(event) => onUserDraftChange(userId, event)} />
                  <input className="input-ui" name="email" value={draft.email || ""} onChange={(event) => onUserDraftChange(userId, event)} />
                  <select className="input-ui" name="role" value={draft.role || "user"} onChange={(event) => onUserDraftChange(userId, event)}>
                    <option value="user">user</option>
                    <option value="admin">admin</option>
                  </select>
                  <input className="input-ui" name="password" placeholder="New password (optional)" value={draft.password || ""} onChange={(event) => onUserDraftChange(userId, event)} />
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" name="isVerified" checked={Boolean(draft.isVerified)} onChange={(event) => onUserDraftChange(userId, event)} />
                  Verified account
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => saveUser(userId)}>Save user</button>
                  <button type="button" className="btn-ghost" onClick={() => openDeleteUserConfirm(userId, draft.email || draft.name || "this user")}>Delete user</button>
                </div>
              </article>
            );
          })}
          {paginatedUsers.length === 0 ? <p className="text-sm text-slate-400">No users match this filter.</p> : null}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Showing {paginatedUsers.length} of {filteredUsers.length} users
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              disabled={userPage <= 1}
              onClick={() => setUserPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span>Page {userPage} / {userTotalPages}</span>
            <button
              type="button"
              className="btn-ghost"
              disabled={userPage >= userTotalPages}
              onClick={() => setUserPage((prev) => Math.min(userTotalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      <section className="glass-card p-5">
        <h2 className="section-title">Manage Vendors</h2>
        <div className="mb-3 grid gap-2 md:grid-cols-3">
          <input
            className="input-ui"
            placeholder="Search vendors by name, area, city, category"
            value={vendorSearch}
            onChange={(event) => setVendorSearch(event.target.value)}
          />
          <select className="input-ui" value={vendorCategoryFilter} onChange={(event) => setVendorCategoryFilter(event.target.value)}>
            <option value="all">All categories</option>
            {vendorCategories.map((category) => (
              <option key={category} value={category}>{category}</option>
            ))}
          </select>
          <select className="input-ui" value={vendorOpenFilter} onChange={(event) => setVendorOpenFilter(event.target.value)}>
            <option value="all">All status</option>
            <option value="open">Open now</option>
            <option value="closed">Closed now</option>
          </select>
        </div>
        <div className="space-y-3">
          {paginatedVendors.map((vendor) => {
            const draft = vendorDrafts[vendor._id] || {};
            return (
              <article key={vendor._id} className="rounded-xl border border-line bg-panelSoft p-3">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                  <input className="input-ui" name="name" value={draft.name || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="city" value={draft.city || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="area" value={draft.area || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="category" value={draft.category || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" type="time" name="openingTime" value={draft.openingTime || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" type="time" name="closingTime" value={draft.closingTime || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="timings" value={draft.timings || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="whatsappNumber" value={draft.whatsappNumber || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui xl:col-span-2" name="menuItemsCsv" value={draft.menuItemsCsv || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="latitude" value={draft.latitude || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  <input className="input-ui" name="longitude" value={draft.longitude || ""} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                </div>
                <label className="mt-2 inline-flex items-center gap-2 text-xs text-slate-300">
                  <input type="checkbox" name="isOpenNow" checked={Boolean(draft.isOpenNow)} onChange={(event) => onVendorDraftChange(vendor._id, event)} />
                  Open now
                </label>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" className="btn-primary" onClick={() => saveVendor(vendor._id)}>Save vendor</button>
                  <button type="button" className="btn-ghost" onClick={() => openDeleteVendorConfirm(vendor._id, draft.name || "this vendor")}>Delete vendor</button>
                </div>
              </article>
            );
          })}
          {paginatedVendors.length === 0 ? <p className="text-sm text-slate-400">No vendors match this filter.</p> : null}
        </div>
        <div className="mt-4 flex items-center justify-between gap-2 text-xs text-slate-400">
          <p>
            Showing {paginatedVendors.length} of {filteredVendors.length} vendors
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn-ghost"
              disabled={vendorPage <= 1}
              onClick={() => setVendorPage((prev) => Math.max(1, prev - 1))}
            >
              Prev
            </button>
            <span>Page {vendorPage} / {vendorTotalPages}</span>
            <button
              type="button"
              className="btn-ghost"
              disabled={vendorPage >= vendorTotalPages}
              onClick={() => setVendorPage((prev) => Math.min(vendorTotalPages, prev + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </section>

      {confirmDialog.isOpen ? (
        <section className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4">
          <article className="glass-card w-full max-w-md p-5">
            <h3 className="font-display text-xl font-bold">Confirm Delete</h3>
            <p className="mt-2 text-sm text-slate-300">
              Are you sure you want to delete {confirmDialog.label}? This action cannot be undone.
            </p>
            <div className="mt-4 flex flex-wrap justify-end gap-2">
              <button type="button" className="btn-ghost" onClick={closeConfirmDialog}>Cancel</button>
              <button type="button" className="btn-primary" onClick={onConfirmDelete}>Yes, delete</button>
            </div>
          </article>
        </section>
      ) : null}
    </main>
  );
};

export default AdminPage;
