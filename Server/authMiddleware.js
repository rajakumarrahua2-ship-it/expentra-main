import jwt from 'jsonwebtoken';
import User from '../models/userModel.js';

// ==========================================
// AUTHENTICATION MIDDLEWARE
// ==========================================
// Verifies the Bearer JWT token and attaches the user to the request object
const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1]; // Extract token from "Bearer <token>"
            const decoded = jwt.verify(token, process.env.JWT_SECRET); // Verify cryptographic signature
            const user = await User.findById(decoded.id).select('-password'); // Fetch user excluding sensitive fields
            if (!user) {
                res.status(401);
                return next(new Error('User not found'));
            }
            req.user = user;
            return next();
        } catch (error) {
            res.status(401);
            return next(new Error(`Not authorized, token failed: ${error.message}`));
        }
    }

    if (!token) {
        res.status(401);
        return next(new Error('Not authorized, no token'));
    }
};

// ==========================================
// AUTHORIZATION MIDDLEWARE (ADMIN)
// ==========================================
// Restricts access to specific routes based on the "admin" role
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401);
        next(new Error('Not authorized as an admin'));
    }
};


export { protect, admin };
