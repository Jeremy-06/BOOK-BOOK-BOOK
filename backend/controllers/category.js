const db = require("../models");
const { Op } = require("sequelize");

const Category = db.Category;

// List categories
exports.getAllCategories = async (req, res) => {
  try {
    const draw = req.query.draw || 0;
    const start = parseInt(req.query.start) || 0;
    const length = parseInt(req.query.length) || 10;
    const searchValue =
      (req.query.search && req.query.search.value) ||
      req.query["search[value]"] ||
      "";
    const orderColumnRaw =
      req.query["order[0][column]"] ||
      (req.query.order && req.query.order[0] ? req.query.order[0].column : "0");
    const sortColumnIndex = parseInt(orderColumnRaw, 10);

    const orderDirRaw =
      req.query["order[0][dir]"] ||
      (req.query.order && req.query.order[0] ? req.query.order[0].dir : "DESC");
    const sortDirection = orderDirRaw.toUpperCase();
    const categoryColumns = ["id", "name", "description", "id"];
    const sortColumn = categoryColumns[sortColumnIndex] || "id";

    const whereClause = searchValue
      ? {
          [Op.or]: [
            { name: { [Op.like]: `%${searchValue}%` } },
            { description: { [Op.like]: `%${searchValue}%` } },
          ],
        }
      : {};

    const totalCount = await Category.count();

    const { count: searchCount, rows } = await Category.findAndCountAll({
      where: whereClause,
      offset: start,
      limit: length,
      order: [[sortColumn, sortDirection]],
    });

    return res.status(200).json({
      draw: parseInt(draw),
      recordsTotal: totalCount,
      recordsFiltered: searchCount,
      data: rows,
    });
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
