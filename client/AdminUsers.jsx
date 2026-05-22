import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AuthContext, API } from '../../context/AuthContext';
import {
    MdDelete, MdBlock, MdCheckCircle, MdList, MdEdit,
    MdPeople, MdSearch, MdFilterList, MdClose, MdPerson,
    MdEmail, MdAdminPanelSettings, MdPersonOutline, MdCalendarToday,
    MdAttachMoney, MdCategory, MdReceipt, MdInfoOutline,
    MdWarning, MdLock, MdSave
} from 'react-icons/md';

const AdminUsers = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('all');
    const [filterStatus, setFilterStatus] = useState('all');

    const [selectedUser, setSelectedUser] = useState(null);
    const [userExpenses, setUserExpenses] = useState([]);
    const [showExpenseModal, setShowExpenseModal] = useState(false);
    const [loadingExpenses, setLoadingExpenses] = useState(false);

    const [showEditModal, setShowEditModal] = useState(false);
    const [editFormData, setEditFormData] = useState({ id: '', name: '', email: '', role: '', password: '', status: '' });
    const [savingUser, setSavingUser] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await axios.get(`${API}/admin/users`);
            setUsers(res.data);
        } catch (error) {
            toast.error('Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const handleEditClick = (user) => {
        setEditFormData({
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            password: '',
            status: user.status || (user.isBlocked ? 'blocked' : 'active')
        });
        setShowEditModal(true);
    };

    const handleSaveEdit = async (e) => {
        e.preventDefault();
        setSavingUser(true);
        try {
            const payload = {
                name: editFormData.name,
                email: editFormData.email,
                role: editFormData.role,
                status: editFormData.status
            };
            if (editFormData.password.trim() !== '') {
                payload.password = editFormData.password;
            }
            await axios.put(`${API}/admin/users/${editFormData.id}`, payload);
            toast.success('User details updated');
            setShowEditModal(false);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user');
        } finally {
            setSavingUser(false);
        }
    };

    const handleToggleBlock = async (user) => {
        try {
            const newStatus = user.status === 'blocked' || user.isBlocked ? 'active' : 'blocked';
            await axios.put(`${API}/admin/users/${user._id}`, { status: newStatus });
            toast.success(`User ${!user.isBlocked ? 'blocked' : 'unblocked'} successfully`);
            fetchUsers();
        } catch (error) {
            toast.error('Failed to update user status');
        }
    };

    const handleDeleteUser = async (id, name) => {
        if (window.confirm(`Are you sure you want to permanently delete "${name}"?`)) {
            try {
                await axios.delete(`${API}/admin/users/${id}`);
                toast.success('User deleted successfully');
                fetchUsers();
            } catch (error) {
                toast.error('Failed to delete user');
            }
        }
    };

    const handleViewExpenses = async (user) => {
        setSelectedUser(user);
        setShowExpenseModal(true);
        setLoadingExpenses(true);
        try {
            const res = await axios.get(`${API}/admin/users/${user._id}/expenses`);
            setUserExpenses(res.data);
        } catch (error) {
            toast.error('Failed to load user expenses');
        } finally {
            setLoadingExpenses(false);
        }
    };

    const handleDeleteExpense = async (expenseId) => {
        if (window.confirm('Delete this user expense permanently?')) {
            try {
                await axios.delete(`${API}/admin/users/${selectedUser._id}/expenses/${expenseId}`);
                toast.success('Expense deleted');
                setUserExpenses(userExpenses.filter(e => e._id !== expenseId));
            } catch (error) {
                toast.error('Failed to delete expense');
            }
        }
    };

    const filteredUsers = users.filter(user => {
        if (searchTerm && !user.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !user.email.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (filterRole !== 'all' && user.role !== filterRole) return false;
        const isBlocked = user.status === 'blocked' || user.isBlocked;
        if (filterStatus === 'active' && isBlocked) return false;
        if (filterStatus === 'blocked' && !isBlocked) return false;
        return true;
    });

    const activeUsers = users.filter(u => !(u.status === 'blocked' || u.isBlocked)).length;
    const blockedUsers = users.filter(u => u.status === 'blocked' || u.isBlocked).length;
    const adminCount = users.filter(u => u.role === 'admin').length;

    if (loading) {
        return (
            <div className="space-y-6">
                <div className="h-8 bg-card rounded w-1/4 animate-pulse"></div>
                <div className="h-12 bg-card rounded-lg animate-pulse"></div>
                <div className="h-96 bg-card rounded-lg animate-pulse"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                        <MdPeople className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-textColor">User Management</h1>
                        <p className="text-sm text-textColor/70 mt-0.5">Manage platform users and their accounts</p>
                    </div>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase">Total Users</p>
                            <p className="text-2xl font-bold text-textColor">{users.length}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdPeople className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase">Active</p>
                            <p className="text-2xl font-bold text-secondary">{activeUsers}</p>
                        </div>
                        <div className="w-10 h-10 bg-secondary/10 rounded-lg flex items-center justify-center">
                            <MdCheckCircle className="w-5 h-5 text-secondary" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase">Blocked</p>
                            <p className="text-2xl font-bold text-danger">{blockedUsers}</p>
                        </div>
                        <div className="w-10 h-10 bg-danger/10 rounded-lg flex items-center justify-center">
                            <MdBlock className="w-5 h-5 text-danger" />
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-lg border border-background p-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-medium text-textColor/70 uppercase">Admins</p>
                            <p className="text-2xl font-bold text-primary">{adminCount}</p>
                        </div>
                        <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <MdAdminPanelSettings className="w-5 h-5 text-primary" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                    <MdSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-textColor/50 text-sm" />
                    <input
                        type="text"
                        placeholder="Search by name or email..."
                        value={searchTerm}
                        onChange={e => setSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                    />
                </div>
                <div className="flex gap-2">
                    <select
                        value={filterRole}
                        onChange={e => setFilterRole(e.target.value)}
                        className="px-4 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-card"
                    >
                        <option value="all">All Roles</option>
                        <option value="personal">Personal</option>
                        <option value="admin">Admin</option>
                    </select>
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="px-4 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm bg-card"
                    >
                        <option value="all">All Status</option>
                        <option value="active">Active</option>
                        <option value="blocked">Blocked</option>
                    </select>
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-background border-b border-background">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">User</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Email</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Role</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Status</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-textColor/70 uppercase">Joined</th>
                                <th className="px-4 py-3 text-right text-xs font-medium text-textColor/70 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-background">
                            {filteredUsers.map((user) => {
                                const isBlocked = user.status === 'blocked' || user.isBlocked;
                                return (
                                    <tr key={user._id} className="hover:bg-background transition">
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <span className="text-xs font-bold text-primary">
                                                        {user.name.charAt(0).toUpperCase()}
                                                    </span>
                                                </div>
                                                <span className="text-sm font-medium text-textColor">{user.name}</span>
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-textColor/70">{user.email}</td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${user.role === 'admin'
                                                    ? 'bg-primary/10 text-primary'
                                                    : 'bg-card text-textColor/70'
                                                }`}>
                                                {user.role === 'admin' && <MdAdminPanelSettings className="text-xs" />}
                                                {user.role || 'personal'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${isBlocked
                                                    ? 'bg-danger/10 text-danger'
                                                    : 'bg-secondary/10 text-secondary'
                                                }`}>
                                                {isBlocked ? <MdBlock className="text-xs" /> : <MdCheckCircle className="text-xs" />}
                                                {isBlocked ? 'Blocked' : 'Active'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-textColor/70">
                                            {new Date(user.createdAt).toLocaleDateString()}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <div className="flex justify-end gap-1">
                                                <button
                                                    onClick={() => handleEditClick(user)}
                                                    className="p-1.5 text-textColor/60 hover:text-primary hover:bg-primary/5 rounded transition"
                                                    title="Edit User"
                                                >
                                                    <MdEdit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleViewExpenses(user)}
                                                    className="p-1.5 text-textColor/60 hover:text-primary hover:bg-primary/5 rounded transition"
                                                    title="View Expenses"
                                                >
                                                    <MdList className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleToggleBlock(user)}
                                                    className={`p-1.5 rounded transition ${isBlocked
                                                            ? 'text-textColor/60 hover:text-secondary hover:bg-secondary/5'
                                                            : 'text-textColor/60 hover:text-danger hover:bg-danger/5'
                                                        }`}
                                                    title={isBlocked ? "Unblock User" : "Block User"}
                                                >
                                                    {isBlocked ? <MdCheckCircle className="w-4 h-4" /> : <MdBlock className="w-4 h-4" />}
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteUser(user._id, user.name)}
                                                    className="p-1.5 text-textColor/60 hover:text-danger hover:bg-danger/5 rounded transition"
                                                    title="Delete User"
                                                >
                                                    <MdDelete className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filteredUsers.length === 0 && (
                                <tr>
                                    <td colSpan="6" className="px-4 py-12 text-center text-textColor/60">
                                        No users found matching your filters
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Expenses Modal */}
            {showExpenseModal && selectedUser && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-4xl max-h-[85vh] flex flex-col">
                        <div className="px-5 py-4 bg-background border-b border-background flex justify-between items-center">
                            <div>
                                <h2 className="text-lg font-semibold text-textColor">User Expenses</h2>
                                <p className="text-sm text-textColor/70 mt-0.5">{selectedUser.name} • {selectedUser.email}</p>
                            </div>
                            <button
                                onClick={() => setShowExpenseModal(false)}
                                className="p-1 hover:bg-card rounded transition text-textColor/60 hover:text-textColor/80"
                            >
                                <MdClose className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-5">
                            {loadingExpenses ? (
                                <div className="flex justify-center py-12">
                                    <div className="animate-spin rounded-full w-8 h-8 border-2 border-blue-600 border-t-transparent"></div>
                                </div>
                            ) : userExpenses.length === 0 ? (
                                <div className="text-center py-12">
                                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MdReceipt className="w-8 h-8 text-textColor/50" />
                                    </div>
                                    <p className="text-textColor/70">No expenses found for this user</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {userExpenses.map(exp => (
                                        <div key={exp._id} className="flex items-center justify-between p-3 bg-background rounded-lg border border-background">
                                            <div className="flex items-center gap-3 flex-1">
                                                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                                    <MdCategory className="w-5 h-5 text-primary" />
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-textColor">{exp.title || 'No description'}</p>
                                                    <div className="flex items-center gap-3 mt-1">
                                                        <span className="text-xs text-textColor/70 flex items-center gap-1">
                                                            <MdCalendarToday className="text-xs" />
                                                            {new Date(exp.date).toLocaleDateString()}
                                                        </span>
                                                        <span className="text-xs px-2 py-0.5 bg-card rounded-full text-textColor/80">
                                                            {exp.category}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-base font-bold text-secondary">₹{exp.amount.toLocaleString()}</p>
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => handleDeleteExpense(exp._id)}
                                                className="p-1.5 text-textColor/60 hover:text-danger hover:bg-danger/5 rounded transition ml-2"
                                                title="Delete Expense"
                                            >
                                                <MdDelete className="w-4 h-4" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="mt-4 p-3 bg-card rounded-lg">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-medium text-textColor/80">Total Expenses</span>
                                            <span className="text-lg font-bold text-primary">
                                                ₹{userExpenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {showEditModal && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-card rounded-lg shadow-xl w-full max-w-md">
                        <div className="px-5 py-4 bg-background border-b border-background">
                            <h2 className="text-lg font-semibold text-textColor">Edit User</h2>
                            <p className="text-sm text-textColor/70 mt-0.5">Modify user details and permissions</p>
                        </div>
                        <form onSubmit={handleSaveEdit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">Full Name</label>
                                <input
                                    required
                                    type="text"
                                    value={editFormData.name}
                                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                                    className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">Email Address</label>
                                <input
                                    required
                                    type="email"
                                    value={editFormData.email}
                                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-textColor/80 mb-1">Role</label>
                                    <select
                                        value={editFormData.role}
                                        onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                                        className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="personal">Personal</option>
                                        <option value="admin">Admin</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-textColor/80 mb-1">Status</label>
                                    <select
                                        value={editFormData.status}
                                        onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                                        className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="active">Active</option>
                                        <option value="blocked">Blocked</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">Force Password Reset</label>
                                <input
                                    type="text"
                                    placeholder="Leave blank to keep current"
                                    value={editFormData.password}
                                    onChange={(e) => setEditFormData({ ...editFormData, password: e.target.value })}
                                    className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <p className="text-xs text-textColor/60 mt-1">
                                    If provided, the user's password will be immediately updated.
                                </p>
                            </div>
                            <div className="flex gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setShowEditModal(false)}
                                    className="flex-1 py-2 border border-background text-textColor/80 rounded-lg font-medium hover:bg-background transition"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={savingUser}
                                    className="flex-1 py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {savingUser ? (
                                        <>
                                            <div className="animate-spin rounded-full w-4 h-4 border-2 border-white border-t-transparent"></div>
                                            Saving...
                                        </>
                                    ) : (
                                        <>
                                            <MdSave className="text-sm" />
                                            Save Changes
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminUsers;