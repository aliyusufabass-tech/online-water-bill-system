import AdminPanel from '../components/AdminPanel';
import { styles } from '../uiStyles';

export default function AdminPage({ user, onLogout, initialTab, onNavigate }) {
  return (
    <main className="page">
      <div style={styles.card}>
        <h2>Admin Portal</h2>
        <p>Username: {user.username}</p>
        <button style={styles.button} onClick={onLogout}>Logout</button>
      </div>
      <AdminPanel currentUser={user} initialTab={initialTab} onNavigate={onNavigate} />
    </main>
  );
}
