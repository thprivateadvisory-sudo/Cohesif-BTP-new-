// Cohesif BTP — simulateur 3D de façade (maison entière, ravalement avant / après, échafaudage, ITE, fissures)
// Chargé à la demande par facade-ravalement.html quand le bloc #r3d approche de l'écran.
import { THREE, REDUCED, easeOut, easeInOut, clamp01, fmt, rng, ringGeometry, mat } from './r3d-core.js';
import { createViewer } from './r3d-core.js';

/* ────────────────────────────────────────── Données affichées */

const MODES = {
  maison: {
    titre: "Ravalement d'une maison : avant / après",
    texte: "Toute la maison d'un coup d'œil : à gauche, des façades grisées, un soubassement verdi par les algues, des fissures et des volets délavés. À droite, la même maison après ravalement. Choisissez la teinte de l'enduit et la couleur des volets, faites glisser le curseur ou faites pivoter la maison.",
    specs: [['Nettoyage', 'Démoussage + lavage basse pression'], ['Réparation', 'Fissures, appuis, soubassement'], ['Finition', 'Enduit, peinture ou revêtement'], ['Teinte', 'Selon le PLU de votre commune']],
    points: [
      'Façades, pignons et soubassement traités ensemble : un aspect uniforme tout autour de la maison.',
      'Traitement anti-mousse et anti-algues, surtout en pied de mur où l’humidité remonte.',
      'Fissures ouvertes, rebouchées et armées avant la finition, pour qu’elles ne réapparaissent pas.',
      'Volets, appuis et porte remis en peinture dans la couleur de votre choix.',
      'Déclaration préalable en mairie lorsque l’aspect change : nous la préparons avec vous.'
    ]
  },
  ravalement: {
    titre: 'Ravalement de façade : avant / après',
    texte: "À gauche, une façade encrassée par la pollution, marquée de coulures et de fissures. À droite, la même façade après nettoyage, réparations et mise en teinte. Faites glisser le curseur, changez la teinte ou lancez le ravalement.",
    specs: [['Nettoyage', 'Hydrogommage ou basse pression'], ['Réparation', 'Fissures, pierres, modénatures'], ['Finition', 'Enduit, badigeon ou peinture minérale'], ['Obligation', 'À Paris : au moins tous les 10 ans']],
    points: [
      'Diagnostic du support d’abord : pierre, enduit, brique ou béton ne se traitent pas de la même façon.',
      'Technique de nettoyage adaptée pour ne pas abîmer la pierre ni les joints.',
      'Reprise des fissures, des pierres abîmées, des appuis et des éléments décoratifs.',
      'Teinte validée avec vous, et avec l’Architecte des Bâtiments de France en secteur protégé.'
    ]
  },
  echafaudage: {
    titre: 'Échafaudage et sécurité du chantier',
    texte: "Avant de toucher à la façade, l'échafaudage est monté niveau par niveau, ancré au bâtiment puis fermé par un filet. Il protège les compagnons, les passants et les voisins pendant toute la durée des travaux.",
    specs: [['Montage', 'Par des monteurs formés (R408)'], ['Autorisation', 'Occupation de la voirie'], ['Ancrage', 'Fixé à la façade à intervalles réguliers'], ['Protection', 'Garde-corps, plinthes et filet']],
    points: [
      'Demande d’autorisation de voirie auprès de la mairie, prise en charge par nos soins.',
      'Garde-corps, lisses et plinthes à chaque niveau de travail.',
      'Filet de protection pour retenir poussières et projections.',
      'Vérification avant mise en service, puis contrôles réguliers pendant le chantier.'
    ]
  },
  ite: {
    titre: "Isolation thermique par l'extérieur (ITE)",
    texte: "L'isolant est fixé sur la façade puis protégé par un enduit armé : le logement est isolé sans perdre un mètre carré à l'intérieur, et la façade est rénovée en même temps.",
    specs: [['Isolant', 'PSE, laine de roche ou fibre de bois'], ['Épaisseur', 'Souvent 12 à 20 cm'], ['Fixation', 'Collée et/ou chevillée selon le support'], ['Finition', 'Enduit mince ou épais, teinte au choix']],
    points: [
      'Rail de départ en pied de mur pour aligner et protéger le bas de l’isolant.',
      'Plaques posées à joints décalés, sans pont thermique.',
      'Sous-enduit armé d’un treillis en fibre de verre : il résiste aux chocs et à la fissuration.',
      'Aides possibles (MaPrimeRénov’, CEE) lorsque les travaux sont réalisés par une entreprise RGE.'
    ]
  },
  fissures: {
    titre: 'Traitement des fissures',
    texte: "Une fissure laisse entrer l'eau dans le mur. On ne se contente pas de la masquer : elle est ouverte, rebouchée, armée puis recouverte, pour éviter qu'elle ne réapparaisse.",
    specs: [['Diagnostic', 'Fissure stable ou active ?'], ['Ouverture', 'Saignée en V le long de la fissure'], ['Armature', 'Bande de treillis fibre de verre'], ['Finition', 'Enduit ou peinture de façade']],
    points: [
      'Une fissure qui évolue est d’abord surveillée : une cause structurelle se traite avant la façade.',
      'Microfissures (moins de 0,2 mm) : traitées par un revêtement de façade adapté.',
      'Fissures plus larges : ouverture, mortier ou mastic de réparation, puis armature.',
      'Le revêtement final unifie l’aspect et protège le mur de la pluie.'
    ]
  }
};

const TEINTES = {
  '#e9dfcb': 'Pierre de Paris',
  '#f2eee6': 'Blanc cassé',
  '#e4cfa8': 'Sable',
  '#d9d9d4': 'Gris perle',
  '#dcb886': 'Ocre clair'
};

/* ────────────────────────────────────────── Textures dessinées */

function canvasTexture(w, h, draw) {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

// Pierre de taille : assises régulières et joints verticaux décalés
function drawStone(g, w, h, course, joint) {
  g.strokeStyle = joint; g.lineWidth = 2;
  for (let y = 0, row = 0; y < h; y += course, row++) {
    g.beginPath(); g.moveTo(0, y); g.lineTo(w, y); g.stroke();
    const step = course * 2.4;
    for (let x = (row % 2) * step / 2; x < w; x += step) { g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + course); g.stroke(); }
  }
}

function stoneTexture() {
  return canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const r = rng(3);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.035})`; g.fillRect(r() * w, r() * h, 2 + r() * 4, 2 + r() * 4); }
    drawStone(g, w, h, 38, 'rgba(120,110,95,0.35)');
  });
}

// Façade encrassée : pollution plus marquée en bas, coulures sous les appuis de fenêtre
// joints = false : enduit sans pierre de taille (maison)
function grimeTexture(windowXs, W, joints = true) {
  return canvasTexture(1024, 1024, (g, w, h) => {
    g.fillStyle = '#ffffff'; g.fillRect(0, 0, w, h);
    const r = rng(9);
    const grad = g.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, 'rgba(40,35,30,0.05)'); grad.addColorStop(0.7, 'rgba(40,35,30,0.18)'); grad.addColorStop(1, 'rgba(30,25,20,0.42)');
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
    for (let i = 0; i < 90; i++) {
      const x = r() * w, y = r() * h, rad = 20 + r() * 90;
      const b = g.createRadialGradient(x, y, 0, x, y, rad);
      b.addColorStop(0, `rgba(45,40,32,${0.08 + r() * 0.12})`); b.addColorStop(1, 'rgba(45,40,32,0)');
      g.fillStyle = b; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
    }
    for (let i = 0; i < 260; i++) {
      g.fillStyle = `rgba(35,30,25,${0.04 + r() * 0.08})`;
      g.fillRect(r() * w, r() * h * 0.9, 1 + r() * 3, 30 + r() * 160);
    }
    windowXs.forEach((x) => {
      const u = ((x + W / 2) / W) * w;
      for (let k = 0; k < 7; k++) {
        g.fillStyle = `rgba(30,25,20,${0.08 + r() * 0.1})`;
        g.fillRect(u - 34 + r() * 68, 120 + r() * 700, 2 + r() * 4, 60 + r() * 120);
      }
    });
    if (joints) drawStone(g, w, h, 38, 'rgba(80,70,60,0.45)');
  });
}

function blockTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    g.fillStyle = '#9ea2a5'; g.fillRect(0, 0, w, h);
    const r = rng(5);
    const bh = 64, bw = 160;
    for (let y = 0, row = 0; y < h; y += bh, row++) {
      for (let x = -(row % 2) * bw / 2; x < w; x += bw) {
        g.fillStyle = `hsl(210, 4%, ${56 + r() * 8}%)`;
        g.fillRect(x + 3, y + 3, bw - 6, bh - 6);
      }
    }
    for (let i = 0; i < 3000; i++) { g.fillStyle = `rgba(0,0,0,${r() * 0.08})`; g.fillRect(r() * w, r() * h, 2, 2); }
  });
}

function meshTexture(color, step, alpha) {
  const t = canvasTexture(256, 256, (g, w, h) => {
    g.clearRect(0, 0, w, h);
    g.strokeStyle = color; g.globalAlpha = alpha; g.lineWidth = 3;
    for (let i = 0; i <= w; i += step) {
      g.beginPath(); g.moveTo(i, 0); g.lineTo(i, h); g.stroke();
      g.beginPath(); g.moveTo(0, i); g.lineTo(w, i); g.stroke();
    }
  });
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  return t;
}

/* ────────────────────────────────────────── Immeuble type haussmannien */

const B = { W: 6, Hg: 1.6, Hf: 1.25, NF: 4 };
B.top = B.Hg + B.NF * B.Hf;
const WIN_XS = [-2.1, -0.7, 0.7, 2.1];

function std(color, extra = {}) { return new THREE.MeshStandardMaterial({ color, roughness: 0.85, ...extra }); }

function materialSet(dirty, plane, wallMap, teinte) {
  const clip = plane ? { clippingPlanes: [plane] } : {};
  const stone = new THREE.Color(teinte || '#e9dfcb');
  return {
    wall: std(dirty ? '#a49582' : stone, { map: wallMap, roughness: 0.95, ...clip }),
    trim: std(dirty ? '#998b78' : stone.clone().offsetHSL(0, -0.02, 0.03), { roughness: 0.9, ...clip }),
    frame: std(dirty ? '#c4bcad' : '#f7f5f0', { roughness: 0.6, ...clip }),
    glass: std(dirty ? '#2c3136' : '#33414d', { roughness: 0.12, metalness: 0.35, ...clip }),
    iron: std('#202326', { roughness: 0.5, metalness: 0.5, ...clip }),
    zinc: std(dirty ? '#7b8187' : '#8f99a3', { roughness: 0.4, metalness: 0.55, ...clip }),
    door: std(dirty ? '#26342c' : '#2f4a3c', { roughness: 0.55, ...clip }),
    brick: std(dirty ? '#7e5444' : '#b0654b', { ...clip }),
    crack: std('#3a322b', { ...clip })
  };
}

function box(w, h, d, m, x, y, z) {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z);
  b.castShadow = true; b.receiveShadow = true;
  return b;
}

function windowUnit(g, M, x, y, w, h) {
  g.add(box(w, h, 0.01, M.glass, x, y + h / 2, 0.004));
  const surround = new THREE.Mesh(ringGeometry(w + 0.16, h + 0.16, 0.07, 0.04), M.trim);
  surround.position.set(x, y + h / 2, 0.02); surround.castShadow = true; g.add(surround);
  const fr = new THREE.Mesh(ringGeometry(w, h, 0.035, 0.03), M.frame);
  fr.position.set(x, y + h / 2, 0.018); g.add(fr);
  g.add(box(0.03, h - 0.04, 0.03, M.frame, x, y + h / 2, 0.02));
  g.add(box(w - 0.04, 0.03, 0.03, M.frame, x, y + h * 0.72, 0.02));
  g.add(box(w + 0.24, 0.05, 0.12, M.trim, x, y - 0.03, 0.05));
}

function railing(g, M, x0, x1, y, z, h) {
  const n = Math.round((x1 - x0) / 0.085);
  const bars = new THREE.InstancedMesh(new THREE.CylinderGeometry(0.008, 0.008, h, 6), M.iron, n + 1);
  for (let i = 0; i <= n; i++) bars.setMatrixAt(i, new THREE.Matrix4().makeTranslation(x0 + (i * (x1 - x0)) / n, y + h / 2, z));
  bars.castShadow = true;
  g.add(bars);
  g.add(box(x1 - x0 + 0.04, 0.035, 0.04, M.iron, (x0 + x1) / 2, y + h, z));
  g.add(box(x1 - x0, 0.02, 0.02, M.iron, (x0 + x1) / 2, y + 0.06, z));
}

function buildBuilding(M, opts = {}) {
  const g = new THREE.Group();
  const { W, Hg, Hf, NF, top } = B;
  g.add(box(W, top, 0.4, M.wall, 0, top / 2, -0.2));

  // rez-de-chaussée : porte cochère et deux vitrines
  g.add(box(1.1, 1.3, 0.05, M.door, 0, 0.65, 0.01));
  const portal = new THREE.Mesh(ringGeometry(1.32, 1.42, 0.11, 0.06), M.trim);
  portal.position.set(0, 0.71, 0.03); portal.castShadow = true; g.add(portal);
  [-1.95, 1.95].forEach((x) => {
    g.add(box(1.5, 1.05, 0.01, M.glass, x, 0.68, 0.004));
    const f = new THREE.Mesh(ringGeometry(1.5, 1.05, 0.05, 0.04), M.frame); f.position.set(x, 0.68, 0.02); g.add(f);
    g.add(box(1.7, 0.12, 0.08, M.trim, x, 1.3, 0.04));
  });
  g.add(box(W + 0.06, 0.12, 0.1, M.trim, 0, Hg - 0.02, 0.05));

  for (let f = 0; f < NF; f++) {
    const y0 = Hg + f * Hf;
    const h = f === NF - 1 ? 0.78 : 0.9;
    WIN_XS.forEach((x) => windowUnit(g, M, x, y0 + 0.2, 0.6, h));
    if (f === 0 || f === NF - 1) {
      g.add(box(W - 0.2, 0.07, 0.38, M.trim, 0, y0 + 0.16, 0.19));
      railing(g, M, -W / 2 + 0.15, W / 2 - 0.15, y0 + 0.2, 0.36, 0.55);
    } else {
      WIN_XS.forEach((x) => railing(g, M, x - 0.32, x + 0.32, y0 + 0.2, 0.07, 0.42));
    }
    if (f === 0) g.add(box(W + 0.04, 0.08, 0.07, M.trim, 0, y0 + Hf - 0.02, 0.035));
  }
  // corniche et toit mansardé en zinc
  g.add(box(W + 0.3, 0.2, 0.42, M.trim, 0, top + 0.1, 0.01));
  const mansard = box(W + 0.1, 1.15, 0.08, M.zinc, 0, top + 0.72, -0.12);
  mansard.rotation.x = -0.32; g.add(mansard);
  g.add(box(W + 0.1, 0.06, 0.9, M.zinc, 0, top + 1.27, -0.65));
  g.add(box(W + 0.1, 1.1, 0.6, M.zinc, 0, top + 0.75, -0.6));
  WIN_XS.forEach((x) => {
    g.add(box(0.6, 0.72, 0.45, M.trim, x, top + 0.62, -0.02));
    g.add(box(0.36, 0.42, 0.01, M.glass, x, top + 0.6, 0.207));
    const fr = new THREE.Mesh(ringGeometry(0.36, 0.42, 0.03, 0.02), M.frame); fr.position.set(x, top + 0.6, 0.21); g.add(fr);
    const cap = box(0.72, 0.08, 0.55, M.zinc, x, top + 1.01, -0.02); g.add(cap);
  });
  [-2.65, 2.65].forEach((x) => g.add(box(0.5, 0.75, 0.4, M.brick, x, top + 1.65, -0.7)));

  if (opts.cracks) {
    const r = rng(21);
    [[-1.4, 3.2], [1.4, 4.4], [-2.6, 2.0], [0.0, 5.6]].forEach(([cx, cy]) => {
      let x = cx, y = cy;
      for (let i = 0; i < 9; i++) {
        const nx = x + (r() - 0.5) * 0.16, ny = y - 0.07 - r() * 0.05;
        const seg = box(0.014, Math.hypot(nx - x, ny - y) + 0.01, 0.006, M.crack, (x + nx) / 2, (y + ny) / 2, 0.003);
        seg.rotation.z = Math.atan2(nx - x, y - ny);
        seg.castShadow = false;
        g.add(seg);
        x = nx; y = ny;
      }
    });
  }
  return g;
}

/* ────────────────────────────────────────── Vue 0 : toute la maison, avant / après */

const TEINTES_MAISON = {
  '#f2eee6': 'Blanc cassé',
  '#e9dfcb': 'Ton pierre',
  '#e4cfa8': 'Sable',
  '#d9d9d4': 'Gris perle',
  '#dcb886': 'Ocre clair',
  '#e3c4ae': 'Rose ancien'
};
const VOLETS = {
  '#3b3f45': 'Gris anthracite',
  '#6d8299': 'Bleu gris',
  '#8fa58a': 'Vert sauge',
  '#f4f2ee': 'Blanc',
  '#8a5a3b': 'Bois'
};

// Maison R+1 : x = longueur, z = profondeur, pignons en x = ±W/2
const MH = { W: 8, D: 6.5, H: 5.4, pitch: 35 };
MH.Hr = MH.H + (MH.D / 2) * Math.tan(THREE.MathUtils.degToRad(MH.pitch));

function enduitTexture() {
  return canvasTexture(256, 256, (g, w, h) => {
    const img = g.createImageData(w, h);
    const r = rng(4);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = 228 + r() * 27;
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  });
}

// Tuiles mécaniques vues de loin : rangs horizontaux, légères variations de teinte
function roofTexture() {
  return canvasTexture(512, 512, (g, w, h) => {
    const r = rng(12);
    const rows = 22, cols = 30, rh = h / rows, cw = w / cols;
    for (let y = 0; y < rows; y++) {
      for (let x = 0; x < cols; x++) {
        g.fillStyle = `hsl(${14 + r() * 6}, ${46 + r() * 12}%, ${34 + r() * 9}%)`;
        g.fillRect(x * cw, y * rh, cw, rh);
        g.fillStyle = 'rgba(255,255,255,0.08)';
        g.fillRect(x * cw + cw * 0.2, y * rh, cw * 0.35, rh);
      }
      g.fillStyle = 'rgba(0,0,0,0.35)';
      g.fillRect(0, y * rh + rh - 3, w, 3);
    }
  });
}

// Recalcule des UV « une face = toute la texture » pour le triangle des pignons
function gableGeometry() {
  const { W, D, H, Hr } = MH;
  const s = new THREE.Shape();
  s.moveTo(-D / 2, H); s.lineTo(D / 2, H); s.lineTo(0, Hr); s.closePath();
  const geo = new THREE.ExtrudeGeometry(s, { depth: W, bevelEnabled: false });
  geo.rotateY(Math.PI / 2);
  geo.translate(-W / 2, 0, 0);
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) uv.setXY(i, (pos.getZ(i) + D / 2) / D, 0.8 + (0.2 * (pos.getY(i) - H)) / (Hr - H));
  uv.needsUpdate = true;
  return geo;
}

function maisonMaterials(dirty, plane, map, teinte, volet) {
  const clip = { clippingPlanes: [plane] };
  const c = new THREE.Color(teinte);
  return {
    wall: std(dirty ? '#b3a690' : c, { map, roughness: 0.95, ...clip }),
    plinth: std(dirty ? '#5f6a4a' : '#a9a49b', { map: dirty ? map : null, roughness: 0.95, ...clip }),
    trim: std(dirty ? '#a49a88' : '#f1efea', { roughness: 0.8, ...clip }),
    frame: std(dirty ? '#bdb5a6' : '#f7f5f0', { roughness: 0.6, ...clip }),
    glass: std(dirty ? '#2c3136' : '#33414d', { roughness: 0.12, metalness: 0.35, ...clip }),
    shutter: std(dirty ? '#7d877c' : volet, { roughness: dirty ? 0.95 : 0.55, ...clip }),
    crack: std('#3a322b', clip)
  };
}

// Façades, pignons, soubassement, menuiseries et volets (tout ce que le ravalement touche)
function buildMaisonFacades(M, gGeo, dirty) {
  const { W, D, H } = MH;
  const g = new THREE.Group();
  g.add(box(W, H, D, M.wall, 0, H / 2, 0));
  const gable = new THREE.Mesh(gGeo, M.wall);
  gable.castShadow = true; gable.receiveShadow = true;
  g.add(gable);
  g.add(box(W + 0.06, 0.45, D + 0.06, M.plinth, 0, 0.225, 0));
  g.add(box(W + 0.08, 0.1, D + 0.08, M.trim, 0, H / 2 - 0.05, 0)); // bandeau d'étage

  const face = (x, z, ry) => { const f = new THREE.Group(); f.position.set(x, 0, z); f.rotation.y = ry; g.add(f); return f; };
  const win = (f, x, y0, w, h) => {
    f.add(box(w, h, 0.02, M.glass, x, y0 + h / 2, 0.005));
    const fr = new THREE.Mesh(ringGeometry(w + 0.12, h + 0.12, 0.08, 0.06), M.frame);
    fr.position.set(x, y0 + h / 2, 0.02); fr.castShadow = true; f.add(fr);
    f.add(box(0.05, h, 0.04, M.frame, x, y0 + h / 2, 0.02));
    f.add(box(w + 0.3, 0.06, 0.14, M.trim, x, y0 - 0.06, 0.07)); // appui
    [-1, 1].forEach((s) => f.add(box(w / 2 + 0.02, h + 0.06, 0.04, M.shutter, x + s * (w * 0.75 + 0.1), y0 + h / 2, 0.03)));
  };
  const front = face(0, D / 2, 0), back = face(0, -D / 2, Math.PI);
  const right = face(W / 2, 0, Math.PI / 2), left = face(-W / 2, 0, -Math.PI / 2);
  [-2.6, 2.6].forEach((x) => win(front, x, 0.95, 1.0, 1.3));
  [-2.6, 0, 2.6].forEach((x) => win(front, x, 3.55, 0.9, 1.15));
  [-2, 2].forEach((x) => { win(back, x, 0.95, 1.0, 1.3); win(back, x, 3.55, 0.9, 1.15); });
  [right, left].forEach((f) => { win(f, 0, 0.95, 0.9, 1.2); win(f, 0, 3.55, 0.8, 1.1); win(f, 0, H + 0.55, 0.5, 0.7); });
  // porte d'entrée, de la couleur des volets, sous une marquise
  front.add(box(1.0, 2.2, 0.05, M.shutter, 0, 1.1, 0.02));
  const dfr = new THREE.Mesh(ringGeometry(1.14, 2.34, 0.08, 0.06), M.frame);
  dfr.position.set(0, 1.12, 0.03); front.add(dfr);
  front.add(box(1.5, 0.08, 0.6, M.trim, 0, 2.45, 0.3));

  if (dirty) {
    const r = rng(31);
    // fissures typiques : en biais depuis les angles des fenêtres, et une sur le pignon
    [[front, -2.05, 2.3], [front, 3.15, 4.75], [front, 0.5, 3.4], [right, 0.55, 3.5]].forEach(([f, cx, cy]) => {
      let x = cx, y = cy;
      for (let i = 0; i < 10; i++) {
        const nx = x + (r() - 0.35) * 0.14, ny = y - 0.08 - r() * 0.05;
        const seg = box(0.016, Math.hypot(nx - x, ny - y) + 0.01, 0.006, M.crack, (x + nx) / 2, (y + ny) / 2, 0.004);
        seg.rotation.z = Math.atan2(nx - x, y - ny);
        seg.castShadow = false;
        f.add(seg);
        x = nx; y = ny;
      }
    });
  }
  return g;
}

// Toiture, gouttières, cheminée, pelouse : identiques avant et après (non découpés)
function buildMaisonRoof() {
  const { W, D, Hr, pitch } = MH;
  const p = THREE.MathUtils.degToRad(pitch);
  const g = new THREE.Group();
  const L = (D / 2 + 0.5) / Math.cos(p);
  const roofMat = std('#ffffff', { map: roofTexture(), roughness: 0.7 });
  const under = std('#d9cfc2');
  [1, -1].forEach((s) => {
    const slab = new THREE.Mesh(new THREE.BoxGeometry(W + 0.5, 0.14, L), [under, under, roofMat, under, under, under]);
    slab.rotation.x = s * p;
    slab.position.set(0, Hr + 0.12 - (L / 2) * Math.sin(p), s * (L / 2) * Math.cos(p));
    slab.castShadow = true; slab.receiveShadow = true;
    g.add(slab);
    const eaveY = Hr + 0.12 - L * Math.sin(p);
    const gutter = new THREE.Mesh(new THREE.CylinderGeometry(0.075, 0.075, W + 0.5, 14), mat.zinc());
    gutter.rotation.z = Math.PI / 2;
    gutter.position.set(0, eaveY - 0.06, s * (L * Math.cos(p) - 0.02));
    gutter.castShadow = true;
    g.add(gutter);
    [-1, 1].forEach((k) => {
      const pipe = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, eaveY, 10), mat.zinc());
      pipe.position.set(k * (W / 2 - 0.2), eaveY / 2, s * (D / 2 + 0.12));
      pipe.castShadow = true;
      g.add(pipe);
    });
  });
  const ridge = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, W + 0.5, 16, 1, false, 0, Math.PI), std('#9c4429', { roughness: 0.7 }));
  ridge.rotation.z = Math.PI / 2;
  ridge.position.set(0, Hr + 0.13, 0);
  g.add(ridge);
  g.add(box(0.6, 1.6, 0.6, std('#a65a42'), 2.3, Hr + 0.1, -1.0));
  g.add(box(0.72, 0.1, 0.72, std('#8d8a84'), 2.3, Hr + 0.95, -1.0));
  const lawn = new THREE.Mesh(new THREE.CircleGeometry(9.5, 72), std('#8cb866', { roughness: 1 }));
  lawn.rotation.x = -Math.PI / 2; lawn.position.y = 0.003; lawn.receiveShadow = true;
  g.add(lawn);
  g.add(box(1.4, 0.03, 3.6, std('#cfc9be', { roughness: 1 }), 0, 0.015, D / 2 + 1.8)); // allée
  return g;
}

function buildMaison(api, teinte, volet, onChange) {
  const { addLabel, frame, caption, world } = api;
  const { W, D } = MH;
  const pDirty = new THREE.Plane(), pClean = new THREE.Plane();
  const localDirty = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const localClean = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const Md = maisonMaterials(true, pDirty, grimeTexture([-2.6, 0, 2.6], W, false), teinte, volet);
  const Mc = maisonMaterials(false, pClean, enduitTexture(), teinte, volet);
  const gGeo = gableGeometry();

  const group = new THREE.Group();
  group.add(buildMaisonRoof());
  group.add(buildMaisonFacades(Md, gGeo, true));
  group.add(buildMaisonFacades(Mc, gGeo, false));
  const sweep = box(0.04, MH.H + 0.1, D + 0.5, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), 0, (MH.H + 0.1) / 2, 0);
  sweep.castShadow = false;
  group.add(sweep);
  world.add(group);
  frame(group, new THREE.Vector3(0, 3.3, 0), 26, 1.22, 0.42);

  const state = { split: 0.5, anim: null, teinte, volet };
  const tmp = new THREE.Vector3();
  const lAvant = addLabel('Avant', group, tmp, { show: () => state.split > 0.12 });
  const lApres = addLabel('Après', group, tmp, { show: () => state.split < 0.88, cls: 'r3d-label-accent' });
  function planes() {
    const sx = -W / 2 + state.split * W;
    localDirty.constant = sx;
    localClean.constant = -sx;
    group.updateMatrixWorld();
    pDirty.copy(localDirty).applyMatrix4(group.matrixWorld);
    pClean.copy(localClean).applyMatrix4(group.matrixWorld);
    sweep.position.x = sx;
    sweep.visible = state.split > 0.01 && state.split < 0.99;
    lAvant.local.set((-W / 2 + sx) / 2, 2.4, D / 2 + 0.2);
    lApres.local.set((sx + W / 2) / 2, 2.4, D / 2 + 0.2);
  }
  const range = api.root.querySelector('.r3d-ctl[data-for="maison"] [data-r3d="split"]');
  function setSplit(v, fromRange) {
    state.split = clamp01(v);
    if (!fromRange && range) range.value = Math.round(state.split * 100);
    planes();
    caption.textContent = `Maison individuelle : à gauche avant ravalement, à droite après, enduit « ${TEINTES_MAISON[state.teinte]} », volets « ${VOLETS[state.volet]} ». ${Math.round((1 - state.split) * 100)} % des façades ravalées.`;
  }
  setSplit(0.5);

  return {
    group,
    setSplit(v) { state.anim = null; setSplit(v, true); },
    setColor(hex) { state.teinte = hex; Mc.wall.color.set(hex); onChange({ teinte: hex }); setSplit(state.split); },
    setVolet(hex) { state.volet = hex; Mc.shutter.color.set(hex); onChange({ volet: hex }); setSplit(state.split); },
    run() { state.anim = { t: 0 }; setSplit(1); },
    update(dt) {
      planes(); // suit la légère rotation de la scène
      if (!state.anim) return false;
      state.anim.t += dt / (REDUCED ? 0.01 : 4);
      setSplit(1 - easeInOut(clamp01(state.anim.t)));
      if (state.anim.t >= 1) state.anim = null;
      return true;
    }
  };
}

/* ────────────────────────────────────────── Vue 1 : ravalement avant / après */

function buildRavalement(api) {
  const { addLabel, frame, caption, world } = api;
  const W = B.W;
  const pDirty = new THREE.Plane(), pClean = new THREE.Plane();
  const localDirty = new THREE.Plane(new THREE.Vector3(-1, 0, 0), 0);
  const localClean = new THREE.Plane(new THREE.Vector3(1, 0, 0), 0);
  const stone = stoneTexture();
  const Md = materialSet(true, pDirty, grimeTexture(WIN_XS, W));
  const Mc = materialSet(false, pClean, stone, '#e9dfcb');

  const group = new THREE.Group();
  group.add(buildBuilding(Md, { cracks: true }));
  group.add(buildBuilding(Mc));
  const sweep = box(0.035, B.top + 0.4, 0.6, new THREE.MeshStandardMaterial({ color: 0xffffff, transparent: true, opacity: 0.6 }), 0, (B.top + 0.4) / 2, 0.15);
  sweep.castShadow = false;
  group.add(sweep);
  world.add(group);
  frame(group, new THREE.Vector3(0, 4.25, 0), 17.5, 1.45, 0.38);

  const state = { split: 0.5, anim: null, teinte: '#e9dfcb' };
  const tmp = new THREE.Vector3();
  function planes() {
    const sx = -W / 2 + state.split * W;
    localDirty.constant = sx; // garde x ≤ sx (avant)
    localClean.constant = -sx; // garde x ≥ sx (après)
    group.updateMatrixWorld();
    pDirty.copy(localDirty).applyMatrix4(group.matrixWorld);
    pClean.copy(localClean).applyMatrix4(group.matrixWorld);
    sweep.position.x = sx;
    sweep.visible = state.split > 0.01 && state.split < 0.99;
    lAvant.local.set((-W / 2 + sx) / 2, 2.6, 0.3);
    lApres.local.set((sx + W / 2) / 2, 2.6, 0.3);
  }
  const lAvant = addLabel('Avant', group, tmp, { show: () => state.split > 0.12 });
  const lApres = addLabel('Après', group, tmp, { show: () => state.split < 0.88, cls: 'r3d-label-accent' });
  const range = api.root.querySelector('.r3d-ctl[data-for="ravalement"] [data-r3d="split"]');
  function setSplit(v, fromRange) {
    state.split = clamp01(v);
    if (!fromRange && range) range.value = Math.round(state.split * 100);
    planes();
    caption.textContent = `Immeuble de type haussmannien : à gauche avant ravalement, à droite après, teinte « ${TEINTES[state.teinte]} ». ${Math.round((1 - state.split) * 100)} % de la façade ravalée.`;
  }
  setSplit(0.5);

  return {
    group,
    setSplit(v) { state.anim = null; setSplit(v, true); },
    setColor(hex) {
      state.teinte = hex;
      const c = new THREE.Color(hex);
      Mc.wall.color.copy(c);
      Mc.trim.color.copy(c).offsetHSL(0, -0.02, 0.03);
      setSplit(state.split);
    },
    run() { state.anim = { t: 0 }; setSplit(1); },
    update(dt) {
      planes(); // suit la légère rotation de la scène
      if (!state.anim) return false;
      state.anim.t += dt / (REDUCED ? 0.01 : 3.6);
      setSplit(1 - easeInOut(clamp01(state.anim.t)));
      if (state.anim.t >= 1) state.anim = null;
      return true;
    }
  };
}

/* ────────────────────────────────────────── Vue 2 : montage de l'échafaudage */

function buildEchafaudage(api) {
  const { addLabel, frame, caption, world } = api;
  const group = new THREE.Group();
  group.add(buildBuilding(materialSet(true, null, grimeTexture(WIN_XS, B.W)), { cracks: true }));

  const tube = std('#a9b0b6', { roughness: 0.35, metalness: 0.65 });
  const plank = std('#c9a27a', { roughness: 0.8 });
  const toe = std('#ea5b1f', { roughness: 0.6 });
  const xs = [-3.0, -1.0, 1.0, 3.0];
  const zs = [0.42, 1.12];
  const LV = 1.55, NL = 4;
  const items = []; // { mesh, base: Vector3, t0 }
  let t = 0.2;
  const push = (mesh, dt) => { mesh.castShadow = true; mesh.receiveShadow = true; items.push({ mesh, base: mesh.position.clone(), t0: t }); group.add(mesh); t += dt; };
  const vTube = new THREE.CylinderGeometry(0.024, 0.024, LV, 8);
  const hTube = (len) => { const g2 = new THREE.CylinderGeometry(0.02, 0.02, len, 8); g2.rotateZ(Math.PI / 2); return g2; };
  const dTube = (len) => new THREE.CylinderGeometry(0.018, 0.018, len, 8);

  xs.forEach((x) => zs.forEach((z) => push(box(0.16, 0.02, 0.16, tube, x, 0.01, z), 0.02)));
  for (let l = 0; l < NL; l++) {
    const y0 = l * LV, y1 = (l + 1) * LV;
    xs.forEach((x) => zs.forEach((z) => { const m = new THREE.Mesh(vTube, tube); m.position.set(x, y0 + LV / 2, z); push(m, 0.03); }));
    zs.forEach((z) => { for (let i = 0; i < xs.length - 1; i++) { const m = new THREE.Mesh(hTube(2), tube); m.position.set(xs[i] + 1, y1, z); push(m, 0.025); } });
    xs.forEach((x) => { const m = new THREE.Mesh(hTube(0.7), tube); m.rotation.y = Math.PI / 2; m.position.set(x, y1, 0.77); push(m, 0.02); });
    for (let i = 0; i < xs.length - 1; i++) push(box(1.96, 0.045, 0.66, plank, xs[i] + 1, y1 + 0.03, 0.77), 0.05);
    if (l % 2 === 0) for (let i = 0; i < xs.length - 1; i++) {
      const len = Math.hypot(2, LV);
      const m = new THREE.Mesh(dTube(len), tube);
      m.position.set(xs[i] + 1, y0 + LV / 2, zs[1] + 0.03);
      m.rotation.z = (i % 2 ? 1 : -1) * Math.atan2(2, LV);
      push(m, 0.03);
    }
    [0.5, 1.0].forEach((hh) => { for (let i = 0; i < xs.length - 1; i++) { const m = new THREE.Mesh(hTube(2), tube); m.position.set(xs[i] + 1, y1 + hh, zs[1] + 0.03); push(m, 0.02); } });
    for (let i = 0; i < xs.length - 1; i++) push(box(1.96, 0.15, 0.02, toe, xs[i] + 1, y1 + 0.13, zs[1] - 0.02), 0.025);
    t += 0.15;
  }
  // garde-corps du dernier niveau et ancrages
  xs.forEach((x) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 1.1, 8), tube); m.position.set(x, NL * LV + 0.55, zs[1]); push(m, 0.02); });
  for (let l = 1; l < NL; l += 1) [-2, 2].forEach((x) => { const m = new THREE.Mesh(hTube(0.42), tube); m.rotation.y = Math.PI / 2; m.position.set(x, l * LV + 0.6, 0.21); push(m, 0.02); });

  const netMat = new THREE.MeshStandardMaterial({ map: meshTexture('#ffffff', 16, 0.9), color: 0xe9efe9, transparent: true, opacity: 0, side: THREE.DoubleSide, depthWrite: false });
  netMat.map.repeat.set(10, 12);
  const net = new THREE.Mesh(new THREE.PlaneGeometry(6.1, NL * LV + 1.1), netMat);
  net.position.set(0, (NL * LV + 1.1) / 2, zs[1] + 0.06);
  group.add(net);
  const tEnd = t;
  const tNet = tEnd + 0.3;
  const total = tNet + 1.2;

  world.add(group);
  frame(group, new THREE.Vector3(0, 4.2, 0.4), 19.5, 1.4, 0.55);

  addLabel('Montants', group, new THREE.Vector3(xs[3], 0.9, zs[1]));
  addLabel('Planchers', group, new THREE.Vector3(-1.6, LV + 0.05, 0.9), { show: () => state.t > 2 });
  addLabel('Garde-corps', group, new THREE.Vector3(0, 2 * LV + 1.0, zs[1]), { show: () => state.t > tEnd * 0.5 });
  addLabel('Plinthes', group, new THREE.Vector3(1.4, 3 * LV + 0.15, zs[1]), { show: () => state.t > tEnd * 0.75 });
  addLabel('Filet de protection', group, new THREE.Vector3(-1.8, NL * LV + 0.6, zs[1] + 0.1), { show: () => state.t > tNet + 0.4, cls: 'r3d-label-accent' });

  const state = { t: REDUCED ? total : 0 };
  let lastShown = -1, done = false;
  function apply() {
    let placed = 0;
    items.forEach((it) => {
      const p = clamp01((state.t - it.t0) / 0.35);
      it.mesh.visible = p > 0;
      if (p <= 0) return;
      placed++;
      const e = easeOut(p);
      it.mesh.position.set(it.base.x, it.base.y + (1 - e) * 0.6, it.base.z + (1 - e) * 0.4);
      it.mesh.scale.setScalar(0.7 + 0.3 * e);
    });
    netMat.opacity = 0.55 * clamp01((state.t - tNet) / 0.9);
    net.visible = netMat.opacity > 0.01;
    if (placed !== lastShown) {
      lastShown = placed;
      caption.textContent = `Échafaudage de façade monté niveau par niveau : ${fmt(placed)} élément${placed > 1 ? 's' : ''} posé${placed > 1 ? 's' : ''}${placed === items.length ? ', filet de protection en place.' : '…'}`;
    }
  }
  apply();
  return {
    group,
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

/* ────────────────────────────────────────── Vue 3 : isolation par l'extérieur (écorché) */

function buildIte(api) {
  const { addLabel, frame, caption, world } = api;
  const W = 3.2, H = 2.5;
  const group = new THREE.Group();
  const layers = [];
  // chaque couche est plus courte que la précédente : toutes restent visibles (écorché)
  const span = (i) => { const x1 = W / 2 - i * 0.42; return { x0: -W / 2, x1, w: x1 + W / 2, cx: (-W / 2 + x1) / 2 }; };
  const add = (name, objs, dz, labelAt, cls) => {
    const g = new THREE.Group();
    objs.forEach((o) => { o.castShadow = true; o.receiveShadow = true; g.add(o); });
    g.userData.dz = dz;
    group.add(g);
    layers.push(g);
    addLabel(name, g, labelAt, cls ? { cls } : {});
  };

  const blocks = blockTexture(); blocks.wrapS = blocks.wrapT = THREE.RepeatWrapping; blocks.repeat.set(2.2, 3.4);
  let s = span(0);
  add('Mur existant', [box(W, H, 0.22, std('#ffffff', { map: blocks }), 0, H / 2, -0.11)], 0, new THREE.Vector3(W / 2 - 0.25, 0.35, 0.01));

  s = span(1);
  const glue = std('#c9c6bf', { roughness: 1 });
  const dabs = [];
  for (let y = 0.3; y < H - 0.1; y += 0.4) for (let x = s.x0 + 0.25; x < s.x1 - 0.1; x += 0.4) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), glue);
    d.rotation.x = Math.PI / 2; d.position.set(x, y, 0.01); dabs.push(d);
  }
  dabs.push(box(s.w, 0.04, 0.02, glue, s.cx, H - 0.03, 0.01), box(s.w, 0.04, 0.02, glue, s.cx, 0.12, 0.01));
  add('Mortier-colle', dabs, 0.45, new THREE.Vector3(s.x1 - 0.2, H - 0.25, 0.02));

  s = span(2);
  const ins = std('#f3f1ea', { roughness: 0.95 });
  const panels = [];
  for (let row = 0, y = 0.1; y < H - 0.01; row++, y += 0.6) {
    for (let x = s.x0 - (row % 2) * 0.6; x < s.x1 - 0.01; x += 1.2) {
      const a = Math.max(x, s.x0), b = Math.min(x + 1.2, s.x1), hh = Math.min(0.6, H - y);
      if (b - a > 0.02) panels.push(box(b - a - 0.008, hh - 0.008, 0.14, ins, (a + b) / 2, y + hh / 2, 0.09));
    }
  }
  panels.push(box(s.w, 0.03, 0.17, std('#b9c0c6', { metalness: 0.6, roughness: 0.35 }), s.cx, 0.085, 0.085));
  add('Isolant + rail de départ', panels, 0.95, new THREE.Vector3(s.x1 - 0.35, 1.0, 0.16), 'r3d-label-accent');

  s = span(3);
  const dowel = std('#ffffff', { roughness: 0.6 });
  const dowels = [];
  for (let y = 0.4; y < H - 0.1; y += 0.6) for (let x = s.x0 + 0.3; x < s.x1 - 0.1; x += 0.6) {
    const head = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 16), dowel);
    head.rotation.x = Math.PI / 2; head.position.set(x, y, 0.166); dowels.push(head);
  }
  add('Chevilles', dowels, 1.35, new THREE.Vector3(s.x0 + 0.9, 1.6, 0.17));

  s = span(4);
  const meshT = meshTexture('#4f86c6', 24, 0.85); meshT.repeat.set(s.w * 2.2, H * 2.2);
  add('Sous-enduit armé (treillis)', [
    box(s.w, H, 0.006, std('#e6e2da', { transparent: true, opacity: 0.55 }), s.cx, H / 2, 0.172),
    box(s.w, H, 0.002, new THREE.MeshStandardMaterial({ map: meshT, transparent: true, depthWrite: false }), s.cx, H / 2, 0.177)
  ], 1.8, new THREE.Vector3(s.x1 - 0.3, 2.0, 0.18));

  s = span(5);
  add('Enduit de finition', [box(s.w, H, 0.01, std('#e4cfa8', { roughness: 0.95 }), s.cx, H / 2, 0.185)], 2.3, new THREE.Vector3(s.cx, 2.25, 0.19), 'r3d-label-accent');

  world.add(group);
  frame(group, new THREE.Vector3(0, 1.3, 0.6), 9.4, 1.3, 0.85);

  const state = { k: REDUCED ? 1 : 0, target: 1 };
  function apply() { const e = easeInOut(state.k); layers.forEach((g) => { g.position.z = g.userData.dz * e * 0.6; }); }
  apply();
  caption.textContent = "Isolation thermique par l'extérieur en écorché : mur, mortier-colle, isolant, chevilles, sous-enduit armé, enduit de finition.";
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

/* ────────────────────────────────────────── Vue 4 : traitement d'une fissure, étape par étape */

const ETAPES = [
  ['Diagnostic', 'Étape 1/5 – Diagnostic : on mesure la fissure et on vérifie si elle est stable ou active.'],
  ['Ouverture en V', 'Étape 2/5 – Ouverture : la fissure est élargie en V pour que le produit de réparation accroche.'],
  ['Rebouchage', 'Étape 3/5 – Rebouchage : mortier ou mastic de réparation adapté au support.'],
  ['Armature', 'Étape 4/5 – Armature : une bande de treillis en fibre de verre ponte la fissure.'],
  ['Finition', 'Étape 5/5 – Finition : enduit ou peinture de façade sur tout le pan, la fissure disparaît.']
];

function buildFissures(api) {
  const { addLabel, frame, caption, world, root } = api;
  const W = 3.4, H = 2.6;
  const group = new THREE.Group();
  group.add(box(W, H, 0.25, std('#c8bfb1', { map: grimeTexture([], W), roughness: 0.95 }), 0, H / 2, -0.125));

  const r = rng(17);
  const pts = [new THREE.Vector2(-0.35, H - 0.15)];
  while (pts[pts.length - 1].y > 0.25) {
    const p = pts[pts.length - 1];
    pts.push(new THREE.Vector2(clamp01((p.x + (r() - 0.45) * 0.22 + 1.5) / 3) * 3 - 1.5, p.y - 0.12 - r() * 0.08));
  }
  const fade = (c) => std(c, { transparent: true, opacity: 0 });
  const mCrack = fade('#2c2520'), mGroove = fade('#5a5148'), mFill = fade('#d9d2c4');
  const segGroup = (m, wdt, z) => {
    const g = new THREE.Group();
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const s = box(wdt, a.distanceTo(b) + wdt * 0.6, 0.008, m, (a.x + b.x) / 2, (a.y + b.y) / 2, z);
      s.rotation.z = Math.atan2(b.x - a.x, a.y - b.y);
      s.castShadow = false;
      g.add(s);
    }
    group.add(g);
    return g;
  };
  segGroup(mCrack, 0.014, 0.004);
  segGroup(mGroove, 0.055, 0.006);
  segGroup(mFill, 0.06, 0.008);
  const xs = pts.map((p) => p.x);
  const bx0 = Math.min(...xs) - 0.18, bx1 = Math.max(...xs) + 0.18;
  const tMesh = meshTexture('#3f7fd0', 22, 0.95); tMesh.repeat.set((bx1 - bx0) * 3, H * 3);
  const mMesh = new THREE.MeshStandardMaterial({ map: tMesh, transparent: true, opacity: 0, depthWrite: false });
  const band = box(bx1 - bx0, H - 0.2, 0.004, mMesh, (bx0 + bx1) / 2, H / 2, 0.012); band.castShadow = false; group.add(band);
  const mFinish = fade('#ece4d4');
  const finish = box(W + 0.002, H + 0.002, 0.252, mFinish, 0, H / 2, -0.11); finish.castShadow = false; group.add(finish);

  // opacité cible de chaque élément selon l'étape
  const targets = [
    [mCrack, [1, 0, 0, 0, 0]],
    [mGroove, [0, 1, 0, 0, 0]],
    [mFill, [0, 0, 1, 1, 0]],
    [mMesh, [0, 0, 0, 0.9, 0]],
    [mFinish, [0, 0, 0, 0, 1]]
  ];
  const label = addLabel(ETAPES[0][0], group, new THREE.Vector3(pts[3].x + 0.25, pts[3].y, 0.05), { cls: 'r3d-label-accent' });
  world.add(group);
  frame(group, new THREE.Vector3(0, 1.3, 0), 7, 1.4, 0.3);

  const btn = root.querySelector('.r3d-ctl[data-for="fissures"] [data-r3d="step"]');
  const state = { step: 0 };
  function setStep(i) {
    state.step = i;
    label.el.textContent = ETAPES[i][0];
    caption.textContent = ETAPES[i][1];
    if (btn) btn.textContent = i === ETAPES.length - 1 ? '↻ Recommencer' : 'Étape suivante →';
    root.querySelectorAll('.r3d-steps i').forEach((d, k) => d.classList.toggle('on', k <= i));
  }
  setStep(0);
  if (REDUCED) targets.forEach(([m, t]) => { m.opacity = t[0]; });
  return {
    group,
    step() { setStep((state.step + 1) % ETAPES.length); },
    update(dt) {
      let moving = false;
      targets.forEach(([m, t]) => {
        const goal = t[state.step];
        if (Math.abs(m.opacity - goal) > 0.001) {
          moving = true;
          m.opacity += Math.sign(goal - m.opacity) * Math.min(Math.abs(goal - m.opacity), dt / (REDUCED ? 0.01 : 0.6));
        }
      });
      return moving;
    }
  };
}

export function init(root) {
  const choix = { teinte: '#f2eee6', volet: '#3b3f45' };
  let scene = null;
  createViewer(root, {
    initial: root.dataset.mode || 'maison',
    builders: {
      maison: (api) => (scene = buildMaison(api, choix.teinte, choix.volet, (c) => Object.assign(choix, c))),
      ravalement: buildRavalement, echafaudage: buildEchafaudage, ite: buildIte, fissures: buildFissures
    },
    info: (m) => MODES[m],
    onButton(b, api) {
      if (!b.dataset.r3dVolet) return false;
      if (api.mode === 'maison' && scene) scene.setVolet(b.dataset.r3dVolet);
      b.parentElement.querySelectorAll('[data-r3d-volet]').forEach((s) => s.setAttribute('aria-pressed', String(s === b)));
      return true;
    }
  });
}
