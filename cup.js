/* ==========================================================================
   Bloom · 3D cup for the Carta (Three.js, drawn in code: no model to load)
   A white ceramic cup on its saucer, a latte heart, soft steam.
   It turns gently with the scroll and only renders while it is on screen.
   ========================================================================== */
import * as THREE from './lib/three.module.min.js';

const C = {
  ceramic: 0xfffdf9,
  saucer: 0xf8f1e8,
  coffee: '#6b4632',
  crema: '#c79a72',
  milk: '#f6ece0',
  steam: 0xcdb9a3
};

function canvasTexture(size, paint) {
  const c = document.createElement('canvas');
  c.width = c.height = size;
  paint(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

/* Coffee surface with a simple latte-art heart */
function latteTexture() {
  return canvasTexture(512, (g, s) => {
    const r = s / 2;
    const base = g.createRadialGradient(r, r, r * 0.1, r, r, r);
    base.addColorStop(0, C.crema);
    base.addColorStop(0.75, C.coffee);
    base.addColorStop(1, '#4a2f22');
    g.fillStyle = base;
    g.fillRect(0, 0, s, s);

    g.fillStyle = C.milk;
    g.save();
    g.translate(r, r * 1.04);
    g.scale(s / 512, s / 512);
    g.beginPath();                       // heart, point towards the handle side
    g.moveTo(0, 95);
    g.bezierCurveTo(-30, 60, -128, 10, -112, -52);
    g.bezierCurveTo(-98, -108, -26, -112, 0, -58);
    g.bezierCurveTo(26, -112, 98, -108, 112, -52);
    g.bezierCurveTo(128, 10, 30, 60, 0, 95);
    g.fill();
    g.restore();

    g.strokeStyle = 'rgba(107,70,50,.55)'; // the pour line through the heart
    g.lineWidth = 6;
    g.beginPath();
    g.moveTo(r, r * 0.48);
    g.lineTo(r, r * 1.42);
    g.stroke();
  });
}

function softDot(alphaCenter) {
  return canvasTexture(128, (g, s) => {
    const r = s / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, `rgba(255,255,255,${alphaCenter})`);
    grd.addColorStop(0.45, `rgba(255,255,255,${alphaCenter * 0.45})`);
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  });
}

function shadowTexture() {
  return canvasTexture(256, (g, s) => {
    const r = s / 2;
    const grd = g.createRadialGradient(r, r, 0, r, r, r);
    grd.addColorStop(0, 'rgba(62,44,35,.30)');
    grd.addColorStop(0.55, 'rgba(62,44,35,.12)');
    grd.addColorStop(1, 'rgba(62,44,35,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, s, s);
  });
}

function buildCup() {
  const group = new THREE.Group();
  const ceramic = new THREE.MeshStandardMaterial({ color: C.ceramic, roughness: 0.32, metalness: 0 });
  const saucerMat = new THREE.MeshStandardMaterial({ color: C.saucer, roughness: 0.4, metalness: 0 });

  // Cup: outer wall up to the lip, then back down the inside (one lathe = real thickness)
  const cupProfile = [
    [0.00, 0.02], [0.44, 0.02], [0.50, 0.05], [0.53, 0.12],
    [0.62, 0.38], [0.72, 0.70], [0.78, 0.94], [0.80, 1.00],
    [0.77, 1.01], [0.75, 0.96], [0.69, 0.72], [0.59, 0.40],
    [0.50, 0.16], [0.00, 0.13]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  const cup = new THREE.Mesh(new THREE.LatheGeometry(cupProfile, 96), ceramic);
  cup.position.y = 0.1;
  group.add(cup);

  // Coffee surface
  const coffee = new THREE.Mesh(
    new THREE.CircleGeometry(0.715, 96),
    new THREE.MeshStandardMaterial({ map: latteTexture(), roughness: 0.25, metalness: 0 })
  );
  coffee.rotation.x = -Math.PI / 2;
  coffee.rotation.z = Math.PI / 2;      // heart points away from the handle
  coffee.position.y = 0.1 + 0.86;
  group.add(coffee);

  // Handle
  const handle = new THREE.Mesh(new THREE.TorusGeometry(0.21, 0.05, 20, 64, Math.PI * 1.25), ceramic);
  handle.rotation.z = -Math.PI * 0.625;
  handle.position.set(0.75, 0.1 + 0.6, 0);
  group.add(handle);

  // Saucer
  const saucerProfile = [
    [0.00, 0.00], [0.62, 0.00], [0.70, 0.03], [1.12, 0.09],
    [1.22, 0.14], [1.24, 0.17], [1.20, 0.17], [1.08, 0.12],
    [0.70, 0.08], [0.60, 0.10], [0.00, 0.10]
  ].map(([x, y]) => new THREE.Vector2(x, y));
  group.add(new THREE.Mesh(new THREE.LatheGeometry(saucerProfile, 96), saucerMat));

  // Soft contact shadow
  const shadow = new THREE.Mesh(
    new THREE.PlaneGeometry(3.2, 3.2),
    new THREE.MeshBasicMaterial({ map: shadowTexture(), transparent: true, depthWrite: false })
  );
  shadow.rotation.x = -Math.PI / 2;
  shadow.position.y = -0.005;
  group.add(shadow);

  return group;
}

function buildSteam() {
  const tex = softDot(0.9);
  const puffs = [];
  const steam = new THREE.Group();
  for (let i = 0; i < 16; i++) {
    const mat = new THREE.SpriteMaterial({ map: tex, color: C.steam, transparent: true, opacity: 0, depthWrite: false });
    const s = new THREE.Sprite(mat);
    s.userData = { phase: i / 16, lane: (i % 3) - 1, seed: Math.random() * 6.28 };
    steam.add(s);
    puffs.push(s);
  }
  steam.position.y = 1.05;
  return { steam, puffs };
}

export function initCup(box, { still = false } = {}) {
  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
  } catch (e) {
    box.remove();
    return;
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);
  box.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  camera.position.set(0, 2.9, 5.6);
  camera.lookAt(0, 0.62, 0);

  scene.add(new THREE.HemisphereLight(0xfffaf2, 0xd8c7b2, 1.5));
  const key = new THREE.DirectionalLight(0xfff1e0, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.DirectionalLight(0xf3dcd2, 0.9);   // faint rose rim, the logo's warmth
  rim.position.set(-4, 2, -3);
  scene.add(rim);

  const cup = buildCup();
  const { steam, puffs } = buildSteam();
  const rig = new THREE.Group();
  rig.add(cup);
  rig.add(steam);
  rig.rotation.x = 0.04;
  scene.add(rig);

  function resize() {
    const w = box.clientWidth || 1, h = box.clientHeight || 1;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
  }
  resize();

  // Scroll → turn: -0.5 when the cup enters at the bottom, +0.5 as it leaves at the top
  function scrollProgress() {
    const r = box.getBoundingClientRect();
    const vh = window.innerHeight || 1;
    const p = (vh - (r.top + r.height / 2)) / (vh + r.height) - 0.5;
    return Math.max(-0.6, Math.min(0.6, p));
  }

  const BASE = -0.55;                    // handle to the right, slightly towards us
  let turn = BASE + scrollProgress() * 2.4;
  const clock = new THREE.Clock();

  function updateSteam(t) {
    puffs.forEach((s) => {
      const d = s.userData;
      const k = (t * 0.16 + d.phase) % 1;            // 0 → 1 life of the puff
      s.position.set(
        d.lane * 0.16 + Math.sin(t * 0.9 + d.seed + k * 5) * 0.12 * k,
        k * 1.25,
        Math.cos(t * 0.7 + d.seed) * 0.08 * k
      );
      const size = 0.28 + k * 0.55;
      s.scale.set(size, size, 1);
      s.material.opacity = Math.sin(Math.PI * k) * 0.32;
    });
  }

  function frame() {
    const t = clock.getElapsedTime();
    const target = BASE + scrollProgress() * 2.4 + Math.sin(t * 0.35) * 0.08;
    turn += (target - turn) * 0.06;
    cup.rotation.y = turn;
    rig.position.y = Math.sin(t * 0.9) * 0.035;
    updateSteam(t);
    renderer.render(scene, camera);
  }

  if (still) {
    cup.rotation.y = BASE;
    updateSteam(2.4);
    renderer.render(scene, camera);
    box.classList.add('is-live');
    if ('ResizeObserver' in window) new ResizeObserver(() => { resize(); renderer.render(scene, camera); }).observe(box);
    return;
  }

  let running = false;
  const io = new IntersectionObserver((entries) => {
    const on = entries[0].isIntersecting;
    if (on && !running) { running = true; renderer.setAnimationLoop(frame); }
    else if (!on && running) { running = false; renderer.setAnimationLoop(null); }
  });
  io.observe(box);
  if ('ResizeObserver' in window) new ResizeObserver(resize).observe(box);

  frame();
  requestAnimationFrame(() => box.classList.add('is-live'));
}
