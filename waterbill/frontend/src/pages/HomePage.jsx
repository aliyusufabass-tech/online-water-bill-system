import { styles } from '../uiStyles';

export default function HomePage({ onNavigate }) {
  return (
    <main style={styles.authPage}>
      <div style={styles.authWrap}>
        <div style={styles.card}>
          <h2 style={{ marginTop: 0 }}>Water Bill System</h2>
          <p>Select portal:</p>
          <button style={styles.button} onClick={() => onNavigate('/login')}>Customer Login</button>
          <button style={styles.button} onClick={() => onNavigate('/register')}>Customer Register</button>
          <button style={styles.button} onClick={() => onNavigate('/admin/login')}>Admin Login</button>
          <button style={styles.button} onClick={() => onNavigate('/admin/register')}>Admin Register</button>
        </div>
      </div>
    </main>
  );
}
