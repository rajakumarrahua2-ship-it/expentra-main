import React, { createContext, useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { getFCMToken } from '../utils/getFCMToken';
import { messaging, onMessage } from '../firebase';
import { toast } from 'react-toastify';

export const AuthContext = createContext();

export const API = import.meta.env.VITE_URL_API || import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ==========================================
// AUTHENTICATION CONTEXT
// ==========================================
// Centralized state management for user authentication,
// application modes, and real-time FCM notifications.
export const AuthProvider = ({ children }) => {
    // Auth State from localStorage
    const [token, setToken] = useState(localStorage.getItem('token') || null);
    const [user, setUser] = useState(JSON.parse(localStorage.getItem('user')) || null);
    const [role, setRole] = useState(localStorage.getItem('role') || null);

    // Group & App Mode State
    const [appMode, setAppModeState] = useState(localStorage.getItem('appMode') || 'personal');
    const [selectedGroupId, setSelectedGroupIdState] = useState(localStorage.getItem('selectedGroupId') || null);
    const [activeGroup, setActiveGroup] = useState(null);
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(false);
    const [notificationsLoading, setNotificationsLoading] = useState(false);
    
    // ==========================================
    // NOTIFICATION LOGIC
    // ==========================================
    // Synchronizes persistent notifications from the backend
    const fetchNotifications = async () => {
        try {
            setNotificationsLoading(true);
            const res = await axios.get('/notifications');
            if (res.data) setNotifications(res.data);
        } catch (error) {
            console.error('Failed to load notifications', error);
        } finally {
            setNotificationsLoading(false);
        }
    };

    const markAsRead = async (id) => {
        try {
            await axios.patch(`/notifications/${id}/read`);
            setNotifications(prev => prev.map(n => n._id === id ? { ...n, read: true } : n));
        } catch (error) {
            console.error('Failed to mark notification as read', error);
        }
    };

    const markAllAsRead = async () => {
        try {
            await axios.patch('/notifications/mark-all-read');
            setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        } catch (error) {
            console.error('Failed to mark all as read', error);
        }
    };

    const deleteNotification = async (id) => {
        try {
            await axios.delete(`/notifications/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== id));
        } catch (error) {
            console.error('Failed to delete notification', error);
        }
    };

    const clearAllNotifications = async () => {
        try {
            await axios.delete('/notifications/clear-all');
            setNotifications([]);
        } catch (error) {
            console.error('Failed to clear all notifications', error);
        }
    };

    const fetchGroupName = async (groupId) => {
        try {
            const res = await axios.get(`/groups/${groupId}`);
            setActiveGroup(res.data);
        } catch (error) {
            console.error("Failed to fetch group name", error);
            setActiveGroup(null);
        }
    };

    // ==========================================
    // AUTHENTICATION ACTIONS
    // ==========================================
    // Handles session persistence and cleanup
    const login = (newToken, newUser, newRole) => {
        setToken(newToken);
        setUser(newUser);
        setRole(newRole);
        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));
        localStorage.setItem('role', newRole);
    };

    const logout = () => {
        setToken(null);
        setUser(null);
        setRole(null);
        localStorage.clear(); // Simple logout
        setAppModeState('personal');
        setSelectedGroupIdState(null);
        setActiveGroup(null);
        window.location.href = '/login';
    };

    // ==========================================
    // APPLICATION MODE HANDLING
    // ==========================================
    // Manages personal vs group workspace context
    const setAppMode = (mode) => {
        setAppModeState(mode);
        localStorage.setItem('appMode', mode);
    };

    const setSelectedGroupId = (groupId) => {
        setSelectedGroupIdState(groupId);
        if (groupId) {
            localStorage.setItem('selectedGroupId', groupId);
            fetchGroupName(groupId);
        } else {
            localStorage.removeItem('selectedGroupId');
            setActiveGroup(null);
        }
    };

    // Side Effects for Group & Notifications
    useEffect(() => {
        if (selectedGroupId && !activeGroup) fetchGroupName(selectedGroupId);
    }, [selectedGroupId]);

    useEffect(() => {
        if (token) fetchNotifications();
    }, [token]);

    const shownNotifications = useRef(new Set());

    // ==========================================
    // FIREBASE CLOUD MESSAGING (FCM)
    // ==========================================
    // Initializes token exchange and sets up foreground listeners
    // Includes duplicate prevention and deep linking redirection
    useEffect(() => {
        if (user && token) {
            const setupNotifications = async () => {
                try {
                    const fcmToken = await getFCMToken();
                    if (fcmToken) await axios.post('/auth/fcm-token', { fcmToken });
                    onMessage(messaging, (payload) => {
                        console.log('FCM Payload:', payload);
                        const messageId = payload.messageId || (payload.notification?.title + payload.notification?.body);
                        
                        if (shownNotifications.current.has(messageId)) return;
                        shownNotifications.current.add(messageId);

                        fetchNotifications();

                        if (payload.notification) {
                            const route = payload.data?.route; // Extract deep link route
                            toast.info(
                                <div style={{ cursor: 'pointer' }} onClick={() => { if (route) window.location.href = route; }}>
                                    <h4 style={{ fontWeight: 'bold', margin: '0 0 4px 0' }}>{payload.notification.title}</h4>
                                    <p style={{ fontSize: '0.875rem', margin: 0 }}>{payload.notification.body}</p>
                                </div>,
                                { autoClose: 5000 }
                            );
                        }
                    });
                } catch (error) { console.error("FCM setup failed:", error); }
            };
            setupNotifications();
        }
    }, [user, token]);

    const [lastSeen, setLastSeen] = useState(localStorage.getItem('notificationsLastSeen') || 0);

    const markAsSeen = () => {
        const now = new Date().toISOString();
        setLastSeen(now);
        localStorage.setItem('notificationsLastSeen', now);
    };

    const unreadCount = notifications.filter(n => !n.read).length;

    return (
        <AuthContext.Provider value={{
            token, user, role,
            appMode, setAppMode, selectedGroupId, setSelectedGroupId, activeGroup,
            notifications, fetchNotifications, unreadCount, markAsSeen,
            markAsRead, markAllAsRead, deleteNotification, clearAllNotifications,
            login, logout, loading, notificationsLoading
        }}>
            {children}
        </AuthContext.Provider>
    );
};
