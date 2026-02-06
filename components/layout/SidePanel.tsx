import React, { useEffect, useState } from 'react';

interface SidePanelProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

const SidePanel: React.FC<SidePanelProps> = ({ isOpen, onClose, title, children }) => {
    const [render, setRender] = useState(isOpen);

    useEffect(() => {
        if (isOpen) setRender(true);
    }, [isOpen]);

    const handleTransitionEnd = () => {
        if (!isOpen) setRender(false);
    };

    if (!render) return null;

    return (
        <div className={`fixed inset-0 z-[100] overflow-hidden ${!isOpen ? 'pointer-events-none' : ''}`}>
            {/* Backdrop */}
            <div
                className={`absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                onClick={onClose}
            />

            {/* Panel */}
            <div
                onTransitionEnd={handleTransitionEnd}
                className={`absolute inset-y-0 right-0 w-full max-w-xl bg-white shadow-2xl flex flex-col transform transition-transform duration-500 ease-out pointer-events-auto ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
            >
                <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-gray-50/50">
                    <div>
                        <h2 className="text-xl font-black text-text-main uppercase tracking-tight">{title}</h2>
                        <div className="h-1 w-12 bg-primary mt-1 rounded-full" />
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-xl text-gray-400 hover:bg-gray-100 hover:text-text-main transition-all active:scale-95"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                    {children}
                </div>
            </div>
        </div>
    );
};

export default SidePanel;
