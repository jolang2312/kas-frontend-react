import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

const Background3D = ({ role = "anggota" }) => {
  const mountRef = useRef(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // 1. Scene & Camera Setup (Latar Hitam Pekat)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color("#000000"); // Hitam solid seperti di video
    scene.fog = new THREE.FogExp2("#000000", 0.05); // Efek kedalaman/pudar di kejauhan

    const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.0, 3.5); // Posisi sentral

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2; // Eksposur sinematik
    container.appendChild(renderer.domElement);

    // 2. Cinematic Lighting (Spotlight dramatis dari atas & belakang)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.2); // Sangat redup
    scene.add(ambientLight);

    const spotLight = new THREE.SpotLight(0xffffff, 5.0);
    spotLight.position.set(0, 5, 2);
    spotLight.angle = Math.PI / 4;
    spotLight.penumbra = 0.8;
    scene.add(spotLight);

    // Rim Light (Warna aksen oranye kemerahan/biru tergantung role)
    const accentColor = role === "admin" ? 0x3b82f6 : 0xff4500; // Orange seperti di video untuk anggota
    const rimLight = new THREE.DirectionalLight(accentColor, 4.0);
    rimLight.position.set(-3, 3, -4);
    scene.add(rimLight);

    // 3. Load Model
    let model;
    let mixer;
    const clock = new THREE.Clock();
    const loader = new GLTFLoader();

    loader.load(
      "/models/mascot.gltf", // Pastikan file 3D Anda di folder public
      (gltf) => {
        model = gltf.scene;
        model.position.set(0, -0.5, 0); // Agak turun agar pas di tengah layar
        scene.add(model);

        if (gltf.animations && gltf.animations.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      (error) => {
        // Fallback objek jika gagal load
        const geo = new THREE.IcosahedronGeometry(1, 1);
        const mat = new THREE.MeshStandardMaterial({ color: accentColor, wireframe: true });
        model = new THREE.Mesh(geo, mat);
        scene.add(model);
      }
    );

    // 4. Efek Interaktif (Scroll & Mouse Move)
    let scrollY = 0;
    let mouseX = 0;
    let mouseY = 0;

    const handleScroll = () => { scrollY = window.scrollY; };
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth) * 2 - 1;
      mouseY = -(e.clientY / window.innerHeight) * 2 + 1;
    };

    window.addEventListener("scroll", handleScroll);
    window.addEventListener("mousemove", handleMouseMove);

    // 5. Animation Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      if (mixer) mixer.update(delta);

      if (model) {
        // Rotasi berdasarkan scroll (Efek seperti presentasi produk)
        const targetRotationY = scrollY * 0.002;
        model.rotation.y += (targetRotationY - model.rotation.y) * 0.1;
        
        // Sedikit pergerakan berdasarkan kursor (Parallax tipis)
        model.rotation.x += (mouseY * 0.1 - model.rotation.x) * 0.05;
        model.position.x += (mouseX * 0.2 - model.position.x) * 0.05;
      }

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
      if (container && renderer.domElement) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [role]);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0, left: 0, width: "100vw", height: "100vh",
        pointerEvents: "none", zIndex: 0,
        opacity: 0.8, // Ditingkatkan agar 3D lebih menonjol
      }}
    />
  );
};

export default Background3D;