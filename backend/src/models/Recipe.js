const mongoose = require("mongoose");

const recipeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Recipe name is required."],
      trim: true,
      maxlength: [120, "Recipe name must be at most 120 characters."]
    },
    category: {
      type: String,
      required: true,
      enum: ["Breakfast", "Lunch", "Dinner", "Snack", "Dessert"]
    },
    ingredients: {
      type: [String],
      required: true,
      validate: {
        validator: (items) => items.length > 0 && items.every((item) => item.trim().length > 0),
        message: "Add at least one ingredient."
      }
    },
    preparationSteps: {
      type: [String],
      required: true,
      validate: {
        validator: (steps) => steps.length > 0 && steps.every((step) => step.trim().length > 0),
        message: "Add at least one preparation step."
      }
    },
    isFavorite: { type: Boolean, default: false },
    cookingTime: {
      type: Number,
      required: [true, "Cooking time is required."],
      min: [0, "Cooking time cannot be negative."],
      max: [1440, "Cooking time cannot exceed 1440 minutes."]
    }
  },
  { timestamps: true, versionKey: false }
);

module.exports = mongoose.model("Recipe", recipeSchema);
