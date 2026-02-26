import AdminPanel from '../components/AdminPanel';

export default function AdminPage({ user, onLogout, initialTab, onNavigate }) {
  return (
    <main className="page dashboard-page">
      <AdminPanel currentUser={user} onLogout={onLogout} initialTab={initialTab} onNavigate={onNavigate} />
    </main>
  );
}
