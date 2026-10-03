// Cohesif BTP — simulateur 3D de toiture (maison entière, pose, démoussage, fenêtre de toit, isolation)
// Chargé à la demande par toiture-couverture.html quand le bloc #r3d approche de l'écran.
import { THREE, REDUCED, easeOut, easeInOut, clamp01, fmt, rng, ringGeometry, mat, createViewer } from './r3d-core.js';

/* ────────────────────────────────────────── Données affichées */

const MATERIAUX = {
  ardoise: {
    nom: 'Ardoise naturelle', teinte: 'Gris bleuté',
    titre: "L'ardoise naturelle",
    texte: "Pierre naturelle fendue en fines plaques, l'ardoise habille les toits des bâtiments anciens et des maisons de caractère. Légère, quasi imperméable et très durable, elle se pose au crochet ou au clou.",
    specs: [['Format courant', '32 × 22 cm'], ['Quantité', 'Environ 30 à 40 ardoises/m² selon format'], ['Pente', 'Moyenne à forte, selon la zone'], ['Norme', 'DTU 40.11']],
    points: [
      'Chaque ardoise recouvre les deux rangs inférieurs : triple épaisseur au droit des joints.',
      'Fixation au crochet inox ou au clou cuivre, sur liteaux ou voliges.',
      'Faîtage en zinc ou en lignolet, noues et rives traitées en zinc.',
      'Toiture légère (environ 25 à 30 kg/m²) et durée de vie de 70 ans et plus.'
    ]
  },
  plate: {
    nom: 'Tuile plate', teinte: 'Rouge flammé',
    titre: 'La tuile plate',
    texte: "Petite tuile de terre cuite posée à joints croisés, elle donne l'aspect traditionnel des toitures d'Île-de-France, de Normandie et de Bourgogne. Elle se pose sur des pentes fortes et se marie aux faîtages scellés au mortier.",
    specs: [['Format courant', '17 × 27 cm'], ['Quantité', 'Environ 60 à 70 tuiles/m²'], ['Pente', 'Forte, souvent 40° et plus'], ['Norme', 'DTU 40.23']],
    points: [
      'Chaque tuile ne recouvre qu’un tiers environ de la précédente : trois épaisseurs font l’étanchéité.',
      'Pose à joints croisés, avec tuiles et demie en rive pour garder le décalage.',
      'Faîtage traditionnel : faîtières demi-rondes scellées au mortier de chaux.',
      'Toiture lourde (60 à 70 kg/m²) mais d’une grande longévité, souvent exigée en secteur protégé.'
    ]
  },
  mecanique: {
    nom: 'Tuile mécanique', teinte: 'Rouge',
    titre: 'La tuile mécanique',
    texte: "Tuile de terre cuite à emboîtement, c'est la plus répandue en France. Ses nervures se verrouillent entre elles, ce qui permet une pose rapide, moins de tuiles au m² et des pentes plus faibles qu'avec la tuile plate.",
    specs: [['Format courant', 'Grand ou petit moule'], ['Quantité', '10 à 15 tuiles/m² (grand moule)'], ['Pente', 'Dès 20 à 25° selon modèle'], ['Norme', 'DTU 40.21']],
    points: [
      'Pose à joints droits ou croisés selon le modèle, sur liteaux au pureau indiqué par le fabricant.',
      'Faîtage à sec (closoir ventilé) ou scellé : plus durable qu’un scellement au mortier.',
      'Rives traitées avec des tuiles à rabat gauche et droite, fixées mécaniquement.',
      'Bon compromis : environ 40 à 50 kg/m², pose rapide et coût maîtrisé.'
    ]
  }
};

const MODES = {
  demoussage: {
    titre: 'Démoussage, traitement et peinture',
    texte: "À gauche, des tuiles décolorées, poreuses et couvertes de mousses et de lichens. À droite, la même toiture nettoyée, traitée puis protégée : teinte uniforme et surface qui fait perler l'eau.",
    specs: [['Nettoyage', 'Brossage + rinçage basse pression'], ['Traitement', 'Anti-mousse curatif'], ['Protection', 'Hydrofuge ou peinture de toiture'], ['Fréquence', 'Tous les 5 à 10 ans en moyenne']],
    points: [
      'La mousse retient l’eau : au gel, elle fait éclater les tuiles et soulève les rangs.',
      'Nettoyage à basse pression pour ne pas abîmer l’émail ni décaler les tuiles.',
      'Remplacement des tuiles cassées avant traitement : on ne protège que du sain.',
      'Peinture de toiture : choix de la teinte, tuiles uniformes et protégées durablement.'
    ]
  },
  fenetre: {
    titre: 'Pose de fenêtre de toit',
    texte: "Ouverture dans la charpente, chevêtre, cadre dormant, raccord d'étanchéité adapté à la couverture, puis ouvrant vitré et habillage intérieur. Cliquez sur « Assembler » pour remettre chaque élément en place.",
    specs: [['Tailles courantes', '78 × 98, 78 × 118, 114 × 118 cm'], ['Ouverture', 'Rotation, projection ou motorisée'], ['Durée', 'En général une journée'], ['Étanchéité', 'Raccord adapté tuile ou ardoise']],
    points: [
      'Le chevêtre reprend les chevrons coupés : la charpente reste aussi solide qu’avant.',
      'Le raccord d’étanchéité se glisse sous les tuiles du haut et recouvre celles du bas.',
      'Habillage intérieur et isolation périphérique pour éviter ponts thermiques et condensation.',
      'Remplacement d’une ancienne fenêtre de toit possible sans toucher à l’intérieur.'
    ]
  },
  coupe: {
    titre: 'Isolation de toiture, couche par couche',
    texte: "Une toiture performante, c'est un empilement précis : chaque couche a un rôle. Une partie importante de la chaleur d'une maison mal isolée s'échappe par le toit.",
    specs: [['Pertes par le toit', '25 à 30 % sur une maison non isolée'], ['Isolant', 'Laine minérale, fibre de bois…'], ['Ventilation', 'Lame d’air sous les tuiles'], ['Aides', 'Possibles avec une entreprise RGE']],
    points: [
      'Pare-vapeur côté chaud : il empêche l’humidité intérieure de mouiller l’isolant.',
      'Écran sous-toiture HPV : il arrête l’eau qui passerait sous les tuiles et laisse respirer.',
      'Contre-liteaux : ils créent la lame d’air qui ventile la couverture.',
      'Isolation par l’extérieur (sarking) possible lors d’une réfection complète.'
    ]
  }
};

// Teintes proposées dans la vue « Toute la maison », par matériau (la première est celle par défaut)
const COULEURS = {
  ardoise: [
    { nom: 'Gris bleuté', hex: '#3e4752' },
    { nom: 'Bleu-noir', hex: '#2c323b' },
    { nom: 'Anthracite', hex: '#3a3c40' },
    { nom: 'Gris clair', hex: '#6a737e' },
    { nom: 'Vert-gris', hex: '#4c5650' }
  ],
  plate: [
    { nom: 'Rouge flammé', hex: '#b4532f' },
    { nom: 'Terre cuite', hex: '#c7663b' },
    { nom: 'Vieilli', hex: '#8e5034' },
    { nom: 'Brun', hex: '#6e3d2b' },
    { nom: 'Sablé', hex: '#c38a57' },
    { nom: 'Anthracite', hex: '#3b3f45' }
  ],
  mecanique: [
    { nom: 'Rouge', hex: '#c05a31' },
    { nom: 'Rouge vieilli', hex: '#a2472b' },
    { nom: 'Brun', hex: '#6e3d2b' },
    { nom: 'Sablé', hex: '#c98b55' },
    { nom: 'Ardoisé', hex: '#56606b' },
    { nom: 'Anthracite', hex: '#3b3f45' }
  ]
};

const TEINTES = [
  { nom: 'Rouge tuile', hex: '#b5482a' },
  { nom: 'Terre cuite', hex: '#c7663b' },
  { nom: 'Brun', hex: '#6e3d2b' },
  { nom: 'Anthracite', hex: '#3b3f45' },
  { nom: 'Gris ardoise', hex: '#56606b' }
];

/* ────────────────────────────────────────── Géométries */

function mechanicalTileGeometry(w, len) {
  // Profil de tuile à emboîtement : un gros galbe + une petite nervure
  const pts = [];
  const N = 28;
  const top = (u) => {
    let z = 0.012;
    if (u > 0.12 && u < 0.62) z += 0.024 * Math.sin(Math.PI * (u - 0.12) / 0.5);
    if (u > 0.74 && u < 0.86) z += 0.007 * Math.sin(Math.PI * (u - 0.74) / 0.12);
    return z;
  };
  for (let i = 0; i <= N; i++) { const u = i / N; pts.push(new THREE.Vector2(-w / 2 + u * w, top(u))); }
  for (let i = N; i >= 0; i--) { const u = i / N; pts.push(new THREE.Vector2(-w / 2 + u * w, top(u) - 0.011)); }
  const geo = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: len, bevelEnabled: false });
  geo.rotateX(Math.PI / 2); // hauteur → z, extrusion → -y
  geo.translate(0, len / 2, 0); // centré sur y
  geo.computeVertexNormals();
  return geo;
}

function halfRidgeGeometry(r, len) {
  const g = new THREE.CylinderGeometry(r, r, len, 20, 1, true, -Math.PI / 2, Math.PI);
  g.rotateZ(Math.PI / 2); // axe le long de x, voûte vers +z
  return g;
}

/* ────────────────────────────────────────── Toiture (un pan) */

// Repère local du pan : x = largeur, y = montée le long de la pente, z = normale au toit.
const TILE = {
  mecanique: { w: 0.25, len: 0.42, g: 0.34, t: 0.011, base: '#c05a31', jit: 0.05, pitch: 30, stagger: false },
  plate: { w: 0.17, len: 0.27, g: 0.10, t: 0.012, base: '#b4532f', jit: 0.11, pitch: 45, stagger: true },
  ardoise: { w: 0.22, len: 0.32, g: 0.125, t: 0.006, base: '#3e4752', jit: 0.05, pitch: 40, stagger: true }
};
const BATTEN_TOP = 0.027;

function layoutTiles(kind, W, targetL, skip) {
  const T = TILE[kind];
  const rows = Math.round((targetL - T.len) / T.g) + 1;
  const alpha = Math.asin(Math.min(0.2, (T.t * 1.15) / T.g));
  const list = [];
  for (let r = 0; r < rows; r++) {
    const y0 = r * T.g;
    let x = -W / 2;
    let first = true;
    while (x < W / 2 - 0.01) {
      let width = T.w;
      if (first && T.stagger && r % 2 === 1) width = T.w / 2;
      width = Math.min(width, W / 2 - x);
      first = false;
      const cx = x + width / 2;
      const cy = y0 + T.len / 2;
      if (!skip || !skip(cx, cy, width, T.len)) list.push({ x: cx, y: cy, sx: width / T.w, row: r });
      x += width;
    }
  }
  const L = (rows - 1) * T.g + T.len;
  return { list, rows, L, alpha, T };
}

function tileMesh(kind, count) {
  const T = TILE[kind];
  const geo = kind === 'mecanique'
    ? mechanicalTileGeometry(T.w, T.len)
    : new THREE.BoxGeometry(T.w - (kind === 'plate' ? 0.006 : 0.004), T.len, T.t);
  const m = new THREE.InstancedMesh(geo, mat.tile(), count);
  m.castShadow = true; m.receiveShadow = true;
  m.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  return m;
}

function tileTransform(kind, item, alpha) {
  const T = TILE[kind];
  const zc = kind === 'mecanique'
    ? BATTEN_TOP + (T.len / 2) * Math.sin(alpha)
    : BATTEN_TOP + T.t / 2 + (T.len / 2) * Math.sin(alpha);
  return {
    p: new THREE.Vector3(item.x, item.y, zc),
    q: new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), -alpha),
    s: new THREE.Vector3(item.sx, 1, 1)
  };
}

function tileColor(kind, r) {
  const T = TILE[kind];
  const c = new THREE.Color(T.base);
  const hsl = {}; c.getHSL(hsl);
  let l = hsl.l + (r() - 0.5) * 2 * T.jit;
  if (kind === 'plate' && r() < 0.18) l -= 0.08; // flammé
  return new THREE.Color().setHSL(hsl.h + (r() - 0.5) * 0.02, hsl.s * (0.9 + r() * 0.15), clamp01(l));
}

function buildRafters(W, L, opts = {}) {
  const g = new THREE.Group();
  const spacing = opts.spacing || 0.6;
  const xs = opts.xs || (() => { const a = []; for (let x = -W / 2 + 0.12; x <= W / 2 - 0.1; x += spacing) a.push(x); return a; })();
  const geo = new THREE.BoxGeometry(0.075, L + 0.45, 0.16);
  const m = mat.wood();
  xs.forEach((x) => {
    const b = new THREE.Mesh(geo, m);
    b.position.set(x, (L + 0.45) / 2 - 0.35, -0.08);
    b.castShadow = true; b.receiveShadow = true;
    g.add(b);
  });
  g.userData.xs = xs;
  return g;
}

function battensFor(layout) {
  const ys = [];
  for (let r = 0; r < layout.rows; r++) ys.push(r * layout.T.g + layout.T.len - 0.04);
  ys.unshift(0.04);
  return ys;
}

/* ────────────────────────────────────────── Moteur commun */

/* ─────────── Mode 0 : toute la maison (murs, charpente, couverture au choix et sa teinte) */
const MAISON = { W: 6.2, D: 5.2, H: 2.7, ep: 0.22, ov: 0.4, rive: 0.22, raf: 0.16 };

let enduitTex = null; // texture partagée, créée une seule fois
function enduitTexture() {
  if (enduitTex) return enduitTex;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const img = g.createImageData(128, 128);
  const r = rng(5);
  for (let i = 0; i < img.data.length; i += 4) {
    const v = 226 + r() * 29;
    img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  enduitTex = new THREE.CanvasTexture(c);
  enduitTex.wrapS = enduitTex.wrapT = THREE.RepeatWrapping;
  enduitTex.repeat.set(3, 3);
  enduitTex.colorSpace = THREE.SRGBColorSpace;
  enduitTex.userData.keep = true; // partagée entre les vues : jamais libérée
  return enduitTex;
}

function buildMaison(api, kind, hex, onColor) {
  const { addLabel, frame, caption, world } = api;
  const { W, D, H, ep, ov, rive, raf } = MAISON;
  const T = TILE[kind];
  const p = THREE.MathUtils.degToRad(T.pitch);
  const Hr = H + (D / 2) * Math.tan(p); // faîte de la maçonnerie (pignons)
  const Wt = W + 2 * rive;
  const layout = layoutTiles(kind, Wt, (D / 2 + ov) / Math.cos(p));
  const { list, L, alpha } = layout;
  const group = new THREE.Group();
  const add = (mesh, parent = group) => { mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; };

  // Pelouse, soubassement, murs enduits, pignons, plancher des combles
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(8.5, 72), new THREE.MeshStandardMaterial({ color: 0x8cb866, roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = 0.003;
  lawn.receiveShadow = true;
  group.add(lawn);
  const enduit = new THREE.MeshStandardMaterial({ color: 0xeee2cd, roughness: 0.95, map: enduitTexture() });
  add(new THREE.Mesh(new THREE.BoxGeometry(W + 0.04, 0.32, D + 0.04), new THREE.MeshStandardMaterial({ color: 0xb8afa3, roughness: 0.95 }))).position.y = 0.16;
  [1, -1].forEach((s) => {
    add(new THREE.Mesh(new THREE.BoxGeometry(W - 2 * ep, H, ep), enduit)).position.set(0, H / 2, s * (D / 2 - ep / 2));
  });
  const gShape = new THREE.Shape();
  gShape.moveTo(-D / 2, 0); gShape.lineTo(D / 2, 0); gShape.lineTo(D / 2, H); gShape.lineTo(0, Hr); gShape.lineTo(-D / 2, H); gShape.closePath();
  const gGeo = new THREE.ExtrudeGeometry(gShape, { depth: ep, bevelEnabled: false });
  gGeo.rotateY(Math.PI / 2); // épaisseur le long de x
  [W / 2 - ep, -W / 2].forEach((x) => { add(new THREE.Mesh(gGeo, enduit)).position.x = x; });
  add(new THREE.Mesh(new THREE.BoxGeometry(W - 2 * ep, 0.04, D - 2 * ep), new THREE.MeshStandardMaterial({ color: 0xcfae7f, roughness: 0.9 }))).position.y = H - 0.02;

  // Fenêtres et porte
  const frameM = mat.white();
  const glassM = new THREE.MeshStandardMaterial({ color: 0x4d6577, roughness: 0.15, metalness: 0.3 });
  const doorM = new THREE.MeshStandardMaterial({ color: 0x6b4a35, roughness: 0.7 });
  const opening = (w, h, x, y, z, ry, door) => {
    const o = new THREE.Group();
    add(new THREE.Mesh(ringGeometry(w, h, 0.07, 0.08), frameM), o);
    o.add(new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, h - 0.1, 0.02), door ? doorM : glassM));
    if (!door) o.add(new THREE.Mesh(new THREE.BoxGeometry(0.05, h - 0.1, 0.05), frameM));
    o.position.set(x, y, z);
    o.rotation.y = ry;
    group.add(o);
  };
  opening(1.1, 1.25, -1.8, 1.55, D / 2, 0);
  opening(1.1, 1.25, 1.8, 1.55, D / 2, 0);
  opening(1.0, 2.15, 0, 1.075, D / 2, 0, true);
  opening(1.1, 1.25, -1.4, 1.55, -D / 2, Math.PI);
  opening(1.1, 1.25, 1.4, 1.55, -D / 2, Math.PI);
  [1, -1].forEach((s) => {
    opening(0.9, 1.15, s * W / 2, 1.5, 0, s * Math.PI / 2);
    opening(0.55, 0.7, s * W / 2, H + 0.5, 0, s * Math.PI / 2);
  });

  // Les deux pans : repère local identique à celui du mode « Pose » (x largeur, y pente, z normale)
  const nR = Math.round(W / 0.6);
  const xs = [-Wt / 2 + 0.02, Wt / 2 - 0.02];
  for (let i = 0; i <= nR; i++) xs.push(-W / 2 + 0.04 + (i * (W - 0.08)) / nR);
  xs.sort((a, b) => a - b);
  const battenYs = battensFor(layout);
  const r = rng(kind.length * 131);
  const rafterGeo = new THREE.BoxGeometry(0.075, L, raf);
  const battenGeo = new THREE.BoxGeometry(Wt + 0.06, 0.04, BATTEN_TOP);
  const tileGeoMesh = tileMesh(kind, list.length);
  const pans = [0, Math.PI].map((ry, k) => {
    const holder = new THREE.Group();
    holder.rotation.y = ry;
    group.add(holder);
    const pan = new THREE.Group();
    pan.rotation.x = p - Math.PI / 2;
    pan.position.set(0, Hr + raf / Math.cos(p) - L * Math.sin(p), L * Math.cos(p)); // y = L tombe sur le faîte
    holder.add(pan);
    const rafters = add(new THREE.InstancedMesh(rafterGeo, mat.wood(), xs.length), pan);
    const membrane = new THREE.Mesh(new THREE.PlaneGeometry(Wt, 1), mat.film(0x7d8a96, 0.92));
    membrane.position.z = 0.003;
    membrane.receiveShadow = true;
    pan.add(membrane);
    const battens = add(new THREE.InstancedMesh(battenGeo, mat.woodLight(), battenYs.length), pan);
    const tiles = k === 0 ? tileGeoMesh : new THREE.InstancedMesh(tileGeoMesh.geometry, mat.tile(), list.length);
    add(tiles, pan);
    tiles.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    const gutter = add(new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.065, Wt + 0.1, 16), mat.zinc()), pan);
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(0, 0.02, -0.07);
    return { pan, rafters, membrane, battens, tiles };
  });

  // Faîtage, dans un repère où z local = verticale
  const ridgeGroup = new THREE.Group();
  ridgeGroup.rotation.x = -Math.PI / 2;
  group.add(ridgeGroup);
  const ardoise = kind === 'ardoise';
  const ridgeY = Hr + (raf + 0.05) / Math.cos(p);
  const ridgeLen = ardoise ? Wt + 0.08 : 0.4;
  const ridgeCount = ardoise ? 1 : Math.ceil((Wt + 0.08) / 0.38);
  const ridge = add(new THREE.InstancedMesh(halfRidgeGeometry(ardoise ? 0.08 : 0.11, ridgeLen), ardoise ? mat.zinc() : mat.tile(), ridgeCount), ridgeGroup);
  const ridgeFinals = [];
  const ridgeVar = [];
  for (let i = 0; i < ridgeCount; i++) {
    const x = ridgeCount === 1 ? 0 : -Wt / 2 + 0.17 + i * 0.38;
    ridgeFinals.push({ p: new THREE.Vector3(x, 0, ridgeY), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) });
    ridgeVar.push((r() - 0.5) * 0.06);
  }

  // Couleurs : un écart propre à chaque tuile, réappliqué à chaque changement de teinte
  const vari = list.map(() => {
    let dl = (r() - 0.5) * 2 * T.jit;
    if (kind === 'plate' && r() < 0.18) dl -= 0.08; // flammé
    return [(r() - 0.5) * 0.02, 0.9 + r() * 0.15, dl];
  });
  const hsl = {}, col = new THREE.Color();
  let current = hex;
  function paint() {
    new THREE.Color(current).getHSL(hsl);
    vari.forEach(([dh, ds, dl], i) => {
      col.setHSL(hsl.h + dh, clamp01(hsl.s * ds), clamp01(hsl.l + dl));
      pans.forEach((pn) => pn.tiles.setColorAt(i, col));
    });
    pans.forEach((pn) => { pn.tiles.instanceColor.needsUpdate = true; });
    if (!ardoise) {
      ridgeVar.forEach((v, i) => ridge.setColorAt(i, col.setHSL(hsl.h, hsl.s, clamp01(hsl.l + v))));
      ridge.instanceColor.needsUpdate = true;
    }
  }
  paint();

  world.add(group);
  frame(group, new THREE.Vector3(0, 2.4, 0), 20, 1.12, 0.62);

  // Chronologie : charpente, écran, liteaux, couverture, faîtage
  const rafterFinals = xs.map((x) => ({ p: new THREE.Vector3(x, L / 2, -raf / 2), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }));
  const battenFinals = battenYs.map((y) => ({ p: new THREE.Vector3(0, y, BATTEN_TOP / 2 + 0.003), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }));
  const tileFinals = list.map((it) => tileTransform(kind, it, alpha));
  const tC0 = 0.2, tCstep = 0.05;
  const tM0 = tC0 + xs.length * tCstep + 0.45, dM = 0.9;
  const tB0 = tM0 + dM + 0.1, tBstep = Math.min(0.05, 1 / battenYs.length);
  const tT0 = tB0 + battenYs.length * tBstep + 0.25;
  const tilesDur = kind === 'mecanique' ? 4.2 : 6.2;
  const rowDur = tilesDur / layout.rows;
  const tR0 = tT0 + tilesDur + 0.15;
  const total = tR0 + ridgeCount * 0.05 + 0.5;
  const cStarts = xs.map((_, i) => tC0 + i * tCstep);
  const bStarts = battenYs.map((_, i) => tB0 + i * tBstep);
  const tStarts = list.map((it) => tT0 + it.row * rowDur + ((it.x + Wt / 2) / Wt) * rowDur * 0.85);
  const rStarts = ridgeFinals.map((_, i) => tR0 + i * 0.05);
  const state = { t: REDUCED ? total : 0 };

  const m4 = new THREE.Matrix4();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const pv = new THREE.Vector3(), sv = new THREE.Vector3();
  // Calcule les matrices sur le premier maillage puis les recopie sur les autres (pan arrière)
  function animInstances(meshes, finals, starts, dur, drop) {
    const mesh = meshes[0];
    let placed = 0;
    for (let i = 0; i < finals.length; i++) {
      const k = clamp01((state.t - starts[i]) / dur);
      if (k <= 0) { mesh.setMatrixAt(i, zero); continue; }
      placed++;
      const e = easeOut(k);
      const f = finals[i];
      pv.copy(f.p); pv.z += (1 - e) * drop; pv.y += (1 - e) * drop * 0.35;
      sv.copy(f.s).multiplyScalar(0.7 + 0.3 * e);
      m4.compose(pv, f.q, sv);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    for (let j = 1; j < meshes.length; j++) {
      meshes[j].instanceMatrix.array.set(mesh.instanceMatrix.array);
      meshes[j].instanceMatrix.needsUpdate = true;
    }
    return placed * meshes.length;
  }

  const front = pans[0].pan;
  const mi = MATERIAUX[kind];
  const unite = ardoise ? 'ardoises' : 'tuiles';
  addLabel('Charpente', front, new THREE.Vector3(xs[2], L * 0.3, 0.02), { show: () => state.t > tC0 + 0.3 && state.t < tT0 + tilesDur * 0.3 });
  addLabel('Écran sous-toiture', front, new THREE.Vector3(Wt * 0.22, L * 0.55, 0.01), { show: () => state.t > tM0 + dM * 0.6 && state.t < tT0 + tilesDur * 0.45 });
  addLabel('Liteaux', front, new THREE.Vector3(Wt / 2, battenYs[Math.floor(battenYs.length * 0.8)], BATTEN_TOP), { show: () => state.t > tB0 + battenYs.length * tBstep * 0.8 && state.t < tT0 + tilesDur * 0.75 });
  addLabel(mi.nom, front, new THREE.Vector3(-0.6, L * 0.42, 0.08), { show: () => state.t > tT0 + tilesDur * 0.5, cls: 'r3d-label-accent' });
  addLabel(ardoise ? 'Faîtage zinc' : 'Faîtières', ridgeGroup, new THREE.Vector3(Wt * 0.22, 0, ridgeY + 0.12), { show: () => state.t > tR0 + ridgeCount * 0.03 });
  addLabel('Gouttière', front, new THREE.Vector3(Wt / 2 - 0.4, 0.02, -0.07), { show: () => state.t >= total });

  const totalCount = 2 * (xs.length + battenYs.length + list.length) + ridgeCount;
  let lastShown = -1;
  function updateCaption(placed) {
    const nom = (COULEURS[kind].find((c) => c.hex === current) || COULEURS[kind][0]).nom;
    caption.textContent = `Maison de plain-pied, ${mi.nom.toLowerCase()} teinte « ${nom} », pente ${T.pitch}° : charpente, écran, liteaux, ${unite}, ${ardoise ? 'faîtage zinc' : 'faîtières'}. ${fmt(placed)} élément${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}${placed === totalCount ? '.' : '…'}`;
  }
  let done = false;

  return {
    group,
    replay() { state.t = 0; done = false; },
    setColor(h) { current = h; onColor(h); paint(); updateCaption(Math.max(0, lastShown)); },
    update(dt) {
      if (done) return false;
      state.t += dt;
      const nc = animInstances(pans.map((pn) => pn.rafters), rafterFinals, cStarts, 0.45, 0.9);
      const m = easeInOut(clamp01((state.t - tM0) / dM));
      pans.forEach(({ membrane }) => {
        membrane.visible = m > 0;
        membrane.scale.y = Math.max(0.001, m * L);
        membrane.position.y = (m * L) / 2;
      });
      const nb = animInstances(pans.map((pn) => pn.battens), battenFinals, bStarts, 0.35, 0.6);
      const nt = animInstances(pans.map((pn) => pn.tiles), tileFinals, tStarts, 0.38, 0.55);
      const nr = animInstances([ridge], ridgeFinals, rStarts, 0.3, 0.5);
      const placed = nc + nb + nt + nr;
      if (placed !== lastShown) { lastShown = placed; updateCaption(placed); }
      if (state.t > total) done = true;
      return true;
    }
  };
}

/* ─────────── Mode 1 : pose de la couverture */
function buildPose(api, kind) {
  const { addLabel, frame, placePan, caption, world, root } = api;
  const W = 5.4;
  const layout = layoutTiles(kind, W, 3.9);
  const { list, L, alpha, T } = layout;
  const pan = new THREE.Group();

  const rafters = buildRafters(W, L);
  pan.add(rafters);

  const battenYs = battensFor(layout);
  const battens = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.1, 0.04, BATTEN_TOP), mat.woodLight(), battenYs.length);
  battens.castShadow = true; battens.receiveShadow = true;
  pan.add(battens);

  const tiles = tileMesh(kind, list.length);
  const r = rng(kind.length * 977);
  const finals = list.map((it) => tileTransform(kind, it, alpha));
  list.forEach((it, i) => tiles.setColorAt(i, tileColor(kind, r)));
  tiles.instanceColor.needsUpdate = true;
  pan.add(tiles);

  // faîtage
  const ridgeLen = kind === 'ardoise' ? W + 0.08 : 0.4;
  const ridgeCount = kind === 'ardoise' ? 1 : Math.ceil((W + 0.08) / 0.38);
  const ridgeMat = kind === 'ardoise' ? mat.zinc() : mat.tile();
  const ridge = new THREE.InstancedMesh(halfRidgeGeometry(kind === 'ardoise' ? 0.07 : 0.11, ridgeLen), ridgeMat, ridgeCount);
  ridge.castShadow = true;
  const ridgeFinals = [];
  for (let i = 0; i < ridgeCount; i++) {
    const x = ridgeCount === 1 ? 0 : -W / 2 + 0.17 + i * 0.38;
    ridgeFinals.push({ p: new THREE.Vector3(x, L - 0.06, BATTEN_TOP + 0.03), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) });
    if (kind !== 'ardoise') ridge.setColorAt(i, new THREE.Color(T.base).offsetHSL(0, 0, (r() - 0.5) * 0.06));
  }
  if (ridge.instanceColor) ridge.instanceColor.needsUpdate = true;
  pan.add(ridge);

  const group = new THREE.Group();
  group.add(pan);
  world.add(group);
  const center = placePan(pan, T.pitch, L);
  frame(group, center, 12.5, 1.0, 0.55);

  // Chronologie
  const tB0 = 0.25, tBstep = 0.05, dB = 0.4;
  const tT0 = tB0 + battenYs.length * tBstep + 0.2;
  const tilesDur = kind === 'mecanique' ? 4.2 : 6.2;
  const rowDur = tilesDur / layout.rows;
  const startTimes = list.map((it) => {
    const u = (it.x + W / 2) / W;
    return tT0 + it.row * rowDur + u * rowDur * 0.85;
  });
  const tR0 = tT0 + tilesDur + 0.15;
  const total = tR0 + ridgeCount * 0.05 + 0.5;

  const battenFinal = battenYs.map((y) => ({ p: new THREE.Vector3(0, y, BATTEN_TOP / 2), q: new THREE.Quaternion(), s: new THREE.Vector3(1, 1, 1) }));
  const m4 = new THREE.Matrix4();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const pv = new THREE.Vector3(), sv = new THREE.Vector3();
  const state = { t: REDUCED ? total : 0 };

  function animInstances(mesh, finals, starts, dur, drop) {
    let placed = 0;
    for (let i = 0; i < finals.length; i++) {
      const p = clamp01((state.t - starts[i]) / dur);
      if (p <= 0) { mesh.setMatrixAt(i, zero); continue; }
      placed++;
      const e = easeOut(p);
      const f = finals[i];
      pv.copy(f.p); pv.z += (1 - e) * drop; pv.y += (1 - e) * drop * 0.35;
      sv.copy(f.s).multiplyScalar(0.7 + 0.3 * e);
      m4.compose(pv, f.q, sv);
      mesh.setMatrixAt(i, m4);
    }
    mesh.instanceMatrix.needsUpdate = true;
    return placed;
  }
  const bStarts = battenYs.map((_, i) => tB0 + i * tBstep);
  const rStarts = ridgeFinals.map((_, i) => tR0 + i * 0.05);

  const mi = MATERIAUX[kind];
  const totalCount = list.length + battenYs.length + ridgeCount;
  let lastShown = -1;
  let done = false;

  const labelPan = pan;
  addLabel('Chevrons', labelPan, new THREE.Vector3(rafters.userData.xs[0], -0.3, -0.12));
  addLabel('Liteaux', labelPan, new THREE.Vector3(W / 2 + 0.05, battenYs[Math.floor(battenYs.length * 0.75)], BATTEN_TOP), { show: () => state.t > tB0 + battenYs.length * tBstep * 0.75 });
  addLabel('Faîtage', labelPan, new THREE.Vector3(0.6, L - 0.02, 0.16), { show: () => state.t > tR0 + ridgeCount * 0.05 * 0.6 });
  addLabel(mi.nom, labelPan, new THREE.Vector3(-0.8, L * 0.35, 0.08), { show: () => state.t > tT0 + tilesDur * 0.5, cls: 'r3d-label-accent' });

  return {
    group,
    replay() { state.t = 0; done = false; },
    update(dt) {
      if (done) return false;
      state.t += dt;
      const nb = animInstances(battens, battenFinal, bStarts, dB, 0.6);
      const nt = animInstances(tiles, finals, startTimes, 0.38, 0.55);
      const nr = animInstances(ridge, ridgeFinals, rStarts, 0.3, 0.5);
      const placed = nb + nt + nr;
      if (placed !== lastShown) {
        lastShown = placed;
        caption.textContent = `${mi.nom} – ${mi.teinte} : liteaux, tuiles${kind === 'ardoise' ? ', faîtage zinc' : ', faîtières'}. ${fmt(placed)} élément${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}${placed === totalCount ? '.' : '…'}`;
      }
      if (state.t > total) done = true;
      return true;
    }
  };
}

/* ─────────── Mode 2 : démoussage avant / après */
function buildDemoussage(api) {
  const { addLabel, frame, placePan, caption, world, root } = api;
  const kind = 'mecanique';
  const W = 5.4;
  const layout = layoutTiles(kind, W, 3.6);
  const { list, L, alpha, T } = layout;
  const pan = new THREE.Group();
  pan.add(buildRafters(W, L));
  const battenYs = battensFor(layout);
  const battens = new THREE.InstancedMesh(new THREE.BoxGeometry(W + 0.1, 0.04, BATTEN_TOP), mat.woodLight(), battenYs.length);
  battenYs.forEach((y, i) => battens.setMatrixAt(i, new THREE.Matrix4().makeTranslation(0, y, BATTEN_TOP / 2)));
  pan.add(battens);

  const tiles = tileMesh(kind, list.length);
  const r = rng(42);
  const dirty = [], jitter = [];
  list.forEach((it, i) => {
    const f = tileTransform(kind, it, alpha);
    tiles.setMatrixAt(i, new THREE.Matrix4().compose(f.p, f.q, f.s));
    // tuile encrassée : brun-gris délavé, plus sombre vers le bas
    const k = 0.45 + r() * 0.35 + (1 - it.y / L) * 0.15;
    dirty.push(new THREE.Color(T.base).lerp(new THREE.Color(r() < 0.5 ? '#5d5444' : '#6c6a55'), clamp01(k)));
    jitter.push((r() - 0.5) * 0.06);
  });
  pan.add(tiles);

  // mousses et lichens
  const MOSS = 1100;
  const mossGeo = new THREE.SphereGeometry(1, 9, 6);
  const moss = new THREE.InstancedMesh(mossGeo, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 1 }), MOSS);
  moss.castShadow = true;
  const mossTf = [];
  const palette = ['#5f7a2e', '#71893a', '#8c9b45', '#a29f55', '#b2ae94', '#4f6a28'];
  for (let i = 0; i < MOSS; i++) {
    const x = -W / 2 + 0.05 + r() * (W - 0.1);
    const y = Math.pow(r(), 1.5) * (L - 0.25) + 0.05; // plus dense vers l'égout
    const lichen = r() < 0.35;
    const rad = lichen ? 0.03 + r() * 0.04 : 0.04 + r() * 0.08;
    const pos = new THREE.Vector3(x, y, BATTEN_TOP + 0.03 + r() * 0.012);
    const sc = new THREE.Vector3(rad * (0.8 + r() * 0.6), rad * (0.7 + r() * 0.5), lichen ? 0.005 : rad * 0.22);
    mossTf.push({ pos, sc, x });
    moss.setColorAt(i, new THREE.Color(lichen ? palette[3 + Math.floor(r() * 2)] : palette[Math.floor(r() * 3) + (r() < 0.3 ? 3 : 0)]));
  }
  moss.instanceColor.needsUpdate = true;
  pan.add(moss);

  // front de nettoyage
  const sweep = new THREE.Mesh(new THREE.BoxGeometry(0.03, L + 0.1, 0.12), new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.55, roughness: 0.2 }));
  sweep.position.set(0, L / 2, 0.08);
  pan.add(sweep);

  const group = new THREE.Group();
  group.add(pan);
  world.add(group);
  const center = placePan(pan, 32, L);
  frame(group, center, 11.5, 0.95, 0.12);

  const state = { split: 0, clean: new THREE.Color(TEINTES[0].hex), anim: null };
  const tmpC = new THREE.Color();
  const m4 = new THREE.Matrix4();
  const zero = new THREE.Matrix4().makeScale(0, 0, 0);
  const q0 = new THREE.Quaternion();

  function apply() {
    const sx = -W / 2 + state.split * W; // à gauche : avant (sale), à droite : après (propre)
    list.forEach((it, i) => {
      if (it.x < sx) tiles.setColorAt(i, dirty[i]);
      else tiles.setColorAt(i, tmpC.copy(state.clean).offsetHSL(0, 0, jitter[i]));
    });
    tiles.instanceColor.needsUpdate = true;
    mossTf.forEach((m, i) => {
      moss.setMatrixAt(i, m.x < sx ? m4.compose(m.pos, q0, m.sc) : zero);
    });
    moss.instanceMatrix.needsUpdate = true;
    sweep.position.x = sx;
    sweep.visible = state.split > 0.01 && state.split < 0.99;
  }

  const lAvant = addLabel('Avant', pan, new THREE.Vector3(0, L * 0.62, 0.1), { show: () => state.split > 0.12 });
  const lApres = addLabel('Après', pan, new THREE.Vector3(0, L * 0.62, 0.1), { show: () => state.split < 0.88, cls: 'r3d-label-accent' });

  const range = root.querySelector('[data-r3d="split"]');
  function setSplit(v, fromRange) {
    state.split = clamp01(v);
    lAvant.local.x = (-W / 2 + (-W / 2 + state.split * W)) / 2;
    lApres.local.x = ((-W / 2 + state.split * W) + W / 2) / 2;
    if (!fromRange && range) range.value = Math.round(state.split * 100);
    apply();
    updateCaption();
  }
  function updateCaption() {
    const pct = Math.round((1 - state.split) * 100);
    const teinte = TEINTES.find((t) => t.hex === '#' + state.clean.getHexString())?.nom || '';
    caption.textContent = `Tuile mécanique – à gauche avant traitement, à droite après démoussage et peinture « ${teinte} ». ${pct} % de la surface traitée.`;
  }
  setSplit(0.5);

  return {
    group,
    setSplit(v) { state.anim = null; setSplit(v, true); },
    setColor(hex) { state.clean.set(hex); apply(); updateCaption(); },
    run() { state.anim = { t: 0, from: 1, to: 0 }; setSplit(1); },
    update(dt) {
      if (!state.anim) return false;
      state.anim.t += dt / (REDUCED ? 0.01 : 3.2);
      const p = easeInOut(clamp01(state.anim.t));
      setSplit(state.anim.from + (state.anim.to - state.anim.from) * p);
      if (state.anim.t >= 1) state.anim = null;
      return true;
    }
  };
}

/* ─────────── Mode 3 : fenêtre de toit, vue éclatée */
function buildFenetre(api) {
  const { addLabel, frame, placePan, caption, world, root } = api;
  const kind = 'mecanique';
  const W = 4.6;
  const ow = 0.78, oh = 1.18; // ouverture 78 × 118 cm
  const oy0 = 1.35;
  const oc = new THREE.Vector2(0, oy0 + oh / 2);
  const margin = 0.08;
  const skip = (cx, cy, w, len) =>
    Math.abs(cx - oc.x) < ow / 2 + margin + w / 2 - 0.02 &&
    cy + len / 2 > oy0 - 0.12 && cy - len / 2 < oy0 + oh + margin;
  const layout = layoutTiles(kind, W, 3.8, skip);
  const { list, L, alpha, T } = layout;
  const pan = new THREE.Group();

  const xs = [-0.47, 0.47, -1.07, 1.07, -1.67, 1.67, -2.2, 2.2];
  pan.add(buildRafters(W, L, { xs }));

  // liteaux interrompus au droit de l'ouverture
  const battenYs = battensFor(layout);
  const bGeo = new THREE.BoxGeometry(1, 0.04, BATTEN_TOP);
  const bMat = mat.woodLight();
  battenYs.forEach((y) => {
    const cut = y > oy0 - 0.08 && y < oy0 + oh + 0.08;
    const segs = cut ? [[-W / 2 - 0.05, -0.47], [0.47, W / 2 + 0.05]] : [[-W / 2 - 0.05, W / 2 + 0.05]];
    segs.forEach(([a, b]) => {
      const m = new THREE.Mesh(bGeo, bMat);
      m.scale.x = b - a; m.position.set((a + b) / 2, y, BATTEN_TOP / 2);
      m.castShadow = true; m.receiveShadow = true;
      pan.add(m);
    });
  });

  const tiles = tileMesh(kind, list.length);
  const r = rng(7);
  list.forEach((it, i) => {
    const f = tileTransform(kind, it, alpha);
    tiles.setMatrixAt(i, new THREE.Matrix4().compose(f.p, f.q, f.s));
    tiles.setColorAt(i, tileColor(kind, r));
  });
  tiles.instanceColor.needsUpdate = true;
  pan.add(tiles);

  const ridge = new THREE.InstancedMesh(halfRidgeGeometry(0.11, 0.4), mat.tile(), Math.ceil((W + 0.08) / 0.38));
  for (let i = 0; i < ridge.count; i++) {
    ridge.setMatrixAt(i, new THREE.Matrix4().makeTranslation(-W / 2 + 0.17 + i * 0.38, L - 0.06, BATTEN_TOP + 0.03));
    ridge.setColorAt(i, new THREE.Color(T.base));
  }
  ridge.castShadow = true;
  pan.add(ridge);

  // Couches de la fenêtre
  const layers = [];
  const mk = (name, build, z0, dz, labelAt) => {
    const g = new THREE.Group();
    build(g);
    g.position.set(oc.x, oc.y, z0);
    g.userData = { z0, dz };
    pan.add(g);
    layers.push(g);
    addLabel(name, g, labelAt);
  };
  // chevêtre : deux traverses entre les chevrons
  mk('Chevêtre', (g) => {
    const geo = new THREE.BoxGeometry(0.94 - 0.075, 0.075, 0.16);
    [-oh / 2 - 0.04, oh / 2 + 0.04].forEach((y) => {
      const b = new THREE.Mesh(geo, mat.wood()); b.position.set(0, y, -0.08); b.castShadow = true; g.add(b);
    });
  }, 0, 0, new THREE.Vector3(0.42, oh / 2 + 0.06, -0.02));
  mk('Habillage intérieur', (g) => {
    const m = new THREE.Mesh(ringGeometry(ow + 0.16, oh + 0.16, 0.09, 0.3), mat.white());
    m.position.z = -0.32; m.castShadow = true; g.add(m);
  }, 0, -1.25, new THREE.Vector3(ow / 2 + 0.05, -oh / 2, -0.32));
  mk('Cadre dormant', (g) => {
    const m = new THREE.Mesh(ringGeometry(ow, oh, 0.07, 0.16), mat.woodLight());
    m.position.z = 0.02; m.castShadow = true; g.add(m);
  }, 0, 0.75, new THREE.Vector3(-ow / 2, 0, 0.06));
  mk("Raccord d'étanchéité", (g) => {
    const ring = new THREE.Mesh(ringGeometry(ow + 0.24, oh + 0.24, 0.13, 0.012), mat.dark());
    ring.position.z = 0.09; ring.castShadow = true; g.add(ring);
    const apron = new THREE.Mesh(new THREE.BoxGeometry(ow + 0.34, 0.22, 0.01), mat.dark());
    apron.position.set(0, -oh / 2 - 0.2, 0.075); apron.castShadow = true; g.add(apron);
  }, 0, 1.5, new THREE.Vector3(ow / 2 + 0.12, -oh / 2 - 0.2, 0.09));
  mk('Ouvrant vitré', (g) => {
    const frameM = new THREE.Mesh(ringGeometry(ow - 0.02, oh - 0.02, 0.075, 0.07), mat.dark());
    frameM.position.z = 0.14; frameM.castShadow = true; g.add(frameM);
    const glass = new THREE.Mesh(new THREE.BoxGeometry(ow - 0.16, oh - 0.16, 0.012), mat.glass());
    glass.position.z = 0.15; g.add(glass);
  }, 0, 2.3, new THREE.Vector3(0, oh / 2 - 0.02, 0.18));

  const group = new THREE.Group();
  group.add(pan);
  world.add(group);
  const center = placePan(pan, 38, L, 0.9);
  frame(group, center, 10.5, 1.12, 0.85);

  const state = { k: REDUCED ? 1 : 0, target: 1 };
  function apply() {
    const e = easeInOut(state.k);
    layers.forEach((g) => { g.position.z = g.userData.z0 + g.userData.dz * e; });
  }
  apply();
  caption.textContent = 'Fenêtre de toit 78 × 118 cm dans une couverture en tuiles mécaniques : ouverture, chevêtre, cadre, raccord, ouvrant.';
  return {
    group,
    toggle() { state.target = state.target ? 0 : 1; return state.target; },
    update(dt) {
      if (state.k === state.target) return false;
      const step = dt / (REDUCED ? 0.01 : 0.9);
      state.k = state.target > state.k ? Math.min(state.target, state.k + step) : Math.max(state.target, state.k - step);
      apply();
      return true;
    }
  };
}

/* ─────────── Mode 4 : isolation en coupe */
function buildCoupe(api) {
  const { addLabel, frame, placePan, caption, world, root } = api;
  const W = 2.6, L = 2.5;
  const pan = new THREE.Group();
  const layers = [];
  const add = (name, objs, dz, labelAt, cls) => {
    const g = new THREE.Group();
    objs.forEach((o) => { o.castShadow = true; o.receiveShadow = true; g.add(o); });
    g.userData.dz = dz;
    pan.add(g);
    layers.push(g);
    addLabel(name, g, labelAt, cls ? { cls } : {});
    return g;
  };
  const box = (w, h, d, m, x, y, z) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); return b; };

  add('Plaque de plâtre', [box(W, L, 0.013, mat.white(), 0, L / 2, -0.235)], -1.15, new THREE.Vector3(W / 2, 0.15, -0.235));
  add('Pare-vapeur', [box(W, L, 0.004, mat.film(0x5d9fd6, 0.7), 0, L / 2, -0.225)], -0.82, new THREE.Vector3(W / 2, 0.45, -0.225));
  add('Isolant', [box(W, L, 0.2, new THREE.MeshStandardMaterial({ color: 0xf2c94c, roughness: 1 }), 0, L / 2, -0.115)], -0.48, new THREE.Vector3(W / 2, 0.75, -0.06), 'r3d-label-accent');
  const rafterXs = [-0.95, -0.35, 0.25, 0.85];
  add('Chevrons', rafterXs.map((x) => box(0.075, L, 0.16, mat.wood(), x, L / 2, -0.07)), 0, new THREE.Vector3(rafterXs[0], 0.05, -0.07));
  add('Écran sous-toiture HPV', [box(W, L, 0.004, mat.film(0x8d99a6, 0.88), 0, L / 2, 0.012)], 0.38, new THREE.Vector3(W / 2, 1.05, 0.012));
  add('Contre-liteaux', rafterXs.map((x) => box(0.04, L, 0.025, mat.woodLight(), x, L / 2, 0.027)), 0.66, new THREE.Vector3(rafterXs[3], L - 0.05, 0.03));
  const lys = []; for (let y = 0.1; y < L; y += 0.34) lys.push(y);
  add('Liteaux', lys.map((y) => box(W, 0.04, 0.027, mat.woodLight(), 0, y, 0.053)), 0.94, new THREE.Vector3(-W / 2, lys[3], 0.053));
  // tuiles posées sur les liteaux
  const layout = layoutTiles('mecanique', W, L - 0.05);
  const tiles = tileMesh('mecanique', layout.list.length);
  const r = rng(11);
  layout.list.forEach((it, i) => {
    const f = tileTransform('mecanique', it, layout.alpha);
    f.p.z += 0.04;
    tiles.setMatrixAt(i, new THREE.Matrix4().compose(f.p, f.q, f.s));
    tiles.setColorAt(i, tileColor('mecanique', r));
  });
  tiles.instanceColor.needsUpdate = true;
  add('Tuiles', [tiles], 1.3, new THREE.Vector3(-W / 2 + 0.3, L * 0.7, 0.1), 'r3d-label-accent');

  const group = new THREE.Group();
  group.add(pan);
  world.add(group);
  const center = placePan(pan, 35, L, 1.1);
  frame(group, center, 9.2, 1.22, 1.32);

  const state = { k: REDUCED ? 1 : 0, target: 1 };
  function apply() {
    const e = easeInOut(state.k);
    layers.forEach((g) => { g.position.z = g.userData.dz * e * 0.8; });
  }
  apply();
  caption.textContent = 'Coupe d’une toiture isolée, de l’intérieur vers l’extérieur : plâtre, pare-vapeur, isolant, chevrons, écran, contre-liteaux, liteaux, tuiles.';
  return {
    group,
    toggle() { state.target = state.target ? 0 : 1; return state.target; },
    update(dt) {
      if (state.k === state.target) return false;
      const step = dt / (REDUCED ? 0.01 : 1.1);
      state.k = state.target > state.k ? Math.min(state.target, state.k + step) : Math.max(state.target, state.k - step);
      apply();
      return true;
    }
  };
}


export function init(root) {
  let kind = 'mecanique';
  const teinte = {};
  Object.keys(COULEURS).forEach((k) => { teinte[k] = COULEURS[k][0].hex; });
  const syncKind = () => root.querySelectorAll('[data-r3d-kind]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.r3dKind === kind)));
  const swatchBox = root.querySelector('[data-r3d-teintes]');
  const syncSwatches = () => {
    if (!swatchBox) return;
    swatchBox.innerHTML = COULEURS[kind]
      .map((c) => `<button type="button" data-r3d-color="${c.hex}" aria-pressed="${c.hex === teinte[kind]}" title="${c.nom}" aria-label="Teinte ${c.nom}" style="background:${c.hex}"></button>`)
      .join('');
  };
  createViewer(root, {
    initial: root.dataset.mode || 'maison',
    builders: {
      maison: (api) => buildMaison(api, kind, teinte[kind], (h) => { teinte[kind] = h; }),
      pose: (api) => buildPose(api, kind),
      demoussage: buildDemoussage,
      fenetre: buildFenetre,
      coupe: buildCoupe
    },
    info: (m) => (m === 'pose' || m === 'maison' ? MATERIAUX[kind] : MODES[m]),
    onShow: () => { syncKind(); syncSwatches(); },
    onButton(b, api) {
      if (!b.dataset.r3dKind) return false;
      kind = b.dataset.r3dKind;
      api.show(api.mode === 'maison' ? 'maison' : 'pose');
      return true;
    }
  });
}
