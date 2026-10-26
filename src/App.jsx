import React, { useState, useEffect } from "react";
import PemasukanForm from "./components/PemasukanForm";
import API from "./api";
// Import logo disesuaikan dengan ekstensi .jpeg
import logoImg from "./assets/logo.jpeg"; 

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");

  const [transaksi, setTransaksi] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [total, setTotal] = useState(0);

  const [namaAnggota, setNamaAnggota] = useState("");
  const [emailAnggota, setEmailAnggota] = useState("");
  const [passAnggota, setPassAnggota] = useState("");

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoginError("");

    try {
      const res = await API.post("/login", { email, password });
      if (res.data.status === "success") {
        setUser(res.data.user);
        localStorage.setItem("user", JSON.stringify(res.data.user));
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      setLoginError(err.response?.data?.message || "Login gagal! Periksa email dan password.");
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setEmail("");
    setPassword("");
    setLoginError("");
    setTransaksi([]);
    setAnggotaList([]);
  };

  const fetchTransaksi = async () => {
    try {
      const res = await API.get("/pemasukan");
      const data = res.data || [];
      setTransaksi(data);
      const sum = data.reduce((acc, curr) => acc + parseInt(curr.jumlah || 0), 0);
      setTotal(sum);
    } catch (err) {
      console.error("Gagal mengambil transaksi:", err);
    }
  };

  const fetchAnggota = async () => {
    try {
      const res = await API.get("/anggota");
      setAnggotaList(res.data || []);
    } catch (err) {
      console.error("Gagal mengambil data anggota:", err);
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
      await API.post("/anggota", {
        name: namaAnggota,
        email: emailAnggota,
        password: passAnggota,
      });
      alert("Anggota berhasil ditambahkan!");
      setNamaAnggota("");
      setEmailAnggota("");
      setPassAnggota("");
      fetchAnggota();
    } catch (err) {
      alert(err.response?.data?.message || "Gagal menambah anggota");
    }
  };

  const handleHapusAnggota = async (id) => {
    if (window.confirm("Yakin ingin menghapus anggota ini?")) {
      try {
        await API.delete(`/anggota/${id}`);
        fetchAnggota();
      } catch (err) {
        alert("Gagal menghapus anggota");
      }
    }
  };

  const handleDownloadBukti = (item) => {
    const printWindow = window.open("", "_blank");
    const htmlContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Bukti Transaksi - ${item.order_id}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background: #0b0c10; color: #333; padding: 40px; }
            .card { background: #ffffff; border-radius: 12px; max-width: 480px; margin: 0 auto; padding: 32px; box-shadow: 0 4px 20px rgba(0,0,0,0.15); border-top: 6px solid #e2e8f0; }
            .header { text-align: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 20px; margin-bottom: 20px; }
            .logo { font-size: 22px; font-weight: bold; color: #0f172a; letter-spacing: 1.5px; }
            .subtitle { font-size: 12px; color: #64748b; margin-top: 4px; }
            .item-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
            .label { color: #64748b; }
            .value { font-weight: 600; color: #0f172a; }
            .status-badge { background: #dcfce7; color: #166534; padding: 4px 10px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .total-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 16px; border-radius: 8px; margin-top: 20px; display: flex; justify-content: space-between; align-items: center; }
            .total-amount { font-size: 22px; font-weight: 700; color: #16a34a; }
            .btn-print { width: 100%; padding: 12px; background: #0f172a; color: #fff; border: none; border-radius: 8px; margin-top: 24px; font-size: 14px; font-weight: 600; cursor: pointer; }
            @media print { .btn-print { display: none; } body { background: #fff; padding: 0; } .card { box-shadow: none; border: 1px solid #ccc; } }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div class="logo">SOUTHERN BASE</div>
              <div class="subtitle">Struk Pembayaran Resmi (Midtrans Gateway)</div>
            </div>
            <div class="item-row">
              <span class="label">Order ID</span>
              <span class="value" style="font-family: monospace;">${item.order_id || 'TRX-MIDTRANS'}</span>
            </div>
            <div class="item-row">
              <span class="label">Tanggal Transaksi</span>
              <span class="value">${item.created_at ? new Date(item.created_at).toLocaleString("id-ID") : "-"}</span>
            </div>
            <div class="item-row">
              <span class="label">Keterangan / Pembayar</span>
              <span class="value">${item.keterangan}</span>
            </div>
            <div class="item-row">
              <span class="label">Status</span>
              <span class="status-badge">● LUNAS (SETTLEMENT)</span>
            </div>
            <div class="total-box">
              <span class="label" style="font-weight:600; color:#334155;">TOTAL BAYAR</span>
              <span class="total-amount">Rp ${parseInt(item.jumlah || 0).toLocaleString("id-ID")}</span>
            </div>
            <button class="btn-print" onclick="window.print()">📥 Unduh PDF / Cetak Struk</button>
          </div>
        </body>
      </html>
    `;
    printWindow.document.write(htmlContent);
    printWindow.document.close();
  };

  // TAMPILAN 1: FORM LOGIN
  if (!user) {
    return (
      <div style={{ background: "#08080a", minHeight: "100vh", display: "grid", placeItems: "center", color: "#fff", fontFamily: "'Inter', system-ui, sans-serif" }}>
        <form onSubmit={handleLogin} style={{ background: "#121318", padding: "36px", borderRadius: "16px", width: "360px", border: "1px solid #272a34", boxShadow: "0 20px 50px rgba(0,0,0,0.8)", textAlign: "center" }}>
          {/* Logo Southern Base */}
          <div style={{ marginBottom: "20px" }}>
            <img src={logoImg} alt="Southern Base Logo" style={{ maxWidth: "220px", height: "auto", display: "block", margin: "0 auto" }} />
          </div>

          {loginError && (
            <div style={{ background: "#2d1215", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "10px 12px", borderRadius: "8px", fontSize: "12px", marginBottom: "18px", textAlign: "left" }}>
              ⚠️ {loginError}
            </div>
          )}

          <div style={{ marginBottom: "16px", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>Email</label>
            <input
              type="email"
              placeholder="admin@kas.com / anggota@kas.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={{ width: "100%", padding: "12px", background: "#0a0b0e", border: "1px solid #272a34", color: "#fff", borderRadius: "8px", boxSizing: "border-box", outline: "none", fontSize: "14px" }}
            />
          </div>

          <div style={{ marginBottom: "24px", textAlign: "left" }}>
            <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px", fontWeight: "500" }}>Password</label>
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={{ width: "100%", padding: "12px", background: "#0a0b0e", border: "1px solid #272a34", color: "#fff", borderRadius: "8px", boxSizing: "border-box", outline: "none", fontSize: "14px" }}
            />
          </div>

          <button type="submit" style={{ width: "100%", padding: "12px", background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)", color: "#fff", border: "none", borderRadius: "8px", fontWeight: "600", cursor: "pointer", fontSize: "14px", boxShadow: "0 4px 14px rgba(37, 99, 235, 0.4)" }}>
            Masuk Sistem →
          </button>
        </form>
      </div>
    );
  }

  // TAMPILAN 2: DASHBOARD UTAMA
  return (
    <div style={{ background: "#08080a", minHeight: "100vh", color: "#e2e8f0", fontFamily: "'Inter', system-ui, sans-serif" }}>
      {/* Navbar Header */}
      <header style={{ background: "#111217", borderBottom: "1px solid #232631", padding: "14px 32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logoImg} alt="Southern Base" style={{ height: "36px", width: "auto" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <span style={{ fontSize: "13px", color: "#94a3b8" }}>
            User: <b style={{ color: "#fff" }}>{user.name}</b> (<span style={{ color: "#60a5fa" }}>{user.role.toUpperCase()}</span>)
          </span>
          <button onClick={handleLogout} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "8px 16px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
            Logout
          </button>
        </div>
      </header>

      <main style={{ maxWidth: "1150px", margin: "30px auto", padding: "0 20px" }}>
        {/* Ringkasan Kas */}
        <div style={{ background: "linear-gradient(135deg, #161822 0%, #0d0e14 100%)", border: "1px solid #272a34", borderRadius: "16px", padding: "28px", marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.5)" }}>
          <div>
            <p style={{ margin: "0 0 6px 0", fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", letterSpacing: "1px" }}>Total Kas Terkumpul</p>
            <h1 style={{ margin: 0, fontSize: "36px", color: "#4ade80", fontWeight: "800" }}>Rp {total.toLocaleString("id-ID")}</h1>
          </div>
          <div>
            <span style={{ background: "#14532d", color: "#4ade80", border: "1px solid #16a34a", padding: "8px 16px", borderRadius: "30px", fontSize: "12px", fontWeight: "600" }}>
              ● Modus Portal: {user.role === "admin" ? "Administrator Master" : "Anggota Read-Only"}
            </span>
          </div>
        </div>

        {/* Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: user.role === "anggota" ? "1fr 1.5fr" : "1fr", gap: "24px" }}>
          
          {/* Form Bayar Midtrans (Anggota) */}
          {user.role === "anggota" && (
            <div>
              <PemasukanForm onSuccess={fetchTransaksi} />
            </div>
          )}

          {/* Tabel Riwayat Transaksi */}
          <div style={{ background: "#121318", border: "1px solid #232631", borderRadius: "16px", padding: "24px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#fff", fontWeight: "700" }}>
              Riwayat Transaksi Masuk {user.role === "admin" && "& Bukti Midtrans"}
            </h3>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #232631", color: "#94a3b8" }}>
                    <th style={{ padding: "12px 10px" }}>TANGGAL</th>
                    <th style={{ padding: "12px 10px" }}>KETERANGAN</th>
                    <th style={{ padding: "12px 10px" }}>NOMINAL</th>
                    <th style={{ padding: "12px 10px" }}>ORDER ID</th>
                    <th style={{ padding: "12px 10px", textAlign: "right" }}>AKSI / BUKTI</th>
                  </tr>
                </thead>
                <tbody>
                  {transaksi.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ padding: "24px", textAlign: "center", color: "#64748b" }}>
                        Belum ada data transaksi
                      </td>
                    </tr>
                  ) : (
                    transaksi.map((item, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid #1c1e28" }}>
                        <td style={{ padding: "14px 10px", color: "#94a3b8" }}>
                          {item.created_at ? new Date(item.created_at).toLocaleDateString("id-ID") : "-"}
                        </td>
                        <td style={{ padding: "14px 10px", color: "#fff", fontWeight: "500" }}>{item.keterangan}</td>
                        <td style={{ padding: "14px 10px", color: "#4ade80", fontWeight: "700" }}>
                          +Rp {parseInt(item.jumlah || 0).toLocaleString("id-ID")}
                        </td>
                        <td style={{ padding: "14px 10px" }}>
                          <span style={{ background: "#182032", border: "1px solid #2563eb", color: "#60a5fa", padding: "4px 8px", borderRadius: "6px", fontFamily: "monospace", fontSize: "11px" }}>
                            📲 {item.order_id || "TRX-VERIFIED"}
                          </span>
                        </td>
                        <td style={{ padding: "14px 10px", textAlign: "right" }}>
                          <button
                            onClick={() => handleDownloadBukti(item)}
                            style={{
                              background: "#2563eb",
                              color: "#fff",
                              border: "none",
                              padding: "7px 14px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: "600",
                              cursor: "pointer"
                            }}
                          >
                            📥 Unduh Struk
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

        {/* Panel CRUD Kelola Anggota (Khusus Admin) */}
        {user.role === "admin" && (
          <div style={{ marginTop: "32px", background: "#121318", border: "1px solid #232631", borderRadius: "16px", padding: "28px", boxShadow: "0 8px 24px rgba(0,0,0,0.4)" }}>
            <h3 style={{ margin: "0 0 20px 0", fontSize: "18px", color: "#fff", fontWeight: "700" }}>Kelola Anggota Organisasi (CRUD)</h3>

            {/* Form Tambah Anggota */}
            <form onSubmit={handleTambahAnggota} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr auto", gap: "12px", marginBottom: "24px" }}>
              <input
                type="text"
                placeholder="Nama Lengkap"
                value={namaAnggota}
                onChange={(e) => setNamaAnggota(e.target.value)}
                required
                style={{ padding: "12px", background: "#0a0b0e", border: "1px solid #272a34", color: "#fff", borderRadius: "8px", outline: "none" }}
              />
              <input
                type="email"
                placeholder="Email Anggota"
                value={emailAnggota}
                onChange={(e) => setEmailAnggota(e.target.value)}
                required
                style={{ padding: "12px", background: "#0a0b0e", border: "1px solid #272a34", color: "#fff", borderRadius: "8px", outline: "none" }}
              />
              <input
                type="password"
                placeholder="Password"
                value={passAnggota}
                onChange={(e) => setPassAnggota(e.target.value)}
                required
                style={{ padding: "12px", background: "#0a0b0e", border: "1px solid #272a34", color: "#fff", borderRadius: "8px", outline: "none" }}
              />
              <button type="submit" style={{ background: "#16a34a", color: "#fff", border: "none", padding: "12px 24px", borderRadius: "8px", fontWeight: "600", cursor: "pointer" }}>
                + Tambah Anggota
              </button>
            </form>

            {/* Tabel Daftar Anggota */}
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", textAlign: "left" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #232631", color: "#94a3b8" }}>
                    <th style={{ padding: "12px 10px" }}>ID</th>
                    <th style={{ padding: "12px 10px" }}>NAMA</th>
                    <th style={{ padding: "12px 10px" }}>EMAIL</th>
                    <th style={{ padding: "12px 10px", textAlign: "right" }}>AKSI</th>
                  </tr>
                </thead>
                <tbody>
                  {anggotaList.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ padding: "20px", textAlign: "center", color: "#64748b" }}>
                        Belum ada data anggota
                      </td>
                    </tr>
                  ) : (
                    anggotaList.map((item) => (
                      <tr key={item.id} style={{ borderBottom: "1px solid #1c1e28" }}>
                        <td style={{ padding: "14px 10px", color: "#64748b" }}>#{item.id}</td>
                        <td style={{ padding: "14px 10px", color: "#fff", fontWeight: "600" }}>{item.name}</td>
                        <td style={{ padding: "14px 10px", color: "#cbd5e1" }}>{item.email}</td>
                        <td style={{ padding: "14px 10px", textAlign: "right" }}>
                          <button onClick={() => handleHapusAnggota(item.id)} style={{ background: "#dc2626", color: "#fff", border: "none", padding: "7px 14px", borderRadius: "6px", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}>
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

export default App;