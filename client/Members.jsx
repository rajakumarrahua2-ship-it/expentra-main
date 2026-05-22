import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    MdGroupAdd, MdPerson, MdEdit, MdDelete, MdCheck, MdClose,
    MdContentCopy, MdEmail, MdPeople, MdAdminPanelSettings,
    MdInfoOutline, MdLink
} from 'react-icons/md';

const Members = () => {
    const { selectedGroupId, user } = useContext(AuthContext);
    const [groupData, setGroupData] = useState(null);
    const [loading, setLoading] = useState(true);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [editingMemberId, setEditingMemberId] = useState(null);
    const [editName, setEditName] = useState('');
    const [editEmail, setEditEmail] = useState('');

    const isAdmin = groupData && user && groupData.createdBy?.toString() === user._id?.toString();

    const fetchGroupData = async () => {
        try {
            const res = await axios.get(`${API}/groups/${selectedGroupId}`);
            setGroupData(res.data);
        } catch (error) {
            toast.error("Failed to load group members");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!selectedGroupId) return;
        fetchGroupData();
    }, [selectedGroupId]);

    const handleAddMember = async (e) => {
        e.preventDefault();
        if (!name.trim()) {
            toast.error("Name is required");
            return;
        }
        setIsSubmitting(true);
        try {
            await axios.put(`${API}/groups/${selectedGroupId}/members`, {
                name: name.trim(),
                email: email.trim() || undefined
            });
            toast.success(`${name} added to the group!`);
            setName('');
            setEmail('');
            await fetchGroupData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to add member");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleUpdateMember = async (memberId) => {
        if (!editName.trim()) {
            toast.error("Name is required");
            return;
        }
        setIsSubmitting(true);
        try {
            await axios.put(`${API}/groups/${selectedGroupId}/members/${memberId}`, {
                name: editName.trim(),
                email: editEmail.trim() || ''
            });
            toast.success("Member updated");
            setEditingMemberId(null);
            await fetchGroupData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Update failed");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDeleteMember = async (memberId, memberName) => {
        if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) return;
        try {
            await axios.delete(`${API}/groups/${selectedGroupId}/members/${memberId}`);
            toast.success("Member removed");
            await fetchGroupData();
        } catch (error) {
            toast.error(error.response?.data?.message || "Delete failed");
        }
    };

    const startEditing = (member) => {
        setEditingMemberId(member._id);
        setEditName(member.name);
        setEditEmail(member.email || '');
    };

    const copyToClipboard = (text, message) => {
        navigator.clipboard.writeText(text);
        toast.success(message);
    };

    if (!selectedGroupId) {
        return (
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="bg-card rounded-lg border border-background p-12 text-center shadow-sm">
                    <div className="w-16 h-16 bg-card rounded-full flex items-center justify-center mx-auto mb-4">
                        <MdPeople className="w-8 h-8 text-textColor/50" />
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
                    <div className="h-8 bg-card rounded w-1/3 animate-pulse"></div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="h-80 bg-card rounded-lg animate-pulse"></div>
                        <div className="h-80 bg-card rounded-lg animate-pulse"></div>
                        <div className="h-96 bg-card rounded-lg animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 py-8 space-y-6 bg-background min-h-screen pb-20">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-textColor tracking-tight">{groupData?.name}</h1>
                    <p className="text-sm text-textColor/60 mt-1">Manage group members and squad invitations</p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-card rounded-xl border border-background shadow-sm">
                    <MdPeople className="w-5 h-5 text-primary" />
                    <span className="text-sm font-semibold text-textColor opacity-70">
                        {groupData?.members?.length || 0} Members
                    </span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    {/* Invite Options Card */}
                    <div className="bg-card rounded-2xl border border-background shadow-sm overflow-hidden transition-all duration-300">
                        <div className="px-6 py-4 border-b border-background flex items-center gap-3">
                            <div className="bg-background rounded-xl p-2">
                                <MdGroupAdd className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-sm font-semibold text-textColor">Quick Invite</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            {/* Invite Code */}
                            <div>
                                <label className="block text-xs font-semibold text-textColor/50 uppercase tracking-wider mb-1.5">
                                    Invite Code
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-background px-4 py-2 rounded-xl font-mono text-base font-bold text-center border border-background text-textColor tracking-widest shadow-inner">
                                        {groupData?.inviteCode || 'N/A'}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(groupData?.inviteCode, "Invite code copied!")}
                                        className="p-2.5 bg-background text-primary rounded-xl border border-background hover:bg-primary/5 transition-all"
                                        title="Copy Code"
                                    >
                                        <MdContentCopy className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Invite Link */}
                            <div>
                                <label className="block text-xs font-semibold text-textColor/50 uppercase tracking-wider mb-1.5">
                                    Invite Link
                                </label>
                                <div className="flex items-center gap-2">
                                    <div className="flex-1 bg-background px-4 py-2 rounded-xl text-xs truncate border border-background text-textColor opacity-60">
                                        {groupData?.inviteLink || 'N/A'}
                                    </div>
                                    <button
                                        onClick={() => copyToClipboard(groupData?.inviteLink, "Invite link copied!")}
                                        className="p-2.5 bg-background text-primary rounded-xl border border-background hover:bg-primary/5 transition-all"
                                        title="Copy Link"
                                    >
                                        <MdLink className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <button
                                onClick={() => toast.info("Email invitation coming soon!")}
                                className="w-full py-2.5 bg-primary text-card rounded-xl font-medium text-sm hover:opacity-90 transition-all flex items-center justify-center gap-2 shadow-sm"
                            >
                                <MdEmail className="w-4 h-4" />
                                Invite via Email
                            </button>
                        </div>
                    </div>

                    {/* Add Member Form */}
                    {isAdmin && (
                        <div className="bg-card rounded-2xl border border-background shadow-sm overflow-hidden transition-all duration-300">
                            <div className="px-6 py-4 border-b border-background flex items-center gap-3">
                                <div className="bg-background rounded-xl p-2">
                                    <MdPerson className="w-5 h-5 text-secondary" />
                                </div>
                                <h2 className="text-sm font-semibold text-textColor">Add Member</h2>
                            </div>
                            <form onSubmit={handleAddMember} className="p-6 space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold text-textColor/50 uppercase tracking-wider mb-1.5">
                                        Full Name *
                                    </label>
                                    <input
                                        type="text"
                                        value={name}
                                        onChange={e => setName(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-textColor transition-all"
                                        placeholder="e.g. John Doe"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold text-textColor/50 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                                        Email <span className="text-[10px] lowercase opacity-50 font-normal tracking-normal">(optional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full px-4 py-2 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-sm font-medium text-textColor transition-all"
                                        placeholder="john@example.com"
                                    />
                                </div>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`w-full py-2.5 rounded-xl font-medium text-sm text-white transition-all shadow-sm ${isSubmitting
                                            ? 'bg-card cursor-not-allowed'
                                            : 'bg-primary hover:opacity-90'
                                        }`}
                                >
                                    {isSubmitting ? 'Adding...' : 'Add Member'}
                                </button>
                            </form>
                        </div>
                    )}
                </div>

                {/* Member List */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-2xl border border-background shadow-sm overflow-hidden h-full flex flex-col min-h-[500px]">
                        <div className="px-6 py-4 border-b border-background flex items-center gap-3">
                            <div className="bg-background rounded-xl p-2">
                                <MdPeople className="w-5 h-5 text-primary" />
                            </div>
                            <h2 className="text-sm font-semibold text-textColor">Active Squad Members</h2>
                        </div>

                        <div className="p-4 flex-1 overflow-y-auto max-h-[600px] scrolling-touch">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {groupData?.members?.map((member) => {
                                    const isCreator = groupData.createdBy?.toString() === (member.user?.toString() || member._id?.toString());
                                    const isCurrentUser = user && member.user?.toString() === user._id?.toString();
                                    const isEditing = editingMemberId === member._id;

                                    return (
                                        <div key={member._id} className={`group p-4 rounded-xl border transition-all duration-300 ${
                                            isEditing ? 'bg-card border-primary shadow-md' : 'bg-background border-background hover:border-primary/20 hover:shadow-sm'
                                        }`}>
                                            {isEditing ? (
                                                <div className="space-y-3">
                                                    <input
                                                        type="text"
                                                        value={editName}
                                                        onChange={e => setEditName(e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-background border border-background rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                                        placeholder="Name"
                                                        autoFocus
                                                    />
                                                    <input
                                                        type="email"
                                                        value={editEmail}
                                                        onChange={e => setEditEmail(e.target.value)}
                                                        className="w-full px-3 py-1.5 bg-background border border-background rounded-lg text-sm font-medium focus:ring-2 focus:ring-primary/20"
                                                        placeholder="Email"
                                                    />
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => handleUpdateMember(member._id)}
                                                            className="flex-1 py-1.5 bg-secondary text-white rounded-lg text-xs font-semibold hover:opacity-90"
                                                        >
                                                            Save
                                                        </button>
                                                        <button
                                                            onClick={() => setEditingMemberId(null)}
                                                            className="flex-1 py-1.5 bg-card text-textColor rounded-lg text-xs font-semibold hover:bg-card"
                                                        >
                                                            Cancel
                                                        </button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col h-full justify-between">
                                                    <div className="flex items-start justify-between">
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-sm border border-primary/10">
                                                                {member.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-semibold text-textColor truncate">{member.name}</p>
                                                                <p className="text-[10px] text-textColor/60 truncate font-medium">{member.email || 'No email shared'}</p>
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col items-end gap-1">
                                                            {isCreator && (
                                                                <span className="text-[9px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full uppercase tracking-wide">Admin</span>
                                                            )}
                                                            {isCurrentUser && !isCreator && (
                                                                <span className="text-[9px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full uppercase tracking-wide">You</span>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {(isAdmin && !isCreator) && (
                                                        <div className="flex items-center gap-3 mt-4 pt-3 border-t border-background opacity-0 group-hover:opacity-100 transition-opacity">
                                                            <button
                                                                onClick={() => startEditing(member)}
                                                                className="text-[10px] font-bold text-textColor opacity-40 hover:opacity-100 hover:text-primary transition-all flex items-center gap-1"
                                                            >
                                                                <MdEdit className="w-3.5 h-3.5" /> Edit
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteMember(member._id, member.name)}
                                                                className="text-[10px] font-bold text-textColor opacity-40 hover:opacity-100 hover:text-danger transition-all flex items-center gap-1"
                                                            >
                                                                <MdDelete className="w-3.5 h-3.5" /> Remove
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {groupData?.members?.length === 0 && (
                                <div className="flex flex-col items-center justify-center py-16 text-center text-textColor/50">
                                    <MdPeople className="w-12 h-12 mb-3 opacity-20" />
                                    <p className="text-sm font-medium">No members yet</p>
                                    <p className="text-xs opacity-60 mt-1">Building your squad? Start inviting others!</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Access Disclaimer */}
            {!isAdmin && (
                <div className="bg-amber-50 rounded-xl border border-amber-100 p-4 flex items-start gap-3">
                    <MdInfoOutline className="w-5 h-5 text-amber-600 shrink-0" />
                    <div>
                        <p className="text-sm font-semibold text-amber-900 leading-none">Security Note</p>
                        <p className="text-xs text-amber-800/70 mt-1.5 leading-relaxed">
                            Squad management (adding or removing members) is restricted to Group Admins only. You can still use the invite codes to invite friends.
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Members;