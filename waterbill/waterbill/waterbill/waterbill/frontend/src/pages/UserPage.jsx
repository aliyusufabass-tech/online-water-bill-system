import UserPanel from '../components/UserPanel';
import { styles } from '../uiStyles';

export default function UserPage({ user, onLogout, initialTab, onNavigate }) {
  return (
    <main className="page">
      <div style={styles.card}>
        <h2>User Dashboard</h2>
        <p>Username: {user.username}</p>
        <p>Account Number: {user.profile?.account_number || '-'}</p>
        <button style={styles.button} onClick={onLogout}>Logout</button>
      </div>
      <UserPanel initialTab={initialTab} onNavigate={onNavigate} />
    </main>
  );
}
