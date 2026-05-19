import { useState, useEffect } from "react";

const initialAccounts = [
  { id: "ACT-00141", name: "Toccara Evans-Bridges", type: "Checking", balance: 4825.67, accountNumber: "", routingNumber: "" },
  { id: "ACT-00289", name: "Jessica Worthy", type: "Savings", balance: 12340.00, accountNumber: "", routingNumber: "" },
  { id: "ACT-00374", name: "Lee Kennedy", type: "Money Market", balance: 7500.50, accountNumber: "", routingNumber: "" },
  { id: "ACT-00412", name: "Gwendolyn D. Watkins", type: "Checking", balance: 950.25, accountNumber: "", routingNumber: "" },
  { id: "ACT-00531", name: "Overcoming Church of God", type: "Savings", balance: 31200.00, accountNumber: "", routingNumber: "" },
];

const typeColors = {
  "Checking": "#c9a84c",
  "Savings": "#4c9ac9",
  "Money Market": "#7a6fc0",
};

function fmt(n) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

function genId(accounts) {
  const nums = accounts.map(a => parseInt(a.id.split("-")[1]));
  return "ACT-" + String(Math.max(...nums) + 1).padStart(5, "0");
}

export default function App() {
  const [accounts, setAccounts] = useState(() => {
    try {
      const saved = localStorage.getItem("banking-book-accounts");
      return saved ? JSON.parse(saved) : initialAccounts;
    } catch { return initialAccounts; }
  });
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", type: "Checking", balance: "", accountNumber: "", routingNumber: "" });
  const [showSensitive, setShowSensitive] = useState({});
  const [editMode, setEditMode] = useState(false);
  const [txAmount, setTxAmount] = useState("");
  const [txType, setTxType] = useState("deposit");
  const [toast, setToast] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [installPrompt, setInstallPrompt] = useState(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    localStorage.setItem("banking-book-accounts", JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const filtered = accounts.filter(a =>
    a.name.toLowerCase().includes(search.toLowerCase()) ||
    a.id.toLowerCase().includes(search.toLowerCase()) ||
    a.type.toLowerCase().includes(search.toLowerCase())
  );

  const totalAssets = accounts.reduce((s, a) => s + a.balance, 0);

  function showToast(msg, ok = true) {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2800);
  }

  function openAdd() {
    setForm({ name: "", type: "Checking", balance: "", accountNumber: "", routingNumber: "" });
    setEditMode(false);
    setShowForm(true);
    setSelected(null);
  }

  function openEdit(acct) {
    setForm({ name: acct.name, type: acct.type, balance: acct.balance, accountNumber: acct.accountNumber || "", routingNumber: acct.routingNumber || "" });
    setEditMode(true);
    setShowForm(true);
  }

  function saveForm() {
    if (!form.name.trim() || !form.balance) return showToast("Fill in all fields.", false);
    const bal = parseFloat(form.balance);
    if (isNaN(bal) || bal < 0) return showToast("Enter a valid balance.", false);
    if (editMode) {
      setAccounts(prev => prev.map(a =>
        a.id === selected.id ? { ...a, name: form.name.trim(), type: form.type, balance: bal, accountNumber: form.accountNumber.trim(), routingNumber: form.routingNumber.trim() } : a
      ));
      setSelected(prev => ({ ...prev, name: form.name.trim(), type: form.type, balance: bal, accountNumber: form.accountNumber.trim(), routingNumber: form.routingNumber.trim() }));
      showToast("Account updated.");
    } else {
      const newAcct = { id: genId(accounts), name: form.name.trim(), type: form.type, balance: bal, accountNumber: form.accountNumber.trim(), routingNumber: form.routingNumber.trim() };
      setAccounts(prev => [...prev, newAcct]);
      showToast("Account added.");
    }
    setShowForm(false);
  }

  function applyTransaction() {
    const amt = parseFloat(txAmount);
    if (isNaN(amt) || amt <= 0) return showToast("Enter a valid amount.", false);
    let success = false;
    setAccounts(prev => prev.map(a => {
      if (a.id !== selected.id) return a;
      const newBal = txType === "deposit" ? a.balance + amt : a.balance - amt;
      if (newBal < 0) { showToast("Insufficient funds.", false); return a; }
      success = true;
      return { ...a, balance: newBal };
    }));
    if (success) {
      setSelected(prev => {
        const newBal = txType === "deposit" ? prev.balance + amt : prev.balance - amt;
        return { ...prev, balance: newBal };
      });
      showToast(`${txType === "deposit" ? "Deposited" : "Withdrew"} ${fmt(amt)}.`);
      setTxAmount("");
    }
  }

  function deleteAccount() {
    setAccounts(prev => prev.filter(a => a.id !== selected.id));
    setSelected(null);
    setConfirmDelete(false);
    showToast("Account removed.");
  }

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === "accepted") {
      setShowInstallBanner(false);
      showToast("App installed! Check your home screen.");
    }
    setInstallPrompt(null);
  }

  return (
    <div style={{
      minHeight: "100vh",
      background: "#0d0f14",
      fontFamily: "'Cormorant Garamond', Georgia, serif",
      color: "#e8e0d0",
      display: "flex",
      flexDirection: "column",
    }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@300;400;500;600&family=DM+Mono:wght@300;400&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        input, select { outline: none; font-family: 'DM Mono', monospace; }
        .acct-row { transition: background 0.18s, border-color 0.18s; cursor: pointer; }
        .acct-row:hover { background: rgba(201,168,76,0.07) !important; }
        .acct-row.active { background: rgba(201,168,76,0.13) !important; border-left-color: #c9a84c !important; }
        .btn { transition: background 0.15s, transform 0.1s, opacity 0.15s; cursor: pointer; border: none; font-family: 'DM Mono', monospace; }
        .btn:hover { opacity: 0.85; }
        .btn:active { transform: scale(0.97); }
        .fade-in { animation: fadeIn 0.3s ease; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: none; } }
        .toast { animation: toastIn 0.3s ease; }
        @keyframes toastIn { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: none; } }
      `}</style>

      {showInstallBanner && (
        <div style={{
          background: "#1a1e14", borderBottom: "1px solid #c9a84c44",
          padding: "10px 20px", display: "flex", justifyContent: "space-between",
          alignItems: "center", gap: 12,
        }}>
          <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: "#c9a84c" }}>
            📲 Install Banking Book on your home screen
          </span>
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn" onClick={handleInstall} style={{
              background: "#c9a84c", color: "#0d0f14", padding: "6px 16px",
              borderRadius: 3, fontSize: 11, letterSpacing: 1.5, textTransform: "uppercase",
            }}>Install</button>
            <button className="btn" onClick={() => setShowInstallBanner(false)} style={{
              background: "transparent", color: "#556", padding: "6px 10px", borderRadius: 3, fontSize: 11,
            }}>✕</button>
          </div>
        </div>
      )}

      <div style={{
        background: "linear-gradient(135deg, #111318 0%, #0d0f14 100%)",
        borderBottom: "1px solid #222",
        padding: "28px 40px 20px",
        display: "flex", alignItems: "flex-end", justifyContent: "space-between",
        flexWrap: "wrap", gap: 16,
      }}>
        <div>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 4, color: "#c9a84c", marginBottom: 6, textTransform: "uppercase" }}>Private Ledger</div>
          <h1 style={{ fontSize: 32, fontWeight: 300, letterSpacing: 1, color: "#f0e8d8" }}>Banking Book</h1>
          <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: "#556", marginTop: 4 }}>
            {accounts.length} accounts · Total Assets: <span style={{ color: "#a8d08d" }}>{fmt(totalAssets)}</span>
          </div>
        </div>
        <button className="btn" onClick={openAdd} style={{
          background: "#c9a84c", color: "#0d0f14", padding: "10px 22px",
          borderRadius: 3, fontSize: 12, letterSpacing: 2, fontWeight: 500, textTransform: "uppercase",
        }}>+ New Account</button>
      </div>

      <div style={{ display: "flex", flex: 1, overflow: "hidden", minHeight: 0 }}>
        <div style={{
          width: 340, minWidth: 260, borderRight: "1px solid #1e2028",
          display: "flex", flexDirection: "column", background: "#0d0f14",
        }}>
          <div style={{ padding: "16px 20px 12px", borderBottom: "1px solid #1a1c22" }}>
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search accounts…"
              style={{
                width: "100%", background: "#13151c", border: "1px solid #272932",
                borderRadius: 3, padding: "9px 14px", fontSize: 12, color: "#c8c0b0", letterSpacing: 0.5,
              }}
            />
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {filtered.length === 0 && (
              <div style={{ padding: 32, textAlign: "center", color: "#444", fontSize: 13 }}>No accounts found.</div>
            )}
            {filtered.map(acct => (
              <div
                key={acct.id}
                className={`acct-row${selected?.id === acct.id ? " active" : ""}`}
                onClick={() => { setSelected(acct); setShowForm(false); setTxAmount(""); setConfirmDelete(false); }}
                style={{
                  padding: "14px 20px", borderLeft: "3px solid transparent",
                  borderBottom: "1px solid #111418", background: "transparent",
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 500, color: "#ede5d5", letterSpacing: 0.3, lineHeight: 1.3 }}>{acct.name}</div>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 10, color: "#556", marginTop: 3 }}>{acct.id}</div>
                    <div style={{
                      display: "inline-block", marginTop: 5, padding: "2px 8px", borderRadius: 2,
                      fontSize: 10, fontFamily: "'DM Mono'", letterSpacing: 1,
                      background: (typeColors[acct.type] || "#888") + "22",
                      color: typeColors[acct.type] || "#888",
                      border: `1px solid ${(typeColors[acct.type] || "#888")}44`,
                    }}>{acct.type}</div>
                  </div>
                  <div style={{ textAlign: "right", fontFamily: "'DM Mono'", fontSize: 13, color: "#a8d08d" }}>
                    {fmt(acct.balance)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ flex: 1, overflowY: "auto", background: "#0f1118", padding: "32px 40px" }}>
          {!selected && !showForm && (
            <div style={{ textAlign: "center", marginTop: 80, color: "#333" }}>
              <div style={{ fontSize: 48, marginBottom: 12 }}>🏦</div>
              <div style={{ fontSize: 16, fontWeight: 300, letterSpacing: 1 }}>Select an account to view details</div>
            </div>
          )}

          {showForm && (
            <div className="fade-in">
              <div style={{ fontSize: 22, fontWeight: 300, color: "#f0e8d8", marginBottom: 28, letterSpacing: 0.5 }}>
                {editMode ? "Edit Account" : "New Account"}
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 20, maxWidth: 460 }}>
                {[
                  { label: "Account Holder Name", key: "name", type: "text", placeholder: "Full legal name" },
                  { label: "Opening Balance ($)", key: "balance", type: "number", placeholder: "0.00" },
                  { label: "Account Number", key: "accountNumber", type: "text", placeholder: "e.g. 123456789" },
                  { label: "Routing Number", key: "routingNumber", type: "text", placeholder: "e.g. 021000021" },
                ].map(f => (
                  <div key={f.key}>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 2, color: "#c9a84c", textTransform: "uppercase", marginBottom: 7 }}>{f.label}</div>
                    <input
                      type={f.type}
                      value={form[f.key]}
                      placeholder={f.placeholder}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      style={{
                        width: "100%", background: "#13151c", border: "1px solid #272932",
                        borderRadius: 3, padding: "11px 14px", fontSize: 14, color: "#e0d8c8",
                      }}
                    />
                  </div>
                ))}
                <div>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 2, color: "#c9a84c", textTransform: "uppercase", marginBottom: 7 }}>Account Type</div>
                  <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))} style={{
                    width: "100%", background: "#13151c", border: "1px solid #272932",
                    borderRadius: 3, padding: "11px 14px", fontSize: 13, color: "#e0d8c8",
                  }}>
                    {["Checking", "Savings", "Money Market"].map(t => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", gap: 12, marginTop: 8 }}>
                  <button className="btn" onClick={saveForm} style={{
                    background: "#c9a84c", color: "#0d0f14", padding: "11px 28px",
                    borderRadius: 3, fontSize: 12, letterSpacing: 2, textTransform: "uppercase", fontWeight: 500,
                  }}>Save</button>
                  <button className="btn" onClick={() => setShowForm(false)} style={{
                    background: "#1e2028", color: "#888", padding: "11px 20px", borderRadius: 3, fontSize: 12,
                  }}>Cancel</button>
                </div>
              </div>
            </div>
          )}

          {selected && !showForm && (() => {
            const live = accounts.find(a => a.id === selected.id) || selected;
            return (
              <div className="fade-in">
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 16, marginBottom: 32 }}>
                  <div>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 3, color: "#556", textTransform: "uppercase", marginBottom: 6 }}>{live.id}</div>
                    <h2 style={{ fontSize: 28, fontWeight: 300, color: "#f0e8d8", letterSpacing: 0.5 }}>{live.name}</h2>
                    <div style={{
                      display: "inline-block", marginTop: 8, padding: "3px 12px", borderRadius: 2,
                      fontSize: 11, fontFamily: "'DM Mono'", letterSpacing: 1.5,
                      background: (typeColors[live.type] || "#888") + "22",
                      color: typeColors[live.type] || "#888",
                      border: `1px solid ${(typeColors[live.type] || "#888")}44`,
                      textTransform: "uppercase",
                    }}>{live.type}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 11, color: "#556", letterSpacing: 2, textTransform: "uppercase", marginBottom: 4 }}>Current Balance</div>
                    <div style={{ fontFamily: "'DM Mono'", fontSize: 32, color: "#a8d08d", fontWeight: 300 }}>{fmt(live.balance)}</div>
                  </div>
                </div>

                <div style={{ height: 1, background: "linear-gradient(90deg, #c9a84c33, #222, transparent)", marginBottom: 32 }} />

                {/* Account & Routing Numbers */}
                <div style={{ display: "flex", gap: 24, flexWrap: "wrap", marginBottom: 36 }}>
                  {[
                    { label: "Account Number", key: "accountNumber" },
                    { label: "Routing Number", key: "routingNumber" },
                  ].map(({ label, key }) => (
                    <div key={key} style={{ flex: 1, minWidth: 200 }}>
                      <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 2, color: "#c9a84c", textTransform: "uppercase", marginBottom: 8 }}>{label}</div>
                      <div style={{
                        background: "#13151c", border: "1px solid #272932", borderRadius: 3,
                        padding: "10px 14px", display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8,
                      }}>
                        <span style={{ fontFamily: "'DM Mono'", fontSize: 13, color: live[key] ? "#e0d8c8" : "#333", letterSpacing: 1 }}>
                          {live[key]
                            ? (showSensitive[live.id + key] ? live[key] : "•".repeat(Math.min(live[key].length, 9)))
                            : "—"}
                        </span>
                        {live[key] ? (
                          <button
                            className="btn"
                            onClick={() => setShowSensitive(prev => ({ ...prev, [live.id + key]: !prev[live.id + key] }))}
                            style={{ background: "transparent", color: "#556", fontSize: 11, padding: "2px 6px", fontFamily: "'DM Mono'", letterSpacing: 1 }}
                          >
                            {showSensitive[live.id + key] ? "HIDE" : "SHOW"}
                          </button>
                        ) : (
                          <button className="btn" onClick={() => openEdit(live)} style={{
                            background: "transparent", color: "#c9a84c44", fontSize: 10,
                            padding: "2px 6px", fontFamily: "'DM Mono'", letterSpacing: 1,
                          }}>ADD</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ marginBottom: 36 }}>
                  <div style={{ fontFamily: "'DM Mono'", fontSize: 10, letterSpacing: 3, color: "#c9a84c", textTransform: "uppercase", marginBottom: 16 }}>Post Transaction</div>
                  <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
                    <select value={txType} onChange={e => setTxType(e.target.value)} style={{
                      background: "#13151c", border: "1px solid #272932", borderRadius: 3,
                      padding: "10px 14px", fontSize: 12, color: "#c8c0b0", fontFamily: "'DM Mono'",
                    }}>
                      <option value="deposit">Deposit</option>
                      <option value="withdrawal">Withdrawal</option>
                    </select>
                    <input
                      type="number"
                      value={txAmount}
                      onChange={e => setTxAmount(e.target.value)}
                      placeholder="Amount"
                      style={{
                        width: 160, background: "#13151c", border: "1px solid #272932",
                        borderRadius: 3, padding: "10px 14px", fontSize: 13, color: "#e0d8c8",
                      }}
                    />
                    <button className="btn" onClick={applyTransaction} style={{
                      background: txType === "deposit" ? "#2a4a2a" : "#4a2a2a",
                      color: txType === "deposit" ? "#a8d08d" : "#d08888",
                      padding: "10px 22px", borderRadius: 3, fontSize: 12, letterSpacing: 1.5,
                      textTransform: "uppercase",
                      border: `1px solid ${txType === "deposit" ? "#3a6a3a" : "#6a3a3a"}`,
                    }}>Apply</button>
                  </div>
                </div>

                <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
                  <button className="btn" onClick={() => openEdit(live)} style={{
                    background: "#1e2028", color: "#c9a84c", padding: "10px 22px",
                    borderRadius: 3, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase",
                    border: "1px solid #c9a84c44",
                  }}>Edit Account</button>
                  {!confirmDelete
                    ? <button className="btn" onClick={() => setConfirmDelete(true)} style={{
                        background: "#1e2028", color: "#888", padding: "10px 22px",
                        borderRadius: 3, fontSize: 12, letterSpacing: 1.5, textTransform: "uppercase",
                        border: "1px solid #333",
                      }}>Remove Account</button>
                    : <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                        <span style={{ fontFamily: "'DM Mono'", fontSize: 12, color: "#d08888" }}>Confirm delete?</span>
                        <button className="btn" onClick={deleteAccount} style={{
                          background: "#4a2a2a", color: "#d08888", padding: "8px 16px",
                          borderRadius: 3, fontSize: 12, border: "1px solid #6a3a3a",
                        }}>Yes, Remove</button>
                        <button className="btn" onClick={() => setConfirmDelete(false)} style={{
                          background: "#1e2028", color: "#666", padding: "8px 14px", borderRadius: 3, fontSize: 12,
                        }}>Cancel</button>
                      </div>
                  }
                </div>
              </div>
            );
          })()}
        </div>
      </div>

      {toast && (
        <div className="toast" style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 999,
          background: toast.ok ? "#1a2e1a" : "#2e1a1a",
          color: toast.ok ? "#a8d08d" : "#d08888",
          border: `1px solid ${toast.ok ? "#3a6a3a" : "#6a3a3a"}`,
          padding: "12px 22px", borderRadius: 4,
          fontFamily: "'DM Mono'", fontSize: 13, letterSpacing: 0.5,
          boxShadow: "0 4px 24px rgba(0,0,0,0.5)",
        }}>{toast.msg}</div>
      )}
    </div>
  );
}
