import React, { useState, useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext, API } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'react-toastify';
import PublicNavbar from '../components/PublicNavbar';
import { auth, googleProvider } from '../firebase';
import { signInWithPopup } from 'firebase/auth';
import { FcGoogle } from 'react-icons/fc';

const Register = () => {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        role: 'personal',
    });

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

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await axios.post(`${API}/auth/register`, formData);
            const { token, role } = res.data;
            login(token, res.data, role);
            toast.success('Registration successful! Welcome.');
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            toast.error(error.response?.data?.message || 'Registration failed. Please try again.');
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
            toast.success('Registration via Google successful!');
            
            if (role === 'admin') {
                navigate('/admin/dashboard');
            } else {
                navigate('/dashboard');
            }
        } catch (error) {
            if (error.code === 'auth/popup-closed-by-user') {
                toast.warning('Authentication cancelled');
            } else {
                toast.error(error.response?.data?.message || 'Google signup failed. Please try again.');
                console.error(error);
            }
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />

            <div className="flex-grow flex items-center justify-center py-10 px-6">
                <div className="w-full max-w-5xl bg-card rounded-2xl shadow-md overflow-hidden flex flex-col md:flex-row min-h-[620px]">

                    {/* Visual Identity Panel */}
                    <div className="hidden md:flex md:w-[45%] bg-primary p-12 text-card flex-col justify-between relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-64 h-64 bg-secondary/20 rounded-full -ml-32 -mt-32 blur-3xl" />
                        <div className="absolute bottom-0 right-0 w-64 h-64 bg-card/5 rounded-full -mr-32 -mb-32 blur-2xl" />

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-10">
                                <div className="w-11 h-11 bg-card rounded-xl flex items-center justify-center shadow-md">
                                    <span className="text-primary font-black text-xl">E</span>
                                </div>
                                <span className="text-lg font-bold tracking-tight uppercase">Expentra</span>
                            </div>

                            <h2 className="text-3xl font-bold leading-tight mb-4">
                                Create Your <br />
                                <span className="text-secondary">Free Account.</span>
                            </h2>
                            <p className="text-sm text-card/70 leading-relaxed max-w-xs">
                                Start tracking your money and expenses in seconds.
                            </p>
                        </div>

                        <div className="relative z-10 space-y-4">
                            <div className="flex items-center gap-4 bg-card/10 p-4 rounded-xl border border-card/10">
                                <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-xs font-bold text-card">✓</div>
                                <p className="text-sm font-semibold uppercase tracking-wider">Bank Grade Security</p>
                            </div>
                            <div className="flex items-center gap-4 bg-card/10 p-4 rounded-xl border border-card/10 opacity-70">
                                <div className="w-8 h-8 rounded-full bg-card/20 flex items-center justify-center text-xs font-bold text-card">✓</div>
                                <p className="text-sm font-semibold uppercase tracking-wider">100% Privacy Choice</p>
                            </div>
                        </div>
                    </div>

                    {/* Registration Form Panel */}
                    <div className="w-full md:w-[55%] p-8 lg:p-14 flex flex-col justify-center">
                        <div className="max-w-md mx-auto w-full">
                            <div className="mb-8">
                                <h1 className="text-3xl font-bold text-textColor mb-1">Create Account</h1>
                                <p className="text-sm text-textColor/60 uppercase tracking-wider font-semibold">
                                    Join the Expentra family
                                </p>
                            </div>

                            <form className="space-y-5" onSubmit={handleSubmit}>
                                <div>
                                    <label className="block text-xs font-semibold text-textColor/60 uppercase tracking-wider mb-2">
                                        Name
                                    </label>
                                    <input
                                        name="name"
                                        type="text"
                                        className="w-full px-4 py-3 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textColor placeholder-textColor/30 text-sm transition-all duration-200"
                                        placeholder="Your Name"
                                        value={formData.name}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-textColor/60 uppercase tracking-wider mb-2">
                                        Email
                                    </label>
                                    <input
                                        name="email"
                                        type="email"
                                        className="w-full px-4 py-3 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textColor placeholder-textColor/30 text-sm transition-all duration-200"
                                        placeholder="your@email.com"
                                        value={formData.email}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold text-textColor/60 uppercase tracking-wider mb-2">
                                        Password
                                    </label>
                                    <input
                                        name="password"
                                        type="password"
                                        className="w-full px-4 py-3 bg-background border border-background rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary text-textColor placeholder-textColor/30 text-sm transition-all duration-200"
                                        placeholder="••••••••••••"
                                        value={formData.password}
                                        onChange={handleChange}
                                        required
                                    />
                                </div>

                                <button
                                    type="submit"
                                    className="w-full bg-primary text-card py-3 rounded-lg font-semibold text-sm uppercase tracking-wider shadow-lg hover:opacity-90 transition-all duration-200 mt-2"
                                >
                                    Create Account
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
                                    <p className="text-xs text-textColor/50 uppercase tracking-wider mb-1">Already have an account?</p>
                                    <p className="text-sm font-semibold text-textColor">Login to your account</p>
                                </div>
                                <Link
                                    to="/login"
                                    className="bg-secondary text-card px-6 py-2 rounded-lg font-semibold text-sm hover:opacity-90 transition-all duration-200 shadow-md"
                                >
                                    Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;