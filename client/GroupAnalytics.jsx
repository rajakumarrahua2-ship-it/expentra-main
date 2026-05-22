import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
    PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import {
    MdTrendingUp, MdCategory, MdPerson, MdGroup, MdAttachMoney,
    MdShowChart, MdReceipt, MdAutoGraph, MdTrendingDown, MdHealthAndSafety
} from 'react-icons/md';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC489A', '#06B6D4', '#84CC16'];

const GroupAnalytics = () => {
    const { selectedGroupId } = useContext(AuthContext);
    const [expenses, setExpenses] = useState([]);
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedGroupId) return;

        const fetchData = async () => {
            try {
                const [expRes, groupRes] = await Promise.all([
                    axios.get(`${API}/group-expenses/${selectedGroupId}`),
                    axios.get(`${API}/groups/${selectedGroupId}`)
                ]);
                setExpenses(expRes.data);
                setGroupData(groupRes.data);
            } catch (error) {
                toast.error("Failed to load group analytics data");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedGroupId]);

    if (!selectedGroupId) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-card rounded-lg border border-background p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdGroup className="w-8 h-8 text-textColor/50" />
                    </div>
                    <h3 className="text-xl font-semibold text-textColor">No Group Selected</h3>
                    <p className="text-textColor/70 mt-2">Please select a group from the Groups menu first.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="space-y-4">
                    <div className="h-8 bg-card rounded w-1/4 animate-pulse"></div>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i} className="h-28 bg-card rounded-lg animate-pulse"></div>
                        ))}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        <div className="h-96 bg-card rounded-lg animate-pulse"></div>
                        <div className="h-96 bg-card rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    const totalSpent = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    // Category wise spending
    const categoryMap = {};
    expenses.forEach(exp => {
        const cat = exp.category || 'General';
        categoryMap[cat] = (categoryMap[cat] || 0) + exp.amount;
    });
    const categoryData = Object.keys(categoryMap).map(key => ({
        name: key,
        value: categoryMap[key]
    })).sort((a, b) => b.value - a.value);

    // Who paid how much
    const paidByMap = {};
    expenses.forEach(exp => {
        if (Array.isArray(exp.paidBy)) {
            exp.paidBy.forEach(payer => {
                const name = payer.name || 'Unknown';
                paidByMap[name] = (paidByMap[name] || 0) + payer.amount;
            });
        } else {
            const name = exp.paidBy?.name || 'Unknown';
            paidByMap[name] = (paidByMap[name] || 0) + exp.amount;
        }
    });
    const paidByData = Object.keys(paidByMap).map(key => ({
        name: key,
        amount: paidByMap[key]
    })).sort((a, b) => b.amount - a.amount);

    // Monthly trend data
    const monthlyMap = {};
    expenses.forEach(exp => {
        const date = new Date(exp.date);
        const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
        const monthName = date.toLocaleString('default', { month: 'short' });
        if (!monthlyMap[monthKey]) {
            monthlyMap[monthKey] = { month: monthName, amount: 0, count: 0 };
        }
        monthlyMap[monthKey].amount += exp.amount;
        monthlyMap[monthKey].count += 1;
    });
    const monthlyData = Object.values(monthlyMap).sort((a, b) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        return months.indexOf(a.month) - months.indexOf(b.month);
    });

    const avgExpense = expenses.length > 0 ? totalSpent / expenses.length : 0;
    const topPayer = paidByData[0]?.name || 'N/A';
    const topCategory = categoryData[0]?.name || 'N/A';

    return (
        <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-2xl font-bold text-textColor">Group Analytics</h1>
                <p className="text-textColor/70 text-sm mt-1">
                    {groupData?.name} • Spending insights
                </p>
            </div>

            {expenses.length === 0 ? (
                <div className="bg-card rounded-lg border border-background p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdShowChart className="w-8 h-8 text-textColor/50" />
                    </div>
                    <h3 className="text-lg font-semibold text-textColor">No Data Available</h3>
                    <p className="text-textColor/70 mt-2">Add expenses to this group to see analytics.</p>
                </div>
            ) : (
                <>
                    {/* Summary Cards */}
                    {/* Unified Insight Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {/* Total Spending */}
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-background rounded-xl p-2.5">
                                    <MdAttachMoney className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-textColor/40">Total Group Spend</h3>
                            </div>
                            <p className="text-xl font-bold text-textColor">₹{totalSpent.toLocaleString()}</p>
                            <p className="text-[10px] font-bold text-primary mt-1">{expenses.length} transactions recorded</p>
                        </div>

                        {/* Top Payer */}
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-background rounded-xl p-2.5">
                                    <MdPerson className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-textColor/40">Top Contributor</h3>
                            </div>
                            <p className="text-xl font-bold text-textColor truncate">{topPayer}</p>
                            <p className="text-[10px] font-bold text-primary mt-1">Highest squad contributor</p>
                        </div>

                        {/* Top Category */}
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="bg-background rounded-xl p-2.5">
                                    <MdCategory className="w-5 h-5 text-primary" />
                                </div>
                                <h3 className="text-[10px] font-black uppercase tracking-widest text-textColor/40">Top Spending Cat</h3>
                            </div>
                            <p className="text-xl font-bold text-textColor truncate">{topCategory}</p>
                            <p className="text-[10px] font-bold text-primary mt-1">Most frequent group expense</p>
                        </div>
                    </div>

                    {/* Charts Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category Pie Chart */}
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                    <MdCategory className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-textColor">Spending by Category</h3>
                                    <p className="text-[10px] font-medium text-textColor/50 uppercase tracking-widest leading-none mt-1">Mix Breakdown</p>
                                </div>
                            </div>
                            <div className="h-72 w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={60}
                                            outerRadius={80}
                                            paddingAngle={4}
                                            dataKey="value"
                                            label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                                            labelLine={false}
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -1px rgba(0,0,0,0.1)', fontSize: '12px' }}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                                        />
                                        <Legend
                                            iconType="circle"
                                            layout="horizontal"
                                            verticalAlign="bottom"
                                            align="center"
                                            wrapperStyle={{ fontSize: '10px', fontWeight: 'bold', paddingTop: '10px' }}
                                            formatter={(value, entry) => {
                                                const item = categoryData.find(d => d.name === value);
                                                return <span className="text-textColor/70">{value}: ₹{item?.value.toLocaleString()}</span>;
                                            }}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Contributions Bar Chart */}
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                                    <MdPerson className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-sm font-bold text-textColor">Member Shares</h3>
                                    <p className="text-[10px] font-medium text-textColor/50 uppercase tracking-widest leading-none mt-1">Individual Contributions</p>
                                </div>
                            </div>
                            <div className="h-72 w-full mt-2">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <BarChart data={paidByData} layout="vertical" margin={{ left: 10 }}>
                                        <XAxis type="number" hide />
                                        <YAxis
                                            dataKey="name"
                                            type="category"
                                            axisLine={false}
                                            tickLine={false}
                                            tick={{ fill: '#9CA3AF', fontSize: 10, fontWeight: 'bold' }}
                                            width={100}
                                            tickFormatter={(value) => {
                                                const item = paidByData.find(d => d.name === value);
                                                return `${value} (₹${item?.amount.toLocaleString()})`;
                                            }}
                                        />
                                        <Tooltip
                                            cursor={{ fill: 'transparent' }}
                                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                                            formatter={(value) => [`₹${value.toLocaleString()}`, 'Paid']}
                                        />
                                        <Bar dataKey="amount" radius={[0, 10, 10, 0]} maxBarSize={25}>
                                            {paidByData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Bar>
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>

                        {/* Monthly Trend Chart */}
                        {monthlyData.length > 0 && (
                            <div className="bg-card rounded-2xl border border-background p-6 shadow-sm md:col-span-2">
                                <div className="flex items-center gap-3 mb-8">
                                    <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                                        <MdTrendingUp className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-textColor">Spending Trend</h3>
                                        <p className="text-[10px] font-medium text-textColor/50 uppercase tracking-widest leading-none mt-1">Monthly Flow</p>
                                    </div>
                                </div>
                                <div className="h-72 w-full">
                                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                        <LineChart data={monthlyData} margin={{ top: 10, right: 20, left: 10, bottom: 0 }}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                            <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11, fontWeight: 'bold' }} dy={10} />
                                            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#9CA3AF', fontSize: 11 }} tickFormatter={(val) => `₹${val / 1000}k`} />
                                            <Tooltip
                                                contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)' }}
                                                formatter={(value) => [`₹${value.toLocaleString()}`, 'Spent']}
                                            />
                                            <Line
                                                type="monotone"
                                                dataKey="amount"
                                                stroke="#2563EB"
                                                strokeWidth={4}
                                                dot={{ r: 4, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                                                activeDot={{ r: 6, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF' }}
                                            />
                                        </LineChart>
                                    </ResponsiveContainer>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            )}
        </div>
    );
};

export default GroupAnalytics;