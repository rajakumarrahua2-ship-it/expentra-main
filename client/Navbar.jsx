import React, { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { MdLogout, MdAccountCircle, MdMenu, MdNotifications } from 'react-icons/md';
import { Link } from 'react-router-dom';

const Navbar = ({ user, setIsSidebarOpen }) => {
    const { logout, appMode, activeGroup, unreadCount, markAsSeen } = useContext(AuthContext);

    return (
        <header className="bg-card px-6 py-4 flex items-center justify-between border-b border-background sticky top-0 z-10 transition-all duration-200">
            {/* Left side: Menu toggle and Title */}
            <div className="flex items-center gap-4">
                <button
                    className="md:hidden p-2 text-textColor hover:bg-background rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                    onClick={() => setIsSidebarOpen(true)}
                >
                    <MdMenu className="w-6 h-6" />
                </button>

                <div className="flex flex-col">
                    <h2 className="text-xl font-semibold text-textColor capitalize">
                        {appMode === 'group' && activeGroup ? activeGroup.name : `${user?.role} Portal`}
                    </h2>
                </div>

                {appMode === 'group' && (
                    <Link
                        to="/groups"
                        className="ml-2 border border-primary text-primary px-4 py-2 rounded-lg hover:bg-background transition-all duration-200 hover:-translate-y-0.5 hidden sm:flex items-center text-sm font-medium"
                    >
                        Switch Group
                    </Link>
                )}
            </div>

            {/* Right side: Notifications, Profile, and Logout */}
            <div className="flex items-center gap-4">

                {/* Notifications and Profile */}
                <div className="flex items-center gap-4 border-r border-background pr-4">
                    <Link
                        to="/alerts"
                        onClick={markAsSeen}
                        className="relative p-2 text-textColor hover:bg-background rounded-lg transition-all duration-200 hover:-translate-y-0.5"
                    >
                        <MdNotifications className="w-6 h-6" />
                        {unreadCount > 0 && (
                            <span className="absolute top-1 right-1 flex h-4 w-4">
                                <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-4 w-4 bg-secondary text-[10px] font-bold flex items-center justify-center text-card">
                                    {unreadCount > 9 ? '9+' : unreadCount}
                                </span>
                            </span>
                        )}
                    </Link>

                    <div className="flex items-center gap-2">
                        <MdAccountCircle className="h-8 w-8 text-primary" />
                        <div className="hidden lg:block text-left">
                            <p className="text-sm font-semibold text-textColor">Hi, {user?.name}</p>
                        </div>
                    </div>
                </div>

                {/* Logout Button */}
                <button
                    onClick={logout}
                    className="flex items-center gap-2 bg-primary text-card px-4 py-2 rounded-lg hover:opacity-90 transition-all duration-200 hover:-translate-y-0.5"
                >
                    <MdLogout className="h-5 w-5" />
                    <span className="text-sm hidden sm:inline-block font-medium">Logout</span>
                </button>
            </div>
        </header>
    );
};

export default Navbar;