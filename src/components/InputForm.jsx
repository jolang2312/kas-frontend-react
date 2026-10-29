import React, { useState } from "react";
import { supabase } from "../supabaseClient";
import qrisImg from "../assets/qris.jpeg";

function InputForm({ onSuccess }) {
  const [nominal, setNominal] = useState(20000);
  const [keterangan, setKeterangan] = useState("");
  const [buktiFile, setBuktiFile] = useState(null);
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [showZoom, setShowZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [imgError, setImgError] = useState(false);

  // DATA DANA & QRIS TERBARU
  const nomorDana = "083153755970";
  const namaPemilik = "Santio Aril";

  const handleCopyNomor = () => {
    navigator.clipboard.writeText(nomorDana);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleLanjutKonfirmasi = (e) => {
    e.preventDefault();
    setErrorMsg("");

    const numericAmount = parseInt(nominal) || 0;

    if (numericAmount <= 0) {
      setErrorMsg("Nominal pembayaran harus berupa angka dan lebih dari 0.");
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
      const numericAmount = parseInt(nominal) || 0;

      if (numericAmount <= 0) {
        throw new Error("Nominal tidak valid.");
      }

      // Format tanggal murni YYYY-MM-DD sesuai tipe kolom 'date' Supabase
      const todayDate = new Date().toISOString().split("T")[0];

      // Payload disesuaikan persis dengan struktur kolom di Supabase
      const { error } = await supabase.from("transactions").insert([
        {
          payer_name: keterangan,
          amount: numericAmount,
          payment_method: "DANA",
          transaction_type: "income",
          transaction_date: todayDate,
          officer_name: officerName,
          status: "pending"
        },
      ]);

      if (error) throw error;

      alert(
        `Konfirmasi terkirim! Pembayaran dari ${keterangan} sebesar Rp ${numericAmount.toLocaleString(
          "id-ID"
        )} berhasil dikirim. Menunggu verifikasi admin.`
      );

      setKeterangan("");
      setNominal(20000);
      setBuktiFile(null);
      setStep(1);

      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Gagal menyimpan transaksi:", err);
      setErrorMsg(err.message || "Gagal mengirim data ke database Supabase.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* MODAL ZOOM POPUP */}
      {showZoom && !imgError && (
        <div
          onClick={() => setShowZoom(false)}
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            zIndex: 99999,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            cursor: "zoom-out",
            padding: "20px",
          }}
        >
          <div
            style={{ position: "relative", textAlign: "center" }}
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={qrisImg}
              alt="QRIS DANA Zoom"
              style={{
                maxWidth: "90vw",
                maxHeight: "75vh",
                borderRadius: "16px",
                boxShadow: "0 0 25px rgba(255,255,255,0.2)",
                background: "#fff",
                padding: "12px",
              }}
            />
            <div
              style={{
                marginTop: "16px",
                display: "flex",
                gap: "10px",
                justifyContent: "center",
              }}
            >
              <a
                href={qrisImg}
                download="QRIS_DANA_Santio_Aril.jpeg"
                style={{
                  background: "#2563eb",
                  color: "#fff",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  textDecoration: "none",
                  fontWeight: "bold",
                  fontSize: "13px",
                }}
              >
                📥 Unduh QRIS
              </a>
              <button
                onClick={() => setShowZoom(false)}
                style={{
                  background: "#dc2626",
                  color: "#fff",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: "8px",
                  fontWeight: "bold",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                ✖ Tutup
              </button>
            </div>
          </div>
        </div>
      )}

      {step === 1 ? (
        <>
          <p style={{ fontSize: "13px", color: "#a1a1aa", marginBottom: "16px" }}>
            Scan QR Code DANA atau gunakan Nomor DANA di bawah untuk melakukan transfer.
          </p>

          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              background: "#18181b",
              border: "1px solid #27272a",
              padding: "16px",
              borderRadius: "12px",
            }}
          >
            {!imgError ? (
              <div
                onClick={() => setShowZoom(true)}
                style={{ cursor: "zoom-in", position: "relative", display: "inline-block" }}
                title="Klik untuk memperbesar gambar QRIS"
              >
                <img
                  src={qrisImg}
                  alt="QR DANA Pembayaran Kas"
                  onError={() => setImgError(true)}
                  style={{
                    maxWidth: "100%",
                    height: "220px",
                    objectFit: "contain",
                    borderRadius: "8px",
                  }}
                />
                <span
                  style={{
                    position: "absolute",
                    bottom: "10px",
                    right: "10px",
                    background: "rgba(0,0,0,0.75)",
                    color: "#fff",
                    padding: "4px 8px",
                    borderRadius: "6px",
                    fontSize: "10px",
                    fontWeight: "bold",
                  }}
                >
                  🔍 Perbesar / Zoom
                </span>
              </div>
            ) : (
              <div
                style={{
                  padding: "20px",
                  background: "#09090b",
                  borderRadius: "12px",
                  border: "1px dashed #27272a",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📲</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#f4f4f5" }}>
                  Pembayaran Via DANA
                </div>
              </div>
            )}

            <div
              style={{
                marginTop: "14px",
                paddingTop: "12px",
                borderTop: "1px dashed #27272a",
                color: "#f4f4f5",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#3b82f6", fontWeight: "bold" }}>
                ● Transfer DANA a.n. {namaPemilik}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#09090b",
                  border: "1px solid #27272a",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  marginTop: "6px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    color: "#f4f4f5",
                    fontFamily: "monospace",
                  }}
                >
                  {nomorDana}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNomor}
                  style={{
                    background: copied ? "#16a34a" : "#2563eb",
                    color: "#fff",
                    border: "none",
                    padding: "4px 10px",
                    borderRadius: "6px",
                    fontSize: "11px",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  {copied ? "✓ Tersalin" : "📋 Salin"}
                </button>
              </div>
            </div>
          </div>

          {errorMsg && (
            <div
              style={{
                background: "#270f11",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "16px" }}>
            {[20000, 25000, 50000, 100000].map((val) => (
              <button
                key={val}
                type="button"
                onClick={() => setNominal(val)}
                style={{
                  padding: "10px",
                  background: Number(nominal) === val ? "#2563eb" : "#18181b",
                  color: "#fff",
                  border: Number(nominal) === val ? "1px solid #3b82f6" : "1px solid #27272a",
                  borderRadius: "8px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Rp {val.toLocaleString("id-ID")}
              </button>
            ))}
          </div>

          <form onSubmit={handleLanjutKonfirmasi}>
            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "600" }}>
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
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#f4f4f5",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  outline: "none",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "600" }}>
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
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#f4f4f5",
                  borderRadius: "8px",
                  boxSizing: "border-box",
                  outline: "none",
                  fontSize: "13px",
                }}
              />
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "11px", color: "#a1a1aa", marginBottom: "6px", fontWeight: "600" }}>
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
                  background: "#18181b",
                  border: "1px solid #27272a",
                  color: "#a1a1aa",
                  borderRadius: "8px",
                  fontSize: "12px",
                }}
              />
            </div>

            <button
              type="submit"
              style={{
                width: "100%",
                padding: "12px",
                background: "#2563eb",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
                fontSize: "13px",
              }}
            >
              Lanjut ke Konfirmasi Pembayaran →
            </button>
          </form>
        </>
      ) : (
        <div style={{ background: "#18181b", padding: "18px", borderRadius: "10px", border: "1px solid #27272a" }}>
          <h4 style={{ color: "#f4f4f5", marginTop: "0", marginBottom: "12px", fontSize: "14px" }}>🔍 Periksa Sebelum Mengirim</h4>

          {errorMsg && (
            <div
              style={{
                background: "#270f11",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                marginBottom: "14px",
              }}
            >
              ⚠️ {errorMsg}
            </div>
          )}

          <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "8px" }}>
            <b style={{ color: "#f4f4f5" }}>Nama Pembayar:</b> {keterangan}
          </div>
          <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "8px" }}>
            <b style={{ color: "#f4f4f5" }}>Nominal Kas:</b> Rp {parseInt(nominal || 0).toLocaleString("id-ID")}
          </div>
          <div style={{ fontSize: "12px", color: "#a1a1aa", marginBottom: "14px" }}>
            <b style={{ color: "#f4f4f5" }}>Bukti File:</b> {buktiFile ? buktiFile.name : "-"}
          </div>

          <div
            style={{
              background: "rgba(37, 99, 235, 0.12)",
              padding: "10px",
              borderRadius: "6px",
              fontSize: "11px",
              color: "#93c5fd",
              marginBottom: "16px",
            }}
          >
            Data akan terkirim dengan status <b>Pending</b>. Admin akan mengecek saldo masuk sebelum menyetujui.
          </div>

          <div style={{ display: "flex", gap: "10px" }}>
            <button
              type="button"
              onClick={() => {
                setErrorMsg("");
                setStep(1);
              }}
              style={{
                flex: 1,
                padding: "10px",
                background: "#27272a",
                color: "#f4f4f5",
                border: "none",
                borderRadius: "8px",
                fontWeight: "600",
                fontSize: "12px",
                cursor: "pointer",
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
                background: "#16a34a",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                fontSize: "12px",
                cursor: loading ? "wait" : "pointer",
                opacity: loading ? 0.7 : 1,
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