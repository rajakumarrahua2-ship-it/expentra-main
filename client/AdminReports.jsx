import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext, API } from '../../context/AuthContext';
import {
    MdDownload, MdDateRange, MdPerson, MdCategory, MdAttachMoney,
    MdReceipt, MdTrendingUp, MdFileDownload, MdRefresh, MdWarning,
    MdCheckCircle, MdInfoOutline, MdClear
} from 'react-icons/md';

const AdminReports = () => {
    const today = new Date();
    const lastWeek = new Date(today);
    lastWeek.setDate(today.getDate() - 7);
    const defaultEndDate = today.toISOString().split('T')[0];
    const defaultStartDate = lastWeek.toISOString().split('T')[0];

    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(false);
    const [startDate, setStartDate] = useState(defaultStartDate);
    const [endDate, setEndDate] = useState(defaultEndDate);
    const [users, setUsers] = useState([]);
    const [selectedUser, setSelectedUser] = useState('');
    const [summary, setSummary] = useState(null);

    useEffect(() => {
        axios.get(`${API}/admin/users`)
            .then(res => setUsers(res.data))
            .catch(err => console.error(err));
            
        // Fetch initial data for the default 1-week range
        fetchReports();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const fetchReports = async (e) => {
        if (e) e.preventDefault();
        try {
            setLoading(true);
            let query = '';
            if (startDate && endDate) query += `?startDate=${startDate}&endDate=${endDate}`;
            if (selectedUser) {
                query += query ? `&userId=${selectedUser}` : `?userId=${selectedUser}`;
            }

            const res = await axios.get(`${API}/admin/reports${query}`);
            setReports(res.data);

            const totalAmount = res.data.reduce((sum, r) => sum + r.amount, 0);
            const categoryBreakdown = {};
            res.data.forEach(r => {
                categoryBreakdown[r.category] = (categoryBreakdown[r.category] || 0) + r.amount;
            });
            setSummary({
                totalAmount,
                count: res.data.length,
                categories: Object.keys(categoryBreakdown).length,
                topCategory: Object.entries(categoryBreakdown).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'
            });

            if (res.data.length === 0) toast.info('No records found for these filters');
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    const clearFilters = () => {
        setStartDate('');
        setEndDate('');
        setSelectedUser('');
        setReports([]);
        setSummary(null);
    };

    const exportCSV = () => {
        if (!reports.length) {
            toast.info('No data to export');
            return;
        }

        const headers = ['Date', 'User Name', 'User Email', 'Category', 'Amount (₹)', 'Description'];
        const rows = reports.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.userId?.name || 'Unknown',
            item.userId?.email || 'Unknown',
            item.category,
            item.amount,
            `"${(item.title || '').replace(/"/g, '""')}"`
        ]);

        let csvContent = headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `Admin_System_Report_${new Date().toISOString().split('T')[0]}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success('CSV exported successfully');
    };

    const hasActiveFilters = startDate || endDate || selectedUser;

    return (
        <div className="space-y-6" id="admin-report-content">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                        <MdReceipt className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-textColor">System Reports</h1>
                        <p className="text-sm text-textColor/70 mt-0.5">Extract and analyze financial transactions</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportCSV}
                        disabled={reports.length === 0}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition ${reports.length === 0
                                ? 'bg-card text-textColor/50 cursor-not-allowed'
                                : 'bg-green-600 text-white hover:bg-green-700 shadow-sm'
                            }`}
                    >
                        <MdDownload className="text-sm" />
                        CSV
                    </button>
                </div>
            </div>

            {/* Filters Card */}
            <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-background border-b border-background">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MdDateRange className="w-5 h-5 text-primary" />
                            <h2 className="font-semibold text-textColor">Filter Reports</h2>
                        </div>
                        {hasActiveFilters && (
                            <button
                                onClick={clearFilters}
                                className="flex items-center gap-1 text-xs text-textColor/60 hover:text-textColor/80 transition"
                            >
                                <MdClear className="text-sm" />
                                Clear filters
                            </button>
                        )}
                    </div>
                </div>
                <form onSubmit={fetchReports} className="p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-xs font-medium text-textColor/80 uppercase tracking-wide mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => setStartDate(e.target.value)}
                                className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-textColor/80 uppercase tracking-wide mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => setEndDate(e.target.value)}
                                className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-textColor/80 uppercase tracking-wide mb-1">
                                Filter by User
                            </label>
                            <select
                                value={selectedUser}
                                onChange={e => setSelectedUser(e.target.value)}
                                className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Users</option>
                                {users.map(u => (
                                    <option key={u._id} value={u._id}>{u.name} ({u.email})</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end">
                            <button
                                type="submit"
                                className="w-full px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition flex items-center justify-center gap-2"
                            >
                                <MdRefresh className="text-sm" />
                                Generate Report
                            </button>
                        </div>
                    </div>
                </form>
            </div>

            {/* Summary Cards */}
            {summary && reports.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-textColor/70 uppercase">Total Amount</p>
                                <p className="text-2xl font-bold text-textColor">₹{summary.totalAmount.toLocaleString()}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MdAttachMoney className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-textColor/60 mt-2">{summary.count} transactions</p>
                    </div>

                    <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-textColor/70 uppercase">Categories Used</p>
                                <p className="text-2xl font-bold text-textColor">{summary.categories}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MdCategory className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-textColor/60 mt-2">Unique categories</p>
                    </div>

                    <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-textColor/70 uppercase">Top Category</p>
                                <p className="text-lg font-bold text-textColor truncate">{summary.topCategory}</p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MdTrendingUp className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-textColor/60 mt-2">Highest spending</p>
                    </div>

                    <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs font-medium text-textColor/70 uppercase">Avg Transaction</p>
                                <p className="text-2xl font-bold text-textColor">
                                    ₹{(summary.totalAmount / summary.count).toLocaleString()}
                                </p>
                            </div>
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <MdReceipt className="w-5 h-5 text-primary" />
                            </div>
                        </div>
                        <p className="text-xs text-textColor/60 mt-2">Per transaction</p>
                    </div>
                </div>
            )}

            {/* Results Table */}
            <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                <div className="px-5 py-3 bg-background border-b border-background">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <MdReceipt className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-textColor">
                                Transactions {reports.length > 0 && `(${reports.length})`}
                            </h3>
                        </div>
                        {loading && (
                            <div className="flex items-center gap-2 text-sm text-primary">
                                <div className="animate-spin rounded-full w-4 h-4 border-2 border-blue-600 border-t-transparent"></div>
                                Loading...
                            </div>
                        )}
                    </div>
                </div>

                {loading ? (
                    <div className="p-12 text-center">
                        <div className="animate-pulse space-y-2">
                            <div className="h-10 bg-card rounded w-full"></div>
                            <div className="h-10 bg-card rounded w-full"></div>
                            <div className="h-10 bg-card rounded w-full"></div>
                        </div>
                    </div>
                ) : reports.length === 0 ? (
                    <div className="p-12 text-center">
                        <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                            <MdReceipt className="w-8 h-8 text-textColor/50" />
                        </div>
                        <h3 className="text-lg font-semibold text-textColor">No Transactions Found</h3>
                        <p className="text-textColor/70 text-sm mt-1">
                            {hasActiveFilters ? 'Try adjusting your filters' : 'Select date range and generate report'}
                        </p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-background border-b border-background">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Date</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">User</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Category</th>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Description</th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-textColor/70 uppercase">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background">
                                {reports.map((rp) => (
                                    <tr key={rp._id} className="hover:bg-background transition">
                                        <td className="px-4 py-3 text-sm text-textColor/70 whitespace-nowrap">
                                            {new Date(rp.date).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div>
                                                <p className="text-sm font-medium text-textColor">{rp.userId?.name || 'Unknown'}</p>
                                                <p className="text-xs text-textColor/60">{rp.userId?.email || 'No email'}</p>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded-full">
                                                <MdCategory className="text-xs" />
                                                {rp.category}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <p className="text-sm text-textColor/70 max-w-xs truncate" title={rp.title}>
                                                {rp.title || '—'}
                                            </p>
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <span className="text-sm font-semibold text-secondary">
                                                ₹{rp.amount.toLocaleString()}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                            <tfoot className="bg-background border-t border-background">
                                <tr>
                                    <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-textColor/80">
                                        Total:
                                    </td>
                                    <td className="px-4 py-3 text-right text-sm font-bold text-primary">
                                        ₹{reports.reduce((sum, r) => sum + r.amount, 0).toLocaleString()}
                                    </td>
                                </tr>
                            </tfoot>
                        </table>
                    </div>
                )}
            </div>

            {/* Info Note */}
            <div className="bg-primary/5 rounded-lg border border-blue-200 p-4">
                <div className="flex items-start gap-3">
                    <MdInfoOutline className="w-5 h-5 text-primary mt-0.5" />
                    <div>
                        <p className="text-sm font-medium text-blue-900">Report Information</p>
                        <p className="text-xs text-primary mt-0.5">
                            Reports include all expense and income transactions across the platform.
                            Use date filters to narrow down results. Export to CSV for offline analysis.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;