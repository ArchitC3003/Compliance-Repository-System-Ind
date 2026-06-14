import { AppProvider, useAppContext } from './context/AppContext';
import Sidebar from './components/Sidebar';
import Toast from './components/Toast';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import RepositoryPage from './pages/RepositoryPage';
import IngestPage from './pages/IngestPage';
import ReportsPage from './pages/ReportsPage';
import AdminPage from './pages/AdminPage';

function AppContent() {
  const { state } = useAppContext();

  if (!state.session) {
    return <LoginPage />;
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
        return <AdminPage />;
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
