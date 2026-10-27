const express = require("express");
const mongoose = require("mongoose");
const Recipe = require("../models/Recipe");

const router = express.Router();
const categories = new Set(["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"]);

function badRequest(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validateRecipe(body) {
  const name = typeof body.name === "string" ? body.name.trim() : "";
  if (!name || name.length > 120) {
    throw badRequest("Recipe name must be between 1 and 120 characters.");
  }
  if (!categories.has(body.category)) {
    throw badRequest("Please choose a valid recipe category.");
  }
  const validateLines = (items, field) => {
    if (!Array.isArray(items) || items.length === 0) {
      throw badRequest("Add at least one " + field + ".");
    }
    if (items.length > 100 || items.some((item) => typeof item !== "string" || !item.trim() || item.trim().length > 1000)) {
      throw badRequest("Each " + field + " must be non-empty and at most 1000 characters.");
    }
    return items.map((item) => item.trim());
  };
  if (typeof body.cookingTime !== "number" || !Number.isInteger(body.cookingTime) ||
      body.cookingTime < 0 || body.cookingTime > 1440) {
    throw badRequest("Cooking time must be a whole number between 0 and 1440 minutes.");
  }
  return {
    name,
    category: body.category,
    ingredients: validateLines(body.ingredients, "ingredient"),
    preparationSteps: validateLines(body.preparationSteps, "preparation step"),
    cookingTime: body.cookingTime
  };
}

function checkId(req, res, next) {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(400).json({ message: "Invalid recipe ID." });
  }
  next();
}

function asyncRoute(handler) {
  return (req, res, next) => Promise.resolve().then(() => handler(req, res)).catch(next);
}

router.get("/", asyncRoute(async (_req, res) => {
  const recipes = await Recipe.find().sort({ createdAt: -1 });
  res.json(recipes);
}));

router.get("/:id", checkId, asyncRoute(async (req, res) => {
  const recipe = await Recipe.findById(req.params.id);
  if (!recipe) return res.status(404).json({ message: "Recipe not found." });
  return res.json(recipe);
}));

router.post("/", asyncRoute(async (req, res) => {
  const recipe = await Recipe.create(validateRecipe(req.body || {}));
  res.status(201).json({ message: "Recipe added successfully.", recipe });
}));

router.put("/:id", checkId, asyncRoute(async (req, res) => {
  const recipe = await Recipe.findByIdAndUpdate(req.params.id, validateRecipe(req.body || {}), {
    new: true,
    runValidators: true
  });
  if (!recipe) return res.status(404).json({ message: "Recipe not found." });
  return res.json({ message: "Recipe updated successfully.", recipe });
}));

router.delete("/:id", checkId, asyncRoute(async (req, res) => {
  const deleted = await Recipe.findByIdAndDelete(req.params.id);
  if (!deleted) return res.status(404).json({ message: "Recipe not found." });
  return res.json({ message: "Recipe deleted successfully." });
}));

module.exports = router;
