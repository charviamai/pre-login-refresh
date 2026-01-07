import React from 'react';
import { Link, useLocation } from 'react-router-dom';

/**
 * PublicFooter - Charviam-styled footer for pre-login pages
 * Dark theme with gradient accents
 */
export const PublicFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();
    const location = useLocation();

    const handleScrollToSection = (sectionId: string) => {
        if (location.pathname !== '/') {
            window.location.href = `/#${sectionId}`;
            return;
        }
        const element = document.getElementById(sectionId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth' });
        }
    };

    return (
        <footer className="relative bg-slate-900 dark:bg-slate-950 text-white overflow-hidden">
            {/* Gradient accent line */}
            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
                    {/* Company Info */}
                    <div className="lg:col-span-1 space-y-4">
                        <div className="flex items-center space-x-2">
                            <img src="/logo.png" alt="ArcadeX" className="h-10 w-auto" />
                            <div className="flex flex-col">
                                <span className="text-xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                                    ArcadeX
                                </span>
                                <span className="text-[9px] text-slate-500 tracking-wide">@ Charviam Product</span>
                            </div>
                        </div>
                        <p className="text-slate-400 text-sm leading-relaxed">
                            The complete arcade management platform. Digital ticketing, biometric check-ins,
                            workforce management, and real-time analytics.
                        </p>
                        {/* Social Links */}
                        <div className="flex gap-4 pt-2">
                            <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a href="#" className="text-slate-500 hover:text-indigo-400 transition-colors">
                                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" />
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Platform */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Platform</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <button
                                    onClick={() => handleScrollToSection('services')}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    Features
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => handleScrollToSection('pricing')}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    Pricing
                                </button>
                            </li>
                            <li>
                                <Link to="/signup" className="text-slate-400 hover:text-white transition-colors">
                                    Get Started
                                </Link>
                            </li>
                            <li>
                                <Link to="/login" className="text-slate-400 hover:text-white transition-colors">
                                    Sign In
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Company</h4>
                        <ul className="space-y-3 text-sm">
                            <li>
                                <button
                                    onClick={() => handleScrollToSection('about')}
                                    className="text-slate-400 hover:text-white transition-colors"
                                >
                                    About Us
                                </button>
                            </li>
                            <li>
                                <Link to="/signup" className="text-slate-400 hover:text-white transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="text-slate-400 hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="text-slate-400 hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm font-semibold uppercase tracking-wider text-slate-300">Contact</h4>
                        <ul className="space-y-3 text-sm">
                            <li className="flex items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                    </svg>
                                </div>
                                <a href="mailto:support@arcadex.io" className="hover:text-white transition-colors">
                                    support@arcadex.io
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                    </svg>
                                </div>
                                <a href="tel:+17047016403" className="hover:text-white transition-colors">
                                    +1 704-701-6403
                                </a>
                            </li>
                            <li className="flex items-center gap-3 text-slate-400">
                                <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center">
                                    <svg className="h-4 w-4 text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                </div>
                                <span>United States</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-500">
                            © {currentYear} ArcadeX by Charviam. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm">
                            <Link to="/privacy" className="text-slate-500 hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="text-slate-500 hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
