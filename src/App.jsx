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

  // --- FILTER RENTANG TANGGAL & NAMA ---
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
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
          .update({
            status: "ditolak",
            rejection_reason: reason.trim() || "Tidak memenuhi kriteria.",
          })
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

  const isWithinDateRange = (rawDate, start, end) => {
    if (!start && !end) return true;
    if (!rawDate) return false;
    const cleanDate = String(rawDate).slice(0, 10);
    if (start && cleanDate < start) return false;
    if (end && cleanDate > end) return false;
    return true;
  };

  const handleSetBulanIni = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    setFilterStartDate(`${year}-${month}-01`);
    setFilterEndDate(`${year}-${month}-${day}`);
    showToast("Filter diterapkan: Bulan Ini");
  };

  const handleResetFilter = () => {
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterMemberName("");
  };

  const myTransaksiAll = transaksi.filter((item) => {
    if (!user?.name) return false;
    const currentUserName = user.name.toLowerCase().trim();
    const rawPayer = (item.payer_name || item.keterangan || "").toLowerCase();
    const cleanPayer = rawPayer.split("-")[0].trim();
    if (!cleanPayer) return false;
    return cleanPayer.includes(currentUserName) || currentUserName.includes(cleanPayer);
  });

  const myTransaksiFiltered = myTransaksiAll.filter((item) =>
    isWithinDateRange(item.transaction_date, filterStartDate, filterEndDate)
  );

  const totalIn = transaksi
    .filter((t) => {
      const st = (t.status || "").toLowerCase();
      return st === "settlement" || st === "lunas";
    })
    .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);

  const totalOut = kasKeluar.reduce(
    (acc, c) => acc + (parseInt(c.amount || 0) || 0),
    0
  );

  const saldoBersih = totalIn - totalOut;

  const totalVerifiedUser = myTransaksiAll
    .filter((t) => {
      const st = (t.status || "").toLowerCase();
      return st === "settlement" || st === "lunas";
    })
    .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);

  const myFilteredVerifiedUser = myTransaksiFiltered
    .filter((t) => {
      const st = (t.status || "").toLowerCase();
      return st === "settlement" || st === "lunas";
    })
    .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);

  const filteredTransaksiAdmin = transaksi.filter((item) => {
    const matchesDateRange = isWithinDateRange(
      item.transaction_date,
      filterStartDate,
      filterEndDate
    );
    const matchesName = filterMemberName
      ? (item.payer_name || item.keterangan || "")
          .toLowerCase()
          .includes(filterMemberName.toLowerCase().trim())
      : true;
    return matchesDateRange && matchesName;
  });

  const filteredKasKeluarAdmin = kasKeluar.filter((item) =>
    isWithinDateRange(item.expense_date, filterStartDate, filterEndDate)
  );

  const filteredTotalIn = filteredTransaksiAdmin
    .filter((t) => {
      const st = (t.status || "").toLowerCase();
      return st === "settlement" || st === "lunas";
    })
    .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);

  const filteredTotalOut = filteredKasKeluarAdmin.reduce(
    (acc, c) => acc + (parseInt(c.amount || 0) || 0),
    0
  );

  const filteredSaldoBersih = filteredTotalIn - filteredTotalOut;

  const hasActiveFilter = Boolean(
    filterStartDate || filterEndDate || filterMemberName
  );

  const formatTanggalIndo = (dateStr) => {
    if (!dateStr) return "";
    const parts = dateStr.split("-");
    if (parts.length !== 3) return dateStr;
    const d = new Date(
      Number(parts[0]),
      Number(parts[1]) - 1,
      Number(parts[2])
    );
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  const labelPeriodeCetak = () => {
    if (filterStartDate && filterEndDate) {
      return `${formatTanggalIndo(filterStartDate)} s/d ${formatTanggalIndo(
        filterEndDate
      )}`;
    }
    if (filterStartDate) {
      return `Mulai ${formatTanggalIndo(filterStartDate)}`;
    }
    if (filterEndDate) {
      return `Sampai ${formatTanggalIndo(filterEndDate)}`;
    }
    return "Semua Periode";
  };

  const formatStatusLabel = (status) => {
    const st = (status || "").toLowerCase();
    if (st === "settlement" || st === "lunas") return "Disetujui";
    if (st === "ditolak") return "Ditolak";
    return "Menunggu";
  };

  // --- FUNGSI CETAK LAPORAN MENGGUNAKAN JENDELA BARU (POP-UP) ---
  const handlePrintReport = () => {
    const printWindow = window.open("", "_blank", "width=950,height=750");
    if (!printWindow) {
      showToast("Pop-up diblokir browser. Izinkan pop-up untuk mencetak PDF.");
      return;
    }

    const escapeHtml = (str) =>
      String(str ?? "-")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");

    const periodeText = escapeHtml(labelPeriodeCetak());
    const cetakDateText = escapeHtml(tanggalCetak);
    const userNameText = escapeHtml(user?.name);
    const memberFilterText = filterMemberName
      ? `<div style="margin-top:4px;"><strong>Filter Anggota:</strong> ${escapeHtml(filterMemberName)}</div>`
      : "";

    let bodyContent = "";

    if (isAdmin) {
      const pemasukanRows =
        filteredTransaksiAdmin.length === 0
          ? `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">Tidak ada data pembayaran pada periode ini.</td></tr>`
          : filteredTransaksiAdmin
              .map(
                (item, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${escapeHtml(item.transaction_date || "-")}</td>
                <td>${escapeHtml(item.payer_name || item.keterangan || "-")}</td>
                <td style="text-align:right;font-weight:600;color:#15803d;">+Rp ${(
                  parseInt(item.amount || item.jumlah || 0) || 0
                ).toLocaleString("id-ID")}</td>
                <td style="text-align:center;font-weight:600;">${escapeHtml(
                  formatStatusLabel(item.status)
                )}</td>
              </tr>`
              )
              .join("");

      const pengeluaranRows =
        filteredKasKeluarAdmin.length === 0
          ? `<tr><td colspan="4" style="text-align:center;color:#6b7280;padding:16px;">Tidak ada data pengeluaran pada periode ini.</td></tr>`
          : filteredKasKeluarAdmin
              .map(
                (item, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${escapeHtml(item.expense_date || "-")}</td>
                <td>${escapeHtml(item.title || "-")}</td>
                <td style="text-align:right;font-weight:600;color:#b91c1c;">-Rp ${(
                  parseInt(item.amount || 0) || 0
                ).toLocaleString("id-ID")}</td>
              </tr>`
              )
              .join("");

      bodyContent = `
        <div class="summary-grid">
          <div class="summary-box">
            <div class="summary-label">PEMASUKAN DISETUJUI (${
              hasActiveFilter ? "PERIODE FILTER" : "TOTAL"
            })</div>
            <div class="summary-value" style="color:#15803d;">+Rp ${filteredTotalIn.toLocaleString(
              "id-ID"
            )}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">PENGELUARAN KAS (${
              hasActiveFilter ? "PERIODE FILTER" : "TOTAL"
            })</div>
            <div class="summary-value" style="color:#b91c1c;">-Rp ${filteredTotalOut.toLocaleString(
              "id-ID"
            )}</div>
          </div>
          <div class="summary-box">
            <div class="summary-label">SELISIH / SALDO BERSIH</div>
            <div class="summary-value" style="color:#111827;">Rp ${filteredSaldoBersih.toLocaleString(
              "id-ID"
            )}</div>
          </div>
        </div>

        <div class="section-title">Rincian Pembayaran Masuk <span>(${periodeText})</span></div>
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center;">NO</th>
              <th style="width:120px;">TANGGAL</th>
              <th>PEMBAYAR</th>
              <th style="width:140px;text-align:right;">NOMINAL</th>
              <th style="width:110px;text-align:center;">STATUS</th>
            </tr>
          </thead>
          <tbody>${pemasukanRows}</tbody>
        </table>

        <div class="section-title">Rincian Pengeluaran Kas <span>(${periodeText})</span></div>
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center;">NO</th>
              <th style="width:120px;">TANGGAL</th>
              <th>KETERANGAN PENGELUARAN</th>
              <th style="width:140px;text-align:right;">NOMINAL</th>
            </tr>
          </thead>
          <tbody>${pengeluaranRows}</tbody>
        </table>

        <div class="signature-wrap">
          <div class="signature-box">
            <div>Mengetahui,</div>
            <div style="font-weight:700;margin-top:4px;">Bendahara / Admin Southern Base</div>
            <div style="height:65px;"></div>
            <div style="border-top:1px solid #111827;padding-top:6px;font-weight:700;">${userNameText}</div>
          </div>
        </div>
      `;
    } else {
      const anggotaRows =
        myTransaksiFiltered.length === 0
          ? `<tr><td colspan="5" style="text-align:center;color:#6b7280;padding:16px;">Belum ada riwayat transaksi pada periode ini.</td></tr>`
          : myTransaksiFiltered
              .map(
                (item, idx) => `
              <tr>
                <td style="text-align:center;">${idx + 1}</td>
                <td>${escapeHtml(item.transaction_date || "-")}</td>
                <td>${escapeHtml(item.payer_name || item.keterangan || "-")}</td>
                <td style="text-align:right;font-weight:600;color:#15803d;">+Rp ${(
                  parseInt(item.amount || item.jumlah || 0) || 0
                ).toLocaleString("id-ID")}</td>
                <td style="text-align:center;font-weight:600;">${escapeHtml(
                  formatStatusLabel(item.status)
                )}</td>
              </tr>`
              )
              .join("");

      bodyContent = `
        <div class="summary-box" style="margin-bottom:22px;">
          <div class="summary-label">TOTAL KAS DISETUJUI (${periodeText.toUpperCase()})</div>
          <div class="summary-value" style="color:#15803d;font-size:18px;">Rp ${myFilteredVerifiedUser.toLocaleString(
            "id-ID"
          )}</div>
        </div>

        <div class="section-title">Riwayat Pembayaran Kas — ${userNameText} <span>(${periodeText})</span></div>
        <table>
          <thead>
            <tr>
              <th style="width:40px;text-align:center;">NO</th>
              <th style="width:120px;">TANGGAL</th>
              <th>KETERANGAN</th>
              <th style="width:140px;text-align:right;">NOMINAL</th>
              <th style="width:110px;text-align:center;">STATUS</th>
            </tr>
          </thead>
          <tbody>${anggotaRows}</tbody>
        </table>
      `;
    }

    const htmlDoc = `
      <!DOCTYPE html>
      <html lang="id">
      <head>
        <meta charset="UTF-8" />
        <title>Laporan Kas Southern Base - ${periodeText}</title>
        <style>
          @page { size: A4 portrait; margin: 12mm 15mm; }
          * { box-sizing: border-box; }
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
            color: #111827;
            background: #ffffff;
            margin: 0;
            padding: 0;
            font-size: 11.5px;
            line-height: 1.5;
          }
          .header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            border-bottom: 2.5px solid #111827;
            padding-bottom: 16px;
            margin-bottom: 20px;
          }
          .header-left {
            display: flex;
            align-items: center;
            gap: 14px;
          }
          .header-left img {
            width: 60px;
            height: 60px;
            border-radius: 6px;
            object-fit: contain; /* Memastikan logo tampil utuh, tidak terpotong */
            background-color: #ffffff;
          }
          .header-title {
            margin: 0;
            font-size: 20px;
            font-weight: 800;
            letter-spacing: 0.5px;
          }
          .header-sub {
            margin: 4px 0 0 0;
            font-size: 12px;
            color: #4b5563;
          }
          .header-meta {
            text-align: right;
            font-size: 11px;
            line-height: 1.6;
            color: #374151;
          }
          .summary-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 12px;
            margin-bottom: 24px;
          }
          .summary-box {
            border: 1px solid #9ca3af;
            border-radius: 6px;
            padding: 12px 14px;
            background: #f9fafb;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .summary-label {
            font-size: 10px;
            font-weight: 700;
            color: #4b5563;
          }
          .summary-value {
            font-size: 16px;
            font-weight: 800;
            margin-top: 6px;
          }
          .section-title {
            font-size: 12.5px;
            font-weight: 700;
            text-transform: uppercase;
            border-left: 4px solid #111827;
            padding-left: 10px;
            margin: 24px 0 10px 0;
          }
          .section-title span {
            font-size: 11px;
            color: #4b5563;
            font-weight: 500;
            text-transform: none;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
          }
          thead { display: table-header-group; }
          tr { page-break-inside: avoid; break-inside: avoid; }
          th {
            background: #f3f4f6;
            border: 1px solid #6b7280;
            padding: 8px 10px;
            font-weight: 700;
            text-align: left;
            text-transform: uppercase;
            font-size: 10.5px;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          td {
            border: 1px solid #d1d5db;
            padding: 8px 10px;
          }
          tbody tr:nth-child(even) td {
            background: #fcfcfc;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .signature-wrap {
            display: flex;
            justify-content: flex-end;
            margin-top: 40px;
            page-break-inside: avoid;
          }
          .signature-box {
            width: 240px;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="header-left">
            <img src="${logoImg}" alt="Logo" />
            <div>
              <h1 class="header-title">SOUTHERN BASE</h1>
              <p class="header-sub">Laporan Rekapitulasi Keuangan & Kas Organisasi</p>
            </div>
          </div>
          <div class="header-meta">
            <div><strong>Periode Laporan:</strong> ${periodeText}</div>
            ${memberFilterText}
            <div style="margin-top:4px;"><strong>Tanggal Cetak:</strong> ${cetakDateText} (Oleh: ${userNameText})</div>
          </div>
        </div>
        ${bodyContent}
        <script>
          window.onload = function() {
            setTimeout(function() {
              window.focus();
              window.print();
            }, 300);
          };
        </script>
      </body>
      </html>
    `;

    printWindow.document.open();
    printWindow.document.write(htmlDoc);
    printWindow.document.close();
  };

  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div style={styles.appWrapper}>
      <style>{`
        body, html {
          margin: 0;
          padding: 0;
          background: #030306;
        }
        @keyframes loginFloatUp {
          0% { opacity: 0; transform: translateY(24px) scale(0.96); }
          60% { transform: translateY(-4px) scale(1.01); }
          100% { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes logoPop {
          0% { opacity: 0; transform: scale(0.6); }
          70% { transform: scale(1.08); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes shakeError {
          0%, 100% { transform: translateX(0); }
          20%, 60% { transform: translateX(-6px); }
          40%, 80% { transform: translateX(6px); }
        }
        .login-card-animated { animation: loginFloatUp 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards; }
        .logo-animated { animation: logoPop 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) 0.15s backwards; }
        .shake-animated { animation: shakeError 0.35s ease-in-out; }
        .form-field { transition: border-color 0.2s ease, box-shadow 0.2s ease, transform 0.15s ease; }
        .form-field:focus {
          border-color: #3b82f6 !important;
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.25) !important;
          transform: translateY(-1px);
          outline: none;
        }
        .btn-action { transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .btn-action:hover {
          filter: brightness(1.12);
          transform: translateY(-1.5px);
          box-shadow: 0 4px 12px rgba(37, 99, 235, 0.3);
        }
        .btn-action:active { transform: translateY(0) scale(0.98); }
      `}</style>

      <div className="screen-only">
        {toastMsg && <div style={styles.toastContainer}>{toastMsg}</div>}

        {selectedProof && (
          <div onClick={() => setSelectedProof(null)} style={styles.modalOverlay}>
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
            <Background3D role="anggota" isLogin={true} />
            <div style={{ ...styles.loginCard, position: "relative", zIndex: 1 }} className="login-card-animated">
              <div style={{ textAlign: "center", marginBottom: "20px" }}>
                <img src={logoImg} alt="Logo" style={{ width: "72px", borderRadius: "10px", objectFit: "contain", backgroundColor: "#ffffff" }} className="logo-animated" />
                <h2 style={styles.loginTitle}>SOUTHERN BASE</h2>
                <p style={styles.loginSub}>Sistem Informasi Kas Organisasi</p>
              </div>

              {loginError && <div style={styles.errorBox} className="shake-animated">{loginError}</div>}

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
                    <button type="button" onClick={() => setShowPassword(!showPassword)} style={styles.btnEye}>
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
          <div style={{ position: "relative", zIndex: 10 }}>
            <Background3D role={user.role} isLogin={false} />

            <header style={styles.navbarSticky}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img src={logoImg} alt="Logo" style={{ height: "30px", width: "30px", borderRadius: "4px", objectFit: "contain", backgroundColor: "#ffffff" }} />
                <span style={styles.navTitle}>
                  SOUTHERN BASE {isAdmin ? "— MASTER CONTROL" : "— MEMBER PORTAL"}
                </span>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={styles.userBadge}>
                  <span style={{ fontSize: "12px", color: "#e4e4e7", fontWeight: "600" }}>{user.name}</span>
                  <span style={isAdmin ? styles.badgeAdmin : styles.badgeMember}>
                    {user.role ? user.role.toUpperCase() : "MEMBER"}
                  </span>
                </div>
                <button onClick={handleLogout} style={styles.btnLogout} className="btn-action">
                  🚪 Keluar
                </button>
              </div>
            </header>

            <main style={{ maxWidth: "1040px", margin: "20px auto", padding: "0 16px" }}>
              <div style={styles.heroGrid}>
                <div style={styles.card} className="login-card-animated">
                  <span style={styles.cardHeaderLabel}>
                    {isAdmin ? "TOTAL SALDO BERSIH KESELURUHAN" : "TOTAL KAS DIBAYAR"}
                  </span>
                  <h1 style={styles.statNumber}>
                    Rp {(isAdmin ? saldoBersih : totalVerifiedUser).toLocaleString("id-ID")}
                  </h1>
                  {isAdmin && (
                    <div style={{ display: "flex", gap: "16px", fontSize: "12px", marginTop: "6px" }}>
                      <span style={{ color: "#a1a1aa" }}>
                        Masuk: <strong style={{ color: "#22c55e" }}>+Rp {totalIn.toLocaleString("id-ID")}</strong>
                      </span>
                      <span style={{ color: "#a1a1aa" }}>
                        Keluar: <strong style={{ color: "#ef4444" }}>-Rp {totalOut.toLocaleString("id-ID")}</strong>
                      </span>
                    </div>
                  )}
                </div>

                <div style={styles.card} className="login-card-animated">
                  <span style={styles.cardHeaderLabel}>PENGATURAN KREDENSIAL</span>
                  <form onSubmit={handleUpdateProfilePribadi} style={{ marginTop: "10px" }}>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "8px" }}>
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
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button type="submit" style={styles.btnSaveSm} className="btn-action">
                        Perbarui Akun
                      </button>
                      <button type="button" onClick={handleLogout} style={{ ...styles.btnLogout, width: "auto", whiteSpace: "nowrap" }} className="btn-action">
                        🚪 Keluar
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {!isAdmin && (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginTop: "16px" }}>
                  <div style={styles.card} className="login-card-animated">
                    <h3 style={styles.cardTitle}>Formulir Pembayaran Kas</h3>
                    <InputForm onSuccess={fetchTransaksi} />
                  </div>

                  <div style={styles.card} className="login-card-animated">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px", marginBottom: "12px" }}>
                      <h3 style={{ ...styles.cardTitle, margin: 0 }}>Riwayat Pembayaran Saya</h3>
                      <button type="button" onClick={handlePrintReport} style={{ ...styles.btnEdit, background: "#16a34a" }} className="btn-action">
                        🖨️ Cetak PDF
                      </button>
                    </div>

                    <div style={styles.subFormContainer}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr auto", gap: "8px", alignItems: "end" }}>
                        <div>
                          <label style={{ ...styles.label, marginBottom: "4px" }}>Dari Tanggal (A):</label>
                          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ ...styles.inputSm, colorScheme: "dark" }} className="form-field" />
                        </div>
                        <div>
                          <label style={{ ...styles.label, marginBottom: "4px" }}>Sampai Tanggal (B):</label>
                          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ ...styles.inputSm, colorScheme: "dark" }} className="form-field" />
                        </div>
                        <button type="button" onClick={handleResetFilter} style={{ ...styles.btnEdit, background: "#27272a", height: "30px" }} className="btn-action">
                          Reset
                        </button>
                      </div>
                    </div>

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
                          {myTransaksiFiltered.length === 0 ? (
                            <tr><td colSpan="4" style={styles.tdEmpty}>Belum ada riwayat transaksi pada periode ini.</td></tr>
                          ) : (
                            myTransaksiFiltered.map((item) => (
                              <tr key={item.id} style={styles.tr}>
                                <td style={styles.tdMuted}>{item.transaction_date || "-"}</td>
                                <td style={styles.tdGreen}>+Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}</td>
                                <td style={styles.td}>
                                  <span style={((item.status || "").toLowerCase() === "settlement" || (item.status || "").toLowerCase() === "lunas") ? styles.badgeSuccess : (item.status || "").toLowerCase() === "ditolak" ? styles.badgeDanger : styles.badgePending}>
                                    {formatStatusLabel(item.status)}
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
                  <div style={{ ...styles.card, marginTop: "16px", border: "1px solid rgba(59, 130, 246, 0.35)" }} className="login-card-animated">
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <div>
                        <h3 style={{ ...styles.cardTitle, margin: 0 }}>Filter Periode Laporan & Cetak PDF</h3>
                        <span style={{ fontSize: "11px", color: "#a1a1aa" }}>Pilih rentang tanggal mulai (A) hingga tanggal akhir (B) untuk menyaring laporan dan cetak PDF.</span>
                      </div>
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        <button type="button" onClick={handleSetBulanIni} style={{ ...styles.btnEdit, background: "#0284c7" }} className="btn-action">
                          📅 Bulan Ini
                        </button>
                        <button type="button" onClick={handleResetFilter} style={{ ...styles.btnEdit, background: "#27272a" }} className="btn-action">
                          Reset Filter
                        </button>
                        <button type="button" onClick={handlePrintReport} style={{ ...styles.btnEdit, background: "#16a34a", fontWeight: "600", padding: "6px 12px" }} className="btn-action">
                          🖨️ Cetak Laporan PDF
                        </button>
                      </div>
                    </div>

                    <div style={{ ...styles.subFormContainer, marginBottom: 0 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px" }}>
                        <div>
                          <label style={{ ...styles.label, marginBottom: "4px" }}>Dari Tanggal (A):</label>
                          <input type="date" value={filterStartDate} onChange={(e) => setFilterStartDate(e.target.value)} style={{ ...styles.inputSm, colorScheme: "dark" }} className="form-field" />
                        </div>
                        <div>
                          <label style={{ ...styles.label, marginBottom: "4px" }}>Sampai Tanggal (B):</label>
                          <input type="date" value={filterEndDate} onChange={(e) => setFilterEndDate(e.target.value)} style={{ ...styles.inputSm, colorScheme: "dark" }} className="form-field" />
                        </div>
                        <div>
                          <label style={{ ...styles.label, marginBottom: "4px" }}>Cari Nama Anggota (Opsional):</label>
                          <input type="text" placeholder="Ketik nama anggota..." value={filterMemberName} onChange={(e) => setFilterMemberName(e.target.value)} style={styles.inputSm} className="form-field" />
                        </div>
                      </div>

                      {hasActiveFilter && (
                        <div style={{ marginTop: "10px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "11px", color: "#d4d4d8" }}>
                          <span>Periode Aktif: <strong>{labelPeriodeCetak()}</strong></span>
                          <span>Pemasukan Periode: <strong style={{ color: "#22c55e" }}>+Rp {filteredTotalIn.toLocaleString("id-ID")}</strong></span>
                          <span>Pengeluaran Periode: <strong style={{ color: "#ef4444" }}>-Rp {filteredTotalOut.toLocaleString("id-ID")}</strong></span>
                          <span>Selisih: <strong style={{ color: "#60a5fa" }}>Rp {filteredSaldoBersih.toLocaleString("id-ID")}</strong></span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div style={{ ...styles.card, marginTop: "16px" }} className="login-card-animated">
                    <h3 style={styles.cardTitle}>Kelola Anggota</h3>
                    <form onSubmit={handleTambahAnggota} style={styles.subFormContainer}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                        <input type="text" placeholder="Nama Lengkap" value={addName} onChange={(e) => setAddName(e.target.value)} required style={styles.inputSm} className="form-field" />
                        <input type="email" placeholder="Email" value={addEmail} onChange={(e) => setAddEmail(e.target.value)} required style={styles.inputSm} className="form-field" />
                        <input type="password" placeholder="Kata Sandi" value={addPass} onChange={(e) => setAddPass(e.target.value)} required style={styles.inputSm} className="form-field" />
                        <select value={addRole} onChange={(e) => setAddRole(e.target.value)} style={{ ...styles.inputSm, background: "#09090b" }}>
                          <option value="anggota">Anggota</option>
                          <option value="admin">Admin</option>
                        </select>
                        <button type="submit" style={styles.btnSaveSm} className="btn-action">Tambah</button>
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
                                  <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} style={styles.inputSm} className="form-field" />
                                ) : (
                                  m.name
                                )}
                              </td>
                              <td style={styles.tdMuted}>
                                {editingUserId === m.id ? (
                                  <input type="email" value={editEmail} onChange={(e) => setEditEmail(e.target.value)} style={styles.inputSm} className="form-field" />
                                ) : (
                                  m.email
                                )}
                              </td>
                              <td style={styles.td}>
                                {editingUserId === m.id ? (
                                  <select value={editRole} onChange={(e) => setEditRole(e.target.value)} style={styles.inputSm}>
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
                                  <button onClick={() => handleSaveEditAnggota(m.id)} style={styles.btnSaveSm} className="btn-action">Simpan</button>
                                ) : (
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    <button onClick={() => { setEditingUserId(m.id); setEditName(m.name); setEditEmail(m.email); setEditPass(m.password); setEditRole(m.role || "anggota"); }} style={styles.btnEdit} className="btn-action">Ubah</button>
                                    <button onClick={() => handleHapusAnggota(m.id, m.name)} style={styles.btnReject} className="btn-action">Hapus</button>
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
                    <h3 style={styles.cardTitle}>Rincian Pengeluaran Kas {hasActiveFilter ? `(${labelPeriodeCetak()})` : ""}</h3>
                    <form onSubmit={handleTambahKasKeluar} style={styles.subFormContainer}>
                      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "8px" }}>
                        <input type="text" placeholder="Keterangan Pengeluaran" value={outKeterangan} onChange={(e) => setOutKeterangan(e.target.value)} required style={styles.inputSm} className="form-field" />
                        <input type="number" placeholder="Jumlah (Rp)" value={outAmount} onChange={(e) => setOutAmount(e.target.value)} required style={styles.inputSm} className="form-field" />
                        <input type="date" value={outDate} onChange={(e) => setOutDate(e.target.value)} style={{ ...styles.inputSm, colorScheme: "dark" }} className="form-field" />
                        <button type="submit" style={styles.btnReject} className="btn-action">Catat Pengeluaran</button>
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
                          {filteredKasKeluarAdmin.length === 0 ? (
                            <tr><td colSpan="3" style={styles.tdEmpty}>Belum ada data pengeluaran pada periode ini.</td></tr>
                          ) : (
                            filteredKasKeluarAdmin.map((item) => (
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
                      <h3 style={{ ...styles.cardTitle, margin: 0 }}>Rincian Pembayaran Masuk {hasActiveFilter ? `(${labelPeriodeCetak()})` : ""}</h3>
                      <button type="button" onClick={handlePrintReport} style={{ ...styles.btnEdit, background: "#16a34a" }} className="btn-action">
                        🖨️ Cetak Laporan PDF
                      </button>
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
                            <tr><td colSpan="5" style={styles.tdEmpty}>Tidak ada data pembayaran pada periode ini.</td></tr>
                          ) : (
                            filteredTransaksiAdmin.map((item) => (
                              <tr key={item.id} style={styles.tr}>
                                <td style={styles.tdMuted}>{item.transaction_date || "-"}</td>
                                <td style={styles.tdWhite}>{item.payer_name || item.keterangan || "-"}</td>
                                <td style={styles.tdGreen}>+Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}</td>
                                <td style={styles.td}>
                                  <span style={((item.status || "").toLowerCase() === "settlement" || (item.status || "").toLowerCase() === "lunas") ? styles.badgeSuccess : (item.status || "").toLowerCase() === "ditolak" ? styles.badgeDanger : styles.badgePending}>
                                    {formatStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td style={{ ...styles.td, textAlign: "right" }}>
                                  <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                                    {item.description && item.description.startsWith("data:image") && (
                                      <button onClick={() => setSelectedProof(item.description)} style={styles.btnProof} className="btn-action">Bukti</button>
                                    )}
                                    {((item.status || "").toLowerCase() === "pending" || !item.status) && (
                                      <>
                                        <button onClick={() => handleVerifikasi(item.id)} style={styles.btnApprove} className="btn-action">Setujui</button>
                                        <button onClick={() => handleTolak(item.id)} style={styles.btnReject} className="btn-action">Tolak</button>
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
    </div>
  );
}

const styles = {
  appWrapper: { minHeight: "100vh", position: "relative", color: "#f4f4f5", background: "transparent", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" },
  toastContainer: { position: "fixed", bottom: "20px", right: "20px", background: "rgba(24, 24, 27, 0.9)", backdropFilter: "blur(12px)", color: "#f4f4f5", border: "1px solid rgba(255, 255, 255, 0.15)", padding: "10px 16px", borderRadius: "8px", fontSize: "12px", zIndex: 10000 },
  loginContainer: { minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  loginCard: { background: "rgba(15, 15, 20, 0.65)", backdropFilter: "blur(16px)", WebkitBackdropFilter: "blur(16px)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "16px", padding: "24px", width: "100%", maxWidth: "350px", boxShadow: "0 20px 50px rgba(0, 0, 0, 0.75)" },
  loginTitle: { fontSize: "16px", fontWeight: "600", color: "#f4f4f5", margin: "10px 0 2px 0" },
  loginSub: { fontSize: "12px", color: "#a1a1aa", margin: 0 },
  label: { display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "500" },
  input: { width: "100%", padding: "9px 12px", background: "rgba(9, 9, 11, 0.75)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f4f4f5", borderRadius: "6px", boxSizing: "border-box", fontSize: "13px" },
  inputSm: { padding: "6px 10px", background: "rgba(9, 9, 11, 0.75)", border: "1px solid rgba(255, 255, 255, 0.1)", color: "#f4f4f5", borderRadius: "6px", fontSize: "12px", width: "100%", boxSizing: "border-box" },
  btnEye: { position: "absolute", right: "8px", background: "none", border: "none", color: "#a1a1aa", cursor: "pointer" },
  btnLogin: { width: "100%", padding: "9px", background: "#2563eb", color: "#ffffff", border: "none", borderRadius: "6px", fontWeight: "600", cursor: "pointer", fontSize: "13px" },
  errorBox: { background: "rgba(127, 29, 29, 0.35)", border: "1px solid #7f1d1d", color: "#fca5a5", padding: "8px 12px", borderRadius: "6px", fontSize: "12px", marginBottom: "12px" },
  navbarSticky: { position: "sticky", top: 0, zIndex: 999, padding: "12px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(15, 15, 20, 0.75)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", borderBottom: "1px solid rgba(255, 255, 255, 0.08)", boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)" },
  navTitle: { fontWeight: "600", fontSize: "13px", color: "#f4f4f5" },
  userBadge: { display: "flex", alignItems: "center", gap: "8px", background: "rgba(9, 9, 11, 0.7)", padding: "4px 8px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.1)" },
  badgeAdmin: { background: "#2563eb", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "700" },
  badgeMember: { background: "#16a34a", color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "700" },
  btnLogout: { background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer" },
  heroGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" },
  card: { background: "rgba(18, 18, 23, 0.75)", backdropFilter: "blur(14px)", WebkitBackdropFilter: "blur(14px)", border: "1px solid rgba(255, 255, 255, 0.08)", borderRadius: "12px", padding: "16px", boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)" },
  cardHeaderLabel: { fontSize: "11px", fontWeight: "600", color: "#a1a1aa" },
  statNumber: { fontSize: "26px", color: "#22c55e", margin: "4px 0", fontWeight: "700" },
  cardTitle: { fontSize: "13px", fontWeight: "600", marginTop: 0, marginBottom: "12px", color: "#f4f4f5" },
  subFormContainer: { marginBottom: "14px", background: "rgba(9, 9, 11, 0.65)", padding: "10px", borderRadius: "6px", border: "1px solid rgba(255, 255, 255, 0.08)" },
  btnSaveSm: { background: "#16a34a", color: "#fff", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "600", cursor: "pointer", width: "100%" },
  btnEdit: { background: "#2563eb", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "11px", fontWeight: "500", cursor: "pointer" },
  table: { width: "100%", borderCollapse: "collapse", fontSize: "12px" },
  th: { textAlign: "left", padding: "8px 6px", color: "#a1a1aa", fontSize: "11px", borderBottom: "1px solid rgba(255, 255, 255, 0.1)", fontWeight: "600" },
  tr: { borderBottom: "1px solid rgba(255, 255, 255, 0.06)" },
  td: { padding: "8px 6px" },
  tdMuted: { padding: "8px 6px", color: "#a1a1aa" },
  tdWhite: { padding: "8px 6px", color: "#f4f4f5" },
  tdGreen: { padding: "8px 6px", color: "#22c55e", fontWeight: "600" },
  tdEmpty: { padding: "16px", textAlign: "center", color: "#a1a1aa" },
  badgeSuccess: { background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  badgeDanger: { background: "rgba(239, 68, 68, 0.15)", color: "#ef4444", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  badgePending: { background: "rgba(234, 179, 8, 0.15)", color: "#eab308", padding: "2px 6px", borderRadius: "4px", fontSize: "10px" },
  btnProof: { background: "#6d28d9", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnApprove: { background: "#16a34a", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  btnReject: { background: "#dc2626", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "10px", cursor: "pointer" },
  modalOverlay: { position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(0,0,0,0.8)", backdropFilter: "blur(6px)", zIndex: 9999, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" },
  modalContent: { background: "rgba(24, 24, 27, 0.92)", border: "1px solid rgba(255, 255, 255, 0.12)", borderRadius: "10px", padding: "16px", maxWidth: "400px", width: "100%", textAlign: "center" },
  modalHeader: { margin: "0 0 10px 0", fontSize: "13px", color: "#f4f4f5" },
  proofImg: { width: "100%", maxHeight: "55vh", objectFit: "contain", borderRadius: "6px", border: "1px solid #27272a" },
  btnCloseModal: { marginTop: "10px", background: "#dc2626", color: "#fff", border: "none", padding: "6px 12px", borderRadius: "6px", fontSize: "11px", cursor: "pointer" },
};

export default App;