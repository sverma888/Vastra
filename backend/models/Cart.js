const mongoose = require("mongoose");

const cartItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  quantity: { type: Number, required: true, default: 1 },
  size: String, color: String,
  orderType: { type: String, enum: ["buy", "rent"], default: "buy" },
  rentDays: { type: Number, default: 1 },
});

const cartSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
  items: [cartItemSchema],
  coupon: String,
  discount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model("Cart", cartSchema);
