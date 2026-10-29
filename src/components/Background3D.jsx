import React, { useEffect, useRef } from "react";

function Background3D({ role }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    const handleResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener("resize", handleResize);

    // Animasi Grid 3D Perspektif Unik (Stealth Floating Grid)
    const columns = Math.floor(width / 30);
    const rows = Math.floor(height / 30);
    let time = 0;

    let animationFrameId;

    const render = () => {
      ctx.fillStyle = "#09090b"; // Pure Dark Background
      ctx.fillRect(0, 0, width, height);

      const isAdmin = role === "admin";
      const accentRgb = isAdmin ? "59, 130, 246" : "34, 197, 94";

      time += 0.015;

      // Render Floating Matrix Depth Grid
      for (let i = 0; i < columns; i++) {
        for (let j = 0; j < rows; j++) {
          const x = (i + 0.5) * (width / columns);
          const y = (j + 0.5) * (height / rows);

          // Gelombang Matematika untuk Efek Kedalaman 3D Realtime
          const dist = Math.sin(i * 0.2 + time) + Math.cos(j * 0.2 + time);
          const size = Math.max(0.5, (dist + 2) * 0.8);
          const opacity = Math.min(0.25, Math.max(0.02, (dist + 1.5) * 0.08));

          ctx.beginPath();
          ctx.arc(x, y, size, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${accentRgb}, ${opacity})`;
          ctx.fill();
        }
      }

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [role]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        background: "#09090b",
      }}
    />
  );
}

export default Background3D;