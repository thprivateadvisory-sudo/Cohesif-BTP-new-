#!/usr/bin/env python3
"""Génère la boutique Cohesif BTP depuis data/boutique.json.

    python3 tools/build_boutique.py

Produit :
  - boutique.html            (catalogue)
  - boutique-*.html          (une fiche par produit)
  - sitemap.xml / sitemap.txt (ajoute les URL boutique si absentes)

Pour afficher un prix : renseigner "prix" (€ HT) et, si besoin, "leasingMois"
dans data/boutique.json, puis relancer le script. Tant que "prix" vaut null,
la fiche affiche « Prix sur demande » et le bouton ouvre la demande de devis.

Pour ajouter un nouveau rayon plus tard (nacelles, mini-pelles…) : ajouter une
entrée dans "rayons" et des produits avec le même "rayon".
"""
import html
import json
import re
from pathlib import Path
from urllib.parse import quote

ROOT = Path(__file__).resolve().parent.parent
DATA = json.loads((ROOT / "data" / "boutique.json").read_text(encoding="utf-8"))
SITE = DATA["site"]
FORM = DATA["formspree"]
WA = DATA["whatsapp"]
TEL = DATA["telephone"]
MAIL = DATA["email"]
ENG = DATA["engagements"]
TOUS = DATA["produits"]
PRODUITS = [p for p in TOUS if p.get("actif", True)]
RAYONS = DATA["rayons"]
LEG = DATA["legendes"]
E = html.escape

N = len(PRODUITS)


GAMMES = {k: v for r in RAYONS for k, v in r["gammes"].items()}


# ─────────────────────────── utilitaires

def euros(n):
    return f"{n:,.0f}".replace(",", " ") + " €"


def mm(n):
    return f"{n:,}".replace(",", " ") + " mm"


def kg(n):
    return f"{n:,}".replace(",", " ") + " kg"


def tonnes(n):
    t = n / 1000
    return (f"{t:.1f}".replace(".", ",").replace(",0", "")) + " t"


def caces(p):
    return "R489 cat. 3" if p["capacite"] <= 6000 else "R489 cat. 4"


def wa_link(texte):
    return f"https://wa.me/{WA}?text={quote(texte)}"


def tel_link():
    return "tel:+33" + TEL.replace(" ", "")[1:]


def prix_html(p):
    if p.get("prix"):
        out = f'<span class="px-val">{euros(p["prix"])} <small>HT</small></span>'
        if p.get("leasingMois"):
            out += f'<span class="px-sub">ou {euros(p["leasingMois"])} HT/mois avec Cohesif Leasing</span>'
        else:
            out += '<span class="px-sub">Livraison et mise en service sur devis</span>'
        return out
    return ('<span class="px-val px-dem">Prix sur demande</span>'
            f'<span class="px-sub">Devis détaillé sous {ENG["delaiReponse"]} · achat ou leasing</span>')


def ld(obj):
    return '<script type="application/ld+json">' + json.dumps(obj, ensure_ascii=False) + "</script>"


ICO = {
    "shield": '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
    "wrench": '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z"/>',
    "truck": '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    "cog": '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1"/>',
    "phone": '<path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/>',
    "check": '<path d="M4 12l5 5L20 6"/>',
    "doc": '<path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6M9 13h8M9 17h6"/>',
    "leaf": '<path d="M5 19c0-8 5-14 15-15-1 10-7 15-15 15z"/><path d="M5 19l7-7"/>',
    "volume": '<path d="M4 9v6h4l5 4V5L8 9H4z"/><path d="M17 9l4 6M21 9l-4 6"/>',
    "euro": '<path d="M17 6a7 7 0 1 0 0 12"/><path d="M4 10h9M4 14h9"/>',
    "bolt": '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    "user": '<circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/>',
    "palette": '<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.8 1.5-1.5 0-1.3-1-1.6-1-2.8 0-1 .8-1.7 1.8-1.7H17a4 4 0 0 0 4-4c0-4.4-4-8-9-8z"/><circle cx="7.5" cy="11" r="1.2"/><circle cx="10" cy="7" r="1.2"/><circle cx="15" cy="7.5" r="1.2"/>',
}


def ico(name):
    return f'<svg viewBox="0 0 24 24" aria-hidden="true">{ICO[name]}</svg>'


WA_SVG = ('<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12.05 2a9.9 9.9 0 0 0-8.5 14.95L2 22l5.2-1.5A9.9 9.9 0 1 0 12.05 2zm5.8 14.1c-.25.7-1.45 1.33-2 1.4-.52.08-1.17.11-1.88-.12-.43-.13-.99-.32-1.7-.62-3-1.3-4.94-4.3-5.1-4.5-.14-.2-1.2-1.6-1.2-3.07s.76-2.18 1.04-2.48c.27-.3.6-.37.8-.37h.57c.18 0 .43-.07.67.5.25.6.84 2.06.92 2.2.07.15.12.33.02.52-.1.2-.15.32-.3.5-.14.17-.3.38-.44.52-.15.15-.3.3-.13.6.17.3.77 1.27 1.65 2.05 1.14 1.01 2.1 1.33 2.4 1.48.3.15.47.12.64-.07.18-.2.75-.87.94-1.17.2-.3.4-.25.67-.15.27.1 1.73.82 2.03.97.3.15.5.22.57.35.07.12.07.7-.18 1.4z"/></svg>')


# ─────────────────────────── gabarit commun

def head(title, desc, url, image, extra_ld=""):
    return f"""<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta name="color-scheme" content="light only"/>
<meta name="theme-color" content="#ea5b1f"/>
<title>{E(title)}</title>
<meta name="description" content="{E(desc)}"/>
<meta name="robots" content="index, follow, max-image-preview:large"/>
<link rel="canonical" href="{url}"/>
<meta property="og:title" content="{E(title)}"/>
<meta property="og:description" content="{E(desc)}"/>
<meta property="og:url" content="{url}"/>
<meta property="og:type" content="website"/>
<meta property="og:locale" content="fr_FR"/>
<meta property="og:site_name" content="Cohesif BTP"/>
<meta property="og:image" content="{SITE}/{image}"/>
<meta name="twitter:card" content="summary_large_image"/>
<link rel="icon" href="favicon.ico" sizes="any"/>
<link rel="icon" type="image/png" sizes="32x32" href="favicon-32x32.png"/>
<link rel="apple-touch-icon" href="apple-touch-icon.png"/>
<link rel="preconnect" href="https://fonts.googleapis.com"/>
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/>
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/>
<link rel="stylesheet" href="boutique.css"/>
{extra_ld}
</head>
<body>
"""


NAV = f"""<div class="bq-topbar">
  <div class="bq-in">
    <span>{ico("truck")} {E(ENG["livraison"])}</span>
    <span class="bq-hide-sm">{ico("shield")} Garantie {E(ENG["garantie"])} · SAV réactif</span>
    <a href="{tel_link()}">{ico("phone")} {TEL}</a>
  </div>
</div>
<nav class="bq-nav" aria-label="Navigation principale">
  <a href="index.html" class="bq-logo"><img src="img/028d2fd4f4.png" alt="Cohesif BTP" width="600" height="104"/></a>
  <ul class="bq-links">
    <li><a href="boutique.html#catalogue">Chariots élévateurs</a></li>
    <li><a href="boutique.html#choisir">Bien choisir</a></li>
    <li><a href="boutique.html#comparer">Comparer</a></li>
    <li><a href="boutique.html#sav">SAV &amp; garanties</a></li>
    <li><a href="boutique.html#financement">Financement</a></li>
    <li><a href="index.html">Cohesif BTP</a></li>
  </ul>
  <div class="bq-nav-r">
    <a href="#devis" class="bq-btn bq-btn-sm">Demander un devis</a>
    <button class="bq-burger" id="bqBurger" aria-label="Ouvrir le menu" aria-expanded="false"><span></span><span></span><span></span></button>
  </div>
</nav>
<div class="bq-mmenu" id="bqMenu">
  <a href="boutique.html#catalogue">Chariots élévateurs</a>
  <a href="boutique.html#choisir">Bien choisir</a>
  <a href="boutique.html#comparer">Comparer les modèles</a>
  <a href="boutique.html#sav">SAV &amp; garanties</a>
  <a href="boutique.html#financement">Financement</a>
  <a href="boutique.html#faq">Questions fréquentes</a>
  <a href="index.html">Retour à Cohesif BTP</a>
  <a href="#devis" class="bq-btn bq-btn-lg">Demander un devis</a>
</div>
"""


def form_html(selected=None, titre="Recevez votre devis sous 48 h"):
    opts = "".join(
        f'<option value="{E(p["ref"] + " · " + p["nom"])}" data-slug="{p["slug"]}"{" selected" if p["slug"] == selected else ""}>'
        f'{E(p["ref"])} · {E(p["nom"])}</option>'
        for p in PRODUITS)
    return f"""<section class="bq-devis" id="devis">
  <div class="bq-in bq-devis-grid">
    <div class="bq-devis-txt">
      <p class="bq-kicker">Devis gratuit et sans engagement</p>
      <h2>{titre}</h2>
      <p>Indiquez le modèle, la batterie et le lieu de livraison. Vous recevez un devis <strong>clair et complet</strong> : chariot, batterie, chargeur, livraison et mise en service.</p>
      <ul class="bq-checks">
        <li>Réponse d'un conseiller sous {ENG["delaiReponse"]}</li>
        <li>Conseil sur le bon modèle et la bonne batterie</li>
        <li>Achat comptant ou leasing avec Cohesif Leasing</li>
        <li>Remise sur quantité pour les flottes</li>
      </ul>
      <div class="bq-devis-contacts">
        <a class="bq-contact" href="{tel_link()}">{ico("phone")}<span><small>Appelez-nous</small>{TEL}</span></a>
        <a class="bq-contact bq-contact-wa" href="{wa_link("Bonjour, je souhaite un devis pour un chariot élévateur électrique.")}" target="_blank" rel="noopener">{WA_SVG}<span><small>WhatsApp</small>Réponse rapide</span></a>
      </div>
    </div>
    <form class="bq-form" action="{FORM}" method="POST" data-bq-form>
      <input type="hidden" name="_subject" value="Cohesif BTP · Demande de devis chariot élévateur"/>
      <input type="hidden" name="source" value="Boutique Cohesif BTP"/>
      <input type="text" name="_gotcha" class="bq-hp" tabindex="-1" autocomplete="off" aria-hidden="true"/>
      <div class="bq-frow">
        <label>Nom et prénom<input type="text" name="nom" required autocomplete="name"/></label>
        <label><span>Société <em>(facultatif)</em></span><input type="text" name="societe" autocomplete="organization"/></label>
      </div>
      <div class="bq-frow">
        <label>Email<input type="email" name="email" required autocomplete="email"/></label>
        <label>Téléphone<input type="tel" name="telephone" required autocomplete="tel"/></label>
      </div>
      <label>Modèle souhaité
        <select name="modele" required>
          <option value="">Choisir un modèle…</option>
          {opts}
          <option value="Je ne sais pas encore, j'ai besoin de conseil">Je ne sais pas encore, conseillez-moi</option>
        </select>
      </label>
      <div class="bq-frow">
        <label>Batterie
          <select name="batterie">
            <option value="">Sélectionner…</option>
            <option>Plomb-acide</option>
            <option>Lithium-ion</option>
            <option>À conseiller selon mon usage</option>
          </select>
        </label>
        <label>Couleur
          <select name="couleur">
            <option value="">Sélectionner…</option>
            <option>Standard</option>
            <option>Orange</option>
            <option>Rouge</option>
            <option>Jaune</option>
            <option>Vert</option>
            <option>Bleu</option>
            <option>Aux couleurs de mon entreprise</option>
          </select>
        </label>
      </div>
      <div class="bq-frow bq-frow-3">
        <label>Quantité<input type="number" name="quantite" min="1" value="1" inputmode="numeric"/></label>
        <label>Code postal<input type="text" name="code_postal" inputmode="numeric" autocomplete="postal-code" placeholder="75015"/></label>
        <label>Financement
          <select name="financement">
            <option value="">Sélectionner…</option>
            <option>Achat comptant</option>
            <option>Leasing (paiement mensuel)</option>
            <option>Je souhaite comparer</option>
          </select>
        </label>
      </div>
      <label><span>Votre besoin <em>(facultatif)</em></span><textarea name="message" rows="3" placeholder="Poids et type de charges, hauteur de stockage, intérieur ou extérieur, date souhaitée…"></textarea></label>
      <button type="submit" class="bq-btn bq-btn-lg bq-btn-full">Recevoir mon devis</button>
      <p class="bq-form-note">Gratuit et sans engagement. Vos données servent uniquement à vous répondre. <a href="politique-confidentialite.html">Confidentialité</a></p>
      <div class="bq-form-ok" role="status" hidden>
        <strong>Merci, votre demande est bien envoyée.</strong>
        <span>Un conseiller Cohesif BTP vous recontacte sous {ENG["delaiReponse"]} avec votre devis.</span>
      </div>
    </form>
  </div>
</section>
"""


def footer():
    liens = "".join(f'<a href="{p["slug"]}.html">{E(p["ref"])} · {E(tonnes(p["capacite"]))}</a>' for p in PRODUITS)
    return f"""<footer class="bq-foot">
  <div class="bq-in bq-foot-grid">
    <div>
      <img src="img/028d2fd4f4.png" alt="Cohesif BTP" width="600" height="104" class="bq-foot-logo" loading="lazy"/>
      <p>Vente de chariots élévateurs électriques neufs, livrés partout en France, avec garantie et service après-vente. Une société du Groupe Cohesif.</p>
    </div>
    <div>
      <h4>Chariots élévateurs</h4>
      <div class="bq-foot-2col">{liens}</div>
    </div>
    <div>
      <h4>Boutique</h4>
      <a href="boutique.html#choisir">Bien choisir son chariot</a>
      <a href="boutique.html#comparer">Comparer les modèles</a>
      <a href="boutique.html#sav">SAV et garanties</a>
      <a href="boutique.html#accessoires">Accessoires</a>
      <a href="boutique.html#financement">Financement</a>
      <a href="index.html">Cohesif BTP</a>
    </div>
    <div>
      <h4>Contact</h4>
      <a href="{tel_link()}">{TEL}</a>
      <a href="mailto:{MAIL}">{MAIL}</a>
      <a href="{wa_link("Bonjour, j'ai une question sur vos chariots élévateurs.")}" target="_blank" rel="noopener">WhatsApp : 07 56 85 57 27</a>
      <span>200 rue de la Croix Nivert, 75015 Paris</span>
      <span>Du lundi au vendredi, 8 h – 18 h</span>
    </div>
  </div>
  <div class="bq-in bq-foot-bot">
    <span>© 2026 Cohesif BTP · Membre du Groupe Cohesif</span>
    <span><a href="mentions-legales.html">Mentions légales</a> · <a href="cgv.html">CGV</a> · <a href="politique-confidentialite.html">Confidentialité</a></span>
  </div>
</footer>
"""


def wa_float(texte):
    return f'<a href="{wa_link(texte)}" class="bq-wa" target="_blank" rel="noopener" aria-label="Nous écrire sur WhatsApp">{WA_SVG}</a>\n'


TAIL = '<script src="boutique.js" defer></script>\n</body>\n</html>\n'


# ─────────────────────────── blocs réutilisables

def card(p):
    chips = (f'<li><b>{E(p["tension"])}</b> batterie</li>'
             f'<li><b>{p["levee"] // 1000} m</b> de levée</li>'
             f'<li><b>{E(p["traction"])}</b> traction</li>')
    return f"""<article class="bq-card" data-gamme="{p["gamme"]}">
  <a href="{p["slug"]}.html" class="bq-card-img" aria-label="{E(p["nom"])}">
    <span class="bq-badge">{E(p["badge"])}</span>
    <span class="bq-card-t" aria-hidden="true">{E(tonnes(p["capacite"]))}</span>
    <img src="{p["image"]}" alt="{E(p["nom"])} {E(p["ref"])}" loading="lazy"/>
  </a>
  <div class="bq-card-body">
    <p class="bq-card-cat">{E(GAMMES[p["gamme"]][0])} · Réf. {E(p["ref"])}</p>
    <h3><a href="{p["slug"]}.html">{E(p["nom"])}</a></h3>
    <p class="bq-card-acc">{E(p["accroche"])}</p>
    <ul class="bq-chips">{chips}</ul>
    <div class="bq-card-foot">
      <div class="bq-px">{prix_html(p)}</div>
      <div class="bq-card-btns">
        <a href="{p["slug"]}.html" class="bq-btn bq-btn-ghost">Voir la fiche</a>
        <a href="#devis" class="bq-btn" data-modele="{p["slug"]}">Devis</a>
      </div>
    </div>
  </div>
</article>"""


def trust_bar():
    return f"""<ul class="bq-in bq-trust">
    <li>{ico("shield")}<div><b>Conformes CE</b><span>Déclaration de conformité fournie</span></div></li>
    <li>{ico("wrench")}<div><b>Garantie {E(ENG["garantie"])}</b><span>SAV et pièces détachées</span></div></li>
    <li>{ico("truck")}<div><b>Livrés et mis en service</b><span>Partout en France</span></div></li>
    <li>{ico("euro")}<div><b>Achat ou leasing</b><span>Avec Cohesif Leasing</span></div></li>
  </ul>"""


SAV_ITEMS = [
    ("shield", f"Garantie {ENG['garantie']}", "Chaque chariot neuf est couvert par une garantie constructeur. En cas de souci, un seul numéro : le nôtre."),
    ("truck", "Livraison et mise en service", "Livraison sur camion plateau jusqu'à votre site, contrôle du chariot à l'arrivée et mise en route."),
    ("user", "Prise en main de vos caristes", "Présentation des commandes, de la charge de la batterie et des règles de sécurité à la livraison."),
    ("cog", "Pièces détachées", "Pièces d'usure et de rechange (pneus, chaînes, fourches, batteries) disponibles sur commande."),
    ("wrench", "Entretien et VGP", "Nous vous accompagnons pour l'entretien préventif et les vérifications générales périodiques obligatoires."),
    ("phone", "Assistance réactive", "Une question, une panne ? Téléphone, email ou WhatsApp : un conseiller vous répond en jours ouvrés."),
]


def sav_html():
    items = "".join(f'<div class="bq-sav-it"><span class="bq-ico">{ico(i)}</span><h3>{E(t)}</h3><p>{E(d)}</p></div>'
                    for i, t, d in SAV_ITEMS)
    return f"""<section class="bq-sec bq-sav" id="sav">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">SAV &amp; garanties</p>
      <h2>Vous achetez un chariot. <span class="accent">Nous restons à vos côtés.</span></h2>
      <p>Un chariot élévateur est un outil de travail : s'il s'arrête, votre activité s'arrête. C'est pourquoi chaque vente Cohesif BTP comprend un vrai suivi.</p>
    </div>
    <div class="bq-sav-grid">{items}</div>
    <div class="bq-sav-cta">
      <div><b>Un interlocuteur unique, avant et après l'achat.</b><span>Du lundi au vendredi, de 8 h à 18 h.</span></div>
      <a href="{tel_link()}" class="bq-btn bq-btn-lg bq-btn-light">{ico("phone")} {TEL}</a>
    </div>
  </div>
</section>"""


def financement_html(label="Demander un financement"):
    return f"""<section class="bq-sec bq-lease" id="financement">
  <div class="bq-in bq-lease-grid">
    <div>
      <p class="bq-kicker">Financement</p>
      <h2>Équipez-vous sans immobiliser votre trésorerie</h2>
      <p>Avec <strong>Cohesif Leasing</strong>, la société de financement du Groupe Cohesif, vous réglez une mensualité fixe et votre chariot travaille dès sa livraison. Le loyer est une charge déductible pour votre entreprise.</p>
      <ul class="bq-checks">
        <li>Mensualité fixe, durée de 24 à 60 mois</li>
        <li>Une seule demande pour le chariot et le financement</li>
        <li>Idéal pour équiper une flotte d'un coup</li>
      </ul>
    </div>
    <div class="bq-lease-card">
      <img src="img/boutique/leasing-logo.webp" alt="Cohesif Leasing" width="360" height="61" loading="lazy"/>
      <p>Choisissez « Leasing » dans votre demande : vous recevez le prix comptant <strong>et</strong> la mensualité, pour comparer.</p>
      <a href="#devis" class="bq-btn bq-btn-lg bq-btn-full" data-financement="Leasing (paiement mensuel)">{label}</a>
    </div>
  </div>
</section>"""


FAQ = [
    ("Pourquoi les prix ne sont-ils pas affichés ?",
     "Le prix dépend de la batterie choisie (plomb-acide ou lithium-ion), de la hauteur de levée, des options, de la couleur et du lieu de livraison. Nous vous envoyons sous 48 h un devis complet et détaillé, sans engagement."),
    ("Faut-il un CACES pour conduire ces chariots ?",
     "Oui. En France, la conduite d'un chariot élévateur nécessite une autorisation de conduite délivrée par l'employeur, généralement après un CACES R489. Tous nos modèles (jusqu'à 5 t) relèvent de la catégorie 3 ; les chariots de plus de 6 t, disponibles sur commande, relèvent de la catégorie 4."),
    ("Batterie plomb ou lithium : que choisir ?",
     "Le plomb-acide est le choix le plus économique à l'achat, parfait pour un usage d'une équipe par jour avec une recharge la nuit. Le lithium-ion coûte plus cher mais se recharge vite, à tout moment, sans entretien : idéal pour un usage intensif ou en plusieurs équipes. Nous vous conseillons selon votre activité."),
    ("Quelle hauteur de levée ?",
     "Les chariots sont proposés avec un mât de 3 m de levée en standard. D'autres hauteurs de mât peuvent être étudiées sur demande : précisez votre hauteur de stockage dans votre demande de devis."),
    ("Quel est le délai de livraison ?",
     "Le délai dépend du modèle, de la batterie et de la personnalisation (couleur, logo). Il est indiqué clairement dans votre devis, avec la date de livraison prévue sur votre site."),
    ("Comment se recharge le chariot ?",
     "Le chariot est livré avec son chargeur, alimenté en 220 V. Pas besoin de station de carburant ni de stockage de gaz : vous rechargez sur site, le plus souvent la nuit."),
    ("Peut-on utiliser un chariot électrique en extérieur ?",
     "Oui, sur sol stabilisé : cour bétonnée, enrobé, dalle. Les pneus pleins résistent aux crevaisons. Pour les terrains meubles ou accidentés, un chariot tout-terrain est plus adapté : parlez-nous de votre site."),
    ("Que comprend le service après-vente ?",
     f"Garantie constructeur de {ENG['garantie']}, mise en service et prise en main à la livraison, pièces détachées disponibles et assistance par téléphone, email ou WhatsApp. Nous vous accompagnons aussi pour l'entretien et les VGP (vérifications générales périodiques)."),
    ("Peut-on payer en plusieurs fois ?",
     "Oui. Avec Cohesif Leasing, vous réglez une mensualité fixe sur la durée de votre choix. Indiquez « Leasing » dans votre demande de devis pour recevoir les deux options."),
    ("Proposez-vous des accessoires ?",
     "Oui : tablier à déplacement latéral, positionneur de fourches, pinces, rotateurs, pousseurs… Ces équipements s'adaptent sur nos chariots selon votre métier. Demandez-les dans votre devis."),
]


def faq_html(items):
    return "".join(f'<details class="bq-faq-it"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in items)


def faq_ld(items):
    return {"@type": "FAQPage", "mainEntity": [
        {"@type": "Question", "name": q, "acceptedAnswer": {"@type": "Answer", "text": a}} for q, a in items]}


def compare_table():
    head_ = "".join(f'<th scope="col"><a href="{p["slug"]}.html"><img src="{p["image"]}" alt="" loading="lazy"/>{E(p["ref"])}</a></th>' for p in PRODUITS)
    lignes = [
        ("Capacité", lambda p: f'<b>{kg(p["capacite"])}</b>'),
        ("Levée standard", lambda p: mm(p["levee"])),
        ("Tension", lambda p: E(p["tension"])),
        ("Moteur de traction", lambda p: E(p["traction"])),
        ("Moteur de levage", lambda p: E(p["levage"])),
        ("Largeur", lambda p: mm(p["largeur"])),
        ("Longueur avec fourches", lambda p: mm(p["longueur"])),
        ("Poids à vide", lambda p: kg(p["poids"])),
        ("CACES", lambda p: E(caces(p))),
        ("", lambda p: f'<a href="#devis" class="bq-btn bq-btn-sm" data-modele="{p["slug"]}">Devis</a>'),
    ]
    rows = "".join(f'<tr><th scope="row">{E(l)}</th>' + "".join(f"<td>{f(p)}</td>" for p in PRODUITS) + "</tr>" for l, f in lignes)
    return f'<div class="bq-cmp-wrap" tabindex="0" role="region" aria-label="Tableau comparatif des chariots"><table class="bq-cmp"><thead><tr><th></th>{head_}</tr></thead><tbody>{rows}</tbody></table></div>'


def data_script():
    d = [{"slug": p["slug"], "ref": p["ref"], "nom": p["nom"], "cap": p["capacite"], "img": p["image"],
          "caces": caces(p), "larg": p["largeur"], "tension": p["tension"]} for p in PRODUITS]
    return '<script type="application/json" id="bqData">' + json.dumps(d, ensure_ascii=False) + "</script>"


# ─────────────────────────── page catalogue

def _t(n):
    t = n / 1000
    return f"{t:.1f}".replace(".", ",").replace(",0", "")


CAP_MIN = _t(min(p["capacite"] for p in PRODUITS))
CAP_MAX = _t(max(p["capacite"] for p in PRODUITS)) + " tonnes"
CAP_MIN_C = CAP_MIN
CAP_MAX_C = _t(max(p["capacite"] for p in PRODUITS)) + " t"


def build_catalogue():
    url = f"{SITE}/boutique.html"
    title = f"Chariots élévateurs électriques de {CAP_MIN} à {CAP_MAX} | Boutique Cohesif BTP"
    desc = (f"Achetez votre chariot élévateur électrique neuf de {CAP_MIN} à {CAP_MAX} : conforme CE, batterie plomb ou lithium, "
            "livré et mis en service partout en France, avec garantie et SAV. Devis sous 48 h, achat ou leasing.")
    ld_obj = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": "Boutique Cohesif BTP : chariots élévateurs électriques", "url": url, "description": desc},
        {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/{p['slug']}.html", "name": p["nom"]}
            for i, p in enumerate(PRODUITS)]},
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Boutique", "item": url}]},
        faq_ld(FAQ)]}

    rayons_html = ""
    for r in RAYONS:
        prods = [p for p in PRODUITS if p["rayon"] == r["id"]]
        filtres = f'<button class="bq-filter is-on" data-f="tout">Tous <span>{len(prods)}</span></button>'
        for k, (nom, plage) in r["gammes"].items():
            n = sum(1 for p in prods if p["gamme"] == k)
            filtres += f'<button class="bq-filter" data-f="{k}">{E(nom)} · {E(plage)} <span>{n}</span></button>'
        # des filtres n'ont d'intérêt qu'au-delà de 6 produits
        filtres_html = (f'<div class="bq-filters" role="group" aria-label="Filtrer par capacité">{filtres}</div>'
                        if len(prods) > 6 else "")
        rayons_html += f"""<section class="bq-sec" id="catalogue">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Le catalogue</p>
      <h2>{E(r["titre"])}</h2>
      <p>{E(r["intro"])}</p>
    </div>
    {filtres_html}
    <div class="bq-grid" id="bqGrid">
      {"".join(card(p) for p in prods)}
      <aside class="bq-card-more">
        <p class="bq-kicker">Sur mesure</p>
        <h3>Une autre capacité ?</h3>
        <p>Chariots de 1 t à 10 t, mât de grande hauteur, flotte de plusieurs chariots, accessoires spécifiques, couleurs de votre entreprise… Nous étudions votre projet et vous proposons la bonne configuration.</p>
        <a href="#devis" class="bq-btn bq-btn-lg">Parler à un conseiller</a>
      </aside>
    </div>
  </div>
</section>"""

    pourquoi = [
        ("volume", "Silencieux", "Travaillez en intérieur, près du public ou de bonne heure sans nuisance sonore."),
        ("leaf", "Zéro émission", "Aucun gaz d'échappement : idéal en entrepôt fermé, en magasin ou en zone urbaine."),
        ("euro", "Coût d'usage réduit", "Une recharge électrique coûte bien moins cher qu'un plein de gasoil ou de GPL."),
        ("cog", "Entretien simplifié", "Pas de vidange, pas de filtres, pas d'embrayage : moins de pièces, moins de pannes."),
    ]
    pq = "".join(f'<div><span class="bq-ico">{ico(i)}</span><h3>{E(t)}</h3><p>{E(d)}</p></div>' for i, t, d in pourquoi)

    couleurs = [("cpd-20", "Vert"), ("cpd-15", "Jaune"), ("cpd-25", "Bleu"), ("cpd-10", "Orange"), ("cpd-30", "Rouge")]
    coul_html = "".join(f'<figure><img src="img/boutique/chariots/{c}.webp" alt="Chariot élévateur électrique {E(n.lower())}" loading="lazy"/><figcaption>{E(n)}</figcaption></figure>' for c, n in couleurs)

    acc_imgs = ["x98", "x85", "x90", "x94", "x86", "x82", "x87", "x92"]
    acc_html = "".join(f'<img src="img/boutique/accessoires/{a}.webp" alt="" loading="lazy"/>' for a in acc_imgs)
    acc_list = "".join(f"<li>{E(a)}</li>" for a in DATA["accessoires"])

    body = head(title, desc, url, "img/boutique/chariots/cpd-50.webp", ld(ld_obj)) + NAV + f"""
<header class="bq-hero">
  <div class="bq-hero-bg" aria-hidden="true"></div>
  <div class="bq-in bq-hero-grid">
    <div class="bq-hero-txt">
      <p class="bq-pill"><span></span>Nouveau · Boutique Cohesif BTP</p>
      <h1>Chariots élévateurs électriques, <span class="accent">sélectionnés pour durer.</span></h1>
      <p class="bq-hero-p">{N} modèles neufs de {CAP_MIN} à {CAP_MAX}, choisis pour leur robustesse et leur fiabilité, livrés et mis en service sur votre site partout en France. Garantie, pièces détachées et SAV inclus dans notre accompagnement.</p>
      <div class="bq-hero-btns">
        <a href="#catalogue" class="bq-btn bq-btn-lg">Voir les {N} modèles</a>
        <a href="#choisir" class="bq-btn bq-btn-lg bq-btn-line">Trouver mon chariot</a>
      </div>
      <ul class="bq-hero-kpis">
        <li><b>{N}</b><span>modèles sélectionnés</span></li>
        <li><b>{CAP_MIN_C} → {CAP_MAX_C}</b><span>de capacité</span></li>
        <li><b>{E(ENG["delaiReponse"])}</b><span>pour votre devis</span></li>
      </ul>
    </div>
    <div class="bq-hero-vis" aria-hidden="true">
      <img src="img/boutique/chariots/cpd-15.webp" alt="" class="hv hv-l"/>
      <img src="img/boutique/chariots/cpd-25.webp" alt="" class="hv hv-r"/>
      <img src="img/boutique/chariots/cpd-50.webp" alt="" class="hv hv-c"/>
      <div class="hv-tag"><b>100 %</b><span>électrique</span></div>
    </div>
  </div>
  {trust_bar()}
</header>

<main>
{rayons_html}

<section class="bq-sec bq-why">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Pourquoi l'électrique</p>
      <h2>Toute la puissance d'un thermique. <span class="accent">Sans ses défauts.</span></h2>
    </div>
    <div class="bq-why-grid">{pq}</div>
  </div>
</section>

<section class="bq-sec bq-choose" id="choisir">
  <div class="bq-in bq-choose-grid">
    <div class="bq-choose-txt">
      <p class="bq-kicker">Bien choisir</p>
      <h2>Quel chariot pour vos charges ?</h2>
      <p>Indiquez le poids de votre charge la plus lourde. Nous vous proposons le modèle adapté, avec une marge de sécurité.</p>
      <p class="bq-note">Au-delà de 4,5 t, nous proposons aussi des modèles de 7 et 10 t sur commande. Conseil : pour des charges encombrantes ou levées très haut, prévoyez une capacité supérieure. Un conseiller valide toujours le choix avec vous avant la commande.</p>
    </div>
    <div class="bq-choose-box" data-choose>
      <label for="bqPoids">Charge la plus lourde <output data-choose-out>1 500 kg</output></label>
      <input type="range" id="bqPoids" min="200" max="10000" step="100" value="1500" data-choose-in/>
      <div class="bq-choose-scale"><span>200 kg</span><span>10 t</span></div>
      <div class="bq-choose-res" data-choose-res>
        <img src="" alt="" data-r-img/>
        <div>
          <p class="bq-card-cat" data-r-cat></p>
          <h3 data-r-nom></h3>
          <p data-r-info></p>
          <div class="bq-choose-btns">
            <a href="#" class="bq-btn" data-r-link>Voir la fiche</a>
            <a href="#devis" class="bq-btn bq-btn-ghost" data-r-devis>Demander un devis</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="bq-sec" id="comparer">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Comparer</p>
      <h2>Les {N} modèles côte à côte</h2>
      <p>Toutes les caractéristiques clés en un coup d'œil. Faites défiler le tableau horizontalement sur mobile.</p>
    </div>
    {compare_table()}
  </div>
</section>

<section class="bq-sec bq-batt">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Batterie au choix</p>
      <h2>Plomb ou lithium : la bonne énergie pour votre rythme</h2>
      <p>Chaque modèle est proposé avec l'une ou l'autre technologie. Nous vous conseillons selon vos horaires et votre intensité d'utilisation.</p>
    </div>
    <div class="bq-batt-grid">
      <div class="bq-batt-card">
        <p class="bq-card-cat">Le plus économique</p>
        <h3>Plomb-acide</h3>
        <ul class="bq-checks">
          <li>Prix d'achat le plus bas</li>
          <li>Technologie éprouvée et robuste</li>
          <li>Idéale pour 1 équipe par jour, recharge la nuit</li>
        </ul>
      </div>
      <div class="bq-batt-card is-hl">
        <p class="bq-card-cat">Le plus performant</p>
        <h3>Lithium-ion</h3>
        <ul class="bq-checks">
          <li>Recharge rapide, possible pendant les pauses</li>
          <li>Aucun entretien, pas de remise à niveau d'eau</li>
          <li>Durée de vie plus longue, idéale en usage intensif</li>
        </ul>
      </div>
    </div>
  </div>
</section>

<section class="bq-sec bq-colors">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Personnalisation</p>
      <h2>Un chariot <span class="accent">à vos couleurs.</span></h2>
      <p>Couleur de carrosserie et logo personnalisables : votre flotte devient une vitrine pour votre entreprise, sur vos sites comme sur les chantiers.</p>
    </div>
    <div class="bq-colors-row">{coul_html}</div>
  </div>
</section>

{sav_html()}

<section class="bq-sec bq-steps-sec">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Comment ça se passe</p>
      <h2>De votre demande à votre premier levage</h2>
    </div>
    <ol class="bq-steps">
      <li><b>1</b><h3>Votre demande</h3><p>Vous choisissez un modèle ou décrivez votre besoin. Un conseiller vous rappelle.</p></li>
      <li><b>2</b><h3>Devis sous {E(ENG["delaiReponse"])}</h3><p>Un prix clair : chariot, batterie, chargeur, livraison. En achat ou en leasing.</p></li>
      <li><b>3</b><h3>Livraison sur site</h3><p>Votre chariot est livré chez vous, contrôlé et mis en service.</p></li>
      <li><b>4</b><h3>Suivi SAV</h3><p>Garantie, pièces, entretien : nous restons votre interlocuteur.</p></li>
    </ol>
  </div>
</section>

<section class="bq-sec bq-acc" id="accessoires">
  <div class="bq-in bq-acc-grid">
    <div>
      <p class="bq-kicker">Accessoires</p>
      <h2>Équipez votre chariot pour votre métier</h2>
      <p>Pinces, rotateurs, positionneurs, pousseurs… Des équipements hydrauliques qui transforment un chariot standard en outil spécialisé.</p>
      <ul class="bq-tags">{acc_list}</ul>
      <a href="#devis" class="bq-btn bq-btn-lg">Demander un accessoire</a>
    </div>
    <div class="bq-acc-imgs" aria-hidden="true">{acc_html}</div>
  </div>
</section>

{financement_html()}

<section class="bq-sec bq-faq" id="faq">
  <div class="bq-in bq-faq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Questions fréquentes</p>
      <h2>Tout savoir avant d'acheter</h2>
    </div>
    {faq_html(FAQ)}
  </div>
</section>

{form_html()}
</main>
<div class="bq-sticky">
  <div><b>Chariots élévateurs</b><span>Devis gratuit sous {E(ENG["delaiReponse"])}</span></div>
  <a href="#devis" class="bq-btn">Mon devis</a>
</div>
""" + footer() + wa_float("Bonjour, je souhaite des informations sur vos chariots élévateurs électriques.") + data_script() + TAIL
    (ROOT / "boutique.html").write_text(body, encoding="utf-8")


# ─────────────────────────── fiches produit

SWATCHES = [("Orange", "#ea5b1f"), ("Rouge", "#c62828"), ("Jaune", "#f2b705"), ("Vert", "#3aa635"),
            ("Bleu", "#1e88e5"), ("Aux couleurs de mon entreprise", "conic-gradient(#ea5b1f,#f2b705,#3aa635,#1e88e5,#8e24aa,#ea5b1f)")]


def build_fiche(p):
    url = f"{SITE}/{p['slug']}.html"
    title = f"{p['nom']} {p['ref']} | Boutique Cohesif BTP"
    desc = (f"{p['nom']} ({p['ref']}) : {p['accroche']} Conforme CE, livré et mis en service en France, "
            f"garantie {ENG['garantie']}. Devis sous 48 h, achat ou leasing.")
    produit_ld = {"@type": "Product", "name": p["nom"], "sku": p["ref"], "mpn": p["ref"], "description": p["accroche"],
                  "image": [f"{SITE}/{p['image']}"] + [f"{SITE}/img/boutique/details/{d}.webp" for d in p["details"]],
                  "category": "Chariot élévateur électrique",
                  "brand": {"@type": "Brand", "name": "Cohesif BTP"},
                  "weight": {"@type": "QuantitativeValue", "value": p["poids"], "unitCode": "KGM"}}
    if p.get("prix"):
        produit_ld["offers"] = {"@type": "Offer", "price": p["prix"], "priceCurrency": "EUR", "url": url,
                                "availability": "https://schema.org/PreOrder",
                                "seller": {"@type": "Organization", "name": "Cohesif BTP"}}
    ld_obj = {"@context": "https://schema.org", "@graph": [
        produit_ld,
        {"@type": "BreadcrumbList", "itemListElement": [
            {"@type": "ListItem", "position": 1, "name": "Accueil", "item": f"{SITE}/"},
            {"@type": "ListItem", "position": 2, "name": "Boutique", "item": f"{SITE}/boutique.html"},
            {"@type": "ListItem", "position": 3, "name": p["nom"], "item": url}]}]}

    kpis = (f'<div><b>{E(tonnes(p["capacite"]))}</b><span>capacité</span></div>'
            f'<div><b>{p["levee"] // 1000} m</b><span>levée standard</span></div>'
            f'<div><b>{E(p["tension"])}</b><span>tension</span></div>'
            f'<div><b>{E(p["traction"])}</b><span>traction</span></div>')

    specs = [
        ("Modèle", p["ref"]),
        ("Capacité de levage", kg(p["capacite"])),
        ("Hauteur de levée", mm(p["levee"]) + " (autres hauteurs sur demande)"),
        ("Longueur hors tout avec fourches", mm(p["longueur"])),
        ("Longueur sans fourches", mm(p["longueurSans"])),
        ("Longueur des fourches", mm(p["fourches"])),
        ("Largeur", mm(p["largeur"])),
        ("Hauteur (toit de protection)", mm(p["hauteur"])),
        ("Poids à vide", kg(p["poids"])),
        ("Moteur de traction", p["traction"]),
        ("Moteur de levage (hydraulique)", p["levage"]),
        ("Tension", p["tension"] + " (autres tensions sur demande)"),
        ("Batterie", "Plomb-acide ou lithium-ion, au choix"),
        ("Chargeur", "Alimentation 220 V, fourni"),
        ("Pont avant", "Acier moulé"),
        ("Pneumatiques", p["pneus"]),
        ("Énergie", "Système de récupération d'énergie"),
        ("Conduite", "CACES " + caces(p)),
        ("Conformité", "Marquage CE, déclaration de conformité fournie"),
    ]
    specs_html = "".join(f'<tr><th scope="row">{E(k)}</th><td>{E(v)}</td></tr>' for k, v in specs)

    atouts = p["atouts"] + [
        ("Compact et maniable", "Petit rayon de braquage et commandes souples pour travailler dans les espaces restreints."),
        ("Pneus pleins", "Plus résistants, plus durables, sans risque de crevaison : un entretien réduit au minimum."),
        ("Propre et économique", "100 % électrique, zéro émission et récupération d'énergie pour une autonomie optimisée."),
    ]
    atouts_html = "".join(f'<div class="bq-pt"><span class="bq-ico">{ico("check")}</span><h3>{E(t)}</h3><p>{E(d)}</p></div>' for t, d in atouts)

    details = "".join(
        f'<figure class="bq-det"><img src="img/boutique/details/{d}.webp" alt="{E(LEG[d][0])} du {E(p["nom"].lower())}" loading="lazy"/>'
        f'<figcaption><b>{E(LEG[d][0])}</b>{E(LEG[d][1])}</figcaption></figure>'
        for d in p["details"])

    usages = "".join(f"<li>{E(u)}</li>" for u in DATA["usagesGamme"][p["gamme"]])

    swatches = "".join(
        f'<button type="button" class="bq-sw" data-cfg="couleur" data-val="{E(n)}" aria-label="{E(n)}" aria-pressed="false" style="background:{c}"></button>'
        for i, (n, c) in enumerate(SWATCHES))

    wa_txt = f"Bonjour, je souhaite un devis pour le {p['nom']} ({p['ref']})."

    idx = PRODUITS.index(p)
    voisins = [q for q in PRODUITS if q["rayon"] == p["rayon"] and q is not p]
    voisins = sorted(voisins, key=lambda q: abs(PRODUITS.index(q) - idx))[:3]
    voisins = sorted(voisins, key=lambda q: q["capacite"])

    faq_fiche = [FAQ[0], FAQ[2], FAQ[1], FAQ[4], FAQ[7]]

    body = head(title, desc, url, p["image"], ld(ld_obj)) + NAV + f"""
<main class="bq-fiche">
  <div class="bq-in">
    <nav class="bq-crumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> › <a href="boutique.html">Boutique</a> › <a href="boutique.html#catalogue">Chariots élévateurs</a> › <span>{E(p["ref"])}</span></nav>
  </div>
  <section class="bq-in bq-prod">
    <div class="bq-gal">
      <div class="bq-gal-main">
        <span class="bq-badge">{E(p["badge"])}</span>
        <span class="bq-card-t" aria-hidden="true">{E(tonnes(p["capacite"]))}</span>
        <img src="{p["image"]}" alt="{E(p["nom"])} {E(p["ref"])}" width="800" height="500"/>
      </div>
      <ul class="bq-gal-reass">
        <li>{ico("shield")} Conforme CE</li>
        <li>{ico("wrench")} Garantie {E(ENG["garantie"])}</li>
        <li>{ico("truck")} Livré et mis en service</li>
      </ul>
    </div>
    <div class="bq-info">
      <p class="bq-card-cat">{E(GAMMES[p["gamme"]][0])} · {E(GAMMES[p["gamme"]][1])} · Réf. {E(p["ref"])}</p>
      <h1>{E(p["nom"])}</h1>
      <p class="bq-accroche">{E(p["accroche"])}</p>
      <div class="bq-kpis">{kpis}</div>

      <div class="bq-cfg" data-cfg-box data-ref="{E(p["ref"])}" data-nom="{E(p["nom"])}">
        <p class="bq-cfg-t">1. Batterie</p>
        <div class="bq-opts">
          <button type="button" class="bq-opt is-on" data-cfg="batterie" data-val="Plomb-acide" aria-pressed="true"><b>Plomb-acide</b><span>Le plus économique</span></button>
          <button type="button" class="bq-opt" data-cfg="batterie" data-val="Lithium-ion" aria-pressed="false"><b>Lithium-ion</b><span>Recharge rapide, sans entretien</span></button>
        </div>
        <p class="bq-cfg-t">2. Couleur <span data-cfg-coul>Standard, comme sur la photo</span></p>
        <div class="bq-sws">{swatches}</div>
      </div>

      <div class="bq-buy">
        <div class="bq-px bq-px-lg">{prix_html(p)}</div>
        <a href="#devis" class="bq-btn bq-btn-lg bq-btn-full" data-modele="{p["slug"]}" data-cfg-apply>Recevoir le devis de ce chariot</a>
        <a href="{wa_link(wa_txt)}" class="bq-btn bq-btn-lg bq-btn-full bq-btn-wa" target="_blank" rel="noopener" data-cfg-wa>{WA_SVG} Demander sur WhatsApp</a>
        <ul class="bq-reass">
          <li>Chariot neuf, marquage CE et déclaration de conformité</li>
          <li>Chargeur 220 V fourni</li>
          <li>Livraison et mise en service sur votre site</li>
          <li>Pièces détachées et SAV assurés par Cohesif BTP</li>
          <li>Achat comptant ou leasing avec Cohesif Leasing</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="bq-sec">
    <div class="bq-in">
      <div class="bq-sec-head"><p class="bq-kicker">Points forts</p><h2>Pourquoi choisir le {E(p["ref"])}</h2></div>
      <div class="bq-pts">{atouts_html}</div>
    </div>
  </section>

  <section class="bq-sec bq-dets-sec">
    <div class="bq-in">
      <div class="bq-sec-head"><p class="bq-kicker">En détail</p><h2>Une construction pensée pour durer</h2></div>
      <div class="bq-dets">{details}</div>
    </div>
  </section>

  <section class="bq-sec">
    <div class="bq-in bq-spec-grid">
      <div>
        <div class="bq-sec-head"><p class="bq-kicker">Fiche technique</p><h2>Caractéristiques {E(p["ref"])}</h2></div>
        <table class="bq-specs"><tbody>{specs_html}</tbody></table>
      </div>
      <aside class="bq-side">
        <div class="bq-side-card">
          <h3>Idéal pour</h3>
          <ul class="bq-tags">{usages}</ul>
        </div>
        <div class="bq-side-card">
          <h3>Bon à savoir</h3>
          <ul class="bq-checks">
            <li>Conduite soumise à autorisation, CACES {E(caces(p))} recommandé</li>
            <li>Vérification générale périodique (VGP) tous les 6 mois</li>
            <li>Sol stabilisé requis : dalle, béton, enrobé</li>
            <li>Largeur de passage minimale : {mm(p["largeur"])} + marge de manœuvre</li>
          </ul>
        </div>
      </aside>
    </div>
  </section>

  {sav_html()}

  <section class="bq-sec bq-faq">
    <div class="bq-in bq-faq-in">
      <div class="bq-sec-head"><p class="bq-kicker">Questions fréquentes</p><h2>Avant de commander</h2></div>
      {faq_html(faq_fiche)}
    </div>
  </section>

  {form_html(p["slug"], "Recevez le devis de ce chariot sous 48 h")}

  <section class="bq-sec bq-alt">
    <div class="bq-in">
      <div class="bq-sec-head"><p class="bq-kicker">Autres capacités</p><h2>Ces modèles peuvent aussi vous intéresser</h2></div>
      <div class="bq-grid bq-grid-3">{"".join(card(q) for q in voisins)}</div>
    </div>
  </section>
</main>
<div class="bq-sticky">
  <div><b>{E(p["ref"])} · {E(tonnes(p["capacite"]))}</b><span>{"Prix sur demande" if not p.get("prix") else euros(p["prix"]) + " HT"}</span></div>
  <a href="#devis" class="bq-btn" data-modele="{p["slug"]}" data-cfg-apply>Mon devis</a>
</div>
""" + footer() + wa_float(wa_txt) + TAIL
    (ROOT / f"{p['slug']}.html").write_text(body, encoding="utf-8")


def retirer_inactifs():
    """Supprime les fiches des produits masqués (actif: false) et les retire des sitemaps."""
    inactifs = [f"{p['slug']}.html" for p in TOUS if not p.get("actif", True)]
    for u in inactifs:
        (ROOT / u).unlink(missing_ok=True)
    path = ROOT / "sitemap.xml"
    xml = path.read_text(encoding="utf-8")
    for u in inactifs:
        xml = re.sub(rf"  <url>\s*<loc>{re.escape(SITE + '/' + u)}</loc>.*?</url>\n", "", xml, flags=re.S)
    path.write_text(xml, encoding="utf-8")
    txt = ROOT / "sitemap.txt"
    lignes = [l for l in txt.read_text(encoding="utf-8").split() if l.rsplit("/", 1)[-1] not in inactifs]
    txt.write_text("\n".join(lignes) + "\n", encoding="utf-8")


def update_sitemaps():
    retirer_inactifs()
    urls = ["boutique.html"] + [f"{p['slug']}.html" for p in PRODUITS]
    path = ROOT / "sitemap.xml"
    xml = path.read_text(encoding="utf-8")
    ajout = ""
    for u in urls:
        loc = f"{SITE}/{u}"
        if f"<loc>{loc}</loc>" in xml:
            xml = re.sub(rf"(<loc>{re.escape(loc)}</loc>\s*<lastmod>)[^<]*", rf"\g<1>{DATA['misAJour']}", xml)
            continue
        ajout += (f"  <url>\n    <loc>{loc}</loc>\n    <lastmod>{DATA['misAJour']}</lastmod>\n"
                  f"    <changefreq>weekly</changefreq>\n    <priority>{'0.9' if u == 'boutique.html' else '0.8'}</priority>\n  </url>\n")
    path.write_text(xml.replace("</urlset>", ajout + "</urlset>"), encoding="utf-8")

    txt = ROOT / "sitemap.txt"
    lignes = txt.read_text(encoding="utf-8").split()
    for u in urls:
        if f"{SITE}/{u}" not in lignes:
            lignes.append(f"{SITE}/{u}")
    txt.write_text("\n".join(lignes) + "\n", encoding="utf-8")


if __name__ == "__main__":
    build_catalogue()
    for p in PRODUITS:
        build_fiche(p)
    update_sitemaps()
    print(f"Boutique générée : boutique.html + {len(PRODUITS)} fiches")
