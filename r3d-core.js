// Cohesif BTP — moteur commun des simulateurs 3D (toiture-3d.js, facade-3d.js)
import * as THREE from './vendor/three/three.module.min.js';
import { OrbitControls } from './vendor/three/OrbitControls.js';

export { THREE };
export const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
export const easeOut = (p) => 1 - Math.pow(1 - p, 3);
export const easeInOut = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
// Téléphones et tablettes : ombres plus légères (la mémoire graphique y est limitée, surtout sur iPhone)
export const LIGHT = window.matchMedia('(pointer: coarse)').matches || Math.min(screen.width, screen.height) < 820;
export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const fmt = (n) => n.toLocaleString('fr-FR');

// Générateur pseudo-aléatoire stable : la même toiture à chaque visite
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function ringGeometry(outerW, outerH, bar, depth) {
  const s = new THREE.Shape();
  s.moveTo(-outerW / 2, -outerH / 2); s.lineTo(outerW / 2, -outerH / 2);
  s.lineTo(outerW / 2, outerH / 2); s.lineTo(-outerW / 2, outerH / 2); s.closePath();
  const h = new THREE.Path();
  const iw = outerW / 2 - bar, ih = outerH / 2 - bar;
  h.moveTo(-iw, -ih); h.lineTo(-iw, ih); h.lineTo(iw, ih); h.lineTo(iw, -ih); h.closePath();
  s.holes.push(h);
  const geo = new THREE.ExtrudeGeometry(s, { depth, bevelEnabled: false });
  geo.translate(0, 0, -depth / 2);
  return geo;
}

export const mat = {
  wood: () => new THREE.MeshStandardMaterial({ color: 0xc89a5e, roughness: 0.85 }),
  woodLight: () => new THREE.MeshStandardMaterial({ color: 0xdcb57c, roughness: 0.85 }),
  tile: () => new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.62, metalness: 0.0 }),
  zinc: () => new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.35, metalness: 0.55 }),
  dark: () => new THREE.MeshStandardMaterial({ color: 0x3a3e44, roughness: 0.45, metalness: 0.4 }),
  white: () => new THREE.MeshStandardMaterial({ color: 0xf4f2ee, roughness: 0.9 }),
  glass: () => new THREE.MeshStandardMaterial({ color: 0x9fc6dc, roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.45 }),
  film: (c, o) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.7, transparent: true, opacity: o, side: THREE.DoubleSide })
};

/*
  createViewer(root, cfg)
  cfg.builders : { mode: (api) => scène }  — une scène expose group, update(dt) et, selon le cas,
                 replay(), run(), toggle(), setColor(hex), setSplit(v), step()
  cfg.info(mode) : données du panneau (titre, texte, specs, points)
  cfg.initial    : vue affichée au chargement
  cfg.onButton(bouton, api) : boutons propres à un simulateur (renvoie true si traité)
*/
// Affiche le message de secours et, en petit, la cause (utile pour un retour client)
export function fail(root, err) {
  root.classList.remove('r3d-ready');
  root.classList.add('r3d-fail');
  const box = root.querySelector('.r3d-err');
  if (box) box.textContent = err ? 'Détail : ' + (err.message || err) : '';
}

// Crée le rendu WebGL ; si l'appareil refuse, réessaie avec des réglages plus légers sur un canvas neuf
function makeRenderer(stage) {
  const tries = [
    { antialias: !LIGHT || (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' },
    { antialias: false },
    { antialias: false, powerPreference: 'low-power', precision: 'mediump' }
  ];
  let err = null;
  for (let i = 0; i < tries.length; i++) {
    let canvas = stage.querySelector('canvas');
    if (i > 0) { const c = canvas.cloneNode(false); canvas.replaceWith(c); canvas = c; }
    try {
      const r = new THREE.WebGLRenderer({ canvas, alpha: true, ...tries[i] });
      if (r.getContext().isContextLost()) throw new Error('Contexte WebGL perdu');
      return { renderer: r, canvas };
    } catch (e) { err = e; }
  }
  throw err || new Error('WebGL indisponible');
}

export function createViewer(root, cfg) {
  const stage = root.querySelector('.r3d-stage');
  const labelsBox = stage.querySelector('.r3d-labels');
  const caption = root.querySelector('.r3d-caption');
  const info = root.querySelector('.r3d-info');

  let renderer, canvas;
  try {
    ({ renderer, canvas } = makeRenderer(stage));
  } catch (e) {
    fail(root, e);
    return null;
  }
  let pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  renderer.setPixelRatio(pixelRatio);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.localClippingEnabled = true; // découpe avant / après (façade)

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
  scene.add(new THREE.HemisphereLight(0xffffff, 0xe6d6c8, 1.25));
  const sun = new THREE.DirectionalLight(0xffffff, 2.4);
  sun.position.set(4, 9, 6);
  sun.castShadow = true;
  sun.shadow.mapSize.set(LIGHT ? 1024 : 2048, LIGHT ? 1024 : 2048);
  Object.assign(sun.shadow.camera, { left: -6, right: 6, top: 6, bottom: -6, near: 1, far: 30 });
  sun.shadow.bias = -0.0004;
  sun.shadow.normalBias = 0.02;
  scene.add(sun);
  const fill = new THREE.DirectionalLight(0xffe7d6, 0.6);
  fill.position.set(-6, 3, -4);
  scene.add(fill);

  const ground = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.13 }));
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  const world = new THREE.Group();
  scene.add(world);

  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.dampingFactor = 0.08;
  controls.enablePan = false;
  controls.enableZoom = false;
  controls.rotateSpeed = 0.7;
  controls.minPolarAngle = 0.25;
  controls.maxPolarAngle = Math.PI / 2 - 0.06;
  let touched = false;
  controls.addEventListener('start', () => { touched = true; root.classList.add('r3d-touched'); });

  /* Étiquettes HTML projetées */
  let labels = [];
  function addLabel(text, obj, local, opts = {}) {
    const el = document.createElement('div');
    el.className = 'r3d-label' + (opts.cls ? ' ' + opts.cls : '');
    el.textContent = text;
    labelsBox.appendChild(el);
    const l = { el, obj, local: local.clone(), show: opts.show || (() => true) };
    labels.push(l);
    return l;
  }
  const tmpV = new THREE.Vector3();
  function updateLabels() {
    const w = stage.clientWidth, h = stage.clientHeight;
    labels.forEach((l) => {
      tmpV.copy(l.local);
      l.obj.localToWorld(tmpV);
      tmpV.project(camera);
      const vis = l.show() && tmpV.z < 1;
      l.el.style.opacity = vis ? '1' : '0';
      l.el.style.transform = `translate(${((tmpV.x + 1) / 2) * w}px, ${((1 - tmpV.y) / 2) * h}px) translate(-50%, -50%)`;
    });
  }

  /* Scène courante */
  let current = null; // { group, update(t, dt), dispose? }
  function clearScene() {
    if (!current) return;
    world.remove(current.group);
    current.group.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.isInstancedMesh) o.dispose(); // positions et couleurs des objets répétés (tuiles, fibres…)
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach((m) => {
        // libère aussi les textures de la vue (sauf celles gardées en cache, marquées userData.keep)
        Object.values(m).forEach((v) => { if (v && v.isTexture && !v.userData.keep) v.dispose(); });
        m.dispose();
      });
    });
    labels.forEach((l) => l.el.remove());
    labels = [];
    current = null;
  }

  function frame(group, center, dist, polar = 1.0, azim = 0.62) {
    world.rotation.set(0, 0, 0);
    const aspect = stage.clientWidth / Math.max(1, stage.clientHeight);
    const d = dist * (aspect < 1.15 ? Math.pow(1.15 / aspect, 0.5) : 1);
    controls.target.copy(center);
    camera.position.set(
      center.x + d * Math.sin(polar) * Math.sin(azim),
      center.y + d * Math.cos(polar),
      center.z + d * Math.sin(polar) * Math.cos(azim)
    );
    controls.update();
    frame.last = [group, center, dist, polar, azim];
  }

  function placePan(pan, pitchDeg, L, lift = 0.75) {
    const p = THREE.MathUtils.degToRad(pitchDeg);
    pan.rotation.x = p - Math.PI / 2;
    pan.position.set(0, lift, (L / 2) * Math.cos(p));
    return new THREE.Vector3(0, lift + (L / 2) * Math.sin(p), 0);
  }

  /* ─────────── Panneau d'informations */
  function renderInfo(d) {
    info.querySelector('.r3d-info-title').textContent = d.titre;
    info.querySelector('.r3d-info-text').textContent = d.texte;
    info.querySelector('.r3d-specs').innerHTML = d.specs
      .map(([k, v]) => `<div class="r3d-spec"><span>${k}</span><strong>${v}</strong></div>`).join('');
    info.querySelector('.r3d-points').innerHTML = d.points.map((p) => `<li>${p}</li>`).join('');
  }

  /* ─────────── Interface */
  let mode = null;
  const api = { root, world, caption, addLabel, frame, placePan, show, wake: () => wake(), get mode() { return mode; } };
  function show(m) {
    mode = m;
    root.dataset.mode = m;
    clearScene();
    current = cfg.builders[m](api);
    renderInfo(cfg.info(m));
    root.querySelectorAll('[data-r3d-mode]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.r3dMode === m)));
    root.querySelectorAll('[data-r3d="explode"]').forEach((b) => { b.textContent = 'Assembler'; });
    if (cfg.onShow) cfg.onShow(m, api);
    wake();
  }

  root.addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (!b || !root.contains(b) || !current) return;
    if (cfg.onButton && cfg.onButton(b, api)) { wake(); return; }
    if (b.dataset.r3dMode) { if (b.dataset.r3dMode !== mode) show(b.dataset.r3dMode); }
    else if (b.dataset.r3d === 'replay' && current.replay) current.replay();
    else if (b.dataset.r3d === 'clean' && current.run) current.run();
    else if (b.dataset.r3d === 'step' && current.step) current.step(b);
    else if (b.dataset.r3d === 'explode' && current.toggle) {
      const on = current.toggle();
      b.textContent = on ? 'Assembler' : 'Vue éclatée';
    } else if (b.dataset.r3dColor && current.setColor) {
      current.setColor(b.dataset.r3dColor);
      b.parentElement.querySelectorAll('[data-r3d-color]').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
    }
    wake();
  });
  root.querySelectorAll('[data-r3d="split"]').forEach((range) => {
    range.addEventListener('input', () => { if (current && current.setSplit) { current.setSplit(range.value / 100); wake(); } });
  });

  /* ─────────── Boucle de rendu (uniquement quand le bloc est visible) */
  let visible = true, running = false, last = 0, idleFrames = 0, lost = false;
  // Appareil trop lent (moins de ~28 images/s) : on baisse la résolution par paliers, jamais sous 1
  let perfFrames = 0, perfTime = 0;
  function adaptQuality(dt) {
    if (pixelRatio <= 1) return;
    perfFrames++; perfTime += dt;
    if (perfFrames < 45) return;
    if (perfTime / perfFrames > 1 / 28) {
      pixelRatio = Math.max(1, pixelRatio - 0.5);
      renderer.setPixelRatio(pixelRatio);
      resize();
    }
    perfFrames = 0; perfTime = 0;
  }
  function resize() {
    const w = stage.clientWidth, h = stage.clientHeight;
    if (!w || !h) return;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    if (frame.last) frame(...frame.last);
  }
  function tick(now) {
    if (!visible || document.hidden || lost) { running = false; return; }
    const dt = Math.min(0.05, last ? (now - last) / 1000 : 0.016);
    if (last) adaptQuality(dt);
    last = now;
    const animating = current && current.update(dt);
    if (!touched && !REDUCED) world.rotation.y = Math.sin(now / 4200) * 0.16;
    const moved = controls.update();
    updateLabels();
    renderer.render(scene, camera);
    idleFrames = animating || moved || !touched ? 0 : idleFrames + 1;
    if (idleFrames > 90) { running = false; last = 0; return; } // au repos : on arrête la boucle
    requestAnimationFrame(tick);
  }
  function wake() {
    idleFrames = 0;
    if (!running && visible) { running = true; last = 0; requestAnimationFrame(tick); }
  }
  controls.addEventListener('change', wake);
  new ResizeObserver(() => { resize(); wake(); }).observe(stage);
  // plusieurs changements peuvent arriver d'un coup (sortie puis retour à l'écran) : la dernière entrée est l'état actuel
  new IntersectionObserver((e) => { visible = e[e.length - 1].isIntersecting; if (visible) wake(); }, { threshold: 0.05 }).observe(stage);
  document.addEventListener('visibilitychange', wake);


  // iPhone / iPad : le système peut reprendre la mémoire graphique (onglet en arrière-plan, autre app).
  // On garde la main, puis on reconstruit la vue quand le contexte revient ; sinon, message de secours.
  let lostTimer = 0;
  let parked = false;
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault();
    lost = true; running = false;
    clearTimeout(lostTimer);
    if (!parked) lostTimer = setTimeout(() => { if (lost && !parked) fail(root, new Error('Contexte WebGL perdu')); }, 4000);
  });
  // Page quittée (gardée en mémoire par le bouton « retour ») : on rend la mémoire graphique à Safari,
  // sinon les pages 3D visitées s'additionnent et l'iPhone finit par refuser d'en afficher une nouvelle.
  const loseExt = renderer.getContext().getExtension('WEBGL_lose_context');
  window.addEventListener('pagehide', () => {
    if (!loseExt || lost) return;
    parked = true;
    loseExt.loseContext();
  });
  window.addEventListener('pageshow', () => {
    if (!parked) return;
    parked = false;
    loseExt.restoreContext();
  });
  canvas.addEventListener('webglcontextrestored', () => {
    lost = false;
    clearTimeout(lostTimer);
    root.classList.remove('r3d-fail');
    root.classList.add('r3d-ready');
    try { show(mode); } catch (err) { fail(root, err); }
  });

  resize();
  try {
    show(cfg.initial);
  } catch (e) {
    fail(root, e);
    return null;
  }
  root.classList.add('r3d-ready');
  return api;
}
