import { firebaseApp, admin } from "../config/firebaseAdmin.js";
import User from "../models/userModel.js";
import Group from "../models/groupModel.js";

// ==========================================
// TOKEN RETRIEVAL
// ==========================================
// Fetches all registered FCM device tokens for a list of user IDs
export const getTokensFromUsers = async (userIds) => {
    try {
        const users = await User.find({ _id: { $in: userIds } });
        const tokens = [];
        users.forEach(u => {
            if (u.fcmTokens && u.fcmTokens.length > 0) {
                tokens.push(...u.fcmTokens);
            }
        });
        return tokens;
    } catch (err) {
        console.error("getTokensFromUsers Error:", err);
        return [];
    }
};

// ==========================================
// FCM DISPATCH ENGINE
// ==========================================
// Formats and sends high-priority push notifications with deep linking support
export const sendPushNotification = async (tokens, payload) => {
    try {
        if (!tokens || tokens.length === 0) return;

        if (!firebaseApp) {
            console.error("❌ Cannot send notification: Firebase App not initialized. Check your credentials.");
            return;
        }

        const message = {
            notification: {
                title: payload.title,
                body: payload.body,
            },
            data: payload.data || {},
            android: {
                priority: "high",
                notification: {
                    sound: "default",
                    clickAction: payload.data?.route || payload.data?.url || "/", // Maps route for Android deep linking
                }
            },
            webpush: {
                headers: {
                    Urgency: "high",
                },
                notification: {
                    icon: "/pwa-192x192.png",
                    badge: "/pwa-192x192.png",
                },
                fcm_options: {
                    link: payload.data?.route || payload.data?.url || "/", // Maps route for WebPush deep linking
                },
            },
            tokens: tokens,
        };

        const response = await firebaseApp.messaging().sendEachForMulticast(message);

        // Identify and prune stale/invalid device tokens from the database
        if (response.failureCount > 0) {
            const failedTokens = [];
            response.responses.forEach((resp, idx) => {
                if (!resp.success) {
                    const error = resp.error;
                    if (
                        error.code === "messaging/registration-token-not-registered" ||
                        error.code === "messaging/invalid-registration-token"
                    ) {
                        failedTokens.push(tokens[idx]);
                    }
                }
            });

            if (failedTokens.length > 0) {
                await User.updateMany(
                    { fcmTokens: { $in: failedTokens } },
                    { $pull: { fcmTokens: { $in: failedTokens } } }
                );
            }
        }
    } catch (error) {
        console.error("CRITICAL FCM Error:", error);
    }
};

// ==========================================
// GROUP BROADCASTER
// ==========================================
// Dispatches a notification to all members of a group except the sender
export const notifyGroupMembers = async (groupId, senderId, payload) => {
    try {
        const group = await Group.findById(groupId);
        if (!group) return;

        const targetUserIds = group.members
            .filter(m => m.user && m.user.toString() !== senderId.toString())
            .map(m => m.user);

        const tokens = await getTokensFromUsers(targetUserIds);
        await sendPushNotification(tokens, payload);
    } catch (err) {
        console.error("notifyGroupMembers Exception:", err);
    }
};
