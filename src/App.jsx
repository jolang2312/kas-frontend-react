import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import Background3D from "./components/Background3D";
import Mini3D from "./components/Mini3D";
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

  const fetchTransaksi = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;

      const dataTransaksi = data || [];
      setTransaksi(dataTransaksi);
      
      const sum = dataTransaksi
        .filter((item) => item.status === "settlement" || item.status === "lunas")
        .reduce(
          (acc, curr) => acc + parseInt(curr.amount || curr.jumlah || 0),
          0
        );
      setTotal(sum);
    } catch (err) {
      console.error("Gagal mengambil transaksi:", err.message);
    }
  };

  const handleVerifikasi = async (id) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "settlement" })
        .eq("id", id);

      if (error) throw error;

      alert("Transaksi berhasil disetujui! Uang resmi tercatat di Total Kas.");
      fetchTransaksi();
    } catch (err) {
      alert("Gagal memverifikasi transaksi: " + err.message);
    }
  };

  const handleTolak = async (id) => {
    if (window.confirm("Yakin ingin menolak transaksi ini? Transaksi yang ditolak akan langsung dihapus dari sistem.")) {
      try {
        const { error } = await supabase
          .from("transactions")
          .delete()
          .eq("id", id);

        if (error) throw error;

        alert("Transaksi ditolak dan berhasil dihapus dari sistem.");
        fetchTransaksi();
      } catch (err) {
        alert("Gagal menghapus transaksi: " + err.message);
      }
    }
  };

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
            body { font-family: 'Inter', system-ui, sans-serif; background: #0b0c10; color: #333; padding: 20px; }
            .card { background: #ffffff; border-radius: 16px; max-width: 480px; margin: 0 auto; padding: 24px; box-shadow: 0 10px 30px rgba(0,0,0,0.2); border-top: 6px solid #2563eb; }
            .header { text-align: center; border-bottom: 2px dashed #e2e8f0; padding-bottom: 16px; margin-bottom: 16px; }
            .logo { font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: 1.5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 13px; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #0f172a; }
            .status-badge { background: ${item.status === 'pending' ? '#fef9c3' : '#dcfce7'}; color: ${item.status === 'pending' ? '#854d0e' : '#166534'}; padding: 4px 10px; border-radius: 20px; font-size: 11px; font-weight: bold; }
            .total-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; border-radius: 12px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
            .total-amount { font-size: 20px; font-weight: 800; color: #16a34a; }
            .btn-print { width: 100%; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 10px; margin-top: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
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
              <span class="value">${item.transaction_date ? new Date(item.transaction_date).toLocaleString("id-ID") : "-"}</span>
            </div>
            <div class="item-row">
              <span class="label">Keterangan / Pembayar</span>
              <span class="value">${item.payer_name || item.keterangan || '-'}</span>
            </div>
            <div class="item-row">
              <span class="label">Status</span>
              <span class="status-badge">${item.status === 'pending' ? '⏳ MENUNGGU VERIFIKASI' : '● LUNAS / DISETUJUI'}</span>
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

  // REKAP AKUMULASI PER PEMBAYAR
  const rekapPerPembayar = transaksi
    .filter((item) => item.status === "settlement" || item.status === "lunas")
    .reduce((acc, curr) => {
      const nama = curr.payer_name || curr.keterangan || "Anonim";
      const nominal = parseInt(curr.amount || curr.jumlah || 0);
      acc[nama] = (acc[nama] || 0) + nominal;
      return acc;
    }, {});

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <Background3D />
        <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }} className="card-3d-appear panel-glass">
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
            <div style={{ marginBottom: "16px" }}>
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

            <div style={{ marginBottom: "20px" }}>
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

          <p style={{ marginTop: "20px", fontSize: "11px", color: "#64748b", textAlign: "center" }}>
            Sistem Kas Organisasi Southern Base &copy; 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.dashboardContainer, position: "relative" }}>
      <Background3D />

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={styles.navbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logoImg} alt="Southern Base" style={{ height: "28px", borderRadius: "6px" }} />
            <span style={{ fontWeight: "700", letterSpacing: "1px", color: "#fff", fontSize: "14px" }}>
              SOUTHERN BASE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.userInfoBadge}>
              <span style={{ fontSize: "11px", color: "#94a3b8" }}>
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
          {/* SUMMARY KAS TERKUMPUL */}
          <div style={styles.summaryCard} className="card-3d-appear panel-glass panel-hover-3d">
            <div>
              <span style={styles.summaryLabel}>Total Kas Terkumpul (Terverifikasi)</span>
              <h1 style={styles.summaryAmount}>
                Rp {total.toLocaleString("id-ID")}
              </h1>
              <div style={{ marginTop: "10px" }}>
                <span style={{ color: "#10b981", fontWeight: "700", fontSize: "11px", background: "rgba(16, 185, 129, 0.15)", padding: "4px 10px", borderRadius: "20px", display: "inline-block" }}>
                  ● Modus Akses: {user.role === "admin" ? "Administrator Master" : "Anggota"}
                </span>
              </div>
            </div>
          </div>

          {/* TABEL REKAPITULASI TOTAL PER PEMBAYAR */}
          <div style={{ ...styles.panelCard, marginBottom: "20px" }} className="card-3d-appear panel-glass panel-hover-3d">
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <Mini3D color={0x10b981} />
              <h3 style={styles.panelTitle}>Rekap Akumulasi Pembayaran Per Anggota</h3>
            </div>
            <div style={{ overflowX: "auto", width: "100%" }}>
              <table style={styles.table}>
                <thead>
                  <tr style={styles.tableHeaderRow}>
                    <th style={styles.th}>NAMA PEMBAYAR</th>
                    <th style={{ ...styles.th, textAlign: "right" }}>TOTAL TERKUMPUL</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(rekapPerPembayar).length === 0 ? (
                    <tr>
                      <td colSpan="2" style={styles.emptyTd}>
                        Belum ada pembayaran terverifikasi.
                      </td>
                    </tr>
                  ) : (
                    Object.entries(rekapPerPembayar).map(([nama, totalAmount], idx) => (
                      <tr key={idx} style={styles.tableRow}>
                        <td style={styles.tdWhite}>👤 {nama}</td>
                        <td style={{ ...styles.tdGreen, textAlign: "right" }}>
                          Rp {totalAmount.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div style={styles.gridContainer}>
            {/* PANEL INPUT ANGGOTA */}
            {user.role === "anggota" && (
              <div style={styles.panelCard} className="card-3d-appear panel-glass panel-hover-3d">
                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                  <Mini3D color={0x3b82f6} />
                  <h3 style={styles.panelTitle}>Input Pemasukan / Kas</h3>
                </div>
                <InputForm onSuccess={fetchTransaksi} />
              </div>
            )}

            {/* PANEL RIWAYAT KAS */}
            <div style={styles.panelCard} className="card-3d-appear panel-glass panel-hover-3d">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Mini3D color={0x60a5fa} />
                <h3 style={styles.panelTitle}>
                  Riwayat Kas Masuk {user.role === "admin" && "& Verifikasi Struk"}
                </h3>
              </div>
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>TANGGAL</th>
                      <th style={styles.th}>KETERANGAN</th>
                      <th style={styles.th}>NOMINAL</th>
                      <th style={styles.th}>STATUS</th>
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
                            {item.transaction_date ? new Date(item.transaction_date).toLocaleDateString("id-ID") : "-"}
                          </td>
                          <td style={styles.tdWhite}>{item.payer_name || item.keterangan || '-'}</td>
                          <td style={styles.tdGreen}>
                            +Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}
                          </td>
                          <td style={styles.td}>
                            {item.status === "settlement" || item.status === "lunas" ? (
                              <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10b981", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", whiteSpace: "nowrap" }}>
                                ● Disetujui
                              </span>
                            ) : (
                              <span style={{ background: "rgba(234, 179, 8, 0.15)", color: "#eab308", padding: "4px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", whiteSpace: "nowrap" }}>
                                ⏳ Pending
                              </span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                              {user.role === "admin" && (item.status === "pending" || !item.status) && (
                                <>
                                  <button
                                    onClick={() => handleVerifikasi(item.id)}
                                    style={{ background: "#10b981", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                                  >
                                    ✔ Setujui
                                  </button>
                                  <button
                                    onClick={() => handleTolak(item.id)}
                                    style={{ background: "#dc2626", color: "#fff", border: "none", padding: "5px 8px", borderRadius: "6px", fontSize: "10px", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap" }}
                                  >
                                    ✖ Tolak
                                  </button>
                                </>
                              )}
                              <button onClick={() => handleDownloadBukti(item)} style={styles.btnAction}>
                                📥 Struk
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* PANEL KELOLA ANGGOTA (ADMIN ONLY) */}
          {user.role === "admin" && (
            <div style={{ ...styles.panelCard, marginTop: "20px" }} className="card-3d-appear panel-glass panel-hover-3d">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <Mini3D color={0xf59e0b} />
                <h3 style={styles.panelTitle}>Kelola Anggota Organisasi</h3>
              </div>

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

              <div style={{ overflowX: "auto", width: "100%" }}>
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
    padding: "16px"
  },
  loginCard: {
    padding: "24px",
    borderRadius: "16px",
    width: "100%",
    maxWidth: "360px"
  },
  logoWrapper: {
    textAlign: "center",
    marginBottom: "16px"
  },
  logoImg: {
    maxWidth: "140px",
    borderRadius: "8px",
    marginBottom: "8px",
    boxShadow: "0 8px 20px rgba(0,0,0,0.4)"
  },
  badgeGlow: {
    fontSize: "9px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#3b82f6",
    textTransform: "uppercase"
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: "#94a3b8",
    marginBottom: "4px",
    fontWeight: "600"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#0a0b0e",
    border: "1px solid #272a34",
    color: "#f8fafc",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "13px"
  },
  btnLogin: {
    width: "100%",
    padding: "12px",
    background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  errorBox: {
    background: "#2d1215",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    marginBottom: "16px"
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
    padding: "12px 16px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "10px"
  },
  userInfoBadge: {
    display: "flex",
    alignItems: "center",
    gap: "6px",
    background: "#1a1d28",
    padding: "4px 10px",
    borderRadius: "16px",
    border: "1px solid #272a34"
  },
  roleAdmin: {
    background: "#3b82f6",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "800"
  },
  roleMember: {
    background: "#10b981",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "10px",
    fontSize: "9px",
    fontWeight: "800"
  },
  btnLogout: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "6px 12px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer"
  },
  mainContent: {
    maxWidth: "1150px",
    margin: "16px auto",
    padding: "0 12px"
  },
  summaryCard: {
    borderRadius: "16px",
    padding: "20px",
    marginBottom: "20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  summaryLabel: {
    fontSize: "11px",
    color: "#94a3b8",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    fontWeight: "600"
  },
  summaryAmount: {
    margin: "6px 0 0 0",
    fontSize: "26px",
    color: "#10b981",
    fontWeight: "800"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: "16px"
  },
  panelCard: {
    borderRadius: "16px",
    padding: "16px"
  },
  panelTitle: {
    margin: 0,
    fontSize: "14px",
    color: "#f8fafc",
    fontWeight: "700"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    textAlign: "left"
  },
  tableHeaderRow: {
    borderBottom: "1px solid #1f2430"
  },
  th: {
    padding: "8px 6px",
    color: "#64748b",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  tableRow: {
    borderBottom: "1px solid #161822"
  },
  td: { padding: "10px 6px" },
  tdMuted: { padding: "10px 6px", color: "#94a3b8", fontSize: "11px", whiteSpace: "nowrap" },
  tdWhite: { padding: "10px 6px", color: "#f8fafc", fontWeight: "600" },
  tdGreen: { padding: "10px 6px", color: "#10b981", fontWeight: "700", whiteSpace: "nowrap" },
  emptyTd: { padding: "20px", textAlign: "center", color: "#64748b", fontSize: "12px" },
  btnAction: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  crudForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
    gap: "10px",
    marginBottom: "16px"
  },
  btnAddMember: {
    background: "#10b981",
    color: "#fff",
    border: "none",
    padding: "10px",
    borderRadius: "8px",
    fontWeight: "700",
    fontSize: "12px",
    cursor: "pointer"
  },
  btnDelete: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default App;