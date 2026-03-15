const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  name: String,
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
}, { timestamps: true });

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: { type: String, required: true },
  description: { type: String, required: true },
  price: { type: Number, required: true },
  rentPrice: { type: Number },
  category: { type: String, required: true, enum: ["Men", "Women", "Boys", "Girls", "Accessories", "Footwear"] },
  subcategory: String,
  images: [String],
  sizes: [{ size: String, stock: { type: Number, default: 0 } }],
  colors: [String],
  tags: [String],
  discount: { type: Number, default: 0 },
  isRentable: { type: Boolean, default: false },
  isFeatured: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  reviews: [reviewSchema],
  rating: { type: Number, default: 0 },
  numReviews: { type: Number, default: 0 },
  totalSold: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Product", productSchema);
