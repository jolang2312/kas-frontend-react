import React, { useState } from "react";
import API from "../api";

const PemasukanForm = ({ onSuccess }) => {
  const [jumlah, setJumlah] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePay = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      // 1. Minta snapToken ke Backend Laravel
      const response = await API.post("/pembayaran", {
        jumlah: parseInt(jumlah),
        keterangan: keterangan,
      });

      const { snapToken } = response.data;

      if (!snapToken) {
        throw new Error("Token pembayaran tidak diterima dari backend.");
      }

      // 2. Cek apakah script Midtrans sudah ter-load
      if (typeof window.snap === "undefined") {
        throw new Error("Script Midtrans Snap belum dimuat di index.html!");
      }

      // 3. Jalankan Pop-Up Midtrans Payment Gateway
      window.snap.pay(snapToken, {
        onSuccess: function (result) {
          alert("Pembayaran Berhasil!");
          setJumlah("");
          setKeterangan("");
          if (onSuccess) onSuccess();
        },
        onPending: function (result) {
          alert("Menunggu Pembayaran Anda...");
          if (onSuccess) onSuccess();
        },
        onError: function (result) {
          alert("Pembayaran Gagal!");
        },
        onClose: function () {
          alert("Popup pembayaran ditutup sebelum transaksi selesai.");
        },
      });
    } catch (err) {
      console.error("Payment Error:", err);
      const msg = err.response?.data?.message || err.message || "Gagal memproses transaksi";
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };
  

  return (
    <div style={{ background: "#1a1d24", border: "1px solid #2d323e", borderRadius: "12px", padding: "24px", color: "#fff" }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: "600", color: "#ffffff" }}>
          Pilih / Masukkan Pembayaran
        </h3>
        <p style={{ margin: 0, fontSize: "13px", color: "#8c94a8" }}>
          Proses iuran & kas aman terintegrasi otomatis via Midtrans Gateway.
        </p>
      </div>

      {errorMsg && (
        <div style={{ background: "#3b1719", border: "1px solid #842029", color: "#ea868f", padding: "10px 14px", borderRadius: "6px", fontSize: "13px", marginBottom: "16px" }}>
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Preset Pilihan Nominal bergaya Resurgent Portal */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {[10000, 25000, 50000, 100000].map((nominal) => (
          <button
            key={nominal}
            type="button"
            onClick={() => setJumlah(nominal)}
            style={{
              background: jumlah == nominal ? "#2563eb" : "#242936",
              border: jumlah == nominal ? "1px solid #3b82f6" : "1px solid #343b4d",
              color: "#fff",
              padding: "10px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "500",
              transition: "all 0.2s"
            }}
          >
            Rp {nominal.toLocaleString("id-ID")}
          </button>
        ))}
      </div>

      <form onSubmit={handlePay}>
        <div style={{ marginBottom: "16px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", color: "#cbd5e1" }}>
            Nominal Kustom (Rp)
          </label>
          <input
            type="number"
            value={jumlah}
            onChange={(e) => setJumlah(e.target.value)}
            required
            placeholder="Masukkan nominal angka"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#12151c",
              border: "1px solid #343b4d",
              color: "#fff",
              boxSizing: "border-box",
              outline: "none",
              fontSize: "14px"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "13px", marginBottom: "6px", color: "#cbd5e1" }}>
            Keterangan / Nama Pembayar
          </label>
          <input
            type="text"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            required
            placeholder="Contoh: Iuran Minggu 1 - Budi"
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: "6px",
              background: "#12151c",
              border: "1px solid #343b4d",
              color: "#fff",
              boxSizing: "border-box",
              outline: "none",
              fontSize: "14px"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: loading ? "#475569" : "#2563eb",
            color: "#fff",
            border: "none",
            borderRadius: "6px",
            fontSize: "14px",
            fontWeight: "600",
            cursor: loading ? "not-allowed" : "pointer",
            boxShadow: "0 4px 12px rgba(37, 99, 235, 0.3)"
          }}
        >
          {loading ? "Menghubungkan Midtrans..." : "Lanjutkan Pembayaran →"}
        </button>
      </form>
    </div>
  );
};

export default PemasukanForm;