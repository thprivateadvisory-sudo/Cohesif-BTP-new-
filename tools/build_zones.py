#!/usr/bin/env python3
"""Cohesif BTP — génère les pages locales : zones-intervention.html et une page travaux-<département>.html par zone.

Contenu dans tools/zones_contenu.py. Modifier ce fichier puis :
    python3 tools/build_zones.py
Le script met aussi à jour sitemap.xml et sitemap.txt. Ne pas modifier les pages générées à la main.
"""
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_guides import FOOTER, ROOT, SITE, TEL_SVG, breadcrumb_ld, crumbs, e, ld, maj_sitemaps  # noqa: E402
from build_metiers import ICONES, NAV, texte  # noqa: E402
from guides_contenu import GUIDES  # noqa: E402
from zones_contenu import ZONES  # noqa: E402

SERVICES = {
    'toiture': ('toiture-couverture.html', 'Toiture & couverture', 'roof'),
    'facade': ('facade-ravalement.html', 'Façade & ravalement', 'building'),
    'renovation': ('renovation-appartement-maison.html', 'Rénovation complète', 'home'),
    'gros-oeuvre': ('gros-oeuvre-maconnerie.html', 'Gros œuvre & maçonnerie', 'bricks'),
    'isolation': ('isolation-combles-murs.html', 'Isolation', 'thermo'),
    'desamiantage': ('desamiantage.html', 'Désamiantage', 'shield'),
}
GUIDE = {g['slug']: g for g in GUIDES}
STYLE = '''  <style>
    .svc-hero .note-card { position: static; }
    .note-card ul { list-style: none; display: grid; gap: 10px; margin-bottom: 28px; }
    .note-card li { color: rgba(255,255,255,0.85); font-size: 15px; font-weight: 600; padding-left: 28px; position: relative; }
    .note-card li::before { content: '✓'; position: absolute; left: 0; top: 0; width: 19px; height: 19px; border-radius: 50%; background: var(--accent); color: var(--white); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }
    .z-bati { max-width: 860px; display: grid; gap: 18px; }
    .z-bati p { font-size: 17px; line-height: 1.75; color: var(--grey-900); }
    a.svc-card { display: block; }
    a.svc-card .z-more { display: inline-block; margin-top: 14px; font-size: 14px; font-weight: 700; color: var(--accent); }
    .z-villes { list-style: none; display: flex; flex-wrap: wrap; gap: 8px; }
    .z-villes li { font-size: 14px; font-weight: 600; padding: 8px 14px; border: 1px solid var(--grey-200); border-radius: var(--pill); background: var(--white); }
    .z-zones { display: flex; flex-wrap: wrap; gap: 8px; }
    .z-zones a { font-size: 14px; font-weight: 600; padding: 9px 16px; border: 1px solid var(--grey-200); border-radius: var(--pill); background: var(--white); }
    .z-zones a:hover { border-color: var(--black); }
    .z-cta { background: var(--black); color: var(--white); border-radius: 28px; padding: 44px; display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px; }
    .z-cta h2 { color: var(--white); margin: 0 0 8px; }
    .z-cta p { color: rgba(255,255,255,0.72); font-size: 16px; max-width: 560px; }
    .z-cta .btn-outline { background: transparent; color: var(--white); border-color: rgba(255,255,255,0.3); }
    .z-cta .btn-outline:hover { border-color: var(--white); }
    .z-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; }
    .z-card { display: flex; flex-direction: column; background: var(--white); border: 1px solid var(--grey-200); border-radius: 24px; padding: 26px; transition: border-color .2s, transform .2s; }
    .z-card:hover { border-color: var(--black); transform: translateY(-3px); }
    .z-code { font-size: 40px; font-weight: 800; letter-spacing: -1.5px; color: var(--accent); line-height: 1; margin-bottom: 12px; }
    .z-card h2 { font-size: 20px; font-weight: 700; margin-bottom: 8px; }
    .z-card p { font-size: 14px; color: var(--grey-700); line-height: 1.6; flex: 1; }
    .z-card span { margin-top: 14px; font-size: 14px; font-weight: 700; color: var(--accent); }
    @media (max-width: 1024px) { .z-grid { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 768px) {
      .z-grid { grid-template-columns: minmax(0, 1fr); }
      .z-cta { padding: 32px 22px; }
      .z-cta .note-actions .btn { flex: 1 1 100%; }
      .z-bati p { font-size: 16px; }
    }
  </style>
'''


def head(titre, description, url, extra_ld, courant=None):
    nav = ''.join(f'      <a href="{h}">{t}</a>\n' for h, t in NAV)
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="theme-color" content="#ea5b1f" />
  <!-- Page générée par tools/build_zones.py : modifier tools/zones_contenu.py puis relancer le script. -->

  <title>{e(titre)}</title>
  <meta name="description" content="{e(description)}" />
  <meta name="author" content="Groupe Cohesif" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="{url}" />
  <meta name="geo.region" content="FR-{courant or 'IDF'}" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cohesif BTP" />
  <meta property="og:title" content="{e(titre)}" />
  <meta property="og:description" content="{e(description)}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:image" content="{SITE}og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{e(titre)}" />
  <meta name="twitter:description" content="{e(description)}" />
  <meta name="twitter:image" content="{SITE}og-image.jpg" />

{extra_ld}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="stylesheet" href="services.css" />
  <link rel="stylesheet" href="menu.css" />
{STYLE}</head>
<body>

<header>
  <div class="header-inner">
    <a href="index.html" class="logo"><img src="img/028d2fd4f4.webp" alt="Cohesif BTP — accueil" /></a>
    <nav aria-label="Navigation principale">
{nav}      <a href="tel:+33756855727">07 56 85 57 27</a>
      <a href="index.html#devis" class="btn btn-dark header-cta">Devis gratuit →</a>
    </nav>
    <a href="tel:+33756855727" class="header-tel">{TEL_SVG}Appeler</a>
  </div>
</header>
'''


def fin():
    return FOOTER + '''
<div class="mobile-bar">
  <a href="tel:+33756855727">Appeler</a>
  <a href="index.html#devis" class="mb-devis">Devis gratuit →</a>
</div>

<script src="menu.js" defer></script>
</body>
</html>
'''


def cta(z=None):
    titre = f'Un projet {z["dans"]} ?' if z else 'Un projet en Île-de-France ?'
    return f'''
<section class="svc-section" style="padding-top:24px">
  <div class="svc-inner z-cta">
    <div>
      <h2>{e(titre)}</h2>
      <p>Visite et diagnostic sur place, devis détaillé sous 48h, gratuit et sans engagement. Un seul interlocuteur du devis à la réception.</p>
    </div>
    <div class="note-actions">
      <a href="index.html#devis" class="btn btn-accent btn-large">Demander un devis gratuit →</a>
      <a href="tel:+33756855727" class="btn btn-outline btn-large">{TEL_SVG}07 56 85 57 27</a>
    </div>
  </div>
</section>
'''


def page_zone(z):
    url = f'{SITE}{z["slug"]}.html'
    service_ld = ld({
        '@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service',
        'name': f'Travaux du bâtiment {z["dans"]} ({z["code"]})', 'description': z['description'], 'url': url,
        'serviceType': 'Toiture, ravalement, rénovation, gros œuvre, isolation, désamiantage',
        'provider': {'@type': 'GeneralContractor', '@id': SITE + '#organization', 'name': 'Cohesif BTP', 'url': SITE,
                     'telephone': '+33756855727', 'email': 'cohesifbtp@gmail.com',
                     'address': {'@type': 'PostalAddress', 'streetAddress': '200 rue de la Croix Nivert',
                                 'addressLocality': 'Paris', 'postalCode': '75015', 'addressCountry': 'FR'}},
        'areaServed': [{'@type': 'AdministrativeArea', 'name': f'{z["nom"]} ({z["code"]})'}]
                      + [{'@type': 'City', 'name': v} for v in z['villes'] if not v.startswith('Paris ')],
    })
    faq_ld = ld({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for q, r in z['faq']]})
    bc = [('Accueil', ''), ('Zones d\'intervention', 'zones-intervention.html'), (f'{z["nom"]} ({z["code"]})', z['slug'] + '.html')]
    cartes = ''.join(
        f'<a class="svc-card" href="{SERVICES[k][0]}"><div class="svc-icon"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONES[SERVICES[k][2]]}</svg></div>'
        f'<h3>{e(SERVICES[k][1])}</h3><p>{e(t)}</p><span class="z-more">Découvrir →</span></a>' for k, t in z['services'].items())
    guides = ''.join(f'<a href="{s}.html" class="btn btn-accent" style="white-space:normal">{e(GUIDE[s]["h1"].split(" : ")[0])} →</a>' for s in z['guides'])
    autres = ''.join(f'<a href="{o["slug"]}.html">{e(o["nom"])} ({o["code"]})</a>' for o in ZONES if o['slug'] != z['slug'])
    return (head(z['titre'], z['description'], url, service_ld + breadcrumb_ld(bc) + faq_ld, z['code'])
            + crumbs([('Accueil', 'index.html'), ('Zones d\'intervention', 'zones-intervention.html'), (f'{z["nom"]} ({z["code"]})', None)]) + f'''
<main>

<section class="svc-hero">
  <div>
    <div class="svc-badge">{e(z['nom'])} ({z['code']}) · Siège à Paris 15e</div>
    <h1>{z['h1']}</h1>
    <p class="svc-lead">{e(z['lead'])}</p>
    <div class="svc-actions">
      <a href="index.html#devis" class="btn btn-accent btn-large">Demander un devis gratuit →</a>
      <a href="tel:+33756855727" class="btn btn-outline btn-large">{TEL_SVG}07 56 85 57 27</a>
    </div>
    <ul class="svc-trust"><li>Visite et devis gratuits</li><li>Devis détaillé sous 48h</li><li>Un interlocuteur unique</li><li>Démarches prises en charge</li></ul>
  </div>
  <div class="note-card">
    <h3>Nos métiers {e(z['dans'])}</h3>
    <ul>{''.join(f'<li>{e(SERVICES[k][1])}</li>' for k in z['services'])}</ul>
    <div class="note-actions">
      <a href="index.html#devis" class="btn btn-accent">Devis sous 48h →</a>
      <a href="https://wa.me/33756855727" target="_blank" rel="noopener" class="btn btn-outline">WhatsApp</a>
    </div>
  </div>
</section>

<section class="svc-section alt" id="bati">
  <div class="svc-inner">
    <span class="tag">Le bâti {e(z['dans'])}</span>
    <h2>Connaître le terrain, <span class="accent">c'est déjà bien chiffrer.</span></h2>
    <div class="z-bati" style="margin-top:28px">{''.join(f'<p>{e(p)}</p>' for p in z['bati'])}</div>
  </div>
</section>

<section class="svc-section" id="services">
  <div class="svc-inner">
    <span class="tag">Nos services</span>
    <h2>Tous vos travaux {e(z['dans'])}, <span class="accent">avec une seule entreprise.</span></h2>
    <div class="svc-grid" style="margin-top:40px">{cartes}</div>
  </div>
</section>

<section class="svc-section alt" id="vigilance">
  <div class="svc-inner split">
    <div>
      <span class="tag">Points de vigilance</span>
      <h2>Ce qu'il faut savoir <span class="accent">avant vos travaux.</span></h2>
      <ul class="check-list" style="margin-top:28px">{''.join(f'<li>{e(t)}</li>' for t in z['vigilance'])}</ul>
    </div>
    <div class="note-card">
      <h3>Nos guides pour préparer votre projet</h3>
      <p>Prix au m², autorisations, obligations : tout ce qu'il faut savoir avant de demander vos devis.</p>
      <div class="note-actions" style="flex-direction:column;align-items:stretch">{guides}<a href="aides-financement.html#simulateur" class="btn btn-outline">Simuler mes aides →</a></div>
    </div>
  </div>
</section>

<section class="svc-section" id="villes">
  <div class="svc-inner">
    <span class="tag">{e(z['villes_titre'])}</span>
    <h2>Nous intervenons <span class="accent">{e(z['dans'])}.</span></h2>
    <ul class="z-villes" style="margin-top:28px">{''.join(f'<li>{e(v)}</li>' for v in z['villes'])}</ul>
  </div>
</section>

<section class="svc-section alt" id="faq">
  <div class="svc-inner">
    <span class="tag">Questions fréquentes</span>
    <h2>Vos questions sur nos travaux <span class="accent">{e(z['dans'])}.</span></h2>
    <div class="faq" style="margin-top:40px">{''.join(f'<details{" open" if n == 0 else ""}><summary>{e(q)}</summary><p>{e(r)}</p></details>' for n, (q, r) in enumerate(z['faq']))}</div>
  </div>
</section>
{cta(z)}
<section class="svc-section" style="padding-top:24px;padding-bottom:72px">
  <div class="svc-inner">
    <span class="tag">Nos autres zones d'intervention</span>
    <div class="z-zones" style="margin-top:16px">{autres}<a href="zones-intervention.html">Toutes les zones →</a></div>
  </div>
</section>

</main>
''' + fin())


def page_hub():
    url = SITE + 'zones-intervention.html'
    liste_ld = ld({
        '@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Zones d\'intervention de Cohesif BTP', 'url': url,
        'mainEntity': {'@type': 'ItemList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'url': f'{SITE}{z["slug"]}.html', 'name': f'{z["nom"]} ({z["code"]})'} for i, z in enumerate(ZONES)]}
    })
    bc = [('Accueil', ''), ('Zones d\'intervention', 'zones-intervention.html')]
    cartes = ''.join(f'<a class="z-card" href="{z["slug"]}.html"><div class="z-code">{z["code"]}</div><h2>{e(z["nom"])}</h2>'
                     f'<p>{e(texte(z["h1"]).split(" : ", 1)[1][:1].upper() + texte(z["h1"]).split(" : ", 1)[1][1:])}</p><span>Voir la page →</span></a>' for z in ZONES)
    return (head('Zones d\'intervention : Paris et toute l\'Île-de-France | Cohesif BTP',
                 'Cohesif BTP intervient à Paris et dans toute l\'Île-de-France (92, 93, 94, 78, 91, 95, 77) pour la toiture, le ravalement, la rénovation, le gros œuvre, l\'isolation et le désamiantage, et partout en France sur projet.',
                 url, liste_ld + breadcrumb_ld(bc))
            + crumbs([('Accueil', 'index.html'), ('Zones d\'intervention', None)]) + f'''
<main>

<section class="svc-section" style="padding-top:48px;padding-bottom:40px">
  <div class="svc-inner">
    <div class="svc-badge">Siège : 200 rue de la Croix-Nivert, Paris 15e</div>
    <h1 style="font-size:clamp(36px,5.2vw,60px);font-weight:800;line-height:1.05;letter-spacing:-2px;margin-bottom:20px;max-width:900px">Paris et toute l'Île-de-France, <span class="accent">département par département.</span></h1>
    <p class="svc-desc" style="margin-bottom:0">Chaque territoire a son bâti, ses règles et ses risques : toits en zinc à Paris, meulière en petite couronne, longères en Seine-et-Marne, sols argileux en grande couronne. Choisissez votre département.</p>
  </div>
</section>

<section class="svc-section" style="padding-top:0">
  <div class="svc-inner">
    <div class="z-grid">{cartes}</div>
    <p class="svc-desc" style="margin:40px 0 0">En dehors de l'Île-de-France, nous intervenons aussi partout en France sur projet : <a href="index.html#devis" style="color:var(--accent);font-weight:600">décrivez-nous votre chantier</a>.</p>
  </div>
</section>
{cta()}
</main>
''' + fin())


def main():
    open(os.path.join(ROOT, 'zones-intervention.html'), 'w', encoding='utf-8').write(page_hub())
    pages = [('zones-intervention.html', '0.7')]
    for z in ZONES:
        open(os.path.join(ROOT, z['slug'] + '.html'), 'w', encoding='utf-8').write(page_zone(z))
        pages.append((z['slug'] + '.html', '0.8'))
    maj_sitemaps(pages)
    print(f'{len(ZONES)} pages locales + zones-intervention.html générées, sitemaps à jour.')


if __name__ == '__main__':
    main()
