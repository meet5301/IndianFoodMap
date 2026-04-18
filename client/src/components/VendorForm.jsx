import { useState } from "react";

const initialState = {
  name: "",
  city: "",
  area: "",
  category: "",
  priceRange: "low",
  timings: "",
  description: "",
  imageUrl: "",
  submittedBy: "community"
};

const VendorForm = ({ onSubmit, submitting }) => {
  const [formData, setFormData] = useState(initialState);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    await onSubmit(formData);
    setFormData(initialState);
  };

  return (
    <section className="card form-card">
      <h2>Add New Vendor</h2>
      <p>Add your stall details and make it discoverable instantly.</p>

      <form className="vendor-form" onSubmit={handleSubmit}>
        <input name="name" value={formData.name} onChange={handleChange} placeholder="Stall name" required />
        <input name="city" value={formData.city} onChange={handleChange} placeholder="City" required />
        <input name="area" value={formData.area} onChange={handleChange} placeholder="Area / locality" required />
        <input name="category" value={formData.category} onChange={handleChange} placeholder="Category (chaat, vada pav...)" required />
        <select name="priceRange" value={formData.priceRange} onChange={handleChange}>
          <option value="low">Low budget</option>
          <option value="mid">Mid budget</option>
          <option value="high">Premium</option>
        </select>
        <input name="timings" value={formData.timings} onChange={handleChange} placeholder="Timings (eg: 6pm - 1am)" />
        <input name="imageUrl" value={formData.imageUrl} onChange={handleChange} placeholder="Image URL (optional)" />
        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Short description" rows="3" />
        <button type="submit" disabled={submitting}>{submitting ? "Submitting..." : "Add Vendor"}</button>
      </form>
    </section>
  );
};

export default VendorForm;
