import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import CategoryIcon from '../../utils/CategoryIcon';
import {
    MdAdd, MdReceipt, MdKeyboardArrowDown, MdKeyboardArrowUp,
    MdCompareArrows, MdEdit, MdDelete, MdGroup, MdAttachMoney,
    MdPerson, MdCalendarToday, MdInfoOutline, MdCheckCircle
} from 'react-icons/md';

const GroupExpenses = () => {
    const navigate = useNavigate();
    const { selectedGroupId } = useContext(AuthContext);
    const [activities, setActivities] = useState([]);
    const [groupData, setGroupData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [expandedActivity, setExpandedActivity] = useState(null);

    const fetchData = async () => {
        try {
            const [expRes, groupRes, catRes] = await Promise.all([
                axios.get(`${API}/group-expenses/${selectedGroupId}`),
                axios.get(`${API}/groups/${selectedGroupId}`),
                axios.get(`${API}/categories`)
            ]);

            const rawExpenses = expRes.data;
            const transformedActivities = [];
            const settlementAggregator = {};

            rawExpenses.forEach(exp => {
                transformedActivities.push({
                    ...exp,
                    activityType: 'expense'
                });

                if (exp.settlements && exp.settlements.length > 0) {
                    exp.settlements.forEach(s => {
                        if (s.reimbursementStatus === 'paid') {
                            const dateKey = s.paymentDate ? new Date(s.paymentDate).getTime() : new Date(exp.date).getTime();
                            const fromKey = s.from.user || s.from.name;
                            const toKey = s.to.user || s.to.name;
                            const key = `${dateKey}_${fromKey}_${toKey}`;

                            if (!settlementAggregator[key]) {
                                settlementAggregator[key] = {
                                    _id: `settle_${key}`,
                                    activityType: 'settlement',
                                    title: `Settled: ${s.from.name} → ${s.to.name}`,
                                    amount: s.amount,
                                    date: new Date(dateKey),
                                    note: `Settled for group of expenses`,
                                    paymentMethod: s.paymentMethod,
                                    expensesCount: 1,
                                    underlyingExpenses: [{
                                        title: exp.title,
                                        amount: s.amount
                                    }]
                                };
                            } else {
                                settlementAggregator[key].amount += s.amount;
                                settlementAggregator[key].expensesCount += 1;
                                settlementAggregator[key].underlyingExpenses.push({
                                    title: exp.title,
                                    amount: s.amount
                                });
                            }
                        }
                    });
                }
            });

            Object.values(settlementAggregator).forEach(aggS => {
                transformedActivities.push(aggS);
            });

            transformedActivities.sort((a, b) => new Date(b.date) - new Date(a.date));
            setActivities(transformedActivities);
            setGroupData(groupRes.data);
            setCategories(catRes.data);
        } catch (error) {
            toast.error("Failed to load activities");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedGroupId) return;
        fetchData();
    }, [selectedGroupId]);

    const handleDeleteExpense = async (expenseId) => {
        if (!window.confirm("Are you sure you want to delete this expense?")) {
            return;
        }
        try {
            await axios.delete(`${API}/group-expenses/${selectedGroupId}/${expenseId}`);
            toast.success("Expense deleted successfully");
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete expense");
        }
    };

    if (!selectedGroupId) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-card rounded-lg border border-background p-12 text-center shadow-sm">
                    <div className="w-20 h-20 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdGroup className="w-10 h-10 text-primary" />
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
                    <div className="h-32 bg-card rounded-lg animate-pulse"></div>
                    <div className="h-24 bg-card rounded-lg animate-pulse"></div>
                    <div className="h-24 bg-card rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-10 text-textColor">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-primary/10 rounded-2xl">
                        <MdGroup className="w-8 h-8 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{groupData?.name}</h1>
                        <p className="text-sm opacity-60 mt-1">Activity and settlement history</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/groups/add-expense')}
                    className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-300 shadow-sm hover:shadow-md font-bold text-sm"
                >
                    <MdAdd className="text-lg" />
                    Add Expense
                </button>
            </div>

            {/* Activities Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-background overflow-hidden transition-all duration-300">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-background/50 border-b border-background">
                                <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Date</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Description</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Payers / Method</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Category</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-primary uppercase tracking-widest">Amount</th>
                                <th className="px-6 py-4 text-right text-[10px] font-black text-primary uppercase tracking-widest">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-background">
                            {activities.map((act) => {
                                const isExpense = act.activityType === 'expense';
                                return (
                                    <React.Fragment key={act._id}>
                                        <tr 
                                            onClick={() => setExpandedActivity(expandedActivity === act._id ? null : act._id)}
                                            className={`group cursor-pointer transition-all duration-200 ${expandedActivity === act._id ? 'bg-primary/5' : 'hover:bg-background/80'}`}
                                        >
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium opacity-60">
                                                <div className="flex items-center gap-2">
                                                    <div className={`transition-transform duration-200 ${expandedActivity === act._id ? 'rotate-180' : ''}`}>
                                                        <MdKeyboardArrowDown className="text-primary opacity-40" />
                                                    </div>
                                                    {new Date(act.date).toLocaleDateString('en-IN', {
                                                        day: '2-digit',
                                                        month: 'short',
                                                        year: 'numeric'
                                                    })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-bold opacity-90">{act.title}</span>
                                                    {act.note && (
                                                        <span className="text-[10px] opacity-40 italic mt-0.5 line-clamp-1">{act.note}</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {isExpense ? (
                                                        <div className="flex -space-x-2">
                                                            {act.paidBy?.map((p, idx) => (
                                                                <div key={idx} className="w-6 h-6 rounded-full bg-primary/10 border-2 border-card flex items-center justify-center text-[8px] font-black text-primary uppercase" title={p.name}>
                                                                    {p.name.charAt(0)}
                                                                </div>
                                                            ))}
                                                            <span className="text-[10px] opacity-60 font-medium ml-3 self-center">
                                                                {act.paidBy?.length > 1 ? `${act.paidBy[0].name} +${act.paidBy.length - 1}` : act.paidBy?.[0]?.name}
                                                            </span>
                                                        </div>
                                                    ) : (
                                                        <span className="px-2 py-0.5 rounded-md bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-tighter">
                                                            Settlement ({act.paymentMethod || 'cash'})
                                                        </span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {isExpense ? (
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-8 h-8 rounded-lg bg-background border border-background flex items-center justify-center p-1.5 shadow-sm">
                                                            <CategoryIcon
                                                                iconName={categories.find(c => c.name === act.category)?.icon || 'Category'}
                                                                className="text-primary w-full h-full"
                                                            />
                                                        </div>
                                                        <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest rounded-full bg-background border border-background opacity-70">
                                                            {act.category || 'Other'}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="opacity-20">—</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`text-sm font-black ${isExpense ? 'text-danger' : 'text-secondary'}`}>
                                                    ₹{act.amount.toLocaleString()}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right">
                                                {isExpense ? (
                                                    <div className="flex justify-end gap-2" onClick={e => e.stopPropagation()}>
                                                        <button
                                                            onClick={() => navigate(`/groups/expenses/edit/${act._id}`)}
                                                            className="p-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                                                            title="Edit"
                                                        >
                                                            <MdEdit className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteExpense(act._id)}
                                                            className="p-2 text-danger hover:bg-danger/10 rounded-lg transition-colors"
                                                            title="Delete"
                                                        >
                                                            <MdDelete className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-[10px] font-bold opacity-30 px-3 cursor-default">SYSTEM</span>
                                                )}
                                            </td>
                                        </tr>

                                        {/* Expanded Settlement Details */}
                                        {expandedActivity === act._id && (
                                            <tr className="bg-background/50 border-b border-background">
                                                <td colSpan="6" className="px-10 py-6">
                                                    <div className="flex flex-col gap-4 animate-in fade-in slide-in-from-top-1 duration-200">
                                                        <div className="flex items-center gap-2 text-primary">
                                                            <MdCompareArrows className="text-lg" />
                                                            <h4 className="text-xs font-black uppercase tracking-widest">
                                                                {isExpense ? 'Settlement Breakdown' : 'Included Expenses'}
                                                            </h4>
                                                        </div>

                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                                            {isExpense ? (
                                                                act.settlements?.map((s, idx) => (
                                                                    <div key={idx} className="bg-card border border-background rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
                                                                        <div className="flex items-center gap-3">
                                                                            <div className="flex items-center gap-1.5 min-w-0">
                                                                                <span className="text-[10px] font-bold opacity-80 truncate">{s.from.name}</span>
                                                                                <MdKeyboardArrowUp className="rotate-90 text-primary opacity-30 text-xs shrink-0" />
                                                                                <span className="text-[10px] font-bold opacity-80 truncate">{s.to.name}</span>
                                                                            </div>
                                                                        </div>
                                                                        <div className="flex flex-col items-end shrink-0">
                                                                            <span className="text-xs font-black text-secondary">₹{s.amount.toLocaleString()}</span>
                                                                            <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded-md ${s.reimbursementStatus === 'paid' ? 'bg-secondary/10 text-secondary' : 'bg-danger/50/10 text-danger'}`}>
                                                                                {s.reimbursementStatus}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                act.underlyingExpenses?.map((ue, idx) => (
                                                                    <div key={idx} className="bg-card border border-background rounded-xl p-3 shadow-sm flex items-center justify-between gap-4">
                                                                        <span className="text-[10px] font-bold opacity-80 truncate">{ue.title}</span>
                                                                        <span className="text-xs font-black text-secondary shrink-0">₹{ue.amount.toLocaleString()}</span>
                                                                    </div>
                                                                ))
                                                            )}
                                                        </div>

                                                        {isExpense && (!act.settlements || act.settlements.length === 0) && (
                                                            <p className="text-[10px] font-bold opacity-30 italic">No settlement needed for this expense.</p>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                );
                            })}
                            {activities.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-6 py-16 text-center">
                                        <div className="w-16 h-16 bg-background rounded-2xl flex items-center justify-center mx-auto mb-4 border border-background">
                                            <MdReceipt className="w-8 h-8 opacity-20" />
                                        </div>
                                        <p className="text-sm font-bold opacity-40">No activity history found</p>
                                        <button
                                            onClick={() => navigate('/groups/add-expense')}
                                            className="mt-4 text-primary font-black text-[10px] uppercase tracking-widest hover:underline"
                                        >
                                            Add First Expense
                                        </button>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default GroupExpenses;