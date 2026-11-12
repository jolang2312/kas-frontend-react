import React, { useEffect, useRef } from "react";
import * as THREE from "three";

const Background3D = ({ role = "anggota", isLogin = false }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene, Fog & Camera
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#030306");
    scene.fog = new THREE.FogExp2("#030306", 0.048);

    const camera = new THREE.PerspectiveCamera(
      40,
      window.innerWidth / window.innerHeight,
      0.1,
      100
    );
    camera.position.set(0, 0.15, 6.8);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    container.appendChild(renderer.domElement);

    // Palet Warna Tema: Oranye-Emas Sinematik (Login/Anggota) vs Biru-Cyan Elektrik (Admin)
    const primaryHex = role === "admin" ? 0x3b82f6 : 0xff4d00;
    const secondaryHex = role === "admin" ? 0x06b6d4 : 0xffae00;
    const ambientTint = role === "admin" ? 0x1e3a8a : 0x431407;

    // 2. Studio Reflection Environment Map (Agar Metalik Titanium Memantul Realistis)
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envScene = new THREE.Scene();
    envScene.background = new THREE.Color("#050508");

    const softboxGeo = new THREE.PlaneGeometry(8, 8);
    const topBox = new THREE.Mesh(
      softboxGeo,
      new THREE.MeshBasicMaterial({ color: 0xffffff, side: THREE.DoubleSide })
    );
    topBox.position.set(0, 6, 2);
    topBox.rotation.x = Math.PI / 2;
    envScene.add(topBox);

    const leftBox = new THREE.Mesh(
      softboxGeo,
      new THREE.MeshBasicMaterial({ color: primaryHex, side: THREE.DoubleSide })
    );
    leftBox.position.set(-6, 1, 2);
    leftBox.rotation.y = Math.PI / 2;
    envScene.add(leftBox);

    const rightBox = new THREE.Mesh(
      softboxGeo,
      new THREE.MeshBasicMaterial({ color: secondaryHex, side: THREE.DoubleSide })
    );
    rightBox.position.set(6, -1, -2);
    rightBox.rotation.y = -Math.PI / 2;
    envScene.add(rightBox);

    const envRT = pmremGenerator.fromScene(envScene, 0.04);
    scene.environment = envRT.texture;
    pmremGenerator.dispose();
    softboxGeo.dispose();

    // 3. Pencahayaan Studio Tiga Titik (Three-Point Cinematic Lighting)
    const hemiLight = new THREE.HemisphereLight(0xffffff, ambientTint, 0.6);
    scene.add(hemiLight);

    const keyLight = new THREE.SpotLight(0xffffff, 28);
    keyLight.position.set(3.5, 5.5, 5);
    keyLight.angle = Math.PI / 4;
    keyLight.penumbra = 0.85;
    scene.add(keyLight);

    const rimLightLeft = new THREE.PointLight(primaryHex, 30, 18);
    rimLightLeft.position.set(-3.8, 2.0, 2.5);
    scene.add(rimLightLeft);

    const rimLightRight = new THREE.PointLight(secondaryHex, 24, 18);
    rimLightRight.position.set(3.8, -2.0, 1.5);
    scene.add(rimLightRight);

    // 4. Material PBR High-Detail
    const brushedTitaniumMat = new THREE.MeshStandardMaterial({
      color: 0x27272e,
      metalness: 0.96,
      roughness: 0.18,
    });

    const chromeAccentMat = new THREE.MeshStandardMaterial({
      color: 0xd4d4d8,
      metalness: 1.0,
      roughness: 0.1,
    });

    const obsidianGlassMat = new THREE.MeshPhysicalMaterial({
      color: 0x07070a,
      metalness: 0.15,
      roughness: 0.06,
      transmission: 0.42,
      transparent: true,
      opacity: 0.92,
      ior: 1.5,
    });

    const neonCoreMat = new THREE.MeshStandardMaterial({
      color: primaryHex,
      emissive: primaryHex,
      emissiveIntensity: 2.2,
      metalness: 0.3,
      roughness: 0.2,
    });

    const secondaryGlowMat = new THREE.MeshStandardMaterial({
      color: secondaryHex,
      emissive: secondaryHex,
      emissiveIntensity: 1.6,
      metalness: 0.4,
      roughness: 0.2,
    });

    // 5. Konstruksi Utama: Southern Base Cyber-Vault Mechanism
    const vaultGroup = new THREE.Group();
    vaultGroup.position.set(isLogin ? 0 : 1.75, isLogin ? 0.25 : 0, 0);
    scene.add(vaultGroup);

    // A. Cincin Bezel Utama Bertingkat
    const mainBezel = new THREE.Mesh(
      new THREE.TorusGeometry(1.72, 0.13, 36, 128),
      brushedTitaniumMat
    );
    vaultGroup.add(mainBezel);

    const innerChromeRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.54, 0.025, 24, 128),
      chromeAccentMat
    );
    innerChromeRing.position.z = 0.08;
    vaultGroup.add(innerChromeRing);

    // B. 60 Penanda Presisi + 12 Penanda Jam Menyala
    const ticksGroup = new THREE.Group();
    const smallTickGeo = new THREE.BoxGeometry(0.02, 0.09, 0.04);
    const majorTickGeo = new THREE.BoxGeometry(0.045, 0.16, 0.06);

    for (let i = 0; i < 60; i++) {
      const angle = (i / 60) * Math.PI * 2;
      const isMajor = i % 5 === 0;
      const tick = new THREE.Mesh(
        isMajor ? majorTickGeo : smallTickGeo,
        isMajor ? neonCoreMat : chromeAccentMat
      );
      tick.position.set(
        Math.cos(angle) * 1.72,
        Math.sin(angle) * 1.72,
        0.13
      );
      tick.rotation.z = angle + Math.PI / 2;
      ticksGroup.add(tick);
    }
    vaultGroup.add(ticksGroup);

    // C. Cakram Kaca Obsidian di Bagian Tengah
    const glassDial = new THREE.Mesh(
      new THREE.CylinderGeometry(1.48, 1.48, 0.06, 64),
      obsidianGlassMat
    );
    glassDial.rotation.x = Math.PI / 2;
    vaultGroup.add(glassDial);

    // D. Dua Cincin Giroskop Berputar (Gimbal Rings)
    const gimbalOuter = new THREE.Mesh(
      new THREE.TorusGeometry(1.26, 0.032, 24, 100),
      chromeAccentMat
    );
    vaultGroup.add(gimbalOuter);

    const gimbalInner = new THREE.Mesh(
      new THREE.TorusGeometry(1.02, 0.024, 24, 100),
      secondaryGlowMat
    );
    vaultGroup.add(gimbalInner);

    // E. Pita Energi Heliks Melengkung (TubeGeometry)
    const createRibbonCurve = (radius, twist, offsetAngle) => {
      const points = [];
      const segments = 64;
      for (let i = 0; i <= segments; i++) {
        const t = (i / segments) * Math.PI * 1.45 + offsetAngle;
        const x = Math.cos(t) * radius;
        const y = Math.sin(t) * radius;
        const z = Math.sin(t * twist) * 0.45;
        points.push(new THREE.Vector3(x, y, z));
      }
      return new THREE.CatmullRomCurve3(points);
    };

    const ribbon1 = new THREE.Mesh(
      new THREE.TubeGeometry(createRibbonCurve(2.08, 2, 0.2), 80, 0.035, 16, false),
      neonCoreMat
    );
    ribbon1.rotation.set(0.45, 0.35, 0);
    vaultGroup.add(ribbon1);

    const ribbon2 = new THREE.Mesh(
      new THREE.TubeGeometry(createRibbonCurve(2.24, 2, Math.PI + 0.4), 80, 0.022, 16, false),
      chromeAccentMat
    );
    ribbon2.rotation.set(-0.5, -0.3, 0.2);
    vaultGroup.add(ribbon2);

    // F. Inti Kristal Berlian Multi-Faset di Pusat
    const coreGroup = new THREE.Group();
    coreGroup.position.z = 0.18;
    vaultGroup.add(coreGroup);

    const innerCore = new THREE.Mesh(
      new THREE.OctahedronGeometry(0.46, 0),
      neonCoreMat
    );
    coreGroup.add(innerCore);

    const outerCrystalShell = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.68, 0),
      new THREE.MeshPhysicalMaterial({
        color: 0xffffff,
        metalness: 0.2,
        roughness: 0.05,
        transmission: 0.75,
        transparent: true,
        opacity: 0.85,
      })
    );
    coreGroup.add(outerCrystalShell);

    const wireCage = new THREE.Mesh(
      new THREE.IcosahedronGeometry(0.82, 0),
      new THREE.MeshBasicMaterial({
        color: secondaryHex,
        wireframe: true,
        transparent: true,
        opacity: 0.5,
      })
    );
    coreGroup.add(wireCage);

    // 6. Cyber-Grid Perspektif di Bagian Bawah
    const gridHelper = new THREE.GridHelper(28, 36, primaryHex, 0x18181f);
    gridHelper.position.y = -2.45;
    gridHelper.material.transparent = true;
    gridHelper.material.opacity = 0.28;
    scene.add(gridHelper);

    // 7. Partikel Cahaya Multi-Depth (Foreground & Background Bokeh)
    const createParticles = (count, spread, size, color, opacity) => {
      const geo = new THREE.BufferGeometry();
      const positions = new Float32Array(count * 3);
      for (let i = 0; i < count * 3; i++) {
        positions[i] = (Math.random() - 0.5) * spread;
      }
      geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      const mat = new THREE.PointsMaterial({
        size,
        color,
        transparent: true,
        opacity,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      return new THREE.Points(geo, mat);
    };

    const bgParticles = createParticles(180, 18, 0.035, secondaryHex, 0.55);
    const fgParticles = createParticles(70, 11, 0.06, primaryHex, 0.75);
    scene.add(bgParticles);
    scene.add(fgParticles);

    // 8. Interaksi Kursor & Scroll
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

    // 9. Animation Loop 60fps
    const clock = new THREE.Clock();
    let frameId;

    const animate = () => {
      frameId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();

      // Parallax kamera halus
      camera.position.x += (mouseX * 0.45 - camera.position.x) * 0.05;
      camera.position.y += (0.15 + mouseY * 0.3 - camera.position.y) * 0.05;
      camera.lookAt(0, 0, 0);

      // Gerakan utama Vault + respons scroll
      const scrollSpin = scrollY * 0.003;
      const targetRotY = Math.sin(t * 0.4) * 0.42 + scrollSpin + mouseX * 0.5;
      const targetRotX = Math.cos(t * 0.3) * 0.18 - mouseY * 0.35;

      vaultGroup.rotation.y += (targetRotY - vaultGroup.rotation.y) * 0.06;
      vaultGroup.rotation.x += (targetRotX - vaultGroup.rotation.x) * 0.06;
      vaultGroup.position.y = (isLogin ? 0.25 : 0) + Math.sin(t * 1.1) * 0.08;

      // Rotasi cincin giroskop & pita energi
      gimbalOuter.rotation.x = t * 0.55 + scrollSpin;
      gimbalOuter.rotation.y = t * 0.35;

      gimbalInner.rotation.y = -t * 0.75;
      gimbalInner.rotation.z = t * 0.45;

      ribbon1.rotation.z = t * 0.28;
      ribbon2.rotation.z = -t * 0.22;

      // Denyut & rotasi inti kristal
      innerCore.rotation.y = t * 1.1;
      innerCore.rotation.x = t * 0.7;
      const pulse = 1 + Math.sin(t * 2.6) * 0.07;
      innerCore.scale.set(pulse, pulse, pulse);

      outerCrystalShell.rotation.y = -t * 0.45;
      wireCage.rotation.y = t * 0.3;
      wireCage.rotation.z = -t * 0.25;

      // Rotasi partikel
      bgParticles.rotation.y = t * 0.025;
      fgParticles.rotation.y = -t * 0.04;
      fgParticles.rotation.x = Math.sin(t * 0.15) * 0.08;

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
      cancelAnimationFrame(frameId);
      envRT.dispose();
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