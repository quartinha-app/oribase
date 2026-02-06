import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

interface AdminLayoutProps {
    children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background-light overflow-hidden">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
                {/* Mobile Header for Sidebar Toggle */}
                <div className="md:hidden h-16 bg-white border-b flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 bg-primary rounded-lg flex items-center justify-center text-white">
                            <span className="material-symbols-outlined text-lg">diversity_3</span>
                        </div>
                        <span className="font-bold text-text-main">Axé Admin</span>
                    </div>
                    <button onClick={() => setSidebarOpen(true)} className="p-2 text-gray-600">
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>

                {children}
            </main>
        </div>
    );
};

export default AdminLayout;
