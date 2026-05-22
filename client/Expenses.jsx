import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { MdAdd, MdDelete, MdEdit, MdOutlineReceiptLong } from 'react-icons/md';
import { AuthContext, API } from '../context/AuthContext';
import CategoryIcon from '../utils/CategoryIcon';
import { detectCategory } from '../utils/categoryDetector';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const Expenses = () => {
    const { user } = useContext(AuthContext);

    const [expenses, setExpenses] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState(null);

    const today = new Date();
    const [filterMonth, setFilterMonth] = useState(today.getMonth() + 1);
    const [filterYear, setFilterYear] = useState(today.getFullYear());
    const [filterCategory, setFilterCategory] = useState('');

    const defaultForm = { title: '', amount: '', category: '', note: '', date: '', paymentMethod: 'cash', recurring: false };
    const [formData, setFormData] = useState(defaultForm);

    const fetchData = async () => {
        try {
            setLoading(true);
            const [expRes, catRes] = await Promise.all([
                axios.get(`${API}/expenses?month=${filterMonth}&year=${filterYear}${filterCategory ? `&category=${filterCategory}` : ''}`),
                axios.get(`${API}/categories`)
            ]);
            setExpenses(expRes.data);
            const expCats = catRes.data.filter(c => c.type === 'expense' && c.isActive !== false);
            setCategories(expCats);
            if (!formData.category) {
                setFormData(prev => ({ ...prev, category: expCats[0]?.name || 'Other' }));
            }
        } catch (error) {
            toast.error('Failed to load expenses');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [filterMonth, filterYear, filterCategory]);

    const openAdd = () => {
        setEditingId(null);
        setFormData({
            title: '', amount: '',
            category: categories[0]?.name || 'Other',
            note: '',
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'cash',
            recurring: false
        });
        setShowModal(true);
    };

    const openEdit = (expense) => {
        setEditingId(expense._id);
        setFormData({
            title: expense.title || '',
            amount: expense.amount,
            category: expense.category,
            note: expense.note || '',
            date: expense.date ? expense.date.substring(0, 10) : '',
            paymentMethod: expense.paymentMethod || 'cash',
            recurring: expense.recurring || false,
        });
        setShowModal(true);
    };

    const handleSave = async (e) => {
        e.preventDefault();
        try {
            if (editingId) {
                await axios.put(`${API}/expenses/${editingId}`, formData);
                toast.success('Expense updated');
            } else {
                await axios.post(`${API}/expenses`, formData);
                toast.success('Expense added');
            }
            setShowModal(false);
            setEditingId(null);
            fetchData();
        } catch (error) {
            toast.error(error.response?.data?.message || 'Error saving expense');
        }
    };

    const handleDelete = async (id) => {
        if (!window.confirm('Delete this expense?')) return;
        try {
            await axios.delete(`${API}/expenses/${id}`);
            setExpenses(prev => prev.filter(e => e._id !== id));
            toast.success('Expense deleted');
        } catch (error) {
            toast.error('Failed to delete expense');
        }
    };

    const handleTitleChange = (e) => {
        const title = e.target.value;
        const detected = detectCategory(title, categories);
        setFormData(prev => ({ ...prev, title: title, category: detected }));
    };

    const getDisplayIcon = (expense) => {
        const lowerTitle = (expense.title || '').toLowerCase();
        for (const cat of categories) {
            if (cat.keywords?.length > 0 && cat.keywords.some(k => lowerTitle.includes(k.toLowerCase()))) {
                return cat.icon;
            }
        }
        return categories.find(c => c.name === expense.category)?.icon;
    };

    const totalExpense = expenses.reduce((sum, e) => sum + Number(e.amount), 0);

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-card rounded w-1/3 animate-pulse"></div>
                <div className="h-32 bg-card rounded-xl animate-pulse"></div>
                <div className="h-64 bg-card rounded-xl animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Section */}
            <div className="flex flex-wrap justify-between items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-textColor">Expense Management</h1>
                    <p className="text-sm text-textColor/60 mt-1">
                        {MONTHS[filterMonth - 1]} {filterYear}
                    </p>
                </div>

                <div className="flex gap-3 items-center flex-wrap">
                    <select
                        value={filterMonth}
                        onChange={e => setFilterMonth(Number(e.target.value))}
                        className="border border-background bg-card text-textColor rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                        {MONTHS.map((m, i) => (
                            <option key={m} value={i + 1}>{m}</option>
                        ))}
                    </select>

                    <select
                        value={filterYear}
                        onChange={e => setFilterYear(Number(e.target.value))}
                        className="border border-background bg-card text-textColor rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                        {[0, 1, 2].map(o => {
                            const y = today.getFullYear() - o;
                            return <option key={y} value={y}>{y}</option>;
                        })}
                    </select>

                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="border border-background bg-card text-textColor rounded-xl px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all duration-200"
                    >
                        <option value="">All Categories</option>
                        {categories.map(c => (
                            <option key={c._id} value={c.name}>{c.name}</option>
                        ))}
                    </select>

                    <button
                        onClick={openAdd}
                        className="flex items-center gap-2 px-5 py-2 bg-primary text-white text-sm font-medium rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                    >
                        <MdAdd className="text-lg" /> Add Expense
                    </button>
                </div>
            </div>

            {/* Total Expense Card with Gradient */}
            <div className="bg-gradient-to-r from-primary to-secondary rounded-2xl p-6 shadow-lg">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <div className="bg-card/20 rounded-xl p-3 backdrop-blur-sm">
                            <MdOutlineReceiptLong className="text-3xl text-white" />
                        </div>
                        <div>
                            <p className="text-xs font-medium uppercase tracking-wide text-white/80">
                                Total Expenses — {MONTHS[filterMonth - 1]} {filterYear}
                            </p>
                            <p className="text-3xl font-bold text-white mt-1">₹{totalExpense.toLocaleString()}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-2xl font-bold text-white">{expenses.length}</p>
                        <p className="text-xs text-white/70 mt-1">Total Entries</p>
                    </div>
                </div>
            </div>

            {/* Expense Table */}
            <div className="bg-card rounded-2xl shadow-sm border border-background overflow-hidden transition-all duration-200">
                <div className="overflow-x-auto">
                    <table className="min-w-full">
                        <thead>
                            <tr className="bg-background border-b border-background">
                                <th className="px-6 py-4 text-left text-xs font-semibold text-textColor/70 uppercase tracking-wider">Date</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-textColor/70 uppercase tracking-wider">Title</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-textColor/70 uppercase tracking-wider">Category</th>
                                <th className="px-6 py-4 text-left text-xs font-semibold text-textColor/70 uppercase tracking-wider">Amount</th>
                                <th className="px-6 py-4 text-right text-xs font-semibold text-textColor/70 uppercase tracking-wider">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-background">
                            {expenses.map((expense, idx) => (
                                <tr key={expense._id} className={`${idx % 2 === 0 ? 'bg-card' : 'bg-background'} hover:bg-background transition-all duration-200`}>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-textColor/70">
                                        {new Date(expense.date).toLocaleDateString('en-IN', {
                                            day: '2-digit',
                                            month: 'short',
                                            year: 'numeric'
                                        })}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-textColor font-medium">
                                        <div className="flex flex-col">
                                            <span>{expense.title}</span>
                                            {expense.note && (
                                                <span className="text-xs text-textColor/50 font-normal mt-0.5">{expense.note}</span>
                                            )}
                                            {expense.recurring && (
                                                <span className="text-xs text-primary font-medium mt-0.5">🔁 Recurring</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="px-3 py-1.5 inline-flex items-center gap-2 text-xs font-medium rounded-full bg-primary/10 text-primary">
                                            <CategoryIcon iconName={getDisplayIcon(expense)} className="w-3.5 h-3.5" />
                                            {expense.category}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-danger">
                                        ₹{Number(expense.amount).toLocaleString()}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right">
                                        <button
                                            onClick={() => openEdit(expense)}
                                            className="text-primary hover:text-primary/80 mr-3 transition-all duration-200"
                                            title="Edit"
                                        >
                                            <MdEdit className="w-5 h-5" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(expense._id)}
                                            className="text-danger hover:text-danger/80 transition-all duration-200"
                                            title="Delete"
                                        >
                                            <MdDelete className="w-5 h-5" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {expenses.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center">
                                        <p className="text-textColor/70 font-medium">
                                            No expenses for {MONTHS[filterMonth - 1]} {filterYear}
                                        </p>
                                        <p className="text-sm text-textColor/50 mt-1">
                                            Click "Add Expense" to record your first entry.
                                        </p>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-textColor/50 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-200">
                    <div className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-md mx-4 max-h-screen overflow-y-auto border border-background">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-primary rounded-xl p-2">
                                <MdOutlineReceiptLong className="text-white text-xl" />
                            </div>
                            <h2 className="text-lg font-semibold text-textColor">
                                {editingId ? 'Edit Expense' : 'Record New Expense'}
                            </h2>
                        </div>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-xs font-semibold text-textColor/70 uppercase tracking-wide mb-1.5">
                                    Title <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="text" required
                                    value={formData.title}
                                    onChange={handleTitleChange}
                                    placeholder="e.g. Tea, Uber, Rent"
                                    className="w-full px-4 py-2.5 border border-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textColor transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-textColor/70 uppercase tracking-wide mb-1.5">
                                    Amount (₹) <span className="text-danger">*</span>
                                </label>
                                <input
                                    type="number" step="0.01" required min="0"
                                    value={formData.amount}
                                    onChange={e => setFormData({ ...formData, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full px-4 py-2.5 border border-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textColor transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-textColor/70 uppercase tracking-wide mb-1.5">
                                    Category (Auto-detected)
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={formData.category}
                                        disabled
                                        className="w-full pl-10 pr-4 py-2.5 border border-background rounded-xl text-sm bg-background text-textColor/60 cursor-not-allowed"
                                    />
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <CategoryIcon
                                            iconName={categories.find(c => c.name === formData.category)?.icon || 'Category'}
                                            className="text-primary w-4 h-4"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-textColor/70 uppercase tracking-wide mb-1.5">
                                    Note <span className="text-textColor/50 text-xs font-normal normal-case">(optional)</span>
                                </label>
                                <input
                                    type="text"
                                    value={formData.note}
                                    onChange={e => setFormData({ ...formData, note: e.target.value })}
                                    placeholder="Any extra details..."
                                    className="w-full px-4 py-2.5 border border-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textColor transition-all duration-200"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold text-textColor/70 uppercase tracking-wide mb-1.5">
                                    Date
                                </label>
                                <input
                                    type="date"
                                    value={formData.date}
                                    onChange={e => setFormData({ ...formData, date: e.target.value })}
                                    className="w-full px-4 py-2.5 border border-background rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-background text-textColor transition-all duration-200"
                                />
                            </div>

                            <div className="flex items-center gap-3 bg-background px-4 py-2.5 rounded-xl border border-background">
                                <input
                                    type="checkbox"
                                    id="recurring"
                                    checked={formData.recurring}
                                    onChange={e => setFormData({ ...formData, recurring: e.target.checked })}
                                    className="w-4 h-4 text-primary rounded border-background focus:ring-primary"
                                />
                                <label htmlFor="recurring" className="text-sm font-medium text-textColor cursor-pointer select-none">
                                    🔁 Mark as Recurring
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => { setShowModal(false); setEditingId(null); }}
                                    className="px-5 py-2.5 text-sm font-medium border border-background text-textColor rounded-xl hover:bg-background transition-all duration-200"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="px-5 py-2.5 text-sm font-medium bg-primary text-white rounded-xl hover:bg-primary/90 transition-all duration-200 shadow-sm hover:shadow-md"
                                >
                                    {editingId ? 'Update Expense' : 'Save Expense'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Expenses;