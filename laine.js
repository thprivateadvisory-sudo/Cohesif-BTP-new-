// Boutique Cohesif BTP · laine de roche : galerie, vidéo, choix de densité et calculateur de panneaux
(function () {
  var M2_PANNEAU = 0.72;   // 1,2 × 0,6 m
  var M3_PANNEAU = 0.036;  // 0,72 m² × 50 mm
  var $ = function (id) { return document.getElementById(id); };
  var nf = function (n, d) { return n.toLocaleString('fr-FR', { maximumFractionDigits: d || 0 }); };
  var num = function (el) { return parseFloat(String(el.value).replace(',', '.')) || 0; };
  var reduit = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Galerie : photos et vidéo dans le grand visuel
  var mainImg = $('lr-main-img'), mainVid = $('lr-main-video'), mainTag = $('lr-main-tag');
  var thumbs = document.querySelectorAll('.lr-gal-thumbs button');
  thumbs.forEach(function (b) {
    b.addEventListener('click', function () {
      thumbs.forEach(function (x) { x.classList.toggle('is-on', x === b); });
      mainTag.textContent = b.getAttribute('data-tag');
      if (b.hasAttribute('data-video')) {
        mainImg.hidden = true;
        mainVid.hidden = false;
        mainVid.controls = true;
        var p = mainVid.play();
        if (p && p.catch) p.catch(function () {});
      } else {
        mainVid.pause();
        mainVid.hidden = true;
        mainImg.hidden = false;
        mainImg.src = b.getAttribute('data-src');
        mainImg.alt = b.getAttribute('data-alt');
      }
    });
  });

  // Vidéo de la section : lecture automatique (muette) quand elle est visible
  var vid = $('lr-video'), btn = $('lr-video-btn');
  if (vid) {
    var parUtilisateur = false;
    var etat = function () {
      var pause = vid.paused;
      btn.classList.toggle('is-paused', pause);
      btn.setAttribute('aria-label', pause ? 'Lire la vidéo' : 'Mettre la vidéo en pause');
      btn.innerHTML = pause ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14M16 5v14"/></svg>';
    };
    var lire = function () { var p = vid.play(); if (p && p.catch) p.catch(function () {}); };
    vid.addEventListener('play', etat);
    vid.addEventListener('pause', etat);
    btn.addEventListener('click', function () {
      parUtilisateur = !vid.paused;
      if (vid.paused) lire(); else vid.pause();
    });
    etat();
    if (!reduit && 'IntersectionObserver' in window) {
      new IntersectionObserver(function (e) {
        if (e[0].isIntersecting) { if (!parUtilisateur) lire(); } else if (!vid.paused) vid.pause();
      }, { threshold: 0.35 }).observe(vid);
    }
  }

  // Calculateur
  var calc = $('calcul');
  if (!calc) return;
  var m2 = $('lr-m2'), L = $('lr-l'), H = $('lr-h'), couches = $('lr-couches'), chute = $('lr-chute');
  var seg = calc.querySelectorAll('.lr-seg button');
  var fDens = $('lr-f-dens');
  var cards = document.querySelectorAll('.lr-dcard');
  var dens = 80, prixHT = 0;
  var r3d = $('r3d'), timer3d = null;

  function compute() {
    var surface = Math.max(0, num(m2));
    var nc = Number(couches.value);
    var n = Math.ceil((surface * nc * (1 + Number(chute.value))) / M2_PANNEAU - 1e-9);
    var pl = n > 1 ? 'panneaux' : 'panneau';
    $('lr-n').textContent = nf(n);
    $('lr-n-lbl').textContent = pl + ' · ' + dens + ' kg/m³';
    $('lr-surf').textContent = nf(n * M2_PANNEAU, 1) + ' m²';
    $('lr-vol').textContent = nf(n * M3_PANNEAU, 2) + ' m³';
    var kg = n * M3_PANNEAU * dens;
    $('lr-poids').textContent = kg >= 1000 ? '≈ ' + nf(kg / 1000, 1) + ' t' : '≈ ' + nf(kg) + ' kg';
    var row = calc.querySelector('.ba-prix-row');
    row.hidden = !(prixHT > 0);
    if (prixHT > 0) {
      $('lr-prix').textContent = nf(n * prixHT, 2) + ' € HT';
      $('lr-note').textContent = 'Prix unitaire ' + nf(prixHT, 2) + ' € HT le panneau, hors livraison. Tarif dégressif selon le volume.';
    } else {
      $('lr-note').textContent = 'Prix sur devis, dégressif selon le volume. Réponse sous 48 h.';
    }
    $('lr-cta').textContent = n ? 'Recevoir le prix pour ' + nf(n) + ' ' + pl + ' →' : 'Recevoir un prix →';
    var sticky = $('lr-sticky');
    if (sticky) sticky.textContent = n ? nf(n) + ' ' + pl + ' ' + dens + ' kg/m³ pour ' + nf(surface, 1) + ' m²' : '1 200 × 600 × 50 mm · prix sur devis';
    var qte = $('lr-qte');
    if (qte) qte.value = n || '';
    var resume = $('lr-calcul');
    if (resume) resume.value = nf(surface, 1) + ' m² · ' + dens + ' kg/m³ · ' + (nc * 50) + ' mm (' + nc + ' couche' + (nc > 1 ? 's' : '') + ') · chutes ' + Math.round(Number(chute.value) * 100) + ' % → ' + nf(n) + ' ' + pl;
    // maquette 3D : elle lit ces valeurs à son chargement, puis suit l'évènement
    if (r3d) { r3d.setAttribute('data-count', Math.max(1, n)); r3d.setAttribute('data-dens', dens); }
    clearTimeout(timer3d);
    timer3d = setTimeout(function () { window.dispatchEvent(new CustomEvent('laine:calc', { detail: { n: Math.max(1, n), dens: dens } })); }, 250);
  }

  function choisir(d) {
    var b = calc.querySelector('.lr-seg button[data-dens="' + d + '"]');
    if (!b) return;
    dens = Number(d);
    prixHT = parseFloat((b.getAttribute('data-prix-ht') || '').replace(',', '.')) || 0;
    seg.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
    $('lr-dens-hint').textContent = b.getAttribute('data-usage');
    cards.forEach(function (c) { c.classList.toggle('is-sel', c.getAttribute('data-dens') === String(d)); });
    if (fDens) fDens.value = d + ' kg/m³';
    compute();
  }

  function fromLxH() {
    var l = num(L), h = num(H);
    if (l > 0 && h > 0) { m2.value = Math.round(l * h * 100) / 100; compute(); }
  }
  [m2, couches, chute].forEach(function (el) { el.addEventListener('input', compute); el.addEventListener('change', compute); });
  [L, H].forEach(function (el) { el.addEventListener('input', fromLxH); });
  seg.forEach(function (b) { b.addEventListener('click', function () { choisir(b.getAttribute('data-dens')); }); });
  document.querySelectorAll('[data-pick]').forEach(function (b) {
    b.addEventListener('click', function () {
      choisir(b.getAttribute('data-pick'));
      calc.scrollIntoView({ behavior: reduit ? 'auto' : 'smooth', block: 'start' });
    });
  });
  if (fDens) fDens.addEventListener('change', function () {
    var d = parseInt(fDens.value, 10);
    if (d) choisir(d);
  });
  choisir(80);

  // Densité choisie dans la maquette 3D
  window.addEventListener('laine:pick', function (e) { if (Number(e.detail) !== dens) choisir(e.detail); });

  // 3D : chargée seulement quand elle approche de l'écran
  if (!r3d) return;
  var go = function () {
    import('./laine-3d.js?v=20261003').then(function (m) { m.init(r3d); }).catch(function (e) { r3d.classList.add('r3d-fail'); var d = r3d.querySelector('.r3d-err'); if (d) d.textContent = 'Détail : ' + ((e && e.message) || e); });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '600px 0px' });
    io.observe(r3d);
  } else go();
})();
