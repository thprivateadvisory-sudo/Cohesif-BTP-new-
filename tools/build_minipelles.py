#!/usr/bin/env python3
"""Génère le rayon mini-pelles de la boutique depuis data/boutique.json.

Appelé par tools/build_boutique.py (ne pas lancer seul) :

    python3 tools/build_boutique.py

Produit :
  - boutique-mini-pelles.html  (catalogue mini-pelles)
  - boutique-mini-pelle-*.html (une fiche par modèle)

Les produits sont ceux dont "rayon" vaut "minipelles". "capacite" est le poids
opérationnel annoncé (classe de la machine), "poidsReel" le poids pesé à la bascule.
Le prix affiché est "prix" (€ HT) : ne jamais mettre de prix d'achat dans le JSON,
il est publié avec le site.
"""
import build_boutique as B
from build_boutique import E, ENG, TEL, ico, kg, mm, tonnes, euros, wa_link, tel_link, ld, WA_SVG

SITE = B.SITE
MP = B.MINIPELLES
RAYON = next(r for r in B.RAYONS if r["id"] == "minipelles")
CAT = "boutique-mini-pelles.html"
CAT_URL = f"{SITE}/{CAT}"
N = len(MP)


RESA = B.DATA["reservation"]

DEPARTEMENTS = [
    ("01", "Ain"), ("02", "Aisne"), ("03", "Allier"), ("04", "Alpes-de-Haute-Provence"), ("05", "Hautes-Alpes"),
    ("06", "Alpes-Maritimes"), ("07", "Ardèche"), ("08", "Ardennes"), ("09", "Ariège"), ("10", "Aube"),
    ("11", "Aude"), ("12", "Aveyron"), ("13", "Bouches-du-Rhône"), ("14", "Calvados"), ("15", "Cantal"),
    ("16", "Charente"), ("17", "Charente-Maritime"), ("18", "Cher"), ("19", "Corrèze"), ("2A", "Corse-du-Sud"),
    ("2B", "Haute-Corse"), ("21", "Côte-d'Or"), ("22", "Côtes-d'Armor"), ("23", "Creuse"), ("24", "Dordogne"),
    ("25", "Doubs"), ("26", "Drôme"), ("27", "Eure"), ("28", "Eure-et-Loir"), ("29", "Finistère"),
    ("30", "Gard"), ("31", "Haute-Garonne"), ("32", "Gers"), ("33", "Gironde"), ("34", "Hérault"),
    ("35", "Ille-et-Vilaine"), ("36", "Indre"), ("37", "Indre-et-Loire"), ("38", "Isère"), ("39", "Jura"),
    ("40", "Landes"), ("41", "Loir-et-Cher"), ("42", "Loire"), ("43", "Haute-Loire"), ("44", "Loire-Atlantique"),
    ("45", "Loiret"), ("46", "Lot"), ("47", "Lot-et-Garonne"), ("48", "Lozère"), ("49", "Maine-et-Loire"),
    ("50", "Manche"), ("51", "Marne"), ("52", "Haute-Marne"), ("53", "Mayenne"), ("54", "Meurthe-et-Moselle"),
    ("55", "Meuse"), ("56", "Morbihan"), ("57", "Moselle"), ("58", "Nièvre"), ("59", "Nord"),
    ("60", "Oise"), ("61", "Orne"), ("62", "Pas-de-Calais"), ("63", "Puy-de-Dôme"), ("64", "Pyrénées-Atlantiques"),
    ("65", "Hautes-Pyrénées"), ("66", "Pyrénées-Orientales"), ("67", "Bas-Rhin"), ("68", "Haut-Rhin"), ("69", "Rhône"),
    ("70", "Haute-Saône"), ("71", "Saône-et-Loire"), ("72", "Sarthe"), ("73", "Savoie"), ("74", "Haute-Savoie"),
    ("75", "Paris"), ("76", "Seine-Maritime"), ("77", "Seine-et-Marne"), ("78", "Yvelines"), ("79", "Deux-Sèvres"),
    ("80", "Somme"), ("81", "Tarn"), ("82", "Tarn-et-Garonne"), ("83", "Var"), ("84", "Vaucluse"),
    ("85", "Vendée"), ("86", "Vienne"), ("87", "Haute-Vienne"), ("88", "Vosges"), ("89", "Yonne"),
    ("90", "Territoire de Belfort"), ("91", "Essonne"), ("92", "Hauts-de-Seine"), ("93", "Seine-Saint-Denis"),
    ("94", "Val-de-Marne"), ("95", "Val-d'Oise"), ("971", "Guadeloupe"), ("972", "Martinique"), ("973", "Guyane"),
    ("974", "La Réunion"), ("976", "Mayotte"),
]


def euros2(n):
    """Montant avec centimes si besoin : 6 548,40 €."""
    if round(n, 2) == int(n):
        return euros(n)
    return f"{n:,.2f}".replace(",", " ").replace(".", ",") + " €"


def acompte_ttc(p):
    return round(p["prix"] * RESA["acomptePct"] / 100 * (1 + RESA["tva"] / 100), 2)


def resa_html(p):
    """Encart : département → livraison, total et acompte ; bouton de paiement de l'acompte."""
    if not p.get("prix"):
        return ""
    opts = "".join(f'<option value="{c}">{c} · {E(n)}</option>' for c, n in DEPARTEMENTS)
    data = {"ref": p["ref"], "nom": p["nom"], "slug": p["slug"], "prix": p["prix"], "pct": RESA["acomptePct"],
            "tva": RESA["tva"], "stripe": p.get("stripeAcompte"),
            "zones": [{"nom": z["nom"], "prix": z["prix"], "deps": z["departements"]} for z in RESA["zones"]]}
    label = (f"Payer l'acompte de {euros2(acompte_ttc(p))} TTC" if p.get("stripeAcompte")
             else "Réserver avec un acompte")
    return f"""<div class="mp-resa" data-resa>
          <script type="application/json" data-resa-data>{B.json.dumps(data, ensure_ascii=False)}</script>
          <label class="mp-resa-dep">Livraison dans votre département
            <select data-resa-dep><option value="">Choisir mon département…</option>{opts}</select>
          </label>
          <dl class="mp-resa-calc" data-resa-calc hidden>
            <div><dt>Mini-pelle {E(p["ref"])}</dt><dd>{euros(p["prix"])} HT</dd></div>
            <div><dt>Livraison <span data-resa-zone></span></dt><dd data-resa-liv></dd></div>
            <div class="mp-resa-tot"><dt>Total</dt><dd><span data-resa-tot></span><small data-resa-ttc></small></dd></div>
            <div class="mp-resa-ac"><dt>Acompte à la réservation ({RESA["acomptePct"]} %)</dt><dd>{euros2(acompte_ttc(p))} TTC</dd></div>
          </dl>
          <p class="mp-resa-dev" data-resa-devis hidden>Livraison en Corse et outre-mer : nous vous envoyons un devis de transport sous {ENG["delaiReponse"]}.</p>
          <a href="#devis" class="bq-btn bq-btn-lg bq-btn-full mp-resa-btn" data-resa-btn data-modele="{p["slug"]}">{label}</a>
          <p class="mp-resa-note">Paiement sécurisé par carte. Le solde et la livraison sont réglés avant l'expédition de votre machine. <a href="cgv.html#vente-materiel">Conditions de réservation</a></p>
        </div>"""


def metres(n):
    return f"{n / 1000:.2f}".replace(".", ",") + " m"


def prof(p):
    return metres(p["profondeur"])


def prix_html(p):
    if p.get("prix"):
        out = f'<span class="px-val">{euros(p["prix"])} <small>HT</small></span>'
        if p.get("leasingMois"):
            out += f'<span class="px-sub">ou {euros(p["leasingMois"])} HT/mois avec Cohesif Leasing</span>'
        else:
            out += '<span class="px-sub">Machine neuve · livraison calculée selon votre département</span>'
        return out
    return ('<span class="px-val px-dem">Prix sur demande</span>'
            f'<span class="px-sub">Devis détaillé sous {ENG["delaiReponse"]}</span>')


def poids_box(p, big=False):
    """Poids annoncé et poids réel pesé : l'argument de transparence de la gamme."""
    pct = round(p["poidsReel"] / p["capacite"] * 100)
    return f"""<div class="mp-poids{' mp-poids-lg' if big else ''}">
  <div class="mp-poids-row"><span>Classe de la machine</span><b>{E(tonnes(p["capacite"]))}</b></div>
  <div class="mp-poids-row mp-poids-reel"><span>Poids réel pesé à la bascule</span><b>{kg(p["poidsReel"])}</b></div>
  <div class="mp-poids-bar" aria-hidden="true"><i style="width:{pct}%"></i></div>
  <p>{ico("check")} Vidéo de la pesée de votre machine sur demande, avant expédition.</p>
</div>"""


# ─────────────────────────── blocs

def card(p):
    chips = (f'<li><b>{kg(p["poidsReel"])}</b> réels</li>'
             f'<li><b>{prof(p)}</b> de fouille</li>'
             f'<li><b>{E(p["moteur"])}</b></li>')
    return f"""<article class="bq-card" data-gamme="{p["gamme"]}">
  <a href="{p["slug"]}.html" class="bq-card-img mp-photo" aria-label="{E(p["nom"])}">
    <span class="bq-badge">{E(p["badge"])}</span>
    <img src="{p["image"]}" alt="{E(p["nom"])} {E(p["ref"])}" loading="lazy"/>
  </a>
  <div class="bq-card-body">
    <p class="bq-card-cat">Mini-pelle {E(tonnes(p["capacite"]))} · Réf. {E(p["ref"])}</p>
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
    <li>{ico("cog")}<div><b>Moteur Kubota</b><span>Diesel japonais réputé et fiable</span></div></li>
    <li>{ico("check")}<div><b>Poids réel garanti</b><span>Pesée à la bascule, vidéo sur demande</span></div></li>
    <li>{ico("wrench")}<div><b>Garantie {E(ENG["garantie"])}</b><span>SAV et pièces détachées</span></div></li>
    <li>{ico("euro")}<div><b>Achat ou leasing</b><span>Avec Cohesif Leasing</span></div></li>
  </ul>"""


SAV_ITEMS = [
    ("shield", f"Garantie {ENG['garantie']}", "Chaque mini-pelle neuve est garantie. En cas de souci, un seul numéro : le nôtre, pas un fournisseur à l'autre bout du monde."),
    ("doc", "Contrôle avant expédition", "Chaque machine est contrôlée et pesée avant son départ. Vous pouvez demander la vidéo de la pesée de votre propre machine."),
    ("truck", "Livraison sur chantier", "Livraison sur camion plateau jusqu'à votre dépôt ou votre chantier, partout en France."),
    ("user", "Prise en main", "Présentation des commandes, de l'entretien quotidien et des règles de sécurité à la livraison."),
    ("cog", "Pièces détachées", "Filtres, chenilles, dents de godet, flexibles : les pièces d'usure sont disponibles sur commande. Moteur Kubota entretenu partout en France."),
    ("phone", "Assistance réactive", "Une question, une panne ? Téléphone, email ou WhatsApp : un conseiller vous répond en jours ouvrés."),
]


def sav_html():
    items = "".join(f'<div class="bq-sav-it"><span class="bq-ico">{ico(i)}</span><h3>{E(t)}</h3><p>{E(d)}</p></div>'
                    for i, t, d in SAV_ITEMS)
    return f"""<section class="bq-sec bq-sav" id="sav">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">SAV &amp; garanties</p>
      <h2>Vous achetez une machine. <span class="accent">Nous restons à vos côtés.</span></h2>
      <p>Une mini-pelle à l'arrêt, c'est un chantier qui prend du retard. Chaque vente Cohesif BTP comprend un vrai suivi, par une société française.</p>
    </div>
    <div class="bq-sav-grid">{items}</div>
    <div class="bq-sav-cta">
      <div><b>Un interlocuteur unique, avant et après l'achat.</b><span>Du lundi au vendredi, de 8 h à 18 h.</span></div>
      <a href="{tel_link()}" class="bq-btn bq-btn-lg bq-btn-light">{ico("phone")} {TEL}</a>
    </div>
  </div>
</section>"""


def financement_html():
    return """<section class="bq-sec bq-lease" id="financement">
  <div class="bq-in bq-lease-grid">
    <div>
      <p class="bq-kicker">Financement</p>
      <h2>Votre mini-pelle se paie avec vos chantiers</h2>
      <p>Avec <strong>Cohesif Leasing</strong>, la société de financement du Groupe Cohesif, vous réglez une mensualité fixe et votre mini-pelle travaille dès sa livraison. Le loyer est une charge déductible pour votre entreprise.</p>
      <ul class="bq-checks">
        <li>Mensualité fixe, durée de 24 à 60 mois</li>
        <li>Une seule demande pour la machine et le financement</li>
        <li>Souvent moins cher que des mois de location</li>
      </ul>
    </div>
    <div class="bq-lease-card">
      <img src="img/boutique/leasing-logo.webp" alt="Cohesif Leasing" width="360" height="61" loading="lazy"/>
      <p>Choisissez « Leasing » dans votre demande : vous recevez le prix comptant <strong>et</strong> la mensualité, pour comparer.</p>
      <a href="#devis" class="bq-btn bq-btn-lg bq-btn-full" data-financement="Leasing (paiement mensuel)">Demander un financement</a>
    </div>
  </div>
</section>"""


FAQ = [
    ("Pourquoi parlez-vous autant du poids réel ?",
     "Parce que c'est le piège n° 1 du marché des mini-pelles importées : certaines machines vendues comme des « 2 tonnes » ne pèsent en réalité que 1,2 à 1,4 t. Une machine trop légère creuse moins fort, se soulève et s'use plus vite. Chez nous, chaque modèle affiche son poids réel mesuré à la bascule, et vous pouvez demander la vidéo de la pesée de votre machine avant son expédition."),
    ("Les prix affichés comprennent quoi ?",
     "Le prix HT affiché correspond à la mini-pelle neuve, équipée comme décrit sur sa fiche, dédouanée et disponible en France. La livraison jusqu'à votre dépôt ou votre chantier est calculée selon votre département et affichée avant la réservation (Corse et outre-mer sur devis). Vous pouvez réserver en ligne avec un acompte de 30 %."),
    ("Quel est le délai de livraison ?",
     "Les machines sont préparées à la commande. Comptez en général 10 à 14 semaines entre la commande et la livraison ; la date prévue est indiquée clairement sur votre devis."),
    ("Faut-il un CACES pour conduire une mini-pelle ?",
     "En France, l'employeur doit délivrer une autorisation de conduite, en général après un CACES R482 catégorie A (engins compacts, jusqu'à 6 t). Un particulier qui utilise sa propre machine n'est pas soumis au CACES, mais une formation reste vivement conseillée."),
    ("Peut-on la transporter sur une remorque ?",
     "Oui. La MP-20 (1 760 kg réels) se transporte sur une remorque porte-engin de 2,5 à 3,5 t de PTAC tractée par un utilitaire ; la MP-25 et la MP-30 demandent une remorque de 3,5 t. Selon le poids total de l'ensemble, le permis BE peut être nécessaire : nous vous conseillons au moment du devis."),
    ("Qui assure l'entretien et les pièces ?",
     f"Cohesif BTP. La garantie de {ENG['garantie']} et les pièces détachées passent par nous. Le moteur est un Kubota, une marque japonaise dont les pièces d'entretien (filtres, courroies…) se trouvent facilement en France."),
    ("Les machines sont-elles conformes pour la France ?",
     "Oui : chaque mini-pelle est livrée avec son marquage CE et sa déclaration de conformité, indispensables pour l'utiliser sur un chantier et la faire contrôler."),
    ("Proposez-vous des godets et accessoires ?",
     "Chaque mini-pelle est livrée avec un godet standard. En option : godets de différentes largeurs, godet de curage, attache rapide, marteau hydraulique, tarière… Indiquez vos besoins dans votre demande, nous les chiffrons avec la machine."),
    ("Peut-on payer en plusieurs fois ?",
     "Oui. Avec Cohesif Leasing, vous réglez une mensualité fixe sur 24 à 60 mois. Indiquez « Leasing » dans votre demande pour recevoir les deux options."),
]


def form_html(selected=None, titre="Recevez votre devis sous 48 h"):
    opts = "".join(
        f'<option value="{E(p["ref"] + " · " + p["nom"])}" data-slug="{p["slug"]}"{" selected" if p["slug"] == selected else ""}>'
        f'{E(p["ref"])} · {E(p["nom"])}</option>'
        for p in MP)
    return f"""<section class="bq-devis" id="devis">
  <div class="bq-in bq-devis-grid">
    <div class="bq-devis-txt">
      <p class="bq-kicker">Devis gratuit et sans engagement</p>
      <h2>{titre}</h2>
      <p>Indiquez le modèle, vos accessoires et le lieu de livraison. Vous recevez un devis <strong>clair et complet</strong> : machine, options, livraison et délai.</p>
      <ul class="bq-checks">
        <li>Réponse d'un conseiller sous {ENG["delaiReponse"]}</li>
        <li>Vidéo de la pesée de votre machine sur demande</li>
        <li>Achat comptant ou leasing avec Cohesif Leasing</li>
        <li>Remise pour plusieurs machines</li>
      </ul>
      <div class="bq-devis-contacts">
        <a class="bq-contact" href="{tel_link()}">{ico("phone")}<span><small>Appelez-nous</small>{TEL}</span></a>
        <a class="bq-contact bq-contact-wa" href="{wa_link("Bonjour, je souhaite un devis pour une mini-pelle.")}" target="_blank" rel="noopener">{WA_SVG}<span><small>WhatsApp</small>Réponse rapide</span></a>
      </div>
    </div>
    <form class="bq-form" action="{B.FORM}" method="POST" data-bq-form>
      <input type="hidden" name="_subject" value="Cohesif BTP · Demande de devis mini-pelle"/>
      <input type="hidden" name="source" value="Boutique Cohesif BTP · Mini-pelles"/>
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
        <label>Chenilles
          <select name="chenilles">
            <option value="">Sélectionner…</option>
            <option>Caoutchouc (voirie, enrobé, jardins)</option>
            <option>Acier (terrain difficile, démolition)</option>
            <option>À conseiller selon mon usage</option>
          </select>
        </label>
        <label>Accessoires
          <select name="accessoires">
            <option value="">Aucun pour l'instant</option>
            <option>Godets supplémentaires</option>
            <option>Attache rapide</option>
            <option>Marteau hydraulique</option>
            <option>Tarière</option>
            <option>Plusieurs : je précise ci-dessous</option>
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
      <label><span>Votre besoin <em>(facultatif)</em></span><textarea name="message" rows="3" placeholder="Type de travaux, accès au chantier (largeur de portail), profondeur à creuser, date souhaitée…"></textarea></label>
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


def compare_table():
    head_ = "".join(f'<th scope="col"><a href="{p["slug"]}.html"><img src="{p["image"]}" alt="" loading="lazy" class="mp-cmp-img"/>{E(p["ref"])}</a></th>' for p in MP)
    lignes = [
        ("Classe", lambda p: f'<b>{E(tonnes(p["capacite"]))}</b>'),
        ("Poids réel pesé", lambda p: f'<b>{kg(p["poidsReel"])}</b>'),
        ("Moteur", lambda p: E(p["moteur"])),
        ("Puissance", lambda p: E(p["puissance"])),
        ("Profondeur de fouille", lambda p: mm(p["profondeur"])),
        ("Largeur", lambda p: E(p["largeur"])),
        ("Poste de conduite", lambda p: E(p["poste"])),
        ("Prix", lambda p: f'<b>{euros(p["prix"])} HT</b>' if p.get("prix") else "Sur demande"),
        ("", lambda p: f'<a href="#devis" class="bq-btn bq-btn-sm" data-modele="{p["slug"]}">Devis</a>'),
    ]
    rows = "".join(f'<tr><th scope="row">{E(l)}</th>' + "".join(f"<td>{f(p)}</td>" for p in MP) + "</tr>" for l, f in lignes)
    return f'<div class="bq-cmp-wrap" tabindex="0" role="region" aria-label="Tableau comparatif des mini-pelles"><table class="bq-cmp"><thead><tr><th></th>{head_}</tr></thead><tbody>{rows}</tbody></table></div>'


def faq_html(items):
    return "".join(f'<details class="bq-faq-it"><summary>{E(q)}</summary><p>{E(a)}</p></details>' for q, a in items)


def sticky(titre, sous, slug=None):
    dm = f' data-modele="{slug}"' if slug else ""
    return f"""<div class="bq-sticky">
  <div><b>{E(titre)}</b><span>{E(sous)}</span></div>
  <a href="#devis" class="bq-btn"{dm}>Mon devis</a>
</div>
"""


def breadcrumb(*items):
    return {"@type": "BreadcrumbList", "itemListElement": [
        {"@type": "ListItem", "position": i + 1, "name": n, "item": u} for i, (n, u) in enumerate(items)]}


# ─────────────────────────── page catalogue

def build_catalogue():
    pmin = min(p["prix"] for p in MP if p.get("prix"))
    title = "Mini-pelles neuves 2 à 3 tonnes moteur Kubota | Boutique Cohesif BTP"
    desc = (f"Mini-pelles neuves de 2 à 3 t à moteur Kubota, dès {euros(pmin)} HT. Poids réel vérifié à la bascule, "
            f"cabine ou canopée, garantie {ENG['garantie']} et SAV en France. Devis sous 48 h, achat ou leasing.")
    ld_obj = {"@context": "https://schema.org", "@graph": [
        {"@type": "CollectionPage", "name": "Mini-pelles Cohesif BTP", "url": CAT_URL, "description": desc},
        {"@type": "ItemList", "itemListElement": [
            {"@type": "ListItem", "position": i + 1, "url": f"{SITE}/{p['slug']}.html", "name": p["nom"]} for i, p in enumerate(MP)]},
        breadcrumb(("Accueil", f"{SITE}/"), ("Boutique", f"{SITE}/boutique.html"), ("Mini-pelles", CAT_URL)),
        B.faq_ld(FAQ)]}

    poids_rows = "".join(
        f'<tr><th scope="row">{E(p["ref"])}</th><td>{E(tonnes(p["capacite"]))}</td><td><b>{kg(p["poidsReel"])}</b></td></tr>' for p in MP)

    choix = [
        (MP[0], "Accès étroits et jardins", "Portillon de 1 m, cour, bord de mur, voirie en ville : la MP-20 passe là où les autres restent dehors."),
        (MP[1], "Artisan terrassier", "Tranchées de réseaux, fondations, assainissement : cabine fermée et commandes pilotées pour travailler tous les jours."),
        (MP[2], "Gros chantiers, toute saison", "Plus lourde, plus profonde et climatisée : pour enchaîner les journées de terrassement été comme hiver."),
    ]
    choix_html = "".join(
        f'<a href="{p["slug"]}.html" class="mp-choix"><img src="{p["image"]}" alt="" loading="lazy"/>'
        f'<div><p class="bq-card-cat">{E(t)}</p><h3>{E(p["ref"])} · {E(tonnes(p["capacite"]))}</h3><p>{E(d)}</p>'
        f'<span class="mp-choix-go">Voir la fiche →</span></div></a>' for p, t, d in choix)

    body = B.head(title, desc, CAT_URL, MP[1]["image"], ld(ld_obj)) + B.NAV + f"""
<header class="bq-hero mp-hero">
  <div class="bq-in bq-hero-grid">
    <div class="bq-hero-txt">
      <p class="bq-pill">Boutique Cohesif BTP · Mini-pelles</p>
      <h1>Mini-pelles moteur Kubota, <span class="accent">au vrai poids.</span></h1>
      <p class="bq-hero-p">{N} mini-pelles neuves de 2 à 3 tonnes, dès {euros(pmin)} HT. Chaque machine est pesée à la bascule avant son départ : le poids affiché est le poids réel. Garantie, pièces détachées et SAV assurés par Cohesif BTP.</p>
      <div class="bq-hero-btns">
        <a href="#catalogue" class="bq-btn bq-btn-lg">Voir les {N} mini-pelles</a>
        <a href="#poids-reel" class="bq-btn bq-btn-lg bq-btn-line">Pourquoi le poids réel compte</a>
      </div>
      <ul class="bq-hero-kpis">
        <li><b>Kubota</b><span>moteur diesel japonais</span></li>
        <li><b>1,76 → 2,7 t</b><span>de poids réel pesé</span></li>
        <li><b>{E(ENG["delaiReponse"])}</b><span>pour votre devis</span></li>
      </ul>
    </div>
    <div class="mp-hero-vis" aria-hidden="true">
      <img src="{MP[1]["image"]}" alt="" class="mp-hv mp-hv-a"/>
      <img src="{MP[2]["image"]}" alt="" class="mp-hv mp-hv-b"/>
      <img src="{MP[0]["image"]}" alt="" class="mp-hv mp-hv-c"/>
    </div>
  </div>
  {trust_bar()}
</header>

<main>
<section class="bq-sec" id="catalogue">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Le catalogue</p>
      <h2>{E(RAYON["titre"])}</h2>
      <p>{E(RAYON["intro"])}</p>
    </div>
    <div class="bq-grid mp-grid">{"".join(card(p) for p in MP)}</div>
  </div>
</section>

<section class="bq-sec mp-verite" id="poids-reel">
  <div class="bq-in mp-verite-grid">
    <div>
      <p class="bq-kicker">Transparence</p>
      <h2>Une « 2 tonnes » doit peser <span class="accent">près de 2 tonnes.</span></h2>
      <p>Sur le marché des mini-pelles importées, certaines machines vendues comme des 2 tonnes ne pèsent en réalité que <strong>1,2 à 1,4 tonne</strong>, parfois avec un poids faussé sur les documents de transport. Résultat : une machine qui creuse moins fort, se soulève en bout de flèche et s'use plus vite.</p>
      <p>Nous avons fait l'inverse : chaque modèle affiche <strong>deux chiffres</strong>, sa classe et son poids réel mesuré à la bascule. Et vous pouvez demander <strong>la vidéo de la pesée de votre propre machine</strong> avant qu'elle ne soit expédiée.</p>
      <ul class="bq-checks">
        <li>Poids réel mesuré, pas estimé</li>
        <li>Profondeur et largeur réelles, pas « gonflées »</li>
        <li>Vidéo de pesée sur simple demande</li>
      </ul>
    </div>
    <div class="mp-verite-card">
      <table class="bq-specs mp-poids-t">
        <thead><tr><th>Modèle</th><th>Classe</th><th>Poids réel pesé</th></tr></thead>
        <tbody>{poids_rows}</tbody>
      </table>
      <p class="bq-note">Poids réels mesurés à la bascule en configuration standard. Comparez-les avant d'acheter une mini-pelle, chez nous comme ailleurs.</p>
    </div>
  </div>
</section>

<section class="bq-sec" id="choisir">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Bien choisir</p>
      <h2>Quelle mini-pelle pour vos chantiers ?</h2>
      <p>Un doute ? Décrivez votre chantier dans la demande de devis : un conseiller valide le bon modèle avec vous avant toute commande.</p>
    </div>
    <div class="mp-choix-grid">{choix_html}</div>
  </div>
</section>

<section class="bq-sec bq-why">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Pourquoi ces machines</p>
      <h2>Des composants reconnus. <span class="accent">Pas de mauvaise surprise.</span></h2>
    </div>
    <div class="bq-why-grid">
      <div><span class="bq-ico">{ico("cog")}</span><h3>Moteur Kubota</h3><p>Le moteur diesel de référence des mini-pelles : robuste, sobre, et entretenu par tous les mécaniciens en France.</p></div>
      <div><span class="bq-ico">{ico("bolt")}</span><h3>Hydraulique load-sensing</h3><p>Pompe à pistons et distributeur load-sensing : de la force quand il faut, des mouvements doux et précis.</p></div>
      <div><span class="bq-ico">{ico("truck")}</span><h3>Translation 2 vitesses</h3><p>Moteurs de translation intégrés à deux vitesses pour se déplacer vite sur le chantier.</p></div>
      <div><span class="bq-ico">{ico("wrench")}</span><h3>Déport de flèche</h3><p>Creusez le long d'un mur ou d'une clôture sans déplacer la machine, sur les 3 modèles.</p></div>
    </div>
  </div>
</section>

<section class="bq-sec" id="comparer">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Comparer</p>
      <h2>Les {N} mini-pelles côte à côte</h2>
      <p>Toutes les caractéristiques clés, prix compris. Faites défiler le tableau horizontalement sur mobile.</p>
    </div>
    {compare_table()}
  </div>
</section>

{sav_html()}

<section class="bq-sec bq-steps-sec">
  <div class="bq-in">
    <div class="bq-sec-head">
      <p class="bq-kicker">Comment ça se passe</p>
      <h2>De votre demande à votre premier coup de godet</h2>
    </div>
    <ol class="bq-steps">
      <li><b>1</b><h3>Votre demande</h3><p>Vous choisissez un modèle ou décrivez votre chantier. Un conseiller vous rappelle.</p></li>
      <li><b>2</b><h3>Devis sous {E(ENG["delaiReponse"])}</h3><p>Machine, accessoires, livraison et date prévue. En achat ou en leasing.</p></li>
      <li><b>3</b><h3>Contrôle et pesée</h3><p>Votre machine est contrôlée et pesée avant son départ. Vidéo sur demande.</p></li>
      <li><b>4</b><h3>Livraison et suivi</h3><p>Livraison sur votre chantier, prise en main, puis garantie et SAV.</p></li>
    </ol>
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
{sticky("Mini-pelles Kubota", f"Dès {euros(pmin)} HT · devis sous {ENG['delaiReponse']}")}""" + B.footer() + B.wa_float("Bonjour, je souhaite des informations sur vos mini-pelles.") + B.TAIL
    (B.ROOT / CAT).write_text(body, encoding="utf-8")


# ─────────────────────────── fiches produit

def build_fiche(p):
    url = f"{SITE}/{p['slug']}.html"
    title = f"{p['nom']} {p['ref']} | Boutique Cohesif BTP"
    px = f"{euros(p['prix'])} HT. " if p.get("prix") else ""
    desc = (f"{p['nom']} ({p['ref']}) : {kg(p['poidsReel'])} réels pesés, {p['moteur']}, fouille {prof(p)}. {px}"
            f"Garantie {ENG['garantie']}, SAV en France. Devis sous 48 h, achat ou leasing.")
    produit_ld = {"@type": "Product", "name": p["nom"], "sku": p["ref"], "mpn": p["ref"], "description": p["accroche"],
                  "image": [f"{SITE}/{p['image']}"], "category": "Mini-pelle",
                  "brand": {"@type": "Brand", "name": "Cohesif BTP"},
                  "weight": {"@type": "QuantitativeValue", "value": p["poidsReel"], "unitCode": "KGM"}}
    if p.get("prix"):
        produit_ld["offers"] = {"@type": "Offer", "price": p["prix"], "priceCurrency": "EUR", "url": url,
                                "itemCondition": "https://schema.org/NewCondition",
                                "availability": "https://schema.org/PreOrder",
                                "seller": {"@type": "Organization", "name": "Cohesif BTP"}}
    ld_obj = {"@context": "https://schema.org", "@graph": [produit_ld, breadcrumb(
        ("Accueil", f"{SITE}/"), ("Boutique", f"{SITE}/boutique.html"), ("Mini-pelles", CAT_URL), (p["nom"], url))]}

    kpis = (f'<div><b>{kg(p["poidsReel"])}</b><span>poids réel</span></div>'
            f'<div><b>{prof(p)}</b><span>profondeur</span></div>'
            f'<div><b>{E(p["puissance"].split(" (")[0])}</b><span>puissance</span></div>'
            f'<div><b>{metres(p["largeurMin"])}</b><span>largeur mini</span></div>')

    specs = [
        ("Modèle", p["ref"]),
        ("Classe", tonnes(p["capacite"])),
        ("Poids réel (pesé à la bascule)", kg(p["poidsReel"])),
        ("Moteur", p["moteur"] + ", diesel"),
        ("Puissance nominale", p["puissance"]),
        ("Profondeur de fouille maximale", mm(p["profondeur"])),
        ("Largeur de la machine", p["largeur"]),
    ]
    if p.get("vitesse"):
        specs.append(("Vitesse de translation", p["vitesse"]))
    specs.append(("Poste de conduite", p["poste"]))
    if p.get("chenilles"):
        specs.append(("Chenilles", p["chenilles"]))
    specs += [
        ("Déport de flèche", "Oui"),
        ("Godet", "Godet standard inclus"),
        ("Lame de nivellement", "Oui"),
        ("Conduite", "CACES R482 cat. A recommandé"),
        ("Conformité", "Marquage CE, déclaration de conformité fournie"),
        ("Garantie", ENG["garantie"]),
    ]
    specs_html = "".join(f'<tr><th scope="row">{E(k)}</th><td>{E(v)}</td></tr>' for k, v in specs)

    atouts = p["atouts"] + [
        ("Moteur Kubota", "Le moteur diesel de référence des mini-pelles : fiable, sobre, et facile à entretenir en France."),
        ("Poids réel vérifié", f"{kg(p['poidsReel'])} mesurés à la bascule : une machine stable qui creuse vraiment."),
        ("Déport de flèche", "Creusez le long d'un mur ou d'une clôture sans repositionner la machine."),
    ]
    atouts_html = "".join(f'<div class="bq-pt"><span class="bq-ico">{ico("check")}</span><h3>{E(t)}</h3><p>{E(d)}</p></div>' for t, d in atouts)
    equip = "".join(f"<li>{E(x)}</li>" for x in p["equipements"])
    usages = "".join(f"<li>{E(u)}</li>" for u in B.DATA["usagesGamme"][p["gamme"]])
    voisins = [q for q in MP if q is not p]
    wa_txt = f"Bonjour, je souhaite un devis pour la {p['nom']} ({p['ref']})."
    faq_fiche = [FAQ[0], FAQ[1], FAQ[2], FAQ[4], FAQ[3], FAQ[5]]

    body = B.head(title, desc, url, p["image"], ld(ld_obj)) + B.NAV + f"""
<main class="bq-fiche">
  <div class="bq-in">
    <nav class="bq-crumb" aria-label="Fil d'Ariane"><a href="index.html">Accueil</a> › <a href="boutique.html">Boutique</a> › <a href="{CAT}">Mini-pelles</a> › <span>{E(p["ref"])}</span></nav>
  </div>
  <section class="bq-in bq-prod">
    <div class="bq-gal">
      <div class="bq-gal-main mp-photo">
        <span class="bq-badge">{E(p["badge"])}</span>
        <img src="{p["image"]}" alt="{E(p["nom"])} {E(p["ref"])}"/>
      </div>
      <ul class="bq-gal-reass">
        <li>{ico("cog")} Moteur Kubota</li>
        <li>{ico("wrench")} Garantie {E(ENG["garantie"])}</li>
        <li>{ico("shield")} Marquage CE</li>
      </ul>
    </div>
    <div class="bq-info">
      <p class="bq-card-cat">Mini-pelle {E(tonnes(p["capacite"]))} · Réf. {E(p["ref"])}</p>
      <h1>{E(p["nom"])}</h1>
      <p class="bq-accroche">{E(p["accroche"])}</p>
      <div class="bq-kpis">{kpis}</div>
      {poids_box(p, True)}
      <div class="bq-buy">
        <div class="bq-px bq-px-lg">{prix_html(p)}</div>
        {resa_html(p)}
        <a href="#devis" class="bq-btn bq-btn-lg bq-btn-full bq-btn-ghost" data-modele="{p["slug"]}">Recevoir un devis</a>
        <a href="{wa_link(wa_txt)}" class="bq-btn bq-btn-lg bq-btn-full bq-btn-wa" target="_blank" rel="noopener">{WA_SVG} Demander sur WhatsApp</a>
        <ul class="bq-reass">
          <li>Machine neuve, marquage CE et déclaration de conformité</li>
          <li>Vidéo de pesée de votre machine sur demande</li>
          <li>Livraison sur votre chantier partout en France</li>
          <li>Pièces détachées et SAV assurés par Cohesif BTP</li>
          <li>Achat comptant ou leasing avec Cohesif Leasing</li>
        </ul>
      </div>
    </div>
  </section>

  <section class="bq-sec">
    <div class="bq-in">
      <div class="bq-sec-head"><p class="bq-kicker">Points forts</p><h2>Pourquoi choisir la {E(p["ref"])}</h2></div>
      <div class="bq-pts">{atouts_html}</div>
    </div>
  </section>

  <section class="bq-sec">
    <div class="bq-in bq-spec-grid">
      <div>
        <div class="bq-sec-head"><p class="bq-kicker">Fiche technique</p><h2>Caractéristiques {E(p["ref"])}</h2></div>
        <table class="bq-specs"><tbody>{specs_html}</tbody></table>
        <p class="bq-note">Valeurs réelles mesurées sur la machine en configuration standard.</p>
      </div>
      <aside class="bq-side">
        <div class="bq-side-card">
          <h3>Équipement de série</h3>
          <ul class="bq-checks">{equip}</ul>
        </div>
        <div class="bq-side-card">
          <h3>Idéale pour</h3>
          <ul class="bq-tags">{usages}</ul>
        </div>
        <div class="bq-side-card">
          <h3>Bon à savoir</h3>
          <ul class="bq-checks">
            <li>Conduite soumise à autorisation, CACES R482 cat. A recommandé</li>
            <li>VGP annuelle obligatoire si la machine sert au levage de charges</li>
            <li>Passage minimal : {mm(p["largeurMin"])} de large</li>
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

  {form_html(p["slug"], "Recevez le devis de cette mini-pelle sous 48 h")}

  <section class="bq-sec bq-alt">
    <div class="bq-in">
      <div class="bq-sec-head"><p class="bq-kicker">Autres modèles</p><h2>Ces mini-pelles peuvent aussi vous intéresser</h2></div>
      <div class="bq-grid mp-grid-2">{"".join(card(q) for q in voisins)}</div>
    </div>
  </section>
</main>
{sticky(p["ref"] + " · Mini-pelle " + tonnes(p["capacite"]), euros(p["prix"]) + " HT" if p.get("prix") else "Prix sur demande", p["slug"])}""" + B.footer() + B.wa_float(wa_txt) + B.TAIL
    (B.ROOT / f"{p['slug']}.html").write_text(body, encoding="utf-8")


def build():
    if not MP:
        return
    build_catalogue()
    for p in MP:
        build_fiche(p)
