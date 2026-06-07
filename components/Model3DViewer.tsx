'use client';

import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';

interface Model3DViewerProps {
  modelUrl: string;
}

export default function Model3DViewer({ modelUrl }: Model3DViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!containerRef.current || !modelUrl) return;

    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    // Scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf8f8f8);

    // Camera
    const camera = new THREE.PerspectiveCamera(50, w / h, 0.1, 1000);
    camera.position.set(2, 1.5, 2);
    camera.lookAt(0, 0, 0);

    // Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(window.devicePixelRatio);
    container.appendChild(renderer.domElement);

    // Lights
    scene.add(new THREE.AmbientLight(0xffffff, 0.5));
    const dir1 = new THREE.DirectionalLight(0xffffff, 0.8);
    dir1.position.set(5, 5, 5);
    scene.add(dir1);
    const dir2 = new THREE.DirectionalLight(0xffffff, 0.3);
    dir2.position.set(-3, -2, 4);
    scene.add(dir2);

    // Axis helper (X=red, Y=green, Z=blue)
    const axisHelper = new THREE.AxesHelper(1.2);
    scene.add(axisHelper);

    // Grid
    const grid = new THREE.GridHelper(4, 20, 0xdddddd, 0xeeeeee);
    scene.add(grid);

    // Load model
    let model: THREE.Object3D | null = null;
    let isRotating = true;
    let mouseDown = false;
    let mouseX = 0;
    let mouseY = 0;
    let targetRotX = 0;
    let targetRotY = 0;

    const loader = new GLTFLoader();
    loader.load(
      modelUrl,
      (gltf) => {
        model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 1.5 / maxDim;
        model.scale.multiplyScalar(scale);
        const center = box.getCenter(new THREE.Vector3());
        model.position.sub(center.multiplyScalar(scale));
        model.position.y += 0.2;
        scene.add(model);
      },
      undefined,
      (err) => console.error('Model load error:', err)
    );

    // Mouse controls
    const onDown = (e: MouseEvent) => { mouseDown = true; mouseX = e.clientX; mouseY = e.clientY; isRotating = false; };
    const onMove = (e: MouseEvent) => {
      if (!mouseDown || !model) return;
      targetRotY += (e.clientX - mouseX) * 0.01;
      targetRotX += (e.clientY - mouseY) * 0.01;
      mouseX = e.clientX;
      mouseY = e.clientY;
    };
    const onUp = () => { mouseDown = false; isRotating = true; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      camera.position.z = Math.max(1, Math.min(6, camera.position.z + e.deltaY * 0.002));
    };

    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    // Resize
    const onResize = () => {
      if (!container) return;
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    // Animate
    const animate = () => {
      requestAnimationFrame(animate);
      if (model) {
        if (isRotating) targetRotY += 0.003;
        model.rotation.x += (targetRotX - model.rotation.x) * 0.08;
        model.rotation.y += (targetRotY - model.rotation.y) * 0.08;
      }
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.domElement.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('mouseup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [modelUrl]);

  return (
    <div style={s.wrapper}>
      <div ref={containerRef} style={s.canvas} />
      <div style={s.controls}>
        <span style={s.axisLabel}><span style={{color:'#c00'}}>X</span> <span style={{color:'#0a0'}}>Y</span> <span style={{color:'#00c'}}>Z</span></span>
        <span style={s.hint}>גרור = סובב | גלגל = זום</span>
      </div>
    </div>
  );
}

const s: { [key: string]: React.CSSProperties } = {
  wrapper: {
    width: '100%',
  },
  canvas: {
    width: '100%',
    height: '320px',
    borderRadius: '4px',
    overflow: 'hidden',
  },
  controls: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '6px 4px',
    fontSize: '12px',
    color: '#999',
  },
  axisLabel: {
    fontFamily: 'monospace',
    fontSize: '12px',
    letterSpacing: '2px',
  },
  hint: {
    fontSize: '12px',
  },
};
