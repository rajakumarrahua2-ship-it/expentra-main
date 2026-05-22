import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { MdAdd, MdGroup, MdEdit, MdDelete, MdClose, MdCheck, MdContentCopy, MdPeople, MdCreate, MdLogin } from 'react-icons/md';
import { toast } from 'react-toastify';

const GroupSelection = () => {
    const { inviteCode: urlInviteCode } = useParams();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState(urlInviteCode ? 'join' : 'select');
    const [newGroup, setNewGroup] = useState({ name: '', description: '' });
    const [inviteCode, setInviteCode] = useState(urlInviteCode || '');

    const [editingGroup, setEditingGroup] = useState(null);
    const [editData, setEditData] = useState({ name: '', description: '' });

    const { setAppMode, setSelectedGroupId, user } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        fetchGroups();
        if (urlInviteCode) {
            setActiveTab('join');
            setInviteCode(urlInviteCode);
        }
    }, [urlInviteCode]);

    const fetchGroups = async () => {
        try {
            const res = await axios.get(`${API}/groups`);
            setGroups(res.data);
        } catch (error) {
            toast.error("Failed to load groups");
        } finally {
            setLoading(false);
        }
    };

    const handleCreateGroup = async (e) => {
        e.preventDefault();
        if (!newGroup.name.trim()) {
            toast.error("Please enter a group name");
            return;
        }
        try {
            const res = await axios.post(`${API}/groups`, newGroup);
            setGroups([res.data, ...groups]);
            setNewGroup({ name: '', description: '' });
            setActiveTab('select');
            toast.success("Group created successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to create group");
        }
    };

    const handleJoinGroup = async (e) => {
        e.preventDefault();
        if (!inviteCode.trim()) {
            toast.error("Please enter an invite code");
            return;
        }
        try {
            await axios.post(`${API}/groups/join`, { inviteCode: inviteCode.toUpperCase() });
            setInviteCode('');
            setActiveTab('select');
            fetchGroups();
            toast.success("Joined group successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Invalid invite code");
        }
    };

    const handleSelectGroup = (groupId) => {
        setSelectedGroupId(groupId);
        setAppMode('group');
        navigate('/groups/dashboard');
    };

    const handleUpdateGroup = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.put(`${API}/groups/${editingGroup._id}`, editData);
            setGroups(groups.map(g => g._id === editingGroup._id ? res.data : g));
            setEditingGroup(null);
            toast.success("Group updated successfully!");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to update group");
        }
    };

    const handleDeleteGroup = async (groupId, groupName) => {
        if (!window.confirm(`Are you sure you want to delete "${groupName}"?`)) return;
        try {
            await axios.delete(`${API}/groups/${groupId}`);
            setGroups(groups.filter(g => g._id !== groupId));
            toast.success("Group deleted successfully");
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to delete group");
        }
    };

    const startEditing = (e, group) => {
        e.stopPropagation();
        setEditingGroup(group);
        setEditData({ name: group.name, description: group.description || '' });
    };

    const copyInviteCode = (code) => {
        navigator.clipboard.writeText(code);
        toast.success("Invite code copied!");
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex justify-center items-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background py-10 px-4 sm:px-6 lg:px-8">
            <div className="max-w-5xl mx-auto space-y-10 text-textColor">
                {/* Header Section */}
                <div className="text-center space-y-4">
                    <div className="inline-flex items-center justify-center p-4 bg-primary/10 rounded-2xl mb-2 transition-transform hover:scale-110">
                        <MdGroup className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl font-extrabold tracking-tight">
                        Group Selection
                    </h1>
                    <p className="text-textColor/60 text-lg max-w-2xl mx-auto leading-relaxed">
                        Track shared expenses, manage group bills, and collaborate seamlessly with friends and family.
                    </p>
                </div>

            {/* Tab Navigation */}
            <div className="flex justify-center">
                <div className="bg-card p-1.5 rounded-2xl flex gap-1 shadow-inner border border-background">
                    <button
                        onClick={() => setActiveTab('select')}
                        className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${activeTab === 'select'
                            ? 'bg-card shadow-md text-primary scale-105'
                            : 'text-textColor/60 hover:text-textColor hover:bg-card'
                            }`}
                    >
                        <MdGroup className="text-lg" />
                        My Groups
                    </button>
                    <button
                        onClick={() => setActiveTab('create')}
                        className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${activeTab === 'create'
                            ? 'bg-card shadow-md text-primary scale-105'
                            : 'text-textColor/60 hover:text-textColor hover:bg-card'
                            }`}
                    >
                        <MdCreate className="text-lg" />
                        Create Group
                    </button>
                    <button
                        onClick={() => setActiveTab('join')}
                        className={`px-8 py-3 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2.5 ${activeTab === 'join'
                            ? 'bg-card shadow-md text-primary scale-105'
                            : 'text-textColor/60 hover:text-textColor hover:bg-card'
                            }`}
                    >
                        <MdLogin className="text-lg" />
                        Join Group
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div>
                {/* My Groups Tab */}
                {activeTab === 'select' && (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {groups.length === 0 ? (
                            <div className="text-center py-20 bg-card rounded-3xl border border-background shadow-sm">
                                <div className="w-24 h-24 bg-background rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                                    <MdGroup className="w-12 h-12 text-textColor/40" />
                                </div>
                                <h3 className="text-2xl font-bold text-textColor">No groups found</h3>
                                <p className="text-textColor/60 mt-2 max-w-sm mx-auto">
                                    You aren't a member of any groups yet. Create a new one or join with an invite code.
                                </p>
                                <div className="mt-8 flex gap-4 justify-center">
                                    <button
                                        onClick={() => setActiveTab('create')}
                                        className="px-8 py-3 bg-primary text-white rounded-xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/20 active:scale-95"
                                    >
                                        Create Group
                                    </button>
                                    <button
                                        onClick={() => setActiveTab('join')}
                                        className="px-8 py-3 bg-card border border-background text-textColor rounded-xl font-bold hover:bg-background transition-all shadow-sm active:scale-95"
                                    >
                                        Join Group
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                                {groups.map((group) => {
                                    const isCreator = user && group.createdBy &&
                                        group.createdBy.toString() === (user._id || user.id).toString();
                                    return (
                                        <div
                                            key={group._id}
                                            onClick={() => handleSelectGroup(group._id)}
                                            className="group bg-card rounded-3xl border border-background shadow-sm cursor-pointer hover:shadow-xl hover:-translate-y-2 transition-all duration-300 overflow-hidden flex flex-col"
                                        >
                                            <div className="p-8 flex-1">
                                                <div className="flex items-start justify-between mb-6">
                                                    <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                                                        <MdGroup className="w-7 h-7 text-primary" />
                                                    </div>
                                                    {isCreator && (
                                                        <div className="flex gap-2">
                                                            <button
                                                                onClick={(e) => startEditing(e, group)}
                                                                className="p-2.5 text-textColor/50 hover:text-primary hover:bg-primary/5 rounded-xl transition-all"
                                                                title="Edit Group"
                                                            >
                                                                <MdEdit className="w-5 h-5" />
                                                            </button>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    handleDeleteGroup(group._id, group.name);
                                                                }}
                                                                className="p-2.5 text-textColor/50 hover:text-danger hover:bg-danger/5 rounded-xl transition-all"
                                                                title="Delete Group"
                                                            >
                                                                <MdDelete className="w-5 h-5" />
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                                <h3 className="text-xl font-bold text-textColor mb-2 group-hover:text-primary transition-colors">{group.name}</h3>
                                                <p className="text-textColor/60 text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                                                    {group.description || 'Manage shared expenses and split bills with your team.'}
                                                </p>
                                            </div>
                                            <div className="px-8 py-5 bg-background/50 border-t border-background flex items-center justify-between group-hover:bg-primary/5 transition-colors">
                                                <div className="flex items-center gap-2 text-sm font-semibold text-textColor/70">
                                                    <div className="w-8 h-8 rounded-full bg-card border border-background flex items-center justify-center -space-x-2">
                                                       <MdPeople className="text-primary w-4 h-4" />
                                                    </div>
                                                    <span>{group.members?.length || 1} members</span>
                                                </div>
                                                <div className="text-primary text-sm font-bold flex items-center gap-1">
                                                    Open <span className="transition-transform group-hover:translate-x-1">→</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                )}

                {/* Create Group Tab */}
                {activeTab === 'create' && (
                    <div className="max-w-xl mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-background transition-all duration-500 animate-in zoom-in-95">
                        <div className="bg-primary/5 px-8 py-6 border-b border-background">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-card rounded-2xl shadow-sm text-primary">
                                    <MdCreate className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-textColor">Create New Group</h2>
                                    <p className="text-sm text-textColor/60">Launch a new space for your shared expenses</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleCreateGroup} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-textColor/80 ml-1">Group Name</label>
                                <input
                                    type="text"
                                    value={newGroup.name}
                                    onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })}
                                    placeholder="e.g., Goa Trip 2024, Roommates"
                                    className="w-full px-5 py-4 bg-background border border-background rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all text-textColor placeholder:text-textColor/50"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-textColor/80 ml-1">Description (Optional)</label>
                                <textarea
                                    value={newGroup.description}
                                    onChange={(e) => setNewGroup({ ...newGroup, description: e.target.value })}
                                    placeholder="What is this group for?"
                                    className="w-full px-5 py-4 bg-background border border-background rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all text-textColor placeholder:text-textColor/50 resize-none"
                                    rows="4"
                                />
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-primary text-white rounded-2xl font-bold text-lg hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-[0.98]"
                            >
                                Create Group
                            </button>
                        </form>
                    </div>
                )}

                {/* Join Group Tab */}
                {activeTab === 'join' && (
                    <div className="max-w-xl mx-auto bg-card rounded-3xl shadow-xl overflow-hidden border border-background transition-all duration-500 animate-in zoom-in-95">
                        <div className="bg-secondary/5 px-8 py-6 border-b border-background">
                            <div className="flex items-center gap-4">
                                <div className="p-3 bg-card rounded-2xl shadow-sm text-secondary">
                                    <MdLogin className="w-6 h-6" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-textColor">Join a Group</h2>
                                    <p className="text-sm text-textColor/60">Enter the secret invite code shared with you</p>
                                </div>
                            </div>
                        </div>
                        <form onSubmit={handleJoinGroup} className="p-8 space-y-8">
                            <div className="space-y-4">
                                <label className="text-sm font-bold text-textColor/80 block text-center">Enter 6-Character Invite Code</label>
                                <input
                                    type="text"
                                    value={inviteCode}
                                    onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                                    placeholder="CODE24"
                                    className="w-full px-5 py-6 bg-background border-2 border-dashed border-background rounded-2xl focus:outline-none focus:ring-4 focus:ring-secondary/10 focus:bg-card focus:border-secondary transition-all text-center text-4xl font-black tracking-[0.5em] text-secondary placeholder:text-gray-200 uppercase"
                                    maxLength={6}
                                    required
                                />
                                <p className="text-xs text-textColor/50 text-center font-medium">
                                    Invite codes are case-sensitive and must be exactly 6 characters.
                                </p>
                            </div>
                            <button
                                type="submit"
                                className="w-full py-4 bg-secondary text-white rounded-2xl font-bold text-lg hover:bg-secondary/90 transition-all shadow-lg hover:shadow-secondary/30 active:scale-[0.98]"
                            >
                                Join Group Now
                            </button>
                        </form>
                    </div>
                )}
            </div>

            {/* Edit Modal */}
            {editingGroup && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-textColor/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-card rounded-3xl shadow-2xl w-full max-w-md overflow-hidden border border-white/20 transform transition-all animate-in zoom-in-95 duration-300">
                        <div className="bg-background/50 px-8 py-6 border-b border-background flex justify-between items-center">
                            <div>
                                <h2 className="text-xl font-bold text-textColor">Edit Group</h2>
                                <p className="text-xs text-textColor/60 mt-0.5">Update group name or description</p>
                            </div>
                            <button
                                onClick={() => setEditingGroup(null)}
                                className="p-2 hover:bg-card rounded-xl transition-all text-textColor/50 hover:text-textColor"
                            >
                                <MdClose className="w-6 h-6" />
                            </button>
                        </div>
                        <form onSubmit={handleUpdateGroup} className="p-8 space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-textColor/80 ml-1">Group Name</label>
                                <input
                                    type="text"
                                    value={editData.name}
                                    onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                    className="w-full px-5 py-4 bg-background border border-background rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all text-textColor"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-bold text-textColor/80 ml-1">Description</label>
                                <textarea
                                    value={editData.description}
                                    onChange={(e) => setEditData({ ...editData, description: e.target.value })}
                                    className="w-full px-5 py-4 bg-background border border-background rounded-2xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:bg-card focus:border-primary transition-all text-textColor resize-none"
                                    rows="4"
                                />
                            </div>
                            <div className="flex gap-4 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setEditingGroup(null)}
                                    className="flex-1 py-4 border border-background text-textColor rounded-2xl font-bold hover:bg-background transition-all active:scale-95"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    className="flex-1 py-4 bg-primary text-white rounded-2xl font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 active:scale-95"
                                >
                                    Save
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            </div>
        </div>
    );
};

export default GroupSelection;