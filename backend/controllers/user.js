const db = require("../models");
const User = db.User;
const Customer = db.Customer;
const { Op } = require("sequelize");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Build name
const getFullName = (user) =>
  `${user.first_name || ""} ${user.last_name || ""}`.trim();

// Parse number
const parsePositiveInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
};

// Parse offset
const parseNonNegativeInt = (value, fallback) => {
  const parsed = parseInt(value, 10);
  return Number.isInteger(parsed) && parsed >= 0 ? parsed : fallback;
};

// Sort order
const getSortOrder = (value) =>
  String(value || "DESC").toUpperCase() === "ASC" ? "ASC" : "DESC";

// Sort users
const getUserSortColumn = (value) => {
  const sortColumns = {
    id: "id",
    first_name: "first_name",
    last_name: "last_name",
    email: "email",
    role: "role",
    deleted_at: "deleted_at",
    created_at: "created_at",
    updated_at: "updated_at",
  };

  return sortColumns[value] || sortColumns.id;
};

// Register user
const registerUser = async (req, res) => {
  try {
    const { first_name, last_name, password, email } = req.body;

    if (!first_name || !last_name || !password || !email) {
      return res
        .status(400)
        .json({
          error: "First name, last name, email, and password are required",
        });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      first_name,
      last_name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: getFullName(user),
        email: user.email,
      },
    });
  } catch (error) {
    console.log(error);
    if (error.name === "SequelizeUniqueConstraintError") {
      return res.status(409).json({ error: "Email already exists" });
    }
    return res
      .status(500)
      .json({ error: "Error registering user", details: error.message });
  }
};

// Login user
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const user = await User.findOne({
      where: { email, deleted_at: null },
    });

    if (!user) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res
        .status(401)
        .json({ success: false, message: "Invalid email or password" });
    }

    // Sign token
    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret_key",
    );

    await user.update({ token: token });

    return res.status(200).json({
      success: true,
      message: "Welcome back",
      user: {
        id: user.id,
        first_name: user.first_name,
        last_name: user.last_name,
        full_name: getFullName(user),
        email: user.email,
        role: user.role,
      },
      token,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error logging in", details: error.message });
  }
};

// Update user
const updateUser = async (req, res) => {
  try {
    const { fname, lname, addressline, zipcode, phone, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      first_name: fname || user.first_name,
      last_name: lname || user.last_name,
    });

    const [customer, created] = await Customer.findOrCreate({
      where: { user_id: userId },
      defaults: {
        phone,
        address: addressline,
        zip_code: zipcode,
        user_id: userId,
      },
    });

    if (!created) {
      await customer.update({
        phone: phone || customer.phone,
        address: addressline || customer.address,
        zip_code: zipcode || customer.zip_code,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      customer,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error updating profile", details: error.message });
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] },
      include: [{ model: Customer }],
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error fetching profile", details: error.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const { first_name, last_name, phone, zip_code, address } = req.body;

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    await user.update({
      first_name,
      last_name,
    });

    const [customer, created] = await Customer.findOrCreate({
      where: { user_id: req.user.id },
      defaults: {
        user_id: req.user.id,
        phone,
        address,
        zip_code,
      },
    });

    if (!created) {
      await customer.update({
        phone,
        address,
        zip_code,
      });
    }

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] },
      include: [{ model: Customer }],
    });

    return res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error updating profile", details: error.message });
  }
};

// Upload avatar
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file uploaded" });
    }

    const user = await User.findByPk(req.user.id);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const avatarPath = req.file.path.replace(/\\/g, "/");

    await user.update({ avatar: avatarPath });

    const updatedUser = await User.findByPk(req.user.id, {
      attributes: { exclude: ["password", "token"] },
      include: [{ model: Customer }],
    });

    return res.status(200).json({
      success: true,
      message: "Profile picture updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error uploading profile picture", details: error.message });
  }
};

// Deactivate user
const deactivateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const timestamp = new Date();
    await user.update({ deleted_at: timestamp });

    return res.status(200).json({
      success: true,
      message: "User deactivated successfully",
      email,
      deleted_at: timestamp,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error deactivating user", details: error.message });
  }
};

// Reactivate user
const reactivateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({ deleted_at: null });

    return res.status(200).json({
      success: true,
      message: "User reactivated successfully",
      email,
      deleted_at: null,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error reactivating user", details: error.message });
  }
};

// Get user profile
const getUserProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findByPk(id, {
      attributes: { exclude: ["password"] },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    const customer = await Customer.findOne({
      where: { user_id: id },
    });

    return res.status(200).json({
      success: true,
      result: { ...user.toJSON(), Customer: customer },
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ error: "Error fetching profile", details: error.message });
  }
};

// List users (DataTables)
const getAllUsers = async (req, res) => {
  try {
    const draw = parsePositiveInt(req.query.draw, 1);
    const start = parseNonNegativeInt(req.query.start, 0);
    const length = parsePositiveInt(req.query.length, 25);

    // Extract search value
    const searchValue =
      (req.query.search && req.query.search.value) ||
      req.query["search[value]"] ||
      "";

    // Column order map
    const orderColumns = ["id", "first_name", "email", "role", "deleted_at"];
    const orderColumnIndex = parseNonNegativeInt(
      req.query.order?.[0]?.column,
      0,
    );
    const sortBy = getUserSortColumn(
      orderColumns[orderColumnIndex] || "id",
    );
    const sortOrder = getSortOrder(req.query.order?.[0]?.dir);

    // Build where clause
    let whereClause = {};
    if (searchValue) {
      whereClause = {
        [Op.or]: [
          { first_name: { [Op.like]: `%${searchValue}%` } },
          { last_name: { [Op.like]: `%${searchValue}%` } },
          { email: { [Op.like]: `%${searchValue}%` } },
        ],
      };
    }

    const queryOptions = {
      attributes: { exclude: ["password"] },
      where: whereClause,
      order: [[sortBy, sortOrder]],
      offset: start,
      limit: length,
    };

    const recordsTotal = await User.count();
    const result = await User.findAndCountAll(queryOptions);

    return res.status(200).json({
      draw,
      recordsTotal,
      recordsFiltered: result.count,
      data: result.rows,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Update role
const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    await User.update({ role }, { where: { id } });
    return res
      .status(200)
      .json({ success: true, message: "User role updated successfully" });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  registerUser,
  loginUser,
  updateUser,
  getProfile,
  updateProfile,
  uploadAvatar,
  deactivateUser,
  reactivateUser,
  getUserProfile,
  getAllUsers,
  updateUserRole,
};