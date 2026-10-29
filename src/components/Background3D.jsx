import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentRef.appendChild(renderer.domElement);

    const webGroup = new THREE.Group();

    // 1. Garis Radial Jaring (Transparansi Lebih Halus)
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.25,
    });
    const numSpokes = 16;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * 5,
          Math.sin(angle) * 5,
          (Math.random() - 0.5) * 1.2
        ),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      webGroup.add(line);
    }

    // 2. Ring Konsentris Jaring Laba-Laba
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.2,
    });
    const numRings = 7;
    for (let r = 1; r <= numRings; r++) {
      const radius = (r / numRings) * 4.2;
      const ringPoints = [];
      for (let i = 0; i <= numSpokes; i++) {
        const angle = (i / numSpokes) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(r + i) * 0.2
          )
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(ringGeo, ringMaterial);
      webGroup.add(ringLine);
    }

    // 3. Partikel Cahaya
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 80;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 12;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.4,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    webGroup.add(particles);

    scene.add(webGroup);

    // Respon Kursor
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.4;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.4;
    };
    window.addEventListener("mousemove", handleMouseMove);

    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      webGroup.rotation.y += (mouseX - webGroup.rotation.y) * 0.03;
      webGroup.rotation.x += (-mouseY - webGroup.rotation.x) * 0.03;
      webGroup.rotation.z = Math.sin(elapsedTime * 0.2) * 0.05;

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
      if (currentRef.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
    };
  }, []);

  return (
    <div
      ref={mountRef}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        pointerEvents: "none",
        filter: "blur(1px)", // Blur halus untuk menjaga keterbacaan teks
      }}
    />
  );
}

export default Background3D;