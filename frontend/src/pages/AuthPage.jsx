import AuthForm from '../components/AuthForm';

function NavLink({ onNavigate, to, label }) {
  return (
    <button
      style={{
        background: 'transparent',
        color: '#0d6efd',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        textDecoration: 'underline',
        fontSize: 14,
        fontWeight: 600,
      }}
      onClick={() => onNavigate(to)}
    >
      {label}
    </button>
  );
}

export default function AuthPage({ error, role, mode, onAuthenticated, onNavigate }) {
  const isRegister = mode === 'register';
  const isUnifiedLogin = mode === 'login';
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '24px 14px',
        background: '#0d6efd',
      }}
    >
      <div
        style={{
          background: '#fff',
          width: '100%',
          maxWidth: isRegister ? '540px' : '380px',
          padding: '28px',
          borderRadius: '12px',
          boxShadow: '0 18px 36px rgba(0,0,0,0.15)',
        }}
      >
        <h2 style={{ marginTop: 0, marginBottom: 8 }}>{isRegister ? 'Register' : 'Login'}</h2>
        <p style={{ marginTop: 0, color: '#556b80', fontSize: 14 }}>
          Water Bill Payment System
        </p>
        {error && <p className="error" style={{ marginBottom: 10 }}>{error}</p>}
        <AuthForm
          key={`${role}-${mode}`}
          role={role}
          initialMode={mode}
          allowSwitch={false}
          onAuthenticated={onAuthenticated}
        />
        <div
          style={{
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid #e5edf5',
            textAlign: 'center',
            fontSize: 14,
            color: '#556b80',
          }}
        >
          {isUnifiedLogin ? (
            <p style={{ margin: 0 }}>
              No account?{' '}
              <NavLink onNavigate={onNavigate} to="/register" label="Register" />
            </p>
          ) : (
            <p style={{ margin: 0 }}>
              Have an account?{' '}
              <NavLink onNavigate={onNavigate} to="/" label="Login" />
              {' '}|{' '}
              <NavLink onNavigate={onNavigate} to="/register" label="Customer Register" />
            </p>
          )}
        </div>
      </div>
    </main>
  );
}
