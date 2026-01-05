import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { ShopProvider } from '../../../shared/context/ShopContext';

export const ClientLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false); // For mobile only

  return (
    <ShopProvider>
      <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-slate-900">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Header */}
          <Header onMenuClick={() => setSidebarOpen(true)} />

          {/* Page Content */}
          <main className="flex-1 overflow-y-auto bg-gray-50 dark:bg-slate-900">
            <Outlet />
          </main>
        </div>
      </div>
    </ShopProvider>
  );
};
