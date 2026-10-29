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
  const [kasKeluar, setKasKeluar] = useState([]);
  const [anggotaList, setAnggotaList] = useState([]);
  const [selectedProof, setSelectedProof] = useState(null);

  // Form Kas Keluar (Admin)
  const [outKeterangan, setOutKeterangan] = useState("");
  const [outAmount, setOutAmount] = useState("");
  const [outDate, setOutDate] = useState("");

  // Filter khusus Admin
  const [filterDate, setFilterDate] = useState("");
  const [filterMemberName, setFilterMemberName] = useState("");

  // Form Profil Pribadi
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState("");

  // CRUD Anggota (Admin)
  const [addName, setAddName] = useState("");
  const [addEmail, setAddEmail] = useState("");
  const [addPass, setAddPass] = useState("");
  const [addRole, setAddRole] = useState("anggota");

  const [editingUserId, setEditingUserId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPass, setEditPass] = useState("");
  const [editRole, setEditRole] = useState("anggota");

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
        throw new Error("Email atau password tidak terdaftar / salah.");
      }

      const userData = data[0];
      localStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setNewUsername(userData.name);
    } catch (err) {
      setLoginError(err.message || "Gagal masuk ke sistem.");
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
    setKasKeluar([]);
  };

  const fetchTransaksi = async () => {
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*")
        .order("id", { ascending: false });

      if (error) throw error;
      setTransaksi(data || []);
    } catch (err) {
      console.error("Gagal mengambil data transaksi:", err.message);
    }
  };

  const fetchKasKeluar = async () => {
    try {
      const { data, error } = await supabase
        .from("expenses")
        .select("*")
        .order("id", { ascending: false });

      if (!error && data) setKasKeluar(data);
    } catch (err) {
      console.error("Gagal mengambil data kas keluar:", err.message);
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
      setNewUsername(user.name);
      fetchTransaksi();
      fetchKasKeluar();
      if (user.role === "admin") {
        fetchAnggota();
      }
    }
  }, [user]);

  const handleUpdateProfilePribadi = async (e) => {
    e.preventDefault();
    setProfileMsg("");

    try {
      const updates = { name: newUsername };
      if (newPassword.trim() !== "") {
        updates.password = newPassword.trim();
      }

      const { error } = await supabase
        .from("users")
        .update(updates)
        .eq("id", user.id);

      if (error) throw error;

      const updatedUser = {
        ...user,
        name: newUsername,
        ...(newPassword && { password: newPassword }),
      };
      setUser(updatedUser);
      localStorage.setItem("user", JSON.stringify(updatedUser));
      setNewPassword("");
      setProfileMsg("✅ Kredensial berhasil diperbarui.");
      fetchTransaksi();
    } catch (err) {
      setProfileMsg("❌ Perubahan gagal: " + err.message);
    }
  };

  // Tambah Kas Keluar (Admin)
  const handleTambahKasKeluar = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("expenses").insert([
        {
          title: outKeterangan.trim(),
          amount: parseInt(outAmount),
          expense_date: outDate || new Date().toISOString().split("T")[0],
        },
      ]);

      if (error) throw error;

      alert("Pengeluaran kas berhasil dicatat!");
      setOutKeterangan("");
      setOutAmount("");
      setOutDate("");
      fetchKasKeluar();
    } catch (err) {
      alert("Gagal mencatat pengeluaran: " + err.message);
    }
  };

  // CRUD Anggota
  const handleTambahAnggota = async (e) => {
    e.preventDefault();
    try {
      const { error } = await supabase.from("users").insert([
        {
          name: addName.trim(),
          email: addEmail.trim().toLowerCase(),
          password: addPass.trim(),
          role: addRole,
        },
      ]);

      if (error) throw error;

      alert(`Pengguna ${addName} berhasil ditambahkan!`);
      setAddName("");
      setAddEmail("");
      setAddPass("");
      setAddRole("anggota");
      fetchAnggota();
    } catch (err) {
      alert("Gagal menambahkan pengguna: " + err.message);
    }
  };

  const handleSaveEditAnggota = async (userId) => {
    try {
      const payload = {
        name: editName.trim(),
        email: editEmail.trim().toLowerCase(),
        role: editRole,
      };
      if (editPass.trim() !== "") payload.password = editPass.trim();

      const { error } = await supabase
        .from("users")
        .update(payload)
        .eq("id", userId);

      if (error) throw error;

      alert("Data pengguna diperbarui!");
      setEditingUserId(null);
      fetchAnggota();
    } catch (err) {
      alert("Gagal memperbarui data pengguna: " + err.message);
    }
  };

  const handleHapusAnggota = async (userId, userName) => {
    if (window.confirm(`Yakin ingin menghapus "${userName}"?`)) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", userId);
        if (error) throw error;

        alert(`Pengguna "${userName}" dihapus.`);
        fetchAnggota();
      } catch (err) {
        alert("Gagal menghapus pengguna: " + err.message);
      }
    }
  };

  // Verifikasi Transaksi
  const handleVerifikasi = async (id) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "settlement", rejection_reason: null })
        .eq("id", id);

      if (error) throw error;
      fetchTransaksi();
    } catch (err) {
      alert("Gagal memverifikasi transaksi: " + err.message);
    }
  };

  // Tolak Transaksi dengan Catatan Alasan
  const handleTolak = async (id) => {
    const reason = window.prompt("Masukkan alasan penolakan pembayaran:");
    if (reason !== null) {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ status: "ditolak", rejection_reason: reason.trim() || "Tidak sesuai ketentuan." })
          .eq("id", id);

        if (error) throw error;
        fetchTransaksi();
      } catch (err) {
        alert("Gagal menolak transaksi: " + err.message);
      }
    }
  };

  const isAdmin = user?.role === "admin";

  const myTransaksi = transaksi.filter((item) => {
    const payer = (item.payer_name || item.keterangan || "").toLowerCase();
    return payer.includes((user?.name || "").toLowerCase());
  });

  // Kalkulasi Keuangan
  const totalIn = transaksi
    .filter((t) => t.status === "settlement" || t.status === "lunas")
    .reduce((acc, c) => acc + parseInt(c.amount || c.jumlah || 0), 0);

  const totalOut = kasKeluar.reduce((acc, c) => acc + parseInt(c.amount || 0), 0);

  const totalVerifiedUser = myTransaksi
    .filter((t) => t.status === "settlement" || t.status === "lunas")
    .reduce((acc, c) => acc + parseInt(c.amount || c.jumlah || 0), 0);

  const saldoBersih = totalIn - totalOut;

  const rekapPerPembayar = transaksi
    .filter((item) => item.status === "settlement" || item.status === "lunas")
    .reduce((acc, curr) => {
      let rawName = curr.payer_name || curr.keterangan || "Anonim";
      let cleanName = rawName.split("-")[0].trim();
      if (!cleanName) cleanName = "Anonim";
      acc[cleanName] = (acc[cleanName] || 0) + parseInt(curr.amount || curr.jumlah || 0);
      return acc;
    }, {});

  const filteredTransaksiAdmin = transaksi.filter((item) => {
    const matchesDate = filterDate ? item.transaction_date === filterDate : true;
    const matchesName = filterMemberName
      ? (item.payer_name || "").toLowerCase().includes(filterMemberName.toLowerCase())
      : true;
    return matchesDate && matchesName;
  });

  const handlePrintReport = () => {
    window.print();
  };

  if (!user) {
    return (
      <div style={styles.loginContainer}>
        <Background3D role="anggota" />
        <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }}>
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <img src={logoImg} alt="Southern Base" style={{ width: "96px", borderRadius: "8px" }} />
            <h2 style={{ fontSize: "16px", fontWeight: "700", color: "#f4f4f5", margin: "12px 0 2px 0" }}>
              SOUTHERN BASE
            </h2>
            <p style={{ fontSize: "11px", color: "#71717a", margin: 0 }}>Portal Manajemen Kas Organisasi</p>
          </div>

          {loginError && <div style={styles.errorBox}>⚠️ {loginError}</div>}

          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: "14px" }}>
              <label style={styles.label}>Email</label>
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
              <label style={styles.label}>Kata Sandi</label>
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
              {loadingLogin ? "Memproses..." : "Masuk"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", position: "relative", color: "#f4f4f5" }}>
      <Background3D role={user.role} />

      {selectedProof && (
        <div onClick={() => setSelectedProof(null)} style={styles.modalOverlay}>
          <div onClick={(e) => e.stopPropagation()} style={styles.modalContent}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#f4f4f5" }}>
              Bukti Transfer
            </h4>
            <img src={selectedProof} alt="Bukti Transfer" style={styles.proofImg} />
            <button onClick={() => setSelectedProof(null)} style={styles.btnCloseModal}>
              Tutup
            </button>
          </div>
        </div>
      )}

      <div style={{ position: "relative", zIndex: 1 }}>
        <header style={{ ...styles.navbar, borderBottom: isAdmin ? "1px solid #1e3a8a" : "1px solid #14532d" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <img src={logoImg} alt="Logo" style={{ height: "24px", borderRadius: "4px" }} />
            <span style={{ fontWeight: "700", fontSize: "13px", color: "#f4f4f5", letterSpacing: "0.5px" }}>
              SOUTHERN BASE {isAdmin ? "• MASTER CONTROL SYSTEM" : "• MEMBER PORTAL"}
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            {isAdmin && (
              <button onClick={handlePrintReport} style={styles.btnPrint}>
                🖨️ Cetak Laporan
              </button>
            )}
            <div style={styles.userBadge}>
              <span style={{ fontSize: "12px", color: "#e4e4e7" }}>{user.name}</span>
              <span style={isAdmin ? styles.badgeAdmin : styles.badgeMember}>
                {user.role ? user.role.toUpperCase() : "MEMBER"}
              </span>
            </div>
            <button onClick={handleLogout} style={styles.btnLogout}>Keluar</button>
          </div>
        </header>

        <main style={{ maxWidth: "1100px", margin: "24px auto", padding: "0 16px" }}>
          {/* HERO STATISTIK SPREAD */}
          <div style={styles.heroGrid}>
            <div style={{ ...styles.card, borderLeft: isAdmin ? "4px solid #3b82f6" : "4px solid #22c55e" }}>
              <span style={styles.cardHeaderLabel}>
                {isAdmin ? "SALDO KAS BERSIH ORGANISASI" : "KAS TERBAYAR SAYA"}
              </span>
              <h1 style={{ fontSize: "28px", color: "#22c55e", margin: "6px 0", fontWeight: "800" }}>
                Rp {(isAdmin ? saldoBersih : totalVerifiedUser).toLocaleString("id-ID")}
              </h1>
              {isAdmin && (
                <div style={{ display: "flex", gap: "12px", fontSize: "11px", marginTop: "4px" }}>
                  <span style={{ color: "#a1a1aa" }}>Masuk: <b style={{ color: "#22c55e" }}>+Rp {totalIn.toLocaleString("id-ID")}</b></span>
                  <span style={{ color: "#a1a1aa" }}>Keluar: <b style={{ color: "#ef4444" }}>-Rp {totalOut.toLocaleString("id-ID")}</b></span>
                </div>
              )}
            </div>

            <div style={styles.card}>
              <span style={styles.cardHeaderLabel}>PENGATURAN AKUN SAYA</span>
              <form onSubmit={handleUpdateProfilePribadi} style={{ marginTop: "10px" }}>
                {profileMsg && <div style={{ fontSize: "11px", marginBottom: "8px" }}>{profileMsg}</div>}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    style={styles.inputSm}
                  />
                  <input
                    type="password"
                    placeholder="Sandi Baru (Opsional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    style={styles.inputSm}
                  />
                </div>
                <button type="submit" style={styles.btnSaveSm}>Simpan Perubahan</button>
              </form>
            </div>
          </div>

          {/* PENGINGAT STATUS KAS (ANGGOTA) */}
          {!isAdmin && (
            <div style={{ ...styles.card, marginTop: "16px", borderLeft: "4px solid #eab308", background: "rgba(234, 179, 8, 0.05)" }}>
              <h4 style={{ margin: "0 0 4px 0", fontSize: "13px", color: "#eab308" }}>📌 Status Kas Anggota</h4>
              <p style={{ fontSize: "12px", color: "#a1a1aa", margin: 0 }}>
                Pastikan Anda membayar kas bulanan tepat waktu. Unggah bukti pembayaran melalui form di bawah ini.
              </p>
            </div>
          )}

          {/* === TAMPILAN KHUSUS ANGGOTA === */}
          {!isAdmin && (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "16px" }}>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Input Pembayaran Kas</h3>
                <InputForm onSuccess={fetchTransaksi} />
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>Riwayat Transaksi Saya</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>TANGGAL</th>
                        <th style={styles.th}>NOMINAL</th>
                        <th style={styles.th}>STATUS</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>BUKTI / CATATAN</th>
                      </tr>
                    </thead>
                    <tbody>
                      {myTransaksi.length === 0 ? (
                        <tr>
                          <td colSpan="4" style={styles.tdEmpty}>Belum ada riwayat transaksi atas nama Anda.</td>
                        </tr>
                      ) : (
                        myTransaksi.map((item) => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.tdMuted}>{item.transaction_date || "-"}</td>
                            <td style={styles.tdGreen}>+Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}</td>
                            <td style={styles.td}>
                              <span style={
                                item.status === "settlement" || item.status === "lunas"
                                  ? styles.badgeSuccess
                                  : item.status === "ditolak"
                                  ? styles.badgeDanger
                                  : styles.badgePending
                              }>
                                {item.status === "settlement" || item.status === "lunas"
                                  ? "Disetujui"
                                  : item.status === "ditolak"
                                  ? "Ditolak"
                                  : "Pending"}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                                {item.description && item.description.startsWith("data:image") && (
                                  <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof}>
                                    Lihat Bukti
                                  </button>
                                )}
                                {item.rejection_reason && (
                                  <span style={{ fontSize: "10px", color: "#fca5a5" }}>
                                    ⚠️ {item.rejection_reason}
                                  </span>
                                )}
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
          )}

          {/* === TAMPILAN KHUSUS ADMIN MASTER === */}
          {isAdmin && (
            <>
              {/* MASTER CRUD ANGGOTA */}
              <div style={{ ...styles.card, marginTop: "16px", border: "1px solid #1e3a8a" }}>
                <h3 style={styles.cardTitle}>👥 Master Data Anggota Organisasi (CRUD)</h3>

                <form onSubmit={handleTambahAnggota} style={{ marginBottom: "16px", background: "#09090b", padding: "12px", borderRadius: "8px", border: "1px solid #27272a" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#3b82f6", display: "block", marginBottom: "8px" }}>
                    + Tambah Pengguna Baru
                  </span>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Nama Lengkap"
                      value={addName}
                      onChange={(e) => setAddName(e.target.value)}
                      required
                      style={styles.inputSm}
                    />
                    <input
                      type="email"
                      placeholder="Email Login"
                      value={addEmail}
                      onChange={(e) => setAddEmail(e.target.value)}
                      required
                      style={styles.inputSm}
                    />
                    <input
                      type="password"
                      placeholder="Password"
                      value={addPass}
                      onChange={(e) => setAddPass(e.target.value)}
                      required
                      style={styles.inputSm}
                    />
                    <select
                      value={addRole}
                      onChange={(e) => setAddRole(e.target.value)}
                      style={{ ...styles.inputSm, background: "#18181b" }}
                    >
                      <option value="anggota">Anggota</option>
                      <option value="admin">Admin</option>
                    </select>
                    <button type="submit" style={{ ...styles.btnSaveSm, marginTop: 0 }}>
                      + Tambah User
                    </button>
                  </div>
                </form>

                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>ID</th>
                        <th style={styles.th}>NAMA LENGKAP</th>
                        <th style={styles.th}>EMAIL</th>
                        <th style={styles.th}>KATA SANDI</th>
                        <th style={styles.th}>ROLE</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>AKSI MASTER</th>
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
                          <td style={styles.tdMuted}>
                            {editingUserId === m.id ? (
                              <input
                                type="email"
                                value={editEmail}
                                onChange={(e) => setEditEmail(e.target.value)}
                                style={styles.inputSm}
                              />
                            ) : (
                              m.email
                            )}
                          </td>
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
                          <td style={styles.td}>
                            {editingUserId === m.id ? (
                              <select
                                value={editRole}
                                onChange={(e) => setEditRole(e.target.value)}
                                style={styles.inputSm}
                              >
                                <option value="anggota">anggota</option>
                                <option value="admin">admin</option>
                              </select>
                            ) : (
                              <span style={m.role === "admin" ? styles.badgeAdmin : styles.badgeMember}>
                                {m.role ? m.role.toUpperCase() : "ANGGOTA"}
                              </span>
                            )}
                          </td>
                          <td style={{ ...styles.td, textAlign: "right" }}>
                            {editingUserId === m.id ? (
                              <button onClick={() => handleSaveEditAnggota(m.id)} style={styles.btnSaveSm}>
                                Simpan
                              </button>
                            ) : (
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                <button
                                  onClick={() => {
                                    setEditingUserId(m.id);
                                    setEditName(m.name);
                                    setEditEmail(m.email);
                                    setEditPass(m.password);
                                    setEditRole(m.role || "anggota");
                                  }}
                                  style={styles.btnEdit}
                                >
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleHapusAnggota(m.id, m.name)}
                                  style={styles.btnReject}
                                >
                                  Hapus
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* MODUL KAS KELUAR (PENGELUARAN) */}
              <div style={{ ...styles.card, marginTop: "16px", border: "1px solid #991b1b" }}>
                <h3 style={styles.cardTitle}>💸 Pencatatan Pengeluaran Kas (Kas Keluar)</h3>

                <form onSubmit={handleTambahKasKeluar} style={{ marginBottom: "16px", background: "#09090b", padding: "12px", borderRadius: "8px", border: "1px solid #27272a" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Keterangan Pengeluaran"
                      value={outKeterangan}
                      onChange={(e) => setOutKeterangan(e.target.value)}
                      required
                      style={styles.inputSm}
                    />
                    <input
                      type="number"
                      placeholder="Nominal (Rp)"
                      value={outAmount}
                      onChange={(e) => setOutAmount(e.target.value)}
                      required
                      style={styles.inputSm}
                    />
                    <input
                      type="date"
                      value={outDate}
                      onChange={(e) => setOutDate(e.target.value)}
                      style={{ ...styles.inputSm, colorScheme: "dark" }}
                    />
                    <button type="submit" style={{ ...styles.btnReject, width: "100%", padding: "6px" }}>
                      - Catat Pengeluaran
                    </button>
                  </div>
                </form>

                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>TANGGAL</th>
                        <th style={styles.th}>KETERANGAN</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>NOMINAL KELUAR</th>
                      </tr>
                    </thead>
                    <tbody>
                      {kasKeluar.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={styles.tdEmpty}>Belum ada riwayat pengeluaran kas.</td>
                        </tr>
                      ) : (
                        kasKeluar.map((item) => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.tdMuted}>{item.expense_date || "-"}</td>
                            <td style={styles.tdWhite}>{item.title}</td>
                            <td style={{ ...styles.td, textAlign: "right", color: "#ef4444", fontWeight: "700" }}>
                              -Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* REKAP KAS PER ANGGOTA */}
              <div style={{ ...styles.card, marginTop: "16px" }}>
                <h3 style={styles.cardTitle}>📊 Akumulasi Pembayaran Per Anggota</h3>
                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>NAMA ANGGOTA</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>TOTAL TERKUMPUL</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Object.keys(rekapPerPembayar).length === 0 ? (
                        <tr>
                          <td colSpan="2" style={styles.tdEmpty}>Belum ada data pembayaran terverifikasi.</td>
                        </tr>
                      ) : (
                        Object.entries(rekapPerPembayar).map(([nama, totalAmount], idx) => (
                          <tr key={idx} style={styles.tr}>
                            <td style={styles.tdWhite}>{nama}</td>
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

              {/* FILTER & VERIFIKASI TRANSAKSI ANGGOTA */}
              <div style={{ ...styles.card, marginTop: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                  <h3 style={{ ...styles.cardTitle, margin: 0 }}>
                    Audit & Verifikasi Transaksi Masuk
                  </h3>
                  <button
                    type="button"
                    onClick={() => {
                      setFilterDate("");
                      setFilterMemberName("");
                    }}
                    style={{ ...styles.btnEdit, background: "#27272a" }}
                  >
                    Reset Filter
                  </button>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", marginBottom: "16px", background: "#09090b", padding: "12px", borderRadius: "8px", border: "1px solid #27272a" }}>
                  <div>
                    <label style={{ ...styles.label, marginBottom: "4px" }}>Tanggal:</label>
                    <input
                      type="date"
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      style={{ ...styles.inputSm, background: "#18181b", colorScheme: "dark" }}
                    />
                  </div>
                  <div>
                    <label style={{ ...styles.label, marginBottom: "4px" }}>Nama Anggota:</label>
                    <input
                      type="text"
                      placeholder="Nama anggota..."
                      value={filterMemberName}
                      onChange={(e) => setFilterMemberName(e.target.value)}
                      style={{ ...styles.inputSm, background: "#18181b" }}
                    />
                  </div>
                </div>

                <div style={{ overflowX: "auto" }}>
                  <table style={styles.table}>
                    <thead>
                      <tr>
                        <th style={styles.th}>TANGGAL</th>
                        <th style={styles.th}>PEMBAYAR</th>
                        <th style={styles.th}>NOMINAL</th>
                        <th style={styles.th}>STATUS</th>
                        <th style={{ ...styles.th, textAlign: "right" }}>AKSI VERIFIKASI</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransaksiAdmin.length === 0 ? (
                        <tr>
                          <td colSpan="5" style={styles.tdEmpty}>
                            Tidak ditemukan data transaksi.
                          </td>
                        </tr>
                      ) : (
                        filteredTransaksiAdmin.map((item) => (
                          <tr key={item.id} style={styles.tr}>
                            <td style={styles.tdMuted}>{item.transaction_date || "-"}</td>
                            <td style={styles.tdWhite}>{item.payer_name || item.keterangan || "-"}</td>
                            <td style={styles.tdGreen}>+Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}</td>
                            <td style={styles.td}>
                              <span style={
                                item.status === "settlement" || item.status === "lunas"
                                  ? styles.badgeSuccess
                                  : item.status === "ditolak"
                                  ? styles.badgeDanger
                                  : styles.badgePending
                              }>
                                {item.status === "settlement" || item.status === "lunas"
                                  ? "Disetujui"
                                  : item.status === "ditolak"
                                  ? "Ditolak"
                                  : "Pending"}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                {item.description && item.description.startsWith("data:image") && (
                                  <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof}>
                                    Bukti
                                  </button>
                                )}
                                {(item.status === "pending" || !item.status) && (
                                  <>
                                    <button onClick={() => handleVerifikasi(item.id)} style={styles.btnApprove}>
                                      Setujui
                                    </button>
                                    <button onClick={() => handleTolak(item.id)} style={styles.btnReject}>
                                      Tolak
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
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
    borderRadius: "10px",
    padding: "24px",
    width: "100%",
    maxWidth: "340px",
  },
  label: { display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "600" },
  input: {
    width: "100%",
    padding: "10px 12px",
    background: "#09090b",
    border: "1px solid #27272a",
    color: "#f4f4f5",
    borderRadius: "6px",
    boxSizing: "border-box",
    fontSize: "13px",
  },
  inputSm: {
    padding: "6px 10px",
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
    borderRadius: "6px",
    fontWeight: "700",
    cursor: "pointer",
    fontSize: "13px",
  },
  errorBox: { background: "#3f1315", border: "1px solid #991b1b", color: "#fca5a5", padding: "8px 12px", borderRadius: "6px", fontSize: "11px", marginBottom: "12px" },
  navbar: { padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#18181b" },
  userBadge: { display: "flex", alignItems: "center", gap: "8px", background: "#09090b", padding: "4px 10px", borderRadius: "6px", border: "1px solid #27272a" },
  badgeAdmin: { background: "#2563eb", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800" },
  badgeMember: { background: "#16a34a", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800" },
  btnLogout: { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  btnPrint: { background: "#3f3f46", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  heroGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "18px" },
  cardHeaderLabel: { fontSize: "10px", fontWeight: "800", color: "#a1a1aa", letterSpacing: "1px" },
  cardTitle: { fontSize: "14px", fontWeight: "700", marginTop: 0, marginBottom: "12px", color: "#f4f4f5" },
  btnSaveSm: { background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer", marginTop: "8px", width: "100%" },
  btnEdit: { background: "#2563eb", color: "#fff", border: "none", padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: { textAlign: "left", padding: "8px", color: "#a1a1aa", fontSize: "10px", borderBottom: "1px solid #27272a", fontWeight: "700" },
  tr: { borderBottom: "1px solid #27272a" },
  td: { padding: "10px 8px" },
  tdMuted: { padding: "10px 8px", color: "#a1a1aa" },
  tdWhite: { padding: "10px 8px", color: "#f4f4f5", fontWeight: "600" },
  tdGreen: { padding: "10px 8px", color: "#22c55e", fontWeight: "700" },
  tdEmpty: { padding: "16px", textAlign: "center", color: "#a1a1aa" },
  badgeSuccess: { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
  badgeDanger: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
  badgePending: { background: "rgba(234, 179, 8, 0.15)", color: "#eab308", padding: "2px 6px", borderRadius: "4px", fontSize: "10px", fontWeight: "700" },
  btnProof: { background: "#7c3aed", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer" },
  btnApprove: { background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer" },
  btnReject: { background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "600", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.85)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modalContent: { background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "16px", maxWidth: "450px", width: "100%", textAlign: "center" },
  proofImg: { width: "100%", maxHeight: "60vh", objectFit: "contain", borderRadius: "6px", border: "1px solid #27272a" },
  btnCloseModal: { marginTop: "12px", background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", cursor: "pointer" },
};

export default App;