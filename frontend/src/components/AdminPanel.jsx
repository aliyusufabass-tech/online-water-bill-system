import { useEffect, useMemo, useState } from 'react';
import { api } from '../api';

const TAB_TO_ROUTE = {
  dashboard: '/admin-dashboard',
  bills: '/add-bill',
  payments: '/admin-payments',
  reports: '/admin-reports',
};

const ui = {
  shell: { display: 'flex', minHeight: '78vh', background: '#eef3f8', borderRadius: 16, overflow: 'hidden', border: '1px solid #d8e1ea' },
  sidebar: { width: 250, background: 'linear-gradient(180deg, #0d6efd 0%, #084298 100%)', color: '#fff', display: 'flex', flexDirection: 'column' },
  brand: { margin: 0, padding: '20px 16px', background: 'rgba(0,0,0,0.18)', fontSize: 22, fontWeight: 800 },
  nav: { padding: 10, display: 'flex', flexDirection: 'column', gap: 6 },
  navBtn: { background: 'transparent', color: '#fff', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  navBtnActive: { background: 'rgba(255,255,255,0.16)', color: '#fff', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  sideNote: { marginTop: 'auto', margin: 12, padding: 10, borderRadius: 8, background: 'rgba(255,255,255,0.12)', fontSize: 12, lineHeight: 1.4 },
  sideLogout: { width: '100%', marginTop: 8, border: 'none', borderRadius: 8, padding: '9px 12px', cursor: 'pointer', background: '#fff', color: '#084298', fontWeight: 700 },
  content: { flex: 1, padding: 22, minWidth: 0 },
  header: { marginBottom: 18 },
  title: { margin: 0, color: '#10243b', fontSize: 28 },
  subtitle: { margin: '6px 0 0', color: '#5d7086' },
  alert: { background: '#fff', border: '1px solid #d7e2ee', borderRadius: 10, padding: 12, marginBottom: 12 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 22 },
  card: { padding: 18, borderRadius: 10, color: '#fff', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' },
  cardUsers: { background: '#198754' },
  cardBills: { background: '#0d6efd' },
  cardPending: { background: '#ffc107', color: '#1f1f1f' },
  cardRevenue: { background: '#6f42c1' },
  cardLabel: { margin: 0, fontSize: 14, opacity: 0.95 },
  cardValue: { margin: '10px 0 0', fontSize: 30, fontWeight: 800 },
  section: { background: '#fff', border: '1px solid #dfe7ef', borderRadius: 10, marginBottom: 18, boxShadow: '0 3px 10px rgba(0,0,0,0.05)', overflow: 'hidden' },
  sectionHead: { padding: '14px 16px', borderBottom: '1px solid #e8eef4', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: 18, color: '#162a42' },
  sectionBody: { padding: 16 },
  formGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 10 },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #c9d4df', borderRadius: 8, fontSize: 14, background: '#fff' },
  field: { display: 'flex', flexDirection: 'column', gap: 6 },
  fullRow: { gridColumn: '1 / -1' },
  button: { background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', marginRight: 8, marginBottom: 8 },
  buttonApprove: { background: '#198754', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginRight: 6, marginBottom: 6 },
  buttonReject: { background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginRight: 6, marginBottom: 6 },
  buttonEdit: { background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginRight: 6, marginBottom: 6 },
  buttonDelete: { background: '#6c757d', color: '#fff', border: 'none', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', marginRight: 6, marginBottom: 6 },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { background: '#f1f5f9', color: '#203247', padding: '12px 10px', borderBottom: '1px solid #dde6ef', textAlign: 'left', fontSize: 13, whiteSpace: 'nowrap' },
  td: { padding: '11px 10px', borderBottom: '1px solid #edf1f5', fontSize: 14, color: '#24384d', verticalAlign: 'top' },
  empty: { textAlign: 'center', color: '#677a8c', padding: 20 },
  chartWrap: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'end' },
  chartBarCol: { background: '#f7fafd', border: '1px solid #e3ebf3', borderRadius: 10, padding: 12 },
  chartTrack: { height: 160, background: '#e9f0f7', borderRadius: 8, display: 'flex', alignItems: 'flex-end', overflow: 'hidden' },
  chartBar: { width: '100%', borderRadius: '8px 8px 0 0' },
  chartLabel: { margin: '10px 0 0', fontSize: 13, color: '#556b80' },
  chartValue: { margin: '4px 0 0', fontWeight: 700, color: '#17314a' },
  badge: { display: 'inline-block', padding: '4px 10px', borderRadius: 999, fontSize: 12, fontWeight: 700, textTransform: 'capitalize' },
  helper: { margin: 0, color: '#5d7389', fontSize: 13 },
};

function statusStyle(status) {
  if (status === 'paid') return { ...ui.badge, background: '#d1f0dc', color: '#126b36' };
  if (status === 'pending') return { ...ui.badge, background: '#fff0bf', color: '#8a6700' };
  if (status === 'rejected') return { ...ui.badge, background: '#f8d7da', color: '#842029' };
  return { ...ui.badge, background: '#ffd6da', color: '#9f1f2d' };
}

function money(value) {
  const n = Number(value || 0);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

export default function AdminPanel({ currentUser, initialTab = 'dashboard', onNavigate, onLogout }) {
  const parseBillingPeriodRange = (billingPeriod, dueDate) => {
    const text = String(billingPeriod || '');
    const match = text.match(/^(\d{4}-\d{2}-\d{2})\s+to\s+(\d{4}-\d{2}-\d{2})$/);
    if (match) return { from_date: match[1], to_date: match[2] };
    return { from_date: '', to_date: dueDate || '' };
  };

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
    phone_number: '',
    address: '',
    is_staff: false,
  });

  const [billForm, setBillForm] = useState({
    account_number: '',
    from_date: '',
    to_date: '',
    meter_reading: '',
    amount_input: '',
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
      setError('');
      setUserForm({
        username: '',
        email: '',
        password: '',
        full_name: '',
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
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const saveBill = async (e) => {
    e.preventDefault();
    try {
      if (editingBill) {
        const data = await api(`/admin/bills/${editingBill.id}/`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...(billForm.from_date && billForm.to_date ? { billing_period: `${billForm.from_date} to ${billForm.to_date}` } : {}),
            meter_reading: billForm.meter_reading,
            ...(billForm.to_date ? { due_date: billForm.to_date } : {}),
          }),
        });
        setInfo(data.message);
      } else {
        if (!billForm.account_number) throw new Error('Please choose a user/customer first.');
        if (!billForm.from_date || !billForm.to_date) throw new Error('Please select From Date and To Date.');
        if (billForm.from_date > billForm.to_date) throw new Error('From Date cannot be after To Date.');
        const data = await api('/admin/bills/', {
          method: 'POST',
          body: JSON.stringify({
            account_number: billForm.account_number,
            billing_period: `${billForm.from_date} to ${billForm.to_date}`,
            meter_reading: billForm.meter_reading,
            due_date: billForm.to_date,
          }),
        });
        setInfo(data.message);
      }
      setError('');
      setEditingBill(null);
      setBillForm({ account_number: '', from_date: '', to_date: '', meter_reading: '', amount_input: '' });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const editBill = (bill) => {
    const { from_date, to_date } = parseBillingPeriodRange(bill.billing_period, bill.due_date);
    setEditingBill(bill);
    setBillForm({
      account_number: bill.account_number,
      from_date,
      to_date,
      meter_reading: bill.meter_reading,
      amount_input: bill.amount_due,
    });
    onTabChange('bills');
  };

  const deleteBill = async (billId) => {
    if (!window.confirm('Delete this bill?')) return;
    try {
      const data = await api(`/admin/bills/${billId}/`, { method: 'DELETE' });
      setInfo(data.message);
      setError('');
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
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const paymentDecision = async (paymentId, action) => {
    try {
      const data = await api(`/admin/payments/${paymentId}/decision/`, { method: 'POST', body: JSON.stringify({ action }) });
      setInfo(data.message);
      setError('');
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateReport = async () => {
    try {
      const data = await api(`/admin/reports/?period=${reportPeriod}`);
      setReport(data);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const customerOptions = users.filter((u) => u.profile && !u.is_staff);
  const amountInput = Number(billForm.amount_input || 0);
  const meterReadingPreview = Number.isFinite(amountInput) ? amountInput / 100 : 0;
  const pendingPayments = payments.filter((p) => p.status === 'pending');
  const approvedPayments = payments.filter((p) => p.status === 'approved');
  const totalRevenue = approvedPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
  const maxChartValue = Math.max(totalRevenue, pendingPayments.length, 1);
  const customersCount = users.filter((u) => !u.is_staff).length;

  const chartBars = useMemo(
    () => [
      { label: 'Approved Revenue', value: totalRevenue, color: '#0d6efd' },
      { label: 'Pending Requests', value: pendingPayments.length, color: '#ffc107' },
    ],
    [totalRevenue, pendingPayments.length]
  );

  return (
    <div style={ui.shell}>
      <aside style={ui.sidebar}>
        <h2 style={ui.brand}>Admin Panel</h2>
        <div style={ui.nav}>
          {[
            ['dashboard', 'Dashboard'],
            ['payments', 'Pending Payments'],
            ['bills', editingBill ? 'Edit / Add Bill' : 'Add Bill'],
            ['reports', 'Reports'],
          ].map(([key, label]) => (
            <button key={key} style={tab === key ? ui.navBtnActive : ui.navBtn} onClick={() => onTabChange(key)}>
              {label}
            </button>
          ))}
        </div>
        <div style={ui.sideNote}>
          Logged in as `{currentUser?.username}`
          {onLogout && <button style={ui.sideLogout} onClick={onLogout}>Logout</button>}
        </div>
      </aside>

      <section style={ui.content}>
        <div style={ui.header}>
          <h2 style={ui.title}>Admin Dashboard</h2>
    
        </div>

        {info && <div style={ui.alert}><p className="success" style={{ margin: 0 }}>{info}</p></div>}
        {error && <div style={ui.alert}><p className="error" style={{ margin: 0 }}>{error}</p></div>}

        <div style={ui.cards}>
          <div style={{ ...ui.card, ...ui.cardUsers }}>
            <p style={ui.cardLabel}>Total Users</p>
            <p style={ui.cardValue}>{customersCount}</p>
          </div>
          <div style={{ ...ui.card, ...ui.cardBills }}>
            <p style={ui.cardLabel}>Total Bills</p>
            <p style={ui.cardValue}>{bills.length}</p>
          </div>
          <div style={{ ...ui.card, ...ui.cardPending }}>
            <p style={ui.cardLabel}>Pending Payments</p>
            <p style={ui.cardValue}>{pendingPayments.length}</p>
          </div>
          <div style={{ ...ui.card, ...ui.cardRevenue }}>
            <p style={ui.cardLabel}>Total Revenue</p>
            <p style={ui.cardValue}>{money(totalRevenue)}</p>
          </div>
        </div>

        {tab === 'dashboard' && (
          <>
            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>Payments Overview</h3>
              </div>
              <div style={ui.sectionBody}>
                <div style={ui.chartWrap}>
                  {chartBars.map((bar) => {
                    const pct = Math.max(4, (Number(bar.value || 0) / maxChartValue) * 100);
                    return (
                      <div key={bar.label} style={ui.chartBarCol}>
                        <div style={ui.chartTrack}>
                          <div style={{ ...ui.chartBar, height: `${pct}%`, background: bar.color }} />
                        </div>
                        <p style={ui.chartLabel}>{bar.label}</p>
                        <p style={ui.chartValue}>{bar.label.includes('Revenue') ? money(bar.value) : bar.value}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>Add User / Customer</h3>
              </div>
              <div style={ui.sectionBody}>
                <form onSubmit={createUser}>
                  <div style={ui.formGrid}>
                    <div style={ui.field}>
                      <label>Username</label>
                      <input style={ui.input} required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Email</label>
                      <input style={ui.input} type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Password</label>
                      <input style={ui.input} type="password" required value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Full Name</label>
                      <input style={ui.input} required value={userForm.full_name} onChange={(e) => setUserForm({ ...userForm, full_name: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Phone Number</label>
                      <input style={ui.input} required value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Address</label>
                      <input style={ui.input} value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
                    </div>
                    <div style={{ ...ui.field, ...ui.fullRow }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <input type="checkbox" checked={userForm.is_staff} onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })} />
                        Make admin
                      </label>
                
                    </div>
                  </div>
                  <button style={ui.button} type="submit">Save User</button>
                </form>
              </div>
            </div>

            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>All Users</h3>
              </div>
              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      <th style={ui.th}>Username</th>
                      <th style={ui.th}>Name</th>
                      <th style={ui.th}>Account</th>
                      <th style={ui.th}>Meter</th>
                      <th style={ui.th}>Role</th>
                      <th style={ui.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.length === 0 && (
                      <tr><td style={ui.empty} colSpan={6}>No users found.</td></tr>
                    )}
                    {users.map((u) => (
                      <tr key={u.id}>
                        <td style={ui.td}>{u.username}</td>
                        <td style={ui.td}>{u.profile?.full_name || '-'}</td>
                        <td style={ui.td}>{u.profile?.account_number || '-'}</td>
                        <td style={ui.td}>{u.profile?.meter_number || '-'}</td>
                        <td style={ui.td}>{u.is_staff ? 'Admin' : 'Customer'}</td>
                        <td style={ui.td}>
                          {u.id !== currentUser?.id && (
                            <button style={ui.buttonDelete} onClick={() => deleteUser(u.id)}>Delete</button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'payments' && (
          <div style={ui.section}>
            <div style={ui.sectionHead}>
              <h3 style={ui.sectionTitle}>Pending Payments (Approve / Reject / Delete)</h3>
            </div>
            <div style={ui.tableWrap}>
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>User</th>
                    <th style={ui.th}>Meter</th>
                    <th style={ui.th}>Amount</th>
                    <th style={ui.th}>Method</th>
                    <th style={ui.th}>Reference</th>
                    <th style={ui.th}>Status</th>
                    <th style={ui.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 && (
                    <tr><td style={ui.empty} colSpan={7}>No payment requests.</td></tr>
                  )}
                  {payments.map((p) => (
                    <tr key={p.id}>
                      <td style={ui.td}>{p.bill.full_name || '-'}</td>
                      <td style={ui.td}>{p.bill.meter_number || '-'}</td>
                      <td style={ui.td}>{money(p.amount)}</td>
                      <td style={ui.td}>{p.payment_method}</td>
                      <td style={ui.td}>{p.transaction_reference}</td>
                      <td style={ui.td}><span style={statusStyle(p.status)}>{p.status}</span></td>
                      <td style={ui.td}>
                        {p.status === 'pending' && (
                          <>
                            <button style={ui.buttonApprove} onClick={() => paymentDecision(p.id, 'approve')}>Approve</button>
                            <button style={ui.buttonReject} onClick={() => paymentDecision(p.id, 'reject')}>Reject</button>
                          </>
                        )}
                        <button style={ui.buttonDelete} onClick={() => deletePayment(p.id)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'bills' && (
          <>
            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>{editingBill ? 'Edit Bill' : 'Add Bill'}</h3>
              </div>
              <div style={ui.sectionBody}>
                <form onSubmit={saveBill}>
                  <div style={ui.formGrid}>
                    <div style={{ ...ui.field, ...ui.fullRow }}>
                      <label>User</label>
                      {!editingBill ? (
                        <select style={ui.input} required value={billForm.account_number} onChange={(e) => setBillForm({ ...billForm, account_number: e.target.value })}>
                          <option value="">Choose user/customer</option>
                          {customerOptions.map((u) => (
                            <option key={u.id} value={u.profile.account_number}>
                              {u.profile.full_name} ({u.username}) - {u.profile.account_number}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input style={ui.input} value={`Account: ${billForm.account_number}`} readOnly />
                      )}
                    </div>
                    <div style={ui.field}>
                      <label>From Date</label>
                      <input style={ui.input} type="date" required value={billForm.from_date} onChange={(e) => setBillForm({ ...billForm, from_date: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>To Date</label>
                      <input style={ui.input} type="date" required value={billForm.to_date} onChange={(e) => setBillForm({ ...billForm, to_date: e.target.value })} />
                    </div>
                    <div style={ui.field}>
                      <label>Amount</label>
                      <input
                        style={ui.input}
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="100.00"
                        required
                        value={billForm.amount_input}
                        onChange={(e) =>
                          setBillForm({
                            ...billForm,
                            amount_input: e.target.value,
                            meter_reading: e.target.value === '' ? '' : (Number(e.target.value) / 100).toFixed(2),
                          })
                        }
                      />
                    </div>
                    <div style={ui.field}>
                      <label>Meter Reading (Auto)</label>
                      <input style={ui.input} value={Number.isFinite(meterReadingPreview) ? meterReadingPreview.toFixed(2) : '0.00'} readOnly />
                    </div>
                    <div style={{ ...ui.field, ...ui.fullRow }}>
                      <p style={ui.helper}>Formula used: `Meter Reading = Amount / 100` (example: 100 =&gt; 1.00)</p>
                    </div>
                  </div>
                  <button style={ui.button} type="submit">{editingBill ? 'Update Bill' : 'Add Bill'}</button>
                  {editingBill && (
                    <button
                      type="button"
                      style={ui.buttonDelete}
                      onClick={() => {
                        setEditingBill(null);
                        setBillForm({ account_number: '', from_date: '', to_date: '', meter_reading: '', amount_input: '' });
                      }}
                    >
                      Cancel Edit
                    </button>
                  )}
                </form>
              </div>
            </div>

            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>All Bills (Edit / Delete)</h3>
              </div>
              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      <th style={ui.th}>User</th>
                      <th style={ui.th}>Meter</th>
                      <th style={ui.th}>Amount</th>
                      <th style={ui.th}>Status</th>
                      <th style={ui.th}>Due Date</th>
                      <th style={ui.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 && (
                      <tr><td style={ui.empty} colSpan={6}>No bills found.</td></tr>
                    )}
                    {bills.map((b) => (
                      <tr key={b.id}>
                        <td style={ui.td}>{b.full_name || '-'} ({b.account_number})</td>
                        <td style={ui.td}>{b.meter_number || '-'}</td>
                        <td style={ui.td}>{money(b.amount_due)}</td>
                        <td style={ui.td}><span style={statusStyle(b.status)}>{b.status}</span></td>
                        <td style={ui.td}>{b.due_date}</td>
                        <td style={ui.td}>
                          <button style={ui.buttonEdit} onClick={() => editBill(b)}>Edit</button>
                          <button style={ui.buttonDelete} onClick={() => deleteBill(b.id)}>Delete</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}

        {tab === 'reports' && (
          <>
            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>Revenue Report</h3>
              </div>
              <div style={ui.sectionBody}>
                <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 12 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" checked={reportPeriod === 'weekly'} onChange={() => setReportPeriod('weekly')} />
                    Weekly
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" checked={reportPeriod === 'monthly'} onChange={() => setReportPeriod('monthly')} />
                    Monthly
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input type="radio" checked={reportPeriod === 'yearly'} onChange={() => setReportPeriod('yearly')} />
                    Yearly
                  </label>
                </div>
                <button style={ui.button} onClick={generateReport}>Generate Report</button>
                {report && (
                  <div style={{ marginTop: 14, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                    <div style={ui.chartBarCol}><p style={ui.chartLabel}>Approved Payments</p><p style={ui.chartValue}>{report.approved_payments}</p></div>
                    <div style={ui.chartBarCol}><p style={ui.chartLabel}>Pending Payments</p><p style={ui.chartValue}>{report.pending_payments}</p></div>
                    <div style={ui.chartBarCol}><p style={ui.chartLabel}>Rejected Payments</p><p style={ui.chartValue}>{report.rejected_payments}</p></div>
                    <div style={ui.chartBarCol}><p style={ui.chartLabel}>Total Revenue</p><p style={ui.chartValue}>{report.total_revenue}</p></div>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </section>
    </div>
  );
}
