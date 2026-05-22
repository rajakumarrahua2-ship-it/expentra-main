import React, { useContext, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import PublicNavbar from '../components/PublicNavbar';
import { AuthContext } from '../context/AuthContext';
import { MdAddCircle, MdShowChart, MdPieChart } from 'react-icons/md';

const features = [
    {
        icon: <MdAddCircle className="text-4xl text-primary" />,
        title: 'Add Expense',
        description: 'Easily log your daily expenses with categories and tags to keep everything organized.',
    },
    {
        icon: <MdShowChart className="text-4xl text-secondary" />,
        title: 'Track Expenses',
        description: 'Monitor your spending habits over time with beautiful, interactive visualizations.',
    },
    {
        icon: <MdPieChart className="text-4xl text-primary" />,
        title: 'Analytics',
        description: 'Get deep insights into your financial health with detailed reports and predictions.',
    },
];

const Home = () => {
    const { token } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        if (token) {
            navigate('/dashboard');
        }
    }, [token, navigate]);

    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />

            <main className="flex-grow">
                {/* Hero Section */}
                <section className="py-20 px-6 text-center max-w-5xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-bold text-textColor mb-6 leading-tight">
                        Manage Your <span className="text-primary">Expenses</span> Smartly
                    </h1>
                    <p className="text-base text-textColor/70 mb-10 max-w-2xl mx-auto leading-relaxed">
                        Take control of your finances with Expentra. Track spending, set budgets, and achieve your financial goals with ease.
                    </p>
                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="bg-primary text-card px-8 py-3 rounded-lg font-semibold text-base hover:opacity-90 transition-all duration-200 shadow-lg"
                        >
                            Get Started
                        </Link>
                        <Link
                            to="/dashboard"
                            className="bg-card text-primary border-2 border-primary px-8 py-3 rounded-lg font-semibold text-base hover:bg-primary hover:text-card transition-all duration-200 shadow-md"
                        >
                            View Dashboard
                        </Link>
                    </div>
                </section>

                {/* Features Section */}
                <section className="py-10 bg-card">
                    <div className="max-w-7xl mx-auto px-6">
                        <h2 className="text-2xl font-semibold text-textColor text-center mb-12">
                            Why Choose Expentra?
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {features.map((feature, index) => (
                                <div
                                    key={index}
                                    className="p-5 rounded-2xl bg-background border border-background hover:shadow-xl hover:border-primary/20 transition-all duration-300 group"
                                >
                                    <div className="mb-4 transform transition-transform group-hover:scale-110 duration-300">
                                        {feature.icon}
                                    </div>
                                    <h3 className="text-base font-semibold text-textColor mb-2">
                                        {feature.title}
                                    </h3>
                                    <p className="text-sm text-textColor/70 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA Section */}
                <section className="py-10 px-6">
                    <div className="bg-primary rounded-2xl p-10 md:p-16 text-center text-card shadow-2xl max-w-6xl mx-auto">
                        <h2 className="text-2xl font-semibold mb-4">
                            Ready to Take Charge of Your Finances?
                        </h2>
                        <p className="text-base text-card/80 mb-8 max-w-2xl mx-auto">
                            Join thousands of users who are already saving more and spending smarter with Expentra.
                        </p>
                        <Link
                            to="/register"
                            className="bg-card text-primary px-8 py-3 rounded-lg font-semibold text-base hover:bg-background transition-all duration-200 shadow-xl inline-block"
                        >
                            Join Now — It's Free!
                        </Link>
                    </div>
                </section>
            </main>

            {/* Footer */}
            <footer className="py-10 border-t border-background bg-card text-center">
                <p className="text-sm text-textColor/60">
                    &copy; 2026 EXPENTRA. All rights reserved.
                </p>
            </footer>
        </div>
    );
};

export default Home;
