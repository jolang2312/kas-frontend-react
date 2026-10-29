import React, { useState, useEffect } from "react";
import KasForm from "./components/KasForm";
import { supabase } from "./supabaseClient";
import logoImg from "./assets/logo.jpeg"; 

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [transaksi, setTransaksi] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [total, setTotal] = useState(0);

  const [namaAnggota, setNamaAnggota] = useState("");
  const [emailAnggota, setEmailAnggota] = useState("");
  const [passAnggota, setPassAnggota] = useState("");

  // FUNGSI LOGIN VIA SUPABASE DIRECT
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");
    setLoadingLogin(true);

    try {
      const cleanEmail = email.trim().toLowerCase();
      const cleanPassword = password.trim();

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", cleanEmail)
        .eq("password", cleanPassword);

      if (error) throw error;

      if (!data || data.length === 0) {
        throw new Error("Email atau password tidak terdaftar / salah!");
      }

      const userData = data[0];
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Detail Error:", error);
      setLoginError(error.message || "Login gagal! Periksa email dan password.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");
    setUser(null);
    setEmail("");
    setPassword("");
    setLoginError("");
    setTransaksi([]);
    setAnggotaList([]);
  };

  // FETCH TRANSAKSI LANGSUNG DARI TABEL TRANSACTIONS (MENDUKUNG 'amount' & 'jumlah')
  const fetchTransaksi = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      const dataTransaksi = data || [];
      setTransaksi(dataTransaksi);
      
      // Mengambil nominal dari kolom 'amount' atau fallback 'jumlah'
      const sum = dataTransaksi.reduce(
        (acc, curr) => acc + parseInt(curr.amount || curr.jumlah || 0),
        0
      );
      setTotal(sum);
    } catch (err) {
      console.error("Gagal mengambil transaksi:", err.message);
    }
  };

  // FETCH ANGGOTA LANGSUNG DARI SUPABASE
  const fetchAnggota = async () => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: true });

      if (error) throw error;
      setAnggotaList(data || []);
    } catch (err) {
      console.error("Gagal mengambil data anggota:", err.message);
    }
  };

  useEffect(() => {
    if (user) {
      fetchTransaksi();
      if (user.role === "admin") {
        fetchAnggota();
      }
    }
  }, [user]);

  // TAMBAH ANGGOTA (CRUD ADMIN)
  const handleTambahAnggota = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase
        .from("users")
        .insert([
          {
            name: namaAnggota,
            email: emailAnggota,
            password: passAnggota,
            role: "anggota"
          }
        ]);

      if (error) throw error;

      alert("Anggota berhasil ditambahkan!");
      setNamaAnggota("");
      setEmailAnggota("");
      setPassAnggota("");
      fetchAnggota();
    } catch (err) {
      alert("Gagal menambah anggota: " + err.message);
    }
  };

  // HAPUS ANGGOTA (CRUD ADMIN)
  const handleHapusAnggota = async (id) => {
    if (window.confirm("Yakin ingin menghapus anggota ini?")) {
      try {
        const { error } = await supabase
          .from("users")
          .delete()
          .eq("id", id);

        if (error) throw error;
        fetchAnggota();
      } catch (err) {
        alert("Gagal menghapus anggota: " + err.message);
      }
    }
  };

  const handleDownloadBukti = (item) => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bukti Transaksi - ${item.order_id || 'TRX-DANA'}</title>
          <style>
            body { font-family: 'Inter', system-ui, sans-serif; background: #0b0c10; color: #333; padding: 40px; }
            .card { background: #ffffff; border-radius: 16px; max-width: 480px; margin: 0 auto; padding: 32px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-top: 6px solid #2563eb; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: 1.5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #0f172a; }
            .status-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .total-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 12px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
            .total-amount { font-size: 22px; font-weight: 800; color: #16a34a; }
            .btn-print { width: 100%; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 10px; margin-top: 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
            @media print { .btn-print { display: none; } body { background: #fff; padding: 0; } .card { box-shadow: none; border: 1px solid #ccc; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">SOUTHERN BASE</div>
              <div class="subtitle">Struk Pembayaran Resmi</div>
            </div>
            <div class="item-row">
              <span class="label">Order ID</span>
              <span class="value" style="font-family: monospace;">${item.order_id || 'TRX-DANA'}</span>
            </div>
            <div class="item-row">
              <span class="label">Tanggal Transaksi</span>
              <span class="value">${item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}</span>
            </div>
            <div class="item-row">
              <span class="label">Keterangan / Pembayar</span>
              <span class="value">${item.keterangan || item.description || '-'}</span>
            </div>
            <div class="item-row">
              <span class="label">Status</span>
              <span class="status-badge">● LUNAS</span>
            </div>
            <div class="total-box">
              <span class="label" style="font-weight:600; color:#334155;">TOTAL BAYAR</span>
              <span class="total-amount">Rp ${parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}</span>
            </div>
            <button class="btn-print" onclick="window.print()">📥 Unduh PDF / Cetak Struk</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // ----------------------------------------------------
  // TAMPILAN 1: FORM LOGIN
  // ----------------------------------------------------
  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginCard}>
          <div style={styles.logoWrapper}>
            <img src={logoImg} alt="Southern Base" style={styles.logoImg} />
            <div style={styles.badgeGlow}>SOUTHERN BASE PORTAL</div>
          </div>

          {loginError && (
            <div style={styles.errorBox}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "18px" }}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="admin@kas.com / anggota@kas.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={styles.label}>Password System</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
              />
            </div>

            <button type="submit" style={styles.btnLogin} disabled={loadingLogin}>
              {loadingLogin ? "Memverifikasi..." : "Masuk Portal →"}
            </button>
          </form>

          <p style={{ marginTop: "24px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
            Sistem Kas Organisasi Southern Base &copy; 2026
          </p>
        </div>
      </div>
    );
  }

  // ----------------------------------------------------
  // TAMPILAN 2: DASHBOARD UTAMA
  // ----------------------------------------------------
  return (
    <div style={styles.dashboardContainer}>
      <header style={styles.navbar}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logoImg} alt="Southern Base" style={{ height: "32px", borderRadius: "6px" }} />
          <span style={{ fontWeight: "700", letterSpacing: "1px", color: "#fff", fontSize: "15px" }}>
            SOUTHERN BASE
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={styles.userInfoBadge}>
            <span style={{ fontSize: "12px", color: "#94a3b8" }}>
              <b style={{ color: "#f8fafc" }}>{user.name}</b>
            </span>
            <span style={user.role === "admin" ? styles.roleAdmin : styles.roleMember}>
              {user.role ? user.role.toUpperCase() : "MEMBER"}
            </span>
          </div>
          <button onClick={handleLogout} style={styles.btnLogout}>
            Logout
          </button>
        </div>
      </header>

      <main style={styles.mainContent}>
        <div style={styles.summaryCard}>
          <div>
            <span style={styles.summaryLabel}>Total Kas Terkumpul</span>
            <h1 style={styles.summaryAmount}>
              Rp {total.toLocaleString("id-ID")}
            </h1>
          </div>
          <div style={styles.statusBox}>
            <span style={{ color: "#10b981", fontWeight: "700", fontSize: "13px" }}>
              ● Modus Akses: {user.role === "admin" ? "Administrator Master" : "Anggota"}
            </span>
          </div>
        </div>

        <div style={{
          display: "grid",
          gridTemplateColumns: user.role === "anggota" ? "1fr 1.6fr" : "1fr",
          gap: "24px"
        }}>
          {user.role === "anggota" && (
            <div style={styles.panelCard}>
              <h3 style={styles.panelTitle}>💳 Input Pemasukan / Kas</h3>
              <KasForm onSuccess={fetchTransaksi} />
            </div>
          )}

          <div style={styles.panelCard}>
            <h3 style={styles.panelTitle}>
              📊 Riwayat Kas Masuk {user.role === "admin" && "& Verifikasi Struk"}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>TANGGAL</th>
                    <th style={styles.th}>KETERANGAN</th>
                    <th style={styles.th}>NOMINAL</th>
                    <th style={styles.th}>ORDER ID</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={styles.emptyTd}>
                        Belum ada transaksi tercatat.
                      </td>
                    </tr>
                  ) : (
                    transaksi.map((item, idx) => (
                      <tr key={idx} style={styles.tableRow}>
                        <td style={styles.tdMuted}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td style={styles.tdWhite}>{item.keterangan || item.description || '-'}</td>
                        <td style={styles.tdGreen}>
                          +Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={styles.td}>
                          <span style={styles.orderBadge}>
                            {item.order_id || "TRX-VERIFIED"}
                          </span>
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button onClick={() => handleDownloadBukti(item)} style={styles.btnAction}>
                            📥 Struk
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {user.role === "admin" && (
          <div style={{ ...styles.panelCard, marginTop: "28px" }}>
            <h3 style={styles.panelTitle}>👥 Kelola Anggota Organisasi</h3>

            <form onSubmit={handleTambahAnggota} style={styles.crudForm}>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={namaAnggota}
                onChange={(e) => setNamaAnggota(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="email"
                placeholder="Email Anggota"
                value={emailAnggota}
                onChange={(e) => setEmailAnggota(e.target.value)}
                required
                style={styles.input}
              />
              <input
                type="password"
                placeholder="Password"
                value={passAnggota}
                onChange={(e) => setPassAnggota(e.target.value)}
                required
                style={styles.input}
              />
              <button type="submit" style={styles.btnAddMember}>
                + Tambah Anggota
              </button>
            </form>

            <div style={{ overflowX: "auto" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>ID</th>
                    <th style={styles.th}>NAMA</th>
                    <th style={styles.th}>EMAIL</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {anggotaList.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={styles.emptyTd}>
                        Belum ada data anggota.
                      </td>
                    </tr>
                  ) : (
                    anggotaList.map((item) => (
                      <tr key={item.id} style={styles.tableRow}>
                        <td style={styles.tdMuted}>#{item.id}</td>
                        <td style={styles.tdWhite}>{item.name}</td>
                        <td style={styles.tdMuted}>{item.email}</td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button onClick={() => handleHapusAnggota(item.id)} style={styles.btnDelete}>
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

const styles = {
  loginContainer: {
    background: "radial-gradient(circle at top, #1a1c26 0%, #0d0e12 100%)",
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    fontFamily: "'Inter', system-ui, sans-serif",
    padding: "20px"
  },
  loginCard: {
    background: "rgba(18, 20, 29, 0.95)",
    backdropFilter: "blur(12px)",
    padding: "40px",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "380px",
    border: "1px solid rgba(255, 255, 255, 0.08)",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.7)"
  },
  logoWrapper: {
    textAlign: "center",
    marginBottom: "28px"
  },
  logoImg: {
    maxWidth: "180px",
    borderRadius: "10px",
    marginBottom: "12px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
  },
  badgeGlow: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "2px",
    color: "#3b82f6",
    textTransform: "uppercase"
  },
  label: {
    display: "block",
    fontSize: "12px",
    color: "#94a3b8",
    marginBottom: "6px",
    fontWeight: "600"
  },
  input: {
    width: "100%",
    padding: "12px 14px",
    background: "#0a0b0e",
    border: "1px solid #272a34",
    color: "#f8fafc",
    borderRadius: "10px",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "14px",
    transition: "border 0.2s"
  },
  btnLogin: {
    width: "100%",
    padding: "14px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "14px",
    boxShadow: "0 4px 15px rgba(37, 99, 235, 0.35)",
    transition: "transform 0.1s"
  },
  errorBox: {
    background: "#2d1215",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    padding: "10px 14px",
    borderRadius: "10px",
    fontSize: "12px",
    marginBottom: "20px"
  },
  dashboardContainer: {
    background: "#0d0e12",
    minHeight: "100vh",
    color: "#e2e8f0",
    fontFamily: "'Inter', system-ui, sans-serif"
  },
  navbar: {
    background: "#12141d",
    borderBottom: "1px solid #1f2430",
    padding: "16px 32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    sticky: "top"
  },
  userInfoBadge: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    background: "#1a1d28",
    padding: "6px 14px",
    borderRadius: "20px",
    border: "1px solid #272a34"
  },
  roleAdmin: {
    background: "#3b82f6",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "800"
  },
  roleMember: {
    background: "#10b981",
    color: "#fff",
    padding: "2px 8px",
    borderRadius: "12px",
    fontSize: "10px",
    fontWeight: "800"
  },
  btnLogout: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "8px 16px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  mainContent: {
    maxWidth: "1150px",
    margin: "32px auto",
    padding: "0 20px"
  },
  summaryCard: {
    background: "linear-gradient(135deg, #161925 0%, #11131c 100%)",
    border: "1px solid #232736",
    borderRadius: "20px",
    padding: "32px",
    marginBottom: "32px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    boxShadow: "0 10px 30px rgba(0,0,0,0.4)"
  },
  summaryLabel: {
    fontSize: "12px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "1px",
    fontWeight: "600"
  },
  summaryAmount: {
    margin: "8px 0 0 0",
    fontSize: "38px",
    color: "#10b981",
    fontWeight: "800"
  },
  statusBox: {
    background: "rgba(16, 185, 129, 0.1)",
    border: "1px solid rgba(16, 185, 129, 0.2)",
    padding: "10px 20px",
    borderRadius: "30px"
  },
  panelCard: {
    background: "#12141d",
    border: "1px solid #1f2430",
    borderRadius: "20px",
    padding: "28px",
    boxShadow: "0 8px 24px rgba(0,0,0,0.3)"
  },
  panelTitle: {
    margin: "0 0 20px 0",
    fontSize: "16px",
    color: "#f8fafc",
    fontWeight: "700"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "13px",
    textAlign: "left"
  },
  tableHeaderRow: {
    borderBottom: "1px solid #1f2430"
  },
  th: {
    padding: "12px 10px",
    color: "#64748b",
    fontSize: "11px",
    fontWeight: "700",
    letterSpacing: "0.5px"
  },
  tableRow: {
    borderBottom: "1px solid #161822"
  },
  td: { padding: "14px 10px" },
  tdMuted: { padding: "14px 10px", color: "#94a3b8" },
  tdWhite: { padding: "14px 10px", color: "#f8fafc", fontWeight: "600" },
  tdGreen: { padding: "14px 10px", color: "#10b981", fontWeight: "700" },
  emptyTd: { padding: "30px", textAlign: "center", color: "#64748b" },
  orderBadge: {
    background: "#1a2234",
    border: "1px solid #2563eb",
    color: "#60a5fa",
    padding: "4px 8px",
    borderRadius: "6px",
    fontFamily: "monospace",
    fontSize: "11px"
  },
  btnAction: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "7px 14px",
    borderRadius: "8px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  },
  crudForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "12px",
    marginBottom: "24px"
  },
  btnAddMember: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "12px",
    borderRadius: "10px",
    fontWeight: "700",
    cursor: "pointer"
  },
  btnDelete: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default App;