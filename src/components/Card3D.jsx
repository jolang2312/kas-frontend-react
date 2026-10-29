import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Card3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    // 1. Scene, Camera, Renderer Setup
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);
    camera.position.z = 3.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(180, 180);
    currentRef.appendChild(renderer.domElement);

    // 2. Buat Objek 3D (Koin / Ring Kas Futuristik)
    const geometry = new THREE.TorusGeometry(1, 0.3, 16, 100);
    const material = new THREE.MeshStandardMaterial({
      color: 0x2563eb,
      metalness: 0.8,
      roughness: 0.2,
      wireframe: false,
    });
    const torus = new THREE.Mesh(geometry, material);
    scene.add(torus);

    // Partikel Kecil 3D di Sekitar Koin
    const particlesGeo = new THREE.BufferGeometry();
    const count = 50;
    const posArray = new Float32Array(count * 3);
    for (let i = 0; i < count * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 4;
    }
    particlesGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particlesMat = new THREE.PointsMaterial({ size: 0.03, color: 0x10b981 });
    const particles = new THREE.Points(particlesGeo, particlesMat);
    scene.add(particles);

    // 3. Pencahayaan (Lighting)
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0x3b82f6, 2);
    pointLight.position.set(2, 3, 4);
    scene.add(pointLight);

    // 4. Animasi Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      torus.rotation.x += 0.01;
      torus.rotation.y += 0.015;
      particles.rotation.y -= 0.003;

      renderer.render(scene, camera);
    };
    animate();

    // Cleanup saat unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentRef.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "180px", height: "180px" }} />;
}

export default Card3D;