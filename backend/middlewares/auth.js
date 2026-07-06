const jwt = require("jsonwebtoken");
const db = require("../models");

exports.isAuthenticatedUser = (req, res, next) => {
    console.log('isAuthenticatedUser middleware entered');
    const authHeader = req.header('Authorization');

    if (!authHeader) {
        console.log('isAuthenticatedUser token missing');
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    const token = authHeader.split(' ')[1] ? authHeader.split(' ')[1].replace(/"/g, "") : null;

    if (!token) {
        console.log('isAuthenticatedUser token missing');
        return res.status(401).json({ message: 'Login first to access this resource' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || "secret_key");
        req.user = { id: decoded.id }; 
        console.log('isAuthenticatedUser token verified');
        return next();
    } catch (error) {
        console.log('isAuthenticatedUser token failed', error);
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

exports.isAdminUser = async (req, res, next) => {
    try {
        const user = await db.User.findByPk(req.user.id);

        if (!user || user.role !== "admin") {
            return res.status(403).json({ message: "Admins only" });
        }

        req.user.role = user.role;
        return next();
    } catch (error) {
        console.log("isAdminUser failed", error);
        return res.status(500).json({ message: "Unable to verify admin access" });
    }
};
