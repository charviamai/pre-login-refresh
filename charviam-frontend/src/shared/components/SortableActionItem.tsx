import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableActionItemProps {
    id: string;
    label: string;
    icon: React.ReactNode;
    checked: boolean;
    onToggle: () => void;
}

export const SortableActionItem: React.FC<SortableActionItemProps> = ({
    id,
    label,
    icon,
    checked,
    onToggle,
}) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging,
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-2 p-3 rounded-lg border ${checked
                ? 'bg-blue-50 border-blue-200'
                : 'bg-gray-50 border-gray-100'
                }`}
        >
            {/* Drag Handle */}
            <button
                {...attributes}
                {...listeners}
                className="p-1 cursor-grab active:cursor-grabbing text-gray-400 hover:text-gray-600 touch-none"
                title="Drag to reorder"
                style={{ touchAction: 'none' }}
            >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
                </svg>
            </button>

            {/* Checkbox */}
            <input
                type="checkbox"
                checked={checked}
                onChange={onToggle}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />

            {/* Icon */}
            <div className="w-8 h-8 bg-gray-200 rounded-lg flex items-center justify-center text-gray-600">
                {icon}
            </div>

            {/* Label */}
            <span className="text-sm font-medium text-gray-700 flex-1">{label}</span>
        </div>
    );
};
