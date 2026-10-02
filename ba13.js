// Boutique Cohesif BTP · calculateur de plaques BA13 et chargement de la 3D
(function () {
  var M2_PLAQUE = 3;   // 1,2 × 2,5 m
  var KG_PLAQUE = 26;  // poids indicatif
  var calc = document.getElementById('calcul');
  if (!calc) return;
  var prixHT = parseFloat((calc.getAttribute('data-prix-ht') || '').replace(',', '.')) || 0;
  var $ = function (id) { return document.getElementById(id); };
  var m2 = $('ba-m2'), L = $('ba-l'), H = $('ba-h'), peau = $('ba-peau'), chute = $('ba-chute');
  var seg = calc.querySelectorAll('.ba-seg button');
  var faces = 2, ouvrage = 'Cloison';
  var nf = function (n, d) { return n.toLocaleString('fr-FR', { maximumFractionDigits: d || 0 }); };
  var num = function (el) { return parseFloat(String(el.value).replace(',', '.')) || 0; };
  var lastN = 0, timer = null;

  function compute() {
    var surfaceMur = Math.max(0, num(m2));
    var surfacePose = surfaceMur * faces * Number(peau.value);
    var n = Math.ceil((surfacePose * (1 + Number(chute.value))) / M2_PLAQUE - 1e-9);
    $('ba-n').textContent = n ? nf(n) : '0';
    $('ba-surf').textContent = nf(surfacePose, 1) + ' m² (' + nf(n * M2_PLAQUE) + ' m² livrés)';
    var kg = n * KG_PLAQUE;
    $('ba-poids').textContent = kg >= 1000 ? '≈ ' + nf(kg / 1000, 1) + ' t' : '≈ ' + nf(kg) + ' kg';
    $('ba-vis').textContent = '≈ ' + nf(Math.ceil(surfacePose * 15 / 100) * 100) + ' vis';
    $('ba-bande').textContent = '≈ ' + nf(Math.ceil(surfacePose * 1.3)) + ' m';
    $('ba-enduit').textContent = '≈ ' + nf(Math.ceil(surfacePose * 0.35)) + ' kg';
    var row = calc.querySelector('.ba-prix-row');
    if (prixHT > 0) {
      row.hidden = false;
      $('ba-prix').textContent = nf(n * prixHT, 2) + ' € HT';
      $('ba-note').textContent = 'Prix unitaire ' + nf(prixHT, 2) + ' € HT, hors livraison. Tarif dégressif selon le volume.';
    }
    $('ba-cta').textContent = n ? 'Recevoir le prix pour ' + nf(n) + ' plaque' + (n > 1 ? 's' : '') + ' →' : 'Recevoir un prix →';
    var sticky = $('ba-sticky');
    if (sticky && n) sticky.textContent = nf(n) + ' plaques pour ' + nf(surfaceMur, 1) + ' m²';
    var qte = $('ba-qte');
    if (qte) qte.value = n || '';
    var resume = $('ba-calcul');
    if (resume) resume.value = ouvrage + ' · ' + nf(surfaceMur, 1) + ' m² · ' + (peau.value === '2' ? 'double' : 'simple') + ' parement · chutes ' + Math.round(Number(chute.value) * 100) + ' % → ' + nf(n) + ' plaques BA13';
    if (n !== lastN) {
      lastN = n;
      clearTimeout(timer);
      timer = setTimeout(function () { window.dispatchEvent(new CustomEvent('ba13:count', { detail: Math.max(1, n) })); }, 250);
      var r3d = $('r3d');
      if (r3d) r3d.setAttribute('data-count', String(Math.max(1, n)));
    }
  }

  function fromLxH() {
    var l = num(L), h = num(H);
    if (l > 0 && h > 0) { m2.value = Math.round(l * h * 100) / 100; compute(); }
  }
  [m2, peau, chute].forEach(function (el) { el.addEventListener('input', compute); el.addEventListener('change', compute); });
  [L, H].forEach(function (el) { el.addEventListener('input', fromLxH); });
  seg.forEach(function (b) {
    b.addEventListener('click', function () {
      seg.forEach(function (x) { x.setAttribute('aria-checked', String(x === b)); });
      faces = Number(b.getAttribute('data-faces'));
      ouvrage = b.textContent.replace(/\d.*$/, '').trim();
      compute();
    });
  });
  compute();

  // 3D : chargée seulement quand elle approche de l'écran
  var el = $('r3d');
  if (!el) return;
  var go = function () {
    import('./ba13-3d.js').then(function (m) { m.init(el); }).catch(function () { el.classList.add('r3d-fail'); });
  };
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (e) { if (e[0].isIntersecting) { io.disconnect(); go(); } }, { rootMargin: '600px 0px' });
    io.observe(el);
  } else go();
})();
