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
  const [selectedProof, setSelectedProof] = useState(null);

  // Form Pengaturan Profil Pribadi (Anggota & Admin)
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");

  // Edit Kredensial Anggota Oleh Admin
  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editPass, setEditPass] = useState("");

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
        throw new Error("Email atau password salah / tidak terdaftar!");
      }

      const userData = data[0];
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setNewUsername(userData.name);
    } catch (err) {
      setLoginError(err.message || "Gagal masuk ke portal.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    setUser(null);
    setEmail("");
    setPassword("");
    setTransaksi([]);
  };

  const fetchTransaksi = async () => {
    try {
      let query = supabase.from("transactions").select("*").order("id", { ascending: false });

      // Jika role ANGGOTA, filter transaksi hanya milik pengguna tersebut
      if (user && user.role !== "admin") {
        query = query.ilike("payer_name", `%${user.name}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      setTransaksi(data || []);
    } catch (err) {
      console.error("Gagal mengambil data transaksi:", err.message);
    }
  };

  const fetchAnggota = async () => {
    if (user?.role === "admin") {
      try {
        const { data, error } = await supabase.from("users").select("*").order("id", { ascending: true });
        if (error) throw error;
        setAnggotaList(data || []);
      } catch (err) {
        console.error("Gagal mengambil data anggota:", err.message);
      }
    }
  };

  useEffect(() => {
    if (user) {
      setNewUsername(user.name);
      fetchTransaksi();
      fetchAnggota();
    }
  }, [user]);

  // Update profil pribadi (Username/Password)
  const handleUpdateProfilePribadi = async (e) => {
    e.preventDefault();
    setProfileMsg("");

    try {
      const updates = { name: newUsername };
      if (newPassword.trim() !== "") {
        updates.password = newPassword.trim();
      }

      const { error } = await supabase.from("users").update(updates).eq("id", user.id);
      if (error) throw error;

      const updatedUser = { ...user, name: newUsername, ...(newPassword && { password: newPassword }) };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNewPassword("");
      setProfileMsg("✅ Profil & kata sandi berhasil diperbarui!");
      fetchTransaksi();
    } catch (err) {
      setProfileMsg("❌ Gagal memperbarui profil: " + err.message);
    }
  };

  // Admin memperbarui Username & Password Anggota lain
  const handleSaveEditAnggota = async (userId) => {
    try {
      const payload = { name: editName };
      if (editPass.trim() !== "") payload.password = editPass.trim();

      const { error } = await supabase.from("users").update(payload).eq("id", userId);
      if (error) throw error;

      alert("Kredensial anggota berhasil diperbarui!");
      setEditingUserId(null);
      fetchAnggota();
    } catch (err) {
      alert("Gagal memperbarui anggota: " + err.message);
    }
  };

  const handleVerifikasi = async (id) => {
    try {
      const { error } = await supabase.from("transactions").update({ status: "settlement" }).eq("id", id);
      if (error) throw error;
      fetchTransaksi();
    } catch (err) {
      alert("Gagal memverifikasi: " + err.message);
    }
  };

  const handleTolak = async (id) => {
    if (window.confirm("Tolak dan hapus transaksi ini?")) {
      try {
        const { error } = await supabase.from("transactions").delete().eq("id", id);
        if (error) throw error;
        fetchTransaksi();
      } catch (err) {
        alert("Gagal menolak transaksi: " + err.message);
      }
    }
  };

  // Kalkulasi Total Kas
  const totalVerified = transaksi
    .filter((t) => t.status === "settlement" || t.status === "lunas")
    .reduce((acc, c) => acc + parseInt(c.amount || c.jumlah || 0), 0);

  // Rekap Kas Per Anggota (Khusus Admin)
  const rekapPerPembayar = transaksi
    .filter((item) => item.status === "settlement" || item.status === "lunas")
    .reduce((acc, curr) => {
      let rawName = curr.payer_name || curr.keterangan || "Anonim";
      let cleanName = rawName.split("-")[0].trim();
      acc[cleanName] = (acc[cleanName] || 0) + parseInt(curr.amount || curr.jumlah || 0);
      return acc;
    }, {});

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <Background3D role="anggota" />
        <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <img src={logoImg} alt="Southern Base" style={{ width: "110px", borderRadius: "10px" }} />
            <div style={{ fontSize: "11px", fontWeight: "800", color: "#3b82f6", marginTop: "8px" }}>
              SOUTHERN BASE PORTAL
            </div>
          </div>

          {loginError && <div style={styles.errorBox}>⚠️ {loginError}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "14px" }}>
              <label style={styles.label}>Email Address</label>
              <input
                type="email"
                placeholder="nama@kas.com"
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
                  style={styles.btnEye}
                >
                  {showPassword ? "👁️" : "🙈"}
                </button>
              </div>
            </div>

            <button type="submit" style={styles.btnLogin} disabled={loadingLogin}>
              {loadingLogin ? "Memverifikasi..." : "Masuk Portal →"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const isAdmin = user.role === "admin";

  return (
    <div style={{ minHeight: "100vh", position: "relative", color: "#f4f4f5" }}>
      <Background3D role={user.role} />

      {/* POPUP PREVIEW BUKTI SCREENSHOT */}
      {selectedProof && (
        <div onClick={() => setSelectedProof(null)} style={styles.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={styles.modalContent}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#f4f4f5" }}>
              🖼️ Bukti Transfer Screenshot
            </h4>
            <img src={selectedProof} alt="Bukti Transfer" style={styles.proofImg} />
            <button onClick={() => setSelectedProof(null)} style={styles.btnCloseModal}>
              Tutup Preview
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={{ ...styles.navbar, background: isAdmin ? "#0f172a" : "#064e3b" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <img src={logoImg} alt="Logo" style={{ height: "26px", borderRadius: "6px" }} />
            <span style={{ fontWeight: "800", fontSize: "13px", letterSpacing: "1px" }}>
              SOUTHERN BASE {isAdmin ? "ADMIN CONTROL" : "PORTAL ANGGOTA"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={styles.userBadge}>
              <span style={{ fontSize: "12px" }}>👤 <b>{user.name}</b></span>
              <span style={isAdmin ? styles.badgeAdmin : styles.badgeMember}>
                {user.role ? user.role.toUpperCase() : "MEMBER"}
              </span>
            </div>
            <button onClick={handleLogout} style={styles.btnLogout}>Logout</button>
          </div>
        </header>

        <main style={{ maxWidth: "1100px", margin: "20px auto", padding: "0 16px" }}>
          {/* TOTAL KAS & PENGATURAN PROFIL */}
          <div style={styles.heroGrid}>
            <div style={{ ...styles.card, background: isAdmin ? "rgba(15, 23, 42, 0.85)" : "rgba(6, 78, 59, 0.85)" }}>
              <span style={styles.cardHeaderLabel}>
                {isAdmin ? "TOTAL KAS ORGANISASI (VERIFIKASI)" : "KAS SAYA TERBAYAR"}
              </span>
              <h1 style={{ fontSize: "32px", color: "#22c55e", margin: "8px 0" }}>
                Rp {totalVerified.toLocaleString("id-ID")}
              </h1>
              <p style={{ fontSize: "11px", color: "#9ca3af", margin: 0 }}>
                {isAdmin
                  ? "Akses kontrol penuh administrator master"
                  : "Menampilkan akumulasi data pembayaran kas milik pribadi Anda"}
              </p>
            </div>

            {/* FORM UBAH USERNAME & PASSWORD PRIBADI */}
            <div style={styles.card}>
              <span style={styles.cardHeaderLabel}>PENGATURAN KREDENSIAL AKUN</span>
              <form onSubmit={handleUpdateProfilePribadi} style={{ marginTop: "10px" }}>
                {profileMsg && <div style={{ fontSize: "11px", marginBottom: "8px" }}>{profileMsg}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Username Baru"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    style={styles.inputSm}
                  />
                  <input
                    type="password"
                    placeholder="Password Baru (Opsional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={styles.inputSm}
                  />
                </div>
                <button type="submit" style={styles.btnSaveSm}>Update Akun Saya</button>
              </form>
            </div>
          </div>

          {/* TAMPILAN KHUSUS ANGGOTA */}
          {!isAdmin && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "16px" }}>
              {/* FORM INPUT PEMBAYARAN KAS */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📥 Input Pemasukan Kas DANA</h3>
                <InputForm onSuccess={fetchTransaksi} />
              </div>

              {/* RIWAYAT TRANSAKSI ANGGOTA */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>📜 Riwayat Pembayaran Saya</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>TANGGAL</th>
                        <th style={styles.th}>NOMINAL</th>
                        <th style={styles.th}>STATUS</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>AKSI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transaksi.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={styles.tdEmpty}>Belum ada riwayat transaksi.</td>
                        </tr>
                      ) : (
                        transaksi.map((item) => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.tdMuted}>{item.transaction_date || "-"}</td>
                            <td style={styles.tdGreen}>+Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}</td>
                            <td style={styles.td}>
                              <span style={item.status === "settlement" ? styles.badgeSuccess : styles.badgePending}>
                                {item.status === "settlement" ? "Disetujui" : "Pending"}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {item.description && item.description.startsWith("data:image") && (
                                <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof}>
                                  🖼️ Bukti
                                </button>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* TAMPILAN KHUSUS ADMIN */}
          {isAdmin && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
              {/* PANTAU REKAP DAN DUKUNGAN VERIFIKASI */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
                {/* REKAP KAS PER ANGGOTA */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>📊 Rekap Total Kas Per Anggota</h3>
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>NAMA</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>TOTAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {Object.entries(rekapPerPembayar).map(([nama, total], idx) => (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.tdWhite}>👤 {nama}</td>
                            <td style={{ ...styles.tdGreen, textAlign: "right" }}>
                              Rp {total.toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* VERIFIKASI TRANSAKSI MASUK ANGGOTA */}
                <div style={styles.card}>
                  <h3 style={styles.cardTitle}>⚡ Verifikasi & Riwayat Kas Masuk All Anggota</h3>
                  <div style={{ maxHeight: "280px", overflowY: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>PEMBAYAR</th>
                          <th style={styles.th}>NOMINAL</th>
                          <th style={styles.th}>STATUS</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>KONTROL ADMIN</th>
                        </tr>
                      </thead>
                      <tbody>
                        {transaksi.map((item) => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.tdWhite}>{item.payer_name}</td>
                            <td style={styles.tdGreen}>Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}</td>
                            <td style={styles.td}>
                              <span style={item.status === "settlement" ? styles.badgeSuccess : styles.badgePending}>
                                {item.status === "settlement" ? "Disetujui" : "Pending"}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                                {item.description && item.description.startsWith("data:image") && (
                                  <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof}>
                                    🖼️ Bukti
                                  </button>
                                )}
                                {item.status === "pending" && (
                                  <>
                                    <button onClick={() => handleVerifikasi(item.id)} style={styles.btnApprove}>
                                      ✔
                                    </button>
                                    <button onClick={() => handleTolak(item.id)} style={styles.btnReject}>
                                      ✖
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* KELOLA USERNAME & PASSWORD ANGGOTA OLEH ADMIN */}
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>🔑 Kelola Username & Password Seluruh Anggota</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>NAMA LENGKAP</th>
                        <th style={styles.th}>EMAIL LOGIN</th>
                        <th style={styles.th}>PASSWORD SAAT INI</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>AKSI ADMIN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {anggotaList.map((m) => (
                        <tr key={m.id} style={styles.tr}>
                          <td style={styles.tdMuted}>#{m.id}</td>
                          <td style={styles.tdWhite}>
                            {editingUserId === m.id ? (
                              <input
                                type="text"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                style={styles.inputSm}
                              />
                            ) : (
                              m.name
                            )}
                          </td>
                          <td style={styles.tdMuted}>{m.email}</td>
                          <td style={styles.tdWhite}>
                            {editingUserId === m.id ? (
                              <input
                                type="text"
                                placeholder="Sandi Baru"
                                value={editPass}
                                onChange={(e) => setEditPass(e.target.value)}
                                style={styles.inputSm}
                              />
                            ) : (
                              <span style={{ fontFamily: "monospace" }}>{m.password}</span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {editingUserId === m.id ? (
                              <button onClick={() => handleSaveEditAnggota(m.id)} style={styles.btnSaveSm}>
                                Simpan
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditingUserId(m.id);
                                  setEditName(m.name);
                                  setEditPass(m.password);
                                }}
                                style={styles.btnEdit}
                              >
                                ✏️ Edit Akun
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
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
    minHeight: "100vh",
    display: "grid",
    placeItems: "center",
    padding: "16px",
    background: "#09090b",
  },
  loginCard: {
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "340px",
  },
  label: { display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "600" },
  input: {
    width: "100%",
    padding: "10px",
    background: "#09090b",
    border: "1px solid #27272a",
    color: "#f4f4f5",
    borderRadius: "8px",
    boxSizing: "border-box",
    fontSize: "13px",
  },
  inputSm: {
    padding: "6px 8px",
    background: "#09090b",
    border: "1px solid #27272a",
    color: "#f4f4f5",
    borderRadius: "6px",
    fontSize: "12px",
    width: "100%",
    boxSizing: "border-box",
  },
  btnEye: { position: "absolute", right: "8px", background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" },
  btnLogin: {
    width: "100%",
    padding: "10px",
    background: "#2563eb",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    fontWeight: "700",
    cursor: "pointer",
  },
  errorBox: { background: "#3f1315", border: "1px solid #991b1b", color: "#fca5a5", padding: "8px", borderRadius: "6px", fontSize: "11px", marginBottom: "12px" },
  navbar: { padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center" },
  userBadge: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(0,0,0,0.2)", padding: "4px 8px", borderRadius: "6px" },
  badgeAdmin: { background: "#2563eb", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800" },
  badgeMember: { background: "#16a34a", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800" },
  btnLogout: { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
  heroGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" },
  card: { background: "rgba(24, 24, 27, 0.85)", border: "1px solid #27272a", borderRadius: "12px", padding: "18px", backdropFilter: "blur(8px)" },
  cardHeaderLabel: { fontSize: "10px", fontWeight: "800", color: "#9ca3af", letterSpacing: "1px" },
  cardTitle: { fontSize: "14px", fontWeight: "700", marginTop: 0, marginBottom: "12px", color: "#f4f4f5" },
  btnSaveSm: { background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", marginTop: "8px", width: "100%" },
  btnEdit: { background: "#2563eb", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: { textAlign: "left", padding: "8px", color: "#a1a1aa", fontSize: "10px", borderBottom: "1px solid #27272a" },
  tr: { borderBottom: "1px solid #18181b" },
  td: { padding: "8px" },
  tdMuted: { padding: "8px", color: "#a1a1aa" },
  tdWhite: { padding: "8px", color: "#f4f4f5", fontWeight: "600" },
  tdGreen: { padding: "8px", color: "#22c55e", fontWeight: "700" },
  tdEmpty: { padding: "16px", textAlign: "center", color: "#a1a1aa" },
  badgeSuccess: { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
  badgePending: { background: "rgba(234, 179, 8, 0.15)", color: "#eab308", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
  btnProof: { background: "#7c3aed", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnApprove: { background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnReject: { background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modalContent: { background: "#18181b", border: "1px solid #27272a", borderRadius: "12px", padding: "16px", maxWidth: "450px", width: "100%", textAlign: "center" },
  proofImg: { width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "8px", border: "1px solid #27272a" },
  btnCloseModal: { marginTop: "12px", background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
};

export default App;