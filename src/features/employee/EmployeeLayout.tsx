import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { EmployeeSidebar } from './layout/EmployeeSidebar';
import { EmployeeHeader } from './layout/EmployeeHeader';

// Get selected shop from sessionStorage
const getSelectedShop = (): { id: string; name: string } | null => {
    const stored = sessionStorage.getItem('employee_selected_shop');
    if (stored) {
        try {
            return JSON.parse(stored);
        } catch {
            return null;
        }
    }
    return null;
};

interface EmployeeLayoutProps {
    children?: React.ReactNode;
}

export const EmployeeLayout: React.FC<EmployeeLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const navigate = useNavigate();
    const selectedShop = getSelectedShop();

    // Redirect to shop selection if no shop is selected
    useEffect(() => {
        if (!selectedShop) {
            navigate('/employee/select-shop');
        }
    }, [selectedShop, navigate]);

    return (
        <div className="flex h-screen overflow-hidden">
            {/* Sidebar */}
            <EmployeeSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                {/* Header */}
                <EmployeeHeader onMenuClick={() => setSidebarOpen(true)} />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
                    {children || <Outlet />}
                </main>
            </div>
        </div>
    );
};
