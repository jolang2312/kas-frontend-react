import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import qrisImg from "../assets/qris.jpeg";

function KasForm({ onSuccess }) {
  const [nominal, setNominal] = useState(25000);
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handlePilihNominal = (val) => {
    setNominal(val);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nominal || nominal <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Keterangan / Nama Pembayar wajib diisi.");
      return;
    }

    setLoading(true);

    try {
      const orderId = "TRX-DANA-" + Date.now();
      const valNominal = parseInt(nominal);

      // Coba insert dengan nama kolom description terlebih dahulu jika keterangan tidak ada
      let { error } = await supabase
        .from("transactions")
        .insert([
          {
            order_id: orderId,
            description: keterangan,
            amount: valNominal,
            status: "success",
            created_at: new Date().toISOString()
          }
        ]);

      // Fallback jika nama kolom di database ternyata 'keterangan'
      if (error && error.message.includes("description")) {
        const retry = await supabase
          .from("transactions")
          .insert([
            {
              order_id: orderId,
              keterangan: keterangan,
              amount: valNominal,
              status: "success",
              created_at: new Date().toISOString()
            }
          ]);
        error = retry.error;
      }

      if (error) throw error;

      alert("Pembayaran/Pemasukan kas berhasil dikonfirmasi dan dicatat!");
      setKeterangan("");
      setNominal(25000);

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Gagal memproses transaksi:", err);
      setErrorMsg(err.message || "Gagal mencatat transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
        Scan QR Code di bawah menggunakan aplikasi DANA, lalu isi form konfirmasi.
      </p>

      <div style={{
        textAlign: "center",
        marginBottom: "20px",
        background: "#ffffff",
        padding: "16px",
        borderRadius: "16px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.3)"
      }}>
        <img 
          src={qrisImg} 
          alt="QR DANA Pembayaran Kas" 
          style={{ maxWidth: "100%", height: "220px", objectFit: "contain", borderRadius: "8px" }} 
        />
        <p style={{ margin: "10px 0 0 0", fontSize: "11px", color: "#0086e6", fontWeight: "bold" }}>
          ● Transfer via Aplikasi DANA (Atas Nama: SUMAIYAH)
        </p>
      </div>

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
          {loading ? "Memproses..." : "Konfirmasi Pembayaran Kas →"}
        </button>
      </form>
    </div>
  );
}

export default KasForm;