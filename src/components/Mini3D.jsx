import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Mini3D({ color = 0x2563eb }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
    camera.position.z = 2.8;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(28, 28);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    currentRef.appendChild(renderer.domElement);

    // Geometri Cincin Metalik Elegan
    const geometry = new THREE.TorusGeometry(0.55, 0.18, 16, 48);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      metalness: 0.75,
      roughness: 0.2,
      wireframe: false,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    // Pencahayaan
    const dirLight = new THREE.DirectionalLight(0xffffff, 2.5);
    dirLight.position.set(2, 3, 4);
    scene.add(dirLight);

    const ambLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.012;
      mesh.rotation.y += 0.016;
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      if (currentRef.contains(renderer.domElement)) {
        currentRef.removeChild(renderer.domElement);
      }
    };
  }, [color]);

  return (
    <div
      ref={mountRef}
      style={{
        width: "28px",
        height: "28px",
        display: "inline-block",
        verticalAlign: "middle",
      }}
    />
  );
}

export default Mini3D;