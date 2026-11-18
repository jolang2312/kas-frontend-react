import React, { useState, useEffect, useMemo } from "react";
import InputForm from "./components/InputForm";
import Background3D from "./components/Background3D";
import Mini3D from "./components/Mini3D";
import { supabase } from "./supabaseClient";
import logoImg from "./assets/logo.jpeg";
import "./index.css";
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Wallet,
  User,
  Users,
  Calendar,
  Printer,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Clock,
  Sparkles,
  Activity,
  Lock,
  Mail,
  LogOut,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  AlertCircle,
  FileText,
  SlidersHorizontal,
  ChevronRight,
  Download,
  Search,
  PieChart,
  Check,
} from "lucide-react";

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
  const [activeTerrain, setActiveTerrain] = useState("all"); // 'all' | 'in' | 'out'
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'settlement' | 'pending' | 'ditolak'
  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);

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

  const refreshAllData = async () => {
    setRefreshing(true);
    await Promise.all([
      fetchTransaksi(),
      fetchKasKeluar(),
      user?.role === "admin" ? fetchAnggota() : Promise.resolve(),
    ]);
    setTimeout(() => {
      setRefreshing(false);
      showToast("Data kas berhasil disinkronisasi");
    }, 450);
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
    setSearchQuery("");
    setStatusFilter("all");
  };

  const myTransaksiAll = useMemo(() => {
    return transaksi.filter((item) => {
      if (!user?.name) return false;
      const currentUserName = user.name.toLowerCase().trim();
      const rawPayer = (item.payer_name || item.keterangan || "").toLowerCase();
      const cleanPayer = rawPayer.split("-")[0].trim();
      if (!cleanPayer) return false;
      return cleanPayer.includes(currentUserName) || currentUserName.includes(cleanPayer);
    });
  }, [transaksi, user]);

  const myTransaksiFiltered = useMemo(() => {
    return myTransaksiAll.filter((item) => {
      const matchesDate = isWithinDateRange(item.transaction_date, filterStartDate, filterEndDate);
      const matchesSearch = searchQuery
        ? (item.payer_name || item.keterangan || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          String(item.amount || item.jumlah || "").includes(searchQuery.trim())
        : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "settlement"
          ? (item.status || "").toLowerCase() === "settlement" || (item.status || "").toLowerCase() === "lunas"
          : (item.status || "").toLowerCase() === statusFilter;

      return matchesDate && matchesSearch && matchesStatus;
    });
  }, [myTransaksiAll, filterStartDate, filterEndDate, searchQuery, statusFilter]);

  const totalIn = useMemo(() => {
    return transaksi
      .filter((t) => {
        const st = (t.status || "").toLowerCase();
        return st === "settlement" || st === "lunas";
      })
      .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);
  }, [transaksi]);

  const totalOut = useMemo(() => {
    return kasKeluar.reduce(
      (acc, c) => acc + (parseInt(c.amount || 0) || 0),
      0
    );
  }, [kasKeluar]);

  const saldoBersih = totalIn - totalOut;

  const totalVerifiedUser = useMemo(() => {
    return myTransaksiAll
      .filter((t) => {
        const st = (t.status || "").toLowerCase();
        return st === "settlement" || st === "lunas";
      })
      .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);
  }, [myTransaksiAll]);

  const myFilteredVerifiedUser = useMemo(() => {
    return myTransaksiFiltered
      .filter((t) => {
        const st = (t.status || "").toLowerCase();
        return st === "settlement" || st === "lunas";
      })
      .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);
  }, [myTransaksiFiltered]);

  const filteredTransaksiAdmin = useMemo(() => {
    return transaksi.filter((item) => {
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
      const matchesSearch = searchQuery
        ? (item.payer_name || item.keterangan || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          String(item.amount || item.jumlah || "").includes(searchQuery.trim())
        : true;
      const matchesStatus =
        statusFilter === "all"
          ? true
          : statusFilter === "settlement"
          ? (item.status || "").toLowerCase() === "settlement" || (item.status || "").toLowerCase() === "lunas"
          : (item.status || "").toLowerCase() === statusFilter;

      return matchesDateRange && matchesName && matchesSearch && matchesStatus;
    });
  }, [transaksi, filterStartDate, filterEndDate, filterMemberName, searchQuery, statusFilter]);

  const filteredKasKeluarAdmin = useMemo(() => {
    return kasKeluar.filter((item) => {
      const matchesDate = isWithinDateRange(item.expense_date, filterStartDate, filterEndDate);
      const matchesSearch = searchQuery
        ? (item.title || "").toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
          String(item.amount || "").includes(searchQuery.trim())
        : true;
      return matchesDate && matchesSearch;
    });
  }, [kasKeluar, filterStartDate, filterEndDate, searchQuery]);

  const filteredTotalIn = useMemo(() => {
    return filteredTransaksiAdmin
      .filter((t) => {
        const st = (t.status || "").toLowerCase();
        return st === "settlement" || st === "lunas";
      })
      .reduce((acc, c) => acc + (parseInt(c.amount || c.jumlah || 0) || 0), 0);
  }, [filteredTransaksiAdmin]);

  const filteredTotalOut = useMemo(() => {
    return filteredKasKeluarAdmin.reduce(
      (acc, c) => acc + (parseInt(c.amount || 0) || 0),
      0
    );
  }, [filteredKasKeluarAdmin]);

  const filteredSaldoBersih = filteredTotalIn - filteredTotalOut;

  const hasActiveFilter = Boolean(
    filterStartDate || filterEndDate || filterMemberName || searchQuery || statusFilter !== "all"
  );

  const pendingCount = transaksi.filter(
    (t) => !t.status || t.status.toLowerCase() === "pending"
  ).length;

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

  const tanggalCetak = new Date().toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // --- RASIO KEUANGAN & PROGRESS SEHAT ---
  const kasHealthRatio = useMemo(() => {
    if (totalIn <= 0) return 100;
    const ratio = Math.max(0, Math.min(100, Math.round(((totalIn - totalOut) / totalIn) * 100)));
    return ratio;
  }, [totalIn, totalOut]);

  // --- EXPORT TO CSV EXCEL FILE ---
  const handleExportCSV = () => {
    const escapeCsv = (str) => `"${String(str ?? "").replace(/"/g, '""')}"`;
    let rows = [];

    if (isAdmin) {
      rows.push(["LAPORAN KAS SOUTHERN BASE", `Periode: ${labelPeriodeCetak()}`]);
      rows.push(["Dicetak Oleh:", user?.name || "Admin", "Tanggal:", tanggalCetak]);
      rows.push([]);
      rows.push(["RINCIAN PEMBAYARAN KAS MASUK"]);
      rows.push(["No", "Tanggal", "Pembayar / Anggota", "Nominal (Rp)", "Status", "Metode"]);

      filteredTransaksiAdmin.forEach((t, i) => {
        rows.push([
          i + 1,
          t.transaction_date || "-",
          t.payer_name || t.keterangan || "-",
          parseInt(t.amount || t.jumlah || 0),
          formatStatusLabel(t.status),
          t.payment_method || "DANA",
        ]);
      });

      rows.push([]);
      rows.push(["RINCIAN PENGELUARAN KAS"]);
      rows.push(["No", "Tanggal", "Keterangan Pengeluaran", "Nominal (Rp)"]);

      filteredKasKeluarAdmin.forEach((k, i) => {
        rows.push([
          i + 1,
          k.expense_date || "-",
          k.title || "-",
          parseInt(k.amount || 0),
        ]);
      });

      rows.push([]);
      rows.push(["REKAPITULASI"]);
      rows.push(["Total Pemasukan Disetujui", filteredTotalIn]);
      rows.push(["Total Pengeluaran Kas", filteredTotalOut]);
      rows.push(["Saldo Bersih", filteredSaldoBersih]);
    } else {
      rows.push([`RIWAYAT PEMBAYARAN KAS — ${user?.name || "ANGGOTA"}`]);
      rows.push(["Periode:", labelPeriodeCetak()]);
      rows.push([]);
      rows.push(["No", "Tanggal", "Keterangan", "Nominal (Rp)", "Status"]);

      myTransaksiFiltered.forEach((t, i) => {
        rows.push([
          i + 1,
          t.transaction_date || "-",
          t.payer_name || t.keterangan || "-",
          parseInt(t.amount || t.jumlah || 0),
          formatStatusLabel(t.status),
        ]);
      });

      rows.push([]);
      rows.push(["Total Disetujui Periode Ini", myFilteredVerifiedUser]);
    }

    const csvContent =
      "\uFEFF" +
      rows
        .map((r) => r.map(escapeCsv).join(","))
        .join("\r\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute(
      "download",
      `Laporan_Kas_SouthernBase_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast("File CSV berhasil diexport!");
  };

  // --- PRINT PDF POPUP WINDOW ---
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
            object-fit: contain;
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

  return (
    <div className="relative min-h-screen text-zinc-100 selection:bg-orange-500/30 selection:text-white">
      {/* Background Lighting Halos */}
      <div className="fixed top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-600/10 blur-[130px] pointer-events-none z-0" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[600px] h-[600px] rounded-full bg-blue-600/10 blur-[150px] pointer-events-none z-0" />

      {/* Toast Notification with Progress Bar */}
      {toastMsg && (
        <div className="fixed bottom-6 right-6 z-[99999] animate-fade-up">
          <div className="flex items-center gap-3 px-5 py-3.5 bg-zinc-950/90 border border-zinc-700/60 rounded-xl shadow-[0_10px_35px_rgba(0,0,0,0.8)] backdrop-blur-xl">
            <Sparkles className="w-4 h-4 text-orange-400 animate-spin" style={{ animationDuration: "3s" }} />
            <span className="text-xs font-semibold tracking-wide text-zinc-200">{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Proof Preview Modal */}
      {selectedProof && (
        <div
          onClick={() => setSelectedProof(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md z-[99999] flex items-center justify-center p-4 animate-fade-up"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="cyber-card p-6 max-w-lg w-full text-center relative border border-zinc-700/60"
          >
            <div className="flex items-center justify-between pb-3 mb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-bold text-white tracking-wide">Bukti Verifikasi Pembayaran</h4>
              </div>
              <button
                onClick={() => setSelectedProof(null)}
                className="text-zinc-400 hover:text-white transition text-xs font-mono px-2 py-1 bg-zinc-800/80 rounded"
              >
                ESC / Tutup ✕
              </button>
            </div>
            <div className="overflow-hidden rounded-xl border border-zinc-800 bg-zinc-950/70 p-2">
              <img
                src={selectedProof}
                alt="Bukti Transfer"
                className="w-full max-h-[60vh] object-contain rounded-lg"
              />
            </div>
            <button
              onClick={() => setSelectedProof(null)}
              className="mt-5 w-full py-2.5 bg-gradient-to-r from-red-600 to-rose-700 hover:from-red-500 hover:to-rose-600 text-white rounded-xl text-xs font-bold transition shadow-lg shadow-red-950/40"
            >
              Tutup Pratinjau
            </button>
          </div>
        </div>
      )}

      {/* 3D Kinetic Background Engine */}
      <Background3D role={user ? user.role : "anggota"} isLogin={!user} />

      {/* VIEW: LOGIN PORTAL */}
      {!user ? (
        <div className="relative z-10 min-h-screen flex items-center justify-center px-4 py-8">
          <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Left Column: Southern Base Community Branding */}
            <div className="lg:col-span-6 space-y-6">
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/25 text-[10px] font-mono tracking-widest text-orange-400 uppercase mb-3 shadow-[0_0_20px_rgba(249,115,22,0.2)]">
                  <span className="pulse-dot-orange" />
                  SOUTHERN BASE // COMMUNITY VAULT V2.5
                </div>

                <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-titanium uppercase leading-none">
                  ONE BASE.<br />
                  <span className="text-gold-titanium">ONE SOLIDARITY.</span>
                </h1>

                <p className="text-xs sm:text-sm text-zinc-400 mt-3 max-w-md leading-relaxed">
                  Platform transparansi & pembukuan kas resmi Southern Base. Rekapitulasi keuangan akurat, terpercaya, dan aman untuk mengawal setiap pergerakan kita bersama.
                </p>
              </div>

              {/* Login Form Terminal */}
              <div className="cyber-card p-6 sm:p-7 border border-white/10 shadow-[0_25px_60px_rgba(0,0,0,0.85)] max-w-md">
                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-zinc-800/80">
                  <img
                    src={logoImg}
                    alt="Logo Southern Base"
                    className="w-10 h-10 rounded-xl object-contain bg-white p-1 border border-white/20 shadow-md"
                  />
                  <div>
                    <h3 className="text-sm font-bold text-white tracking-wide uppercase">Portal Akses Anggota</h3>
                    <p className="text-[11px] text-zinc-400">Silakan otorisasi akun Southern Base Anda</p>
                  </div>
                </div>

                {loginError && (
                  <div className="flex items-center gap-2 mb-4 p-3 rounded-xl bg-red-950/60 border border-red-800 text-red-200 text-xs font-medium">
                    <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>{loginError}</span>
                  </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      <span>Alamat Email</span>
                      <Mail className="w-3.5 h-3.5 text-zinc-500" />
                    </label>
                    <input
                      type="email"
                      placeholder="nama@southernbase.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder-zinc-600 text-xs font-medium transition outline-none"
                    />
                  </div>

                  <div>
                    <label className="flex items-center justify-between text-[11px] font-semibold text-zinc-400 uppercase tracking-wider mb-1.5">
                      <span>Kata Sandi</span>
                      <Lock className="w-3.5 h-3.5 text-zinc-500" />
                    </label>
                    <div className="relative">
                      <input
                        type={showPassword ? "text" : "password"}
                        placeholder="••••••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="w-full px-3.5 py-2.5 pr-11 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 text-zinc-100 placeholder-zinc-600 text-xs font-medium transition outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-300 transition"
                      >
                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loadingLogin}
                    className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-orange-600 via-amber-600 to-orange-500 hover:from-orange-500 hover:to-amber-500 text-white font-bold text-xs tracking-wider uppercase transition shadow-[0_0_25px_rgba(249,115,22,0.35)] btn-shimmer flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {loadingLogin ? (
                      <>
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        <span>Memverifikasi Akun...</span>
                      </>
                    ) : (
                      <>
                        <span>Masuk ke Portal Kas</span>
                        <ChevronRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </form>

                {/* Telemetry Pills */}
                <div className="mt-5 pt-4 border-t border-zinc-800/80 flex items-center justify-between text-[10px] text-zinc-500 font-mono">
                  <span className="flex items-center gap-1.5">
                    <span className="pulse-dot-green" /> CLOUD SYNCED
                  </span>
                  <span>256-BIT ENCRYPTED</span>
                </div>
              </div>
            </div>

            {/* Right Column: Dedicated 3D Kinetic Vault Stage */}
            <div className="hidden lg:block lg:col-span-6 min-h-[500px] pointer-events-none" />

          </div>
        </div>
      ) : (
        /* VIEW: AUTHENTICATED DASHBOARD */
        <div className="relative z-10 pb-16">
          {/* Top Sticky Command Navbar */}
          <header className="sticky top-0 z-50 px-4 sm:px-8 py-3 bg-zinc-950/80 border-b border-white/10 backdrop-blur-xl shadow-2xl">
            <div className="max-w-6xl mx-auto flex items-center justify-between">
              {/* Logo, Mini3D Ring & Equalizer Wave */}
              <div className="flex items-center gap-3">
                <div className="relative flex items-center gap-2">
                  <img
                    src={logoImg}
                    alt="Logo"
                    className="w-8 h-8 rounded-lg object-contain bg-white p-0.5 border border-white/20 shadow-md"
                  />
                  <div className="hidden sm:block">
                    <Mini3D color={isAdmin ? 0x3b82f6 : 0xf97316} />
                  </div>
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-extrabold tracking-tight text-white uppercase">
                      SOUTHERN BASE
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase tracking-wider ${
                        isAdmin
                          ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                          : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                      }`}
                    >
                      {isAdmin ? "MASTER CONTROL" : "MEMBER PORTAL"}
                    </span>
                  </div>
                  {/* Cyber Equalizer Effect */}
                  <div className="hidden sm:flex items-center gap-1 mt-0.5">
                    <span className="eq-bar eq-bar-1" />
                    <span className="eq-bar eq-bar-2" />
                    <span className="eq-bar eq-bar-3" />
                    <span className="eq-bar eq-bar-4" />
                    <span className="text-[10px] font-mono text-zinc-400 ml-1.5">
                      LIVE SYSTEM SYNCHRONIZED
                    </span>
                  </div>
                </div>
              </div>

              {/* User Controls & Logout */}
              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={refreshAllData}
                  disabled={refreshing}
                  title="Segarkan Data"
                  className="p-2 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? "animate-spin text-orange-400" : ""}`} />
                </button>

                <div className="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-tr from-orange-500 to-amber-400 flex items-center justify-center text-black font-black text-xs">
                    {user.name ? user.name.charAt(0).toUpperCase() : "U"}
                  </div>
                  <div className="text-left hidden md:block">
                    <div className="text-xs font-bold text-white leading-tight">{user.name}</div>
                    <div className="text-[9px] font-mono text-zinc-400 uppercase">{user.role}</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 hover:border-red-500 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Keluar</span>
                </button>
              </div>
            </div>
          </header>

          {/* Main Dashboard Container */}
          <main className="max-w-6xl mx-auto px-4 sm:px-6 mt-6 space-y-6">
            {/* HERO STATS / THREE TERRAINS HUD */}
            <div className="space-y-4">
              {/* Header Headline Tag */}
              <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
                <div>
                  <div className="inline-flex items-center gap-2 text-[10px] font-mono text-orange-400 uppercase tracking-widest mb-1">
                    <span className="pulse-dot-orange" />
                    <span>SOUTHERN BASE ARCHITECTURE // KEUANGAN & KAS ORGANISASI</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-titanium uppercase tracking-tight">
                    {isAdmin ? "Status Perbendaharaan Utama" : `Ringkasan Saldo Kas • ${user.name}`}
                  </h2>
                </div>

                {/* Quick Action Badges: Export CSV & Cetak PDF */}
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    type="button"
                    onClick={handleExportCSV}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs shadow-lg shadow-blue-950/40 btn-shimmer transition"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export CSV</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReport}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-lg shadow-emerald-950/40 btn-shimmer transition"
                  >
                    <Printer className="w-3.5 h-3.5" />
                    <span>Cetak PDF</span>
                  </button>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={handleSetBulanIni}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white border border-zinc-700 text-xs font-semibold transition"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Bulan Ini</span>
                    </button>
                  )}
                </div>
              </div>

              {/* THREE TERRAINS INTERACTIVE CARDS */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Terrain 1: Total Saldo Bersih */}
                <div
                  onClick={() => setActiveTerrain(activeTerrain === "all" ? "all" : "all")}
                  className={`terrain-card ${
                    activeTerrain === "all" ? "active-orange" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">
                      {isAdmin ? "TERRAIN 01 // TOTAL SALDO BERSIH" : "TERRAIN 01 // KAS SAYA TERVERIFIKASI"}
                    </span>
                    <Wallet className="w-4 h-4 text-orange-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-gold-titanium tracking-tight font-mono-tech">
                    Rp {(isAdmin ? saldoBersih : totalVerifiedUser).toLocaleString("id-ID")}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1 text-emerald-400">
                      <span className="pulse-dot-green" /> 100% Terverifikasi
                    </span>
                    <span className="font-mono text-zinc-500">REALTIME</span>
                  </div>
                </div>

                {/* Terrain 2: Total Pemasukan Kas */}
                <div
                  onClick={() => setActiveTerrain(activeTerrain === "in" ? "all" : "in")}
                  className={`terrain-card ${
                    activeTerrain === "in" ? "active-blue" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">
                      TERRAIN 02 // TOTAL KAS MASUK
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-neon-emerald tracking-tight font-mono-tech">
                    +Rp {totalIn.toLocaleString("id-ID")}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                    <span>{transaksi.length} Transaksi Terdata</span>
                    {pendingCount > 0 && (
                      <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                        {pendingCount} Menunggu
                      </span>
                    )}
                  </div>
                </div>

                {/* Terrain 3: Total Pengeluaran Kas */}
                <div
                  onClick={() => setActiveTerrain(activeTerrain === "out" ? "all" : "out")}
                  className={`terrain-card ${
                    activeTerrain === "out" ? "active-dark" : ""
                  }`}
                >
                  <div className="flex items-center justify-between text-zinc-400 mb-2">
                    <span className="text-[10px] font-mono tracking-wider uppercase">
                      TERRAIN 03 // TOTAL PENGELUARAN
                    </span>
                    <ArrowDownRight className="w-4 h-4 text-red-400" />
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-red-400 tracking-tight font-mono-tech">
                    -Rp {totalOut.toLocaleString("id-ID")}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[11px] text-zinc-400 pt-2 border-t border-white/5">
                    <span>{kasKeluar.length} Pos Pengeluaran</span>
                    <span className="text-zinc-500 font-mono">AUDITED</span>
                  </div>
                </div>
              </div>

              {/* Financial Health Meter Bar */}
              {isAdmin && (
                <div className="cyber-card p-4">
                  <div className="flex items-center justify-between text-xs mb-2">
                    <div className="flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-orange-400" />
                      <span className="font-bold text-white uppercase tracking-wider text-[11px]">
                        Rasio Efisiensi Anggaran & Kesehatan Kas
                      </span>
                    </div>
                    <span className="font-mono font-bold text-emerald-400 text-xs">
                      {kasHealthRatio}% Kas Bersih Tersimpan
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-zinc-900 overflow-hidden flex">
                    <div
                      className="bg-gradient-to-r from-emerald-500 to-cyan-500 h-full transition-all duration-700"
                      style={{ width: `${kasHealthRatio}%` }}
                    />
                    <div
                      className="bg-red-500 h-full transition-all duration-700"
                      style={{ width: `${100 - kasHealthRatio}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-zinc-500 mt-2 font-mono">
                    <span>PEMASUKAN: Rp {totalIn.toLocaleString("id-ID")}</span>
                    <span>PENGELUARAN: Rp {totalOut.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )}
            </div>

            {/* QUICK PROFILE CREDENTIAL MANAGER & NOTIFICATIONS */}
            <div className="cyber-card p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-orange-400" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-white">
                      Pengaturan Akun & Kredensial Pribadi
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Perbarui nama tampilan atau ganti kata sandi akun Anda secara langsung.
                  </p>
                </div>

                <form onSubmit={handleUpdateProfilePribadi} className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    placeholder="Nama Pengguna"
                    value={newUsername}
                    onChange={(e) => setNewUsername(e.target.value)}
                    required
                    className="px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 text-xs text-white placeholder-zinc-600 outline-none transition"
                  />
                  <input
                    type="password"
                    placeholder="Sandi Baru (Opsional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 focus:border-orange-500 text-xs text-white placeholder-zinc-600 outline-none transition"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs btn-shimmer transition shadow-md shadow-emerald-950/30"
                  >
                    Simpan Akun
                  </button>
                </form>
              </div>
            </div>

            {/* MEMBER WORKSPACE VIEW */}
            {!isAdmin && (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Left Column: Form Setoran Pembayaran */}
                <div className="lg:col-span-5 cyber-card p-6">
                  <div className="flex items-center gap-2 pb-3 mb-4 border-b border-zinc-800">
                    <Wallet className="w-4 h-4 text-orange-400" />
                    <h3 className="text-sm font-bold text-white tracking-wide">
                      Formulir Pembayaran Kas
                    </h3>
                  </div>
                  <InputForm onSuccess={fetchTransaksi} />
                </div>

                {/* Right Column: Member History Table */}
                <div className="lg:col-span-7 cyber-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-bold text-white tracking-wide">
                          Riwayat Pembayaran Saya
                        </h3>
                      </div>
                      <span className="text-[11px] text-zinc-400">
                        {myTransaksiFiltered.length} transaksi ditampilkan
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600/30 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintReport}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white border border-emerald-500/30 text-xs font-semibold transition"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>PDF</span>
                      </button>
                    </div>
                  </div>

                  {/* Search & Status Filter Sub-Bar */}
                  <div className="mb-4 space-y-2">
                    <div className="p-3 rounded-xl bg-zinc-950/60 border border-zinc-800 flex flex-wrap items-center gap-2">
                      <div className="relative flex-1 min-w-[160px]">
                        <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="text"
                          placeholder="Cari transaksi / keterangan..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-blue-500 transition"
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={filterStartDate}
                          onChange={(e) => setFilterStartDate(e.target.value)}
                          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none"
                        />
                        <span className="text-zinc-500 text-xs">-</span>
                        <input
                          type="date"
                          value={filterEndDate}
                          onChange={(e) => setFilterEndDate(e.target.value)}
                          className="px-2 py-1 rounded bg-zinc-900 border border-zinc-800 text-xs text-zinc-200 outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="px-3 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-xs text-zinc-300 transition"
                      >
                        Reset
                      </button>
                    </div>

                    {/* Status Pill Filters */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {[
                        { id: "all", label: "Semua" },
                        { id: "settlement", label: "Disetujui" },
                        { id: "pending", label: "Menunggu" },
                        { id: "ditolak", label: "Ditolak" },
                      ].map((st) => (
                        <button
                          key={st.id}
                          type="button"
                          onClick={() => setStatusFilter(st.id)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                            statusFilter === st.id
                              ? "bg-orange-500 text-white shadow-md shadow-orange-950/40"
                              : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                          }`}
                        >
                          {st.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Table */}
                  <div className="overflow-x-auto">
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          <th>TANGGAL</th>
                          <th>NOMINAL</th>
                          <th>STATUS</th>
                          <th className="text-right">BUKTI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {myTransaksiFiltered.length === 0 ? (
                          <tr>
                            <td colSpan="4" className="text-center py-8 text-zinc-500 text-xs">
                              Belum ada catatan transaksi pada filter ini.
                            </td>
                          </tr>
                        ) : (
                          myTransaksiFiltered.map((item) => {
                            const isApproved =
                              (item.status || "").toLowerCase() === "settlement" ||
                              (item.status || "").toLowerCase() === "lunas";
                            const isRejected = (item.status || "").toLowerCase() === "ditolak";

                            return (
                              <tr key={item.id}>
                                <td className="text-zinc-400 font-mono text-xs">
                                  {item.transaction_date || "-"}
                                </td>
                                <td className="font-bold text-emerald-400 font-mono">
                                  +Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}
                                </td>
                                <td>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isApproved
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : isRejected
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isApproved ? "bg-emerald-400" : isRejected ? "bg-red-400" : "bg-amber-400"
                                      }`}
                                    />
                                    {formatStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="text-right">
                                  {item.description && item.description.startsWith("data:image") && (
                                    <button
                                      type="button"
                                      onClick={() => setSelectedProof(item.description)}
                                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition"
                                    >
                                      <Eye className="w-3 h-3" />
                                      <span>Lihat</span>
                                    </button>
                                  )}
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* ADMIN MASTER CONTROL HUB */}
            {isAdmin && (
              <div className="space-y-6">
                {/* Filter HUD Controller Bar */}
                <div className="cyber-card p-6 border-blue-500/30">
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <SlidersHorizontal className="w-4 h-4 text-blue-400" />
                        <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                          Filter Periode & Kontrol Laporan
                        </h3>
                      </div>
                      <p className="text-[11px] text-zinc-400 mt-0.5">
                        Saring data transaksi berdasarkan rentang tanggal, nama anggota, kata kunci, dan status pembayaran.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleExportCSV}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold btn-shimmer transition shadow-md shadow-blue-950/40"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Export CSV</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSetBulanIni}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                      >
                        Bulan Ini
                      </button>

                      <button
                        type="button"
                        onClick={handleResetFilter}
                        className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-semibold transition"
                      >
                        Reset Filter
                      </button>

                      <button
                        type="button"
                        onClick={handlePrintReport}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold btn-shimmer transition shadow-lg shadow-emerald-950/50"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak Laporan PDF</span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">DARI TANGGAL (A):</label>
                      <input
                        type="date"
                        value={filterStartDate}
                        onChange={(e) => setFilterStartDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">SAMPAI TANGGAL (B):</label>
                      <input
                        type="date"
                        value={filterEndDate}
                        onChange={(e) => setFilterEndDate(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">CARI ANGGOTA:</label>
                      <input
                        type="text"
                        placeholder="Nama anggota..."
                        value={filterMemberName}
                        onChange={(e) => setFilterMemberName(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-mono text-zinc-400 mb-1">CARI KATA KUNCI / NOMINAL:</label>
                      <input
                        type="text"
                        placeholder="Ketik keterangan / angka..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-zinc-950/80 border border-zinc-800 text-xs text-white placeholder-zinc-600 outline-none focus:border-blue-500 transition"
                      />
                    </div>
                  </div>

                  {/* Status Pills */}
                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] font-mono text-zinc-500 mr-1">STATUS:</span>
                    {[
                      { id: "all", label: "Semua" },
                      { id: "settlement", label: "Disetujui" },
                      { id: "pending", label: "Menunggu" },
                      { id: "ditolak", label: "Ditolak" },
                    ].map((st) => (
                      <button
                        key={st.id}
                        type="button"
                        onClick={() => setStatusFilter(st.id)}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition ${
                          statusFilter === st.id
                            ? "bg-blue-600 text-white shadow-md shadow-blue-950/40"
                            : "bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800"
                        }`}
                      >
                        {st.label}
                      </button>
                    ))}
                  </div>

                  {hasActiveFilter && (
                    <div className="mt-4 pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-4 text-xs font-mono">
                      <span className="text-zinc-400">Periode: <strong className="text-white">{labelPeriodeCetak()}</strong></span>
                      <span className="text-zinc-400">Masuk: <strong className="text-emerald-400">+Rp {filteredTotalIn.toLocaleString("id-ID")}</strong></span>
                      <span className="text-zinc-400">Keluar: <strong className="text-red-400">-Rp {filteredTotalOut.toLocaleString("id-ID")}</strong></span>
                      <span className="text-zinc-400">Selisih: <strong className="text-cyan-400">Rp {filteredSaldoBersih.toLocaleString("id-ID")}</strong></span>
                    </div>
                  )}
                </div>

                {/* Section 1: Inflow Transactions (Pemasukan Kas) */}
                <div className="cyber-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Rincian Pembayaran Kas Masuk {hasActiveFilter ? `(${labelPeriodeCetak()})` : ""}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      Total: <strong className="text-emerald-400">+Rp {filteredTotalIn.toLocaleString("id-ID")}</strong>
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          <th>TANGGAL</th>
                          <th>PEMBAYAR / ANGGOTA</th>
                          <th>NOMINAL</th>
                          <th>STATUS</th>
                          <th className="text-right">AKSI VERIFIKASI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredTransaksiAdmin.length === 0 ? (
                          <tr>
                            <td colSpan="5" className="text-center py-8 text-zinc-500 text-xs">
                              Tidak ada data pembayaran kas pada periode ini.
                            </td>
                          </tr>
                        ) : (
                          filteredTransaksiAdmin.map((item) => {
                            const isApproved =
                              (item.status || "").toLowerCase() === "settlement" ||
                              (item.status || "").toLowerCase() === "lunas";
                            const isRejected = (item.status || "").toLowerCase() === "ditolak";
                            const isPending = !isApproved && !isRejected;

                            return (
                              <tr key={item.id}>
                                <td className="text-zinc-400 font-mono text-xs">
                                  {item.transaction_date || "-"}
                                </td>
                                <td className="font-semibold text-white">
                                  {item.payer_name || item.keterangan || "-"}
                                </td>
                                <td className="font-bold text-emerald-400 font-mono">
                                  +Rp {parseInt(item.amount || item.jumlah || 0).toLocaleString("id-ID")}
                                </td>
                                <td>
                                  <span
                                    className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                                      isApproved
                                        ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                        : isRejected
                                        ? "bg-red-500/20 text-red-400 border border-red-500/30"
                                        : "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                                    }`}
                                  >
                                    <span
                                      className={`w-1.5 h-1.5 rounded-full ${
                                        isApproved ? "bg-emerald-400" : isRejected ? "bg-red-400" : "bg-amber-400"
                                      }`}
                                    />
                                    {formatStatusLabel(item.status)}
                                  </span>
                                </td>
                                <td className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    {item.description && item.description.startsWith("data:image") && (
                                      <button
                                        type="button"
                                        onClick={() => setSelectedProof(item.description)}
                                        className="px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-[11px] font-semibold transition"
                                      >
                                        Bukti
                                      </button>
                                    )}
                                    {isPending && (
                                      <>
                                        <button
                                          type="button"
                                          onClick={() => handleVerifikasi(item.id)}
                                          className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition shadow-md shadow-emerald-950/40"
                                        >
                                          Setujui
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => handleTolak(item.id)}
                                          className="px-2.5 py-1 rounded-lg bg-red-600 hover:bg-red-500 text-white text-[11px] font-bold transition shadow-md shadow-red-950/40"
                                        >
                                          Tolak
                                        </button>
                                      </>
                                    )}
                                  </div>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 2: Outflow Expenses (Pengeluaran Kas) */}
                <div className="cyber-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <ArrowDownRight className="w-4 h-4 text-red-400" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Rincian Pengeluaran Kas {hasActiveFilter ? `(${labelPeriodeCetak()})` : ""}
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      Total: <strong className="text-red-400">-Rp {filteredTotalOut.toLocaleString("id-ID")}</strong>
                    </span>
                  </div>

                  {/* Add Expense Form */}
                  <form onSubmit={handleTambahKasKeluar} className="mb-4 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                      <input
                        type="text"
                        placeholder="Keterangan Pengeluaran"
                        value={outKeterangan}
                        onChange={(e) => setOutKeterangan(e.target.value)}
                        required
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition"
                      />
                      <input
                        type="number"
                        placeholder="Nominal (Rp)"
                        value={outAmount}
                        onChange={(e) => setOutAmount(e.target.value)}
                        required
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500 transition"
                      />
                      <input
                        type="date"
                        value={outDate}
                        onChange={(e) => setOutDate(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-red-500 transition"
                      />
                      <button
                        type="submit"
                        className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs btn-shimmer transition shadow-md shadow-red-950/40"
                      >
                        + Catat Pengeluaran
                      </button>
                    </div>
                  </form>

                  <div className="overflow-x-auto">
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          <th>TANGGAL</th>
                          <th>KETERANGAN PENGELUARAN</th>
                          <th className="text-right">NOMINAL KELUAR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredKasKeluarAdmin.length === 0 ? (
                          <tr>
                            <td colSpan="3" className="text-center py-8 text-zinc-500 text-xs">
                              Tidak ada data pengeluaran kas pada periode ini.
                            </td>
                          </tr>
                        ) : (
                          filteredKasKeluarAdmin.map((item) => (
                            <tr key={item.id}>
                              <td className="text-zinc-400 font-mono text-xs">
                                {item.expense_date || "-"}
                              </td>
                              <td className="text-white font-medium">{item.title}</td>
                              <td className="text-right font-bold text-red-400 font-mono">
                                -Rp {parseInt(item.amount || 0).toLocaleString("id-ID")}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Section 3: Member Management */}
                <div className="cyber-card p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 mb-4 border-b border-zinc-800">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-cyan-400" />
                      <h3 className="text-sm font-extrabold text-white uppercase tracking-wider">
                        Kelola Daftar Anggota Organisasi
                      </h3>
                    </div>
                    <span className="text-xs font-mono text-zinc-400">
                      Total Anggota: <strong className="text-white">{anggotaList.length}</strong>
                    </span>
                  </div>

                  {/* Add Member Form */}
                  <form onSubmit={handleTambahAnggota} className="mb-4 p-3.5 rounded-xl bg-zinc-950/60 border border-zinc-800">
                    <div className="grid grid-cols-1 sm:grid-cols-5 gap-2.5">
                      <input
                        type="text"
                        placeholder="Nama Lengkap"
                        value={addName}
                        onChange={(e) => setAddName(e.target.value)}
                        required
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 transition"
                      />
                      <input
                        type="email"
                        placeholder="Email Anggota"
                        value={addEmail}
                        onChange={(e) => setAddEmail(e.target.value)}
                        required
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 transition"
                      />
                      <input
                        type="password"
                        placeholder="Kata Sandi"
                        value={addPass}
                        onChange={(e) => setAddPass(e.target.value)}
                        required
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white placeholder-zinc-500 outline-none focus:border-cyan-500 transition"
                      />
                      <select
                        value={addRole}
                        onChange={(e) => setAddRole(e.target.value)}
                        className="px-3 py-2 rounded-xl bg-zinc-900 border border-zinc-800 text-xs text-white outline-none focus:border-cyan-500 transition"
                      >
                        <option value="anggota">Anggota</option>
                        <option value="admin">Admin</option>
                      </select>
                      <button
                        type="submit"
                        className="py-2 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs btn-shimmer transition shadow-md shadow-cyan-950/40"
                      >
                        + Tambah Anggota
                      </button>
                    </div>
                  </form>

                  <div className="overflow-x-auto">
                    <table className="cyber-table">
                      <thead>
                        <tr>
                          <th>ID</th>
                          <th>NAMA LENGKAP</th>
                          <th>EMAIL</th>
                          <th>ROLE</th>
                          <th className="text-right">AKSI</th>
                        </tr>
                      </thead>
                      <tbody>
                        {anggotaList.map((m) => (
                          <tr key={m.id}>
                            <td className="font-mono text-zinc-500 text-xs">#{m.id}</td>
                            <td className="text-white font-medium">
                              {editingUserId === m.id ? (
                                <input
                                  type="text"
                                  value={editName}
                                  onChange={(e) => setEditName(e.target.value)}
                                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-white"
                                />
                              ) : (
                                m.name
                              )}
                            </td>
                            <td className="text-zinc-400 text-xs font-mono">
                              {editingUserId === m.id ? (
                                <input
                                  type="email"
                                  value={editEmail}
                                  onChange={(e) => setEditEmail(e.target.value)}
                                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-white"
                                />
                              ) : (
                                m.email
                              )}
                            </td>
                            <td>
                              {editingUserId === m.id ? (
                                <select
                                  value={editRole}
                                  onChange={(e) => setEditRole(e.target.value)}
                                  className="px-2 py-1 rounded bg-zinc-900 border border-zinc-700 text-xs text-white"
                                >
                                  <option value="anggota">Anggota</option>
                                  <option value="admin">Admin</option>
                                </select>
                              ) : (
                                <span
                                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider ${
                                    m.role === "admin"
                                      ? "bg-blue-500/20 text-blue-400 border border-blue-500/30"
                                      : "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                  }`}
                                >
                                  {m.role || "ANGGOTA"}
                                </span>
                              )}
                            </td>
                            <td className="text-right">
                              {editingUserId === m.id ? (
                                <button
                                  type="button"
                                  onClick={() => handleSaveEditAnggota(m.id)}
                                  className="px-3 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition"
                                >
                                  Simpan
                                </button>
                              ) : (
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingUserId(m.id);
                                      setEditName(m.name);
                                      setEditEmail(m.email);
                                      setEditPass(m.password);
                                      setEditRole(m.role || "anggota");
                                    }}
                                    className="px-2.5 py-1 rounded-lg bg-blue-600/20 hover:bg-blue-600 text-blue-300 hover:text-white border border-blue-500/30 text-xs font-semibold transition"
                                  >
                                    Ubah
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleHapusAnggota(m.id, m.name)}
                                    className="px-2.5 py-1 rounded-lg bg-red-600/20 hover:bg-red-600 text-red-300 hover:text-white border border-red-500/30 text-xs font-semibold transition"
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
              </div>
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default App;
