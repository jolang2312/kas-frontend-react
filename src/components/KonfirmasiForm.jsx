import React, { useState, useEffect } from "react";

function KonfirmasiForm({ onSuccess }) {
  const [nominal, setNominal] = useState(25000);
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Load Midtrans Snap Script otomatis saat komponen dibuka
  useEffect(() => {
    const midtransUrl = "https://app.sandbox.midtrans.com/snap/snap.js"; // Ganti ke app.midtrans.com jika mode production
    const clientKey = "MIDTRANS_CLIENT_KEY_ANDA"; // Ganti dengan Client Key Midtrans Anda

    if (!document.getElementById("midtrans-script")) {
      const script = document.createElement("script");
      script.id = "midtrans-script";
      script.src = midtransUrl;
      script.setAttribute("data-client-key", clientKey);
      document.body.appendChild(script);
    }
  }, []);

  const handlePilihNominal = (val) => {
    setNominal(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nominal || nominal < 1000) {
      setErrorMsg("Nominal minimal adalah Rp 1.000.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Keterangan / Nama Pembayar wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      // Panggil Backend Laravel endpoint /bayar
      const response = await fetch("http://127.0.0.1:8000/api/bayar", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          jumlah: parseInt(nominal),
          keterangan: keterangan,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Gagal membuat transaksi pembayaran.");
      }

      // Munculkan Popup Midtrans Snap menggunakan snapToken dari backend
      window.snap.pay(data.snapToken, {
        onSuccess: function (result) {
          alert("Pembayaran Berhasil! Terima kasih.");
          setKeterangan("");
          setNominal(25000);
          if (onSuccess) onSuccess();
        },
        onPending: function (result) {
          alert("Menunggu pembayaran Anda.");
          console.log(result);
        },
        onError: function (result) {
          alert("Pembayaran gagal!");
          console.log(result);
        },
        onClose: function () {
          alert("Anda menutup popup pembayaran sebelum selesai.");
        },
      });

    } catch (err) {
      console.error("Error:", err);
      setErrorMsg(err.message || "Terjadi kesalahan koneksi ke server.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
        Pilih nominal dan masukkan nama/keterangan, lalu klik bayar untuk membuka sistem pembayaran otomatis Midtrans.
      </p>

      {errorMsg && (
        <div style={{
          background: "#2d1215",
          border: "1px solid #7f1d1d",
          color: "#fca5a5",
          padding: "10px 14px",
          borderRadius: "10px",
          fontSize: "12px",
          marginBottom: "16px"
        }}>
          ⚠️ {errorMsg}
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
        {[10000, 25000, 50000, 100000].map((val) => (
          <button
            key={val}
            type="button"
            onClick={() => handlePilihNominal(val)}
            style={{
              padding: "10px",
              background: nominal === val ? "#2563eb" : "#1a1d28",
              color: "#fff",
              border: nominal === val ? "1px solid #3b82f6" : "1px solid #272a34",
              borderRadius: "8px",
              fontWeight: "600",
              fontSize: "13px",
              cursor: "pointer"
            }}
          >
            Rp {val.toLocaleString("id-ID")}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: "14px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
            Nominal Kustom (Rp)
          </label>
          <input
            type="number"
            value={nominal}
            onChange={(e) => setNominal(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#0a0b0e",
              border: "1px solid #272a34",
              color: "#fff",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
            Keterangan / Nama Pembayar
          </label>
          <input
            type="text"
            placeholder="Contoh: Kas Bulan Ini - Budi"
            value={keterangan}
            onChange={(e) => setKeterangan(e.target.value)}
            required
            style={{
              width: "100%",
              padding: "10px 12px",
              background: "#0a0b0e",
              border: "1px solid #272a34",
              color: "#fff",
              borderRadius: "8px",
              boxSizing: "border-box",
              outline: "none"
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            width: "100%",
            padding: "12px",
            background: "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "10px",
            fontWeight: "700",
            cursor: "pointer",
            fontSize: "14px"
          }}
        >
          {loading ? "Menghubungkan Midtrans..." : "Bayar Otomatis via Midtrans →"}
        </button>
      </form>
    </div>
  );
}

export default KonfirmasiForm;