import { useAuth } from './contexts/AuthContext';
import Auth from './components/Auth';
import StudentDashboard from './components/StudentDashboard';
import AdminDashboard from './components/AdminDashboard';

function App() {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600 mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Auth />;
  }

  if (profile?.role === 'admin') {
    return <AdminDashboard />;
  }

  return <StudentDashboard />;
}

export default App;
