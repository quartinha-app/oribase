import React, { useState } from 'react';
import Sidebar from '../components/layout/Sidebar';

interface LeaderLayoutProps {
    children: React.ReactNode;
}

const LeaderLayout: React.FC<LeaderLayoutProps> = ({ children }) => {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="flex h-screen bg-background-light overflow-hidden font-sans">
            <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

            <main className="flex-1 flex flex-col overflow-y-auto w-full relative">
                {/* Mobile Header for Sidebar Toggle */}
                <div className="md:hidden h-16 bg-white border-b flex items-center px-4 justify-between shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="size-8 flex items-center justify-center">
                            <img src="/favicon_oribase.png" className="w-full h-full object-contain" alt="OríBase" />
                        </div>
                        <span className="text-sm font-black text-text-main tracking-tighter uppercase leading-none">Orí<span className="text-secondary italic">Base</span></span>
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

export default LeaderLayout;
