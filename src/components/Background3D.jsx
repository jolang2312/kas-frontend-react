import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    // Scene, Camera, Renderer Setup
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
    renderer.setPixelRatio(window.devicePixelRatio);
    currentRef.appendChild(renderer.domElement);

    // MEMBUAT JARING LABA-LABA 3D BACKGROUND
    const webGroup = new THREE.Group();

    // 1. Garis Radial
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.5,
    });
    const numSpokes = 16;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * 4.5,
          Math.sin(angle) * 4.5,
          (Math.random() - 0.5) * 1.5
        ),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      webGroup.add(line);
    }

    // 2. Lingkaran Konsentris Jaring
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.45,
    });
    const numRings = 7;
    for (let r = 1; r <= numRings; r++) {
      const radius = (r / numRings) * 4.0;
      const ringPoints = [];
      for (let i = 0; i <= numSpokes; i++) {
        const angle = (i / numSpokes) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(r + i) * 0.3
          )
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(ringGeo, ringMaterial);
      webGroup.add(ringLine);
    }

    // 3. Partikel Cahaya
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 100;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 10;
    }
    particleGeo.setAttribute(
      "position",
      new THREE.BufferAttribute(posArray, 3)
    );
    const particleMat = new THREE.PointsMaterial({
      size: 0.05,
      color: 0x60a5fa,
      transparent: true,
      opacity: 0.7,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    webGroup.add(particles);

    scene.add(webGroup);

    // Respon Gerakan Mouse
    let mouseX = 0;
    let mouseY = 0;
    const handleMouseMove = (e) => {
      mouseX = (e.clientX / window.innerWidth - 0.5) * 0.8;
      mouseY = (e.clientY / window.innerHeight - 0.5) * 0.8;
    };
    window.addEventListener("mousemove", handleMouseMove);

    // Resize Handler
    const handleResize = () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    };
    window.addEventListener("resize", handleResize);

    // Animasi Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      webGroup.rotation.y += (mouseX - webGroup.rotation.y) * 0.05;
      webGroup.rotation.x += (-mouseY - webGroup.rotation.x) * 0.05;
      webGroup.rotation.z = Math.sin(elapsedTime * 0.3) * 0.1;

      const scale = 1 + Math.sin(elapsedTime * 1.5) * 0.03;
      webGroup.scale.set(scale, scale, scale);

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
      }}
    />
  );
}

export default Background3D;