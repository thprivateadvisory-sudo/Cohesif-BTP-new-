# Cohesif BTP — Site officiel

Site vitrine du pôle BTP du Groupe Cohesif.

🌐 **Site en ligne** : [cohesifbtp.fr](https://cohesifbtp.fr)

## Structure

- `index.html` — Page d'accueil
- `mentions-legales.html` — Mentions légales
- `politique-confidentialite.html` — Politique RGPD
- `cgv.html` — Conditions générales de vente
- `boutique.html` + `boutique-*.html` — Boutique chariots élévateurs (pages générées)
- `data/boutique.json` — Données de la boutique (produits, prix, engagements SAV)
- `tools/build_boutique.py` — Générateur de la boutique
- `sitemap.xml` — Plan du site pour les moteurs de recherche
- `robots.txt` — Directives d'exploration
- `CNAME` — Domaine personnalisé GitHub Pages

## Boutique

Les pages boutique sont générées : ne pas les modifier à la main.

1. Modifier `data/boutique.json` (ex. renseigner `"prix": 12900` en € HT, ou `"leasingMois"`)
2. Lancer `python3 tools/build_boutique.py`

Tant que `prix` vaut `null`, la fiche affiche « Prix sur demande ».
Pour ajouter un nouveau rayon (nacelles, mini-pelles…), ajouter une entrée dans `rayons` et les produits correspondants.

## Contact

📞 07 60 90 37 74  
✉️ cohesifbtp@gmail.com  
📍 200 rue de la Croix Nivert, 75015 Paris

## Stack

HTML5 / CSS3 / Vanilla JavaScript — aucun framework, performance maximale.

---

© Groupe Cohesif — Tous droits réservés
