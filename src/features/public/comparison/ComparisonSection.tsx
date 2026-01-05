import React from 'react';
import './comparison.css';

// --- Types ---
interface CompactComparisonRow {
    arcadex: string | string[];
    others: string | string[];
    icon?: React.ReactNode;
    highlight?: boolean;
}

// --- Data ---
const comparisonData: CompactComparisonRow[] = [
    {
        arcadex: ["24/7 Priority Support & Staff Training", "Expert Hardware Setup & Implementation"],
        others: ["Onetime Employee Training Programs", "Limited Technical Support for Hardware Setup"],
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        ),
        highlight: true
    },
    {
        arcadex: ["Unified Merchant POS & Game Control Hub", "Real-Time Multi-Tenant Enterprise Visibility"],
        others: ["Fragmented Operational Tools", "Limited Standalone Software Kits"],
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
            </svg>
        ),
        highlight: true
    },
    {
        arcadex: ["Advanced Biometric & Digital Identity Suite", "Automated Financial & Fraud Guard"],
        others: ["Legacy Manual Verification Methods", "Manual Fraud & Audit Processes"],
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
        )
    },
    {
        arcadex: ["Integrated Workforce Management & Payroll", "Scalable Infrastructure for Rapid Growth"],
        others: ["Manual Time Tracking Sheets", "No Integrated Employee Portal"],
        icon: (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
        )
    }
];

// --- Functional Components ---

const ComparisonRow: React.FC<CompactComparisonRow> = ({ others, arcadex, icon, highlight }) => {
    const othersArray = Array.isArray(others) ? others : [others];
    const arcadexArray = Array.isArray(arcadex) ? arcadex : [arcadex];

    return (
        <div className={`comparison-row ${highlight ? 'highlight' : ''}`}>
            <div className="value-cell arcadex-cell">
                <div className="cell-content">
                    <div className="text-wrapper">
                        {arcadexArray.map((value, index) => (
                            <div key={index} className="value-item">
                                <span className="premium-check">✓</span> {value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="central-divider">
                <div className="divider-line"></div>
                {icon && <div className="divider-icon">{icon}</div>}
                {!icon && highlight && <div className="divider-dot"></div>}
            </div>

            <div className="value-cell others-cell">
                <div className="cell-content">
                    <div className="text-wrapper">
                        {othersArray.map((value, index) => (
                            <div key={index} className="value-item">
                                <span className="muted-cross">×</span> {value}
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
};

export const ComparisonSection: React.FC = () => {
    // Flatten data for mobile view
    const allArcadeX = comparisonData.flatMap(row => Array.isArray(row.arcadex) ? row.arcadex : [row.arcadex]);
    const allOthers = comparisonData.flatMap(row => Array.isArray(row.others) ? row.others : [row.others]);

    return (
        <section className="comparison-section">
            <div className="comparison-container">
                <div className="section-header">
                    <h2 className="section-title">
                        ArcadeX <span className="vs">vs</span> Others
                    </h2>
                </div>

                {/* Desktop view (Original Grid) */}
                <div className="comparison-table desktop-only">
                    <div className="comparison-header">
                        <div className="header-column arcadex-header"><h3>ArcadeX</h3></div>
                        <div className="header-spacer"></div>
                        <div className="header-column others-header"><h3>Others</h3></div>
                    </div>
                    {comparisonData.map((row, index) => (
                        <ComparisonRow key={index} {...row} />
                    ))}
                </div>

                {/* Mobile view (Aggregated Blocks) */}
                <div className="mobile-only-comparison">
                    <div className="mobile-block arcadex-block">
                        <h3 className="mobile-block-title">ArcadeX</h3>
                        <div className="mobile-points-list">
                            {allArcadeX.map((point, idx) => (
                                <div key={idx} className="mobile-point">
                                    <span className="premium-check">✓</span> {point}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="mobile-block others-block">
                        <h3 className="mobile-block-title">Others</h3>
                        <div className="mobile-points-list">
                            {allOthers.map((point, idx) => (
                                <div key={idx} className="mobile-point muted">
                                    <span className="muted-cross">×</span> {point}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};
