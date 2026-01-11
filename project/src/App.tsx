
import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { useCRMStore } from '@/store/useCRMStore';
import { Loader2 } from 'lucide-react';

// Lazy load pages
const Login = React.lazy(() => import('@/pages/Login'));
const Register = React.lazy(() => import('@/pages/Register'));
const Profile = React.lazy(() => import('@/pages/Profile'));
const Dashboard = React.lazy(() => import('@/pages/Dashboard'));
const Contacts = React.lazy(() => import('@/pages/Contacts'));
const Kanban = React.lazy(() => import('@/pages/Kanban'));
const Messages = React.lazy(() => import('@/pages/Messages'));
const SendMass = React.lazy(() => import('@/pages/SendMass'));
const Agenda = React.lazy(() => import('@/pages/Agenda'));
const Properties = React.lazy(() => import('@/pages/Properties'));

const Loading = () => (
  <div className="h-screen flex items-center justify-center bg-slate-50 dark:bg-dark-bg">
    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
  </div>
);

import { useAuthStore } from '@/store/authStore';

// Auth Guard
import { RequireAuth, AuthLayout, RoleGuard } from '@/components/auth/AuthGuard';
const AdminUsers = React.lazy(() => import('@/pages/admin/Users'));

function App() {
  const { fetchContacts, fetchEvents } = useCRMStore();
  const { checkSession } = useAuthStore();

  React.useEffect(() => {
    checkSession();
    fetchContacts();
    fetchEvents();
  }, []);

  return (
    <BrowserRouter>
      <Suspense fallback={<Loading />}>
        <Routes>
          {/* Public Routes (Login, Register, etc) */}
          <Route element={<AuthLayout />}>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<Login />} /> {/* TODO: Create Forgot */}
          </Route>

          {/* Protected Routes (User App) */}
          <Route path="/app" element={<RequireAuth />}>
            <Route element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Navigate to="/app" replace />} />
              <Route path="contacts" element={<Contacts />} />
              <Route path="kanban" element={<Kanban />} />
              <Route path="messages" element={<Messages />} />
              <Route path="send-mass" element={<SendMass />} />
              <Route path="agenda" element={<Agenda />} />
              <Route path="properties" element={<Properties />} />
              <Route path="profile" element={<Profile />} />
            </Route>
          </Route>

          {/* Admin Routes */}
          <Route path="/admin" element={<RequireAuth />}>
            <Route element={<RoleGuard roles={['admin']} />}>
              <Route element={<MainLayout />}>
                <Route index element={<Navigate to="/admin/users" replace />} />
                <Route path="users" element={<AdminUsers />} />
              </Route>
            </Route>
          </Route>

          {/* Root Redirect */}
          <Route path="/" element={<Navigate to="/app" replace />} />
          <Route path="*" element={<Navigate to="/app" replace />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}

export default App;