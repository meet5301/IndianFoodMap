import { useState } from "react";

const VendorList = ({ vendors, onAddReview, reviewLoading }) => {
  const [drafts, setDrafts] = useState({});

  const handleDraftChange = (vendorId, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [vendorId]: {
        ...prev[vendorId],
        [field]: value
      }
    }));
  };

  const submitReview = async (vendorId) => {
    const draft = drafts[vendorId] || {};
    await onAddReview(vendorId, {
      reviewerName: draft.reviewerName,
      rating: Number(draft.rating),
      comment: draft.comment
    });

    setDrafts((prev) => ({
      ...prev,
      [vendorId]: {
        reviewerName: "",
        rating: 5,
        comment: ""
      }
    }));
  };

  if (!vendors.length) {
    return <div className="card empty">No vendors found. Add the first vendor to get started.</div>;
  }

  return (
    <section className="vendor-grid">
      {vendors.map((vendor) => {
        const draft = drafts[vendor._id] || { reviewerName: "", rating: 5, comment: "" };

        return (
          <article key={vendor._id} className="card vendor-card">
            <div className="vendor-header">
              <div>
                <h3>{vendor.name}</h3>
                <p>{vendor.area}, {vendor.city}</p>
              </div>
              <span className="chip">{vendor.category}</span>
            </div>

            <p className="vendor-meta">Price: {vendor.priceRange} | Rating: {vendor.ratingAverage || 0} ({vendor.ratingCount || 0})</p>
            {vendor.description ? <p className="vendor-description">{vendor.description}</p> : null}

            <div className="review-form">
              <input
                value={draft.reviewerName}
                onChange={(event) => handleDraftChange(vendor._id, "reviewerName", event.target.value)}
                placeholder="Your name"
              />
              <select
                value={draft.rating}
                onChange={(event) => handleDraftChange(vendor._id, "rating", event.target.value)}
              >
                <option value="5">5</option>
                <option value="4">4</option>
                <option value="3">3</option>
                <option value="2">2</option>
                <option value="1">1</option>
              </select>
              <input
                value={draft.comment}
                onChange={(event) => handleDraftChange(vendor._id, "comment", event.target.value)}
                placeholder="Comment"
              />
              <button type="button" onClick={() => submitReview(vendor._id)} disabled={reviewLoading === vendor._id}>
                {reviewLoading === vendor._id ? "Saving..." : "Add Review"}
              </button>
            </div>
          </article>
        );
      })}
    </section>
  );
};

export default VendorList;
