import React, { useEffect, useRef } from "react";
import * as THREE from "three";

function Mini3D({ color = 0x3b82f6 }) {
  const mountRef = useRef(null);

  useEffect(() => {
    const currentRef = mountRef.current;
    if (!currentRef) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
    camera.position.z = 2.5;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setSize(36, 36);
    currentRef.appendChild(renderer.domElement);

    // Geometri 3D Icosahedron
    const geometry = new THREE.IcosahedronGeometry(0.8, 0);
    const material = new THREE.MeshStandardMaterial({
      color: color,
      wireframe: true,
      metalness: 0.8,
      roughness: 0.2,
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    scene.add(ambientLight);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      mesh.rotation.x += 0.015;
      mesh.rotation.y += 0.02;
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

  return <div ref={mountRef} style={{ width: "36px", height: "36px" }} />;
}

export default Mini3D;