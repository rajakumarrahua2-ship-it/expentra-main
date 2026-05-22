import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    MdGroup, MdAccountBalanceWallet,
    MdTrendingUp, MdPriorityHigh, MdShowChart, MdAttachMoney,
    MdArrowBack, MdCalendarToday, MdGroups
} from 'react-icons/md';
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer
} from 'recharts';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#06B6D4'];

const GroupDashboard = () => {
    const { selectedGroupId, user } = useContext(AuthContext);
    const [groupData, setGroupData] = useState(null);
    const [settlements, setSettlements] = useState(null);
    const [expenses, setExpenses] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!selectedGroupId) return;
        const fetchGroupDashboard = async () => {
            try {
                const [groupRes, settleRes, expRes] = await Promise.all([
                    axios.get(`${API}/groups/${selectedGroupId}`),
                    axios.get(`${API}/group-expenses/${selectedGroupId}/settlements`),
                    axios.get(`${API}/group-expenses/${selectedGroupId}`)
                ]);
                setGroupData(groupRes.data);
                setSettlements(settleRes.data);
                setExpenses(expRes.data);
            } catch (error) {
                toast.error('Failed to load group dashboard');
            } finally {
                setLoading(false);
            }
        };
        fetchGroupDashboard();
    }, [selectedGroupId]);

    if (!selectedGroupId) {
        return (
            <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center bg-card rounded-3xl border border-background shadow-sm mt-8 animate-in fade-in zoom-in-95 duration-500">
                <div className="w-20 h-20 bg-primary/5 rounded-full flex items-center justify-center mb-6">
                    <MdGroup className="w-10 h-10 text-primary opacity-40" />
                </div>
                <h3 className="text-xl font-bold text-textColor">No Group Selected</h3>
                <p className="text-textColor/60 mt-2 max-w-xs mx-auto">Please select a group from the Groups menu to view its dashboard.</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="space-y-8 bg-transparent animate-pulse">
                <div className="h-10 bg-card rounded-xl w-64"></div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => <div key={i} className="h-32 bg-card rounded-2xl"></div>)}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 h-96 bg-card rounded-3xl"></div>
                    <div className="h-96 bg-card rounded-3xl"></div>
                </div>
            </div>
        );
    }

    const totalGroupExpense = expenses.reduce((acc, exp) => acc + exp.amount, 0);

    // Payment map
    const paymentMap = {};
    expenses.forEach(exp => {
        exp.paidBy.forEach(p => {
            const id = p.user ? p.user.toString() : p.name;
            paymentMap[id] = (paymentMap[id] || 0) + p.amount;
        });
    });

    // Top payer
    let topPayer = { name: 'N/A', amount: 0 };
    Object.keys(paymentMap).forEach(id => {
        if (paymentMap[id] > topPayer.amount) {
            topPayer = {
                name: groupData.members.find(
                    m => (m.user && m.user.toString() === id) || m.name === id
                )?.name || 'Member',
                amount: paymentMap[id]
            };
        }
    });

    // Top debtor
    let topDebtor = { name: 'All Settled', amount: 0 };
    settlements?.balances?.forEach(b => {
        if (b.balance < topDebtor.amount) {
            topDebtor = { name: b.memberInfo.name, amount: b.balance };
        }
    });

    // My balance
    const myBal = settlements?.balances?.find(
        b => b.memberInfo.user && user && b.memberInfo.user.toString() === user._id.toString()
    )?.balance || 0;
    const balLabel = myBal > 0 ? 'You Get Back' : myBal < 0 ? 'You Owe' : 'Your Balance';
    const allSettlements = [
        ...(settlements?.overdueReimbursements || []),
        ...(settlements?.pendingReimbursements || [])
    ];

    const contributionData = groupData?.members.map(m => {
        const id = m.user ? m.user.toString() : m.name;
        return {
            name: m.name,
            value: paymentMap[id] || 0
        };
    }).filter(d => d.value > 0) || [];

    return (
        <div className="space-y-8 pb-10 text-textColor">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <MdGroups className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{groupData?.name}</h1>
                        <p className="text-sm opacity-60 mt-1">Group Financial Overview</p>
                    </div>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-background shadow-sm text-sm font-medium">
                    <MdCalendarToday className="text-primary" />
                    <span className="opacity-70">Updated: today</span>
                </div>
            </div>

            {/* Stat Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Members */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest text-primary">Members</p>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MdGroup className="text-primary text-xl" />
                        </div>
                    </div>
                    <p className="text-3xl font-black">{groupData?.members?.length || 0}</p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full w-full opacity-80"></div>
                    </div>
                </div>

                {/* My Balance */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest text-primary">{balLabel}</p>
                        <div className={`p-2 rounded-lg ${myBal < 0 ? 'bg-danger/10' : 'bg-secondary/10'}`}>
                            <MdAccountBalanceWallet className={`text-xl ${myBal < 0 ? 'text-danger' : 'text-secondary'}`} />
                        </div>
                    </div>
                    <p className={`text-3xl font-black ${myBal < 0 ? 'text-danger' : 'text-textColor'}`}>
                        ₹{Math.abs(myBal).toLocaleString()}
                    </p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className={`h-full rounded-full ${myBal < 0 ? 'bg-danger' : 'bg-secondary'}`} style={{ width: '100%' }}></div>
                    </div>
                </div>

                {/* Total Group Expense */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest text-primary">Total Group</p>
                        <div className="p-2 bg-primary/10 rounded-lg">
                            <MdShowChart className="text-primary text-xl" />
                        </div>
                    </div>
                    <p className="text-3xl font-black">₹{totalGroupExpense.toLocaleString()}</p>
                    <div className="mt-5 w-full h-1.5 bg-background rounded-full overflow-hidden">
                        <div className="h-full bg-primary opacity-60 rounded-full w-full"></div>
                    </div>
                </div>

                {/* Top Payer */}
                <div className="bg-card rounded-2xl p-6 border border-background shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-bold opacity-50 uppercase tracking-widest text-primary">Top Payer</p>
                        <div className="p-2 bg-secondary/10 rounded-lg">
                            <MdTrendingUp className="text-secondary text-xl" />
                        </div>
                    </div>
                    <p className="text-xl font-bold truncate" title={topPayer.name}>{topPayer.name}</p>
                    <p className="text-sm font-bold opacity-40 mt-1">₹{topPayer.amount.toLocaleString()}</p>
                </div>
            </div>

            {/* Main Content */}
            <div className="grid grid-cols-1 lg:grid-cols-7 gap-8">
                {/* Member Contributions (Left: 4 Units) */}
                <div className="lg:col-span-4 bg-card rounded-3xl border border-background p-8 shadow-sm">
                    <div className="flex justify-between items-start mb-8 text-secondary">
                        <div>
                            <h3 className="text-xl font-bold tracking-tight">Member Contributions</h3>
                            <p className="text-sm opacity-50 mt-1">Total expenses paid per member</p>
                        </div>
                    </div>

                    {contributionData.length > 0 ? (
                        <div className="flex flex-col md:flex-row items-center gap-10">
                            {/* Donut Chart */}
                            <div className="h-64 w-64 shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={contributionData}
                                            innerRadius={70}
                                            outerRadius={100}
                                            paddingAngle={4}
                                            dataKey="value"
                                            stroke="none"
                                        >
                                            {contributionData.map((entry, index) => (
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
                                {contributionData.map((cat, index) => (
                                    <div key={cat.name} className="flex items-center justify-between p-3 rounded-2xl bg-background/40 hover:bg-background/80 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }}></div>
                                            <span className="text-sm font-semibold opacity-80">{cat.name}</span>
                                        </div>
                                        <span className="text-sm font-bold">₹{cat.value.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="h-64 flex flex-col items-center justify-center bg-background/50 rounded-2xl border border-dashed border-background">
                            <MdAccountBalanceWallet className="text-4xl opacity-20 mb-3" />
                            <p className="opacity-50 font-medium">No contribution data yet</p>
                        </div>
                    )}

                    {/* Pending Settlements List */}
                    <div className="mt-10 pt-10 border-t border-background">
                        <h3 className="text-lg font-bold tracking-tight mb-6">Optimized Settlements</h3>
                        {allSettlements.length === 0 ? (
                            <div className="text-center py-6 bg-secondary/5 rounded-2xl border border-dashed border-secondary/20">
                                <p className="text-secondary font-semibold text-sm">🎉 Everyone is all settled up!</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {allSettlements.map((debt, i) => {
                                    const isOverdue = debt.reimbursementStatus === 'overdue';
                                    return (
                                        <div
                                            key={i}
                                            className={`p-5 rounded-2xl border transition-all hover:shadow-sm ${isOverdue
                                                    ? 'bg-danger/5 border-danger/10'
                                                    : 'bg-background/50 border-background'
                                                }`}
                                        >
                                            <div className="flex items-center text-xs mb-3 gap-2">
                                                <span className="font-bold text-textColor">{debt.from.name}</span>
                                                <span className="opacity-40 uppercase tracking-tighter">pays to</span>
                                                <span className="font-bold text-textColor">{debt.to.name}</span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xl font-black ${isOverdue ? 'text-danger' : 'text-textColor'}`}>
                                                    ₹{debt.amount.toLocaleString()}
                                                </span>
                                                {isOverdue && (
                                                    <span className="text-[10px] font-bold bg-danger text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">
                                                        Overdue
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column (Insights & Members - 3 Units) */}
                <div className="lg:col-span-3 flex flex-col gap-6">
                    {/* Urgent Settlement Card (Gradient) */}
                    <div className="bg-gradient-to-br from-primary to-secondary rounded-3xl p-8 text-card relative overflow-hidden shadow-lg group shrink-0">
                        <div className="absolute -right-12 -top-12 bg-card/10 w-48 h-48 rounded-full blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                        <div className="absolute -left-12 -bottom-12 bg-card/10 w-40 h-40 rounded-full blur-2xl"></div>
                        
                        <div className="relative z-10 flex flex-col h-full">
                            <div className="flex items-center gap-3 mb-8">
                                <div className="p-3 bg-card/20 rounded-2xl backdrop-blur-sm border border-card/10">
                                    <MdPriorityHigh className="text-2xl text-card" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-lg tracking-tight text-white">Action Required</h3>
                                    <p className="text-xs text-white/60">Settlement Insights</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Top Debtor</p>
                                    <p className="text-3xl font-black text-white leading-tight">
                                        {topDebtor.name}
                                    </p>
                                </div>

                                <div className="pt-6 border-t border-white/10">
                                    <p className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-2">Total Amount Owed</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-black text-white">
                                            ₹{Math.abs(topDebtor.amount).toLocaleString()}
                                        </p>
                                    </div>
                                    {topDebtor.name !== 'All Settled' && (
                                        <p className="text-xs text-white/50 mt-4 leading-relaxed italic">
                                            "Time to clear debts! Direct settlements keep the group harmony."
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Group Members List */}
                    <div className="bg-card rounded-3xl border border-background p-8 shadow-sm flex-1">
                        <h3 className="text-lg font-bold tracking-tight mb-6">Group Members</h3>
                        <div className="space-y-4">
                            {groupData?.members.map((m, index) => (
                                <div key={m._id || m.name} className="flex items-center justify-between p-3 rounded-2xl hover:bg-background/50 transition-colors">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-xl bg-primary/5 flex items-center justify-center text-primary font-bold text-sm">
                                            {m.name.charAt(0).toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{m.name}</p>
                                            <p className="text-[10px] opacity-40 uppercase font-bold tracking-tighter">
                                                Joined {new Date(m.joinedAt).toLocaleDateString('en-IN', { month: 'short', year: 'numeric' })}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="p-1.5 bg-background rounded-lg">
                                        <MdAttachMoney className="text-primary text-xs opacity-40" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GroupDashboard;