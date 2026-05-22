import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MdMenu, MdClose } from 'react-icons/md';

const PublicNavbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const { pathname } = useLocation();

    const navLinks = [
        { name: 'Home', path: '/' },
        { name: 'Dashboard', path: '/dashboard' },
    ];

    const isActive = (path) => {
        if (path === '/') return pathname === '/';
        return pathname.startsWith(path);
    };

    return (
        <nav className="bg-card shadow-sm sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between h-16 items-center">
                    {/* Logo */}
                    <Link to="/" className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                            <span className="font-black text-card text-base">E</span>
                        </div>
                        <span className="text-xl font-bold text-textColor tracking-tight">
                            EXPENTRA
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center gap-6">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                className={`text-sm font-semibold transition-colors duration-200 ${
                                    isActive(link.path)
                                        ? 'text-primary'
                                        : 'text-textColor hover:text-primary'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            to="/login"
                            className="bg-primary text-card px-5 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-all duration-200"
                        >
                            Login
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <div className="md:hidden flex items-center">
                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="text-textColor p-2 rounded-md hover:bg-background transition-colors"
                            aria-label="Toggle menu"
                        >
                            {isMenuOpen ? <MdClose size={26} /> : <MdMenu size={26} />}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMenuOpen && (
                <div className="md:hidden bg-card border-t border-background">
                    <div className="px-4 pt-2 pb-4 space-y-1">
                        {navLinks.map((link) => (
                            <Link
                                key={link.name}
                                to={link.path}
                                onClick={() => setIsMenuOpen(false)}
                                className={`block px-4 py-3 rounded-lg text-sm font-semibold transition-all duration-200 ${
                                    isActive(link.path)
                                        ? 'text-primary bg-primary/5'
                                        : 'text-textColor hover:bg-background hover:text-primary'
                                }`}
                            >
                                {link.name}
                            </Link>
                        ))}
                        <Link
                            to="/login"
                            onClick={() => setIsMenuOpen(false)}
                            className="block px-4 py-3 rounded-lg bg-primary text-card text-sm font-semibold text-center mt-2 hover:opacity-90 transition-all duration-200"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            )}
        </nav>
    );
};

export default PublicNavbar;
