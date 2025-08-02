import React from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { NotificationProvider } from './contexts/NotificationContext';
import { ToastProvider } from './contexts/ToastProvider';
import Login from './components/Login';
import Header from './components/shared/Header';
import ReceptionDashboard from './components/reception/ReceptionDashboard';
import OwnerDashboard from './components/owner/OwnerDashboard';
import SuperAdminDashboard from './components/super-admin/SuperAdminDashboard';

const AppContent: React.FC = () => {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  const renderDashboard = () => {
    switch (user.role) {
      case 'reception':
        return <ReceptionDashboard />;
      case 'owner':
        return <OwnerDashboard />;
      case 'super-admin':
        return <SuperAdminDashboard />;
      default:
        return <ReceptionDashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {renderDashboard()}
      </main>
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;