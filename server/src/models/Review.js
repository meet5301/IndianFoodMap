import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    vendorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Vendor",
      required: true,
      index: true
    },
    reviewerName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5
    },
    comment: {
      type: String,
      default: "",
      maxlength: 300
    }
  },
  {
    timestamps: true
  }
);

export const Review = mongoose.model("Review", reviewSchema);
