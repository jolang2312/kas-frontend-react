import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import Background3D from "./components/Background3D";
import { supabase } from "./supabaseClient";
import logoImg from "./assets/logo.jpeg"; 

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loginError, setLoginError] = useState("");
  const [loadingLogin, setLoadingLogin] = useState(false);

  const [transaksi, setTransaksi] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [total, setTotal] = useState(0);

  const [namaAnggota, setNamaAnggota] = useState("");
  const [emailAnggota, setEmailAnggota] = useState("");
  const [passAnggota, setPassAnggota] = useState("");

  // State untuk Pop-up Preview Screenshot
  const [selectedProof, setSelectedProof] = useState(null);

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
            body { font-family: 'Plus Jakarta Sans', system-ui, sans-serif; background: #09090b; color: #18181b; padding: 20px; }
            .card { background: #ffffff; border-radius: 12px; max-width: 440px; margin: 0 auto; padding: 24px; border-top: 4px solid #2563eb; }
            .header { text-align: center; border-bottom: 1px border-dash #e4e4e7; padding-bottom: 16px; margin-bottom: 16px; }
            .logo { font-size: 18px; font-weight: 800; color: #09090b; letter-spacing: 1px; }
            .subtitle { font-size: 12px; color: #71717a; margin-top: 4px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 10px; font-size: 13px; }
            .label { color: #71717a; }
            .value { font-weight: 600; color: #09090b; }
            .status-badge { background: ${item.status === 'pending' ? '#fef3c7' : '#dcfce7'}; color: ${item.status === 'pending' ? '#92400e' : '#166534'}; padding: 2px 8px; border-radius: 6px; font-size: 11px; font-weight: 700; }
            .total-box { background: #f4f4f5; border: 1px solid #e4e4e7; padding: 12px 16px; border-radius: 10px; margin-top: 16px; display: flex; justify-content: space-between; align-items: center; }
            .total-amount { font-size: 18px; font-weight: 800; color: #16a34a; }
            .btn-print { width: 100%; padding: 10px; background: #09090b; color: #fff; border: none; border-radius: 8px; margin-top: 20px; font-size: 13px; font-weight: 600; cursor: pointer; }
            @media print { .btn-print { display: none; } body { background: #fff; padding: 0; } .card { box-shadow: none; border: 1px solid #ccc; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">SOUTHERN BASE</div>
              <div class="subtitle">Struk Pembayaran Kas Resmi</div>
            </div>
            <div class="item-row">
              <span class="label">Order ID</span>
              <span class="value" style="font-family: monospace;">${item.order_id || 'TRX-DANA'}</span>
            </div>
            <div class="item-row">
              <span class="label">Tanggal</span>
              <span class="value">${item.transaction_date ? new Date(item.transaction_date).toLocaleString("id-ID") : "-"}</span>
            </div>
            <div class="item-row">
              <span class="label">Pembayar</span>
              <span class="value">${item.payer_name || item.keterangan || '-'}</span>
            </div>
            <div class="item-row">
              <span class="label">Status</span>
              <span class="status-badge">${item.status === 'pending' ? 'MENUNGGU' : 'TERVERIFIKASI'}</span>
            </div>
            <div class="total-box">
              <span class="label" style="font-weight:600; color:#27272a;">TOTAL BAYAR</span>
              <span class="total-amount">Rp ${parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}</span>
            </div>
            <button class="btn-print" onclick="window.print()">📥 Cetak / Unduh Struk</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  const rekapPerPembayar = transaksi
    .filter((item) => item.status === "settlement" || item.status === "lunas")
    .reduce((acc, curr) => {
      let rawName = curr.payer_name || curr.keterangan || "Anonim";
      let cleanName = rawName.split("-")[0].trim();
      if (!cleanName) cleanName = "Anonim";

      const nominal = parseInt(curr.amount || curr.jumlah || 0);
      acc[cleanName] = (acc[cleanName] || 0) + nominal;
      return acc;
    }, {});

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <Background3D />
        <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }} className="card-matte">
          <div style={styles.logoWrapper}>
            <img src={logoImg} alt="Southern Base" style={styles.logoImg} />
            <div style={styles.badgeLabel}>SOUTHERN BASE PORTAL</div>
          </div>

          {loginError && (
            <div style={styles.errorBox}>
              ⚠️ {loginError}
            </div>
          )}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "14px" }}>
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
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  style={{ ...styles.input, paddingRight: "40px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    background: "none",
                    border: "none",
                    color: "#71717a",
                    cursor: "pointer",
                    fontSize: "13px"
                  }}
                  title={showPassword ? "Sembunyikan" : "Tampilkan"}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <button type="submit" style={styles.btnLogin} disabled={loadingLogin}>
              {loadingLogin ? "Memverifikasi..." : "Masuk Portal →"}
            </button>
          </form>

          <p style={{ marginTop: "20px", fontSize: "11px", color: "#52525b", textAlign: "center" }}>
            Sistem Kas Organisasi Southern Base &copy; 2026
          </p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ ...styles.dashboardContainer, position: "relative" }}>
      <Background3D />

      {/* MODAL POPUP LIHAT SCREENSHOT BUKTI TRANSFER */}
      {selectedProof && (
        <div
          onClick={() => setSelectedProof(null)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.85)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "20px",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#18181b",
              border: "1px solid #27272a",
              borderRadius: "14px",
              padding: "20px",
              maxWidth: "500px",
              width: "100%",
              textAlign: "center",
            }}
          >
            <h4 style={{ color: "#f4f4f5", marginTop: 0, marginBottom: "14px", fontSize: "15px" }}>
              🖼️ Screenshot Bukti Transfer
            </h4>
            <img
              src={selectedProof}
              alt="Screenshot Bukti Transfer"
              style={{
                width: "100%",
                maxHeight: "65vh",
                objectFit: "contain",
                borderRadius: "8px",
                border: "1px solid #27272a",
                background: "#09090b"
              }}
            />
            <div style={{ marginTop: "16px", textAlign: "right" }}>
              <button
                onClick={() => setSelectedProof(null)}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "8px 16px",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "12px",
                  cursor: "pointer"
                }}
              >
                ✖ Tutup Preview
              </button>
            </div>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={styles.navbar}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logoImg} alt="Southern Base" style={{ height: "26px", borderRadius: "6px" }} />
            <span style={{ fontWeight: "700", letterSpacing: "0.5px", color: "#f4f4f5", fontSize: "14px" }}>
              SOUTHERN BASE
            </span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={styles.userInfoBadge}>
              <span style={{ fontSize: "12px", color: "#a1a1aa" }}>
                <b style={{ color: "#f4f4f5" }}>{user.name}</b>
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
          {/* HERO SUMMARY KAS */}
          <div style={styles.summaryCard} className="card-matte">
            <div>
              <span className="heading-label">Total Kas Terkumpul (Terverifikasi)</span>
              <h1 style={styles.summaryAmount}>
                Rp {total.toLocaleString("id-ID")}
              </h1>
              <div style={{ marginTop: "8px" }}>
                <span style={styles.accessBadge}>
                  ● Akses: {user.role === "admin" ? "Administrator Master" : "Anggota Organisasi"}
                </span>
              </div>
            </div>
          </div>

          {/* GRID TATA LETAK ASIMETRIS */}
          <div style={styles.gridContainer}>
            {/* TABEL REKAP ANGGOTA */}
            <div style={styles.panelCard} className="card-matte">
              <div style={{ marginBottom: "14px" }}>
                <span className="heading-label">Akumulasi Pembayaran</span>
                <h3 style={styles.panelTitle}>Kas Per Anggota</h3>
              </div>
              <div style={{ overflowX: "auto", width: "100%" }}>
                <table style={styles.table}>
                  <thead>
                    <tr style={styles.tableHeaderRow}>
                      <th style={styles.th}>NAMA ANGGOTA</th>
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

            {/* FORM INPUT ANGGOTA */}
            {user.role === "anggota" && (
              <div style={styles.panelCard} className="card-matte">
                <div style={{ marginBottom: "14px" }}>
                  <span className="heading-label">Form Transaksi</span>
                  <h3 style={styles.panelTitle}>Input Pemasukan Kas</h3>
                </div>
                <InputForm onSuccess={fetchTransaksi} />
              </div>
            )}
          </div>

          {/* TABEL RIWAYAT TRANSAKSI */}
          <div style={{ ...styles.panelCard, marginTop: "16px" }} className="card-matte">
            <div style={{ marginBottom: "14px" }}>
              <span className="heading-label">Jurnal Kas</span>
              <h3 style={styles.panelTitle}>
                Riwayat Kas Masuk {user.role === "admin" && "& Verifikasi Transaksi"}
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
                            <span style={styles.statusSuccess}>
                              ● Disetujui
                            </span>
                          ) : (
                            <span style={styles.statusPending}>
                              ⏳ Pending
                            </span>
                          )}
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            {/* TOMBOL LIHAT SCREENSHOT BUKTI */}
                            {item.description && item.description.startsWith("data:image") && (
                              <button
                                onClick={() => setSelectedProof(item.description)}
                                style={styles.btnProof}
                              >
                                🖼️ Bukti
                              </button>
                            )}

                            {user.role === "admin" && (item.status === "pending" || !item.status) && (
                              <>
                                <button
                                  onClick={() => handleVerifikasi(item.id)}
                                  style={styles.btnApprove}
                                >
                                  ✔ Setujui
                                </button>
                                <button
                                  onClick={() => handleTolak(item.id)}
                                  style={styles.btnReject}
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

          {/* KELOLA ANGGOTA (ADMIN ONLY) */}
          {user.role === "admin" && (
            <div style={{ ...styles.panelCard, marginTop: "16px" }} className="card-matte">
              <div style={{ marginBottom: "14px" }}>
                <span className="heading-label">Manajemen Master</span>
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
    background: "#09090b",
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "16px"
  },
  loginCard: {
    padding: "28px",
    width: "100%",
    maxWidth: "360px"
  },
  logoWrapper: {
    textAlign: "center",
    marginBottom: "20px"
  },
  logoImg: {
    maxWidth: "130px",
    borderRadius: "8px",
    marginBottom: "10px"
  },
  badgeLabel: {
    fontSize: "10px",
    fontWeight: "700",
    letterSpacing: "1.5px",
    color: "#2563eb",
    textTransform: "uppercase"
  },
  label: {
    display: "block",
    fontSize: "11px",
    color: "#a1a1aa",
    marginBottom: "6px",
    fontWeight: "600"
  },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#18181b",
    border: "1px solid #27272a",
    color: "#f4f4f5",
    borderRadius: "8px",
    boxSizing: "border-box",
    outline: "none",
    fontSize: "13px"
  },
  btnLogin: {
    width: "100%",
    padding: "12px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px"
  },
  errorBox: {
    background: "#270f11",
    border: "1px solid #7f1d1d",
    color: "#fca5a5",
    padding: "8px 12px",
    borderRadius: "8px",
    fontSize: "11px",
    marginBottom: "16px"
  },
  dashboardContainer: {
    background: "#09090b",
    minHeight: "100vh",
    color: "#f4f4f5"
  },
  navbar: {
    background: "#121217",
    borderBottom: "1px solid #27272a",
    padding: "12px 20px",
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
    background: "#18181b",
    padding: "4px 10px",
    borderRadius: "8px",
    border: "1px solid #27272a"
  },
  roleAdmin: {
    background: "#2563eb",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
    fontSize: "9px",
    fontWeight: "800"
  },
  roleMember: {
    background: "#16a34a",
    color: "#fff",
    padding: "2px 6px",
    borderRadius: "4px",
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
    maxWidth: "1100px",
    margin: "20px auto",
    padding: "0 16px"
  },
  summaryCard: {
    padding: "24px",
    marginBottom: "16px"
  },
  summaryAmount: {
    margin: "4px 0 0 0",
    fontSize: "28px",
    color: "#22c55e",
    fontWeight: "800"
  },
  accessBadge: {
    color: "#a1a1aa",
    fontWeight: "600",
    fontSize: "11px"
  },
  gridContainer: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
    gap: "16px"
  },
  panelCard: {
    padding: "20px"
  },
  panelTitle: {
    margin: 0,
    fontSize: "15px",
    color: "#f4f4f5",
    fontWeight: "700"
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    fontSize: "12px",
    textAlign: "left"
  },
  tableHeaderRow: {
    borderBottom: "1px solid #27272a"
  },
  th: {
    padding: "10px 8px",
    color: "#71717a",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  tableRow: {
    borderBottom: "1px solid #18181b"
  },
  td: { padding: "12px 8px" },
  tdMuted: { padding: "12px 8px", color: "#a1a1aa", fontSize: "12px", whiteSpace: "nowrap" },
  tdWhite: { padding: "12px 8px", color: "#f4f4f5", fontWeight: "600" },
  tdGreen: { padding: "12px 8px", color: "#22c55e", fontWeight: "700", whiteSpace: "nowrap" },
  emptyTd: { padding: "24px", textAlign: "center", color: "#71717a", fontSize: "12px" },
  statusSuccess: {
    background: "rgba(34, 197, 94, 0.12)",
    color: "#22c55e",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  statusPending: {
    background: "rgba(234, 179, 8, 0.12)",
    color: "#eab308",
    padding: "4px 8px",
    borderRadius: "6px",
    fontSize: "10px",
    fontWeight: "700",
    whiteSpace: "nowrap"
  },
  btnProof: {
    background: "#7c3aed",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  btnAction: {
    background: "#2563eb",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  btnApprove: {
    background: "#16a34a",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  btnReject: {
    background: "#dc2626",
    color: "#fff",
    border: "none",
    padding: "5px 10px",
    borderRadius: "6px",
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer",
    whiteSpace: "nowrap"
  },
  crudForm: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: "10px",
    marginBottom: "16px"
  },
  btnAddMember: {
    background: "#16a34a",
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
    fontSize: "11px",
    fontWeight: "600",
    cursor: "pointer"
  }
};

export default App;