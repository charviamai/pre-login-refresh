import React from 'react';
import { Link } from 'react-router-dom';

export const PublicFooter: React.FC = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer
            className="bg-slate-900 dark:bg-slate-950 text-white"
            style={{ fontFamily: 'var(--public-font-sans)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Company Info */}
                    <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                            <img src="/logo.png" alt="ArcadeX" className="h-10 w-auto" />
                            <h3 className="text-xl font-bold">ArcadeX</h3>
                        </div>
                        <p className="text-slate-400 text-sm">
                            The complete arcade management platform. Digital ticketing, biometric check-ins,
                            workforce management, and real-time analytics.
                        </p>
                    </div>

                    {/* Platform */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Platform</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li>
                                <button
                                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="hover:text-white transition-colors"
                                >
                                    Features
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="hover:text-white transition-colors"
                                >
                                    Pricing
                                </button>
                            </li>
                            <li>
                                <button
                                    onClick={() => document.getElementById('services')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="hover:text-white transition-colors"
                                >
                                    Services
                                </button>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-white transition-colors">
                                    Get Started
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Company */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Company</h4>
                        <ul className="space-y-2 text-sm text-slate-400">
                            <li>
                                <button
                                    onClick={() => document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' })}
                                    className="hover:text-white transition-colors"
                                >
                                    About Us
                                </button>
                            </li>
                            <li>
                                <Link to="/signup" className="hover:text-white transition-colors">
                                    Contact
                                </Link>
                            </li>
                            <li>
                                <Link to="/privacy" className="hover:text-white transition-colors">
                                    Privacy Policy
                                </Link>
                            </li>
                            <li>
                                <Link to="/terms" className="hover:text-white transition-colors">
                                    Terms of Service
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Contact Info */}
                    <div className="space-y-4">
                        <h4 className="text-lg font-semibold">Contact</h4>
                        <ul className="space-y-3 text-sm text-slate-400">
                            <li className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                                </svg>
                                <a href="mailto:support@arcadex.io" className="hover:text-white transition-colors">
                                    support@arcadex.io
                                </a>
                            </li>
                            <li className="flex items-center gap-2">
                                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                                </svg>
                                <a href="tel:+17047016403" className="hover:text-white transition-colors">
                                    +1 704-701-6403
                                </a>
                            </li>
                            <li className="flex items-start gap-2">
                                <svg className="h-4 w-4 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                                <span>United States</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Bottom Bar */}
                <div className="mt-12 pt-8 border-t border-slate-800">
                    <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                        <p className="text-sm text-slate-400">
                            © {currentYear} ArcadeX by Charviam. All rights reserved.
                        </p>
                        <div className="flex gap-6 text-sm text-slate-400">
                            <Link to="/privacy" className="hover:text-white transition-colors">
                                Privacy Policy
                            </Link>
                            <Link to="/terms" className="hover:text-white transition-colors">
                                Terms of Service
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};
