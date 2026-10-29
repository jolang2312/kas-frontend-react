import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Card3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    // Setup Scene, Camera, Renderer
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 1000);
    camera.position.z = 3.8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(200, 200);
    currentRef.appendChild(renderer.domElement);

    const webGroup = new THREE.Group();

    // 1. Garis Radial Jaring Laba-laba
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x2563eb,
      transparent: true,
      opacity: 0.8,
    });
    const numSpokes = 12;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(
          Math.cos(angle) * 1.8,
          Math.sin(angle) * 1.8,
          (Math.random() - 0.5) * 0.4
        ),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      webGroup.add(line);
    }

    // 2. Lingkaran Jaring (Concentric Web Rings)
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x10b981,
      transparent: true,
      opacity: 0.75,
    });
    const numRings = 5;
    for (let r = 1; r <= numRings; r++) {
      const radius = (r / numRings) * 1.6;
      const ringPoints = [];
      for (let i = 0; i <= numSpokes; i++) {
        const angle = (i / numSpokes) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(r + i) * 0.12
          )
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(ringGeo, ringMaterial);
      webGroup.add(ringLine);
    }

    // 3. Partikel Monster Glowing di Tengah
    const particleGeo = new THREE.BufferGeometry();
    const particleCount = 50;
    const posArray = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      posArray[i] = (Math.random() - 0.5) * 2.2;
    }
    particleGeo.setAttribute("position", new THREE.BufferAttribute(posArray, 3));
    const particleMat = new THREE.PointsMaterial({
      size: 0.04,
      color: 0x60a5fa,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    webGroup.add(particles);

    scene.add(webGroup);

    // Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    scene.add(ambientLight);

    // Animasi Loop
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      webGroup.rotation.y = Math.sin(elapsedTime * 0.7) * 0.35;
      webGroup.rotation.x = Math.cos(elapsedTime * 0.5) * 0.25;
      webGroup.rotation.z += 0.004;

      const scale = 1 + Math.sin(elapsedTime * 2) * 0.04;
      webGroup.scale.set(scale, scale, scale);

      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentRef.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
    };
  }, []);

  return <div ref={mountRef} style={{ width: "200px", height: "200px" }} />;
}

export default Card3D;