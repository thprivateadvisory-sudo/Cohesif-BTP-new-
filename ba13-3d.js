// Cohesif BTP — plaque de plâtre BA13 en 3D (plaque, bord aminci en coupe, votre commande)
// Chargé à la demande par boutique-plaque-platre-ba13.html. La vue « Votre commande » suit le calculateur
// via l'évènement window « ba13:count » (detail = nombre de plaques).
import { THREE, REDUCED, easeOut, clamp01, fmt, rng, createViewer } from './r3d-core.js?v=20261003';

const PL = { w: 1.2, h: 2.5, t: 0.0125, kg: 23.8 }; // 1200 × 2500 × 12,5 mm
const PAR_PILE = 50;
const MAX_PILES = 16;

const INFOS = {
  plaque: {
    titre: 'Plaque de plâtre BA13 standard',
    texte: "La plaque la plus utilisée pour les cloisons, les doublages et les plafonds en pièces sèches. Ses bords amincis permettent des joints invisibles avec bande et enduit.",
    specs: [['Dimensions', '1 200 × 2 500 mm'], ['Épaisseur', '12,5 mm'], ['Surface', '3 m² par plaque'], ['Poids', '≈ 23,8 kg / plaque']],
    points: [
      'Plaque standard, pour les pièces sèches de l’habitat et du tertiaire.',
      'Bords amincis (BA) sur les deux grands côtés, pour des joints plats et invisibles.',
      'Pose sur ossature métallique (rails et montants) ou collée sur le mur selon le support.',
      'Pour les pièces humides ou les exigences feu : plaques hydro ou feu sur demande.'
    ]
  },
  bords: {
    titre: 'Pourquoi « BA » : le bord aminci',
    texte: "Sur les deux grands côtés, la face de la plaque s'amincit légèrement. Deux plaques côte à côte forment un creux qui reçoit la bande et l'enduit : le joint reste à fleur et ne se voit plus après peinture.",
    specs: [['Parement', 'Carton, face visible'], ['Cœur', 'Plâtre'], ['Dos', 'Carton, face côté ossature'], ['Bords', 'Amincis sur la longueur']],
    points: [
      'Le carton de parement est prêt à peindre après traitement des joints.',
      'Le creux du bord aminci accueille bande et enduit sans surépaisseur.',
      'Les bords coupés sur chantier (petits côtés) se traitent avec un léger chanfrein.',
      'Épaisseur volontairement agrandie dans la maquette pour la lecture.'
    ]
  },
  commande: {
    titre: 'Votre commande en volume',
    texte: "La quantité calculée plus bas s'affiche ici en piles de plaques. Du chantier de rénovation au lot professionnel de plusieurs milliers de plaques, nous préparons un devis adapté au volume et au lieu de livraison.",
    specs: [['Une plaque', '3 m² · ≈ 23,8 kg'], ['Pile de 50', '≈ 62 cm · ≈ 1,2 t'], ['Volumes', 'Du lot chantier au conteneur'], ['Livraison', 'Partout en France, sur devis']],
    points: [
      'Tarif dégressif selon la quantité commandée.',
      'Livraison sur chantier ou dépôt, ou enlèvement : à préciser dans la demande.',
      'Accessoires possibles : rails, montants, vis, bandes et enduits.',
      'Piles de 50 plaques représentées à titre d’illustration.'
    ]
  }
};

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function paperTexture(base, speck, seed) {
  return canvasTexture(512, 1024, (g, w, h) => {
    g.fillStyle = base; g.fillRect(0, 0, w, h);
    const r = rng(seed);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${speck},${r() * 0.05})`; g.fillRect(r() * w, r() * h, 1 + r() * 2, 1 + r() * 2); }
  });
}

// Dos de plaque : marquage imprimé, comme sur les plaques du commerce
function backTexture() {
  return canvasTexture(512, 1024, (g, w, h) => {
    g.fillStyle = '#cfcbc2'; g.fillRect(0, 0, w, h);
    const r = rng(4);
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(60,55,50,${r() * 0.05})`; g.fillRect(r() * w, r() * h, 2, 2); }
    g.fillStyle = 'rgba(40,60,120,0.75)';
    g.font = 'bold 22px Inter, Arial, sans-serif';
    g.textAlign = 'center';
    for (let y = 140; y < h; y += 260) {
      g.save(); g.translate(w / 2, y);
      g.fillText('BA13 · 1200 × 2500 × 12,5 mm', 0, 0);
      g.font = '16px Inter, Arial, sans-serif';
      g.fillText('PLAQUE DE PLÂTRE · BORDS AMINCIS', 0, 26);
      g.restore();
      g.font = 'bold 22px Inter, Arial, sans-serif';
    }
  });
}

function edgeTexture(n) {
  const t = canvasTexture(64, 512, (g, w, h) => {
    g.fillStyle = '#efede7'; g.fillRect(0, 0, w, h);
    g.fillStyle = '#c9c5bb';
    for (let i = 0; i < 64; i++) g.fillRect(0, i * 8, w, 1);
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(1, n / 64);
  return t;
}

function plateMaterials() {
  const edge = new THREE.MeshStandardMaterial({ color: 0xeeece6, roughness: 0.95 });
  const front = new THREE.MeshStandardMaterial({ map: paperTexture('#efe8d8', '90,80,60', 1), roughness: 0.9 });
  const back = new THREE.MeshStandardMaterial({ map: backTexture(), roughness: 0.95 });
  return [edge, edge, edge, edge, front, back]; // +x −x +y −y +z (face) −z (dos)
}

function dimLine(len, axis) {
  // trait de cote avec deux extrémités
  const g = new THREE.Group();
  const m = new THREE.MeshBasicMaterial({ color: 0x0a0a0a });
  const along = axis === 'x' ? [len, 0.008, 0.008] : [0.008, len, 0.008];
  g.add(new THREE.Mesh(new THREE.BoxGeometry(...along), m));
  [-len / 2, len / 2].forEach((p) => {
    const tick = new THREE.Mesh(new THREE.BoxGeometry(axis === 'x' ? 0.008 : 0.08, axis === 'x' ? 0.08 : 0.008, 0.008), m);
    tick.position[axis] = p;
    g.add(tick);
  });
  return g;
}

/* ─────────── Vue 1 : la plaque */
function buildPlaque(api) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  const plate = new THREE.Mesh(new THREE.BoxGeometry(PL.w, PL.h, PL.t), plateMaterials());
  plate.castShadow = true; plate.receiveShadow = true;
  const holder = new THREE.Group();
  holder.add(plate);
  plate.position.y = PL.h / 2;
  holder.rotation.x = -0.1; // posée contre un mur, légèrement inclinée
  holder.position.z = 0.15;
  group.add(holder);

  const dW = dimLine(PL.w, 'x'); dW.position.set(0, -0.12, 0.05); holder.add(dW);
  const dH = dimLine(PL.h, 'y'); dH.position.set(PL.w / 2 + 0.14, PL.h / 2, 0.05); holder.add(dH);
  addLabel('1 200 mm', holder, new THREE.Vector3(0, -0.12, 0.06), { cls: 'r3d-label-accent' });
  addLabel('2 500 mm', holder, new THREE.Vector3(PL.w / 2 + 0.14, PL.h / 2, 0.06), { cls: 'r3d-label-accent' });
  addLabel('12,5 mm', holder, new THREE.Vector3(PL.w / 2, PL.h + 0.08, 0));
  addLabel('Face (parement)', holder, new THREE.Vector3(-0.15, PL.h * 0.62, PL.t));

  world.add(group);
  frame(group, new THREE.Vector3(0.15, 1.25, 0), 6.6, 1.36, 0.32);
  caption.textContent = 'Plaque de plâtre BA13 standard : 1 200 × 2 500 × 12,5 mm, soit 3 m² par plaque. Faites-la pivoter pour voir le dos imprimé.';

  const state = { t: REDUCED ? 1 : 0 };
  return {
    group,
    update(dt) {
      if (state.t >= 1) return false;
      state.t = Math.min(1, state.t + dt / 0.9);
      const e = easeOut(state.t);
      holder.position.y = (1 - e) * 0.8;
      holder.rotation.y = (1 - e) * -0.6;
      return true;
    }
  };
}

/* ─────────── Vue 2 : bord aminci en coupe (épaisseur agrandie) */
function buildBords(api) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  const W = 1.0, T = 0.11, P = 0.012, D = 0.7; // largeur montrée, épaisseur ×9, papier, profondeur
  const taperW = 0.32, taperD = 0.028;
  const top = (x) => { // surface de la face, amincie vers le bord droit
    const u = clamp01((x - (W / 2 - taperW)) / taperW);
    return T - taperD * (u * u * (3 - 2 * u));
  };
  const N = 40;
  const xs = Array.from({ length: N + 1 }, (_, i) => -W / 2 + (i / N) * W);

  // cœur en plâtre
  const core = new THREE.Shape();
  core.moveTo(-W / 2, P);
  xs.forEach((x) => core.lineTo(x, top(x) - P));
  core.lineTo(W / 2, P);
  core.closePath();
  // carton de parement (suit la face et enveloppe le bord)
  const face = new THREE.Shape();
  face.moveTo(-W / 2, top(-W / 2) - P);
  xs.forEach((x) => face.lineTo(x, top(x)));
  face.lineTo(W / 2 + P, top(W / 2));
  face.lineTo(W / 2 + P, P * 0.5);
  face.lineTo(W / 2, P * 0.5);
  face.lineTo(W / 2, top(W / 2) - P);
  xs.slice().reverse().forEach((x) => face.lineTo(Math.min(x, W / 2), top(x) - P));
  face.closePath();
  // carton de dos
  const back = new THREE.Shape();
  back.moveTo(-W / 2, 0); back.lineTo(W / 2 + P, 0); back.lineTo(W / 2 + P, P); back.lineTo(-W / 2, P); back.closePath();

  const ext = (shape, color, rough) => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: false });
    g.translate(0, 0, -D / 2);
    const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color, roughness: rough }));
    m.castShadow = true; m.receiveShadow = true;
    group.add(m);
    return m;
  };
  ext(core, 0xf5f4ef, 1);
  ext(face, 0xe9dfc8, 0.85);
  ext(back, 0xc9c4b9, 0.9);
  // grains du plâtre sur la tranche
  const r = rng(8);
  const dots = new THREE.InstancedMesh(new THREE.SphereGeometry(0.004, 6, 4), new THREE.MeshStandardMaterial({ color: 0xd7d4cc }), 180);
  for (let i = 0; i < 180; i++) {
    const x = -W / 2 + 0.02 + r() * (W - 0.06);
    dots.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x, P + 0.006 + r() * (top(x) - 2 * P - 0.012), D / 2 + 0.001));
  }
  group.add(dots);
  group.position.y = 0.55;
  group.rotation.y = -0.25;

  const dT = dimLine(T, 'y'); dT.position.set(-W / 2 - 0.06, T / 2, D / 2); group.add(dT);
  addLabel('12,5 mm (agrandi)', group, new THREE.Vector3(-W / 2 - 0.06, T + 0.05, D / 2));
  addLabel('Parement carton', group, new THREE.Vector3(-0.15, T + 0.012, D / 2 - 0.1));
  addLabel('Cœur en plâtre', group, new THREE.Vector3(-0.2, T / 2, D / 2 + 0.01), { cls: 'r3d-label-accent' });
  addLabel('Carton de dos', group, new THREE.Vector3(0.05, 0.002, D / 2));
  addLabel('Bord aminci', group, new THREE.Vector3(W / 2 - 0.12, top(W / 2 - 0.12) + 0.03, 0), { cls: 'r3d-label-accent' });

  world.add(group);
  frame(group, new THREE.Vector3(0, 0.6, 0), 2.2, 1.18, 0.3);
  caption.textContent = "Coupe d'une plaque BA13 au bord aminci, épaisseur agrandie pour la lecture : carton de parement, cœur en plâtre, carton de dos.";
  return { group, update: () => false };
}

/* ─────────── Vue 3 : votre commande en piles */
function buildCommande(api, getCount) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  world.add(group);
  let piles = new THREE.Group();
  group.add(piles);
  const pallet = new THREE.MeshStandardMaterial({ color: 0xc69a63, roughness: 0.9 });
  const faceMats = plateMaterials();
  const label = addLabel('', group, new THREE.Vector3(), { cls: 'r3d-label-accent' });
  const state = { anim: 0, n: 0, layout: [] };

  function disposePiles() {
    group.remove(piles);
    piles.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.userData.side) { o.userData.side.map.dispose(); o.userData.side.dispose(); }
    });
    piles = new THREE.Group();
    group.add(piles);
  }

  function set(n) {
    n = Math.max(1, Math.floor(n) || 1);
    state.n = n;
    disposePiles();
    const nbPiles = Math.ceil(n / PAR_PILE);
    const shown = Math.min(nbPiles, MAX_PILES);
    const cols = Math.min(4, shown);
    const rows = Math.ceil(shown / cols);
    const gx = 1.6, gz = 2.95;
    state.layout = [];
    for (let i = 0; i < shown; i++) {
      const count = i === nbPiles - 1 ? n - (nbPiles - 1) * PAR_PILE : PAR_PILE;
      const c = i % cols, rr = Math.floor(i / cols);
      const x = (c - (cols - 1) / 2) * gx, z = (rr - (rows - 1) / 2) * gz;
      const p = new THREE.Group();
      // palette
      [-0.5, 0, 0.5].forEach((dx) => { const b = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, 2.5), pallet); b.position.set(dx, 0.05, 0); b.castShadow = true; p.add(b); });
      const deck = new THREE.Mesh(new THREE.BoxGeometry(1.24, 0.025, 2.54), pallet); deck.position.y = 0.112; deck.castShadow = true; deck.receiveShadow = true; p.add(deck);
      // pile de plaques
      const h = count * PL.t;
      const side = new THREE.MeshStandardMaterial({ map: edgeTexture(count), roughness: 0.95 });
      const mats = [side, side, faceMats[4], faceMats[5], side, side];
      const stack = new THREE.Mesh(new THREE.BoxGeometry(PL.w, h, PL.h), mats);
      stack.userData.side = side;
      stack.position.y = 0.125 + h / 2;
      stack.castShadow = true; stack.receiveShadow = true;
      p.add(stack);
      p.position.set(x, 0, z);
      p.userData = { delay: i * 0.08, x, z };
      piles.add(p);
      state.layout.push(p);
    }
    const extra = n - shown * PAR_PILE;
    const m2 = n * 3;
    const tonnes = (n * PL.kg) / 1000;
    label.el.textContent = `${fmt(n)} plaque${n > 1 ? 's' : ''} · ${fmt(m2)} m² · ≈ ${tonnes.toLocaleString('fr-FR', { maximumFractionDigits: 1 })} t`;
    const first = state.layout[0];
    label.local.set(first.userData.x, 0.125 + Math.min(n, PAR_PILE) * PL.t + 0.25, first.userData.z);
    caption.textContent = `${fmt(n)} plaques BA13 en ${fmt(nbPiles)} pile${nbPiles > 1 ? 's' : ''} de ${PAR_PILE} maximum (illustration)` +
      (extra > 0 ? ` : ${fmt(shown)} piles affichées, ${fmt(extra)} plaques de plus non représentées.` : '.');
    const span = Math.max(cols * gx, rows * gz * 0.8, 3);
    frame(group, new THREE.Vector3(0, 0.5, 0), 3.6 + span * 1.25, 1.0, 0.7);
    state.anim = REDUCED ? 2 : 0;
    api.wake();
  }
  set(getCount());

  return {
    group,
    setCount: set,
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
  let count = Number(root.dataset.count) || 100;
  let viewer = null;
  let current = null;
  viewer = createViewer(root, {
    initial: 'plaque',
    builders: {
      plaque: buildPlaque,
      bords: buildBords,
      commande: (api) => (current = buildCommande(api, () => count))
    },
    info: (m) => INFOS[m],
    onShow: (m) => { if (m !== 'commande') current = null; }
  });
  window.addEventListener('ba13:count', (e) => {
    count = e.detail;
    if (current && viewer.mode === 'commande') current.setCount(count);
  });
}
