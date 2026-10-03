#!/usr/bin/env python3
"""Cohesif BTP — génère la rubrique Guides : guides.html et une page guide-*.html par article.

Contenu dans tools/guides_contenu.py. Ajouter un guide = ajouter une entrée à GUIDES, puis :
    python3 tools/build_guides.py
Le script met aussi à jour sitemap.xml et sitemap.txt. Ne pas modifier les pages générées à la main.
"""
import html
import json
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from guides_contenu import GUIDES, MAJ  # noqa: E402

SITE = 'https://cohesifbtp.fr/'
MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
TEL_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A17 17 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>'
e = lambda s: html.escape(s, quote=True)


def date_fr(iso):
    a, m, j = iso.split('-')
    return f'{int(j)} {MOIS[int(m) - 1]} {a}'


def ld(obj):
    return '  <script type="application/ld+json">\n' + json.dumps(obj, ensure_ascii=False, indent=2) + '\n  </script>\n'


def head(titre, description, url, extra_ld):
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="theme-color" content="#ea5b1f" />
  <!-- Page générée par tools/build_guides.py : modifier tools/guides_contenu.py puis relancer le script. -->

  <title>{e(titre)}</title>
  <meta name="description" content="{e(description)}" />
  <meta name="author" content="Groupe Cohesif" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="{url}" />

  <meta property="og:type" content="article" />
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
  <link rel="stylesheet" href="guides.css" />
  <link rel="stylesheet" href="menu.css" />
</head>
<body>

<header>
  <div class="header-inner">
    <a href="index.html" class="logo"><img src="img/028d2fd4f4.webp" alt="Cohesif BTP — accueil" /></a>
    <nav aria-label="Navigation principale">
      <a href="index.html#services">Services</a>
      <a href="toiture-couverture.html">Toiture</a>
      <a href="facade-ravalement.html">Façade</a>
      <a href="aides-financement.html">Aides</a>
      <a href="guides.html" aria-current="page">Guides</a>
      <a href="boutique.html">Boutique</a>
      <a href="tel:+33756855727">07 56 85 57 27</a>
      <a href="index.html#devis" class="btn btn-dark header-cta">Devis gratuit →</a>
    </nav>
    <a href="tel:+33756855727" class="header-tel">{TEL_SVG}Appeler</a>
  </div>
</header>
'''


def crumbs(items):
    lis = ''.join(f'<li><a href="{h}">{e(t)}</a></li>' if h else f'<li aria-current="page">{e(t)}</li>' for t, h in items)
    return f'\n<nav class="crumbs" aria-label="Fil d\'Ariane">\n  <ol>{lis}</ol>\n</nav>\n'


def breadcrumb_ld(items):
    return ld({
        '@context': 'https://schema.org', '@type': 'BreadcrumbList',
        'itemListElement': [{'@type': 'ListItem', 'position': i + 1, 'name': t, 'item': SITE + (h or '')}
                            for i, (t, h) in enumerate(items)]
    })


FOOTER = '''
<footer>
  <div class="footer-inner">
    <div class="footer-top">
      <div class="footer-brand">
        <a href="index.html"><img loading="lazy" src="img/028d2fd4f4.webp" alt="Cohesif BTP" /></a>
        <p>Construire mieux, optimiser chaque projet, livrer dans les délais. Une seule entreprise pour tout gérer.</p>
      </div>
      <div class="footer-col">
        <h5>Services</h5>
        <a href="toiture-couverture.html">Toiture & couverture</a>
        <a href="facade-ravalement.html">Façade & ravalement</a>
        <a href="aides-financement.html">Aides & financement</a>
        <a href="guides.html">Guides & conseils</a>
        <a href="renovation-appartement-maison.html">Rénovation complète</a>
        <a href="gros-oeuvre-maconnerie.html">Gros œuvre & maçonnerie</a>
        <a href="isolation-combles-murs.html">Isolation</a>
        <a href="desamiantage.html">Désamiantage</a>
        <a href="boutique.html">Boutique matériel</a>
      </div>
      <div class="footer-col">
        <h5>Contact</h5>
        <a href="tel:+33756855727">07 56 85 57 27</a>
        <a href="mailto:cohesifbtp@gmail.com">cohesifbtp@gmail.com</a>
        <p>200 rue de la Croix Nivert<br/>75015 Paris</p>
      </div>
      <div class="footer-col">
        <h5>Zones d'intervention</h5>
        <p>Partout en France</p>
        <p>Siège : Paris (75)</p>
        <p>Île-de-France, Lyon, Lille, Marseille, Bordeaux, Toulouse, Nantes…</p>
      </div>
    </div>
    <div class="footer-bottom">
      <p>© 2026 Cohesif BTP — Membre du Groupe Cohesif</p>
      <div>
        <a href="mentions-legales.html">Mentions légales</a>
        <a href="politique-confidentialite.html">Confidentialité</a>
        <a href="cgv.html">CGV</a>
      </div>
    </div>
  </div>
</footer>
'''


def fin(devis):
    return FOOTER + f'''
<div class="mobile-bar">
  <a href="tel:+33756855727">Appeler</a>
  <a href="{devis}" class="mb-devis">Devis gratuit →</a>
</div>

<script src="menu.js" defer></script>
</body>
</html>
'''


def carte(g, niveau='h3'):
    return (f'<a class="g-card" href="{g["slug"]}.html"><span class="g-kicker">{e(g["categorie"])} · {g["lecture"]} min</span>'
            f'<{niveau}>{e(g["h1"])}</{niveau}><p>{e(g["description"])}</p><span class="g-more">Lire le guide →</span></a>')


def page_guide(g):
    url = f'{SITE}{g["slug"]}.html'
    service_url, service_nom = g['service']
    devis = f'{service_url}#devis'
    toc = re.findall(r'<h2 id="([^"]+)">(.*?)</h2>', g['corps'])
    nav = [('Accueil', 'index.html'), ('Guides', 'guides.html'), (g['h1'], None)]
    article_ld = ld({
        '@context': 'https://schema.org', '@type': 'Article', '@id': url + '#article',
        'headline': g['h1'], 'description': g['description'], 'inLanguage': 'fr-FR',
        'datePublished': MAJ, 'dateModified': MAJ, 'mainEntityOfPage': url,
        'image': SITE + 'og-image.jpg',
        'author': {'@type': 'Organization', '@id': SITE + '#organization', 'name': 'Cohesif BTP', 'url': SITE},
        'publisher': {'@type': 'Organization', '@id': SITE + '#organization', 'name': 'Cohesif BTP',
                      'logo': {'@type': 'ImageObject', 'url': SITE + 'logo.png'}}
    })
    faq_ld = ld({
        '@context': 'https://schema.org', '@type': 'FAQPage',
        'mainEntity': [{'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for q, r in g['faq']]
    })
    autres = [x for x in GUIDES if x['slug'] != g['slug']]
    # d'abord les guides de la même catégorie, puis les autres
    autres.sort(key=lambda x: x['categorie'] != g['categorie'])
    faq = ''.join(f'<details{" open" if i == 0 else ""}><summary>{e(q)}</summary><p>{e(r)}</p></details>' for i, (q, r) in enumerate(g['faq']))
    return (head(g['titre'], g['description'], url, article_ld + breadcrumb_ld([('Accueil', ''), ('Guides', 'guides.html'), (g['h1'], g['slug'] + '.html')]) + faq_ld)
            + crumbs(nav) + f'''
<main>
<article class="g-article">
  <div class="g-meta"><span class="g-kicker">{e(g['categorie'])}</span><span>Mis à jour le {date_fr(MAJ)}</span><span>{g['lecture']} min de lecture</span></div>
  <h1>{e(g['h1'])}</h1>
  <p class="g-lead">{e(g['chapeau'])}</p>
  <nav class="g-toc" aria-label="Sommaire"><p>Sommaire</p><ol>{''.join(f'<li><a href="#{i}">{t}</a></li>' for i, t in toc)}<li><a href="#faq">Questions fréquentes</a></li></ol></nav>
  <div class="g-body">
{g['corps'].strip()}

<div class="g-cta">
  <h2>Un projet de {e(service_nom.split(' & ')[0].lower())} ?</h2>
  <p>Visite et diagnostic sur place, devis détaillé sous 48h, gratuit et sans engagement. Un seul interlocuteur du devis à la réception.</p>
  <div class="note-actions">
    <a href="{devis}" class="btn btn-accent btn-large">Devis gratuit sous 48h →</a>
    <a href="tel:+33756855727" class="btn btn-outline btn-large">{TEL_SVG}07 56 85 57 27</a>
  </div>
</div>

<h2 id="faq">Questions fréquentes</h2>
<div class="faq">{faq}</div>
<p class="g-sources">Sources : {' '.join(e(s) for s in g['sources'])} Informations générales, à confirmer selon votre situation lors de la visite.</p>
  </div>
</article>

<section class="svc-section alt" style="padding-top:72px;padding-bottom:72px">
  <div class="svc-inner">
    <span class="tag">À lire aussi</span>
    <div class="g-list" style="margin-top:20px">{''.join(carte(x) for x in autres[:3])}</div>
    <div class="related" style="margin-top:16px">
      <a href="{service_url}"><div>{e(service_nom)}<span>Nos prestations et le devis gratuit</span></div></a>
      <a href="guides.html"><div>Tous nos guides<span>Prix, démarches, aides et conseils</span></div></a>
    </div>
  </div>
</section>
</main>
''' + fin(devis))


FILTRE_JS = '''<script>
  // Filtre des guides par thème
  (function () {
    var box = document.getElementById('g-filtres');
    box.addEventListener('click', function (ev) {
      var b = ev.target.closest('button');
      if (!b) return;
      box.querySelectorAll('button').forEach(function (x) { x.setAttribute('aria-pressed', String(x === b)); });
      document.querySelectorAll('.g-card[data-cat]').forEach(function (c) { c.hidden = !!b.dataset.cat && c.dataset.cat !== b.dataset.cat; });
    });
  })();
</script>
'''


def page_index():
    url = SITE + 'guides.html'
    cats = []
    for g in GUIDES:
        if g['categorie'] not in cats:
            cats.append(g['categorie'])
    items = [('Accueil', ''), ('Guides & conseils', 'guides.html')]
    liste_ld = ld({
        '@context': 'https://schema.org', '@type': 'CollectionPage', 'name': 'Guides & conseils travaux',
        'url': url, 'inLanguage': 'fr-FR',
        'mainEntity': {'@type': 'ItemList', 'itemListElement': [
            {'@type': 'ListItem', 'position': i + 1, 'url': f'{SITE}{g["slug"]}.html', 'name': g['h1']} for i, g in enumerate(GUIDES)]}
    })
    grille = ''.join(carte(g, 'h2').replace('<a class="g-card"', f'<a class="g-card" data-cat="{e(g["categorie"])}"', 1) for g in GUIDES)
    filtres = '<button type="button" aria-pressed="true" data-cat="">Tous</button>' + ''.join(
        f'<button type="button" aria-pressed="false" data-cat="{e(c)}">{e(c)}</button>' for c in cats)
    return (head('Guides travaux : prix, démarches et aides (toiture, façade) | Cohesif BTP',
                 'Guides pratiques Cohesif BTP : prix d\'un ravalement et d\'une toiture au m², autorisations de travaux, ravalement obligatoire à Paris, isolation par l\'extérieur, éviter les arnaques.',
                 url, liste_ld + breadcrumb_ld(items))
            + crumbs([('Accueil', 'index.html'), ('Guides & conseils', None)]) + f'''
<main>
<section class="g-hero">
  <div class="svc-badge">Guides & conseils · Mis à jour le {date_fr(MAJ)}</div>
  <h1>Prix, démarches, aides : <span class="accent">tout comprendre avant vos travaux.</span></h1>
  <p>Des guides clairs, écrits par nos équipes, pour préparer votre projet de toiture ou de façade, comparer les devis et éviter les mauvaises surprises.</p>
  <div class="g-cats" id="g-filtres" role="group" aria-label="Filtrer par thème">{filtres}<a href="aides-financement.html#simulateur">Simulateur d'aides →</a></div>
</section>
<section class="svc-section" style="padding-top:16px">
  <div class="svc-inner"><div class="g-list">{grille}</div></div>
</section>
</main>
''' + FILTRE_JS + fin('index.html#devis'))


def maj_sitemaps(pages):
    xml_p = os.path.join(ROOT, 'sitemap.xml')
    xml = open(xml_p, encoding='utf-8').read()
    txt_p = os.path.join(ROOT, 'sitemap.txt')
    txt = open(txt_p, encoding='utf-8').read()
    for p, prio in pages:
        loc = SITE + p
        bloc = f'  <url>\n    <loc>{loc}</loc>\n    <lastmod>{MAJ}</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>{prio}</priority>\n  </url>\n'
        exist = re.search(r'  <url>\n    <loc>' + re.escape(loc) + r'</loc>\n.*?</url>\n', xml, re.S)
        xml = xml.replace(exist.group(0), bloc) if exist else xml.replace('</urlset>', bloc + '</urlset>')
        if loc + '\n' not in txt:
            txt = txt.rstrip('\n') + '\n' + loc + '\n'
    open(xml_p, 'w', encoding='utf-8').write(xml)
    open(txt_p, 'w', encoding='utf-8').write(txt)


def main():
    pages = [('guides.html', '0.8')]
    open(os.path.join(ROOT, 'guides.html'), 'w', encoding='utf-8').write(page_index())
    for g in GUIDES:
        open(os.path.join(ROOT, g['slug'] + '.html'), 'w', encoding='utf-8').write(page_guide(g))
        pages.append((g['slug'] + '.html', '0.7'))
    maj_sitemaps(pages)
    print(f'{len(GUIDES)} guides + guides.html générés, sitemaps à jour.')


if __name__ == '__main__':
    main()
