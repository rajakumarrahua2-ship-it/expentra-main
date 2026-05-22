import React, { useContext, useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Navbar from './Navbar';
import { AuthContext } from '../context/AuthContext';

const Layout = () => {
    const { user } = useContext(AuthContext);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);

    return (
        <div className="bg-background h-screen w-full flex text-textColor font-sans selection:bg-primary selection:text-card overflow-hidden">
            {/* Sidebar */}
            <Sidebar role={user?.role} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

            {/* Main Content Area */}
            <div className="flex-1 flex flex-col bg-background min-w-0">
                {/* Top Navbar */}
                <Navbar user={user} setIsSidebarOpen={setIsSidebarOpen} />

                {/* Page Content */}
                <main className="p-4 md:p-6 bg-background flex-1 overflow-x-hidden overflow-y-auto w-full">
                    <div className="max-w-7xl mx-auto space-y-6">
                        {/* Content Container */}
                        <div className="bg-transparent pb-6">
                            <Outlet />
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
};

export default Layout;