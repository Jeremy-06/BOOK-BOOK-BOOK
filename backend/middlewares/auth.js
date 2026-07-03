const jwt = require("jsonwebtoken");

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
