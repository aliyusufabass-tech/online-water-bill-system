import UserPanel from '../components/UserPanel';

export default function UserPage({ user, onLogout, initialTab, onNavigate }) {
  return (
    <main className="page dashboard-page">
      <UserPanel user={user} onLogout={onLogout} initialTab={initialTab} onNavigate={onNavigate} />
    </main>
  );
}
