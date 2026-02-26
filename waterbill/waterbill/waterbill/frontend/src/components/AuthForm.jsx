import { useEffect, useMemo, useState } from 'react';
import { api, setTokens } from '../api';
import { styles } from '../uiStyles';

const emptyForm = {
  username: '',
  email: '',
  password: '',
  confirm_password: '',
  full_name: '',
  phone_number: '',
  address: '',
};

export default function AuthForm({ role = 'customer', initialMode = 'login', allowSwitch = false, onAuthenticated }) {
  const [mode, setMode] = useState(initialMode);
  const [error, setError] = useState('');
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);

  const isRegister = mode === 'register';
  useEffect(() => {
    setMode(initialMode);
    setError('');
    setForm(emptyForm);
    setSubmitting(false);
  }, [initialMode, role]);

  const authPath = useMemo(() => {
    if (role === 'admin') return isRegister ? '/admin/register/' : '/admin/login/';
    return isRegister ? '/customer/register/' : '/customer/login/';
  }, [role, isRegister]);

  const submit = async (e) => {
    e.preventDefault();
    if (submitting) return;
    setError('');
    setSubmitting(true);

    try {
      if (isRegister && form.password !== form.confirm_password) {
        setError('Password and Confirm Password must match.');
        setSubmitting(false);
        return;
      }

      const payload = isRegister
        ? {
            username: form.username,
            email: form.email,
            password: form.password,
            full_name: form.full_name,
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
      await onAuthenticated?.(authResponse.user);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : (typeof err === 'string' ? err : 'Registration failed. Please try again.');
      setError(message);
    } finally {
      setSubmitting(false);
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
            <input style={styles.input} placeholder="Phone Number" required onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <input style={styles.input} placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </>
        )}
        {error && <p className="error">{error}</p>}
        <button
          style={{ ...styles.button, cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Please wait...' : (isRegister ? 'Create Account' : 'Login')}
        </button>
      </form>
      {allowSwitch && (
        <button
          style={{ ...styles.button, background: '#546a7b', cursor: submitting ? 'not-allowed' : 'pointer', opacity: submitting ? 0.7 : 1 }}
          onClick={() => !submitting && setMode(isRegister ? 'login' : 'register')}
          disabled={submitting}
        >
          {isRegister ? 'Switch to Login' : 'Switch to Register'}
        </button>
      )}
    </div>
  );
}
