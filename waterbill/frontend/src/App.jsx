import { useEffect, useState } from 'react';
import { api, clearTokens } from './api';
import AdminPage from './pages/AdminPage';
import AuthPage from './pages/AuthPage';
import HomePage from './pages/HomePage';
import UserPage from './pages/UserPage';

function navigateTo(path, setPath) {
  if (window.location.pathname !== path) {
    window.history.pushState({}, '', path);
  }
  setPath(path);
}

export default function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [path, setPath] = useState(window.location.pathname || '/home');

  const navigate = (to) => navigateTo(to, setPath);

  const loadMe = async () => {
    try {
      setError('');
      const me = await api('/me/');
      setUser(me.authenticated ? me : null);
    } catch (err) {
      clearTokens();
      setUser(null);
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMe();
    const handler = () => setPath(window.location.pathname || '/home');
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  const logout = async () => {
    try {
      await api('/logout/', { method: 'POST' });
    } finally {
      clearTokens();
      setUser(null);
      navigate('/home');
    }
  };

  const adminOnlyPaths = ['/admin-dashboard', '/add-bill', '/admin-payments', '/admin-reports'];
  const customerOnlyPaths = ['/customer-dashboard', '/view-bills', '/history', '/payment', '/receipts'];
  const handleAuthSuccess = async (authUser) => {
    await loadMe();
    navigate(authUser?.is_staff ? '/admin-dashboard' : '/customer-dashboard');
  };

  if (!user && adminOnlyPaths.includes(path)) {
    return <AuthPage error={error} role="admin" mode="login" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }
  if (!user && customerOnlyPaths.includes(path)) {
    return <AuthPage error={error} role="customer" mode="login" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }

  if (user?.is_staff && customerOnlyPaths.includes(path)) {
    return <AdminPage user={user} onLogout={logout} initialTab="dashboard" onNavigate={navigate} />;
  }
  if (user && !user.is_staff && adminOnlyPaths.includes(path)) {
    return <UserPage user={user} onLogout={logout} initialTab="profile" onNavigate={navigate} />;
  }

  if (path === '/home' || path === '/') {
    return <HomePage onNavigate={navigate} />;
  }

  if (path === '/admin/login') {
    return <AuthPage error={error} role="admin" mode="login" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }
  if (path === '/admin/register') {
    return <AuthPage error={error} role="admin" mode="register" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }
  if (path === '/login') {
    return <AuthPage error={error} role="customer" mode="login" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }
  if (path === '/register') {
    return <AuthPage error={error} role="customer" mode="register" onAuthenticated={handleAuthSuccess} onNavigate={navigate} />;
  }

  if (!user) {
    return <HomePage onNavigate={navigate} />;
  }

  if (path === '/admin-dashboard') {
    return <AdminPage user={user} onLogout={logout} initialTab="dashboard" onNavigate={navigate} />;
  }
  if (path === '/add-bill') {
    return <AdminPage user={user} onLogout={logout} initialTab="bills" onNavigate={navigate} />;
  }
  if (path === '/admin-payments') {
    return <AdminPage user={user} onLogout={logout} initialTab="payments" onNavigate={navigate} />;
  }
  if (path === '/admin-reports') {
    return <AdminPage user={user} onLogout={logout} initialTab="reports" onNavigate={navigate} />;
  }

  if (path === '/customer-dashboard') {
    return <UserPage user={user} onLogout={logout} initialTab="profile" onNavigate={navigate} />;
  }
  if (path === '/view-bills') {
    return <UserPage user={user} onLogout={logout} initialTab="bills" onNavigate={navigate} />;
  }
  if (path === '/payment') {
    return <UserPage user={user} onLogout={logout} initialTab="payment" onNavigate={navigate} />;
  }
  if (path === '/history') {
    return <UserPage user={user} onLogout={logout} initialTab="history" onNavigate={navigate} />;
  }
  if (path === '/receipts') {
    return <UserPage user={user} onLogout={logout} initialTab="receipts" onNavigate={navigate} />;
  }

  return <HomePage onNavigate={navigate} />;
}
