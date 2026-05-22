import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../context/AuthContext';
import { toast } from 'react-toastify';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';
import {
    MdGroup, MdTrendingUp, MdTrendingDown, MdAccountBalance,
    MdAttachMoney, MdLightbulb, MdArrowForward
} from 'react-icons/md';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

// ==========================================
// PERSONAL DASHBOARD
// ==========================================
// Renders financial health scores, predictive analytics, and smart insights
const Dashboard = () => {
    const { setAppMode, setSelectedGroupId } = useContext(AuthContext);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();
    const [analysis, setAnalysis] = useState(null);
    const [monthlyReport, setMonthlyReport] = useState(null);
    const [budgetStatus, setBudgetStatus] = useState(null);

    // ==========================================
    // DATA SYNCHRONIZATION
    // ==========================================
    // Executes concurrent API calls to fetch analysis, reports, and budgets
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const today = new Date();
                const month = today.getMonth() + 1;
                const year = today.getFullYear();

                const [analysisRes, reportRes, budgetRes] = await Promise.all([
                    axios.get(`${API}/analysis/summary`).catch(() => ({ data: null })),
                    axios.get(`${API}/reports/monthly?month=${month}&year=${year}`).catch(() => ({ data: null })),
                    axios.get(`${API}/budget?month=${month}&year=${year}`).catch(() => ({ data: null }))
                ]);

                setAnalysis(analysisRes.data);
                setMonthlyReport(reportRes.data);
                setBudgetStatus(budgetRes.data);
            } catch (error) {
                toast.error('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, []);

    const handleSwitchToGroup = async () => {
        try {
            const res = await axios.get(`${API}/groups`);
            if (res.data.length > 0) {
                setSelectedGroupId(res.data[0]._id);
                setAppMode('group');
                navigate('/groups/dashboard');
            } else {
                toast.info("You don't have any groups yet. Please create one.");
                navigate('/groups');
            }
        } catch (error) {
            toast.error("Failed to load groups");
            navigate('/groups');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 bg-transparent animate-pulse">
                <div className="h-10 bg-card rounded-xl w-48"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <div className="h-96 bg-card rounded-2xl"></div>
                    <div className="h-96 bg-card rounded-2xl"></div>
                </div>
            </div>
        );
    }

    const categoryData = monthlyReport?.categoryWise?.map(cat => ({
        name: cat.category,
        value: cat.totalAmount
    })) || [];

    const incomePercentage = monthlyReport?.totalIncome ?
        ((monthlyReport.totalSpent / monthlyReport.totalIncome) * 100) : 0;

    const budgetPercentage = budgetStatus?.budget ?
        ((budgetStatus.totalSpent / budgetStatus.budget) * 100) : 0;

    return (
        <div className="space-y-8 pb-10">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textColor tracking-tight">Dashboard Overview</h1>
                    <p className="text-sm text-textColor opacity-60 mt-1">Real-time financial tracking and insights</p>
                </div>
                <button
                    onClick={handleSwitchToGroup}
                    className="flex items-center gap-2 px-5 py-2.5 bg-card border border-background text-textColor font-semibold rounded-xl hover:bg-background transition-all duration-300 shadow-sm group"
                >
                    <MdGroup className="text-xl text-primary group-hover:scale-110 transition-transform" />
                    <span>Switch to Group</span>
                    <MdArrowForward className="text-lg opacity-40" />
                </button>
            </div>

            {/* Smart Decision Support System: Displays predictive insights from analysisController */}
            {analysis?.insights && analysis.insights.length > 0 && (
                <div className="bg-secondary/5 border border-secondary/20 rounded-xl p-3 shadow-sm">
                    <div className="flex items-center gap-2 mb-2 px-1">
                        <MdLightbulb className="text-secondary text-base" />
                        <h3 className="text-sm font-bold text-textColor tracking-tight">Decision Support Insights</h3>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        {analysis.insights.map((insight, idx) => (
                            <div key={idx} className="flex items-start gap-2 px-1">
                                <span className="text-sm shrink-0">{insight.icon}</span>
                                <p className="text-textColor/80 font-medium text-xs leading-snug">{insight.text}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Top Summary Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Income */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-textColor opacity-50 uppercase tracking-widest text-primary">Total Income</p>
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <MdAttachMoney className="text-secondary text-xl" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-textColor">₹{(monthlyReport?.totalIncome || 0).toLocaleString()}</p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-secondary rounded-full w-full opacity-80"></div>
                    </div>
                </div>

                {/* Total Expense */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-textColor opacity-50 uppercase tracking-widest text-primary">Total Expense</p>
                        <div className="p-2 bg-danger/10 rounded-lg">
                            <MdTrendingUp className="text-danger text-xl" />
                        </div>
                    </div>
                    <p className="text-3xl font-black text-textColor">₹{(monthlyReport?.totalSpent || 0).toLocaleString()}</p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${incomePercentage > 90 ? 'bg-danger' : 'bg-primary'}`}
                            style={{ width: `${Math.min(incomePercentage, 100)}%` }}>
                        </div>
                    </div>
                </div>

                {/* Remaining Budget */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-textColor opacity-50 uppercase tracking-widest text-primary">Remaining Budget</p>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MdAccountBalance className="text-primary text-xl" />
                        </div>
                    </div>
                    <p className={`text-3xl font-black ${budgetStatus?.isExceeded ? 'text-danger' : 'text-textColor'}`}>
                        ₹{(budgetStatus?.remaining || 0).toLocaleString()}
                    </p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${budgetStatus?.isExceeded ? 'bg-danger' : 'bg-primary opacity-60'}`}
                            style={{ width: `${Math.min(budgetPercentage, 100)}%` }}>
                        </div>
                    </div>
                </div>

                {/* Balance */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold text-textColor opacity-50 uppercase tracking-widest text-primary">Net Balance</p>
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <MdTrendingDown className="text-secondary text-xl rotate-180" />
                        </div>
                    </div>
                    <p className={`text-3xl font-black ${monthlyReport?.remainingBalance < 0 ? 'text-danger' : 'text-textColor'}`}>
                        ₹{(monthlyReport?.remainingBalance || 0).toLocaleString()}
                    </p>
                    <p className="text-[10px] text-textColor opacity-40 font-bold uppercase mt-4">Income vs Outcome Flow</p>
                </div>
            </div>

            {/* Charts & Insights Section */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                {/* Category Distribution (Left: 4 Units) */}
                <div className="lg:col-span-4 bg-card rounded-3xl border border-background p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-8 text-secondary">
                        <div>
                            <h3 className="text-xl font-bold text-textColor tracking-tight">Category Distribution</h3>
                            <p className="text-sm text-textColor opacity-50 mt-1">Monthly spending breakdown</p>
                        </div>
                    </div>

                    {categoryData.length > 0 ? (
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            {/* Donut Chart */}
                            <div className="h-64 w-64 shrink-0 min-w-[256px] min-h-[256px]">
                                <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
                                    <PieChart>
                                        <Pie
                                            data={categoryData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {categoryData.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                            ))}
                                        </Pie>
                                        <Tooltip
                                            contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 4px 15px rgba(0,0,0,0.05)' }}
                                            formatter={(val) => `₹${val.toLocaleString()}`}
                                        />
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Detailed Legend */}
                            <div className="w-full space-y-3">
                                {categoryData.slice(0, 5).map((cat, index) => (
                                    <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-background/40 hover:bg-background/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-sm font-semibold text-textColor/80">{cat.name}</span>
                                        </div>
                                        <span className="text-sm font-bold text-textColor">₹{cat.value.toLocaleString()}</span>
                                    </div>
                                ))}
                                {categoryData.length > 5 && (
                                    <p className="text-center text-[10px] text-textColor opacity-40 font-bold uppercase pt-2">+{categoryData.length - 5} More Categories</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-background/50 rounded-2xl border border-dashed border-background">
                            <MdAccountBalance className="text-4xl text-textColor opacity-20 mb-3" />
                            <p className="text-textColor opacity-50 font-medium">No spending data to visualize</p>
                        </div>
                    )}
                </div>

                {/* Smart Analysis (Right: 3 Units) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    <div className="h-full bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-card relative overflow-hidden shadow-lg group">
                        <div className="absolute -right-12 -top-12 bg-card/10 w-48 h-48 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -left-12 -bottom-12 bg-card/10 w-40 h-40 rounded-full blur-2xl"></div>

                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-card/20 rounded-2xl backdrop-blur-sm border border-card/10">
                                    <MdLightbulb className="text-2xl text-card" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight text-white">Smart Analysis</h3>
                                </div>
                            </div>

                            <div className="space-y-6 mt-auto">
                                <div>
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Top Spending Pattern</p>
                                    <p className="text-2xl md:text-3xl font-black text-white leading-tight">
                                        {analysis?.spendingPattern?.topCategory || 'Gathering insights...'}
                                    </p>
                                </div>

                                {/* Pattern-Based Analytics: Derived from 30-day rolling averages */}
                                {analysis?.patternControl && (
                                    <div className="pt-6 border-t border-white/10">
                                        <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Expense Control</p>
                                        <p className="text-base text-white/90 leading-relaxed font-medium">
                                            Your average daily expense is <strong className="text-white">₹{Number(analysis.patternControl.averageDailyExpense).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong> — expected monthly <strong className="text-white">₹{Number(analysis.patternControl.expectedMonthly).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</strong>
                                        </p>
                                    </div>
                                )}

                                <div className="pt-6 border-t border-white/10">
                                    <p className="text-xs font-bold text-white/50 uppercase tracking-widest mb-2">Prediction Next Month</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-white">
                                            ₹{Number(analysis?.futureExpensePrediction || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                                        </p>
                                        <div className="bg-card/20 px-2 py-0.5 rounded text-[10px] font-bold uppercase text-white/80">Est.</div>
                                    </div>
                                    <p className="text-xs text-white/50 mt-4 leading-relaxed italic">
                                        "Focus on controlling <strong>{analysis?.spendingPattern?.topCategory || 'expenditures'}</strong> to increase your health score."
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Dashboard;