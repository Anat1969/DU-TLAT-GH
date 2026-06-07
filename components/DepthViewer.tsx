'use client';

import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface DepthViewerProps {
  imageBase64: string;
  depthBase64?: string;
}

/**
 * Generate a depth map from an image using luminance + edge detection.
 * Returns a grayscale data URL.
 */
function generateDepthMap(img: HTMLImageElement): string {
  const c = document.createElement('canvas');
  c.width = img.width;
  c.height = img.height;
  const ctx = c.getContext('2d')!;
  ctx.drawImage(img, 0, 0);
  const imgData = ctx.getImageData(0, 0, c.width, c.height);
  const d = imgData.data;

  // Pass 1: luminance
  const lum = new Float32Array(c.width * c.height);
  for (let i = 0; i < lum.length; i++) {
    const r = d[i * 4], g = d[i * 4 + 1], b = d[i * 4 + 2];
    lum[i] = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  // Pass 2: edge detection (Sobel-like)
  const edges = new Float32Array(lum.length);
  for (let y = 1; y < c.height - 1; y++) {
    for (let x = 1; x < c.width - 1; x++) {
      const idx = y * c.width + x;
      const gx = -lum[idx - 1] + lum[idx + 1];
      const gy = -lum[idx - c.width] + lum[idx + c.width];
      edges[idx] = Math.sqrt(gx * gx + gy * gy);
    }
  }

  // Pass 3: combine (darker = farther, edges = depth discontinuities)
  const depth = new Float32Array(lum.length);
  let maxE = 0;
  for (let i = 0; i < edges.length; i++) if (edges[i] > maxE) maxE = edges[i];
  if (maxE === 0) maxE = 1;

  for (let i = 0; i < lum.length; i++) {
    // Invert luminance (bright objects → closer) + edge boost
    depth[i] = lum[i] * 0.7 + (1 - edges[i] / maxE) * 0.3;
  }

  // Pass 4: Gaussian blur for smoothness
  const blurred = new Float32Array(depth.length);
  const bw = c.width, bh = c.height;
  const kernel = 5;
  for (let y = 0; y < bh; y++) {
    for (let x = 0; x < bw; x++) {
      let sum = 0, count = 0;
      for (let ky = -kernel; ky <= kernel; ky++) {
        for (let kx = -kernel; kx <= kernel; kx++) {
          const ny = y + ky, nx = x + kx;
          if (ny >= 0 && ny < bh && nx >= 0 && nx < bw) {
            sum += depth[ny * bw + nx];
            count++;
          }
        }
      }
      blurred[y * bw + x] = sum / count;
    }
  }

  // Write back as grayscale
  const out = ctx.createImageData(c.width, c.height);
  for (let i = 0; i < blurred.length; i++) {
    const v = Math.floor(blurred[i] * 255);
    out.data[i * 4] = v;
    out.data[i * 4 + 1] = v;
    out.data[i * 4 + 2] = v;
    out.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(out, 0, 0);
  return c.toDataURL('image/jpeg', 0.9);
}

export default function DepthViewer({ imageBase64, depthBase64 }: DepthViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const meshRef = useRef<THREE.Mesh | null>(null);
  const depthDataRef = useRef<{data: Uint8ClampedArray, w: number, h: number, cols: number, rows: number} | null>(null);
  const [depthScale, setDepthScale] = useState(1.5);
  const [showWire, setShowWire] = useState(false);
  const wireRef = useRef<THREE.Mesh | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const w = container.clientWidth;
    const h = container.clientHeight;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050505);

    const camera = new THREE.PerspectiveCamera(50, w / h, 0.01, 500);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    container.appendChild(renderer.domElement);

    // Lighting
    scene.add(new THREE.AmbientLight(0xffffff, 0.7));
    const sun = new THREE.DirectionalLight(0xffcc88, 0.8);
    sun.position.set(5, 5, 8);
    scene.add(sun);
    const back = new THREE.DirectionalLight(0x4466aa, 0.3);
    back.position.set(-5, 3, -5);
    scene.add(back);

    // Load images
    const texImg = new Image();
    texImg.src = imageBase64;
    const depImg = new Image();

    // Generate depth map from image if not provided
    texImg.onload = () => {
      if (depthBase64) {
        depImg.src = depthBase64;
      } else {
        depImg.src = generateDepthMap(texImg);
      }
    };

    let loadCount = 0;
    const onLoad = () => {
      loadCount++;
      if (loadCount < 1) return;

      // Get depth data
      const canvas = document.createElement('canvas');
      canvas.width = depImg.width;
      canvas.height = depImg.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(depImg, 0, 0);
      const depthData = ctx.getImageData(0, 0, canvas.width, canvas.height).data;

      const step = 4;
      const cols = Math.floor(canvas.width / step);
      const rows = Math.floor(canvas.height / step);

      depthDataRef.current = { data: depthData, w: canvas.width, h: canvas.height, cols, rows };

      const geo = new THREE.BufferGeometry();
      const positions: number[] = [];
      const uvCoords: number[] = [];
      const indices: number[] = [];
      const scaleXY = 6;

      for (let i = 0; i < rows; i++) {
        for (let j = 0; j < cols; j++) {
          const px = j * step;
          const py = i * step;
          const idx = (py * canvas.width + px) * 4;
          const d = depthData[idx] / 255.0;
          const x = (j / cols - 0.5) * scaleXY;
          const y = -(i / rows - 0.5) * scaleXY;
          const z = d * depthScale;
          positions.push(x, y, z);
          uvCoords.push(j / cols, 1 - i / rows);
        }
      }

      for (let i = 0; i < rows - 1; i++) {
        for (let j = 0; j < cols - 1; j++) {
          const a = i * cols + j;
          const b = i * cols + (j + 1);
          const c = (i + 1) * cols + (j + 1);
          const d2 = (i + 1) * cols + j;
          indices.push(a, b, c, a, c, d2);
        }
      }

      geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvCoords, 2));
      geo.setIndex(indices);
      geo.computeVertexNormals();

      const texture = new THREE.Texture(texImg);
      texture.needsUpdate = true;

      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        side: THREE.DoubleSide,
        roughness: 0.8,
        metalness: 0.1,
      });

      const mesh = new THREE.Mesh(geo, mat);
      scene.add(mesh);
      meshRef.current = mesh;

      const wireMat = new THREE.MeshBasicMaterial({
        color: 0xffb347,
        wireframe: true,
        transparent: true,
        opacity: 0.15,
      });
      const wire = new THREE.Mesh(geo.clone(), wireMat);
      wire.visible = false;
      scene.add(wire);
      wireRef.current = wire;
    };

    depImg.onload = onLoad;

    // Mouse controls
    let drag = false;
    let prevX = 0, prevY = 0;
    let rX = 0, rY = 0, tRX = 0, tRY = 0, zoom = 8;

    const onDown = (e: MouseEvent) => { drag = true; prevX = e.clientX; prevY = e.clientY; };
    const onMove = (e: MouseEvent) => {
      if (!drag) return;
      tRY += (e.clientX - prevX) * 0.004;
      tRX += (e.clientY - prevY) * 0.004;
      prevX = e.clientX;
      prevY = e.clientY;
    };
    const onUp = () => { drag = false; };
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoom = Math.max(2, Math.min(20, zoom + e.deltaY * 0.005));
    };

    renderer.domElement.addEventListener('mousedown', onDown);
    renderer.domElement.addEventListener('mousemove', onMove);
    renderer.domElement.addEventListener('mouseup', onUp);
    renderer.domElement.addEventListener('wheel', onWheel, { passive: false });

    const animate = () => {
      requestAnimationFrame(animate);
      rX += (tRX - rX) * 0.08;
      rY += (tRY - rY) * 0.08;
      camera.position.set(
        Math.sin(rY) * zoom,
        Math.sin(rX) * zoom * 0.5,
        Math.cos(rY) * zoom
      );
      camera.lookAt(0, 0, 0);
      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const nw = container.clientWidth;
      const nh = container.clientHeight;
      camera.aspect = nw / nh;
      camera.updateProjectionMatrix();
      renderer.setSize(nw, nh);
    };
    window.addEventListener('resize', onResize);

    return () => {
      renderer.domElement.removeEventListener('mousedown', onDown);
      renderer.domElement.removeEventListener('mousemove', onMove);
      renderer.domElement.removeEventListener('mouseup', onUp);
      renderer.domElement.removeEventListener('wheel', onWheel);
      window.removeEventListener('resize', onResize);
      container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [imageBase64, depthBase64]);

  // Update depth when scale changes
  useEffect(() => {
    const mesh = meshRef.current;
    const dd = depthDataRef.current;
    if (!mesh || !dd) return;

    const pos = mesh.geometry.attributes.position;
    const { data, w, cols, rows } = dd;
    const step = 4;
    const scaleXY = 6;

    for (let i = 0; i < rows; i++) {
      for (let j = 0; j < cols; j++) {
        const px = j * step;
        const py = i * step;
        const idx = (py * w + px) * 4;
        const d = data[idx] / 255.0;
        const vi = i * cols + j;
        pos.setZ(vi, d * depthScale);
      }
    }
    pos.needsUpdate = true;
    mesh.geometry.computeVertexNormals();

    if (wireRef.current) {
      const wPos = wireRef.current.geometry.attributes.position;
      for (let k = 0; k < pos.count; k++) {
        wPos.setZ(k, pos.getZ(k));
      }
      wPos.needsUpdate = true;
    }
  }, [depthScale]);

  useEffect(() => {
    if (wireRef.current) wireRef.current.visible = showWire;
  }, [showWire]);

  return (
    <div style={st.wrapper}>
      <div ref={containerRef} style={st.canvas} />
      <div style={st.controls}>
        <button onClick={() => setDepthScale(0.5)} style={{...st.btn, ...(depthScale === 0.5 ? st.btnActive : {})}}>עומק נמוך</button>
        <button onClick={() => setDepthScale(1.5)} style={{...st.btn, ...(depthScale === 1.5 ? st.btnActive : {})}}>עומק בינוני</button>
        <button onClick={() => setDepthScale(3.0)} style={{...st.btn, ...(depthScale === 3.0 ? st.btnActive : {})}}>עומק גבוה</button>
        <button onClick={() => setShowWire(!showWire)} style={{...st.btn, ...(showWire ? st.btnActive : {})}}>רשת</button>
      </div>
      <div style={st.hint}>
        <span style={{color:'#ffb347'}}>גרור = סיבוב</span> | <span>גלגלת = זום</span>
      </div>
    </div>
  );
}

const st: { [key: string]: React.CSSProperties } = {
  wrapper: { width: '100%', position: 'relative' },
  canvas: { width: '100%', height: '400px', borderRadius: '6px', overflow: 'hidden', backgroundColor: '#050505' },
  controls: {
    display: 'flex', gap: '6px', justifyContent: 'center',
    padding: '8px 0 4px',
  },
  btn: {
    background: '#222', color: '#ccc', border: '1px solid #444',
    padding: '6px 12px', cursor: 'pointer', fontFamily: 'inherit',
    fontSize: '12px', borderRadius: '3px', transition: 'all 0.15s',
  },
  btnActive: {
    background: '#ffb347', color: '#000', borderColor: '#ffb347',
  },
  hint: {
    textAlign: 'center', fontSize: '11px', color: '#666', padding: '2px 0',
  },
};
