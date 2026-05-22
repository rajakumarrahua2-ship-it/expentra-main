import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PublicNavbar from '../components/PublicNavbar';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, user, token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (token && user) {
            if (user.role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        }
    }, [token, user, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/auth/login`, { email, password });
            const { token, role } = res.data;
            login(token, res.data, role);
            toast.success('Welcome back to Expentra!');
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed. Please check your email and password.');
            console.error(error);
        }
    };

    const handleGoogleLogin = async () => {
        try {
            const result = await signInWithPopup(auth, googleProvider);
            const user = result.user;

            const res = await axios.post(`${API}/auth/google`, {
                name: user.displayName,
                email: user.email,
                photoURL: user.photoURL,
            });

            const { token, role } = res.data;
            login(token, res.data, role);
            toast.success('Google Login successful!');
            
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                toast.warning('Authentication cancelled');
            } else {
                toast.error(error.response?.data?.message || 'Google Login failed. Please try again.');
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />

            <div className="flex-grow flex items-center justify-center py-10 px-6">
                <div className="w-full max-w-5xl bg-card rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row min-h-[580px]">

                    {/* Visual Identity Panel */}
                    <div className="hidden md:flex md:w-[45%] bg-primary p-12 text-card flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-secondary/20 rounded-full -mr-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 left-0 w-64 h-64 bg-card/5 rounded-full -ml-32 -mb-32 blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-12">
                                <div className="w-11 h-11 bg-card rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-primary font-black text-xl">E</span>
                                </div>
                                <span className="text-lg font-bold tracking-tight uppercase">Expentra</span>
                            </div>

                            <h2 className="text-3xl font-bold leading-tight mb-4">
                                Track Your <br />
                                <span className="text-secondary">Money Easily.</span>
                            </h2>
                            <p className="text-sm text-card/70 leading-relaxed max-w-xs">
                                Simple way to manage your daily expenses and savings.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-4 bg-card/10 p-4 rounded-xl border border-card/10 hover:bg-card/15 transition-all">
                                <div className="w-9 h-9 rounded-lg bg-card/10 flex items-center justify-center text-sm font-bold">1</div>
                                <div>
                                    <p className="text-sm font-semibold">Cloud Sync</p>
                                    <p className="text-xs text-card/50 uppercase tracking-widest">Access everywhere</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4 bg-card/10 p-4 rounded-xl border border-card/10">
                                <div className="w-9 h-9 rounded-lg bg-secondary flex items-center justify-center text-sm font-bold text-card">2</div>
                                <div>
                                    <p className="text-sm font-semibold">Group Split</p>
                                    <p className="text-xs text-card/50 uppercase tracking-widest">With friends &amp; family</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Login Form Panel */}
                    <div className="w-full md:w-[55%] p-8 lg:p-14 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-textColor mb-1">Welcome Back</h1>
                                <p className="text-sm text-textColor/60 uppercase tracking-wider font-semibold">
                                    Sign in to your account
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-xs font-semibold text-textColor/60 uppercase tracking-wider mb-2">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        className="w-full px-4 py-3 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textColor placeholder-textColor/30 text-sm transition-all duration-200"
                                        placeholder="your@email.com"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-textColor/60 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        className="w-full px-4 py-3 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textColor placeholder-textColor/30 text-sm transition-all duration-200"
                                        placeholder="••••••••••••"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-card py-3 rounded-lg font-semibold text-sm uppercase tracking-wider shadow-lg hover:opacity-90 transition-all duration-200 mt-2"
                                >
                                    Login
                                </button>
                            </form>

                            <div className="relative my-6">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-background"></div>
                                </div>
                                <div className="relative flex justify-center text-xs uppercase">
                                    <span className="bg-card px-2 text-textColor/40 font-semibold tracking-wider">Or continue with</span>
                                </div>
                            </div>

                            <button
                                onClick={handleGoogleLogin}
                                className="w-full flex items-center justify-center gap-3 bg-background border border-background py-3 rounded-lg font-semibold text-sm uppercase tracking-wider shadow-sm hover:bg-background/80 transition-all duration-200"
                            >
                                <FcGoogle className="text-xl" />
                                <span>Google</span>
                            </button>

                            <div className="mt-8 pt-8 border-t border-background flex flex-col sm:flex-row items-center justify-between gap-4">
                                <div>
                                    <p className="text-xs text-textColor/50 uppercase tracking-wider mb-1">New to Expentra?</p>
                                    <p className="text-sm font-semibold text-textColor">Create your free account</p>
                                </div>
                                <Link
                                    to="/register"
                                    className="bg-secondary text-card px-6 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-md"
                                >
                                    Sign Up
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Login;