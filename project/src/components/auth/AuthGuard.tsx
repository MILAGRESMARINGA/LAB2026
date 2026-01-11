import React from 'react';
import { useAuthStore } from '@/store/authStore';
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import PendingApproval from '@/pages/PendingApproval';

export const RequireAuth = () => {
    const { isAuthenticated, loading, user } = useAuthStore();
    const location = useLocation();

    if (loading) {
        return (
            <div className="h-screen flex items-center justify-center bg-slate-900">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
            </div>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (user?.status === 'pending') {
        return <PendingApproval />;
    }

    if (user?.status === 'banned') {
        // Could redirect to banned page
        return <Navigate to="/login" replace />;
    }

    return <Outlet />;
};

export const RoleGuard = ({ roles }: { roles: string[] }) => {
    const { user, loading } = useAuthStore();

    if (loading) return null; // Or loader

    if (!user || !roles.includes(user.role)) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};

export const AuthLayout = () => {
    const { isAuthenticated } = useAuthStore();

    if (isAuthenticated) {
        return <Navigate to="/app" replace />;
    }

    return <Outlet />;
};
