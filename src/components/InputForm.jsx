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
      const formattedDate = now.toISOString().replace("T", " ").substring(0, 19);

      const { error } = await supabase.from("transactions").insert([
        {
          payer_name: keterangan,
          amount: parseInt(nominal),
          payment_method: "DANA",
          transaction_type: "income",
          transaction_date: formattedDate,
          officer_name: officerName,
          status: "pending",
          description: `Bukti: ${buktiFile ? buktiFile.name : "-"}`,
        },
      ]);

      if (error) throw error;

      alert(
        `Konfirmasi terkirim! Pembayaran dari ${keterangan} sebesar Rp ${parseInt(
          nominal
        ).toLocaleString("id-ID")} berhasil dikirim. Menunggu verifikasi admin.`
      );

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
          <p style={{ fontSize: "13px", color: "#94a3b8", marginBottom: "16px" }}>
            Scan QR Code DANA atau gunakan Nomor DANA di bawah untuk melakukan transfer.
          </p>

          <div
            style={{
              textAlign: "center",
              marginBottom: "20px",
              background: "#ffffff",
              padding: "16px",
              borderRadius: "16px",
              boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
            }}
          >
            {/* JIKA GAMBAR TERSEDIA */}
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
              /* FALLBACK JIKA GAMBAR RUSAK/TIDAK ADA */
              <div
                style={{
                  padding: "20px",
                  background: "#f8fafc",
                  borderRadius: "12px",
                  border: "2px dashed #cbd5e1",
                }}
              >
                <div style={{ fontSize: "32px", marginBottom: "8px" }}>📲</div>
                <div style={{ fontSize: "13px", fontWeight: "700", color: "#0f172a" }}>
                  Pembayaran Via DANA
                </div>
              </div>
            )}

            {/* KETERANGAN DANA & TOMBOL COPY */}
            <div
              style={{
                marginTop: "14px",
                paddingTop: "12px",
                borderTop: "1px dashed #e2e8f0",
                color: "#0f172a",
                textAlign: "center",
              }}
            >
              <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#0086e6", fontWeight: "bold" }}>
                ● Transfer DANA a.n. {namaPemilik}
              </p>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "8px",
                  background: "#f1f5f9",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  marginTop: "6px",
                }}
              >
                <span
                  style={{
                    fontWeight: "700",
                    fontSize: "15px",
                    color: "#0f172a",
                    fontFamily: "monospace",
                  }}
                >
                  {nomorDana}
                </span>
                <button
                  type="button"
                  onClick={handleCopyNomor}
                  style={{
                    background: copied ? "#10b981" : "#2563eb",
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
                background: "#2d1215",
                border: "1px solid #7f1d1d",
                color: "#fca5a5",
                padding: "10px 14px",
                borderRadius: "10px",
                fontSize: "12px",
                marginBottom: "16px",
              }}
            >
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
                  cursor: "pointer",
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
                  outline: "none",
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
                  outline: "none",
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
                  fontSize: "12px",
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
                fontSize: "14px",
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

          <div
            style={{
              background: "rgba(59, 130, 246, 0.1)",
              padding: "10px",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#93c5fd",
              marginBottom: "20px",
            }}
          >
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
                background: "#10b981",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                fontWeight: "700",
                cursor: "pointer",
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