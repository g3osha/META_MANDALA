import * as THREE from 'three';

const LAYER_COUNT = 10;
const LAYER_SIZE = 1024;
const PLANE_SIZE = 4.5;
const DEPTH_RANGE = 7;
const CAM_Z = 5;
const PARALLAX = 2.2;
const SMOOTH = 0.05;

let renderer, scene, camera;
let layerMeshes = [];
let time = 0;
let animId = null;
let initialized = false;

let videoEl = null, trackCanvas, trackCtx;
let headX = 0, headY = 0;
let smoothX = 0, smoothY = 0;
let trackingMode = 'none';

function init() {
  const canvas = document.getElementById('vrCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);
  scene.fog = new THREE.FogExp2(0x0a0a0f, 0.06);

  camera = new THREE.PerspectiveCamera(50, 1, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  initialized = true;
}

async function startTracking() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: { width: 320, height: 240, facingMode: 'user' }
    });
    videoEl = document.createElement('video');
    videoEl.srcObject = stream;
    videoEl.setAttribute('playsinline', '');
    await videoEl.play();

    trackCanvas = document.createElement('canvas');
    trackCanvas.width = 80;
    trackCanvas.height = 60;
    trackCtx = trackCanvas.getContext('2d', { willReadFrequently: true });

    trackingMode = 'camera';
    showTrackingIndicator(true);
  } catch (e) {
    trackingMode = 'mouse';
    const vrCanvas = document.getElementById('vrCanvas');
    if (vrCanvas) vrCanvas.addEventListener('mousemove', onMouse);
    showTrackingIndicator(false);
  }
}

function stopTracking() {
  if (videoEl && videoEl.srcObject) {
    videoEl.srcObject.getTracks().forEach(t => t.stop());
    videoEl = null;
  }
  if (trackingMode === 'mouse') {
    const vrCanvas = document.getElementById('vrCanvas');
    if (vrCanvas) vrCanvas.removeEventListener('mousemove', onMouse);
  }
  trackingMode = 'none';
  headX = headY = smoothX = smoothY = 0;
  hideTrackingIndicator();
}

function onMouse(e) {
  const rect = e.target.getBoundingClientRect();
  headX = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
  headY = -((e.clientY - rect.top) / rect.height - 0.5) * 2;
}

function detectHead() {
  if (trackingMode !== 'camera' || !videoEl || videoEl.readyState < 2) return;

  trackCtx.drawImage(videoEl, 0, 0, 80, 60);
  const d = trackCtx.getImageData(0, 0, 80, 60).data;
  let sx = 0, sy = 0, cnt = 0;

  for (let y = 0; y < 60; y++) {
    for (let x = 0; x < 80; x++) {
      const i = (y * 80 + x) * 4;
      const r = d[i], g = d[i + 1], b = d[i + 2];
      const cb = 128 - 0.169 * r - 0.331 * g + 0.5 * b;
      const cr = 128 + 0.5 * r - 0.419 * g - 0.081 * b;
      if (cb > 70 && cb < 135 && cr > 130 && cr < 180) {
        sx += x; sy += y; cnt++;
      }
    }
  }

  if (cnt > 30) {
    headX = -((sx / cnt) / 80 - 0.5) * 2;
    headY = -((sy / cnt) / 60 - 0.5) * 2;
  }
}

function showTrackingIndicator(isCamera) {
  let el = document.getElementById('vrTrackIndicator');
  if (!el) {
    el = document.createElement('div');
    el.id = 'vrTrackIndicator';
    el.style.cssText = 'position:absolute;top:8px;left:8px;z-index:10;font:9px "JetBrains Mono",monospace;letter-spacing:1px;color:var(--text-dim,#6a6a8a);opacity:0.6;pointer-events:none;text-transform:uppercase';
    document.getElementById('canvasFrame').appendChild(el);
  }
  el.textContent = isCamera ? '◉ head tracking' : '◎ mouse tracking';
  el.style.display = 'block';
}

function hideTrackingIndicator() {
  const el = document.getElementById('vrTrackIndicator');
  if (el) el.style.display = 'none';
}

function resize() {
  if (!renderer) return;
  const c = renderer.domElement;
  const w = c.clientWidth, h = c.clientHeight;
  if (w === 0 || h === 0) return;
  if (c.width !== w || c.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

function extractLayers(engine, seed) {
  const off = document.createElement('canvas');
  off.width = off.height = LAYER_SIZE;
  const eng = new MandalaEngine(off);

  Object.keys(engine.params).forEach(k => {
    const v = engine.params[k];
    if (v instanceof Set) eng.params[k] = new Set(v);
    else if (typeof v === 'object' && v !== null) eng.params[k] = { ...v };
    else eng.params[k] = v;
  });
  eng.generate(seed);

  const cx = LAYER_SIZE / 2, cy = LAYER_SIZE / 2;
  const maxR = Math.min(cx, cy) * 0.95;
  const layers = [];

  for (let i = 0; i < LAYER_COUNT; i++) {
    const innerR = i === 0 ? 0 : (i / LAYER_COUNT) * maxR;
    const outerR = ((i + 1) / LAYER_COUNT) * maxR;
    const c = document.createElement('canvas');
    c.width = c.height = LAYER_SIZE;
    const ctx = c.getContext('2d');
    ctx.beginPath();
    ctx.arc(cx, cy, outerR, 0, Math.PI * 2);
    if (i > 0) ctx.arc(cx, cy, innerR, 0, Math.PI * 2, true);
    ctx.clip();
    ctx.drawImage(off, 0, 0);
    layers.push(c);
  }
  return { layers, palette: eng.getPalette() };
}

function buildScene(layers, palette) {
  layerMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  layerMeshes = [];

  scene.background = new THREE.Color(palette.bg);

  layers.forEach((cvs, i) => {
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, side: THREE.DoubleSide,
      depthWrite: false
    });
    const layerScale = 1 - ((LAYER_COUNT - 1 - i) / (LAYER_COUNT - 1)) * 0.3;
    const geo = new THREE.PlaneGeometry(PLANE_SIZE * layerScale, PLANE_SIZE * layerScale);
    const mesh = new THREE.Mesh(geo, mat);
    const depth = -((LAYER_COUNT - 1 - i) / (LAYER_COUNT - 1)) * DEPTH_RANGE;
    mesh.position.z = depth;
    mesh.userData.baseZ = depth;
    mesh.userData.breathPhase = i * 0.6;
    layerMeshes.push(mesh);
    scene.add(mesh);
  });

  const bgGeo = new THREE.PlaneGeometry(PLANE_SIZE * 3, PLANE_SIZE * 3);
  const bgMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.bg), side: THREE.DoubleSide });
  const bg = new THREE.Mesh(bgGeo, bgMat);
  bg.position.z = -DEPTH_RANGE - 0.5;
  bg.userData.baseZ = bg.position.z;
  bg.userData.breathPhase = 0;
  layerMeshes.push(bg);
  scene.add(bg);
}

function animate() {
  animId = requestAnimationFrame(animate);
  time += 0.016;

  detectHead();

  smoothX += (headX - smoothX) * SMOOTH;
  smoothY += (headY - smoothY) * SMOOTH;

  const cx = smoothX * PARALLAX;
  const cy = smoothY * PARALLAX;
  camera.position.x = cx;
  camera.position.y = cy;
  camera.position.z = CAM_Z;
  camera.lookAt(cx, cy, -DEPTH_RANGE * 0.5);

  layerMeshes.forEach((m, idx) => {
    if (m.userData.breathPhase) {
      const breath = Math.sin(time * 0.3 + m.userData.breathPhase) * 0.08;
      const pull = Math.sin(time * 0.15) * 0.15 * (idx / layerMeshes.length);
      m.position.z = m.userData.baseZ + breath - pull;
    }
  });

  resize();
  renderer.render(scene, camera);
}

function rebuild() {
  if (!window._mandala) return;
  const { engine } = window._mandala;
  const seed = window._mandala.getSeed();
  const { layers, palette } = extractLayers(engine, seed);
  buildScene(layers, palette);
}

async function enable() {
  try {
    if (!initialized) init();
    resize();
    rebuild();
    await startTracking();
    if (!animId) animate();
    console.log('%c◉ VR mode active — ' + trackingMode + ' tracking', 'color:#e6a800');
  } catch(e) {
    console.error('VR mode error:', e);
  }
}

function disable() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
  stopTracking();
}

window.addEventListener('vr-enable', () => enable());
window.addEventListener('vr-disable', disable);
window.addEventListener('vr-rebuild', () => { if (animId) rebuild(); });
