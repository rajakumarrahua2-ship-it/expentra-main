import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdWarning, MdAccountBalance, MdTrendingUp, MdSavings, MdTrackChanges, MdAttachMoney } from 'react-icons/md';
import { API } from '../context/AuthContext';

const SemiCircleProgress = ({ title, value, max, colorClass, isRed }) => {
    let percentage = 0;
    if (max > 0) percentage = Math.min(100, Math.max(0, (value / max) * 100));
    else if (value > 0) percentage = 100;

    const circumference = 125.66; // Math.PI * 40
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="bg-card rounded-3xl p-6 flex flex-col items-center justify-between border border-background shadow-sm hover:shadow-md transition-all duration-300">
            <h3 className={`text-lg font-semibold mb-6 ${isRed ? 'text-danger' : 'text-primary'}`}>
                {title}
            </h3>
            
            <div className="relative flex flex-col items-center w-full">
                <div className="w-[160px] sm:w-[140px] lg:w-[180px] relative mt-2">
                    <svg viewBox="0 0 100 55" className="w-full overflow-visible fallbacks">
                        {/* Background Arc */}
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            className="stroke-gray-100"
                            strokeWidth="12"
                            strokeLinecap="round"
                        />
                        {/* Foreground Arc */}
                        <path
                            d="M 10 50 A 40 40 0 0 1 90 50"
                            fill="none"
                            className={`stroke-current ${colorClass}`}
                            strokeWidth="12"
                            strokeLinecap="round"
                            strokeDasharray={circumference}
                            strokeDashoffset={strokeDashoffset}
                            style={{ transition: 'all 1s ease-out' }}
                        />
                    </svg>
                    <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex flex-col items-center w-full">
                        <span className="text-xl lg:text-2xl font-bold text-textColor">₹{Number(value).toLocaleString()}</span>
                        <span className="text-xs lg:text-sm font-medium text-textColor opacity-60 mt-0.5">{percentage.toFixed(1)}%</span>
                    </div>
                </div>
            </div>
            
            <p className="text-xs text-textColor opacity-40 mt-8 pt-4 w-full text-center border-t border-background">
                Current month data
            </p>
        </div>
    );
};

const Budget = () => {
    const [budgetStatus, setBudgetStatus] = useState(null);
    const [amount, setAmount] = useState('');
    const [savingGoal, setSavingGoal] = useState('');
    const [loading, setLoading] = useState(true);
    const [monthlyReport, setMonthlyReport] = useState(null);

    const today = new Date();
    const month = today.getMonth() + 1;
    const year = today.getFullYear();
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const fetchBudgetAndReport = async () => {
        try {
            setLoading(true);
            const [budgetRes, reportRes] = await Promise.all([
                axios.get(`${API}/budget?month=${month}&year=${year}`).catch(() => ({ data: null })),
                axios.get(`${API}/reports/monthly?month=${month}&year=${year}`).catch(() => ({ data: null }))
            ]);

            if (budgetRes.data) {
                setBudgetStatus(budgetRes.data);
                setAmount(budgetRes.data.budget || '');
                setSavingGoal(budgetRes.data.savingGoal || '');
            } else {
                setBudgetStatus(null);
            }

            if (reportRes.data) {
                setMonthlyReport(reportRes.data);
            }
        } catch (error) {
            toast.error('Failed to load data');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchBudgetAndReport();
    }, []);

    const handleSetBudget = async (e) => {
        e.preventDefault();
        if (Number(amount) <= 0) {
            toast.error('Budget amount must be greater than 0');
            return;
        }
        try {
            await axios.post(`${API}/budget`, {
                month,
                year,
                limitAmount: Number(amount),
                savingGoal: savingGoal ? Number(savingGoal) : 0,
            });
            toast.success('Budget saved successfully!');
            fetchBudgetAndReport();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to set budget');
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 bg-transparent">
                <div className="h-8 bg-card rounded w-1/4 animate-pulse"></div>
                <div className="h-32 bg-card rounded-2xl animate-pulse"></div>
                <div className="h-64 bg-card rounded-2xl animate-pulse"></div>
            </div>
        );
    }

    const incomeToUse = monthlyReport?.totalIncome > 0 ? monthlyReport.totalIncome : (budgetStatus?.budget || 0);
    const currentSavings = incomeToUse - (budgetStatus?.totalSpent || 0);

    const savingsProgress = budgetStatus?.savingGoal > 0
        ? Math.min(100, (Math.max(0, currentSavings) / budgetStatus.savingGoal) * 100)
        : 0;

    return (
        <div className="space-y-6 bg-transparent">
            {/* Header */}
            <div>
                <h1 className="text-2xl md:text-3xl font-bold text-textColor">Budget & Savings</h1>
                <p className="text-sm text-textColor opacity-70 mt-1">Manage limits and track your goals for {MONTHS[month - 1]} {year}</p>
            </div>

            {/* Set Budget Form */}
            <div className="bg-card rounded-2xl border border-background shadow-sm overflow-hidden transition-all duration-200">
                <div className="p-6 pb-4 border-b border-background flex items-center justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-textColor">Budget Configuration</h2>
                        <p className="text-sm text-textColor opacity-60 mt-0.5">Define your monthly limits</p>
                    </div>
                </div>
                <form onSubmit={handleSetBudget} className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                        <div>
                            <label className="block text-sm font-medium text-textColor opacity-80 mb-2 flex items-center gap-1.5">
                                <MdAttachMoney className="text-primary text-lg" />
                                Max Spend Limit (₹)
                            </label>
                            <input
                                type="number" required min="1"
                                value={amount}
                                onChange={e => setAmount(e.target.value)}
                                placeholder="e.g. 30000"
                                className="block w-full px-4 py-2.5 bg-background border border-background text-textColor rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all duration-200 shadow-sm"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-textColor opacity-80 mb-2 flex items-center gap-1.5">
                                <MdTrackChanges className="text-secondary text-lg" />
                                Savings Goal (₹)
                                <span className="text-textColor opacity-40 text-xs ml-1">(Optional)</span>
                            </label>
                            <input
                                type="number" min="0"
                                value={savingGoal}
                                onChange={e => setSavingGoal(e.target.value)}
                                placeholder="e.g. 5000"
                                className="block w-full px-4 py-2.5 bg-background border border-background text-textColor rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary/20 transition-all duration-200 shadow-sm"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-2.5 bg-primary text-card rounded-xl hover:opacity-90 transition-all duration-200 font-medium shadow-sm hover:shadow-md"
                        >
                            Save Configuration
                        </button>
                    </div>
                </form>
            </div>

            {/* Budget Overview */}
            {budgetStatus && (
                <div className="space-y-6">
                    {/* Warning Banner */}
                    {budgetStatus.warning && (
                        <div className={`rounded-xl border-l-4 p-4 shadow-sm flex items-start gap-3 transition-all duration-200 ${budgetStatus.isExceeded
                                ? 'bg-card border-danger'
                                : 'bg-card border-danger'
                            }`}>
                            <MdWarning className={`w-6 h-6 shrink-0 ${budgetStatus.isExceeded ? 'text-danger' : 'text-danger'
                                }`} />
                            <div>
                                <h3 className={`font-semibold ${budgetStatus.isExceeded ? 'text-danger' : 'text-danger'
                                    }`}>
                                    {budgetStatus.isExceeded ? 'Budget Exceeded!' : 'Approaching Budget Limit'}
                                </h3>
                                <p className={`mt-0.5 text-sm ${budgetStatus.isExceeded ? 'text-danger opacity-80' : 'text-danger opacity-80'
                                    }`}>
                                    {budgetStatus.warning}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Budget vs Income Discrepancy Note */}
                    {budgetStatus.budget > (monthlyReport?.totalIncome || 0) && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 px-3 py-2.5 rounded-lg text-xs text-amber-800 font-medium w-fit">
                            <MdWarning className="shrink-0 text-sm mt-0.5 text-amber-500" />
                            <span>Your Max Spend Limit (₹{budgetStatus.budget.toLocaleString()}) exceeds your recorded Income (₹{(monthlyReport?.totalIncome || 0).toLocaleString()}). Consider adjusting your budget.</span>
                        </div>
                    )}

                    {/* Top Summary Cards (Horizontal Structure) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-xl shrink-0">
                                <MdAccountBalance className="text-primary text-2xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-textColor opacity-60 uppercase tracking-wide">Total Budget</p>
                                <p className="text-2xl font-bold text-textColor mt-1">₹{budgetStatus.budget.toLocaleString()}</p>
                                <p className="text-xs text-textColor opacity-40 mt-1">Monthly Limit</p>
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                            <div className="bg-danger/10 p-3 rounded-xl shrink-0">
                                <MdTrendingUp className="text-danger text-2xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-textColor opacity-60 uppercase tracking-wide">Spent Budget</p>
                                <p className="text-2xl font-bold text-danger mt-1">₹{budgetStatus.totalSpent.toLocaleString()}</p>
                                <p className="text-xs text-textColor opacity-40 mt-1">
                                    {((budgetStatus.totalSpent / budgetStatus.budget) * 100).toFixed(1)}% used
                                </p>
                            </div>
                        </div>

                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-200 flex items-start gap-4">
                            <div className="bg-secondary/10 p-3 rounded-xl shrink-0">
                                <MdSavings className="text-secondary text-2xl" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-textColor opacity-60 uppercase tracking-wide">Remaining Budget</p>
                                <p className={`text-2xl font-bold mt-1 ${budgetStatus.remaining < 0 ? 'text-danger' : 'text-secondary'}`}>
                                    ₹{budgetStatus.remaining.toLocaleString()}
                                </p>
                                <p className="text-xs text-textColor opacity-40 mt-1">Available to spend</p>
                            </div>
                        </div>
                    </div>

                    {/* Utilization Sector (Semi-Circles) */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <SemiCircleProgress
                            title="Budget Used"
                            value={budgetStatus.totalSpent}
                            max={budgetStatus.budget}
                            colorClass="text-danger"
                            isRed={true}
                        />
                        <SemiCircleProgress
                            title="Remaining Budget"
                            value={Math.max(0, budgetStatus.remaining)}
                            max={budgetStatus.budget}
                            colorClass="text-primary"
                        />
                        <SemiCircleProgress
                            title="Savings"
                            value={Math.max(0, currentSavings)}
                            max={budgetStatus.savingGoal || budgetStatus.budget}
                            colorClass="text-secondary"
                        />
                    </div>

                    {/* Goal Tracker */}
                    {budgetStatus.savingGoal > 0 && (
                        <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-200">
                            <div className="flex items-center justify-between mb-8">
                                <div className="flex items-center gap-3">
                                    <div className="p-3 bg-secondary/10 rounded-xl">
                                        <MdTrackChanges className="w-6 h-6 text-secondary" />
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-textColor text-lg">Savings Goal Tracker</h3>
                                        <p className="text-xs text-textColor opacity-60 mt-0.5">Track your progress toward your financial target</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-2xl font-bold text-secondary">{savingsProgress.toFixed(1)}%</p>
                                    <p className="text-xs text-textColor opacity-50 font-medium">Achieved</p>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-end mb-2 text-sm font-medium">
                                <div className="text-textColor opacity-70">
                                    Saved: <span className={currentSavings >= budgetStatus.savingGoal ? 'text-secondary' : 'text-textColor'}>₹{Math.max(0, currentSavings).toLocaleString()}</span>
                                </div>
                                <div className="text-textColor opacity-70">
                                    Target: <span>₹{budgetStatus.savingGoal.toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="w-full bg-background border border-background rounded-full h-3 shadow-sm p-0.5">
                                <div
                                    className="h-full rounded-full bg-secondary transition-all duration-1000"
                                    style={{ width: `${savingsProgress}%` }}
                                />
                            </div>

                        </div>
                    )}
                </div>
            )}

            {/* Empty State */}
            {!budgetStatus && !loading && (
                <div className="bg-card rounded-2xl border border-background p-12 text-center transition-all duration-200">
                    <div className="flex flex-col items-center gap-4">
                        <div className="p-5 bg-background shadow-sm rounded-full">
                            <MdAccountBalance className="w-12 h-12 text-textColor opacity-20" />
                        </div>
                        <div>
                            <h3 className="text-xl font-semibold text-textColor opacity-80">No Budget Set</h3>
                            <p className="text-textColor opacity-60 text-sm mt-1 max-w-sm">
                                You haven't set a budget for {MONTHS[month - 1]} {year}.
                                Configure your limits above to activate dashboard tracking.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Budget;