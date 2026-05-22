import React from 'react';
import PublicNavbar from '../components/PublicNavbar';
import { MdCheckCircle, MdCode, MdPerson } from 'react-icons/md';

const featuresList = [
    'Interactive dashboard with real-time analytics',
    'Expense and income tracking with categories',
    'Budget management and alerts',
    'Comprehensive financial reports (PDF/Excel)',
    'Group expense splitting and settlements',
    'Role-based access (User and Admin)',
    'Seamless authentication with Firebase and JWT',
];

const techStack = [
    { name: 'MongoDB', role: 'Database Layer' },
    { name: 'Express.js', role: 'Backend Framework' },
    { name: 'React', role: 'Frontend UI Library' },
    { name: 'Node.js', role: 'Execution Environment' },
    { name: 'Tailwind CSS', role: 'Styling Framework' },
];

const About = () => {
    return (
        <div className="min-h-screen bg-background flex flex-col">
            <PublicNavbar />

            <main className="flex-grow py-10 px-6">
                <div className="max-w-4xl mx-auto space-y-10">

                    {/* Page Heading */}
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-textColor mb-3">
                            About This <span className="text-primary">Project</span>
                        </h1>
                        <div className="w-20 h-1 bg-primary mx-auto rounded-full" />
                    </div>

                    {/* Project Description */}
                    <section className="bg-card shadow-md rounded-2xl p-5">
                        <h2 className="text-2xl font-semibold text-textColor mb-4 flex items-center gap-3">
                            <span className="w-1.5 h-7 bg-primary rounded-full" />
                            Project Description
                        </h2>
                        <p className="text-base text-textColor/70 leading-relaxed">
                            Expentra is a professional-grade Expense Management application designed to bridge the gap between simple tracking and complex financial analysis. Built with the MERN stack, it offers a robust platform for individuals and groups to manage their finances, visualize spending patterns, and maintain healthy financial habits through automated insights and reporting.
                        </p>
                    </section>

                    {/* Features List */}
                    <section>
                        <h2 className="text-2xl font-semibold text-textColor mb-6 text-center">
                            Key Features
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {featuresList.map((item, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-4 bg-card shadow-md rounded-2xl p-5 hover:shadow-lg transition-all duration-200"
                                >
                                    <MdCheckCircle className="text-secondary text-2xl flex-shrink-0" />
                                    <span className="text-base text-textColor font-medium">{item}</span>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Technologies */}
                    <section>
                        <h2 className="text-2xl font-semibold text-textColor mb-6 flex items-center gap-3">
                            <MdCode className="text-3xl text-primary" />
                            Technologies Used
                        </h2>
                        <div className="flex flex-wrap gap-4">
                            {techStack.map((tech, index) => (
                                <div
                                    key={index}
                                    className="bg-card shadow-md rounded-2xl px-6 py-4 hover:shadow-lg hover:border-primary/30 border border-background transition-all duration-200"
                                >
                                    <p className="text-base font-semibold text-primary">{tech.name}</p>
                                    <p className="text-sm text-textColor/60 mt-0.5">{tech.role}</p>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Developer Info */}
                    <section className="bg-card shadow-md rounded-2xl p-5 border border-primary/10">
                        <h2 className="text-2xl font-semibold text-textColor mb-5 flex items-center gap-3">
                            <MdPerson className="text-3xl text-primary" />
                            Developer Information
                        </h2>
                        <div className="flex items-center gap-6">
                            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center text-primary text-2xl font-bold flex-shrink-0">
                                V
                            </div>
                            <div>
                                <h3 className="text-base font-semibold text-textColor">Vansh [Surname Placeholder]</h3>
                                <p className="text-sm text-textColor/60 mt-0.5">Full Stack Developer · Final Year Student</p>
                                <p className="text-sm text-textColor/50 mt-1">
                                    Focused on building scalable MERN stack applications with premium UI/UX.
                                </p>
                            </div>
                        </div>
                    </section>

                </div>
            </main>

            {/* Footer */}
            <footer className="py-10 border-t border-background bg-card text-center">
                <p className="text-sm text-textColor/60">
                    Built with ❤️ for a better financial future.
                </p>
            </footer>
        </div>
    );
};

export default About;
