import React from 'react';

/**
 * Loading Skeleton Components
 * 
 * Provides placeholder UI while content is loading.
 * Improves perceived performance and prevents layout shift.
 */

// ============================================================================
// BASE SKELETON
// ============================================================================

interface SkeletonProps {
    className?: string;
    animate?: boolean;
}

/**
 * Base skeleton element with shimmer animation
 */
export const Skeleton: React.FC<SkeletonProps> = ({
    className = '',
    animate = true
}) => (
    <div
        className={`bg-gray-200 dark:bg-gray-700 rounded ${animate ? 'animate-pulse' : ''
            } ${className}`}
    />
);

// ============================================================================
// TEXT SKELETONS
// ============================================================================

export const SkeletonText: React.FC<{ lines?: number; className?: string }> = ({
    lines = 1,
    className = ''
}) => (
    <div className={`space-y-2 ${className}`}>
        {Array.from({ length: lines }).map((_, i) => (
            <Skeleton
                key={i}
                className={`h-4 ${i === lines - 1 && lines > 1 ? 'w-3/4' : 'w-full'}`}
            />
        ))}
    </div>
);

export const SkeletonTitle: React.FC<{ className?: string }> = ({ className = '' }) => (
    <Skeleton className={`h-6 w-48 ${className}`} />
);

export const SkeletonSubtitle: React.FC<{ className?: string }> = ({ className = '' }) => (
    <Skeleton className={`h-4 w-32 ${className}`} />
);

// ============================================================================
// AVATAR & IMAGE SKELETONS
// ============================================================================

export const SkeletonAvatar: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({
    size = 'md',
    className = ''
}) => {
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-16 h-16',
    };
    return <Skeleton className={`${sizeClasses[size]} rounded-full ${className}`} />;
};

export const SkeletonImage: React.FC<{ className?: string }> = ({ className = '' }) => (
    <Skeleton className={`w-full h-48 rounded-lg ${className}`} />
);

// ============================================================================
// FORM SKELETONS
// ============================================================================

export const SkeletonInput: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={className}>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-10 w-full rounded-lg" />
    </div>
);

export const SkeletonButton: React.FC<{ className?: string; width?: string }> = ({
    className = '',
    width = 'w-32'
}) => (
    <Skeleton className={`h-10 ${width} rounded-lg ${className}`} />
);

export const SkeletonSelect: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={className}>
        <Skeleton className="h-4 w-24 mb-1" />
        <Skeleton className="h-10 w-full rounded-lg" />
    </div>
);

// ============================================================================
// TABLE SKELETON
// ============================================================================

interface SkeletonTableProps {
    rows?: number;
    columns?: number;
    className?: string;
}

export const SkeletonTable: React.FC<SkeletonTableProps> = ({
    rows = 5,
    columns = 4,
    className = ''
}) => (
    <div className={`w-full ${className}`}>
        {/* Header */}
        <div className="flex gap-4 pb-3 border-b border-gray-200 dark:border-gray-700">
            {Array.from({ length: columns }).map((_, i) => (
                <Skeleton key={i} className="h-4 flex-1" />
            ))}
        </div>
        {/* Rows */}
        {Array.from({ length: rows }).map((_, rowIdx) => (
            <div
                key={rowIdx}
                className="flex gap-4 py-3 border-b border-gray-100 dark:border-gray-800"
            >
                {Array.from({ length: columns }).map((_, colIdx) => (
                    <Skeleton key={colIdx} className="h-4 flex-1" />
                ))}
            </div>
        ))}
    </div>
);

// ============================================================================
// CARD SKELETON
// ============================================================================

export const SkeletonCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <div className="flex items-center gap-3 mb-4">
            <SkeletonAvatar size="md" />
            <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-2" />
                <Skeleton className="h-3 w-24" />
            </div>
        </div>
        <SkeletonText lines={3} />
    </div>
);

// ============================================================================
// LIST SKELETON
// ============================================================================

interface SkeletonListProps {
    items?: number;
    showAvatar?: boolean;
    className?: string;
}

export const SkeletonList: React.FC<SkeletonListProps> = ({
    items = 5,
    showAvatar = true,
    className = ''
}) => (
    <div className={`space-y-4 ${className}`}>
        {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
                {showAvatar && <SkeletonAvatar size="sm" />}
                <div className="flex-1">
                    <Skeleton className="h-4 w-3/4 mb-1" />
                    <Skeleton className="h-3 w-1/2" />
                </div>
            </div>
        ))}
    </div>
);

// ============================================================================
// DASHBOARD SKELETONS
// ============================================================================

export const SkeletonStatCard: React.FC<{ className?: string }> = ({ className = '' }) => (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 ${className}`}>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-8 w-16 mb-1" />
        <Skeleton className="h-3 w-20" />
    </div>
);

export const SkeletonDashboard: React.FC = () => (
    <div className="space-y-6">
        {/* Stats row */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonStatCard key={i} />
            ))}
        </div>
        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <SkeletonCard />
            <SkeletonCard />
        </div>
        {/* Table */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
            <Skeleton className="h-6 w-48 mb-4" />
            <SkeletonTable rows={5} columns={5} />
        </div>
    </div>
);

// ============================================================================
// SPECIFIC PAGE SKELETONS
// ============================================================================

/**
 * Skeleton for employee list page
 */
export const SkeletonEmployeeList: React.FC = () => (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {/* Search & Filter */}
        <div className="flex gap-4 mb-4">
            <Skeleton className="h-10 flex-1 max-w-xs rounded-lg" />
            <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
        {/* Table */}
        <SkeletonTable rows={8} columns={6} />
    </div>
);

/**
 * Skeleton for schedule page
 */
export const SkeletonSchedule: React.FC = () => (
    <div className="space-y-4">
        {/* Week navigation */}
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-8 rounded" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-8 w-8 rounded" />
        </div>
        {/* Days header */}
        <div className="grid grid-cols-7 gap-2 mb-2">
            {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-10 rounded" />
            ))}
        </div>
        {/* Schedule grid */}
        <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: 35 }).map((_, i) => (
                <Skeleton key={i} className="h-24 rounded" />
            ))}
        </div>
    </div>
);

/**
 * Skeleton for timesheet page
 */
export const SkeletonTimesheet: React.FC = () => (
    <div className="space-y-4">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
            <Skeleton className="h-8 w-48" />
            <div className="flex gap-2">
                <Skeleton className="h-10 w-32 rounded-lg" />
                <Skeleton className="h-10 w-32 rounded-lg" />
            </div>
        </div>
        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <SkeletonStatCard key={i} />
            ))}
        </div>
        {/* Table */}
        <SkeletonTable rows={10} columns={7} />
    </div>
);
