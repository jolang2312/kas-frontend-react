import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Background3D = ({ role = "anggota", isLogin = false }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera (Latar Hitam Pekat seperti Video Referensi)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#030305");
    scene.fog = new THREE.FogExp2("#030305", 0.06);

    const camera = new THREE.PerspectiveCamera(
      42,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.2, 6.2);

    const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.35;
    container.appendChild(renderer.domElement);

    // Warna Tema: Oranye-Merah Sinematik (Login/Anggota) vs Biru Elektrik (Admin)
    const primaryAccent = role === "admin" ? 0x3b82f6 : 0xff4d00;
    const secondaryAccent = role === "admin" ? 0x06b6d4 : 0xff9e00;

    // 2. Pencahayaan Studio Dramatis (Spotlight + Rim Light)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.25);
    scene.add(ambientLight);

    const topSpot = new THREE.SpotLight(0xffffff, 18);
    topSpot.position.set(2.5, 5, 4);
    topSpot.angle = Math.PI / 4;
    topSpot.penumbra = 0.9;
    scene.add(topSpot);

    const rimLightOrange = new THREE.PointLight(primaryAccent, 22, 15);
    rimLightOrange.position.set(-3.2, 1.8, 2.2);
    scene.add(rimLightOrange);

    const rimLightBack = new THREE.PointLight(secondaryAccent, 16, 15);
    rimLightBack.position.set(3.2, -1.8, -2.0);
    scene.add(rimLightBack);

    // 3. Grup Utama Objek 3D (Titanium Vault & Orbital Loop)
    const heroGroup = new THREE.Group();
    // Saat di halaman login, geser sedikit ke samping/atas agar terlihat jelas di samping form
    heroGroup.position.set(isLogin ? 0 : 1.6, isLogin ? 0.35 : 0, 0);
    scene.add(heroGroup);

    // Material Titanium Gelap & Aksen Metalik
    const titaniumMat = new THREE.MeshStandardMaterial({
      color: 0x27272a,
      metalness: 0.92,
      roughness: 0.22,
    });

    const darkGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x09090b,
      metalness: 0.1,
      roughness: 0.08,
      transmission: 0.35,
      transparent: true,
      opacity: 0.92,
    });

    const accentGlowMat = new THREE.MeshStandardMaterial({
      color: primaryAccent,
      emissive: primaryAccent,
      emissiveIntensity: 1.6,
      metalness: 0.4,
      roughness: 0.2,
    });

    // A. Cincin Bezel Utama (Torus Titanium)
    const outerBezel = new THREE.Mesh(
      new THREE.TorusGeometry(1.55, 0.14, 32, 100),
      titaniumMat
    );
    heroGroup.add(outerBezel);

    // B. 48 Penanda Presisi di Sekeliling Bezel (Memantulkan Kilau Cahaya)
    const tickGroup = new THREE.Group();
    const tickGeo = new THREE.BoxGeometry(0.03, 0.12, 0.06);
    for (let i = 0; i < 48; i++) {
      const angle = (i / 48) * Math.PI * 2;
      const tick = new THREE.Mesh(
        tickGeo,
        i % 4 === 0 ? accentGlowMat : titaniumMat
      );
      tick.position.set(Math.cos(angle) * 1.55, Math.sin(angle) * 1.55, 0.14);
      tick.rotation.z = angle + Math.PI / 2;
      tickGroup.add(tick);
    }
    heroGroup.add(tickGroup);

    // C. Kaca Dial Gelap di Tengah
    const centerDisc = new THREE.Mesh(
      new THREE.CylinderGeometry(1.38, 1.38, 0.08, 64),
      darkGlassMat
    );
    centerDisc.rotation.x = Math.PI / 2;
    heroGroup.add(centerDisc);

    // D. Pita Orbital Melengkung (Terinspirasi Loop Strap di Video)
    const orbitalLoop = new THREE.Mesh(
      new THREE.TorusGeometry(1.92, 0.045, 24, 120, Math.PI * 1.35),
      accentGlowMat
    );
    orbitalLoop.rotation.set(0.55, 0.4, -0.3);
    heroGroup.add(orbitalLoop);

    const secondaryLoop = new THREE.Mesh(
      new THREE.TorusGeometry(2.12, 0.02, 16, 100),
      titaniumMat
    );
    secondaryLoop.rotation.set(-0.6, 0.3, 0.5);
    heroGroup.add(secondaryLoop);

    // E. Inti Geometris Mengambang di Tengah (Core Emblem)
    const coreCrystal = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.62, 0),
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        emissive: primaryAccent,
        emissiveIntensity: 0.75,
        metalness: 0.85,
        roughness: 0.15,
      })
    );
    coreCrystal.position.z = 0.22;
    heroGroup.add(coreCrystal);

    const coreWireframe = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.78, 0),
      new THREE.MeshBasicMaterial({
        color: secondaryAccent,
        wireframe: true,
        transparent: true,
        opacity: 0.45,
      })
    );
    coreWireframe.position.z = 0.22;
    heroGroup.add(coreWireframe);

    // 4. Partikel Cahaya Mikro di Latar Belakang
    const particlesCount = 140;
    const posArray = new Float32Array(particlesCount * 3);
    for (let i = 0; i < particlesCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 14;
    }
    const particlesGeo = new THREE.BufferGeometry();
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({
      size: 0.035,
      color: primaryAccent,
      transparent: true,
      opacity: 0.65,
    });
    const particlesMesh = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particlesMesh);

    // 5. Interaksi Scroll & Gerakan Mouse
    let scrollY = window.scrollY;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => {
      scrollY = window.scrollY;
    };

    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // 6. Loop Animasi 60 FPS
    const clock = new THREE.Clock();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Rotasi halus otomatis + respons scroll
      const scrollRotation = scrollY * 0.0035;
      const targetRotY = Math.sin(elapsed * 0.45) * 0.45 + scrollRotation + mouseX * 0.45;
      const targetRotX = Math.cos(elapsed * 0.35) * 0.2 - mouseY * 0.35;

      heroGroup.rotation.y += (targetRotY - heroGroup.rotation.y) * 0.06;
      heroGroup.rotation.x += (targetRotX - heroGroup.rotation.x) * 0.06;
      heroGroup.position.y = (isLogin ? 0.35 : 0) + Math.sin(elapsed * 1.2) * 0.08;

      // Rotasi elemen internal
      coreCrystal.rotation.y = elapsed * 0.8;
      coreCrystal.rotation.z = elapsed * 0.4;
      coreWireframe.rotation.y = -elapsed * 0.5;
      orbitalLoop.rotation.z = elapsed * 0.25;
      particlesMesh.rotation.y = elapsed * 0.03;

      renderer.render(scene, camera);
    };
    animate();

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      cancelAnimationFrame(animationFrameId);
      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, [role, isLogin]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        pointerEvents: "none",
        zIndex: 0,
      }}
    />
  );
};

export default Background3D;