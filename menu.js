// Cohesif BTP — menu mobile : bouton « Menu » dans l'en-tête et panneau avec toutes les pages
(function () {
  var inner = document.querySelector('header .header-inner');
  if (!inner) return;

  var page = location.pathname.split('/').pop() || 'index.html';
  var onHome = page === 'index.html';
  var devis = document.getElementById('devis') ? '#devis' : 'index.html#devis';
  var home = function (hash) { return (onHome ? '' : 'index.html') + hash; };

  var groupes = [
    ['Travaux', [
      ['toiture-couverture.html', 'Toiture & couverture', 'Tuiles, réfection, fuites, isolation'],
      ['facade-ravalement.html', 'Façade & ravalement', 'Ravalement, enduits, isolation extérieure'],
      ['aides-financement.html', 'Aides & financement', 'Simulez MaPrimeRénov\', CEE, TVA 5,5 %', true],
      ['guides.html', 'Guides & conseils', 'Prix au m², démarches, ravalement obligatoire'],
      [home('#services'), 'Tous nos services', 'Gros œuvre, rénovation, désamiantage…']
    ]],
    ['Boutique', [
      ['boutique.html', 'Chariots élévateurs', 'Électriques, 1 à 5 tonnes'],
      ['boutique-mini-pelles.html', 'Mini-pelles Kubota', '2 à 3 tonnes, poids réel garanti'],
      ['boutique-plaque-platre-ba13.html', 'Plaques de plâtre BA13', 'Calcul de quantité en ligne'],
      ['boutique-laine-de-roche.html', 'Laine de roche', 'Panneaux, 40 à 120 kg/m³']
    ]],
    ['Cohesif BTP', [
      ['index.html', 'Accueil', ''],
      [home('#pourquoi'), 'Pourquoi nous choisir', ''],
      [home('#packs'), 'Nos offres', '']
    ]]
  ];

  var esc = function (s) { return s.replace(/&/g, '&amp;').replace(/</g, '&lt;'); };
  var html = groupes.map(function (g) {
    return '<div class="mm-group"><p class="mm-title">' + g[0] + '</p>' + g[1].map(function (l) {
      var current = l[0] === page ? ' aria-current="page"' : '';
      return '<a class="mm-link" href="' + l[0] + '"' + current + '><span>' + esc(l[1]) +
        (l[3] ? '<span class="mm-new">Nouveau</span>' : '') + (l[2] ? '<small>' + esc(l[2]) + '</small>' : '') + '</span></a>';
    }).join('') + '</div>';
  }).join('');
  html += '<div class="mm-actions">' +
    '<a class="mm-devis" href="' + devis + '">Demander un devis gratuit →</a>' +
    '<a class="mm-tel" href="tel:+33756855727">Appeler le 07 56 85 57 27</a>' +
    '<a class="mm-wa" href="https://wa.me/33756855727" target="_blank" rel="noopener">Écrire sur WhatsApp</a></div>';

  var panel = document.createElement('nav');
  panel.className = 'mm-panel';
  panel.id = 'mm-panel';
  panel.setAttribute('aria-label', 'Menu');
  panel.innerHTML = html;
  document.body.appendChild(panel);

  var btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'mm-btn';
  btn.setAttribute('aria-expanded', 'false');
  btn.setAttribute('aria-controls', 'mm-panel');
  btn.innerHTML = '<i aria-hidden="true"></i><span>Menu</span>';
  inner.appendChild(btn);

  var root = document.documentElement;
  function toggle(open) {
    if (open) {
      var h = document.querySelector('header');
      root.style.setProperty('--mm-top', Math.max(0, h.getBoundingClientRect().bottom) + 'px');
    }
    root.classList.toggle('mm-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.querySelector('span').textContent = open ? 'Fermer' : 'Menu';
  }
  btn.addEventListener('click', function () { toggle(!root.classList.contains('mm-open')); });
  // Un lien vers une ancre de la même page ferme le menu
  panel.addEventListener('click', function (e) { if (e.target.closest('a')) toggle(false); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') toggle(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 768) toggle(false); });
})();
