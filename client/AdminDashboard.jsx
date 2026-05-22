import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext, API } from '../../context/AuthContext';
import {
    MdAdminPanelSettings, MdPeople, MdAttachMoney, MdTrendingUp,
    MdCategory, MdReceipt, MdGroup, MdShowChart, MdWarning,
    MdVerifiedUser, MdTimeline, MdDashboard, MdRefresh
} from 'react-icons/md';
import {
    AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
    ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC489A', '#06B6D4'];

const AdminDashboard = () => {
    const [stats, setStats] = useState(null);
    const [advancedStats, setAdvancedStats] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const [basicRes, advRes] = await Promise.all([
                    axios.get(`${API}/admin/dashboard`),
                    axios.get(`${API}/admin/analytics/overview`)
                ]);
                setStats(basicRes.data);
                setAdvancedStats(advRes.data);
            } catch (error) {
                toast.error('Failed to load admin stats');
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-card rounded w-1/4 animate-pulse"></div>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-32 bg-card rounded-lg animate-pulse"></div>
                    ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-card rounded-lg animate-pulse"></div>
                    <div className="h-80 bg-card rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    const userGrowthData = stats?.usageGraph?.map(item => ({
        month: item.name,
        users: item.users || 0,
        transactions: item.amount || 0
    })) || [];

    const pieData = advancedStats?.topCategories?.slice(0, 6).map(cat => ({
        name: cat.name,
        value: cat.count,
        amount: cat.totalAmount || 0
    })) || [];

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                        <MdAdminPanelSettings className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-textColor">Admin Dashboard</h1>
                        <p className="text-sm text-textColor/70 mt-0.5">Platform overview and analytics</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase tracking-wide">Total Users</p>
                            <p className="text-2xl font-bold text-textColor">{stats?.totalUsers?.toLocaleString() || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <MdVerifiedUser className="text-textColor/50" />
                        <span className="text-textColor/70">{stats?.adminCount || 0} Admins</span>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase tracking-wide">Daily Active</p>
                            <p className="text-2xl font-bold text-textColor">{advancedStats?.dailyActiveUsers?.toLocaleString() || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdShowChart className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <MdTimeline className="text-textColor/50" />
                        <span className="text-textColor/70">Last 24 hours</span>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase tracking-wide">Total Transactions</p>
                            <p className="text-2xl font-bold text-textColor">{advancedStats?.totalExpensesCount?.toLocaleString() || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdReceipt className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <MdTrendingUp className="text-textColor/50" />
                        <span className="text-textColor/70">All time</span>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase tracking-wide">Total Volume</p>
                            <p className="text-xl font-bold text-textColor">₹{advancedStats?.totalTransactionAmount?.toLocaleString() || 0}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdAttachMoney className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                    <div className="mt-2 flex items-center gap-2 text-xs">
                        <MdDashboard className="text-textColor/50" />
                        <span className="text-textColor/70">System economy</span>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Platform Activity Trend */}
                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-background">
                        <MdTrendingUp className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-textColor">Platform Activity Trend</h3>
                    </div>
                    <div className="h-80 w-full">
                        <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                            <AreaChart data={userGrowthData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#2563EB" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                                        <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                <XAxis dataKey="month" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="left" axisLine={false} tickLine={false} />
                                <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} />
                                <Tooltip />
                                <Area
                                    yAxisId="left"
                                    type="monotone"
                                    dataKey="users"
                                    name="New Users"
                                    stroke="#2563EB"
                                    fillOpacity={1}
                                    fill="url(#colorUsers)"
                                />
                                <Area
                                    yAxisId="right"
                                    type="monotone"
                                    dataKey="transactions"
                                    name="Transactions (₹)"
                                    stroke="#10B981"
                                    fillOpacity={1}
                                    fill="url(#colorTransactions)"
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Top Categories Pie Chart */}
                <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                    <div className="flex items-center gap-2 mb-4 pb-2 border-b border-background">
                        <MdCategory className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-textColor">Top Spending Categories</h3>
                    </div>
                    <div className="h-80 w-full">
                        {pieData.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                                <PieChart>
                                    <Pie
                                        data={pieData}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => percent > 0.05 ? `${name} ${(percent * 100).toFixed(0)}%` : ''}
                                        outerRadius={90}
                                        fill="#8884d8"
                                        dataKey="value"
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value, name, props) => [`${value} transactions`, props.payload.name]} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex items-center justify-center text-textColor/60">
                                No category data available
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Recent Users & Categories Tables */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Users Table */}
                <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-background border-b border-background">
                        <div className="flex items-center gap-2">
                            <MdPeople className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-textColor">Recent Users</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-textColor/70 uppercase">User</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-textColor/70 uppercase">Email</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-textColor/70 uppercase">Role</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-textColor/70 uppercase">Joined</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background">
                                {stats?.recentUsers?.slice(0, 5).map((user) => (
                                    <tr key={user._id} className="hover:bg-background transition">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        {user.name?.charAt(0)?.toUpperCase() || 'U'}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-textColor">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-textColor/70">{user.email}</td>
                                        <td className="px-4 py-2">
                                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-card text-textColor/70'
                                                }`}>
                                                {user.role === 'admin' && <MdVerifiedUser className="text-xs" />}
                                                {user.role || 'user'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-textColor/70">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                    </tr>
                                ))}
                                {(!stats?.recentUsers || stats.recentUsers.length === 0) && (
                                    <tr>
                                        <td colSpan="4" className="px-4 py-8 text-center text-textColor/60">
                                            No users found
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Top Categories Table */}
                <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                    <div className="px-5 py-3 bg-background border-b border-background">
                        <div className="flex items-center gap-2">
                            <MdCategory className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-textColor">Top Expense Categories</h3>
                        </div>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-textColor/70 uppercase">Category</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-textColor/70 uppercase">Usage Count</th>
                                    <th className="px-4 py-2 text-right text-xs font-medium text-textColor/70 uppercase">Total Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background">
                                {advancedStats?.topCategories?.slice(0, 5).map((cat, idx) => (
                                    <tr key={cat.name} className="hover:bg-background transition">
                                        <td className="px-4 py-2">
                                            <div className="flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                                                <span className="text-sm font-medium text-textColor capitalize">{cat.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-2 text-right text-sm font-semibold text-textColor/80">{cat.count}</td>
                                        <td className="px-4 py-2 text-right text-sm font-semibold text-secondary">
                                            ₹{cat.totalAmount?.toLocaleString() || 0}
                                        </td>
                                    </tr>
                                ))}
                                {(!advancedStats?.topCategories || advancedStats.topCategories.length === 0) && (
                                    <tr>
                                        <td colSpan="3" className="px-4 py-8 text-center text-textColor/60">
                                            No category data available
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* System Health Indicator */}
            <div className="bg-card rounded-lg border border-background p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                    <MdWarning className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-textColor">System Health</h3>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="text-sm text-textColor/70">Active Groups</span>
                        <span className="text-lg font-bold text-primary">{advancedStats?.activeGroups || 0}</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="text-sm text-textColor/70">Avg Transaction</span>
                        <span className="text-lg font-bold text-primary">
                            ₹{advancedStats?.averageTransactionAmount?.toLocaleString() || 0}
                        </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg">
                        <span className="text-sm text-textColor/70">User Growth</span>
                        <span className={`text-lg font-bold ${(stats?.growthRate || 0) >= 0 ? 'text-secondary' : 'text-danger'}`}>
                            {(stats?.growthRate || 0) >= 0 ? '+' : ''}{stats?.growthRate || 0}%
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;