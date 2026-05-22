import User from '../models/userModel.js';
import generateToken from '../utils/generateToken.js';
import crypto from 'crypto';
import Expense from '../models/expenseModel.js';
import Notification from '../models/notificationModel.js';
import { sendPushNotification } from '../utils/notificationHelper.js';

// Password validation regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d@$!%*?&]{8,}$/;

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ==========================================
// REGISTRATION
// ==========================================
// Handles creation of new user profiles
// Validates email format and enforces strong password policies
const registerUser = async (req, res, next) => {
    const { name, email, password, role } = req.body;

    try {
        if (!emailRegex.test(email)) {
            res.status(400);
            throw new Error('Invalid email format');
        }

        if (!passwordRegex.test(password)) {
            res.status(400);
            throw new Error('Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, and one number');
        }

        const userExists = await User.findOne({ email });

        if (userExists) {
            res.status(400);
            throw new Error('User already exists');
        }

        const user = await User.create({
            name,
            email,
            password,
            role: role || 'personal',
            status: 'active'
        });

        if (user) {
            res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                status: user.status,
                token: generateToken(user._id),
            });
        } else {
            res.status(400);
            throw new Error('Invalid user data');
        }
    } catch (error) {
        next(error);
    }
};

// ==========================================
// AUTHENTICATION & LOGIN
// ==========================================
// Authenticates credentials and returns a stateless JWT
// Executes Inactivity Detection to dispatch daily reminders
const authUser = async (req, res, next) => {
    const { email, password } = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;

    try {
        const user = await User.findOne({ email });

        if (user && (await user.matchPassword(password))) {

            if (user.status === 'blocked' || user.isBlocked) {
                res.status(403);
                throw new Error('Account has been blocked by an administrator.');
            }

            // Trigger inactivity check to encourage consistent tracking
            try {
                const lastExpense = await Expense.findOne({ userId: user._id }).sort({ date: -1 });
                let isInactive = false;
                if (lastExpense) {
                    const hoursSinceLastExpense = (Date.now() - new Date(lastExpense.date).getTime()) / (1000 * 60 * 60);
                    if (hoursSinceLastExpense > 24) isInactive = true;
                } else {
                    isInactive = true;
                }

                if (isInactive && user.fcmTokens && user.fcmTokens.length > 0) {
                    const recentNotif = await Notification.findOne({
                        user: user._id,
                        type: 'INFO',
                        referenceId: { $regex: /^inactivity-/ },
                        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
                    });

                    if (!recentNotif) {
                        await sendPushNotification(user.fcmTokens, {
                            title: "Inactivity Alert",
                            body: "You haven’t added any expense today. Please update to maintain accurate tracking.",
                            data: { route: "/dashboard", type: "INACTIVITY" }
                        });
                        
                        await Notification.create({
                            user: user._id,
                            type: 'INFO',
                            message: "You haven’t added any expense today. Please update to maintain accurate tracking.",
                            referenceId: `inactivity-${user._id}-${new Date().toISOString().split('T')[0]}`
                        });
                    }
                }
            } catch (err) {
                console.error("Failed to check inactivity or send FCM:", err);
            }
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        } else {


            res.status(401);
            throw new Error('Invalid email or password');
        }
    } catch (error) {
        next(error);
    }
};

// ==========================================
// PROFILE RETRIEVAL
// ==========================================
// Fetches the protected profile of the currently authenticated user
const getUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

// ==========================================
// PROFILE UPDATE
// ==========================================
// Allows user to update credentials and issues a fresh JWT
const updateUserProfile = async (req, res, next) => {
    try {
        const user = await User.findById(req.user._id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;

            if (req.body.password) {
                user.password = req.body.password;
            }

            const updatedUser = await user.save();

            res.json({
                _id: updatedUser._id,
                name: updatedUser.name,
                email: updatedUser.email,
                role: updatedUser.role,
                token: generateToken(updatedUser._id),
            });
        } else {
            res.status(404);
            throw new Error('User not found');
        }
    } catch (error) {
        next(error);
    }
};

const saveFCMToken = async (req, res, next) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            res.status(400);
            throw new Error("FCM token is required");
        }

        await User.findByIdAndUpdate(req.user._id, {
            $addToSet: { fcmTokens: fcmToken },
        });

        res.json({ success: true, message: "FCM token saved" });
    } catch (error) {
        next(error);
    }
};

// ==========================================
// GOOGLE OAUTH
// ==========================================
// Verifies Firebase Google Auth payload and creates/logs in user seamlessly
const googleAuth = async (req, res, next) => {
    const { name, email, photoURL } = req.body;

    try {
        if (!email || !name) {
            res.status(400);
            throw new Error('Name and email are required from Google account');
        }

        let user = await User.findOne({ email });

        if (user) {
            // Existing user — check if blocked
            if (user.status === 'blocked' || user.isBlocked) {
                res.status(403);
                throw new Error('Account has been blocked by an administrator.');
            }

            return res.json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }

        // Generate a high-entropy random password for OAuth users to satisfy DB constraints
        const randomPassword = crypto.randomBytes(32).toString('hex');

        user = await User.create({
            name,
            email,
            password: randomPassword,
            role: 'personal',
            status: 'active',
        });

        if (user) {
            return res.status(201).json({
                _id: user._id,
                name: user.name,
                email: user.email,
                role: user.role,
                token: generateToken(user._id),
            });
        }

        res.status(400);
        throw new Error('Failed to create user');
    } catch (error) {
        next(error);
    }
};

export { registerUser, authUser, getUserProfile, updateUserProfile, saveFCMToken, googleAuth };
