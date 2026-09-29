/* Boutique Cohesif BTP : menu, filtres, aide au choix, configuration, formulaire */
(function () {
  'use strict';

  // Menu mobile
  var burger = document.getElementById('bqBurger');
  var menu = document.getElementById('bqMenu');
  if (burger && menu) {
    burger.addEventListener('click', function () {
      var open = menu.classList.toggle('open');
      burger.setAttribute('aria-expanded', open ? 'true' : 'false');
      document.body.style.overflow = open ? 'hidden' : '';
    });
    menu.addEventListener('click', function (e) {
      if (e.target.closest('a')) {
        menu.classList.remove('open');
        burger.setAttribute('aria-expanded', 'false');
        document.body.style.overflow = '';
      }
    });
  }

  // Filtres du catalogue
  var filters = document.querySelectorAll('.bq-filter');
  var cards = document.querySelectorAll('#bqGrid .bq-card');
  filters.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var f = btn.getAttribute('data-f');
      filters.forEach(function (b) { b.classList.toggle('is-on', b === btn); });
      cards.forEach(function (c) { c.hidden = !(f === 'tout' || c.getAttribute('data-gamme') === f); });
    });
  });

  // Formulaire : présélections
  var form = document.querySelector('[data-bq-form]');
  var champ = function (name) { return form && form.querySelector('[name="' + name + '"]'); };
  var choisirModele = function (slug) {
    var sel = champ('modele');
    if (!sel || !slug) return;
    var opt = sel.querySelector('option[data-slug="' + slug + '"]');
    if (opt) sel.value = opt.value;
  };
  var choisirOption = function (name, val) {
    var sel = champ(name);
    if (!sel) return;
    for (var i = 0; i < sel.options.length; i++) {
      if (sel.options[i].value === val || sel.options[i].text === val) { sel.selectedIndex = i; return; }
    }
  };

  // Aide au choix selon le poids
  var choose = document.querySelector('[data-choose]');
  var dataEl = document.getElementById('bqData');
  if (choose && dataEl) {
    var modeles = JSON.parse(dataEl.textContent).sort(function (a, b) { return a.cap - b.cap; });
    var input = choose.querySelector('[data-choose-in]');
    var out = choose.querySelector('[data-choose-out]');
    var q = function (s) { return choose.querySelector(s); };
    var fmtKg = function (n) { return n >= 1000 ? (n / 1000).toLocaleString('fr-FR') + ' t' : n + ' kg'; };
    var maj = function () {
      var poids = parseInt(input.value, 10);
      out.textContent = poids.toLocaleString('fr-FR') + ' kg';
      // marge de sécurité de 10 %
      var besoin = poids * 1.1;
      var m = modeles.filter(function (x) { return x.cap >= besoin; })[0];
      var surCommande = !m;
      if (surCommande) m = modeles[modeles.length - 1];
      q('[data-r-img]').src = m.img;
      q('[data-r-img]').alt = m.nom;
      q('[data-r-link]').hidden = surCommande;
      if (surCommande) {
        q('[data-r-cat]').textContent = 'Sur commande';
        q('[data-r-nom]').textContent = 'Chariot élévateur de 7 ou 10 tonnes';
        q('[data-r-info]').textContent = 'Pour vos charges les plus lourdes, nous proposons des modèles électriques de 7 et 10 t sur commande. Demandez votre devis.';
        q('[data-r-devis]').removeAttribute('data-modele');
        return;
      }
      q('[data-r-cat]').textContent = 'Recommandé · Réf. ' + m.ref;
      q('[data-r-nom]').textContent = m.nom;
      q('[data-r-info]').textContent = 'Capacité ' + fmtKg(m.cap) + ' · ' + m.tension + ' · largeur ' +
        m.larg.toLocaleString('fr-FR') + ' mm · CACES ' + m.caces + '.';
      q('[data-r-link]').href = m.slug + '.html';
      q('[data-r-devis]').setAttribute('data-modele', m.slug);
    };
    input.addEventListener('input', maj);
    maj();
  }

  // Configuration sur la fiche produit
  var cfg = document.querySelector('[data-cfg-box]');
  var choix = { batterie: 'Plomb-acide', couleur: 'Standard' };
  var waBtn = document.querySelector('[data-cfg-wa]');
  var majWa = function () {
    if (!cfg || !waBtn) return;
    var txt = 'Bonjour, je souhaite un devis pour le ' + cfg.getAttribute('data-nom') + ' (' + cfg.getAttribute('data-ref') +
      '), batterie ' + choix.batterie.toLowerCase() + ', couleur : ' + choix.couleur.toLowerCase() + '.';
    waBtn.href = waBtn.href.split('?')[0] + '?text=' + encodeURIComponent(txt);
  };
  var appliquer = function () {
    if (!cfg) return;
    choisirOption('batterie', choix.batterie);
    choisirOption('couleur', choix.couleur);
  };
  if (cfg) {
    cfg.addEventListener('click', function (e) {
      var b = e.target.closest('[data-cfg]');
      if (!b) return;
      var k = b.getAttribute('data-cfg');
      choix[k] = b.getAttribute('data-val');
      cfg.querySelectorAll('[data-cfg="' + k + '"]').forEach(function (x) {
        var on = x === b;
        x.classList.toggle('is-on', on);
        x.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (k === 'couleur') cfg.querySelector('[data-cfg-coul]').textContent = choix.couleur;
      majWa();
      appliquer();
    });
    majWa();
  }

  // Mini-pelles : livraison selon le département, total et acompte
  var resa = document.querySelector('[data-resa]');
  if (resa) {
    var R = JSON.parse(resa.querySelector('[data-resa-data]').textContent);
    var r = function (s) { return resa.querySelector(s); };
    var eur = function (n) {
      return n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 }) + ' €';
    };
    var btn = r('[data-resa-btn]');
    var depSel = r('[data-resa-dep]');
    var majResa = function () {
      var dep = depSel.value;
      var zone = null;
      R.zones.forEach(function (z) { if (z.deps.indexOf(dep) !== -1) zone = z; });
      var depTxt = dep ? depSel.options[depSel.selectedIndex].text : '';
      r('[data-resa-calc]').hidden = !zone;
      r('[data-resa-devis]').hidden = !dep || !!zone;
      if (zone) {
        var tot = R.prix + zone.prix;
        r('[data-resa-zone]').textContent = '(' + zone.nom + ')';
        r('[data-resa-liv]').textContent = eur(zone.prix) + ' HT';
        r('[data-resa-tot]').textContent = eur(tot) + ' HT';
        r('[data-resa-ttc]').textContent = 'soit ' + eur(Math.round(tot * (100 + R.tva)) / 100) + ' TTC';
      }
      // lien Stripe : on transmet le modèle et le département pour les retrouver dans le paiement
      if (R.stripe) {
        btn.href = R.stripe + (dep ? (R.stripe.indexOf('?') === -1 ? '?' : '&') +
          'client_reference_id=' + encodeURIComponent(R.ref + '_dep' + dep) : '');
        btn.target = '_blank';
        btn.rel = 'noopener';
      }
      btn.setAttribute('data-dep', depTxt);
      btn.setAttribute('data-livraison', zone ? eur(zone.prix) + ' HT (' + zone.nom + ')' : (dep ? 'sur devis' : ''));
    };
    depSel.addEventListener('change', majResa);
    majResa();
    // sans lien Stripe : la demande de réservation passe par le formulaire, préremplie
    btn.addEventListener('click', function (e) {
      if (R.stripe) {
        if (!depSel.value) { e.preventDefault(); depSel.focus(); }
        return;
      }
      var msg = champ('message');
      if (msg) {
        msg.value = 'Je souhaite réserver la ' + R.nom + ' (' + R.ref + ') avec un acompte de ' + R.pct + ' %.' +
          (depSel.value ? ' Livraison : ' + btn.getAttribute('data-dep') + ', ' + btn.getAttribute('data-livraison') + '.' : '');
      }
    });
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest('[data-modele]');
    if (a) choisirModele(a.getAttribute('data-modele'));
    if (e.target.closest('[data-cfg-apply]')) appliquer();
    var f = e.target.closest('[data-financement]');
    if (f) choisirOption('financement', f.getAttribute('data-financement'));
  });
  var qs = new URLSearchParams(location.search).get('modele');
  if (qs) choisirModele(qs);

  // Envoi du formulaire (Formspree)
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var btn = form.querySelector('button[type="submit"]');
      var label = btn.textContent;
      btn.disabled = true; btn.textContent = 'Envoi en cours…';
      fetch(form.action, { method: 'POST', body: new FormData(form), headers: { Accept: 'application/json' } })
        .then(function (r) {
          if (!r.ok) throw new Error();
          form.querySelector('.bq-form-ok').hidden = false;
          form.reset();
        })
        .catch(function () {
          alert("L'envoi n'a pas fonctionné. Réessayez ou appelez-nous au 07 60 90 37 74.");
        })
        .finally(function () { btn.disabled = false; btn.textContent = label; });
    });
  }

  // Barre mobile : masquée quand le formulaire est visible
  var sticky = document.querySelector('.bq-sticky');
  var devis = document.getElementById('devis');
  if (sticky && devis && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (en) {
      sticky.classList.toggle('is-hidden', en[0].isIntersecting);
    }).observe(devis);
  }
})();
