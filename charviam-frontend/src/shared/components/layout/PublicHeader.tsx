import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicThemeToggle } from './PublicThemeToggle';

interface NavLink {
    name: string;
    path: string;
    isScroll?: boolean;
    scrollId?: string;
}

const navLinks: NavLink[] = [
    { name: 'Home', path: '/', isScroll: false },
    { name: 'About', path: '/', isScroll: true, scrollId: 'about' },
    { name: 'Services', path: '/', isScroll: true, scrollId: 'services' },
    { name: 'Pricing', path: '/', isScroll: true, scrollId: 'pricing' },
];

export const PublicHeader: React.FC = () => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = React.useState(false);
    const [isScrolled, setIsScrolled] = React.useState(false);
    const location = useLocation();

    React.useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 20);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const handleNavClick = (link: NavLink) => {
        if (link.isScroll && link.scrollId) {
            const element = document.getElementById(link.scrollId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setIsMobileMenuOpen(false);
    };

    const isActive = (path: string) => {
        if (path === '/') return location.pathname === '/';
        return location.pathname.startsWith(path);
    };

    return (
        <header
            className={`sticky top-0 z-50 w-full border-b transition-all duration-300 ${isScrolled
                ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 border-slate-200 dark:border-slate-700'
                : 'bg-transparent border-transparent'
                }`}
            style={{ fontFamily: 'var(--public-font-sans)' }}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2">
                        <img src="/logo.png" alt="ArcadeX" className="h-10 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                ArcadeX
                            </span>
                            <span className="text-[9px] font-medium text-slate-500 dark:text-slate-400 tracking-wide leading-none">
                                @ Charviam Product
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNavClick(link)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${isActive(link.path)
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {link.name}
                            </button>
                        ))}

                        {/* Sign Up / Login Button */}
                        <Link
                            to="/signup"
                            className="ml-2 px-4 py-2 text-sm font-medium text-white rounded-md transition-all bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30"
                        >
                            Get Started
                        </Link>

                        <PublicThemeToggle />
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <PublicThemeToggle />
                        <button
                            className="p-2 text-slate-600 dark:text-slate-300"
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            aria-label="Toggle menu"
                        >
                            {isMobileMenuOpen ? (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            ) : (
                                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isMobileMenuOpen && (
                <div className="md:hidden border-t bg-white dark:bg-slate-900">
                    <nav className="px-4 py-4 flex flex-col space-y-2">
                        {navLinks.map((link) => (
                            <button
                                key={link.name}
                                onClick={() => handleNavClick(link)}
                                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors text-left ${isActive(link.path)
                                    ? 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-900/30'
                                    : 'text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800'
                                    }`}
                            >
                                {link.name}
                            </button>
                        ))}
                        <Link
                            to="/signup"
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="mt-4 px-4 py-2 text-sm font-medium text-center text-white rounded-md bg-gradient-to-r from-indigo-500 to-purple-600"
                        >
                            Get Started
                        </Link>
                    </nav>
                </div>
            )}
        </header>
    );
};
