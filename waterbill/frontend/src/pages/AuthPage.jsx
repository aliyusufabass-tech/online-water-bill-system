import AuthForm from '../components/AuthForm';
import { styles } from '../uiStyles';

function NavLink({ onNavigate, to, label }) {
  return (
    <button style={{ ...styles.button, background: '#546a7b' }} onClick={() => onNavigate(to)}>
      {label}
    </button>
  );
}

export default function AuthPage({ error, role, mode, onAuthenticated, onNavigate }) {
  return (
    <main style={styles.authPage}>
      <div style={styles.authWrap}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>Online Water Bill Payment System</h2>
        {error && <p className="error">{error}</p>}
        <AuthForm
          key={`${role}-${mode}`}
          role={role}
          initialMode={mode}
          allowSwitch={false}
          onAuthenticated={onAuthenticated}
        />
        <div style={{ marginTop: 10 }}>
          <NavLink onNavigate={onNavigate} to="/home" label="Home" />
          {role === 'admin' ? (
            <>
              <NavLink onNavigate={onNavigate} to="/admin/login" label="Admin Login" />
            </>
          ) : (
            <>
              <NavLink onNavigate={onNavigate} to="/login" label="Customer Login" />
              <NavLink onNavigate={onNavigate} to="/register" label="Customer Register" />
            </>
          )}
        </div>
      </div>
    </main>
  );
}
