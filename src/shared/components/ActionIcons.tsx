import React from 'react';

// Eye Icon for View
export const EyeIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

// Pencil Icon for Edit
export const PencilIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
);

// Trash Icon for Delete
export const TrashIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

// Check Icon for Approve/Mark Paid
export const CheckIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

// Undo Icon for Revert
export const UndoIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
    </svg>
);

// Action Button with Tooltip
interface ActionButtonProps {
    onClick: () => void;
    tooltip: string;
    icon: React.ReactNode;
    colorClass?: string;
    disabled?: boolean;
}

export const ActionButton: React.FC<ActionButtonProps> = ({
    onClick,
    tooltip,
    icon,
    colorClass = 'text-gray-600 hover:text-gray-800',
    disabled = false
}) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        disabled={disabled}
        className={`relative group p-1.5 rounded transition-colors
            md:hover:bg-gray-100 dark:md:hover:bg-slate-700 ${colorClass}
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        title={tooltip}
    >
        {icon}
        {/* Tooltip - hidden on mobile */}
        <span className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 dark:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
            {tooltip}
        </span>
    </button>
);

// Pre-configured action buttons
export const ViewButton: React.FC<{ onClick: () => void; tooltip?: string }> = ({ onClick, tooltip = 'View Details' }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<EyeIcon />}
        colorClass="text-blue-600 hover:text-blue-800"
    />
);

export const EditButton: React.FC<{ onClick: () => void; tooltip?: string }> = ({ onClick, tooltip = 'Edit Record' }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<PencilIcon />}
        colorClass="text-white md:text-slate-600 dark:md:text-slate-400 md:hover:text-slate-800 dark:md:hover:text-white"
    />
);

export const DeleteButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean }> = ({ onClick, tooltip = 'Delete Record', disabled }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<TrashIcon />}
        colorClass="text-white md:text-red-500 dark:md:text-red-400 md:hover:text-red-700 dark:md:hover:text-red-300"
        disabled={disabled}
    />
);

export const ApproveButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean }> = ({ onClick, tooltip = 'Mark as Paid', disabled }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<CheckIcon />}
        colorClass="text-green-600 hover:text-green-800"
        disabled={disabled}
    />
);

export const RevertButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean }> = ({ onClick, tooltip = 'Revert to Unpaid', disabled }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<UndoIcon />}
        colorClass="text-orange-600 hover:text-orange-800"
        disabled={disabled}
    />
);

// Gear Icon for Settings
export const GearIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
);

// Power Icon for Activate/Deactivate
export const PowerIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a5 5 0 01-7.072 0l2.829-2.829m4.243 2.829l2.829-2.829M12 3v3m0 12v3" />
    </svg>
);

// Simple Power On Icon
export const PowerOnIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.636 5.636a9 9 0 1012.728 0M12 3v9" />
    </svg>
);

// Mail Icon for Resend Invite
export const MailIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
);

// Plus Icon for Add
export const PlusIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

// Ban/Block Icon for Deactivate
export const BanIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
    </svg>
);

// Refresh Icon for Resend/Retry
export const RefreshIcon: React.FC<{ className?: string }> = ({ className = 'w-5 h-5' }) => (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
    </svg>
);

// Pre-configured action buttons for new icons
export const SettingsButton: React.FC<{ onClick: () => void; tooltip?: string }> = ({ onClick, tooltip = 'Settings' }) => (
    <button
        onClick={(e) => { e.stopPropagation(); onClick(); }}
        className="p-1.5 rounded-lg hover:bg-white/20 transition-colors text-slate-400 hover:text-white md:text-gray-600 md:hover:text-gray-800 md:hover:bg-gray-100"
        title={tooltip}
    >
        <GearIcon />
    </button>
);

export const ActivateButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean }> = ({ onClick, tooltip = 'Activate', disabled }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<PowerOnIcon />}
        colorClass="text-white md:text-green-600 md:hover:text-green-800"
        disabled={disabled}
    />
);

export const DeactivateButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean }> = ({ onClick, tooltip = 'Deactivate', disabled }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<BanIcon />}
        colorClass="text-white md:text-red-600 md:hover:text-red-800"
        disabled={disabled}
    />
);

export const ResendInviteButton: React.FC<{ onClick: () => void; tooltip?: string; disabled?: boolean; loading?: boolean }> = ({ onClick, tooltip = 'Resend Invitation', disabled, loading }) => (
    <ActionButton
        onClick={onClick}
        tooltip={loading ? 'Sending...' : tooltip}
        icon={loading ? <RefreshIcon className="w-5 h-5 animate-spin" /> : <MailIcon />}
        colorClass="text-blue-600 hover:text-blue-800"
        disabled={disabled || loading}
    />
);

export const AddButton: React.FC<{ onClick: () => void; tooltip?: string }> = ({ onClick, tooltip = 'Add New' }) => (
    <ActionButton
        onClick={onClick}
        tooltip={tooltip}
        icon={<PlusIcon />}
        colorClass="text-green-600 hover:text-green-800"
    />
);
