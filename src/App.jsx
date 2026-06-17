import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import RepositoryPage from './pages/RepositoryPage';
import IngestPage from './pages/IngestPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { state, auth } = useAppContext();

  // Show loading screen while checking auth
  if (auth.loading) {
    return (
      <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0f1a', color: '#10b981', fontFamily: "'Inter', sans-serif" }}>
        Initializing...
      </div>
    );
  }

  // Show login if not authenticated
  if (!auth.isAuthenticated) {
    return <AuthPage onLogin={auth.login} />;
  }

  const renderPanel = () => {
    switch (state.activePanel) {
      case 'dashboard':
        return <DashboardPage />;
      case 'repository':
        return <RepositoryPage />;
      case 'ingest':
        return <IngestPage />;
      case 'reports':
        return <ReportsPage />;
      case 'admin':
        // Only Admin and Super Admin can access
        if (auth.isAdmin) return <AdminPage />;
        return (
          <div className="empty-state">
            <h2>Access Denied</h2>
            <p className="text-secondary">You do not have permission to access the Admin panel.</p>
          </div>
        );
      default:
        return <DashboardPage />;
    }
  };

  return (
    <div className="app-layout">
      <Sidebar />
      <main className="main-content">
        {renderPanel()}
      </main>
      <Toast />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
