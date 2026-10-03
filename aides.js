// Cohesif BTP — simulateur d'aides (aides-financement.html)
// Barèmes 2026 (Anah / service-public.fr). À mettre à jour chaque 1er janvier : PLAFONDS, MPR, ECRETEMENT, AMPLEUR.
(function () {
  var root = document.getElementById('simu');
  if (!root) return;

  // Plafonds de revenu fiscal de référence 2026 : [1, 2, 3, 4, 5 personnes, par personne en plus]
  var PLAFONDS = {
    idf: {
      bleu:   [24031, 35270, 42357, 49455, 56580, 7116],
      jaune:  [29253, 42933, 51564, 60208, 68877, 8663],
      violet: [40851, 60051, 71846, 84562, 96817, 12257]
    },
    province: {
      bleu:   [17363, 25393, 30540, 35676, 40835, 5151],
      jaune:  [22259, 32553, 39148, 45735, 52348, 6598],
      violet: [31185, 45842, 55196, 64550, 73907, 9357]
    }
  };

  var PROFILS = {
    bleu:   { nom: 'Bleu',   desc: 'revenus très modestes' },
    jaune:  { nom: 'Jaune',  desc: 'revenus modestes' },
    violet: { nom: 'Violet', desc: 'revenus intermédiaires' },
    rose:   { nom: 'Rose',   desc: 'revenus supérieurs' }
  };

  // Travaux proposés. unite : m2 ou u (unité).
  // prix : budget indicatif HT par unité (pré-rempli, modifiable par le client).
  // mpr : forfait MaPrimeRénov' par geste 2026, par unité (null = non éligible par geste en 2026).
  // plafondMpr : dépense TTC maximale retenue par unité.
  // cee : estimation prudente de la prime CEE par unité (précaires = bleu/jaune), variable selon le fournisseur.
  // tva : taux applicable dans un logement de plus de 2 ans. ecoPtz : montant maximal de l'éco-PTZ.
  var TRAVAUX = {
    rampants: { label: 'Isolation de toiture (rampants, combles)', unite: 'm2', qte: 80, prix: 65,
      mpr: { bleu: 25, jaune: 20, violet: 15, rose: 0 }, plafondMpr: 75,
      cee: { precaire: 12, autre: 6 }, tva: 5.5, ecoPtz: 15000 },
    terrasse: { label: 'Isolation de toiture-terrasse', unite: 'm2', qte: 60, prix: 140,
      mpr: { bleu: 75, jaune: 60, violet: 40, rose: 0 }, plafondMpr: 180,
      cee: { precaire: 12, autre: 6 }, tva: 5.5, ecoPtz: 15000 },
    ite: { label: 'Isolation des murs par l\'extérieur (ravalement + ITE)', unite: 'm2', qte: 120, prix: 150,
      mpr: null, cee: { precaire: 15, autre: 8 }, tva: 5.5, ecoPtz: 15000 },
    fenetres: { label: 'Remplacement de fenêtres simple vitrage', unite: 'u', qte: 6, prix: 850,
      mpr: { bleu: 100, jaune: 80, violet: 40, rose: 0 }, plafondMpr: 1000,
      cee: { precaire: 25, autre: 15 }, tva: 5.5, ecoPtz: 7000 },
    ravalement: { label: 'Ravalement ou réfection de toiture sans isolation', unite: 'm2', qte: 120, prix: 70,
      mpr: null, cee: null, tva: 10, ecoPtz: 0 },
    ampleur: { label: 'Rénovation globale (gain d\'au moins 2 classes DPE)', unite: 'eur', qte: 0, prix: 0,
      tva: 5.5, ecoPtz: 50000 }
  };

  // Plafond du cumul des aides (MaPrimeRénov' + CEE), en % de la dépense TTC
  var ECRETEMENT = { bleu: 0.9, jaune: 0.75, violet: 0.6, rose: 0.4 };

  // Rénovation d'ampleur : taux sur la dépense HT plafonnée, plafond selon le gain de classes, écrêtement
  var AMPLEUR = {
    taux: { bleu: 0.8, jaune: 0.6, violet: 0.45, rose: 0.1 },
    plafond: { 2: 30000, 3: 40000 },
    ecretement: { bleu: 1, jaune: 0.8, violet: 0.8, rose: 0.5 }
  };

  var $ = function (id) { return document.getElementById(id); };
  var f = {
    travaux: $('s-travaux'), qte: $('s-qte'), qteLabel: $('s-qte-label'), qteField: $('s-qte-field'),
    budget: $('s-budget'), budgetHint: $('s-budget-hint'), gain: $('s-gain'), gainField: $('s-gain-field'),
    zone: $('s-zone'), personnes: $('s-personnes'), rfr: $('s-rfr'), statut: $('s-statut'), age: $('s-age')
  };
  var out = $('simu-result');
  var budgetTouched = false;

  var euro = function (n) {
    return Math.round(n).toLocaleString('fr-FR') + ' €';
  };
  var num = function (el) {
    var v = parseFloat(String(el.value).replace(/\s/g, '').replace(',', '.'));
    return isFinite(v) && v > 0 ? v : 0;
  };

  function profil(zone, personnes, rfr) {
    var t = PLAFONDS[zone];
    var i = Math.min(personnes, 5) - 1;
    var plus = Math.max(personnes - 5, 0);
    var seuil = function (p) { return t[p][i] + plus * t[p][5]; };
    if (rfr <= seuil('bleu')) return 'bleu';
    if (rfr <= seuil('jaune')) return 'jaune';
    if (rfr <= seuil('violet')) return 'violet';
    return 'rose';
  }

  function majChamps() {
    var t = TRAVAUX[f.travaux.value];
    var ampleur = f.travaux.value === 'ampleur';
    f.qteField.hidden = ampleur;
    f.gainField.hidden = !ampleur;
    f.qteLabel.textContent = t.unite === 'u' ? 'Nombre de fenêtres' : 'Surface (m²)';
    if (!ampleur && !f.qte.dataset.touched) f.qte.value = t.qte;
    if (ampleur && !budgetTouched) f.budget.value = 45000;
    f.budgetHint.textContent = ampleur
      ? 'Montant HT de l\'ensemble des travaux (isolation, chauffage, ventilation…).'
      : 'Pré-rempli avec un prix moyen, modifiable. Le montant exact est fixé au devis.';
  }

  function majBudget() {
    if (budgetTouched || f.travaux.value === 'ampleur') return;
    var t = TRAVAUX[f.travaux.value];
    f.budget.value = Math.round(num(f.qte) * t.prix);
  }

  function ligne(label, valeur, cls) {
    return '<div class="simu-line' + (cls ? ' ' + cls : '') + '"><span>' + label + '</span><strong>' + valeur + '</strong></div>';
  }

  function calcul() {
    var key = f.travaux.value;
    var t = TRAVAUX[key];
    var qte = num(f.qte);
    var ht = num(f.budget);
    var statut = f.statut.value;
    var recent = f.age.value === 'moins2';
    var ancien = f.age.value === 'plus15';
    var p = profil(f.zone.value, parseInt(f.personnes.value, 10), num(f.rfr));
    var precaire = p === 'bleu' || p === 'jaune';

    var tva = recent ? 20 : t.tva;
    var ttc = ht * (1 + tva / 100);
    var gainTva = ht * (20 - tva) / 100;
    var proprio = statut === 'occupant' || statut === 'bailleur';
    var mpr = 0, cee = 0, notes = [];

    if (statut === 'copro') {
      notes.push('Pour un immeuble, c\'est le syndicat de copropriété qui demande <strong>MaPrimeRénov\' Copropriété</strong> (jusqu\'à 30 à 45 % du montant des travaux selon le gain énergétique, avec des bonus). Nous montons l\'étude avec votre syndic.');
    } else if (recent) {
      notes.push('Votre logement a moins de 2 ans : pas d\'aide à la rénovation et TVA à 20 %.');
    } else if (key === 'ampleur') {
      if (!proprio || !ancien) {
        notes.push('MaPrimeRénov\' Rénovation d\'ampleur est réservée aux propriétaires d\'un logement de plus de 15 ans.');
      } else {
        var gain = parseInt(f.gain.value, 10);
        var base = Math.min(ht, AMPLEUR.plafond[gain]);
        mpr = Math.min(base * AMPLEUR.taux[p], ttc * AMPLEUR.ecretement[p]);
        notes.push('Accompagnement obligatoire par un <strong>Mon Accompagnateur Rénov\'</strong> et rendez-vous France Rénov\' avant le dépôt du dossier. Les primes CEE ne se cumulent pas avec ce parcours.');
      }
    } else {
      if (t.mpr && proprio && ancien) {
        mpr = Math.min(qte * t.mpr[p], qte * t.plafondMpr);
        if (p === 'rose') notes.push('Les revenus supérieurs (profil Rose) n\'ont pas droit à MaPrimeRénov\' par geste.');
      } else if (t.mpr && !proprio) {
        notes.push('MaPrimeRénov\' est réservée aux propriétaires. Locataire : la prime CEE reste possible, avec l\'accord de votre propriétaire.');
      } else if (t.mpr && !ancien) {
        notes.push('MaPrimeRénov\' demande un logement de plus de 15 ans. La prime CEE et la TVA réduite restent possibles.');
      }
      if (key === 'ite') notes.push('Depuis 2026, l\'isolation des murs n\'est plus financée par MaPrimeRénov\' « par geste ». Elle l\'est dans une <strong>rénovation d\'ampleur</strong> : choisissez « Rénovation globale » pour comparer.');
      if (key === 'ravalement') notes.push('Un ravalement ou une toiture refaite sans isolation n\'ouvre pas droit aux primes, mais profite de la TVA à 10 %. Ajouter une isolation change tout : faites le test.');
      if (t.cee) cee = qte * (precaire ? t.cee.precaire : t.cee.autre);
      var plafond = ttc * ECRETEMENT[p];
      if (mpr + cee > plafond) {
        var exces = mpr + cee - plafond;
        var baisse = Math.min(exces, mpr);
        mpr -= baisse; cee -= exces - baisse;
      }
    }

    var aides = mpr + cee;
    var ecoPtz = (proprio && !recent && statut !== 'copro') ? Math.min(t.ecoPtz, Math.max(ttc - aides, 0)) : 0;
    var reste = Math.max(ttc - aides, 0);

    var html = '<div class="simu-profil simu-' + p + '"><span>Votre profil</span><strong>' + PROFILS[p].nom + '</strong><em>' + PROFILS[p].desc + '</em></div>';
    html += '<div class="simu-total"><span>Aides estimées</span><strong>' + euro(aides) + '</strong></div>';
    html += '<div class="simu-lines">';
    html += ligne('Travaux TTC (TVA ' + String(tva).replace('.', ',') + ' %)', euro(ttc));
    html += ligne('MaPrimeRénov\'', mpr > 0 ? '− ' + euro(mpr) : '—');
    html += ligne('Prime CEE (estimation prudente)', cee > 0 ? '− ' + euro(cee) : '—');
    html += ligne('Reste à charge', euro(reste), 'simu-reste');
    if (gainTva > 0) html += ligne('Déjà déduit : TVA réduite au lieu de 20 %', euro(gainTva), 'simu-plus');
    if (ecoPtz > 0) html += ligne('Éco-prêt à taux zéro possible, jusqu\'à', euro(ecoPtz), 'simu-plus');
    html += '</div>';
    if (notes.length) html += '<ul class="simu-notes"><li>' + notes.join('</li><li>') + '</li></ul>';
    out.innerHTML = html;

    // Résumé transmis avec la demande de devis
    var resume = $('simulation-resume');
    if (resume) {
      resume.value = t.label + (key === 'ampleur' ? ' (gain ' + f.gain.options[f.gain.selectedIndex].text + ')' : ' — ' + qte + (t.unite === 'u' ? ' u' : ' m²')) +
        ' | Budget ' + euro(ht) + ' HT | ' + f.zone.options[f.zone.selectedIndex].text + ', ' + f.personnes.value + ' pers., RFR ' + euro(num(f.rfr)) +
        ' | Profil ' + PROFILS[p].nom + ' | ' + f.statut.options[f.statut.selectedIndex].text + ', ' + f.age.options[f.age.selectedIndex].text +
        ' | MPR ' + euro(mpr) + ', CEE ' + euro(cee) + ', reste à charge ' + euro(reste);
    }
  }

  f.travaux.addEventListener('change', function () {
    f.qte.dataset.touched = '';
    majChamps(); majBudget(); calcul();
  });
  f.qte.addEventListener('input', function () { f.qte.dataset.touched = '1'; majBudget(); calcul(); });
  f.budget.addEventListener('input', function () { budgetTouched = f.budget.value !== ''; calcul(); });
  [f.gain, f.zone, f.personnes, f.rfr, f.statut, f.age].forEach(function (el) {
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', calcul);
  });

  // Le formulaire de devis est vidé après envoi : on remet le résumé de la simulation
  var devis = $('devis-form');
  if (devis) devis.addEventListener('reset', function () { setTimeout(calcul, 0); });

  // Lien direct vers un type de travaux : aides-financement.html?travaux=ite#simulateur
  var demande = new URLSearchParams(location.search).get('travaux');
  if (demande && TRAVAUX[demande]) f.travaux.value = demande;

  majChamps(); majBudget(); calcul();
})();
