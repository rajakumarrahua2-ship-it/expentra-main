import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../context/AuthContext';
import {
    MdNotificationsActive, MdClose, MdWarning, MdPayment,
    MdGroup, MdCheckCircle, MdInfoOutline, MdAttachMoney,
    MdNotificationsNone, MdDelete, MdRefresh
} from 'react-icons/md';
import { toast } from 'react-toastify';

const Alerts = () => {
    const {
        notifications, notificationsLoading, fetchNotifications,
        markAsRead, markAllAsRead,
        deleteNotification, clearAllNotifications
    } = useContext(AuthContext);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchNotifications();
    }, []);

    const handleClearAll = async () => {
        if (!window.confirm('Are you sure you want to clear all notifications?')) return;
        await clearAllNotifications();
        toast.success('All notifications cleared');
    };

    const handleDelete = async (id) => {
        await deleteNotification(id);
        toast.success('Notification removed');
    };

    const handleMarkAsRead = async (id) => {
        await markAsRead(id);
        toast.success('Notification marked as read');
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead();
        toast.success('All notifications marked as read');
    };

    const getAlertConfig = (type) => {
        const configs = {
            BUDGET_EXCEEDED: {
                icon: MdWarning,
                accent: 'bg-danger',
                text: 'text-danger',
                lightBg: 'bg-danger/5',
                iconColor: 'text-danger',
                label: 'Budget Exceeded',
                isSmart: false
            },
            SETTLEMENT_PENDING: {
                icon: MdPayment,
                accent: 'bg-amber-500',
                text: 'text-amber-700',
                lightBg: 'bg-amber-50',
                iconColor: 'text-amber-600',
                label: 'Payment Due',
                isSmart: false
            },
            GROUP_EXPENSE: {
                icon: MdGroup,
                accent: 'bg-primary',
                text: 'text-primary',
                lightBg: 'bg-primary/5',
                iconColor: 'text-primary',
                label: 'Group Activity',
                isSmart: false
            },
            PAYMENT_RECEIVED: {
                icon: MdCheckCircle,
                accent: 'bg-secondary',
                text: 'text-secondary',
                lightBg: 'bg-secondary/5',
                iconColor: 'text-secondary',
                label: 'Payment Received',
                isSmart: false
            },
            BUDGET_WARNING: {
                icon: MdWarning,
                accent: 'bg-danger/50',
                text: 'text-danger',
                lightBg: 'bg-danger/5',
                iconColor: 'text-danger',
                label: 'Budget Warning',
                isSmart: false
            },
            OVERSPENDING_WARNING: {
                icon: MdNotificationsActive,
                accent: 'bg-primary',
                text: 'text-white',
                lightBg: 'bg-primary/10',
                iconColor: 'text-primary',
                label: 'Smart Insight',
                isSmart: true
            },
            SMART_INSIGHT: {
                icon: MdNotificationsActive,
                accent: 'bg-primary',
                text: 'text-white',
                lightBg: 'bg-primary/10',
                iconColor: 'text-primary',
                label: 'Smart Insight',
                isSmart: true
            },
            RECURRING_SUBSCRIPTION: {
                icon: MdAttachMoney,
                accent: 'bg-primary',
                text: 'text-primary',
                lightBg: 'bg-primary/5',
                iconColor: 'text-primary',
                label: 'Subscription',
                isSmart: false
            },
            INFO: {
                icon: MdInfoOutline,
                accent: 'bg-textColor/40',
                text: 'text-textColor/80',
                lightBg: 'bg-background',
                iconColor: 'text-textColor/70',
                label: 'Information',
                isSmart: false
            }
        };
        return configs[type] || configs.INFO;
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const filteredNotifications = filter === 'all'
        ? notifications
        : filter === 'unread'
            ? notifications.filter(n => !n.read)
            : notifications;

    if (notificationsLoading) {
        return (
            <div className="space-y-4">
                <div className="h-8 bg-card rounded w-1/4 animate-pulse"></div>
                <div className="h-24 bg-card rounded-lg animate-pulse"></div>
                <div className="h-24 bg-card rounded-lg animate-pulse"></div>
                <div className="h-24 bg-card rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-12">
            <div className="max-w-4xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <div className="p-3 bg-primary/10 rounded-2xl">
                                <MdNotificationsActive className="w-7 h-7 text-primary" />
                            </div>
                            {unreadCount > 0 && (
                                <span className="absolute -top-1 -right-1 w-6 h-6 bg-danger text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-background">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h1 className="text-3xl font-extrabold text-textColor tracking-tight">Alerts</h1>
                            <p className="text-textColor/60 font-medium">Manage your financial notifications</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-primary bg-card border border-background rounded-xl hover:bg-primary hover:text-white shadow-sm transition-all duration-300"
                            >
                                <MdCheckCircle />
                                Mark all read
                            </button>
                        )}
                        {notifications.length > 0 && (
                            <button
                                onClick={handleClearAll}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-textColor/70 bg-card border border-background rounded-xl hover:bg-danger/5 hover:text-danger shadow-sm transition-all duration-300"
                            >
                                <MdDelete />
                                Clear all
                            </button>
                        )}
                        <button
                            onClick={fetchNotifications}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-textColor/70 bg-card border border-background rounded-xl hover:bg-background shadow-sm transition-all duration-300"
                        >
                            <MdRefresh className="animate-spin-hover" />
                            Refresh
                        </button>
                    </div>
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2 p-1 bg-card/50 rounded-2xl w-fit">
                    <button
                        onClick={() => setFilter('all')}
                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${filter === 'all'
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-textColor/60 hover:text-textColor/80'
                            }`}
                    >
                        All
                        <span className="ml-2 px-2 py-0.5 bg-card rounded-lg text-xs">{notifications.length}</span>
                    </button>
                    <button
                        onClick={() => setFilter('unread')}
                        className={`px-6 py-2 text-sm font-bold rounded-xl transition-all duration-300 ${filter === 'unread'
                            ? 'bg-card text-primary shadow-sm'
                            : 'text-textColor/60 hover:text-textColor/80'
                            }`}
                    >
                        Unread
                        <span className="ml-2 px-2 py-0.5 bg-card rounded-lg text-xs">{unreadCount}</span>
                    </button>
                </div>

            {/* Notifications List */}
            <div className="space-y-4">
                {filteredNotifications.length === 0 ? (
                    <div className="bg-card rounded-3xl border border-background p-16 text-center shadow-sm">
                        <div className="w-20 h-20 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-background">
                            <MdNotificationsNone className="w-10 h-10 text-textColor/40" />
                        </div>
                        <h3 className="text-xl font-bold text-textColor">No Notifications</h3>
                        <p className="text-textColor/60 mt-2 max-w-xs mx-auto">
                            {filter === 'unread' ? "You've read all your notifications! Great job managing your finances." : "You're all caught up! No recent activity to show."}
                        </p>
                    </div>
                ) : (
                    filteredNotifications.map((notification, idx) => {
                        const config = getAlertConfig(notification.type);
                        const Icon = config.icon;
                        const isUnread = !notification.read;

                        return (
                            <div
                                key={notification._id || idx}
                                className={`group relative overflow-hidden rounded-2xl border transition-all duration-300 ${config.isSmart
                                    ? 'bg-gradient-to-r from-primary to-secondary p-[1px] shadow-lg hover:shadow-primary/20 scale-[1.01]'
                                    : 'bg-card border-background shadow-sm hover:shadow-md hover:-translate-y-0.5'
                                    }`}
                            >
                                {/* Smart Background Overlay */}
                                {config.isSmart && (
                                    <div className="absolute inset-0 bg-card/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                )}

                                <div className={`relative flex items-start gap-4 p-5 ${config.isSmart ? 'bg-gradient-to-r from-primary/95 to-secondary/95 rounded-[15px]' : ''}`}>
                                    {/* Left Status Indicator */}
                                    {!config.isSmart && (
                                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${config.accent}`}></div>
                                    )}

                                    {/* Icon */}
                                    <div className={`shrink-0 p-3 rounded-xl ${config.isSmart ? 'bg-card/20' : config.lightBg}`}>
                                        <Icon className={`w-6 h-6 ${config.isSmart ? 'text-white' : config.iconColor}`} />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                                            <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md ${config.isSmart
                                                ? 'bg-card text-primary'
                                                : `${config.lightBg} ${config.iconColor}`
                                                }`}>
                                                {config.label}
                                            </span>
                                            {isUnread && (
                                                <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-md ${config.isSmart ? 'bg-card/20 text-white' : 'bg-primary/10 text-primary'}`}>
                                                    NEW
                                                </span>
                                            )}
                                            <span className={`text-xs font-medium ${config.isSmart ? 'text-white/70' : 'text-textColor/50'}`}>
                                                {new Date(notification.createdAt).toLocaleDateString(undefined, {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                })}
                                            </span>
                                        </div>
                                        <h4 className={`text-base font-bold leading-tight ${config.isSmart ? 'text-white' : 'text-textColor'}`}>
                                            {notification.message}
                                        </h4>

                                        {/* Details Section */}
                                        {notification.details && notification.details.length > 0 && (
                                            <div className={`mt-4 p-4 rounded-xl border ${config.isSmart
                                                ? 'bg-card/10 border-white/20'
                                                : 'bg-background border-background'
                                                }`}>
                                                <p className={`text-[11px] font-bold uppercase tracking-widest mb-3 ${config.isSmart ? 'text-white/60' : 'text-textColor/50'}`}>Detailed Analysis</p>
                                                <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                                    {notification.details.map((d, i) => (
                                                        <li key={i} className="flex items-center gap-3 p-2 rounded-lg bg-card/5">
                                                            <div className={`w-2 h-2 rounded-full ${config.isSmart ? 'bg-secondary' : 'bg-primary'}`}></div>
                                                            <div className="flex flex-col">
                                                                <span className={`text-xs font-bold ${config.isSmart ? 'text-white' : 'text-textColor'}`}>{d._id?.category}</span>
                                                                <span className={`text-[10px] ${config.isSmart ? 'text-white/60' : 'text-textColor/60'}`}>₹{d._id?.amount} • {d.count} sessions</span>
                                                            </div>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>

                                    {/* Actions */}
                                    <div className="flex flex-col gap-2 shrink-0">
                                        <button
                                            onClick={() => handleDelete(notification._id)}
                                            className={`p-2 rounded-lg transition-all ${config.isSmart
                                                ? 'text-white hover:bg-card/20'
                                                : 'text-textColor/50 hover:text-danger hover:bg-danger/5'
                                                }`}
                                            title="Dismiss"
                                        >
                                            <MdClose className="w-5 h-5" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    </div>
    );
};

export default Alerts;