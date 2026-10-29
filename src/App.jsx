import React, { useState, useEffect } from "react";
import InputForm from "./components/InputForm";
import Background3D from "./components/Background3D";
import { supabase } from "./supabaseClient";
import logoImg from "./assets/logo.jpeg";

function App() {
  const [user, setUser] = useState(() => {
    const savedUser = sessionStorage.getItem("user");
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

  const [toastMsg, setToastMsg] = useState("");

  const showToast = (message) => {
    setToastMsg(message);
    setTimeout(() => {
      setToastMsg("");
    }, 3500);
  };

  const [outKeterangan, setOutKeterangan] = useState("");
  const [outAmount, setOutAmount] = useState("");
  const [outDate, setOutDate] = useState("");

  const [filterDate, setFilterDate] = useState("");
  const [filterMemberName, setFilterMemberName] = useState("");

  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");

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
        throw new Error("Kombinasi email dan kata sandi tidak cocok.");
      }

      const userData = data[0];
      sessionStorage.setItem("user", JSON.stringify(userData));
      setUser(userData);
      setNewUsername(userData.name);
      showToast(`Selamat datang kembali, ${userData.name}`);
    } catch (err) {
      setLoginError(err.message || "Gagal masuk ke sistem.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("user");
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
      console.error("Gagal memuat transaksi:", err.message);
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
      console.error("Gagal memuat pengeluaran:", err.message);
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
      console.error("Gagal memuat daftar anggota:", err.message);
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
      sessionStorage.setItem("user", JSON.stringify(updatedUser));
      setNewPassword("");
      showToast("Profil berhasil diperbarui");
      fetchTransaksi();
    } catch (err) {
      showToast("Gagal memperbarui profil");
    }
  };

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

      showToast("Pengeluaran berhasil dicatat");
      setOutKeterangan("");
      setOutAmount("");
      setOutDate("");
      fetchKasKeluar();
    } catch (err) {
      showToast("Gagal mencatat pengeluaran");
    }
  };

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

      showToast(`Anggota "${addName}" berhasil ditambahkan`);
      setAddName("");
      setAddEmail("");
      setAddPass("");
      setAddRole("anggota");
      fetchAnggota();
    } catch (err) {
      showToast("Gagal menambahkan anggota");
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

      showToast("Data anggota telah disimpan");
      setEditingUserId(null);
      fetchAnggota();
    } catch (err) {
      showToast("Gagal memperbarui anggota");
    }
  };

  const handleHapusAnggota = async (userId, userName) => {
    if (window.confirm(`Hapus anggota "${userName}" dari sistem?`)) {
      try {
        const { error } = await supabase.from("users").delete().eq("id", userId);
        if (error) throw error;

        showToast(`Anggota "${userName}" telah dihapus`);
        fetchAnggota();
      } catch (err) {
        showToast("Gagal menghapus anggota");
      }
    }
  };

  const handleVerifikasi = async (id) => {
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "settlement", rejection_reason: null })
        .eq("id", id);

      if (error) throw error;
      showToast("Pembayaran telah disetujui");
      fetchTransaksi();
    } catch (err) {
      showToast("Gagal memverifikasi transaksi");
    }
  };

  const handleTolak = async (id) => {
    const reason = window.prompt("Alasan penolakan:");
    if (reason !== null) {
      try {
        const { error } = await supabase
          .from("transactions")
          .update({ status: "ditolak", rejection_reason: reason.trim() || "Tidak memenuhi kriteria." })
          .eq("id", id);

        if (error) throw error;
        showToast("Pembayaran telah ditolak");
        fetchTransaksi();
      } catch (err) {
        showToast("Gagal menolak transaksi");
      }
    }
  };

  const isAdmin = user?.role === "admin";

  const myTransaksi = transaksi.filter((item) => {
    const payer = (item.payer_name || item.keterangan || "").toLowerCase();
    return payer.includes((user?.name || "").toLowerCase());
  });

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

  return (
    <div style={styles.appWrapper}>
      {/* ATURAN CSS ANIMASI FADE-IN & TRANSISI HALUS */}
      <style>{`
        @keyframes formAppear {
          0% {
            opacity: 0;
            transform: translateY(16px) scale(0.97);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        .login-card-animated {
          animation: formAppear 0.45s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .btn-action {
          transition: background-color 0.15s ease, transform 0.1s ease;
        }
        .btn-action:hover {
          filter: brightness(1.08);
        }
        .btn-action:active {
          transform: scale(0.98);
        }
        .form-field:focus {
          border-color: #3b82f6 !important;
          outline: none;
        }

        @media print {
          header, button, form, .no-print {
            display: none !important;
          }
          body {
            background: #ffffff !important;
            color: #000000 !important;
          }
          table {
            color: #000000 !important;
          }
          th, td {
            border-bottom: 1px solid #dddddd !important;
          }
        }
      `}</style>

      {toastMsg && (
        <div style={styles.toastContainer} className="no-print">
          {toastMsg}
        </div>
      )}

      {selectedProof && (
        <div onClick={() => setSelectedProof(null)} style={styles.modalOverlay} className="no-print">
          <div onClick={(e) => e.stopPropagation()} style={styles.modalContent} className="login-card-animated">
            <h4 style={styles.modalHeader}>Bukti Pembayaran</h4>
            <img src={selectedProof} alt="Bukti Pembayaran" style={styles.proofImg} />
            <button onClick={() => setSelectedProof(null)} style={styles.btnCloseModal} className="btn-action">
              Tutup
            </button>
          </div>
        </div>
      )}

      {!user ? (
        <div style={styles.loginContainer}>
          <Background3D role="anggota" />
          <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }} className="login-card-animated">
            <div style={{ textAlign: "center", marginBottom: "20px" }}>
              <img src={logoImg} alt="Logo" style={{ width: "72px", borderRadius: "10px" }} />
              <h2 style={styles.loginTitle}>SOUTHERN BASE</h2>
              <p style={styles.loginSub}>Sistem Informasi Kas Organisasi</p>
            </div>

            {loginError && <div style={styles.errorBox}>{loginError}</div>}

            <form onSubmit={handleLogin}>
              <div style={{ marginBottom: "14px" }}>
                <label style={styles.label}>Alamat Email</label>
                <input
                  type="email"
                  placeholder="email@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  style={styles.input}
                  className="form-field"
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
                    className="form-field"
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

              <button type="submit" style={styles.btnLogin} disabled={loadingLogin} className="btn-action">
                {loadingLogin ? "Memeriksa Data..." : "Masuk"}
              </button>
            </form>
          </div>
        </div>
      ) : (
        <div style={{ position: "relative", zIndex: 1 }}>
          <Background3D role={user.role} />

          <header style={styles.navbar}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <img src={logoImg} alt="Logo" style={{ height: "24px", borderRadius: "4px" }} />
              <span style={styles.navTitle}>
                SOUTHERN BASE {isAdmin ? "— ADMIN" : "— ANGGOTA"}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={styles.userBadge}>
                <span style={{ fontSize: "12px", color: "#e4e4e7" }}>{user.name}</span>
                <span style={isAdmin ? styles.badgeAdmin : styles.badgeMember}>
                  {user.role ? user.role.toUpperCase() : "MEMBER"}
                </span>
              </div>
              <button onClick={handleLogout} style={styles.btnLogout} className="btn-action">Keluar</button>
            </div>
          </header>

          <main style={{ maxWidth: "1040px", margin: "20px auto", padding: "0 16px" }}>
            <div style={styles.heroGrid}>
              <div style={styles.card} className="login-card-animated">
                <span style={styles.cardHeaderLabel}>
                  {isAdmin ? "TOTAL SALDO BERSIH" : "TOTAL KAS DIBAYAR"}
                </span>
                <h1 style={styles.statNumber}>
                  Rp {(isAdmin ? saldoBersih : totalVerifiedUser).toLocaleString("id-ID")}
                </h1>
                {isAdmin && (
                  <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginTop: "6px" }}>
                    <span style={{ color: "#a1a1aa" }}>Masuk: <strong style={{ color: "#22c55e" }}>+Rp {totalIn.toLocaleString("id-ID")}</strong></span>
                    <span style={{ color: "#a1a1aa" }}>Keluar: <strong style={{ color: "#ef4444" }}>-Rp {totalOut.toLocaleString("id-ID")}</strong></span>
                  </div>
                )}
              </div>

              <div style={styles.card} className="no-print login-card-animated">
                <span style={styles.cardHeaderLabel}>PENGATURAN KREDENSIAL</span>
                <form onSubmit={handleUpdateProfilePribadi} style={{ marginTop: "10px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                    <input
                      type="text"
                      placeholder="Nama Pengguna"
                      value={newUsername}
                      onChange={(e) => setNewUsername(e.target.value)}
                      required
                      style={styles.inputSm}
                      className="form-field"
                    />
                    <input
                      type="password"
                      placeholder="Sandi Baru (Opsional)"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      style={styles.inputSm}
                      className="form-field"
                    />
                  </div>
                  <button type="submit" style={styles.btnSaveSm} className="btn-action">Perbarui Akun</button>
                </form>
              </div>
            </div>

            {!isAdmin && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "16px" }}>
                <div style={styles.card} className="no-print login-card-animated">
                  <h3 style={styles.cardTitle}>Formulir Pembayaran Kas</h3>
                  <InputForm onSuccess={fetchTransaksi} />
                </div>

                <div style={styles.card} className="login-card-animated">
                  <h3 style={styles.cardTitle}>Riwayat Pembayaran Saya</h3>
                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>TANGGAL</th>
                          <th style={styles.th}>NOMINAL</th>
                          <th style={styles.th}>STATUS</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>DETAIL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTransaksi.length === 0 ? (
                          <tr>
                            <td colSpan="4" style={styles.tdEmpty}>Belum ada riwayat transaksi.</td>
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
                                    : "Menunggu"}
                                </span>
                              </td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                {item.description && item.description.startsWith("data:image") && (
                                  <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof} className="btn-action">
                                    Lihat Bukti
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

            {isAdmin && (
              <>
                <div style={{ ...styles.card, marginTop: "16px" }} className="no-print login-card-animated">
                  <h3 style={styles.cardTitle}>Kelola Anggota</h3>

                  <form onSubmit={handleTambahAnggota} style={styles.subFormContainer}>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        required
                        style={styles.inputSm}
                        className="form-field"
                      />
                      <input
                        type="email"
                        placeholder="Email"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        required
                        style={styles.inputSm}
                        className="form-field"
                      />
                      <input
                        type="password"
                        placeholder="Kata Sandi"
                        value={addPass}
                        onChange={(e) => setAddPass(e.target.value)}
                        required
                        style={styles.inputSm}
                        className="form-field"
                      />
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        style={{ ...styles.inputSm, background: "#09090b" }}
                      >
                        <option value="anggota">Anggota</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button type="submit" style={styles.btnSaveSm} className="btn-action">
                        Tambah
                      </button>
                    </div>
                  </form>

                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>ID</th>
                          <th style={styles.th}>NAMA</th>
                          <th style={styles.th}>EMAIL</th>
                          <th style={styles.th}>ROLE</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>AKSI</th>
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
                                  className="form-field"
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
                                  className="form-field"
                                />
                              ) : (
                                m.email
                              )}
                            </td>
                            <td style={styles.td}>
                              {editingUserId === m.id ? (
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  style={styles.inputSm}
                                >
                                  <option value="anggota">Anggota</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span style={m.role === "admin" ? styles.badgeAdmin : styles.badgeMember}>
                                  {m.role ? m.role.toUpperCase() : "ANGGOTA"}
                                </span>
                              )}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {editingUserId === m.id ? (
                                <button onClick={() => handleSaveEditAnggota(m.id)} style={styles.btnSaveSm} className="btn-action">
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
                                    className="btn-action"
                                  >
                                    Ubah
                                  </button>
                                  <button
                                    onClick={() => handleHapusAnggota(m.id, m.name)}
                                    style={styles.btnReject}
                                    className="btn-action"
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

                <div style={{ ...styles.card, marginTop: "16px" }} className="login-card-animated">
                  <h3 style={styles.cardTitle}>Pengeluaran Kas</h3>

                  <form onSubmit={handleTambahKasKeluar} style={styles.subFormContainer} className="no-print">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                      <input
                        type="text"
                        placeholder="Keterangan Pengeluaran"
                        value={outKeterangan}
                        onChange={(e) => setOutKeterangan(e.target.value)}
                        required
                        style={styles.inputSm}
                        className="form-field"
                      />
                      <input
                        type="number"
                        placeholder="Jumlah (Rp)"
                        value={outAmount}
                        onChange={(e) => setOutAmount(e.target.value)}
                        required
                        style={styles.inputSm}
                        className="form-field"
                      />
                      <input
                        type="date"
                        value={outDate}
                        onChange={(e) => setOutDate(e.target.value)}
                        style={{ ...styles.inputSm, colorScheme: "dark" }}
                        className="form-field"
                      />
                      <button type="submit" style={styles.btnReject} className="btn-action">
                        Catat Pengeluaran
                      </button>
                    </div>
                  </form>

                  <div style={{ overflowX: "auto" }}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>TANGGAL</th>
                          <th style={styles.th}>KETERANGAN</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>NOMINAL</th>
                        </tr>
                      </thead>
                      <tbody>
                        {kasKeluar.length === 0 ? (
                          <tr>
                            <td colSpan="3" style={styles.tdEmpty}>Belum ada data pengeluaran.</td>
                          </tr>
                        ) : (
                          kasKeluar.map((item) => (
                            <tr key={item.id} style={styles.tr}>
                              <td style={styles.tdMuted}>{item.expense_date || "-"}</td>
                              <td style={styles.tdWhite}>{item.title}</td>
                              <td style={{ ...styles.td, textAlign: "right", color: "#ef4444", fontWeight: "600" }}>
                                -Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div style={{ ...styles.card, marginTop: "16px" }} className="login-card-animated">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
                    <h3 style={{ ...styles.cardTitle, margin: 0 }}>
                      Verifikasi Pembayaran Masuk
                    </h3>

                    <div style={{ display: "flex", gap: "8px" }} className="no-print">
                      <button
                        type="button"
                        onClick={handlePrintReport}
                        style={{ ...styles.btnEdit, background: "#16a34a" }}
                        className="btn-action"
                      >
                        Cetak Laporan
                      </button>

                      <button
                        type="button"
                        onClick={() => {
                          setFilterDate("");
                          setFilterMemberName("");
                        }}
                        style={{ ...styles.btnEdit, background: "#27272a" }}
                        className="btn-action"
                      >
                        Reset Filter
                      </button>
                    </div>
                  </div>

                  <div style={styles.subFormContainer} className="no-print">
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "8px" }}>
                      <div>
                        <label style={{ ...styles.label, marginBottom: "4px" }}>Tanggal:</label>
                        <input
                          type="date"
                          value={filterDate}
                          onChange={(e) => setFilterDate(e.target.value)}
                          style={{ ...styles.inputSm, colorScheme: "dark" }}
                          className="form-field"
                        />
                      </div>
                      <div>
                        <label style={{ ...styles.label, marginBottom: "4px" }}>Nama Anggota:</label>
                        <input
                          type="text"
                          placeholder="Cari anggota..."
                          value={filterMemberName}
                          onChange={(e) => setFilterMemberName(e.target.value)}
                          style={styles.inputSm}
                          className="form-field"
                        />
                      </div>
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
                          <th style={{ ...styles.th, textAlign: "right" }}>AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransaksiAdmin.length === 0 ? (
                          <tr>
                            <td colSpan="5" style={styles.tdEmpty}>
                              Tidak ada data ditemukan.
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
                                    : "Menunggu"}
                                </span>
                              </td>
                              <td style={{ ...styles.td, textAlign: "right" }}>
                                <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                  {item.description && item.description.startsWith("data:image") && (
                                    <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof} className="btn-action">
                                      Bukti
                                    </button>
                                  )}
                                  {(item.status === "pending" || !item.status) && (
                                    <>
                                      <button onClick={() => handleVerifikasi(item.id)} style={styles.btnApprove} className="btn-action">
                                        Setujui
                                      </button>
                                      <button onClick={() => handleTolak(item.id)} style={styles.btnReject} className="btn-action">
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
      )}
    </div>
  );
}

const styles = {
  appWrapper: {
    minHeight: "100vh",
    position: "relative",
    color: "#f4f4f5",
    background: "#09090b",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  toastContainer: {
    position: "fixed",
    bottom: "20px",
    right: "20px",
    background: "#27272a",
    color: "#f4f4f5",
    border: "1px solid #3f3f46",
    padding: "10px 16px",
    borderRadius: "8px",
    fontSize: "12px",
    zIndex: 10000,
  },
  loginContainer: {
    minHeight: "100vh",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "16px",
  },
  loginCard: {
    background: "#18181b",
    border: "1px solid #27272a",
    borderRadius: "12px",
    padding: "24px",
    width: "100%",
    maxWidth: "340px",
  },
  loginTitle: { fontSize: "16px", fontWeight: "600", color: "#f4f4f5", margin: "10px 0 2px 0" },
  loginSub: { fontSize: "12px", color: "#71717a", margin: 0 },
  label: { display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "500" },
  input: {
    width: "100%",
    padding: "9px 12px",
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
    padding: "9px",
    background: "#2563eb",
    color: "#ffffff",
    border: "none",
    borderRadius: "6px",
    fontWeight: "600",
    cursor: "pointer",
    fontSize: "13px",
  },
  errorBox: { background: "#271012", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" },
  navbar: { padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#18181b", borderBottom: "1px solid #27272a" },
  navTitle: { fontWeight: "600", fontSize: "13px", color: "#f4f4f5" },
  userBadge: { display: "flex", alignItems: "center", gap: "8px", background: "#09090b", padding: "4px 8px", borderRadius: "6px", border: "1px solid #27272a" },
  badgeAdmin: { background: "#2563eb", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "700" },
  badgeMember: { background: "#16a34a", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "700" },
  btnLogout: { background: "#dc2626", color: "#fff", border: "none", padding: "5px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "500", cursor: "pointer" },
  heroGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
  card: { background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "16px" },
  cardHeaderLabel: { fontSize: "11px", fontWeight: "600", color: "#71717a" },
  statNumber: { fontSize: "26px", color: "#22c55e", margin: "4px 0", fontWeight: "700" },
  cardTitle: { fontSize: "13px", fontWeight: "600", marginTop: 0, marginBottom: "12px", color: "#f4f4f5" },
  subFormContainer: { marginBottom: "14px", background: "#09090b", padding: "10px", borderRadius: "6px", border: "1px solid #27272a" },
  btnSaveSm: { background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", width: "100%" },
  btnEdit: { background: "#2563eb", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "500", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: { textAlign: "left", padding: "8px 6px", color: "#71717a", fontSize: "11px", borderBottom: "1px solid #27272a", fontWeight: "600" },
  tr: { borderBottom: "1px solid #27272a" },
  td: { padding: "8px 6px" },
  tdMuted: { padding: "8px 6px", color: "#71717a" },
  tdWhite: { padding: "8px 6px", color: "#f4f4f5" },
  tdGreen: { padding: "8px 6px", color: "#22c55e", fontWeight: "600" },
  tdEmpty: { padding: "16px", textAlign: "center", color: "#71717a" },
  badgeSuccess: { background: "rgba(34, 197, 94, 0.1)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  badgeDanger: { background: "rgba(239, 68, 68, 0.1)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  badgePending: { background: "rgba(234, 179, 8, 0.1)", color: "#eab308", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  btnProof: { background: "#6d28d9", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnApprove: { background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnReject: { background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modalContent: { background: "#18181b", border: "1px solid #27272a", borderRadius: "10px", padding: "16px", maxWidth: "400px", width: "100%", textAlign: "center" },
  modalHeader: { margin: "0 0 10px 0", fontSize: "13px", color: "#f4f4f5" },
  proofImg: { width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: "6px", border: "1px solid #27272a" },
  btnCloseModal: { marginTop: "10px", background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
};

export default App;