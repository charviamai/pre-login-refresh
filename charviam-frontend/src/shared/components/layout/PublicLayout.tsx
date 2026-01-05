import React from 'react';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

interface PublicLayoutProps {
    children: React.ReactNode;
    showHeader?: boolean;
    showFooter?: boolean;
}

/**
 * PublicLayout - Wrapper for all pre-login pages
 * Provides consistent Charvium-style header, footer, and theming
 * DO NOT use this for post-login pages
 */
export const PublicLayout: React.FC<PublicLayoutProps> = ({
    children,
    showHeader = true,
    showFooter = true,
}) => {
    return (
        <div
            className="min-h-screen flex flex-col public-bg"
            style={{ fontFamily: 'var(--public-font-sans)' }}
        >
            {showHeader && <PublicHeader />}

            <main className="flex-1">
                {children}
            </main>

            {showFooter && <PublicFooter />}
        </div>
    );
};
