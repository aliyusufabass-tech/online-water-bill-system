import { useMemo, useState } from 'react';
import { api, setTokens } from '../api';
import { styles } from '../uiStyles';

export default function AuthForm({ role = 'customer', initialMode = 'login', allowSwitch = false, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
    confirm_password: '',
    full_name: '',
    account_number: '',
    phone_number: '',
    address: '',
  });

  const isRegister = mode === 'register';
  const authPath = useMemo(() => {
    if (role === 'admin') return isRegister ? '/admin/register/' : '/admin/login/';
    return isRegister ? '/customer/register/' : '/customer/login/';
  }, [role, isRegister]);

  const submit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      if (isRegister && form.password !== form.confirm_password) {
        setError('Password and Confirm Password must match.');
        return;
      }

      const payload = isRegister
        ? {
            username: form.username,
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            account_number: form.account_number,
            phone_number: form.phone_number,
            address: form.address,
          }
        : {
            username: form.username,
            password: form.password,
          };

      const authResponse = await api(authPath, {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      setTokens(authResponse.tokens);
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.compactCard}>
      <h3>{role === 'admin' ? `Admin ${isRegister ? 'Register' : 'Login'}` : `Customer ${isRegister ? 'Register' : 'Login'}`}</h3>
      <form onSubmit={submit}>
        <input style={styles.input} placeholder="Username" required onChange={(e) => setForm({ ...form, username: e.target.value })} />
        {isRegister && <input style={styles.input} placeholder="Email" type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        <input style={styles.input} placeholder="Password" type="password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {isRegister && <input style={styles.input} placeholder="Confirm Password" type="password" required onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />}
        {isRegister && (
          <>
            <input style={styles.input} placeholder="Full Name" required onChange={(e) => setForm({ ...form, full_name: e.target.value })} />
            <input style={styles.input} placeholder="Account Number" required onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            <input style={styles.input} placeholder="Phone Number" required onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <input style={styles.input} placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button style={styles.button} type="submit">{isRegister ? 'Create Account' : 'Login'}</button>
      </form>
      {allowSwitch && (
        <button style={{ ...styles.button, background: '#546a7b' }} onClick={() => setMode(isRegister ? 'login' : 'register')}>
          {isRegister ? 'Switch to Login' : 'Switch to Register'}
        </button>
      )}
    </div>
  );
}
