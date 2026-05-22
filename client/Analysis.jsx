import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { API } from '../context/AuthContext';
import {
    LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    MdTrendingUp, MdTrendingDown, MdLightbulb,
    MdHealthAndSafety, MdRefresh, MdAutoGraph
} from 'react-icons/md';

const Analysis = () => {
    const today = new Date();
    const [selectedMonth, setSelectedMonth] = useState(today.getMonth() + 1);
    const [selectedYear, setSelectedYear] = useState(today.getFullYear());
    
    const [analysis, setAnalysis] = useState(null);
    const [monthlyData, setMonthlyData] = useState(null);
    const [yearlyData, setYearlyData] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const fetchData = async () => {
        setLoading(true);
        setError(false);
        try {
            const [analysisRes, monthlyRes, yearlyRes] = await Promise.all([
                axios.get(`${API}/analysis/summary`).catch(() => ({ data: null })),
                axios.get(`${API}/reports/monthly?month=${selectedMonth}&year=${selectedYear}`).catch(() => ({ data: null })),
                axios.get(`${API}/reports/yearly?year=${selectedYear}`).catch(() => ({ data: null }))
            ]);

            if (analysisRes.data) setAnalysis(analysisRes.data);
            if (monthlyRes.data) setMonthlyData(monthlyRes.data);
            if (yearlyRes.data) setYearlyData(yearlyRes.data);
            
            if (!analysisRes.data && !monthlyRes.data) setError(true);
        } catch (error) {
            toast.error('Failed to load financial analysis.');
            setError(true);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [selectedMonth, selectedYear]);

    if (loading && !analysis) {
        return (
            <div className="space-y-6 bg-transparent">
                <div className="h-48 bg-card rounded-2xl animate-pulse"></div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => <div key={i} className="h-40 bg-card rounded-2xl animate-pulse"></div>)}
                </div>
                <div className="h-72 bg-card rounded-2xl animate-pulse"></div>
            </div>
        );
    }

    if (error && !analysis) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-card rounded-2xl shadow-sm border border-background">
                <p className="text-danger font-medium opacity-80">Could not load analysis data.</p>
                <button
                    onClick={fetchData}
                    className="mt-4 flex items-center gap-1.5 px-5 py-2.5 bg-primary text-card text-sm font-medium rounded-xl hover:opacity-90 transition-all shadow-sm"
                >
                    <MdRefresh className="text-lg" /> Retry Connection
                </button>
            </div>
        );
    }

    // Processing Backend Data
    const prediction = Number(analysis?.futureExpensePrediction) || 0;
    const healthScoreRaw = analysis?.financialHealthScore || '0/100';
    const healthScore = parseInt(healthScoreRaw.split('/')[0], 10) || 0;

    const healthColor = healthScore >= 80 ? 'text-secondary' : healthScore >= 50 ? 'text-primary' : 'text-danger';
    const healthBarColor = healthScore >= 80 ? 'bg-secondary' : healthScore >= 50 ? 'bg-primary' : 'bg-danger';

    // Processing Trend Data
    const trendData = MONTHS.map((m, i) => {
        const monthData = yearlyData?.monthlyBreakdown?.find(d => d.month === i + 1);
        return { name: m, spent: monthData?.totalAmount || 0 };
    });

    const averageDailyExpense = monthlyData?.totalSpent ? (monthlyData.totalSpent / new Date(selectedYear, selectedMonth, 0).getDate()).toFixed(0) : 0;
    const savingsRate = monthlyData?.totalIncome > 0 ? (((monthlyData.totalIncome - monthlyData.totalSpent) / monthlyData.totalIncome) * 100).toFixed(1) : 0;

    return (
        <div className="space-y-6 bg-transparent pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textColor">Analysis</h1>
                    <p className="text-sm text-textColor/60 mt-1">Smart financial overview and insights</p>
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
                        {[0, 1, 2].map(o => {
                            const y = today.getFullYear() - o;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>
                </div>
            </div>

            {/* Smart Expense Prediction */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl shadow-md p-8 text-card relative overflow-hidden transition-all duration-300">
                <div className="absolute -right-10 -top-10 bg-card/10 w-48 h-48 rounded-full blur-2xl"></div>
                <div className="absolute -left-10 -bottom-10 bg-card/10 w-32 h-32 rounded-full blur-xl"></div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="flex items-center gap-3 mb-4">
                            <div className="bg-card/20 rounded-xl p-2.5 backdrop-blur-sm shadow-sm">
                                <MdLightbulb className="w-6 h-6 text-card" />
                            </div>
                            <h2 className="text-lg font-bold tracking-wide">Expense Prediction</h2>
                        </div>
                        <p className="text-white/80 text-sm max-w-sm leading-relaxed">
                            Based on your rolling average, our intelligence predicts your expenses next month to be:
                        </p>
                    </div>
                    <div className="md:text-right w-full md:w-auto">
                        {prediction > 0 ? (
                            <>
                                <p className="text-4xl md:text-5xl font-black drop-shadow-md tracking-tight">
                                    ₹{prediction.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                </p>
                                <div className="inline-flex mt-3 bg-card/20 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/20">
                                    <p className="text-xs font-bold text-white tracking-wide">
                                        {prediction > (monthlyData?.totalIncome || 0) ? '⚠️ Alert: May exceed current income' : '✓ Spending under control'}
                                    </p>
                                </div>
                            </>
                        ) : (
                            <p className="text-white/90 text-sm font-medium italic">
                                Insufficient historical data to construct predictions.
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Core Insights Row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                {/* Health Score */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-background rounded-xl p-2.5">
                            <MdHealthAndSafety className={`w-5 h-5 ${healthColor}`} />
                        </div>
                        <h3 className="text-sm font-semibold text-textColor opacity-70">Health Score</h3>
                    </div>
                    <div className="flex items-baseline gap-1">
                        <span className={`text-4xl font-black ${healthColor}`}>{healthScore}</span>
                        <span className="text-lg text-textColor opacity-40 font-bold">/100</span>
                    </div>
                    <div className="w-full mt-6 bg-background rounded-full h-2">
                        <div
                            className={`h-2 rounded-full transition-all duration-1000 ${healthBarColor}`}
                            style={{ width: `${Math.min(100, healthScore)}%` }}
                        />
                    </div>
                </div>

                {/* Average Daily Expense */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-background rounded-xl p-2.5">
                                <MdAutoGraph className="w-5 h-5 text-primary" />
                            </div>
                            <h3 className="text-sm font-semibold text-textColor opacity-70">Daily Spend Rate</h3>
                        </div>
                        <p className="text-4xl font-black text-textColor">₹{Number(averageDailyExpense).toLocaleString()}</p>
                    </div>
                    <p className="text-xs text-textColor opacity-50 font-medium">Average spent per day</p>
                </div>

                {/* Savings Rate */}
                <div className="bg-card rounded-2xl border border-background shadow-sm p-6 hover:shadow-md transition-all duration-300 flex flex-col justify-between">
                    <div>
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-background rounded-xl p-2.5">
                                {savingsRate >= 0 ? <MdTrendingUp className="w-5 h-5 text-secondary" /> : <MdTrendingDown className="w-5 h-5 text-danger" />}
                            </div>
                            <h3 className="text-sm font-semibold text-textColor opacity-70">Savings Rate</h3>
                        </div>
                        <p className={`text-4xl font-black ${savingsRate >= 0 ? 'text-secondary' : 'text-danger'}`}>{savingsRate}%</p>
                    </div>
                    <p className="text-xs text-textColor opacity-50 font-medium">Income retention metric</p>
                </div>
            </div>

            {/* Annual Trend Chart */}
            <div className="bg-card rounded-2xl border border-background shadow-sm p-6 pb-8 transition-all duration-300">
                <div className="mb-8">
                    <h3 className="text-lg font-semibold text-textColor">Annual Spending Trend</h3>
                    <p className="text-sm text-textColor/60 mt-0.5">Month-by-month expenditure trajectory</p>
                </div>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                        <LineChart data={trendData} margin={{ top: 5, right: 20, left: 10, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 13, fontWeight: 500}} dy={15} />
                            <YAxis axisLine={false} tickLine={false} tick={{fill: '#9CA3AF', fontSize: 12}} dx={-10} tickFormatter={(val) => `₹${val/1000}k`} />
                            <Tooltip
                                cursor={{stroke: '#E5E7EB', strokeWidth: 2}}
                                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', padding: '12px' }}
                            />
                            <Line type="monotone" dataKey="spent" name="Spent" stroke="#2563EB" strokeWidth={4} dot={{r: 5, fill: '#2563EB', strokeWidth: 2, stroke: '#FFFFFF'}} activeDot={{r: 7}} />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
};

export default Analysis;