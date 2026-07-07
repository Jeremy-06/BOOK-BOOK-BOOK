const db = require("../models");

const Category = db.Category;

// List categories
exports.getAllCategories = async (req, res) => {
  try {
    const categories = await Category.findAll({
      order: [["name", "ASC"]],
    });

    return res.status(200).json({ rows: categories });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching categories" });
  }
};

// Fetch category
exports.getSingleCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    return res.status(200).json({ success: true, result: category });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error fetching category" });
  }
};

// Create category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    const category = await Category.create({
      name: String(name).trim(),
      description: description || null,
    });

    return res.status(201).json({ success: true, result: category });
  } catch (error) {
    console.log(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Category name already exists" });
    }

    return res.status(500).json({ error: "Error creating category" });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: "Category name is required" });
    }

    await category.update({
      name: String(name).trim(),
      description: description || null,
    });

    return res.status(200).json({ success: true, result: category });
  } catch (error) {
    console.log(error);

    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Category name already exists" });
    }

    return res.status(500).json({ error: "Error updating category" });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const category = await Category.findByPk(req.params.id);

    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }

    await category.destroy();

    return res.status(200).json({ success: true, message: "Category deleted" });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ error: "Error deleting category" });
  }
};
