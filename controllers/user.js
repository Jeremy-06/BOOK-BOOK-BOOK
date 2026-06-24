const db = require("../models");
const User = db.User;
const Customer = db.Customer;
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

const registerUser = async (req, res) => {
  try {
    const { name, password, email } = req.body;

    if (!name || !password || !email) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
    });

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      user: {
        id: user.id,
        name: user.name,
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

    const token = jwt.sign(
      { id: user.id },
      process.env.JWT_SECRET || "secret_key",
    );

    return res.status(200).json({
      success: true,
      message: "Welcome back",
      user: {
        id: user.id,
        name: user.name,
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

const updateUser = async (req, res) => {
  try {
    const { fname, lname, addressline, zipcode, phone, userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: "User ID is required" });
    }

    let imagePath = null;
    if (req.file) {
      imagePath = req.file.path.replace(/\\/g, "/");
    }

    const [customer, created] = await Customer.findOrCreate({
      where: { user_id: userId },
      defaults: {
        fname,
        lname,
        addressline,
        zipcode,
        phone,
        image_path: imagePath,
        user_id: userId,
      },
    });

    if (!created) {
      await customer.update({
        fname: fname || customer.fname,
        lname: lname || customer.lname,
        addressline: addressline || customer.addressline,
        zipcode: zipcode || customer.zipcode,
        phone: phone || customer.phone,
        image_path: imagePath || customer.image_path,
      });
    }

    return res
      .status(200)
      .json({
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

const deactivateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    const timestamp = new Date();
    await user.update({ deleted_at: timestamp });

    return res
      .status(200)
      .json({
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

const reactivateUser = async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "Email is required" });

    const user = await User.findOne({ where: { email } });
    if (!user) return res.status(404).json({ error: "User not found" });

    await user.update({ deleted_at: null });

    return res
      .status(200)
      .json({
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

const getAllUsers = async (req, res) => {
  try {
    // Kukunin lahat ng users pero itatago ang password para secure
    const users = await User.findAll({ attributes: { exclude: ["password"] } });
    return res.status(200).json({ rows: users });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

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
  deactivateUser,
  reactivateUser,
  getAllUsers,
  updateUserRole,
};
