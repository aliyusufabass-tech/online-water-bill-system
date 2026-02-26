import { useEffect, useMemo, useState } from 'react';
import { api, apiDownload } from '../api';

const TAB_TO_ROUTE = {
  dashboard: '/customer-dashboard',
  payment: '/payment',
  history: '/history',
  receipts: '/receipts',
};

const ui = {
  shell: { display: 'flex', minHeight: '72vh', background: '#eef3f8', borderRadius: 16, overflow: 'hidden', border: '1px solid #d8e2ee' },
  sidebar: { width: 240, background: 'linear-gradient(180deg, #0d6efd 0%, #084298 100%)', color: '#fff', padding: 0, display: 'flex', flexDirection: 'column' },
  brand: { margin: 0, padding: '20px 18px', background: 'rgba(0,0,0,0.18)', fontSize: 22, fontWeight: 700, letterSpacing: 0.3 },
  nav: { display: 'flex', flexDirection: 'column', padding: 10, gap: 6 },
  navBtn: { background: 'transparent', color: '#fff', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14 },
  navBtnActive: { background: 'rgba(255,255,255,0.16)', color: '#fff', border: 'none', textAlign: 'left', padding: '12px 14px', borderRadius: 8, cursor: 'pointer', fontSize: 14, fontWeight: 700 },
  sidebarFooter: { marginTop: 'auto', padding: 12 },
  logoutBtn: { width: '100%', background: '#ffffff', color: '#084298', border: 'none', borderRadius: 8, padding: '10px 12px', cursor: 'pointer', fontWeight: 700 },
  content: { flex: 1, padding: 24, minWidth: 0 },
  header: { marginBottom: 20 },
  title: { margin: 0, color: '#10233a', fontSize: 28 },
  subtitle: { margin: '6px 0 0', color: '#55687c' },
  notice: { background: '#fff', border: '1px solid #d6e2ef', borderRadius: 10, padding: 12, marginBottom: 14 },
  cards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 },
  card: { background: '#fff', borderRadius: 10, padding: 16, boxShadow: '0 3px 10px rgba(0,0,0,0.06)', border: '1px solid #e1e8f0' },
  cardLabel: { margin: 0, fontSize: 13, color: '#5a6b7f' },
  cardValue: { margin: '10px 0 0', fontSize: 28, fontWeight: 800, color: '#0d6efd' },
  section: { background: '#fff', borderRadius: 10, border: '1px solid #e1e8f0', boxShadow: '0 3px 10px rgba(0,0,0,0.05)', overflow: 'hidden', marginBottom: 18 },
  sectionHead: { padding: '14px 16px', borderBottom: '1px solid #e9eef5', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { margin: 0, fontSize: 18, color: '#172b43' },
  tableWrap: { overflowX: 'auto' },
  table: { width: '100%', borderCollapse: 'collapse', background: '#fff' },
  th: { background: '#0d6efd', color: '#fff', padding: '12px 10px', textAlign: 'left', fontSize: 13, whiteSpace: 'nowrap' },
  td: { padding: '12px 10px', borderBottom: '1px solid #edf1f6', fontSize: 14, color: '#25384d' },
  empty: { textAlign: 'center', padding: 24, color: '#66788a' },
  formCard: { background: '#fff', borderRadius: 10, border: '1px solid #e1e8f0', padding: 16, boxShadow: '0 3px 10px rgba(0,0,0,0.05)' },
  input: { width: '100%', padding: '10px 12px', border: '1px solid #c8d3df', borderRadius: 8, marginBottom: 10, fontSize: 14, background: '#fff' },
  button: { background: '#0d6efd', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', marginRight: 8, marginBottom: 8 },
  buttonMuted: { background: '#6c7c8c', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', marginRight: 8, marginBottom: 8 },
  buttonDanger: { background: '#dc3545', color: '#fff', border: 'none', borderRadius: 8, padding: '9px 14px', cursor: 'pointer', marginRight: 8, marginBottom: 8 },
  profileGrid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 },
  profileItem: { background: '#f7faff', border: '1px solid #e0ebf8', borderRadius: 8, padding: 12 },
  profileLabel: { margin: 0, color: '#5d7187', fontSize: 12 },
  profileValue: { margin: '6px 0 0', color: '#17304a', fontWeight: 700 },
};

function statusBadge(status) {
  const base = {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 999,
    fontSize: 12,
    fontWeight: 700,
    textTransform: 'capitalize',
  };

  if (status === 'paid') return { ...base, background: '#d1f0dc', color: '#126b36' };
  if (status === 'pending') return { ...base, background: '#fff0bf', color: '#8a6700' };
  return { ...base, background: '#ffd6da', color: '#9f1f2d' };
}

function money(value) {
  const amount = Number(value || 0);
  return Number.isFinite(amount) ? amount.toFixed(2) : '0.00';
}

export default function UserPanel({ user, onLogout, initialTab = 'dashboard', onNavigate }) {
  const normalizeTab = (value) => (value === 'profile' || value === 'bills' ? 'dashboard' : value);
  const [tab, setTab] = useState(normalizeTab(initialTab));
  const [profile, setProfile] = useState(null);
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'mobile_money', transaction_reference: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => setTab(normalizeTab(initialTab)), [initialTab]);

  const load = async () => {
    try {
      const [p, b, h, r] = await Promise.all([api('/profile/'), api('/bills/'), api('/payments/history/'), api('/receipts/')]);
      setProfile(p.profile);
      setBills(b.bills);
      setHistory(h.history);
      setReceipts(r.receipts);
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

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const data = await api(`/bills/${selectedBill.id}/pay/`, { method: 'POST', body: JSON.stringify(payForm) });
      setInfo(data.message);
      setSelectedBill(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const payableBills = useMemo(() => bills.filter((b) => b.status === 'unpaid'), [bills]);
  const totalBills = bills.length;
  const unpaidBills = bills.filter((b) => b.status === 'unpaid').length;
  const totalPaid = receipts.reduce((sum, item) => sum + Number(item.amount || 0), 0);

  return (
    <div style={ui.shell}>
      <aside style={ui.sidebar}>
        <h2 style={ui.brand}>Water Bill</h2>
        <div style={ui.nav}>
          {[
            ['dashboard', 'Dashboard'],
            ['payment', 'Pay Bill'],
            ['history', 'Payment History'],
            ['receipts', 'Receipts'],
          ].map(([key, label]) => (
            <button key={key} style={tab === key ? ui.navBtnActive : ui.navBtn} onClick={() => onTabChange(key)}>
              {label}
            </button>
          ))}
        </div>
        {onLogout && (
          <div style={ui.sidebarFooter}>
            <button style={ui.logoutBtn} onClick={onLogout}>Logout</button>
          </div>
        )}
      </aside>

      <section style={ui.content}>
        <div style={ui.header}>
          <h1 style={ui.title}>Welcome, {user?.username || 'User'}</h1>
          <p style={ui.subtitle}>Manage your water bills, payments, and receipts.</p>
        </div>

        {info && <div style={ui.notice}><p className="success" style={{ margin: 0 }}>{info}</p></div>}
        {error && <div style={ui.notice}><p className="error" style={{ margin: 0 }}>{error}</p></div>}

        {tab === 'dashboard' && (
          <>
            <div style={ui.cards}>
              <div style={ui.card}>
                <p style={ui.cardLabel}>Total Bills</p>
                <p style={ui.cardValue}>{totalBills}</p>
              </div>
              <div style={ui.card}>
                <p style={ui.cardLabel}>Unpaid Bills</p>
                <p style={ui.cardValue}>{unpaidBills}</p>
              </div>
              <div style={ui.card}>
                <p style={ui.cardLabel}>Total Paid</p>
                <p style={ui.cardValue}>{money(totalPaid)}</p>
              </div>
            </div>

            {profile && (
              <div style={ui.section}>
                <div style={ui.sectionHead}>
                  <h3 style={ui.sectionTitle}>Account Details</h3>
                </div>
                <div style={{ padding: 16 }}>
                  <div style={ui.profileGrid}>
                    <div style={ui.profileItem}>
                      <p style={ui.profileLabel}>Full Name</p>
                      <p style={ui.profileValue}>{profile.full_name}</p>
                    </div>
                    <div style={ui.profileItem}>
                      <p style={ui.profileLabel}>Account Number</p>
                      <p style={ui.profileValue}>{profile.account_number}</p>
                    </div>
                    <div style={ui.profileItem}>
                      <p style={ui.profileLabel}>Meter Number</p>
                      <p style={ui.profileValue}>{profile.meter_number || '-'}</p>
                    </div>
                    <div style={ui.profileItem}>
                      <p style={ui.profileLabel}>Phone</p>
                      <p style={ui.profileValue}>{profile.phone_number}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>My Bills</h3>
              </div>
              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      <th style={ui.th}>Meter Number</th>
                      <th style={ui.th}>Amount</th>
                      <th style={ui.th}>Due Date</th>
                      <th style={ui.th}>Status</th>
                      <th style={ui.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bills.length === 0 && (
                      <tr>
                        <td style={ui.empty} colSpan={5}>No bills available.</td>
                      </tr>
                    )}
                    {bills.map((bill) => (
                      <tr key={bill.id}>
                        <td style={ui.td}>{bill.meter_number || profile?.meter_number || '-'}</td>
                        <td style={ui.td}>{money(bill.amount_due)}</td>
                        <td style={ui.td}>{bill.due_date}</td>
                        <td style={ui.td}><span style={statusBadge(bill.status)}>{bill.status}</span></td>
                        <td style={ui.td}>
                          {bill.status === 'unpaid' ? (
                            <button
                              style={ui.button}
                              onClick={() => {
                                setSelectedBill(bill);
                                setPayForm({ amount: bill.amount_due, payment_method: 'mobile_money', transaction_reference: '' });
                                onTabChange('payment');
                              }}
                            >
                              Pay
                            </button>
                          ) : (
                            <span style={{ color: '#7b8a99' }}>-</span>
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

        {tab === 'payment' && (
          <>
            <div style={ui.section}>
              <div style={ui.sectionHead}>
                <h3 style={ui.sectionTitle}>Pay Bill</h3>
              </div>
              <div style={ui.tableWrap}>
                <table style={ui.table}>
                  <thead>
                    <tr>
                      <th style={ui.th}>Date Range</th>
                      <th style={ui.th}>Meter</th>
                      <th style={ui.th}>Amount</th>
                      <th style={ui.th}>Status</th>
                      <th style={ui.th}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payableBills.length === 0 && (
                      <tr>
                        <td style={ui.empty} colSpan={5}>No unpaid bills available.</td>
                      </tr>
                    )}
                    {payableBills.map((bill) => (
                      <tr key={bill.id}>
                        <td style={ui.td}>{bill.billing_period}</td>
                        <td style={ui.td}>{bill.meter_reading}</td>
                        <td style={ui.td}>{money(bill.amount_due)}</td>
                        <td style={ui.td}><span style={statusBadge(bill.status)}>{bill.status}</span></td>
                        <td style={ui.td}>
                          <button
                            style={ui.button}
                            onClick={() => {
                              setSelectedBill(bill);
                              setPayForm({ amount: bill.amount_due, payment_method: 'mobile_money', transaction_reference: '' });
                            }}
                          >
                            Select
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {selectedBill && (
              <div style={ui.formCard}>
                <h4 style={{ marginTop: 0 }}>Submit Payment for {selectedBill.billing_period}</h4>
                <form onSubmit={submitPayment}>
                  <input style={ui.input} value={payForm.amount} readOnly />
                  <select style={ui.input} value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank</option>
                  </select>
                  <input
                    style={ui.input}
                    required
                    placeholder="Transaction Reference"
                    value={payForm.transaction_reference}
                    onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })}
                  />
                  <button style={ui.button} type="submit">Submit Request</button>
                  <button style={ui.buttonMuted} type="button" onClick={() => setSelectedBill(null)}>Cancel</button>
                </form>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div style={ui.section}>
            <div style={ui.sectionHead}>
              <h3 style={ui.sectionTitle}>Payment History</h3>
            </div>
            <div style={ui.tableWrap}>
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>Reference</th>
                    <th style={ui.th}>Date Range</th>
                    <th style={ui.th}>Amount</th>
                    <th style={ui.th}>Status</th>
                    <th style={ui.th}>Paid At</th>
                  </tr>
                </thead>
                <tbody>
                  {history.length === 0 && (
                    <tr>
                      <td style={ui.empty} colSpan={5}>No payment history yet.</td>
                    </tr>
                  )}
                  {history.map((item) => (
                    <tr key={item.id}>
                      <td style={ui.td}>{item.transaction_reference}</td>
                      <td style={ui.td}>{item.bill.billing_period}</td>
                      <td style={ui.td}>{money(item.amount)}</td>
                      <td style={ui.td}><span style={statusBadge(item.status)}>{item.status}</span></td>
                      <td style={ui.td}>{item.paid_at}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === 'receipts' && (
          <div style={ui.section}>
            <div style={ui.sectionHead}>
              <h3 style={ui.sectionTitle}>Receipts</h3>
            </div>
            <div style={ui.tableWrap}>
              <table style={ui.table}>
                <thead>
                  <tr>
                    <th style={ui.th}>Reference</th>
                    <th style={ui.th}>Date Range</th>
                    <th style={ui.th}>Amount</th>
                    <th style={ui.th}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {receipts.length === 0 && (
                    <tr>
                      <td style={ui.empty} colSpan={4}>No approved receipts yet.</td>
                    </tr>
                  )}
                  {receipts.map((item) => (
                    <tr key={item.id}>
                      <td style={ui.td}>{item.transaction_reference}</td>
                      <td style={ui.td}>{item.bill.billing_period}</td>
                      <td style={ui.td}>{money(item.amount)}</td>
                      <td style={ui.td}>
                        <button style={ui.button} onClick={() => apiDownload(`/receipts/${item.id}/download/`).catch((err) => setError(err.message))}>
                          Download PDF
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
