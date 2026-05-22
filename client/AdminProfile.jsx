import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext, API } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import {
    MdAdminPanelSettings, MdSecurity, MdPerson, MdEmail,
    MdLock, MdSave, MdHistory, MdLocationOn, MdVerifiedUser,
    MdInfoOutline, MdCheckCircle, MdWarning
} from 'react-icons/md';

const AdminProfile = () => {
    const { user, setUser } = useContext(AuthContext);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setName(user.name);
            setEmail(user.email);
        }
    }, [user]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            setLoading(true);
            const body = { name, email };
            if (password) body.password = password;

            const res = await axios.put(`${API}/auth/profile`, body);
            toast.success('Admin profile updated successfully');

            if (setUser && res.data.user) {
                setUser(res.data.user);
            }

            setPassword('');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Failed to update profile');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/5 rounded-lg">
                        <MdAdminPanelSettings className="w-7 h-7 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-textColor">Admin Profile</h1>
                        <p className="text-sm text-textColor/70 mt-0.5">Manage your account settings and security</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary/5 rounded-full">
                        <MdVerifiedUser className="w-4 h-4 text-secondary" />
                        <span className="text-xs font-medium text-secondary">Administrator</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Form - Main Column */}
                <div className="lg:col-span-2 space-y-6">
                    <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                        <div className="px-5 py-3 bg-background border-b border-background">
                            <div className="flex items-center gap-2">
                                <MdSecurity className="w-5 h-5 text-primary" />
                                <h2 className="font-semibold text-textColor">Security & Credentials</h2>
                            </div>
                            <p className="text-xs text-textColor/70 mt-0.5">Update your primary administrative contact and password</p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-5 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">
                                    Display Name
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Your full name"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">
                                    Admin Email
                                </label>
                                <input
                                    type="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="admin@example.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-textColor/80 mb-1">
                                    New Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-3 py-2 border border-background rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 pr-10"
                                        placeholder="Leave blank to keep current password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-textColor/60 hover:text-textColor/80"
                                    >
                                        {showPassword ? "🙈" : "👁️"}
                                    </button>
                                </div>
                                <p className="text-xs text-textColor/60 mt-1">
                                    Minimum 6 characters. Only update if you want to change your password.
                                </p>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-2 bg-primary text-white rounded-lg font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="animate-spin rounded-full w-5 h-5 border-2 border-white border-t-transparent"></div>
                                        Saving...
                                    </>
                                ) : (
                                    <>
                                        <MdSave className="text-base" />
                                        Update Settings
                                    </>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Info Card */}
                    <div className="bg-primary/5 rounded-lg border border-blue-200 p-4">
                        <div className="flex items-start gap-3">
                            <MdInfoOutline className="w-5 h-5 text-primary mt-0.5" />
                            <div>
                                <p className="text-sm font-medium text-blue-900">Security Tips</p>
                                <ul className="text-xs text-blue-800 mt-2 space-y-1.5">
                                    <li className="flex items-center gap-2">
                                        <MdCheckCircle className="text-xs text-primary" />
                                        Use a strong, unique password for your admin account
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MdCheckCircle className="text-xs text-primary" />
                                        Never share your login credentials with others
                                    </li>
                                    <li className="flex items-center gap-2">
                                        <MdCheckCircle className="text-xs text-primary" />
                                        Review your login activity regularly for suspicious access
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Login Activity */}
                <div className="space-y-6">
                    <div className="bg-card rounded-lg border border-background shadow-sm overflow-hidden">
                        <div className="px-4 py-3 bg-background border-b border-background">
                            <div className="flex items-center gap-2">
                                <MdHistory className="w-5 h-5 text-primary" />
                                <h3 className="font-semibold text-textColor">Login Activity</h3>
                            </div>
                            <p className="text-xs text-textColor/70 mt-0.5">Recent sign-ins to your account</p>
                        </div>

                        <div className="max-h-80 overflow-y-auto">
                            {loginActivities.length === 0 ? (
                                <div className="p-8 text-center">
                                    <div className="w-16 h-16 bg-background rounded-full flex items-center justify-center mx-auto mb-3">
                                        <MdHistory className="w-8 h-8 text-textColor/50" />
                                    </div>
                                    <p className="text-sm text-textColor/70">No login activity recorded</p>
                                    <p className="text-xs text-textColor/60 mt-1">Sign-ins will appear here</p>
                                </div>
                            ) : (
                                <div className="divide-y divide-background">
                                    {[...loginActivities].reverse().map((log, index) => (
                                        <div key={index} className="p-3 hover:bg-background transition">
                                            <div className="flex items-start gap-3">
                                                <div className="w-8 h-8 bg-primary/5 rounded-lg flex items-center justify-center shrink-0">
                                                    <MdLocationOn className="w-4 h-4 text-primary" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-textColor">
                                                        {new Date(log.date).toLocaleDateString(undefined, {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })}
                                                    </p>
                                                    <p className="text-xs text-textColor/70">
                                                        {new Date(log.date).toLocaleTimeString()}
                                                    </p>
                                                    <p className="text-xs font-mono text-textColor/60 mt-1">
                                                        IP: {log.ip || 'Unknown'}
                                                    </p>
                                                </div>
                                                {log.isNewDevice && (
                                                    <span className="text-xs font-medium bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                        New Device
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Admin Stats Card */}
                    <div className="bg-card rounded-lg border border-background shadow-sm p-4">
                        <div className="flex items-center gap-2 mb-3">
                            <MdVerifiedUser className="w-5 h-5 text-primary" />
                            <h3 className="font-semibold text-textColor">Account Summary</h3>
                        </div>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center py-2 border-b border-background">
                                <span className="text-sm text-textColor/70">Role</span>
                                <span className="text-sm font-medium text-primary">Super Admin</span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-background">
                                <span className="text-sm text-textColor/70">Account Status</span>
                                <span className="text-sm font-medium text-secondary flex items-center gap-1">
                                    <MdCheckCircle className="text-xs" />
                                    Active
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2 border-b border-background">
                                <span className="text-sm text-textColor/70">Member Since</span>
                                <span className="text-sm font-medium text-textColor">
                                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center py-2">
                                <span className="text-sm text-textColor/70">Total Logins</span>
                                <span className="text-sm font-medium text-textColor">{loginActivities.length}</span>
                            </div>
                        </div>
                    </div>

                    {/* Security Warning */}
                    {!password && (
                        <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-4">
                            <div className="flex items-start gap-2">
                                <MdWarning className="w-5 h-5 text-yellow-600 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-yellow-800">Security Recommendation</p>
                                    <p className="text-xs text-yellow-700 mt-1">
                                        Consider updating your password regularly to maintain account security.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminProfile;