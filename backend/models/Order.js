const mongoose = require("mongoose");

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
  name: String, image: String, price: Number,
  size: String, color: String,
  quantity: { type: Number, default: 1 },
  orderType: { type: String, enum: ["buy", "rent"], default: "buy" },
  rentDays: Number,
});

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  items: [orderItemSchema],
  shippingAddress: {
    name: String, phone: String, street: String,
    city: String, state: String, pincode: String,
    country: { type: String, default: "India" }
  },
  paymentMethod: { type: String, default: "COD" },
  isPaid: { type: Boolean, default: false },
  paidAt: Date,
  itemsPrice: Number,
  shippingPrice: { type: Number, default: 0 },
  taxPrice: { type: Number, default: 0 },
  totalPrice: Number,
  status: {
    type: String,
    enum: ["Pending", "Confirmed", "Processing", "Shipped", "Delivered", "Cancelled", "Returned"],
    default: "Pending"
  },
  trackingNumber: String,
  deliveredAt: Date,
}, { timestamps: true });

module.exports = mongoose.model("Order", orderSchema);
