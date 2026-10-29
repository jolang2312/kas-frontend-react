import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import qrisImg from "../assets/qris.jpeg";

function InputForm({ onSuccess }) {
  const [nominal, setNominal] = useState(25000);
  const [keterangan, setKeterangan] = useState("");
  const [buktiFile, setBuktiFile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLanjutKonfirmasi = (e) => {
    e.preventDefault();
    setErrorMsg("");

    if (!nominal || nominal <= 0) {
      setErrorMsg("Nominal pembayaran harus lebih dari 0.");
      return;
    }

    if (!keterangan.trim()) {
      setErrorMsg("Nama pembayar / keterangan wajib diisi.");
      return;
    }

    if (!buktiFile) {
      setErrorMsg("Wajib melampirkan foto bukti transfer untuk verifikasi.");
      return;
    }

    setStep(2);
  };

  const handleSimpanTransaksi = async () => {
    setLoading(true);
    setErrorMsg("");

    try {
      const savedUser = JSON.parse(localStorage.getItem("user")) || {};
      const officerName = savedUser.name || "Anggota Organisasi";

      const now = new Date();
      const formattedDate = now.toISOString().replace('T', ' ').substring(0, 19);

      const { error } = await supabase
        .from("transactions")
        .insert([
          {
            payer_name: keterangan,
            amount: parseInt(nominal),
            payment_method: "DANA",
            transaction_type: "income",
            transaction_date: formattedDate,
            officer_name: officerName,
            status: "pending",
            description: `Bukti: ${buktiFile ? buktiFile.name : '-'}`
          }
        ]);

      if (error) throw error;

      alert(`Konfirmasi terkirim! Pembayaran dari ${keterangan} sebesar Rp ${parseInt(nominal).toLocaleString("id-ID")} berhasil dikirim. Menunggu verifikasi admin sebelum masuk total kas.`);
      
      setKeterangan("");
      setNominal(25000);
      setBuktiFile(null);
      setStep(1);

      if (onSuccess) onSuccess();

    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
      setErrorMsg(err.message || "Gagal mencatat transaksi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {step === 1 ? (
        <>
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
            Scan QR Code DANA, lakukan transfer, lalu unggah bukti transfer.
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
                onClick={() => setNominal(val)}
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

          <form onSubmit={handleLanjutKonfirmasi}>
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

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                Nama Pembayar / Keterangan
              </label>
              <input
                type="text"
                placeholder="Contoh: Andi - Kas Bulan Ini"
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

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "12px", color: "#94a3b8", marginBottom: "6px" }}>
                Unggah Bukti Transfer (Screenshot)
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setBuktiFile(e.target.files[0])}
                required
                style={{
                  width: "100%",
                  padding: "8px",
                  background: "#0a0b0e",
                  border: "1px solid #272a34",
                  color: "#94a3b8",
                  borderRadius: "8px",
                  fontSize: "12px"
                }}
              />
            </div>

            <button
              type="submit"
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
              Lanjut ke Konfirmasi Pembayaran →
            </button>
          </form>
        </>
      ) : (
        <div style={{ background: "#1a1d28", padding: "20px", borderRadius: "12px", border: "1px solid #3b82f6" }}>
          <h4 style={{ color: "#fff", marginTop: "0", marginBottom: "14px" }}>🔍 Periksa Sebelum Mengirim</h4>
          
          <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "10px" }}>
            <b>Nama Pembayar:</b> {keterangan}
          </div>
          <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "10px" }}>
            <b>Nominal Kas:</b> Rp {parseInt(nominal).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "13px", color: "#cbd5e1", marginBottom: "16px" }}>
            <b>Bukti File:</b> {buktiFile ? buktiFile.name : "-"}
          </div>

          <div style={{ background: "rgba(59, 130, 246, 0.1)", padding: "10px", borderRadius: "8px", fontSize: "12px", color: "#93c5fd", marginBottom: "20px" }}>
            Data akan terkirim dengan status <b>Pending</b>. Admin akan mengecek saldo DANA masuk terlebih dahulu sebelum menyetujui.
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{
                flex: 1,
                padding: "10px",
                background: "#334155",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              ← Kembali
            </button>
            <button
              type="button"
              disabled={loading}
              onClick={handleSimpanTransaksi}
              style={{
                flex: 1,
                padding: "10px",
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {loading ? "Mengirim..." : "Kirim Sekarang ✓"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default InputForm;