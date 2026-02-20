const { useEffect, useState } = React;

const styles = {
  page: { width: "100%", maxWidth: "1360px", margin: "0 auto" },
  authPage: { width: "100%", minHeight: "70vh", display: "flex", alignItems: "center", justifyContent: "center" },
  authWrap: { width: "100%", maxWidth: "380px" },
  card: { background: "#fff", border: "1px solid #d6e2ef", borderRadius: "12px", padding: "18px", marginBottom: "14px", boxShadow: "0 6px 16px rgba(13,42,72,0.08)" },
  compactCard: { background: "#fff", border: "1px solid #d6e2ef", borderRadius: "10px", padding: "14px", marginBottom: "10px", maxWidth: "380px", boxShadow: "0 4px 10px rgba(13,42,72,0.06)" },
  button: { background: "#0f4c81", color: "#fff", border: "none", borderRadius: "8px", padding: "8px 14px", cursor: "pointer", marginRight: "8px", marginBottom: "8px", fontSize: "14px" },
  navBtn: { background: "#eef4fb", color: "#103a61", border: "1px solid #c9d9ea", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", marginRight: "6px", marginBottom: "6px", fontSize: "13px" },
  activeNavBtn: { background: "#103a61", color: "#fff", border: "1px solid #103a61", borderRadius: "7px", padding: "6px 10px", cursor: "pointer", marginRight: "6px", marginBottom: "6px", fontSize: "13px" },
  layout: { display: "flex", gap: "16px", alignItems: "flex-start" },
  sidebar: { width: "280px", minWidth: "280px", background: "#fff", border: "1px solid #d6e2ef", borderRadius: "12px", padding: "14px", boxShadow: "0 6px 16px rgba(13,42,72,0.08)", position: "sticky", top: "16px" },
  sideNav: { display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" },
  sideBtn: { background: "#eef4fb", color: "#103a61", border: "1px solid #c9d9ea", borderRadius: "8px", padding: "10px 12px", cursor: "pointer", fontSize: "14px", textAlign: "left" },
  activeSideBtn: { background: "#103a61", color: "#fff", border: "1px solid #103a61", borderRadius: "8px", padding: "10px 12px", cursor: "pointer", fontSize: "14px", textAlign: "left" },
  content: { flex: 1, minWidth: 0 },
  input: { width: "100%", padding: "8px 9px", border: "1px solid #b8c8d9", borderRadius: "8px", marginBottom: "9px", fontSize: "13px" },
};

async function api(url, options = {}) {
  const response = await fetch(url, {
    credentials: "same-origin",
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed.");
  return data;
}

function AuthForm({ onAuthenticated }) {
  const [mode, setMode] = useState("login");
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    username: "",
    email: "",
    password: "",
    confirm_password: "",
    account_number: "",
    phone_number: "",
    address: "",
  });
  const isRegister = mode === "register";

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      if (isRegister && form.password !== form.confirm_password) {
        setError("Password and Confirm Password must match.");
        return;
      }
      await api(isRegister ? "/api/register/" : "/api/login/", {
        method: "POST",
        body: JSON.stringify(form),
      });
      onAuthenticated();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.compactCard}>
      <h3>{isRegister ? "User Registration" : "Login"}</h3>
      <form onSubmit={submit}>
        <input style={styles.input} placeholder="Username" required onChange={(e) => setForm({ ...form, username: e.target.value })} />
        {isRegister && <input style={styles.input} placeholder="Email" type="email" required onChange={(e) => setForm({ ...form, email: e.target.value })} />}
        <input style={styles.input} placeholder="Password" type="password" required onChange={(e) => setForm({ ...form, password: e.target.value })} />
        {isRegister && <input style={styles.input} placeholder="Confirm Password" type="password" required onChange={(e) => setForm({ ...form, confirm_password: e.target.value })} />}
        {isRegister && (
          <>
            <input style={styles.input} placeholder="Account Number" required onChange={(e) => setForm({ ...form, account_number: e.target.value })} />
            <input style={styles.input} placeholder="Phone Number" required onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
            <input style={styles.input} placeholder="Address" onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </>
        )}
        {error && <p style={{ color: "#a70000" }}>{error}</p>}
        <button style={styles.button} type="submit">{isRegister ? "Create Account" : "Login"}</button>
      </form>
      <button style={{ ...styles.button, background: "#546a7b" }} onClick={() => setMode(isRegister ? "login" : "register")}>
        {isRegister ? "Switch to Login" : "Switch to Register"}
      </button>
    </div>
  );
}

function UserDashboard() {
  const [tab, setTab] = useState("dashboard");
  const [dashboard, setDashboard] = useState({ bills: [], total_due: "0.00" });
  const [history, setHistory] = useState([]);
  const [payments, setPayments] = useState([]);
  const [receipt, setReceipt] = useState(null);
  const [selectedBill, setSelectedBill] = useState(null);
  const [payForm, setPayForm] = useState({ amount_paid: "", payment_method: "mobile_money", transaction_reference: "" });
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");

  const load = async () => {
    try {
      const [d, h, p] = await Promise.all([
        api("/api/dashboard/"),
        api("/api/bills/history/"),
        api("/api/payments/"),
      ]);
      setDashboard(d);
      setHistory(h.history);
      setPayments(p.payments);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const submitPayment = async (e) => {
    e.preventDefault();
    try {
      const data = await api(`/api/bills/${selectedBill.id}/pay/`, { method: "POST", body: JSON.stringify(payForm) });
      setInfo(data.message);
      setSelectedBill(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const openPay = (bill) => {
    setSelectedBill(bill);
    setPayForm({ amount_paid: bill.amount_due, payment_method: "mobile_money", transaction_reference: "" });
  };

  const openReceipt = async (paymentId) => {
    try {
      const data = await api(`/api/receipts/${paymentId}/`);
      setReceipt(data.receipt);
      setTab("receipt");
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div style={styles.layout}>
      <div style={styles.sidebar}>
        <strong>User Menu</strong>
        <div style={styles.sideNav}>
          {["dashboard", "pay bill", "bill history", "payment history", "receipt"].map((t) => (
            <button key={t} style={tab === t ? styles.activeSideBtn : styles.sideBtn} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {info && <div style={styles.card}><p style={{ color: "#046307" }}>{info}</p></div>}
        {error && <div style={styles.card}><p style={{ color: "#a70000" }}>{error}</p></div>}

        {tab === "dashboard" && (
          <div style={styles.card}>
            <h3>User Dashboard</h3>
            <p>Total Due: {dashboard.total_due}</p>
            <p>Unpaid Bills: {dashboard.bills.filter((b) => !b.is_paid).length}</p>
          </div>
        )}

        {tab === "pay bill" && (
          <>
            <div style={styles.card}>
              <h3>Select Bill to Pay</h3>
              <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
                <thead><tr><th align="left">Period</th><th align="left">Amount</th><th align="left">Status</th><th></th></tr></thead>
                <tbody>
                  {dashboard.bills.map((bill) => (
                    <tr key={bill.id} style={{ borderTop: "1px solid #d6e2ef" }}>
                      <td>{bill.billing_period}</td>
                      <td>{bill.amount_due}</td>
                      <td>{bill.is_paid ? "Paid" : "Unpaid"}</td>
                      <td>{!bill.is_paid && <button style={styles.button} onClick={() => openPay(bill)}>Pay</button>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {selectedBill && (
              <div style={styles.compactCard}>
                <h4>Pay: {selectedBill.billing_period}</h4>
                <form onSubmit={submitPayment}>
                  <input style={styles.input} value={payForm.amount_paid} onChange={(e) => setPayForm({ ...payForm, amount_paid: e.target.value })} />
                  <select style={styles.input} value={payForm.payment_method} onChange={(e) => setPayForm({ ...payForm, payment_method: e.target.value })}>
                    <option value="mobile_money">Mobile Money</option>
                    <option value="bank">Bank</option>
                  </select>
                  <input style={styles.input} required placeholder="Transaction Reference" onChange={(e) => setPayForm({ ...payForm, transaction_reference: e.target.value })} />
                  <button style={styles.button} type="submit">Submit</button>
                  <button style={{ ...styles.button, background: "#546a7b" }} type="button" onClick={() => setSelectedBill(null)}>Cancel</button>
                </form>
              </div>
            )}
          </>
        )}

        {tab === "bill history" && (
          <div style={styles.card}>
            <h3>Bill History</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Period</th><th align="left">Reading</th><th align="left">Amount</th><th align="left">Status</th></tr></thead>
              <tbody>
                {history.map((bill) => (
                  <tr key={bill.id} style={{ borderTop: "1px solid #d6e2ef" }}>
                    <td>{bill.billing_period}</td>
                    <td>{bill.previous_reading} - {bill.current_reading}</td>
                    <td>{bill.amount_due}</td>
                    <td>{bill.latest_payment_status || (bill.is_paid ? "success" : "unpaid")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "payment history" && (
          <div style={styles.card}>
            <h3>Payment History</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Reference</th><th align="left">Period</th><th align="left">Amount</th><th align="left">Status</th><th></th></tr></thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.id} style={{ borderTop: "1px solid #d6e2ef" }}>
                    <td>{payment.transaction_reference}</td>
                    <td>{payment.billing_period}</td>
                    <td>{payment.amount_paid}</td>
                    <td>{payment.status}</td>
                    <td><button style={styles.button} onClick={() => openReceipt(payment.id)}>Receipt</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "receipt" && (
          <div style={styles.compactCard}>
            <h3>Receipt</h3>
            {!receipt && <p>Select a receipt from Payment History.</p>}
            {receipt && (
              <>
                <p>Reference: {receipt.transaction_reference}</p>
                <p>Account: {receipt.account_number}</p>
                <p>Billing: {receipt.billing_period}</p>
                <p>Amount: {receipt.amount_paid}</p>
                <p>Status: {receipt.status}</p>
                <a style={{ ...styles.button, textDecoration: "none", display: "inline-block" }} href={`/api/receipts/${receipt.id}/download/`}>Download Receipt</a>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function AdminDashboard({ currentUser }) {
  const [tab, setTab] = useState("dashboard");
  const [summary, setSummary] = useState({ users_count: 0, pending_payments: 0, unpaid_bills: 0 });
  const [users, setUsers] = useState([]);
  const [payments, setPayments] = useState([]);
  const [report, setReport] = useState(null);
  const [reportPeriod, setReportPeriod] = useState("weekly");
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [userForm, setUserForm] = useState({ username: "", email: "", password: "", account_number: "", phone_number: "", address: "", is_staff: false });
  const [billForm, setBillForm] = useState({ account_number: "", billing_period: "", previous_reading: "", current_reading: "", amount_due: "", due_date: "" });

  const load = async () => {
    try {
      const [sd, ud, pd] = await Promise.all([
        api("/api/admin/dashboard/"),
        api("/api/admin/users/"),
        api("/api/admin/payments/"),
      ]);
      setSummary(sd);
      setUsers(ud.users);
      setPayments(pd.payments);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const createUser = async (e) => {
    e.preventDefault();
    try {
      const data = await api("/api/admin/users/", { method: "POST", body: JSON.stringify(userForm) });
      setInfo(data.message);
      setUserForm({ username: "", email: "", password: "", account_number: "", phone_number: "", address: "", is_staff: false });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const deleteUser = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      const data = await api(`/api/admin/users/${id}/`, { method: "DELETE" });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const createBill = async (e) => {
    e.preventDefault();
    try {
      const data = await api("/api/admin/bills/", { method: "POST", body: JSON.stringify(billForm) });
      setInfo(data.message);
      setBillForm({ account_number: "", billing_period: "", previous_reading: "", current_reading: "", amount_due: "", due_date: "" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const paymentDecision = async (paymentId, action) => {
    try {
      const data = await api(`/api/admin/payments/${paymentId}/decision/`, { method: "POST", body: JSON.stringify({ action }) });
      setInfo(data.message);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const generateReport = async () => {
    try {
      const data = await api(`/api/admin/reports/?period=${reportPeriod}`);
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
          {["dashboard", "add user", "all users", "add bill", "approve/reject payment", "reports"].map((t) => (
            <button key={t} style={tab === t ? styles.activeSideBtn : styles.sideBtn} onClick={() => setTab(t)}>{t}</button>
          ))}
        </div>
      </div>
      <div style={styles.content}>
        {info && <div style={styles.card}><p style={{ color: "#046307" }}>{info}</p></div>}
        {error && <div style={styles.card}><p style={{ color: "#a70000" }}>{error}</p></div>}

        {tab === "dashboard" && (
          <div style={styles.card}>
            <h3>Admin Dashboard</h3>
            <p>Logged in as: {currentUser.username}</p>
            <p>Total Users: {summary.users_count}</p>
            <p>Pending Payments: {summary.pending_payments}</p>
            <p>Unpaid Bills: {summary.unpaid_bills}</p>
          </div>
        )}

        {tab === "add user" && (
          <div style={styles.compactCard}>
            <h3>Add User</h3>
            <form onSubmit={createUser}>
              <input style={styles.input} placeholder="Username" required value={userForm.username} onChange={(e) => setUserForm({ ...userForm, username: e.target.value })} />
              <input style={styles.input} placeholder="Email" type="email" required value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
              <input style={styles.input} placeholder="Password" required type="password" value={userForm.password} onChange={(e) => setUserForm({ ...userForm, password: e.target.value })} />
              <input style={styles.input} placeholder="Account Number" required value={userForm.account_number} onChange={(e) => setUserForm({ ...userForm, account_number: e.target.value })} />
              <input style={styles.input} placeholder="Phone Number" required value={userForm.phone_number} onChange={(e) => setUserForm({ ...userForm, phone_number: e.target.value })} />
              <input style={styles.input} placeholder="Address" value={userForm.address} onChange={(e) => setUserForm({ ...userForm, address: e.target.value })} />
              <label><input type="checkbox" checked={userForm.is_staff} onChange={(e) => setUserForm({ ...userForm, is_staff: e.target.checked })} /> Make admin</label><br />
              <button style={styles.button} type="submit">Add User</button>
            </form>
          </div>
        )}

        {tab === "all users" && (
          <div style={styles.card}>
            <h3>All Users</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead><tr><th align="left">Username</th><th align="left">Email</th><th align="left">Account</th><th align="left">Role</th><th></th></tr></thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} style={{ borderTop: "1px solid #d6e2ef" }}>
                    <td>{u.username}</td>
                    <td>{u.email}</td>
                    <td>{u.account_number || "-"}</td>
                    <td>{u.is_staff ? "Admin" : "User"}</td>
                    <td>{u.id !== currentUser.id && <button style={{ ...styles.button, background: "#8a1c1c" }} onClick={() => deleteUser(u.id)}>Delete</button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "add bill" && (
          <div style={styles.compactCard}>
            <h3>Add Bill</h3>
            <form onSubmit={createBill}>
              <input style={styles.input} placeholder="Account Number" required value={billForm.account_number} onChange={(e) => setBillForm({ ...billForm, account_number: e.target.value })} />
              <input style={styles.input} placeholder="Billing Period" required value={billForm.billing_period} onChange={(e) => setBillForm({ ...billForm, billing_period: e.target.value })} />
              <input style={styles.input} placeholder="Previous Reading" required value={billForm.previous_reading} onChange={(e) => setBillForm({ ...billForm, previous_reading: e.target.value })} />
              <input style={styles.input} placeholder="Current Reading" required value={billForm.current_reading} onChange={(e) => setBillForm({ ...billForm, current_reading: e.target.value })} />
              <input style={styles.input} placeholder="Amount Due" required value={billForm.amount_due} onChange={(e) => setBillForm({ ...billForm, amount_due: e.target.value })} />
              <input style={styles.input} type="date" required value={billForm.due_date} onChange={(e) => setBillForm({ ...billForm, due_date: e.target.value })} />
              <button style={styles.button} type="submit">Add Bill</button>
            </form>
          </div>
        )}

        {tab === "approve/reject payment" && (
          <div style={styles.card}>
            <h3>Approve / Reject Payments</h3>
            <table width="100%" cellPadding="6" style={{ borderCollapse: "collapse" }}>
              <thead><tr><th align="left">User</th><th align="left">Period</th><th align="left">Amount</th><th align="left">Reference</th><th align="left">Status</th><th></th></tr></thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} style={{ borderTop: "1px solid #d6e2ef" }}>
                    <td>{p.username}</td>
                    <td>{p.billing_period}</td>
                    <td>{p.amount_paid}</td>
                    <td>{p.transaction_reference}</td>
                    <td>{p.status}</td>
                    <td>
                      {p.status === "pending" && (
                        <>
                          <button style={styles.button} onClick={() => paymentDecision(p.id, "approve")}>Approve</button>
                          <button style={{ ...styles.button, background: "#8a1c1c" }} onClick={() => paymentDecision(p.id, "reject")}>Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "reports" && (
          <div style={styles.compactCard}>
            <h3>Reports</h3>
            <select style={styles.input} value={reportPeriod} onChange={(e) => setReportPeriod(e.target.value)}>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
            </select>
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

function App() {
  const [user, setUser] = useState(null);
  const [error, setError] = useState("");

  const loadMe = async () => {
    try {
      setError("");
      const me = await api("/api/me/");
      if (!me.authenticated) {
        setUser(null);
        return;
      }
      setUser(me);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    loadMe();
  }, []);

  const logout = async () => {
    await api("/api/logout/", { method: "POST" });
    setUser(null);
  };

  if (!user) {
    return (
      <main style={styles.authPage}>
        <div style={styles.authWrap}>
          <h2 style={{ textAlign: "center", marginTop: 0 }}>Online Water Bill Payment System</h2>
          {error && <p style={{ color: "#a70000" }}>{error}</p>}
          <AuthForm onAuthenticated={loadMe} />
        </div>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <div style={styles.card}>
        <h2>{user.is_staff ? "Admin Portal" : "User Portal"}</h2>
        <p>Username: {user.username}</p>
        {!user.is_staff && <p>Account Number: {user.account_number}</p>}
        <button style={styles.button} onClick={logout}>Logout</button>
      </div>
      {user.is_staff ? <AdminDashboard currentUser={user} /> : <UserDashboard />}
    </main>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
