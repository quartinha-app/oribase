import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface ProfessionalRouteProps {
    children: React.ReactNode;
}

const ProfessionalRoute: React.FC<ProfessionalRouteProps> = ({ children }) => {
    const { user, profile, loading, signOut } = useAuth();

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="size-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
            </div>
        );
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    // Auto-logout if user is not a professional
    if (profile?.role !== 'fornecedor') {
        console.log('Auto-logout: User is not a professional');
        signOut();
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
};

export default ProfessionalRoute;
