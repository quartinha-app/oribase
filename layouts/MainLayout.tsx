import React from 'react';
import Navbar, { NavbarProps } from '../components/layout/Navbar';

export interface MainLayoutProps {
    children: React.ReactNode;
    navbarProps?: NavbarProps;
    className?: string;
    disablePadding?: boolean;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children, navbarProps, className = '', disablePadding = false }) => {
    const defaultLinks = [
        { label: 'Pesquisas', to: '/pesquisas' },
        { label: 'Profissionais', to: '/servicos' },
        { label: 'Sou Profissional', to: '/area-profissional' }
    ];

    const finalNavbarProps = {
        ...navbarProps,
        links: navbarProps?.links || defaultLinks
    };

    return (
        <div className={`flex flex-col min-h-screen bg-background-light ${className}`}>
            <Navbar {...finalNavbarProps} />
            <main className={`flex-grow flex flex-col ${disablePadding ? '' : 'max-w-[1440px] mx-auto w-full p-4 md:p-8'}`}>
                {children}
            </main>
        </div>
    );
};

export default MainLayout;
