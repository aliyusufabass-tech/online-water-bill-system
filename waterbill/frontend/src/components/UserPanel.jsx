import { useEffect, useMemo, useState } from 'react';
import { api, apiDownload } from '../api';
import { styles } from '../uiStyles';

const TAB_TO_ROUTE = {
  profile: '/customer-dashboard',
  bills: '/view-bills',
  payment: '/payment',
  history: '/history',
  receipts: '/receipts',
};

export default function UserPanel({ initialTab = 'profile', onNavigate }) {
  const [tab, setTab] = useState(initialTab);
  const [profile, setProfile] = useState(null);
  const [bills, setBills] = useState([]);
  const [history, setHistory] = useState([]);
  const [receipts, setReceipts] = useState([]);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payForm, setPayForm] = useState({ amount: '', payment_method: 'mobile_money', transaction_reference: '' });
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => setTab(initialTab), [initialTab]);

  const load = async () => {
    try {
      const [p, b, h, r] = await Promise.all([
        api('/profile/'),
        api('/bills/'),
        api('/payments/history/'),
        api('/receipts/'),
      ]);
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

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <strong>Customer Menu</strong>
        <div style={styles.sideNav}>
          {['profile', 'bills', 'payment', 'history', 'receipts'].map((t) => (
            <button key={t} style={tab === t ? styles.activeSideBtn : styles.sideBtn} onClick={() => onTabChange(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {info && <div style={styles.card}><p className="success">{info}</p></div>}
        {error && <div style={styles.card}><p className="error">{error}</p></div>}

        {tab === 'profile' && profile && (
          <div style={styles.card}>
            <h3>User Info</h3>
            <p>Full Name: {profile.full_name}</p>
            <p>Account Number: {profile.account_number}</p>
            <p>Phone: {profile.phone_number}</p>
            <p>Address: {profile.address || '-'}</p>
          </div>
        )}

        {tab === 'bills' && (
          <div style={styles.card}>
            <h3>View Bills</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Period</th><th align="left">Meter</th><th align="left">Amount</th><th align="left">Due</th><th align="left">Status</th></tr></thead>
              <tbody>
                {bills.map((bill) => (
                  <tr key={bill.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                    <td>{bill.billing_period}</td>
                    <td>{bill.meter_reading}</td>
                    <td>{bill.amount_due}</td>
                    <td>{bill.due_date}</td>
                    <td>{bill.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'payment' && (
          <>
            <div style={styles.card}>
              <h3>Payment Request (Wait for Approval)</h3>
              <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
                <thead><tr><th align="left">Period</th><th align="left">Amount</th><th align="left">Status</th><th /></tr></thead>
                <tbody>
                  {payableBills.map((bill) => (
                    <tr key={bill.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                      <td>{bill.billing_period}</td>
                      <td>{bill.amount_due}</td>
                      <td>{bill.status}</td>
                      <td><button style={styles.button} onClick={() => {
                        setSelectedBill(bill);
                        setPayForm({ amount: bill.amount_due, payment_method: 'mobile_money', transaction_reference: '' });
                      }}>Pay</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedBill && (
              <div style={styles.compactCard}>
                <h4>Pay: {selectedBill.billing_period}</h4>
                <form onSubmit={submitPayment}>
                  <input style={styles.input} value={payForm.amount} onChange={(e) => setPayForm({ ...payForm, amount: e.target.value })} />
                  <select style={styles.input} value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank</option>
                  </select>
                  <input style={styles.input} required placeholder="Transaction Reference" onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })} />
                  <button style={styles.button} type="submit">Submit Request</button>
                  <button style={{ ...styles.button, background: '#546a7b' }} type="button" onClick={() => setSelectedBill(null)}>Cancel</button>
                </form>
              </div>
            )}
          </>
        )}

        {tab === 'history' && (
          <div style={styles.card}>
            <h3>History Payments</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Reference</th><th align="left">Period</th><th align="left">Amount</th><th align="left">Status</th><th align="left">Paid At</th></tr></thead>
              <tbody>
                {history.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                    <td>{item.transaction_reference}</td>
                    <td>{item.bill.billing_period}</td>
                    <td>{item.amount}</td>
                    <td>{item.status}</td>
                    <td>{item.paid_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'receipts' && (
          <div style={styles.card}>
            <h3>Receipts</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: 'collapse' }}>
              <thead><tr><th align="left">Reference</th><th align="left">Period</th><th align="left">Amount</th><th /></tr></thead>
              <tbody>
                {receipts.map((item) => (
                  <tr key={item.id} style={{ borderTop: '1px solid #d6e2ef' }}>
                    <td>{item.transaction_reference}</td>
                    <td>{item.bill.billing_period}</td>
                    <td>{item.amount}</td>
                    <td>
                      <button style={styles.button} onClick={() => apiDownload(`/receipts/${item.id}/download/`).catch((err) => setError(err.message))}>
                        Download PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
