import { useEffect, useState } from 'react';
import { api } from '../api';
import { styles } from '../uiStyles';

const TAB_TO_ROUTE = {
  dashboard: '/admin-dashboard',
  bills: '/add-bill',
  payments: '/admin-payments',
  reports: '/admin-reports',
};

export default function AdminPanel({ currentUser, initialTab = 'dashboard', onNavigate }) {
  const [tab, setTab] = useState(initialTab);
  const [users, setUsers] = useState([]);
  const [bills, setBills] = useState([]);
  const [payments, setPayments] = useState([]);
  const [report, setReport] = useState(null);
  const [reportPeriod, setReportPeriod] = useState('weekly');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const [userForm, setUserForm] = useState({
    username: '',
    email: '',
    password: '',
    full_name: '',
    account_number: '',
    phone_number: '',
    address: '',
    is_staff: false,
  });
  const [billForm, setBillForm] = useState({
    account_number: '',
    billing_period: '',
    meter_reading: '',
    amount_due: '',
    due_date: '',
  });
  const [editingBill, setEditingBill] = useState(null);

  useEffect(() => setTab(initialTab), [initialTab]);

  const load = async () => {
    try {
      const [u, b, p] = await Promise.all([api('/admin/users/'), api('/admin/bills/'), api('/admin/payments/')]);
      setUsers(u.users);
      setBills(b.bills);
      setPayments(p.payments);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const onTabChange = (nextTab) => {
    setTab(nextTab);
    if (onNavigate && TAB_TO_ROUTE[nextTab]) onNavigate(TAB_TO_ROUTE[nextTab]);
  };

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const data = await api('/admin/users/', { method: 'POST', body: JSON.stringify(userForm) });
      setInfo(data.message);
      setUserForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
        account_number: '',
        phone_number: '',
        address: '',
        is_staff: false,
      });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!window.confirm('Delete this user?')) return;
    try {
      const data = await api(`/admin/users/${id}/`, { method: 'DELETE' });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveBill = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        const data = await api(`/admin/bills/${editingBill.id}/`, { method: 'PATCH', body: JSON.stringify(billForm) });
        setInfo(data.message);
      } else {
        const data = await api('/admin/bills/', { method: 'POST', body: JSON.stringify(billForm) });
        setInfo(data.message);
      }
      setEditingBill(null);
      setBillForm({ account_number: '', billing_period: '', meter_reading: '', amount_due: '', due_date: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const editBill = (bill) => {
    setEditingBill(bill);
    setBillForm({
      account_number: bill.account_number,
      billing_period: bill.billing_period,
      meter_reading: bill.meter_reading,
      amount_due: bill.amount_due,
      due_date: bill.due_date,
    });
    onTabChange('bills');
  };

  const deleteBill = async (billId) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      const data = await api(`/admin/bills/${billId}/`, { method: 'DELETE' });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deletePayment = async (paymentId) => {
    if (!window.confirm('Delete this payment request?')) return;
    try {
      const data = await api(`/admin/payments/${paymentId}/`, { method: 'DELETE' });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const paymentDecision = async (paymentId, action) => {
    try {
      const data = await api(`/admin/payments/${paymentId}/decision/`, { method: 'POST', body: JSON.stringify({ action }) });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateReport = async () => {
    try {
      const data = await api(`/admin/reports/?period=${reportPeriod}`);
      setReport(data);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <strong>Admin Menu</strong>
        <div style={styles.sideNav}>
          {['dashboard', 'bills', 'payments', 'reports'].map((t) => (
            <button key={t} style={tab === t ? styles.activeSideBtn : styles.sideBtn} onClick={() => onTabChange(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {info && <div style={styles.card}><p className="success">{info}</p></div>}
        {error && <div style={styles.card}><p className="error">{error}</p></div>}

        {tab === 'dashboard' && (
          <>
            <div style={styles.card}>
              <h3>Admin Dashboard</h3>
              <p>Logged in as: {currentUser.username}</p>
              <p>Total Users: {users.length}</p>
              <p>Total Bills: {bills.length}</p>
              <p>Total Payment Requests: {payments.length}</p>
            </div>
            <div style={styles.card}>
              <h3>Add Customer</h3>
              <form onSubmit={createUser}>
                <input style={styles.input} placeholder="Username" required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                <input style={styles.input} placeholder="Email" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                <input style={styles.input} placeholder="Password" type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                <input style={styles.input} placeholder="Full Name" required value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
                <input style={styles.input} placeholder="Account Number" required value={userForm.account_number} onChange={(e) => setUserForm({ ...userForm, account_number: e.target.value })} />
                <input style={styles.input} placeholder="Phone Number" required value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })} />
                <input style={styles.input} placeholder="Address" value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
                <label><input type="checkbox" checked={userForm.is_staff} onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })} /> Make admin</label><br />
                <button style={styles.button} type="submit">Save Customer</button>
              </form>
            </div>
            <div style={styles.card}>
              <h3>All Users</h3>
              <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead><tr><th align="left">Username</th><th align="left">Name</th><th align="left">Account</th><th align="left">Role</th><th /></tr></thead>
                <tbody>
                  {users.map((u) => (
                    <tr key={u.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                      <td>{u.username}</td>
                      <td>{u.profile?.full_name || '-'}</td>
                      <td>{u.profile?.account_number || '-'}</td>
                      <td>{u.is_staff ? 'Admin' : 'Customer'}</td>
                      <td>{u.id !== currentUser.id && <button style={{ ...styles.button, background: '#8a1c1c' }} onClick={() => deleteUser(u.id)}>Delete</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'bills' && (
          <>
            <div style={styles.card}>
              <h3>{editingBill ? 'Update Bill' : 'Add Bill'}</h3>
              <form onSubmit={saveBill}>
                {!editingBill && <input style={styles.input} placeholder="Account Number" required value={billForm.account_number} onChange={(e) => setBillForm({ ...billForm, account_number: e.target.value })} />}
                <input style={styles.input} placeholder="Billing Period" required value={billForm.billing_period} onChange={(e) => setBillForm({ ...billForm, billing_period: e.target.value })} />
                <input style={styles.input} placeholder="Meter Reading" required value={billForm.meter_reading} onChange={(e) => setBillForm({ ...billForm, meter_reading: e.target.value })} />
                <input style={styles.input} placeholder="Amount Due" required value={billForm.amount_due} onChange={(e) => setBillForm({ ...billForm, amount_due: e.target.value })} />
                <input style={styles.input} type="date" required value={billForm.due_date} onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })} />
                <button style={styles.button} type="submit">{editingBill ? 'Update Bill' : 'Add Bill'}</button>
              </form>
            </div>
            <div style={styles.card}>
              <h3>View Bills</h3>
              <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead><tr><th align="left">Account</th><th align="left">Period</th><th align="left">Reading</th><th align="left">Amount</th><th align="left">Status</th><th /></tr></thead>
                <tbody>
                  {bills.map((b) => (
                    <tr key={b.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                      <td>{b.account_number}</td>
                      <td>{b.billing_period}</td>
                      <td>{b.meter_reading}</td>
                      <td>{b.amount_due}</td>
                      <td>{b.status}</td>
                      <td>
                        <button style={styles.button} onClick={() => editBill(b)}>Update</button>
                        <button style={{ ...styles.button, background: '#8a1c1c' }} onClick={() => deleteBill(b.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === 'payments' && (
          <div style={styles.card}>
            <h3>Payment Requests (Approve / Reject / Delete)</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Account</th><th align="left">Period</th><th align="left">Amount</th><th align="left">Reference</th><th align="left">Status</th><th /></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                    <td>{p.bill.account_number}</td>
                    <td>{p.bill.billing_period}</td>
                    <td>{p.amount}</td>
                    <td>{p.transaction_reference}</td>
                    <td>{p.status}</td>
                    <td>
                      {p.status === 'pending' && (
                        <>
                          <button style={styles.button} onClick={() => paymentDecision(p.id, 'approve')}>Approve</button>
                          <button style={{ ...styles.button, background: '#8a1c1c' }} onClick={() => paymentDecision(p.id, 'reject')}>Reject</button>
                        </>
                      )}
                      <button style={{ ...styles.button, background: '#7a3b00' }} onClick={() => deletePayment(p.id)}>Delete Request</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'reports' && (
          <div style={styles.compactCard}>
            <h3>Generate Report (Tick)</h3>
            <label><input type="radio" checked={reportPeriod === 'weekly'} onChange={() => setReportPeriod('weekly')} /> Weekly</label><br />
            <label><input type="radio" checked={reportPeriod === 'monthly'} onChange={() => setReportPeriod('monthly')} /> Monthly</label><br />
            <label><input type="radio" checked={reportPeriod === 'yearly'} onChange={() => setReportPeriod('yearly')} /> Yearly</label><br />
            <button style={styles.button} onClick={generateReport}>Generate</button>
            {report && (
              <>
                <p>Approved: {report.approved_payments}</p>
                <p>Pending: {report.pending_payments}</p>
                <p>Rejected: {report.rejected_payments}</p>
                <p>Total Revenue: {report.total_revenue}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
