import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Background3D() {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(
      55,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 6;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentRef.appendChild(renderer.domElement);

    const webGroup = new THREE.Group();

    // Garis Radial Tekstur Halus
    const lineMaterial = new THREE.LineBasicMaterial({
      color: 0x3f3f46,
      transparent: true,
      opacity: 0.12,
    });
    const numSpokes = 16;
    for (let i = 0; i < numSpokes; i++) {
      const angle = (i / numSpokes) * Math.PI * 2;
      const points = [
        new THREE.Vector3(0, 0, 0),
        new THREE.Vector3(Math.cos(angle) * 6, Math.sin(angle) * 6, (Math.random() - 0.5) * 0.8),
      ];
      const geometry = new THREE.BufferGeometry().setFromPoints(points);
      const line = new THREE.Line(geometry, lineMaterial);
      webGroup.add(line);
    }

    // Ring Konsentris
    const ringMaterial = new THREE.LineBasicMaterial({
      color: 0x27272a,
      transparent: true,
      opacity: 0.1,
    });
    const numRings = 6;
    for (let r = 1; r <= numRings; r++) {
      const radius = (r / numRings) * 5.0;
      const ringPoints = [];
      for (let i = 0; i <= numSpokes; i++) {
        const angle = (i / numSpokes) * Math.PI * 2;
        ringPoints.push(
          new THREE.Vector3(
            Math.cos(angle) * radius,
            Math.sin(angle) * radius,
            Math.sin(r + i) * 0.15
          )
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPoints);
      const ringLine = new THREE.Line(ringGeo, ringMaterial);
      webGroup.add(ringLine);
    }

    scene.add(webGroup);

    // Animasi Lambat Netral
    let animationFrameId;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      webGroup.rotation.y = elapsedTime * 0.02;
      webGroup.rotation.x = Math.sin(elapsedTime * 0.01) * 0.05;

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
      cancelAnimationFrame(animationFrameId);
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