const mongoose = require("mongoose");

const shoppingItemSchema = new mongoose.Schema({
  text: { type: String, required: true, trim: true, maxlength: 1000 },
  key: { type: String, required: true, unique: true, index: true },
  checked: { type: Boolean, default: false }
}, { timestamps: true, versionKey: false });

module.exports = mongoose.models.ShoppingItem || mongoose.model("ShoppingItem", shoppingItemSchema);
