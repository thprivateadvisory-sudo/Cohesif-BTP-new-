# Cohesif BTP — Site officiel

Site vitrine du pôle BTP du Groupe Cohesif.

🌐 **Site en ligne** : [cohesifbtp.fr](https://cohesifbtp.fr)

## Structure

- `index.html` — Page d'accueil
- `mentions-legales.html` — Mentions légales
- `politique-confidentialite.html` — Politique RGPD
- `cgv.html` — Conditions générales de vente
- `boutique.html` + `boutique-chariot-*.html` — Boutique chariots élévateurs (pages générées)
- `boutique-mini-pelles.html` + `boutique-mini-pelle-*.html` — Boutique mini-pelles (pages générées)
- `data/boutique.json` — Données de la boutique (produits, prix, engagements SAV)
- `tools/build_boutique.py` — Générateur de la boutique (appelle `tools/build_minipelles.py`)
- `sitemap.xml` — Plan du site pour les moteurs de recherche
- `robots.txt` — Directives d'exploration
- `CNAME` — Domaine personnalisé GitHub Pages

## Boutique

Les pages boutique sont générées : ne pas les modifier à la main.

1. Modifier `data/boutique.json` (ex. renseigner `"prix": 12900` en € HT, ou `"leasingMois"`)
2. Lancer `python3 tools/build_boutique.py`

Tant que `prix` vaut `null`, la fiche affiche « Prix sur demande ».
`"actif": false` masque un modèle de la boutique (sa page est supprimée, ses données sont conservées).
Les mini-pelles (`"rayon": "minipelles"`) affichent la classe (`capacite`) et le poids réel pesé (`poidsReel`).

Réservation des mini-pelles : le client choisit son département, la page affiche livraison, total et acompte.
Réglages dans `reservation` (acompte en %, TVA, tarifs de livraison par zone de départements).
Pour activer le paiement en ligne, renseigner `"stripeAcompte": "https://buy.stripe.com/..."` sur chaque mini-pelle
(lien de paiement Stripe du montant de l'acompte TTC). Tant qu'il vaut `null`, le bouton ouvre la demande de réservation.

⚠️ `data/boutique.json` est publié avec le site : n'y mettre que des prix de vente, jamais de prix d'achat ni de nom de fournisseur.

## Contact

📞 07 60 90 37 74  
✉️ cohesifbtp@gmail.com  
📍 200 rue de la Croix Nivert, 75015 Paris

## Stack

HTML5 / CSS3 / Vanilla JavaScript — aucun framework, performance maximale.

---

© Groupe Cohesif — Tous droits réservés
