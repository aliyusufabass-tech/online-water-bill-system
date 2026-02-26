import { useEffect, useMemo, useState } from 'react';
import { api, setTokens } from '../api';

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
    <div>
      <form onSubmit={submit}>
        <input
          style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
          placeholder="Username"
          required
          onChange={(e) => setForm({ ...form, username: e.target.value })}
        />
        {isRegister && (
          <input
            style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
            placeholder="Email"
            type="email"
            required
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        )}
        <input
          style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
          placeholder="Password"
          type="password"
          required
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        {isRegister && (
          <input
            style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
            placeholder="Confirm Password"
            type="password"
            required
            onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
          />
        )}
        {isRegister && (
          <>
            <input
              style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
              placeholder="Full Name"
              required
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
            <input
              style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
              placeholder="Phone Number"
              required
              onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            />
            <input
              style={{ width: '100%', padding: '11px 12px', margin: '8px 0', border: '1px solid #c8d3df', borderRadius: 8, fontSize: 14 }}
              placeholder="Address"
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </>
        )}
        {error && <p className="error" style={{ marginBottom: 10 }}>{error}</p>}
        <button
          style={{
            width: '100%',
            padding: '11px 12px',
            marginTop: 8,
            background: '#0d6efd',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: submitting ? 'not-allowed' : 'pointer',
            fontWeight: 700,
            fontSize: 14,
            opacity: submitting ? 0.7 : 1,
          }}
          type="submit"
          disabled={submitting}
        >
          {submitting ? 'Please wait...' : (isRegister ? 'Create Account' : 'Login')}
        </button>
      </form>
      {allowSwitch && (
        <button
          style={{
            width: '100%',
            padding: '10px 12px',
            marginTop: 10,
            background: '#6c757d',
            color: '#fff',
            border: 'none',
            borderRadius: 8,
            cursor: submitting ? 'not-allowed' : 'pointer',
            opacity: submitting ? 0.7 : 1,
          }}
          onClick={() => !submitting && setMode(isRegister ? 'login' : 'register')}
          disabled={submitting}
        >
          {isRegister ? 'Switch to Login' : 'Switch to Register'}
        </button>
      )}
    </div>
  );
}
