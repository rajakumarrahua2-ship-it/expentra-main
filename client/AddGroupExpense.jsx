import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import { format } from 'date-fns';
import { MdArrowBack, MdCalculate, MdCheckCircle, MdReceipt, MdCategory, MdEdit, MdOutlineCategory } from 'react-icons/md';
import CategoryIcon from '../../utils/CategoryIcon';
import { detectCategory } from '../../utils/categoryDetector';

const AddGroupExpense = () => {
    const navigate = useNavigate();
    const { expenseId } = useParams();
    const isEditMode = !!expenseId;
    const { selectedGroupId } = useContext(AuthContext);
    const [groupData, setGroupData] = useState(null);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    const [title, setTitle] = useState('');
    const [amount, setAmount] = useState('');
    const [category, setCategory] = useState('Other');
    const [note, setNote] = useState('');
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));

    const [paidBy, setPaidBy] = useState([]);
    const [splitType, setSplitType] = useState('equal');
    const [splitDetails, setSplitDetails] = useState([]);

    useEffect(() => {
        if (!selectedGroupId) {
            navigate('/groups');
            return;
        }

        const fetchData = async () => {
            try {
                const [groupRes, catRes] = await Promise.all([
                    axios.get(`${API}/groups/${selectedGroupId}`),
                    axios.get(`${API}/categories`)
                ]);
                const group = groupRes.data;
                const fetchedCategories = catRes.data.filter(c => c.type === 'expense' && c.isActive !== false);
                setGroupData(group);
                setCategories(fetchedCategories);

                let initialSplit = [];
                let initialPaidBy = [];

                if (isEditMode) {
                    const expensesRes = await axios.get(`${API}/group-expenses/${selectedGroupId}`);
                    const expense = expensesRes.data.find(e => e._id === expenseId);
                    if (!expense) {
                        toast.error("Expense not found");
                        navigate('/groups/expenses');
                        return;
                    }

                    setTitle(expense.title);
                    setAmount(expense.amount);
                    setCategory(expense.category || 'General');
                    setNote(expense.note || '');
                    setDate(format(new Date(expense.date), 'yyyy-MM-dd'));
                    setSplitType(expense.splitType || 'equal');

                    initialPaidBy = expense.paidBy.map(p => {
                        const member = group.members.find(m =>
                            (m.user && p.user && m.user.toString() === p.user.toString()) ||
                            m.name === p.name
                        );
                        return {
                            mid: member ? member._id : null,
                            user: p.user,
                            name: p.name,
                            amount: p.amount
                        };
                    });

                    initialSplit = group.members.map(m => {
                        const savedSplit = expense.splitDetails.find(s =>
                            (s.user && m.user && s.user.toString() === m.user.toString()) ||
                            s.name === m.name
                        );
                        return {
                            mid: m._id,
                            user: m.user,
                            name: m.name,
                            share: savedSplit ? savedSplit.share : 0,
                            involved: !!savedSplit
                        };
                    });
                } else {
                    initialSplit = group.members.map(m => ({
                        mid: m._id,
                        user: m.user,
                        name: m.name,
                        share: 0,
                        involved: true
                    }));
                }

                setSplitDetails(initialSplit);
                setPaidBy(initialPaidBy);
                setLoading(false);
            } catch (error) {
                toast.error("Failed to load data");
                setLoading(false);
            }
        };

        fetchData();
    }, [selectedGroupId, navigate, expenseId, isEditMode]);

    const handleTitleChange = (val) => {
        setTitle(val);
        const detected = detectCategory(val, categories);
        if (detected) {
            setCategory(detected);
        }
    };

    const handleInvolvementToggle = (mId) => {
        setSplitDetails(splitDetails.map(item =>
            item.mid === mId ? { ...item, involved: !item.involved } : item
        ));
    };

    const handleShareChange = (mId, value) => {
        setSplitDetails(splitDetails.map(item =>
            item.mid === mId ? { ...item, share: Number(value) } : item
        ));
    };

    const handlePayerChange = (mId, name, userId, value) => {
        const val = Number(value);
        if (val === 0) {
            setPaidBy(paidBy.filter(p => p.mid !== mId));
            return;
        }

        const existing = paidBy.find(p => p.mid === mId);
        if (existing) {
            setPaidBy(paidBy.map(p => p.mid === mId ? { ...p, amount: val } : p));
        } else {
            setPaidBy([...paidBy, { mid: mId, user: userId, name, amount: val }]);
        }
    };

    const validateAndCalculate = () => {
        if (!title || !amount || Number(amount) <= 0) {
            toast.error("Please enter a valid title and amount");
            return false;
        }

        const totalPaid = paidBy.reduce((sum, p) => sum + p.amount, 0);
        if (Math.abs(totalPaid - Number(amount)) > 0.01) {
            toast.error(`Total paid (₹${totalPaid}) must equal expense amount (₹${amount})`);
            return false;
        }

        const involvedMembers = splitDetails.filter(s => s.involved);
        if (involvedMembers.length === 0) {
            toast.error("At least one member must be involved");
            return false;
        }

        if (splitType === 'exact') {
            const totalShare = involvedMembers.reduce((sum, s) => sum + s.share, 0);
            if (Math.abs(totalShare - Number(amount)) > 0.1) {
                toast.error("Exact shares must equal total amount");
                return false;
            }
        } else if (splitType === 'percentage') {
            const totalPct = involvedMembers.reduce((sum, s) => sum + s.share, 0);
            if (Math.abs(totalPct - 100) > 0.1) {
                toast.error("Percentages must total 100%");
                return false;
            }
        }

        return true;
    };

    const handleSubmit = async () => {
        if (!validateAndCalculate()) return;

        try {
            const finalSplitDetails = splitDetails.filter(s => s.involved).map(s => ({
                user: (s.user && typeof s.user === 'string' && s.user.length === 24) ? s.user : null,
                name: s.name,
                share: s.share
            }));

            const finalPaidBy = paidBy.map(p => ({
                user: (p.user && typeof p.user === 'string' && p.user.length === 24) ? p.user : null,
                name: p.name,
                amount: p.amount
            }));

            const payload = {
                groupId: selectedGroupId,
                title,
                amount: Number(amount),
                paidBy: finalPaidBy,
                splitType,
                splitDetails: finalSplitDetails,
                category,
                note,
                date: new Date(date)
            };

            if (isEditMode) {
                await axios.put(`${API}/group-expenses/${selectedGroupId}/${expenseId}`, payload);
                toast.success("Expense updated successfully");
            } else {
                await axios.post(`${API}/group-expenses`, payload);
                toast.success("Expense added successfully");
            }

            navigate('/groups/expenses');
        } catch (error) {
            toast.error(error.response?.data?.message || `Failed to ${isEditMode ? 'update' : 'add'} expense`);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 pt-10 px-4 animate-pulse max-w-4xl mx-auto">
                <div className="h-8 bg-card rounded-xl w-48"></div>
                <div className="h-32 bg-card rounded-2xl"></div>
                <div className="h-64 bg-card rounded-2xl"></div>
            </div>
        );
    }

    const involvedCount = splitDetails.filter(s => s.involved).length;
    const totalPaid = paidBy.reduce((s, p) => s + p.amount, 0);
    const isPaidCorrect = Math.abs(totalPaid - Number(amount)) < 0.01;

    return (
        <div className="min-h-screen pb-12 text-textColor">
            {/* Header */}
            <div className="bg-transparent px-6 py-6 mb-8">
                <div className="max-w-4xl mx-auto flex items-center gap-4">
                    <button
                        onClick={() => navigate('/groups/expenses')}
                        className="p-2.5 rounded-xl bg-background border border-background hover:bg-primary hover:text-white transition-all duration-300 shadow-sm group"
                    >
                        <MdArrowBack className="w-5 h-5 transition-transform group-hover:-translate-x-1" />
                    </button>
                    <div>
                        <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                            {isEditMode ? 'Edit Expense' : 'Record Group Expense'}
                        </h1>
                        <p className="opacity-60 text-sm mt-0.5 font-medium">{groupData?.name || 'Group Activity'}</p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-4xl mx-auto px-4">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                    {/* Left Column - Forms */}
                    <div className="lg:col-span-2 space-y-8">

                        {/* Basic Info */}
                        <div className="bg-card rounded-3xl shadow-sm border border-background p-8">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2 mb-6">
                                <MdReceipt className="text-lg" /> Expense Details
                            </h2>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold opacity-60 uppercase tracking-wide px-1">Title</label>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={e => handleTitleChange(e.target.value)}
                                        placeholder="e.g. Dinner Checkout"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold opacity-60 uppercase tracking-wide px-1">Amount (₹)</label>
                                    <input
                                        type="number"
                                        value={amount}
                                        onChange={e => setAmount(e.target.value)}
                                        placeholder="0.00"
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary font-black text-lg transition-all"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Metadata Details - Moved here */}
                        <div className="bg-card rounded-3xl shadow-sm border border-background p-8 space-y-6">
                            <h4 className="text-xs font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                <MdCategory className="text-lg" /> Extra Details
                            </h4>

                            <div className="space-y-1.5">
                                <label className="block text-xs font-bold opacity-60 uppercase tracking-wide px-1">Category</label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none z-10">
                                        <CategoryIcon
                                            iconName={categories.find(c => c.name === category)?.icon || 'Category'}
                                            className="text-primary w-4 h-4 transition-transform group-hover:scale-110"
                                        />
                                    </div>
                                    <select
                                        value={category}
                                        onChange={e => setCategory(e.target.value)}
                                        className="w-full pl-10 pr-10 py-3 rounded-xl bg-background border border-background focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium transition-all appearance-none cursor-pointer relative"
                                    >
                                        {categories.length > 0 ? (
                                            <>
                                                {categories.map(c => (
                                                    <option key={c._id} value={c.name}>{c.name}</option>
                                                ))}
                                                {!categories.find(c => c.name === 'Other') && (
                                                    <option value="Other">Other</option>
                                                )}
                                            </>
                                        ) : (
                                            ['Other', 'Food', 'Travel', 'Entertainment', 'Shopping', 'Household'].map(c => (
                                                <option key={c} value={c}>{c}</option>
                                            ))
                                        )}
                                    </select>
                                    <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
                                        <MdOutlineCategory className="text-textColor/40 w-4 h-4" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold opacity-60 uppercase tracking-wide px-1">Date</label>
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-background focus:outline-none focus:border-primary text-sm font-medium transition-all"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="block text-xs font-bold opacity-60 uppercase tracking-wide px-1">Remarks (Optional)</label>
                                    <input
                                        type="text"
                                        value={note}
                                        onChange={e => setNote(e.target.value)}
                                        placeholder="Write something..."
                                        className="w-full px-4 py-3 rounded-xl bg-background border border-background focus:outline-none focus:border-primary text-sm transition-all placeholder:opacity-30"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Paid By */}
                        <div className="bg-card rounded-3xl shadow-sm border border-background p-8">
                            <div className="flex justify-between items-center mb-6">
                                <h2 className="text-sm font-bold uppercase tracking-widest text-primary flex items-center gap-2">
                                    <div className="w-6 h-6 rounded-lg bg-primary text-white text-[10px] flex items-center justify-center font-black">1</div>
                                    Who Paid?
                                </h2>
                                <p className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${isPaidCorrect ? 'bg-secondary/10 text-secondary' : 'bg-danger/10 text-danger'}`}>
                                    {isPaidCorrect ? 'Fully Paid' : 'Wait... Check amount'}
                                </p>
                            </div>

                            <div className="space-y-3">
                                {groupData?.members.map(m => {
                                    const payer = paidBy.find(p => p.mid === m._id);
                                    return (
                                        <div key={m._id} className="group flex items-center justify-between px-5 py-3 rounded-2xl bg-background border border-background hover:border-primary/20 transition-all">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-primary/5 flex items-center justify-center text-primary font-bold text-xs uppercase">
                                                    {m.name.charAt(0)}
                                                </div>
                                                <span className="font-semibold text-sm opacity-80">{m.name}</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-primary text-xs font-bold opacity-40">₹</span>
                                                <input
                                                    type="number"
                                                    value={payer ? payer.amount : ''}
                                                    onChange={e => handlePayerChange(m._id, m.name, m.user, e.target.value)}
                                                    placeholder="0.00"
                                                    className="w-24 px-3 py-2 rounded-lg bg-card border border-transparent focus:border-primary/30 focus:outline-none focus:ring-0 text-right text-sm font-bold transition-all"
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Split Method */}
                        <div className="bg-card rounded-3xl shadow-sm border border-background p-8">
                            <h2 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
                                <div className="w-6 h-6 rounded-lg bg-primary text-white text-[10px] flex items-center justify-center font-black">2</div>
                                Split Method
                            </h2>

                            <div className="flex gap-3 mb-8 p-1.5 bg-background rounded-2xl border border-background">
                                {['equal', 'exact', 'percentage'].map(type => (
                                    <button
                                        key={type}
                                        onClick={() => setSplitType(type)}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${splitType === type
                                            ? 'bg-primary text-white shadow-md'
                                            : 'text-textColor/40 hover:text-primary hover:bg-primary/5'
                                            }`}
                                    >
                                        {type}
                                    </button>
                                ))}
                            </div>

                            <div className="space-y-3">
                                {splitDetails.map(m => (
                                    <div
                                        key={m.mid}
                                        className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all ${m.involved
                                            ? 'bg-background border-primary/10 shadow-sm'
                                            : 'bg-card border-background opacity-40'
                                            }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            <input
                                                type="checkbox"
                                                checked={m.involved}
                                                onChange={() => handleInvolvementToggle(m.mid)}
                                                className="w-4 h-4 accent-primary rounded-lg cursor-pointer"
                                            />
                                            <span className={`text-sm font-bold ${m.involved ? 'opacity-90' : 'opacity-60'}`}>
                                                {m.name}
                                            </span>
                                        </div>

                                        {m.involved && (
                                            <div className="flex items-center gap-2">
                                                {splitType === 'equal' ? (
                                                    <div className="px-4 py-1.5 rounded-lg bg-primary/5 text-primary text-sm font-black">
                                                        ₹{(Number(amount) / involvedCount || 0).toFixed(2)}
                                                    </div>
                                                ) : (
                                                    <>
                                                        <span className="text-primary text-[10px] font-black opacity-30">
                                                            {splitType === 'percentage' ? '%' : '₹'}
                                                        </span>
                                                        <input
                                                            type="number"
                                                            value={m.share || ''}
                                                            onChange={e => handleShareChange(m.mid, e.target.value)}
                                                            placeholder="0"
                                                            className="w-20 px-3 py-2 rounded-lg bg-card border border-transparent focus:border-primary/30 focus:outline-none text-right text-sm font-black transition-all"
                                                        />
                                                    </>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Summary & Details */}
                    <div className="space-y-8">

                        {/* Summary Card */}
                        <div className="bg-gradient-to-br from-primary to-primary/80 rounded-3xl p-8 shadow-lg text-white group">
                            <h3 className="font-bold text-xs uppercase tracking-widest mb-6 flex items-center gap-2 opacity-80">
                                <MdCalculate className="text-lg" /> Overview
                            </h3>

                            <div className="space-y-5 text-sm mb-8">
                                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                                    <span className="opacity-70 font-medium">Total Cost</span>
                                    <span className="font-black text-2xl">₹{amount || '0.00'}</span>
                                </div>
                                <div className="flex justify-between items-baseline border-b border-white/10 pb-3">
                                    <span className="opacity-70 font-medium">Recorded Paid</span>
                                    <span className={`font-black ${isPaidCorrect ? 'text-white' : 'text-danger/50 animate-pulse'}`}>
                                        ₹{totalPaid.toFixed(2)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="opacity-70 font-medium">Shared by</span>
                                    <span className="font-black">{involvedCount} People</span>
                                </div>
                            </div>

                            <button
                                onClick={handleSubmit}
                                className="w-full py-4 bg-card text-primary hover:bg-background rounded-2xl font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl hover:-translate-y-1 active:translate-y-0"
                            >
                                {isEditMode ? <MdEdit className="text-lg" /> : <MdCheckCircle className="text-lg" />}
                                {isEditMode ? 'Update Record' : 'Save Expense'}
                            </button>
                        </div>

                    </div>
                </div>
            </div>
        </div>
    );
};

export default AddGroupExpense;