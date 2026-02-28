import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

const LAYER_COUNT = 8;
const LAYER_SIZE = 1024;
const LAYER_SPREAD = 0.7;
const PLANE_SIZE = 4;

let renderer, scene, camera, controls;
let layerMeshes = [];
let time = 0;
let animId = null;
let initialized = false;

function init() {
  const canvas = document.getElementById('vrCanvas');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x0a0a0f);

  camera = new THREE.PerspectiveCamera(55, 1, 0.1, 100);
  camera.position.set(0, 0, 6);

  controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.minDistance = 1;
  controls.maxDistance = 15;
  controls.autoRotate = true;
  controls.autoRotateSpeed = 0.5;

  scene.add(new THREE.AmbientLight(0x9b59b6, 0.15));

  if ('xr' in navigator) {
    navigator.xr.isSessionSupported('immersive-vr').then(ok => {
      if (ok) renderer.xr.enabled = true;
    }).catch(() => {});
  }

  initialized = true;
}

function resize() {
  if (!renderer) return;
  const canvas = renderer.domElement;
  const w = canvas.clientWidth, h = canvas.clientHeight;
  if (canvas.width !== w || canvas.height !== h) {
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
}

function extractLayers(engine, seed) {
  const offscreen = document.createElement('canvas');
  offscreen.width = offscreen.height = LAYER_SIZE;
  const offEngine = new MandalaEngine(offscreen);

  Object.keys(engine.params).forEach(k => {
    const v = engine.params[k];
    if (v instanceof Set) offEngine.params[k] = new Set(v);
    else if (typeof v === 'object' && v !== null) offEngine.params[k] = { ...v };
    else offEngine.params[k] = v;
  });
  offEngine.generate(seed);

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
    ctx.drawImage(offscreen, 0, 0);
    layers.push(c);
  }
  return { layers, palette: offEngine.getPalette() };
}

function buildScene(layers, palette) {
  layerMeshes.forEach(m => { scene.remove(m); m.geometry.dispose(); m.material.dispose(); });
  layerMeshes = [];

  layers.forEach((cvs, i) => {
    const tex = new THREE.CanvasTexture(cvs);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, side: THREE.DoubleSide,
      depthWrite: false, blending: THREE.NormalBlending
    });
    const geo = new THREE.PlaneGeometry(PLANE_SIZE, PLANE_SIZE);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.z = -(LAYER_COUNT - 1 - i) * LAYER_SPREAD;
    mesh.userData.baseZ = mesh.position.z;
    mesh.userData.rotSpeed = 0.0003 * (i + 1);
    mesh.userData.breathPhase = i * 0.7;
    layerMeshes.push(mesh);
    scene.add(mesh);
  });

  const bgGeo = new THREE.PlaneGeometry(PLANE_SIZE * 2.5, PLANE_SIZE * 2.5);
  const bgMat = new THREE.MeshBasicMaterial({ color: new THREE.Color(palette.bg), side: THREE.DoubleSide });
  const bgMesh = new THREE.Mesh(bgGeo, bgMat);
  bgMesh.position.z = -(LAYER_COUNT) * LAYER_SPREAD - 0.5;
  bgMesh.userData.rotSpeed = 0;
  bgMesh.userData.breathPhase = 0;
  bgMesh.userData.baseZ = bgMesh.position.z;
  layerMeshes.push(bgMesh);
  scene.add(bgMesh);
}

function animate() {
  animId = requestAnimationFrame(animate);
  time += 0.016;
  controls.update();
  resize();

  layerMeshes.forEach(m => {
    if (m.userData.rotSpeed) m.rotation.z += m.userData.rotSpeed;
    if (m.userData.breathPhase !== undefined) {
      m.position.z = m.userData.baseZ + Math.sin(time * 0.5 + m.userData.breathPhase) * 0.08;
    }
  });

  renderer.render(scene, camera);
}

function rebuild() {
  if (!window._mandala) return;
  const { engine } = window._mandala;
  const seed = window._mandala.getSeed();
  const { layers, palette } = extractLayers(engine, seed);
  buildScene(layers, palette);
}

function enable() {
  if (!initialized) init();
  resize();
  rebuild();
  if (!animId) animate();
}

function disable() {
  if (animId) { cancelAnimationFrame(animId); animId = null; }
}

window.addEventListener('vr-enable', enable);
window.addEventListener('vr-disable', disable);
window.addEventListener('vr-rebuild', () => { if (animId) rebuild(); });
