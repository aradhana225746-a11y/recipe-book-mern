const express = require("express");
const mongoose = require("mongoose");
const ShoppingItem = require("../models/ShoppingItem");

const router = express.Router();
const asyncRoute = (handler) => (req, res, next) => Promise.resolve()
  .then(() => handler(req, res))
  .catch(next);

router.get("/", asyncRoute(async (_req, res) => {
  const items = await ShoppingItem.find().sort({ createdAt: 1, _id: 1 });
  res.json(items);
}));

// Add multiple ingredients from one recipe; keep identical lines from duplicating.
router.post("/", asyncRoute(async (req, res) => {
  const ingredients = req.body?.ingredients;
  if (!Array.isArray(ingredients) || !ingredients.length || ingredients.length > 100 ||
      ingredients.some((value) => typeof value !== "string" || !value.trim() || value.trim().length > 1000)) {
    return res.status(400).json({ message: "Provide 1–100 non-empty ingredients." });
  }
  const unique = new Map();
  for (const raw of ingredients) {
    const text = raw.trim().replace(/\s+/g, " ");
    const key = text.toLocaleLowerCase("en-US");
    if (!unique.has(key)) unique.set(key, text);
  }
  await ShoppingItem.bulkWrite([...unique.entries()].map(([key, text]) => ({
    updateOne: {
      filter: { key },
      update: { $setOnInsert: { key, text, checked: false } },
      upsert: true
    }
  })), { ordered: false });
  const items = await ShoppingItem.find().sort({ createdAt: 1, _id: 1 });
  return res.status(201).json({ message: "Shopping list updated.", items });
}));

router.patch("/:id", asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid item ID." });
  }
  if (typeof req.body?.checked !== "boolean") {
    return res.status(400).json({ message: "checked must be true or false." });
  }
  const item = await ShoppingItem.findByIdAndUpdate(
    req.params.id, { checked: req.body.checked },
    { new: true, runValidators: true }
  );
  if (!item) return res.status(404).json({ message: "Shopping item not found." });
  return res.json(item);
}));

router.delete("/checked", asyncRoute(async (_req, res) => {
  const result = await ShoppingItem.deleteMany({ checked: true });
  res.json({ message: "Checked ingredients cleared.", deletedCount: result.deletedCount });
}));

router.delete("/:id", asyncRoute(async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid item ID." });
  }
  const item = await ShoppingItem.findByIdAndDelete(req.params.id);
  if (!item) return res.status(404).json({ message: "Shopping item not found." });
  return res.json({ message: "Ingredient removed." });
}));

module.exports = router;
