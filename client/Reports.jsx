import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API } from '../context/AuthContext';
import {
    PieChart, Pie, Cell, Tooltip, Legend,
    LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer
} from 'recharts';
import { MdDownload, MdAttachMoney, MdTrendingUp, MdWarning, MdCategory, MdShowChart, MdTrendingDown } from 'react-icons/md';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#14B8A6', '#84CC16'];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Reports = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    const [monthlyData, setMonthlyData] = useState(null);
    const [yearlyData, setYearlyData] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchReports = async () => {
        try {
            setLoading(true);
            const [monthRes, yearRes] = await Promise.all([
                axios.get(`${API}/reports/monthly?month=${selectedMonth}&year=${selectedYear}`),
                axios.get(`${API}/reports/yearly?year=${selectedYear}`)
            ]);
            setMonthlyData(monthRes.data);
            setYearlyData(yearRes.data);
        } catch (error) {
            toast.error('Failed to load reports');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReports();
    }, [selectedMonth, selectedYear]);

    const exportCSV = () => {
        if (!yearlyData?.monthlyBreakdown) return;
        const headers = ['Month', 'Total Amount (₹)', 'Transaction Count'];
        const rows = yearlyData.monthlyBreakdown.map(item => [
            MONTHS[item.month - 1] || item.month,
            item.totalAmount,
            item.count
        ]);
        let csvContent = 'data:text/csv;charset=utf-8,'
            + headers.join(',') + '\n'
            + rows.map(r => r.join(',')).join('\n');
        const link = document.createElement('a');
        link.setAttribute('href', encodeURI(csvContent));
        link.setAttribute('download', `Expentra_Report_${MONTHS[selectedMonth - 1]}_${selectedYear}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const totalIncome = monthlyData?.totalIncome || 0;
    const totalSpent = monthlyData?.totalSpent || 0;
    const remainingBalance = totalIncome - totalSpent;
    const savingsRate = totalIncome > 0 ? ((remainingBalance / totalIncome) * 100).toFixed(1) : 0;

    const categoryData = (monthlyData?.categoryWise || []).map(cat => ({
        name: cat.category,
        value: cat.totalAmount,
        percentage: totalSpent > 0 ? ((cat.totalAmount / totalSpent) * 100).toFixed(1) : 0
    }));

    const currentYear = today.getFullYear();
    const years = [currentYear - 1, currentYear, currentYear + 1];

    if (loading && !monthlyData) {
        return (
            <div className="space-y-6 bg-transparent pb-10">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-80 bg-card rounded-2xl animate-pulse"></div>
                    <div className="h-80 bg-card rounded-2xl animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 bg-transparent pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textColor">Reports</h1>
                    <p className="text-sm text-textColor opacity-70 mt-1">Detailed analysis of your income and spending</p>
                </div>
                <div className="flex flex-wrap gap-3 items-center">
                    <select
                        value={selectedMonth}
                        onChange={e => setSelectedMonth(Number(e.target.value))}
                        className="bg-card rounded-xl border border-background px-4 py-2 text-sm text-textColor outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all cursor-pointer"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>
                    <select
                        value={selectedYear}
                        onChange={e => setSelectedYear(Number(e.target.value))}
                        className="bg-card rounded-xl border border-background px-4 py-2 text-sm text-textColor outline-none focus:ring-2 focus:ring-primary/20 shadow-sm transition-all cursor-pointer"
                    >
                        {years.map(y => (
                            <option key={y} value={y}>{y}</option>
                        ))}
                    </select>
                    <button
                        onClick={exportCSV}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-card border border-background text-primary rounded-xl hover:bg-background transition-all duration-300 text-sm font-semibold shadow-sm ml-2"
                    >
                        <MdDownload className="text-lg" /> Export CSV
                    </button>
                </div>
            </div>

            {/* Clean KPI row resembling Analysis Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Total Income */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-background rounded-xl p-2.5">
                                <MdAttachMoney className="w-5 h-5 text-secondary" />
                            </div>
                            <h3 className="text-sm font-semibold text-textColor opacity-70">Total Income</h3>
                        </div>
                        <p className="text-4xl font-black text-secondary">₹{totalIncome.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-textColor opacity-50 font-medium mt-3">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>

                {/* Total Expense */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-background rounded-xl p-2.5">
                                <MdTrendingUp className="w-5 h-5 text-danger" />
                            </div>
                            <h3 className="text-sm font-semibold text-textColor opacity-70">Total Expense</h3>
                        </div>
                        <p className="text-4xl font-black text-danger">₹{totalSpent.toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-textColor opacity-50 font-medium mt-3">{MONTHS[selectedMonth - 1]} {selectedYear}</p>
                </div>

                {/* Remaining Balance */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-background rounded-xl p-2.5">
                                {remainingBalance >= 0 ? <MdTrendingDown className="w-5 h-5 text-primary" /> : <MdTrendingUp className="w-5 h-5 text-danger" />}
                            </div>
                            <h3 className="text-sm font-semibold text-textColor opacity-70">Remaining Balance</h3>
                        </div>
                        <p className={`text-4xl font-black ${remainingBalance >= 0 ? 'text-primary' : 'text-danger'}`}>
                            ₹{remainingBalance.toLocaleString()}
                        </p>
                    </div>
                    <p className="text-xs text-textColor opacity-50 font-medium mt-3">Savings Rate: {savingsRate}%</p>
                </div>
            </div>

            {/* Warning Message (Moved Below Stats) */}
            {totalSpent > 0 && totalIncome > 0 && totalSpent > totalIncome && (
                <div className="flex items-start gap-2 bg-danger/5 border border-danger/20 px-3 py-2.5 rounded-lg text-xs text-danger font-medium w-fit mt-2">
                    <MdWarning className="shrink-0 text-sm mt-0.5" />
                    <span>Warning: You have outspent your total income by ₹{(totalSpent - totalIncome).toLocaleString()} this month.</span>
                </div>
            )}

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Category-wise Pie Chart */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 flex flex-col justify-center relative overflow-hidden">
                    <div className="absolute top-6 left-6">
                        <h3 className="text-lg font-semibold text-textColor">Expense Breakdown</h3>
                        <p className="text-sm text-textColor opacity-60 mt-0.5">Where your money went this month</p>
                    </div>
                    {categoryData.length > 0 ? (
                        <div className="h-72 w-full mt-14">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <PieChart>
                                    <Pie
                                        isAnimationActive={false}
                                        data={categoryData}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={95}
                                        paddingAngle={4}
                                        dataKey="value"
                                        stroke="none"
                                    >
                                        {categoryData.map((_, index) => (
                                            <Cell key={index} fill={COLORS[index % COLORS.length]} />
                                        ))}
                                    </Pie>
                                    <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }} formatter={value => `₹${value.toLocaleString()}`} />
                                    <Legend wrapperStyle={{ paddingTop: '20px' }} />
                                </PieChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 w-full mt-14 flex items-center justify-center text-sm text-textColor opacity-40 italic bg-background/50 rounded-xl">
                            No expenses logged for breakdown
                        </div>
                    )}
                </div>

                {/* Yearly Trend Line Chart */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 pb-8">
                    <div className="mb-8">
                        <h3 className="text-lg font-semibold text-textColor">Monthly Trend ({selectedYear})</h3>
                        <p className="text-sm text-textColor opacity-60 mt-0.5">Your monthly spending velocity</p>
                    </div>
                    {yearlyData?.monthlyBreakdown?.length > 0 ? (
                        <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                <LineChart data={yearlyData.monthlyBreakdown} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                    <XAxis
                                        dataKey="month"
                                        tickFormatter={val => MONTHS[val - 1] || val}
                                        axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 13, fontWeight: 500}} dy={15}
                                    />
                                    <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                                    <Tooltip
                                        cursor={{stroke: '#E5E7EB', strokeWidth: 2}}
                                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                                        formatter={v => `₹${v.toLocaleString()}`}
                                        labelFormatter={val => MONTHS[val - 1] || val}
                                    />
                                    <Line
                                        isAnimationActive={false}
                                        type="monotone"
                                        dataKey="totalAmount"
                                        name="Expense"
                                        stroke="#2563EB"
                                        strokeWidth={4}
                                        dot={{ r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                                        activeDot={{ r: 7 }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    ) : (
                        <div className="h-64 w-full flex items-center justify-center text-sm text-textColor opacity-40 italic bg-background/50 rounded-xl">
                            No yearly data available
                        </div>
                    )}
                </div>
            </div>

            {/* Empty State Overlay / Fallback */}
            {categoryData.length === 0 && totalIncome === 0 && (
                <div className="bg-card rounded-2xl border border-background p-12 text-center shadow-sm mt-6">
                    <div className="flex flex-col items-center gap-3">
                        <MdAttachMoney className="w-16 h-16 text-textColor opacity-20" />
                        <h3 className="text-lg font-medium text-textColor opacity-70">No Data Available</h3>
                        <p className="text-textColor opacity-50 text-sm">
                            No income or expense records found for {MONTHS[selectedMonth - 1]} {selectedYear}.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Reports;