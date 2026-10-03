# Cohesif BTP — Site officiel

Site vitrine du pôle BTP du Groupe Cohesif.

🌐 **Site en ligne** : [cohesifbtp.fr](https://cohesifbtp.fr)

## Structure

- `index.html` — Page d'accueil
- `toiture-couverture.html` — Page métier Toiture & couverture (SEO couvreur Paris / IDF)
- `facade-ravalement.html` — Page métier Façade & ravalement (SEO ravalement Paris / IDF)
- `services.css` + `services.js` — Styles et formulaire de devis communs aux pages métiers
- `r3d-core.js` — Moteur commun des simulateurs 3D (scène, caméra, étiquettes, interface ; baisse la résolution automatiquement sur les appareils lents)
- `toiture-3d.js` — Simulateur 3D de la page toiture (maison entière avec choix du matériau et de la teinte, pose, démoussage, fenêtre de toit, isolation), chargé à la demande
- `r3d.css` — Styles communs des simulateurs 3D
- `facade-3d.js` — Simulateur 3D de la page façade (maison entière avant / après avec teinte de l’enduit et des volets, immeuble avant / après, échafaudage, ITE, fissures), chargé à la demande
- `vendor/three/` — Three.js 0.169 (licence MIT), hébergé avec le site
- `mentions-legales.html` — Mentions légales
- `politique-confidentialite.html` — Politique RGPD
- `cgv.html` — Conditions générales de vente
- `boutique.html` + `boutique-chariot-*.html` — Boutique chariots élévateurs (pages générées)
- `boutique-mini-pelles.html` + `boutique-mini-pelle-*.html` — Boutique mini-pelles (pages générées)
- `boutique-plaque-platre-ba13.html`, `boutique-laine-de-roche.html` — Matériaux (pages écrites à la main)
- `data/boutique.json` — Données de la boutique (produits, prix, engagements SAV)
- `tools/build_boutique.py` — Générateur de la boutique (appelle `tools/build_minipelles.py`)
- `sitemap.xml` — Plan du site pour les moteurs de recherche
- `robots.txt` — Directives d'exploration
- `CNAME` — Domaine personnalisé GitHub Pages

## Boutique

### Plaques de plâtre BA13

`boutique-plaque-platre-ba13.html` est écrite à la main (hors générateur) : calculateur de quantité (`ba13.js`),
plaque en 3D (`ba13-3d.js`), styles `ba13.css` et `r3d.css`.
Prix : renseigner l'attribut `data-prix-ht` du bloc `#calcul` (ex. `data-prix-ht="6.90"`, en € HT par plaque).
Vide = « prix sur devis ». Ne jamais y mettre un prix d'achat fournisseur.

### Laine de roche

`boutique-laine-de-roche.html` est écrite à la main (hors générateur) : galerie photos et vidéo, calculateur de panneaux
1 200 × 600 × 50 mm (`laine.js`), styles `laine.css` (le calculateur réutilise `ba13.css`).
Photos et vidéo dans `img/boutique/isolation/` (vidéo muette, sans logo ni texte).
Prix : renseigner l'attribut `data-prix-ht` de chaque bouton de densité (40 à 120 kg/m³) du bloc `#calcul`
(ex. `data-prix-ht="3.20"`, en € HT par panneau). Vide = « prix sur devis ».

Les pages boutique sont générées : ne pas les modifier à la main.

1. Modifier `data/boutique.json` (ex. renseigner `"prix": 12900` en € HT, ou `"leasingMois"`)
2. Lancer `python3 tools/build_boutique.py`

Tant que `prix` vaut `null`, la fiche affiche « Prix sur demande ».
`"actif": false` masque un modèle de la boutique (sa page est supprimée, ses données sont conservées).
Les mini-pelles (`"rayon": "minipelles"`) affichent la classe (`capacite`) et le poids réel pesé (`poidsReel`).

Réservation en ligne (mini-pelles et chariots avec un prix) : le client choisit son département, la page affiche livraison, total et acompte.
Réglages dans `reservation` : acompte en %, TVA, tarifs de livraison par zone de départements
(`zones` pour les mini-pelles, départ Île-de-France ; `zonesChariots` pour les chariots, départ Benelux).
`"livraisonSupplement"` sur un produit s'ajoute au tarif de la zone (ex. chariots de 4 et 5 t).
Pour activer le paiement en ligne, renseigner `"stripeAcompte": "https://buy.stripe.com/..."` sur chaque machine
(lien de paiement Stripe du montant de l'acompte TTC), ou lancer `tools/stripe_acomptes.py`.
Tant qu'il vaut `null`, le bouton ouvre la demande de réservation.
Chariots : `"lithium": {"supplement": …, "stripeAcompte": …}` ajoute l'option batterie lithium-ion (prix, acompte et lien de paiement suivent le choix du client).
⚠️ Si un prix change, l'acompte change : créer un nouveau lien Stripe et désactiver l'ancien.

⚠️ `data/boutique.json` est publié avec le site : n'y mettre que des prix de vente, jamais de prix d'achat ni de nom de fournisseur.

## Contact

📞 07 56 85 57 27  
✉️ cohesifbtp@gmail.com  
📍 200 rue de la Croix Nivert, 75015 Paris

## Stack

HTML5 / CSS3 / Vanilla JavaScript — aucun framework, performance maximale.

---

© Groupe Cohesif — Tous droits réservés
