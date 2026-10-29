import React, { useState } from "react";
import mascotImg from "../assets/mascot.png";

function CharacterCard3D() {
  const [rotate, setRotate] = useState({ x: 0, y: 0 });
  const [glow, setGlow] = useState({ x: 50, y: 50 });

  const handleMouseMove = (e) => {
    const card = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - card.left - card.width / 2;
    const y = e.clientY - card.top - card.height / 2;

    // Menghitung sudut kemiringan 3D saat kursor bergerak
    setRotate({ x: -y / 10, y: x / 10 });

    // Posisi cermin kilap (Glow Effect)
    const glowX = ((e.clientX - card.left) / card.width) * 100;
    const glowY = ((e.clientY - card.top) / card.height) * 100;
    setGlow({ x: glowX, y: glowY });
  };

  const handleMouseLeave = () => {
    setRotate({ x: 0, y: 0 });
    setGlow({ x: 50, y: 50 });
  };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      style={{
        perspective: "1000px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        margin: "10px 0 20px 0",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "320px",
          height: "320px",
          borderRadius: "16px",
          background: "#18181b",
          border: "1px solid #27272a",
          position: "relative",
          transform: `rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`,
          transition: "transform 0.1s ease-out",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.8)",
          overflow: "hidden",
          cursor: "pointer",
        }}
      >
        {/* Efek Kilau Cahaya Chrome Dinamis */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: `radial-gradient(circle at ${glow.x}% ${glow.y}%, rgba(59, 130, 246, 0.3), transparent 70%)`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Gambar Maskot 3D Pop-Out */}
        <img
          src={mascotImg}
          alt="Southernbase Mascot"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            transform: `translateZ(30px) scale(1.02)`,
            transition: "transform 0.1s ease-out",
          }}
        />
      </div>
    </div>
  );
}

export default CharacterCard3D;