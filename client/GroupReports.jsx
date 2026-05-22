import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import {
    MdDownload, MdFilterList, MdOutlineReceiptLong, MdPerson,
    MdGroup, MdCategory, MdDateRange, MdAttachMoney,
    MdReceipt, MdCompareArrows, MdInfoOutline, MdClear
} from 'react-icons/md';
import CategoryIcon from '../../utils/CategoryIcon';

const GroupReports = () => {
    const { selectedGroupId } = useContext(AuthContext);
    const [activities, setActivities] = useState([]);
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [categoryMetadata, setCategoryMetadata] = useState({});
    const [allCategories, setAllCategories] = useState([]);

    const [filterCategory, setFilterCategory] = useState('');
    const [filterPaidBy, setFilterPaidBy] = useState('');
    const [filterType, setFilterType] = useState('');
    const [sortBy, setSortBy] = useState('date-desc');

    useEffect(() => {
        if (!selectedGroupId) return;

        const fetchData = async () => {
            try {
                const [expRes, grpRes, catRes] = await Promise.all([
                    axios.get(`${API}/group-expenses/${selectedGroupId}`),
                    axios.get(`${API}/groups/${selectedGroupId}`),
                    axios.get(`${API}/categories`)
                ]);

                const rawExpenses = expRes.data;
                const transformedActivities = [];
                const settlementAggregator = {};

                rawExpenses.forEach(exp => {
                    transformedActivities.push({
                        id: exp._id,
                        type: 'expense',
                        title: exp.title,
                        amount: exp.amount,
                        date: exp.date,
                        category: exp.category || 'General',
                        paidBy: exp.paidBy.map(p => p.name).join(', '),
                        note: exp.note
                    });

                    if (exp.settlements && exp.settlements.length > 0) {
                        exp.settlements.forEach(s => {
                            if (s.reimbursementStatus === 'paid') {
                                const payDate = s.paymentDate || exp.date;
                                const dateStr = format(new Date(payDate), 'yyyy-MM-dd HH:mm');
                                const key = `${dateStr}_${s.from.name}_${s.to.name}`;

                                if (!settlementAggregator[key]) {
                                    settlementAggregator[key] = {
                                        id: `agg_s_${key}`,
                                        type: 'settlement',
                                        title: `${s.from.name} → ${s.to.name}`,
                                        amount: s.amount,
                                        date: payDate,
                                        category: 'Settlement',
                                        paidBy: s.from.name,
                                        note: `Method: ${s.paymentMethod || 'cash'}`
                                    };
                                } else {
                                    settlementAggregator[key].amount += s.amount;
                                }
                            }
                        });
                    }
                });

                Object.values(settlementAggregator).forEach(aggS => {
                    transformedActivities.push(aggS);
                });

                const categoryMap = {
                    'settlement': 'MdCompareArrows',
                    'general': 'MdCategory'
                };
                catRes.data.forEach(c => {
                    categoryMap[c.name.toLowerCase()] = c.iconName;
                });
                setCategoryMetadata(categoryMap);
                setAllCategories(catRes.data.map(c => c.name));

                setActivities(transformedActivities);
                setGroupData(grpRes.data);
            } catch (error) {
                toast.error("Failed to load group reports");
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
                    <div className="h-32 bg-card rounded-lg animate-pulse"></div>
                    <div className="h-96 bg-card rounded-lg animate-pulse"></div>
                </div>
            </div>
        );
    }

    const categories = [...new Set([...allCategories, ...activities.map(a => a.category)])].filter(Boolean).sort();
    const members = groupData?.members || [];

    let filteredActivities = activities.filter(act => {
        if (filterType && act.type !== filterType) return false;
        if (filterCategory && act.category !== filterCategory) return false;
        if (filterPaidBy && !act.paidBy.toLowerCase().includes(filterPaidBy.toLowerCase())) return false;
        return true;
    });

    filteredActivities.sort((a, b) => {
        if (sortBy === 'date-desc') return new Date(b.date) - new Date(a.date);
        if (sortBy === 'date-asc') return new Date(a.date) - new Date(b.date);
        if (sortBy === 'amount-desc') return b.amount - a.amount;
        if (sortBy === 'amount-asc') return a.amount - b.amount;
        return 0;
    });

    const totalFilteredAmount = filteredActivities.reduce((sum, act) => sum + act.amount, 0);
    const expenseTotal = filteredActivities.filter(a => a.type === 'expense').reduce((sum, a) => sum + a.amount, 0);
    const settlementTotal = filteredActivities.filter(a => a.type === 'settlement').reduce((sum, a) => sum + a.amount, 0);

    const clearFilters = () => {
        setFilterCategory('');
        setFilterPaidBy('');
        setFilterType('');
        setSortBy('date-desc');
    };

    const hasActiveFilters = filterCategory || filterPaidBy || filterType;

    const handleDownloadCSV = () => {
        if (filteredActivities.length === 0) {
            toast.info("No data to download");
            return;
        }

        const headers = ["Date", "Type", "Description", "Category", "Amount", "Payer/From"];
        const rows = filteredActivities.map(act => [
            format(new Date(act.date), 'dd MMM yyyy'),
            act.type.toUpperCase(),
            `"${act.title.replace(/"/g, '""')}"`,
            act.category,
            act.amount,
            `"${act.paidBy.replace(/"/g, '""')}"`
        ]);

        const csvContent = [
            headers.join(','),
            ...rows.map(r => r.join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `${groupData.name.replace(/\s+/g, '_')}_financial_report.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 bg-background min-h-screen pb-20">
            {/* Header Section */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textColor tracking-tight">Group Reports</h1>
                    <p className="text-sm font-semibold text-textColor/50 mt-1 uppercase tracking-widest">{groupData?.name} • Financial activity</p>
                </div>
                <button
                    onClick={handleDownloadCSV}
                    className="flex items-center gap-2 px-6 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-all shadow-md shadow-primary/10"
                >
                    <MdDownload className="text-lg" /> Export CSV
                </button>
            </div>

            {/* Overview Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-textColor/50 uppercase tracking-widest">Total Transaction Value</p>
                        <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
                            <MdAttachMoney className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-textColor tracking-tight">₹{totalFilteredAmount.toLocaleString()}</p>
                </div>

                <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-textColor/50 uppercase tracking-widest text-danger">Gross Expenses</p>
                        <div className="w-10 h-10 bg-danger/5 rounded-xl flex items-center justify-center text-danger">
                            <MdReceipt className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-danger tracking-tight">₹{expenseTotal.toLocaleString()}</p>
                </div>

                <div className="bg-card rounded-2xl border border-background p-6 shadow-sm hover:shadow-md transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                        <p className="text-[10px] font-black text-textColor/50 uppercase tracking-widest text-secondary">Total Settlements</p>
                        <div className="w-10 h-10 bg-secondary/10 rounded-xl flex items-center justify-center text-secondary">
                            <MdCompareArrows className="w-5 h-5" />
                        </div>
                    </div>
                    <p className="text-3xl font-bold text-secondary tracking-tight">₹{settlementTotal.toLocaleString()}</p>
                </div>
            </div>

            {/* Smart Filters Container */}
            <div className="bg-card rounded-2xl border border-background shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center text-primary">
                            <MdFilterList className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-textColor tracking-tight">Advanced Filters</h3>
                    </div>
                    {hasActiveFilters && (
                        <button
                            onClick={clearFilters}
                            className="text-[10px] font-black text-primary hover:text-primary/70 transition-all uppercase tracking-widest bg-primary/5 px-3 py-1.5 rounded-lg border border-primary/10"
                        >
                            <MdClear className="inline text-xs mb-0.5 mr-1" /> Reset Filters
                        </button>
                    )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-textColor/50 uppercase tracking-widest ml-1">Type</label>
                        <select
                            value={filterType}
                            onChange={e => setFilterType(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-textColor"
                        >
                            <option value="">All Transactions</option>
                            <option value="expense">Expenses Only</option>
                            <option value="settlement">Settlements Only</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-textColor/50 uppercase tracking-widest ml-1">Category</label>
                        <select
                            value={filterCategory}
                            onChange={e => setFilterCategory(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-textColor transition-all"
                            disabled={filterType === 'settlement'}
                        >
                            <option value="">All Categories</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-textColor/50 uppercase tracking-widest ml-1">Paid By / From</label>
                        <select
                            value={filterPaidBy}
                            onChange={e => setFilterPaidBy(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-textColor transition-all"
                        >
                            <option value="">Any Member</option>
                            {members.map(m => (
                                <option key={m.user || m.name} value={m.name}>{m.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black text-textColor/50 uppercase tracking-widest ml-1">Sorting</label>
                        <select
                            value={sortBy}
                            onChange={e => setSortBy(e.target.value)}
                            className="w-full px-4 py-2.5 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/10 focus:border-primary text-sm font-bold text-textColor transition-all"
                        >
                            <option value="date-desc">Timeline (Newest)</option>
                            <option value="date-asc">Timeline (Oldest)</option>
                            <option value="amount-desc">Value (High to Low)</option>
                            <option value="amount-asc">Value (Low to High)</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Results Table View */}
            <div className="bg-card rounded-2xl border border-background shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-background flex items-center justify-between">
                    <p className="text-[10px] font-black text-textColor/50 uppercase tracking-widest">
                        Activity Stream <span className="text-primary font-black ml-1">({filteredActivities.length})</span>
                    </p>
                    <p className="text-[10px] font-black text-textColor/50 uppercase tracking-widest">
                        Total Value: <span className="text-textColor font-black ml-1">₹{totalFilteredAmount.toLocaleString()}</span>
                    </p>
                </div>

                <div className="overflow-x-auto">
                    {filteredActivities.length === 0 ? (
                        <div className="p-20 text-center">
                            <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-4 border border-background">
                                <MdOutlineReceiptLong className="w-8 h-8 text-textColor/40" />
                            </div>
                            <p className="text-textColor font-bold">No results found</p>
                            <p className="text-textColor/50 text-xs mt-1">Try adjusting your filters to see more activity.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-background/50 border-b border-background">
                                    <th className="px-6 py-4 text-[10px] font-black text-textColor/50 uppercase tracking-widest">Description</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-textColor/50 uppercase tracking-widest">Category</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-textColor/50 uppercase tracking-widest">Member / From</th>
                                    <th className="px-6 py-4 text-[10px] font-black text-textColor/50 uppercase tracking-widest text-right">Amount</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-background">
                                {filteredActivities.map((act) => (
                                    <tr key={act.id} className="group hover:bg-background transition-all duration-200">
                                        <td className="px-6 py-5">
                                            <div className="space-y-1">
                                                <p className="text-sm font-bold text-textColor tracking-tight">{act.title}</p>
                                                <div className="flex items-center gap-3">
                                                    <span className="text-[10px] font-bold text-textColor/50 flex items-center gap-1 uppercase tracking-widest">
                                                        <MdDateRange className="text-xs" /> {format(new Date(act.date), 'dd MMM yyyy')}
                                                    </span>
                                                    {act.note && (
                                                        <span className="text-[9px] font-bold text-primary bg-primary/5 px-2 py-0.5 rounded flex items-center gap-1">
                                                            <MdInfoOutline className="text-xs" /> {act.note}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-background flex items-center justify-center text-primary shadow-sm border border-background transition-transform group-hover:scale-105">
                                                    <CategoryIcon iconName={categoryMetadata[act.category?.toLowerCase()] || 'MdCategory'} className="w-5 h-5" />
                                                </div>
                                                <p className="text-sm font-bold text-textColor tracking-tight">{act.category}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5">
                                            <div className="flex items-center gap-3">
                                                <div className={`w-9 h-9 rounded-xl flex items-center justify-center text-xs font-black shadow-sm transition-transform group-hover:scale-105 ${act.paidBy.includes(',') ? 'bg-primary/10 text-primary' : 'bg-primary/10 text-primary'
                                                    }`}>
                                                    {act.paidBy.includes(',') ? 'M' : (act.paidBy.charAt(0) || 'U').toUpperCase()}
                                                </div>
                                                <p className="text-sm font-bold text-textColor truncate max-w-[120px] tracking-tight">{act.paidBy || 'Unknown'}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-5 text-right">
                                            <p className={`text-base font-black tracking-tight ${act.type === 'expense' ? 'text-danger' : 'text-secondary'}`}>
                                                ₹{act.amount.toLocaleString()}
                                            </p>
                                            <p className="text-[9px] font-black text-textColor/50 uppercase tracking-widest opacity-50">{act.type}</p>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
};

export default GroupReports;