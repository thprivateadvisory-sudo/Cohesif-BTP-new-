// Cohesif BTP — panneau de laine de roche en 3D (le panneau, les 5 densités, dans un mur, votre commande)
// Chargé à la demande par laine.js. Suit le calculateur via l'évènement window « laine:calc »
// (detail = { n: nombre de panneaux, dens: densité en kg/m³ }) ; un choix de densité dans la 3D
// est renvoyé au calculateur par « laine:pick ».
import { THREE, REDUCED, easeOut, easeInOut, clamp01, fmt, rng, mat, createViewer } from './r3d-core.js?v=20261003';

const P = { L: 1.2, W: 0.6, T: 0.05 }; // 1 200 × 600 × 50 mm
const TILE = 0.6; // une texture couvre 60 × 60 cm de face
const PAQUET = 10; // panneaux par paquet (illustration)
const PAQUETS_PALETTE = 8; // 2 paquets par rang, 4 rangs (illustration)
const MAX_PALETTES = 12;

const DENS = {
  40: { kg: 1.4, nom: 'Légère', usage: 'cloisons, doublages, combles', l: 0.66, s: 0.42, c: 0.32 },
  60: { kg: 2.2, nom: 'Polyvalente', usage: 'doublages, rampants, acoustique', l: 0.62, s: 0.44, c: 0.2 },
  80: { kg: 2.9, nom: 'Rigide', usage: 'murs, bardages, façades ventilées', l: 0.58, s: 0.46, c: 0.12 },
  100: { kg: 3.6, nom: 'Haute densité', usage: 'planchers, toitures, protection feu', l: 0.54, s: 0.47, c: 0.07 },
  120: { kg: 4.3, nom: 'Très haute densité', usage: 'haute densité, usages techniques', l: 0.5, s: 0.48, c: 0.035 }
};
const LISTE = [40, 60, 80, 100, 120];
const kgTxt = (kg) => (kg >= 1000 ? `≈ ${(kg / 1000).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t` : `≈ ${fmt(Math.round(kg))} kg`);

const INFOS = {
  panneau: {
    titre: 'Panneau de laine de roche 1 200 × 600 × 50 mm',
    texte: "Un panneau rigide de fibres de roche liées entre elles. Sa largeur de 600 mm correspond à l'entraxe courant des ossatures : il se glisse entre deux montants sans découpe. Choisissez une densité pour voir le panneau et son poids changer.",
    specs: [['Dimensions', '1 200 × 600 mm'], ['Épaisseur', '50 mm'], ['Surface', '0,72 m² par panneau'], ['Volume', '0,036 m³ par panneau']],
    points: [
      'Fibres de roche fondue, étirées puis liées en un matelas homogène.',
      'Incombustible : la référence quand la protection feu compte.',
      'Isolant thermique et acoustique à la fois.',
      'Se découpe au couteau à isolant pour les ajustements.'
    ]
  },
  densites: {
    titre: 'Les 5 densités sous la même charge',
    texte: "Même format, même épaisseur : la densité fait la fermeté du panneau. Sous une même charge, la laine la plus légère s'écrase davantage ; la plus dense garde son épaisseur. Cliquez sur « Appliquer la charge » pour comparer.",
    specs: [['40 kg/m³', '≈ 1,4 kg / panneau'], ['80 kg/m³', '≈ 2,9 kg / panneau'], ['120 kg/m³', '≈ 4,3 kg / panneau'], ['Format', 'Identique pour toutes']],
    points: [
      '40 à 60 kg/m³ : cloisons, doublages, combles, là où le panneau ne porte rien.',
      '80 kg/m³ : le bon compromis pour les murs, bardages et façades ventilées.',
      '100 à 120 kg/m³ : planchers, toitures et supports soumis à charge.',
      'Écrasement exagéré dans la maquette pour la lecture : comparaison qualitative.'
    ]
  },
  mur: {
    titre: 'Dans un mur sur ossature',
    texte: "Rails au sol et au plafond, montants tous les 60 cm, puis les panneaux de 600 mm glissés entre les montants, sans vide. La plaque BA13 vient ensuite fermer le mur.",
    specs: [['Entraxe', '600 mm, comme le panneau'], ['Hauteur', '2 panneaux + 1 recoupe'], ['Finition', 'Plaque de plâtre BA13'], ['Pose', 'Possible par nos équipes']],
    points: [
      'Panneaux bien jointifs, sans vide entre eux ni contre les montants.',
      'La dernière rangée est recoupée à la hauteur restante.',
      'Isolant et plaques BA13 livrés ensemble sur le chantier.',
      'Ouvrage à réaliser selon les DTU applicables et la fiche technique du produit.'
    ]
  },
  commande: {
    titre: 'Votre commande en paquets',
    texte: "La quantité calculée sur cette page s'affiche ici en paquets filmés sur palettes. Changez la surface, l'épaisseur ou la densité dans le calculateur : la maquette suit.",
    specs: [['Un panneau', '0,72 m² · 0,036 m³'], ['Paquet', `${PAQUET} panneaux (illustration)`], ['Palette', `${PAQUET * PAQUETS_PALETTE} panneaux (illustration)`], ['Livraison', 'Partout en France, sur devis']],
    points: [
      'Paquets filmés : protégés de l’humidité et de la poussière jusqu’à la pose.',
      'Tarif dégressif selon le volume commandé.',
      'Livraison sur chantier ou dépôt, ou enlèvement : à préciser dans la demande.',
      'Conditionnement réel indiqué avec le devis, selon le lot livré.'
    ]
  }
};

/* ────────────────────────────────────────── Textures de fibres (raccordables, mises en cache) */

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.anisotropy = 4;
  t.userData.keep = true; // en cache, partagée entre les vues : jamais libérée
  return t;
}

// Dessine une forme sur la toile et ses copies décalées, pour que la texture se répète sans couture
function wrapDraw(g, w, h, x, y, rad, draw) {
  const xs = [0], ys = [0];
  if (x < rad) xs.push(w); if (x > w - rad) xs.push(-w);
  if (y < rad) ys.push(h); if (y > h - rad) ys.push(-h);
  xs.forEach((dx) => ys.forEach((dy) => draw(x + dx, y + dy)));
}

const baseColor = (d) => { const k = DENS[d]; return `hsl(42, ${Math.round(k.s * 100)}%, ${Math.round(k.l * 100)}%)`; };

const cache = {};
// Face du panneau : marbrures, fibres en tous sens, grains sombres ; plus serré quand la densité monte
function faceTexture(d) {
  const key = 'f' + d;
  if (cache[key]) return cache[key];
  const k = LISTE.indexOf(d) / 4; // 0 → 1
  cache[key] = canvasTexture(512, 512, (g, w, h) => {
    const r = rng(100 + d);
    g.fillStyle = baseColor(d); g.fillRect(0, 0, w, h);
    for (let i = 0; i < 160; i++) {
      const x = r() * w, y = r() * h, rad = 15 + r() * 60;
      const light = r() < 0.5;
      wrapDraw(g, w, h, x, y, rad, (px, py) => {
        const gr = g.createRadialGradient(px, py, 0, px, py, rad);
        gr.addColorStop(0, light ? `rgba(255,246,215,${0.08 + r() * 0.1})` : `rgba(95,72,35,${0.06 + r() * 0.08})`);
        gr.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = gr; g.fillRect(px - rad, py - rad, rad * 2, rad * 2);
      });
    }
    const n = Math.round(3200 + k * 2600);
    g.lineCap = 'round';
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = r() * h, len = (3 + r() * 17) * (1.15 - k * 0.35);
      const a = r() * Math.PI, bend = (r() - 0.5) * len * 0.6;
      const light = r() < 0.55;
      g.strokeStyle = light ? `rgba(255,248,222,${0.12 + r() * 0.3})` : `rgba(80,60,28,${0.1 + r() * 0.28})`;
      g.lineWidth = 0.4 + r() * 0.7;
      wrapDraw(g, w, h, x, y, len, (px, py) => {
        g.beginPath();
        g.moveTo(px, py);
        g.quadraticCurveTo(px + Math.cos(a) * len / 2 - Math.sin(a) * bend, py + Math.sin(a) * len / 2 + Math.cos(a) * bend, px + Math.cos(a) * len, py + Math.sin(a) * len);
        g.stroke();
      });
    }
    for (let i = 0; i < 260 + k * 220; i++) {
      g.fillStyle = `rgba(55,40,20,${0.25 + r() * 0.4})`;
      const s = 0.6 + r() * 1.1;
      g.fillRect(r() * w, r() * h, s, s);
    }
  });
  return cache[key];
}

// Tranche : fibres en fines couches parallèles à la face, liseré de joint en bas (visible dans les paquets)
function edgeTexture(d) {
  const key = 'e' + d;
  if (cache[key]) return cache[key];
  const k = LISTE.indexOf(d) / 4;
  cache[key] = canvasTexture(512, 48, (g, w, h) => {
    const r = rng(200 + d);
    g.fillStyle = baseColor(d); g.fillRect(0, 0, w, h);
    for (let y = 0; y < h; y += 1.5 + r() * 2.5) {
      g.fillStyle = r() < 0.5 ? `rgba(255,245,215,${0.05 + r() * 0.1})` : `rgba(90,68,32,${0.05 + r() * 0.1})`;
      g.fillRect(0, y, w, 0.6 + r() * 1.5);
    }
    const n = Math.round(1300 + k * 1200);
    for (let i = 0; i < n; i++) {
      const x = r() * w, y = 1.5 + r() * (h - 4), len = 6 + r() * 35, a = (r() - 0.5) * 0.25;
      g.strokeStyle = r() < 0.55 ? `rgba(255,248,222,${0.15 + r() * 0.3})` : `rgba(75,55,25,${0.12 + r() * 0.3})`;
      g.lineWidth = 0.4 + r() * 0.6;
      wrapDraw(g, w, h, x, y, len, (px, py) => {
        g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a) * len, py + Math.sin(a) * len); g.stroke();
      });
    }
    g.fillStyle = 'rgba(60,45,20,0.35)'; g.fillRect(0, h - 1, w, 1);
  });
  return cache[key];
}

/* ────────────────────────────────────────── Panneau (toujours construit à plat : épaisseur sur y) */

// Bords légèrement irréguliers, comme une laine découpée. Les UV sont mis à l'échelle du panneau :
// une seule texture par densité sert à tous les formats (stack = nombre de panneaux empilés sur la tranche).
function irregularBox(a, t, b, seed, stack = 1) {
  const geo = new THREE.BoxGeometry(a, t, b, Math.max(2, Math.round(a * 60)), 2, Math.max(2, Math.round(b * 60)));
  const pos = geo.attributes.position, nor = geo.attributes.normal, uv = geo.attributes.uv;
  const s = seed * 1.37;
  for (let i = 0; i < pos.count; i++) {
    const nx = nor.getX(i), ny = nor.getY(i);
    if (nx) uv.setXY(i, uv.getX(i) * b / TILE, uv.getY(i) * stack);
    else if (ny) uv.setXY(i, uv.getX(i) * a / TILE, uv.getY(i) * b / TILE);
    else uv.setXY(i, uv.getX(i) * a / TILE, uv.getY(i) * stack);
    let x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
    const n = Math.sin(x * 41 + s) * Math.cos(z * 37 - s) + 0.5 * Math.sin((x + z) * 97 + s * 3);
    if (Math.abs(x) > a / 2 - 1e-4) x += Math.sign(x) * n * 0.0018;
    if (Math.abs(z) > b / 2 - 1e-4) z += Math.sign(z) * n * 0.0018;
    if (y > t / 2 - 1e-4) y += n * 0.0007;
    pos.setXYZ(i, x, y, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function woolMaterials(d) {
  const mf = new THREE.MeshStandardMaterial({ map: faceTexture(d), bumpMap: faceTexture(d), bumpScale: 1.6, roughness: 1 });
  const me = new THREE.MeshStandardMaterial({ map: edgeTexture(d), bumpMap: edgeTexture(d), bumpScale: 1.2, roughness: 1 });
  const mats = [me, me, mf, mf, me, me]; // +x −x +y −y +z −z
  mats.dispose = () => { mf.dispose(); me.dispose(); };
  return mats;
}

function panelMesh(d, a = P.L, b = P.W, seed = 1) {
  const mesh = new THREE.Mesh(irregularBox(a, P.T, b, seed), woolMaterials(d));
  mesh.castShadow = true; mesh.receiveShadow = true;
  return mesh;
}

function setPanelDens(mesh, d) {
  const old = mesh.material;
  mesh.material = woolMaterials(d);
  old.dispose();
}

// Fibres folles qui dépassent des bords
function fuzz(d, a, b, count, seed) {
  const r = rng(seed);
  const geo = new THREE.CylinderGeometry(0.0004, 0.0004, 1, 3);
  geo.translate(0, 0.5, 0);
  const m = new THREE.InstancedMesh(geo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), count);
  const base = new THREE.Color(baseColor(d));
  const q = new THREE.Quaternion(), e = new THREE.Euler(), v = new THREE.Vector3(), s = new THREE.Vector3();
  for (let i = 0; i < count; i++) {
    const side = Math.floor(r() * 4);
    const u = r() - 0.5;
    const y = (r() - 0.5) * P.T;
    if (side === 0) v.set(u * a, y, b / 2); else if (side === 1) v.set(u * a, y, -b / 2);
    else if (side === 2) v.set(a / 2, y, u * b); else v.set(-a / 2, y, u * b);
    const out = side === 0 ? [Math.PI / 2, 0] : side === 1 ? [-Math.PI / 2, 0] : side === 2 ? [0, -Math.PI / 2] : [0, Math.PI / 2];
    e.set(out[0] + (r() - 0.5) * 1.6, 0, out[1] + (r() - 0.5) * 1.6);
    if (side >= 2) e.set((r() - 0.5) * 1.6, 0, out[1] + (r() - 0.5) * 1.6);
    q.setFromEuler(e);
    s.set(1, 0.004 + r() * 0.014, 1);
    m.setMatrixAt(i, new THREE.Matrix4().compose(v, q, s));
    m.setColorAt(i, base.clone().offsetHSL(0, -0.05, 0.08 + r() * 0.15));
  }
  return m;
}

// Sujets en largeur (panneau, rangée d'échantillons) : on recule davantage sur écran étroit
function wideDist(api, base) {
  const stage = api.root.querySelector('.r3d-stage');
  const a = stage.clientWidth / Math.max(1, stage.clientHeight);
  return base * Math.sqrt(Math.max(1, 1.6 / a));
}

function dimLine(len, axis) {
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const sz = { x: [len, 0.004, 0.004], y: [0.004, len, 0.004], z: [0.004, 0.004, len] }[axis];
  g.add(new THREE.Mesh(new THREE.BoxGeometry(...sz), m));
  [-len / 2, len / 2].forEach((p) => {
    const tsz = { x: [0.004, 0.04, 0.004], y: [0.04, 0.004, 0.004], z: [0.004, 0.04, 0.004] }[axis];
    const tick = new THREE.Mesh(new THREE.BoxGeometry(...tsz), m);
    tick.position[axis] = p;
    g.add(tick);
  });
  return g;
}

/* ─────────── Vue 1 : le panneau */
function buildPanneau(api, st) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  const holder = new THREE.Group();
  group.add(holder);
  const panel = panelMesh(st.dens, P.L, P.W, 3);
  holder.add(panel);
  let hair = fuzz(st.dens, P.L, P.W, 900, 5);
  holder.add(hair);
  holder.position.y = 0.32;

  // deux cales de bois sous le panneau
  [-0.4, 0.4].forEach((x) => {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.06, 0.5), mat.woodLight());
    c.position.set(x, 0.03, 0); c.castShadow = true; c.receiveShadow = true;
    group.add(c);
  });
  holder.position.y = 0.06 + P.T / 2;

  const dL = dimLine(P.L, 'x'); dL.position.set(0, 0, P.W / 2 + 0.09); holder.add(dL);
  const dW = dimLine(P.W, 'z'); dW.position.set(P.L / 2 + 0.09, 0, 0); holder.add(dW);
  const dT = dimLine(P.T, 'y'); dT.position.set(-P.L / 2 - 0.05, 0, P.W / 2 + 0.05); holder.add(dT);
  addLabel('1 200 mm', holder, new THREE.Vector3(0, 0, P.W / 2 + 0.09), { cls: 'r3d-label-accent' });
  addLabel('600 mm', holder, new THREE.Vector3(P.L / 2 + 0.09, 0, 0), { cls: 'r3d-label-accent' });
  addLabel('50 mm', holder, new THREE.Vector3(-P.L / 2 - 0.12, 0, P.W / 2 + 0.05));
  addLabel('Tranche : fibres en couches', holder, new THREE.Vector3(P.L / 2 + 0.005, 0, -0.12));
  const lDens = addLabel('', holder, new THREE.Vector3(-0.2, P.T / 2 + 0.01, -0.05));

  world.add(group);
  frame(group, new THREE.Vector3(0, 0.1, 0), wideDist(api, 2.05), 1.0, 0.5);

  function apply() {
    const k = DENS[st.dens];
    lDens.el.textContent = `${st.dens} kg/m³ · ${k.nom}`;
    caption.textContent = `Panneau 1 200 × 600 × 50 mm, densité ${st.dens} kg/m³ (${k.nom.toLowerCase()}) : ≈ ${k.kg.toLocaleString('fr-FR')} kg, 0,72 m², 0,036 m³. Usage courant : ${k.usage}.`;
  }
  apply();

  const state = { t: REDUCED ? 1 : 0 };
  return {
    group,
    setDens(d) {
      setPanelDens(panel, d);
      holder.remove(hair); hair.geometry.dispose(); hair.material.dispose(); hair.dispose();
      hair = fuzz(d, P.L, P.W, 900, 5); holder.add(hair);
      apply();
    },
    update(dt) {
      if (state.t >= 1) return false;
      state.t = Math.min(1, state.t + dt / 1.1);
      const e = easeOut(state.t);
      holder.position.y = 0.06 + P.T / 2 + (1 - e) * 0.5;
      holder.rotation.set((1 - e) * 0.5, (1 - e) * -0.8, (1 - e) * 0.15);
      return true;
    }
  };
}

/* ─────────── Vue 2 : les 5 densités sous la même charge */
function buildDensites(api, st) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  const S = 0.3, gap = 0.42;
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa3ab, roughness: 0.45, metalness: 0.35 });
  const ghostMat = new THREE.LineBasicMaterial({ color: 0xea5b1f, transparent: true, opacity: 0.9 });
  const ghostGeo = new THREE.EdgesGeometry(new THREE.BoxGeometry(S + 0.004, P.T, S + 0.004));
  const items = LISTE.map((d, i) => {
    const x = (i - 2) * gap;
    const sample = panelMesh(d, S, S, 10 + i);
    sample.position.set(x, P.T / 2, 0);
    group.add(sample);
    const weight = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.05, 0.16), steel);
    weight.castShadow = true; weight.receiveShadow = true;
    group.add(weight);
    const ghost = new THREE.LineSegments(ghostGeo, ghostMat); // épaisseur d'origine
    ghost.position.set(x, P.T / 2, 0);
    group.add(ghost);
    const label = addLabel(`${d} kg/m³`, group, new THREE.Vector3(x, 0, S / 2 + 0.08));
    return { d, x, sample, weight, label };
  });
  world.add(group);
  frame(group, new THREE.Vector3(0, 0.03, 0), wideDist(api, 2.15), 1.28, 0.28);

  const state = { t: REDUCED ? 3 : 0 };
  function highlight() {
    items.forEach((it) => { it.label.el.className = 'r3d-label' + (it.d === st.dens ? ' r3d-label-accent' : ''); });
  }
  function apply() {
    // 0 → 0,6 s : les poids descendent ; 0,6 → 1,8 s : écrasement selon la densité
    const drop = easeInOut(clamp01(state.t / 0.6));
    const press = easeOut(clamp01((state.t - 0.6) / 1.2));
    items.forEach((it) => {
      const c = DENS[it.d].c * press;
      const h = P.T * (1 - c);
      it.sample.scale.set(1 + c * 0.06, 1 - c, 1 + c * 0.06);
      it.sample.position.y = h / 2;
      it.weight.position.set(it.x, h + 0.025 + (1 - drop) * 0.35, 0);
    });
  }
  highlight();
  apply();
  caption.textContent = 'Illustration qualitative : la même charge posée sur un échantillon de chaque densité, le trait orange marque l’épaisseur d’origine. Plus la laine est dense, moins elle s’écrase (écrasement exagéré pour la lecture).';
  return {
    group,
    setDens() { highlight(); },
    replay() { state.t = 0; },
    update(dt) {
      if (state.t >= 2) return false;
      state.t = Math.min(2, state.t + dt);
      apply();
      return true;
    }
  };
}

/* ─────────── Vue 3 : dans un mur sur ossature */
function buildMur(api, st) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  const H = 2.5, E = 0.6, NB = 3, Wm = E * NB; // 3 travées de 60 cm
  const zinc = mat.zinc();
  const items = []; // { obj, from: Vector3, to: Vector3, t0, dur }
  let t = 0.2;
  const add = (obj, from, dt, dur = 0.45) => {
    obj.castShadow = true; obj.receiveShadow = true;
    items.push({ obj, from, to: obj.position.clone(), t0: t, dur });
    group.add(obj);
    t += dt;
  };
  const x0 = -Wm / 2;
  // rails haut et bas
  [0.015, H - 0.015].forEach((y) => {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(Wm + 0.04, 0.03, P.T + 0.004), zinc);
    rail.position.set(0, y, 0);
    add(rail, new THREE.Vector3(0, y + 0.4, 0), 0.15);
  });
  // montants tous les 60 cm
  const studXs = [];
  for (let i = 0; i <= NB; i++) {
    const x = x0 + i * E;
    studXs.push(x);
    const stud = new THREE.Mesh(new THREE.BoxGeometry(0.035, H - 0.06, P.T), zinc);
    stud.position.set(x, H / 2, 0);
    add(stud, new THREE.Vector3(x, H / 2 + 0.5, 0), 0.12);
  }
  t += 0.2;
  const tPanels = t;
  // panneaux : 2 entiers + 1 recoupe par travée, de bas en haut
  const inner = E - 0.035;
  const rows = [[0.03, 1.2], [1.23, 1.2], [2.43, H - 0.03 - 2.43]];
  let cutPanel = null;
  for (let b = 0; b < NB; b++) {
    const cx = x0 + b * E + E / 2;
    rows.forEach(([y0, h], ri) => {
      const p = panelMesh(st.dens, inner, h, 20 + b * 3 + ri);
      p.rotation.x = Math.PI / 2; // debout : la face regarde +z
      p.position.set(cx, y0 + h / 2, 0);
      add(p, new THREE.Vector3(cx, y0 + h / 2, 0.9), 0.16, 0.5);
      if (b === 1 && ri === 2) cutPanel = p;
    });
  }
  const tBoards = t + 0.3;
  t = tBoards;
  // plaques BA13 : à l'arrière sur toute la largeur, à l'avant sur deux travées (la troisième reste ouverte)
  const paper = new THREE.MeshStandardMaterial({ color: 0xefe8d8, roughness: 0.9 });
  const board = (w, x, z, from) => {
    const m = new THREE.Mesh(new THREE.BoxGeometry(w - 0.004, H, 0.0125), paper);
    m.position.set(x, H / 2, z);
    add(m, from, 0.25, 0.6);
    return m;
  };
  const zb = P.T / 2 + 0.0075;
  board(1.2, x0 + 0.6, -zb, new THREE.Vector3(x0 + 0.6, H / 2, -0.8));
  board(0.6, x0 + 1.5, -zb, new THREE.Vector3(x0 + 1.5, H / 2, -0.8));
  board(0.6, x0 + 0.3, zb, new THREE.Vector3(x0 + 0.3, H / 2, 1.0));
  const total = t + 0.6;

  // sol
  const floor = new THREE.Mesh(new THREE.BoxGeometry(Wm + 1.2, 0.02, 1.4), new THREE.MeshStandardMaterial({ color: 0xd9d3c8, roughness: 0.95 }));
  floor.position.y = -0.01; floor.receiveShadow = true;
  group.add(floor);

  const dE = dimLine(E, 'x'); dE.position.set(studXs[2] + E / 2, H + 0.22, 0); group.add(dE);
  world.add(group);
  frame(group, new THREE.Vector3(0, 1.3, 0), 6.3, 1.34, 0.38);

  const state = { t: REDUCED ? total : 0 };
  addLabel('Rail', group, new THREE.Vector3(x0 + 1.5, 0.02, P.T / 2), { show: () => state.t > 0.4 });
  addLabel('Montant', group, new THREE.Vector3(studXs[NB], 1.75, P.T / 2), { show: () => state.t > 0.9 });
  addLabel('Entraxe 600 mm', group, new THREE.Vector3(studXs[2] + E / 2, H + 0.22, 0), { show: () => state.t > 0.9 });
  addLabel('Laine de roche 50 mm', group, new THREE.Vector3(x0 + 2.5 * E, 0.75, P.T / 2), { show: () => state.t > tPanels + 0.5, cls: 'r3d-label-accent' });
  addLabel('Recoupe à la hauteur', group, new THREE.Vector3(cutPanel.position.x, cutPanel.position.y, P.T / 2), { show: () => state.t > tBoards - 0.2 });
  addLabel('Plaque BA13', group, new THREE.Vector3(x0 + 0.3, 1.3, zb + 0.01), { show: () => state.t > tBoards + 0.8 });

  let lastShown = -1, done = false;
  function apply() {
    let placed = 0;
    items.forEach((it) => {
      const p = clamp01((state.t - it.t0) / it.dur);
      it.obj.visible = p > 0;
      if (p <= 0) return;
      placed++;
      it.obj.position.lerpVectors(it.from, it.to, easeOut(p));
    });
    if (placed !== lastShown) {
      lastShown = placed;
      const k = DENS[st.dens];
      caption.textContent = placed === items.length
        ? `Mur sur ossature métallique, montants tous les 60 cm : panneaux de laine de roche ${st.dens} kg/m³ (${k.nom.toLowerCase()}) glissés entre les montants, puis plaques BA13. Deux travées laissées ouvertes pour voir l’isolant.`
        : `Pose en cours : ${fmt(placed)} élément${placed > 1 ? 's' : ''} sur ${fmt(items.length)}…`;
    }
  }
  apply();
  return {
    group,
    setDens(d) {
      group.children.forEach((o) => { if (o.isMesh && o.material.length === 6) setPanelDens(o, d); });
      lastShown = -1; apply();
    },
    replay() { state.t = 0; done = false; apply(); },
    update(dt) {
      if (done) return false;
      state.t += dt;
      apply();
      if (state.t > total) done = true;
      return true;
    }
  };
}

/* ─────────── Vue 4 : votre commande en paquets */
function buildCommande(api, st) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  world.add(group);
  let pallets = new THREE.Group();
  group.add(pallets);
  const wood = new THREE.MeshStandardMaterial({ color: 0xc69a63, roughness: 0.9 });
  const film = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 0.1, transparent: true, opacity: 0.1, depthWrite: false });
  const label = addLabel('', group, new THREE.Vector3(), { cls: 'r3d-label-accent' });
  const state = { anim: 0, layout: [] };
  const PH = PAQUET * P.T; // hauteur d'un paquet

  function disposePallets() {
    group.remove(pallets);
    pallets.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material && o.material.length === 6) o.material.dispose();
    });
    pallets = new THREE.Group();
    group.add(pallets);
  }

  function set() {
    const n = Math.max(1, Math.floor(st.n) || 1);
    const d = st.dens;
    disposePallets();
    const nbPaquets = Math.ceil(n / PAQUET);
    const nbPal = Math.ceil(nbPaquets / PAQUETS_PALETTE);
    const shown = Math.min(nbPal, MAX_PALETTES);
    const cols = Math.min(4, shown), rowsN = Math.ceil(shown / cols);
    const gx = 1.7, gz = 1.75;
    state.layout = [];
    const packGeo = irregularBox(P.L, PH, P.W, 7, PAQUET);
    const filmGeo = new THREE.BoxGeometry(P.L + 0.012, PH + 0.012, P.W + 0.012);
    const packMats = woolMaterials(d);
    let left = nbPaquets;
    for (let i = 0; i < shown; i++) {
      const c = i % cols, rr = Math.floor(i / cols);
      const x = (c - (cols - 1) / 2) * gx, z = (rr - (rowsN - 1) / 2) * gz;
      const pal = new THREE.Group();
      [-0.5, 0, 0.5].forEach((dx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 1.2), wood); b.position.set(dx, 0.05, 0); b.castShadow = true; pal.add(b); });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.025, 1.24), wood); deck.position.y = 0.112; deck.castShadow = true; deck.receiveShadow = true; pal.add(deck);
      const here = Math.min(PAQUETS_PALETTE, left);
      left -= here;
      for (let k = 0; k < here; k++) {
        const layer = Math.floor(k / 2), side = k % 2 ? 1 : -1;
        const pack = new THREE.Mesh(packGeo, packMats);
        pack.position.set(0, 0.125 + PH / 2 + layer * (PH + 0.004), side * (P.W / 2 + 0.002));
        pack.castShadow = true; pack.receiveShadow = true;
        pal.add(pack);
        const wrap = new THREE.Mesh(filmGeo, film);
        wrap.position.copy(pack.position);
        pal.add(wrap);
      }
      pal.position.set(x, 0, z);
      pal.userData = { delay: i * 0.08, x, z, h: 0.125 + Math.ceil(here / 2) * (PH + 0.004) };
      pallets.add(pal);
      state.layout.push(pal);
    }
    const kg = n * 0.036 * d;
    label.el.textContent = `${fmt(n)} panneau${n > 1 ? 'x' : ''} · ${(n * 0.72).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} m² · ${kgTxt(kg)}`;
    const first = state.layout[0];
    label.local.set(first.userData.x, first.userData.h + 0.25, first.userData.z);
    const extra = nbPal - shown;
    caption.textContent = `${fmt(n)} panneaux ${d} kg/m³ : ${fmt(nbPaquets)} paquet${nbPaquets > 1 ? 's' : ''} de ${PAQUET}, ${fmt(nbPal)} palette${nbPal > 1 ? 's' : ''} (conditionnement représenté à titre d’illustration)` +
      (extra > 0 ? ` : ${fmt(shown)} palettes affichées, ${fmt(extra)} de plus non représentées.` : '.');
    const span = Math.max(cols * gx, rowsN * gz, 2.4);
    frame(group, new THREE.Vector3(0, 0.6, 0), 3.4 + span * 1.3, 1.02, 0.7);
    state.anim = REDUCED ? 2 : 0;
    api.wake();
  }
  set();

  return {
    group,
    setCount: set,
    setDens: set,
    update(dt) {
      if (state.anim > 2) return false;
      state.anim += dt;
      state.layout.forEach((p) => {
        const e = easeOut(clamp01((state.anim - p.userData.delay) / 0.45));
        p.position.y = (1 - e) * 1.2;
        p.visible = e > 0;
      });
      return true;
    }
  };
}

export function init(root) {
  const st = { dens: Number(root.dataset.dens) || 80, n: Number(root.dataset.count) || 44 };
  let scene = null;
  const syncChips = () => root.querySelectorAll('[data-r3d-dens]').forEach((b) => b.setAttribute('aria-pressed', String(Number(b.dataset.r3dDens) === st.dens)));
  const viewer = createViewer(root, {
    initial: 'panneau',
    builders: {
      panneau: (api) => (scene = buildPanneau(api, st)),
      densites: (api) => (scene = buildDensites(api, st)),
      mur: (api) => (scene = buildMur(api, st)),
      commande: (api) => (scene = buildCommande(api, st))
    },
    info: (m) => INFOS[m],
    onShow: syncChips,
    onButton(b) {
      if (!b.dataset.r3dDens) return false;
      const d = Number(b.dataset.r3dDens);
      window.dispatchEvent(new CustomEvent('laine:pick', { detail: d })); // le calculateur suit…
      setDens(d); // …et la 3D aussi, même sans calculateur
      return true;
    }
  });
  function setDens(d) {
    if (!DENS[d] || d === st.dens) return;
    st.dens = d;
    syncChips();
    if (scene && scene.setDens) scene.setDens(d);
    if (viewer) viewer.wake();
  }
  window.addEventListener('laine:calc', (e) => {
    const { n, dens } = e.detail || {};
    const countChanged = n && n !== st.n;
    if (n) st.n = n;
    if (dens && dens !== st.dens) setDens(dens);
    else if (countChanged && viewer && viewer.mode === 'commande' && scene) { scene.setCount(); viewer.wake(); }
  });
}
