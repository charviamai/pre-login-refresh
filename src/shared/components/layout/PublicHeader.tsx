import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { PublicThemeToggle } from './PublicThemeToggle';
import { PublicButton } from '../ui/PublicButton';

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

/**
 * PublicHeader - Charviam-styled navigation for pre-login pages
 * Features: sticky header, gradient CTAs, mobile responsive
 */
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
            // If we're not on the home page, navigate first
            if (location.pathname !== '/') {
                window.location.href = `/#${link.scrollId}`;
                return;
            }
            const element = document.getElementById(link.scrollId);
            if (element) {
                element.scrollIntoView({ behavior: 'smooth' });
            }
        }
        setIsMobileMenuOpen(false);
    };

    return (
        <header
            className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled
                    ? 'bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl shadow-lg border-b border-slate-200/50 dark:border-slate-700/50'
                    : 'bg-transparent'
            }`}
        >
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link to="/" className="flex items-center space-x-2 group">
                        <img src="/logo.png" alt="ArcadeX" className="h-10 w-auto" />
                        <div className="flex flex-col">
                            <span className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent group-hover:from-indigo-500 group-hover:to-purple-500 transition-all">
                                ArcadeX
                            </span>
                            <span className={`text-[9px] font-medium tracking-wide leading-none transition-colors ${
                                isScrolled ? 'text-slate-500 dark:text-slate-400' : 'text-slate-400 dark:text-slate-500'
                            }`}>
                                @ Charviam Product
                            </span>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            link.isScroll ? (
                                <button
                                    key={link.name}
                                    onClick={() => handleNavClick(link)}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                        isScrolled
                                            ? 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {link.name}
                                </button>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                        isScrolled
                                            ? 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                            : 'text-white/80 hover:text-white hover:bg-white/10'
                                    }`}
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}

                        <div className="flex items-center gap-3 ml-4">
                            <Link
                                to="/login"
                                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all ${
                                    isScrolled
                                        ? 'text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400'
                                        : 'text-white/80 hover:text-white'
                                }`}
                            >
                                Sign In
                            </Link>
                            <PublicButton variant="primary" size="sm" href="/signup">
                                Get Started
                            </PublicButton>
                            <PublicThemeToggle />
                        </div>
                    </nav>

                    {/* Mobile Menu Button */}
                    <div className="flex items-center gap-2 md:hidden">
                        <PublicThemeToggle />
                        <button
                            className={`p-2 rounded-lg transition-colors ${
                                isScrolled
                                    ? 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800'
                                    : 'text-white hover:bg-white/10'
                            }`}
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
                <div className="md:hidden border-t border-slate-200/50 dark:border-slate-700/50 bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                    <nav className="px-4 py-4 flex flex-col space-y-1">
                        {navLinks.map((link) => (
                            link.isScroll ? (
                                <button
                                    key={link.name}
                                    onClick={() => handleNavClick(link)}
                                    className="px-4 py-3 text-sm font-medium rounded-lg text-left text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {link.name}
                                </button>
                            ) : (
                                <Link
                                    key={link.name}
                                    to={link.path}
                                    onClick={() => setIsMobileMenuOpen(false)}
                                    className="px-4 py-3 text-sm font-medium rounded-lg text-slate-600 dark:text-slate-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                >
                                    {link.name}
                                </Link>
                            )
                        ))}
                        <div className="pt-4 space-y-2">
                            <Link
                                to="/login"
                                onClick={() => setIsMobileMenuOpen(false)}
                                className="block px-4 py-3 text-sm font-medium text-center rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                            >
                                Sign In
                            </Link>
                            <PublicButton variant="primary" className="w-full" href="/signup">
                                Get Started
                            </PublicButton>
                        </div>
                    </nav>
                </div>
            )}
        </header>
    );
};
