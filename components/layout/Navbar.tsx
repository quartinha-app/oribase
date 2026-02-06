import React, { useState } from 'react';
import { Link } from 'react-router-dom';

interface NavbarLink {
    label: string;
    href?: string;
    to?: string;
}

export interface NavbarProps {
    variant?: 'landing' | 'app';
    subtitle?: string;
    links?: NavbarLink[];
    actionButtons?: React.ReactNode;
}

const Navbar: React.FC<NavbarProps> = ({
    variant = 'landing',
    subtitle,
    links = [],
    actionButtons
}) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const isLanding = variant === 'landing';
    const bgClass = isLanding
        ? 'bg-background-light/90 backdrop-blur-md border-primary/10'
        : 'bg-white border-gray-200 shadow-sm';

    return (
        <nav className={`sticky top-0 z-[9999] w-full border-b ${bgClass}`}>
            <div className="max-w-[1440px] mx-auto px-6 h-16 lg:h-20 flex items-center justify-between">

                {/* Logo Section */}
                <div className="flex items-center gap-3">
                    <Link to="/" className="flex items-center gap-3 group cursor-pointer">
                        <div className="size-10 flex items-center justify-center transition-transform group-hover:scale-105 duration-300">
                            <img src="/favicon_oribase.png" className="w-10 h-10 object-contain" alt="OríBase" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-text-main font-bold leading-none tracking-tight text-xl">
                                Orí<span className="text-secondary italic">Base</span>
                            </span>
                            {isLanding ? (
                                <span className="text-secondary font-bold text-xs uppercase tracking-[0.2em] mt-1">Consciência e Fundamento</span>
                            ) : (
                                <span className="text-xs font-medium text-gray-500">{subtitle || 'Painel de Resultados'}</span>
                            )}
                        </div>
                    </Link>
                </div>

                {/* Desktop Links */}
                {links.length > 0 && (
                    <div className="hidden md:flex items-center gap-8">
                        {links.map((link, idx) => (
                            link.to ? (
                                <Link key={idx} to={link.to} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                    {link.label}
                                </Link>
                            ) : (
                                <a key={idx} href={link.href} className="text-sm font-medium text-gray-600 hover:text-primary transition-colors">
                                    {link.label}
                                </a>
                            )
                        ))}
                    </div>
                )}

                {/* Mobile Menu Button */}
                <div className="md:hidden flex items-center gap-4">
                    <button
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                </div>

                {/* Desktop Actions */}
                <div className="hidden md:flex items-center gap-4">
                    {actionButtons}
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden border-t border-gray-100 bg-white p-4 space-y-4 shadow-lg">
                    {links.map((link, idx) => (
                        link.to ? (
                            <Link key={idx} to={link.to} className="block py-2 text-base font-medium text-gray-700 hover:text-primary">
                                {link.label}
                            </Link>
                        ) : (
                            <a key={idx} href={link.href} className="block py-2 text-base font-medium text-gray-700 hover:text-primary">
                                {link.label}
                            </a>
                        )
                    ))}
                    {actionButtons && (
                        <div className="pt-4 border-t border-gray-100">
                            {actionButtons}
                        </div>
                    )}
                </div>
            )}
        </nav>
    );
};

export default Navbar;
