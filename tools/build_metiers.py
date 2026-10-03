#!/usr/bin/env python3
"""Cohesif BTP — génère les pages métier sans simulateur 3D (rénovation, gros œuvre, désamiantage, isolation).

Contenu dans tools/metiers_contenu.py. Modifier ce fichier puis :
    python3 tools/build_metiers.py
Le script met aussi à jour sitemap.xml et sitemap.txt. Ne pas modifier les pages générées à la main.
Les pages toiture-couverture.html et facade-ravalement.html restent écrites à la main.
"""
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from build_guides import FOOTER, ROOT, SITE, TEL_SVG, breadcrumb_ld, crumbs, e, ld, maj_sitemaps  # noqa: E402
from guides_contenu import MAJ  # noqa: E402
from metiers_contenu import METIERS  # noqa: E402

# Icônes (tracés SVG 24×24, trait)
ICONES = {
    'home': '<path d="M3 11l9-7 9 7v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z"/>',
    'drop': '<path d="M12 3s6 6.5 6 11a6 6 0 0 1-12 0c0-4.5 6-11 6-11z"/>',
    'layers': '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5"/>',
    'bolt': '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>',
    'thermo': '<path d="M14 14.8V5a2 2 0 0 0-4 0v9.8a4 4 0 1 0 4 0z"/>',
    'building': '<rect x="4" y="3" width="16" height="18" rx="1"/><path d="M8 7h2M14 7h2M8 11h2M14 11h2M8 15h2M14 15h2"/>',
    'ruler': '<path d="M3 17L17 3l4 4L7 21z"/><path d="M7 13l2 2M10 10l2 2M13 7l2 2"/>',
    'bricks': '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M3 12h18M9 5v7M15 12v7"/>',
    'shield': '<path d="M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z"/>',
    'tool': '<path d="M14.7 6.3a4 4 0 0 0-5.4 5.4L3 18l3 3 6.3-6.3a4 4 0 0 0 5.4-5.4l-2.6 2.6-2.4-.6-.6-2.4 2.6-2.6z"/>',
    'search': '<circle cx="11" cy="11" r="7"/><path d="M21 21l-5-5"/>',
    'doc': '<path d="M6 3h9l4 4v14H6z"/><path d="M14 3v5h5M9 13h7M9 17h5"/>',
    'truck': '<path d="M3 6h11v10H3zM14 9h4l3 3v4h-7"/><circle cx="7" cy="17.5" r="1.8"/><circle cx="17" cy="17.5" r="1.8"/>',
    'check': '<circle cx="12" cy="12" r="9"/><path d="M8 12l3 3 5-6"/>',
    'roof': '<path d="M2 12L12 4l10 8"/><path d="M5 10v10h14V10"/>',
    'wave': '<path d="M3 12c2-4 4-4 6 0s4 4 6 0 4-4 6 0"/>',
    'wind': '<path d="M3 8h11a3 3 0 1 0-3-3M3 16h15a3 3 0 1 1-3 3M3 12h8"/>',
}
NAV = [('index.html#services', 'Services'), ('toiture-couverture.html', 'Toiture'), ('facade-ravalement.html', 'Façade'),
       ('aides-financement.html', 'Aides'), ('guides.html', 'Guides'), ('boutique.html', 'Boutique')]


def icone(nom):
    return f'<div class="svc-icon"><svg viewBox="0 0 24 24" aria-hidden="true">{ICONES[nom]}</svg></div>'


def texte(html):
    """Texte brut d'un fragment HTML (pour les données structurées)."""
    return re.sub(r'<[^>]+>', '', html)


def page(m):
    url = f'{SITE}{m["slug"]}.html'
    service_ld = ld({
        '@context': 'https://schema.org', '@type': 'Service', '@id': url + '#service',
        'name': m['nom'], 'serviceType': texte(m['h1']), 'description': m['description'], 'url': url,
        'provider': {'@type': 'GeneralContractor', '@id': SITE + '#organization', 'name': 'Cohesif BTP', 'url': SITE,
                     'telephone': '+33756855727', 'email': 'cohesifbtp@gmail.com',
                     'address': {'@type': 'PostalAddress', 'streetAddress': '200 rue de la Croix Nivert',
                                 'addressLocality': 'Paris', 'postalCode': '75015', 'addressCountry': 'FR'}},
        'areaServed': [{'@type': 'City', 'name': 'Paris'}, {'@type': 'AdministrativeArea', 'name': 'Île-de-France'},
                       {'@type': 'Country', 'name': 'France'}],
        'hasOfferCatalog': {'@type': 'OfferCatalog', 'name': m['nom'], 'itemListElement': [
            {'@type': 'Offer', 'itemOffered': {'@type': 'Service', 'name': t}} for _, t, _ in m['prestations']]}
    })
    faq_ld = ld({'@context': 'https://schema.org', '@type': 'FAQPage', 'mainEntity': [
        {'@type': 'Question', 'name': q, 'acceptedAnswer': {'@type': 'Answer', 'text': r}} for q, r in m['faq']]})
    nav = ''.join(f'      <a href="{h}">{t}</a>\n' for h, t in NAV)
    titre_court = texte(m['h1']).split(' : ')[0]
    sc_titre, sc_texte, sc_lien, sc_lien_txt = m['savoir_carte']
    options = ''.join(f'<option value="{e(o)}">{e(o)}</option>' for o in m['form_travaux'])
    return f'''<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light only" />
  <meta name="theme-color" content="#ea5b1f" />
  <!-- Page générée par tools/build_metiers.py : modifier tools/metiers_contenu.py puis relancer le script. -->

  <title>{e(m['titre'])}</title>
  <meta name="description" content="{e(m['description'])}" />
  <meta name="author" content="Groupe Cohesif" />
  <meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1" />
  <link rel="canonical" href="{url}" />
  <meta name="geo.region" content="FR-75" />
  <meta name="geo.placename" content="Paris" />

  <meta property="og:type" content="website" />
  <meta property="og:site_name" content="Cohesif BTP" />
  <meta property="og:title" content="{e(m['titre'])}" />
  <meta property="og:description" content="{e(m['description'])}" />
  <meta property="og:url" content="{url}" />
  <meta property="og:locale" content="fr_FR" />
  <meta property="og:image" content="{SITE}og-image.jpg" />
  <meta name="twitter:card" content="summary_large_image" />
  <meta name="twitter:title" content="{e(m['titre'])}" />
  <meta name="twitter:description" content="{e(m['description'])}" />
  <meta name="twitter:image" content="{SITE}og-image.jpg" />

{service_ld}{breadcrumb_ld([('Accueil', ''), ('Services', 'index.html#services'), (m['nom'], m['slug'] + '.html')])}{faq_ld}
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
  <link rel="icon" type="image/x-icon" href="/favicon.ico" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
  <link rel="stylesheet" href="services.css" />
  <link rel="stylesheet" href="menu.css" />
  <style>
    .svc-hero .note-card {{ position: static; }}
    .note-card ul {{ list-style: none; display: grid; gap: 10px; margin-bottom: 28px; }}
    .note-card li {{ color: rgba(255,255,255,0.85); font-size: 15px; font-weight: 600; padding-left: 28px; position: relative; }}
    .note-card li::before {{ content: '✓'; position: absolute; left: 0; top: 0; width: 19px; height: 19px; border-radius: 50%; background: var(--accent); color: var(--white); font-size: 11px; font-weight: 800; display: flex; align-items: center; justify-content: center; }}
    .svc-card p a, .pro a {{ color: var(--accent); font-weight: 600; }}
    .related {{ grid-template-columns: repeat(3, 1fr); }}
    @media (max-width: 1024px) {{ .related {{ grid-template-columns: 1fr; }} }}
  </style>
</head>
<body>

<header>
  <div class="header-inner">
    <a href="index.html" class="logo"><img src="img/028d2fd4f4.webp" alt="Cohesif BTP — accueil" /></a>
    <nav aria-label="Navigation principale">
{nav}      <a href="tel:+33756855727">07 56 85 57 27</a>
      <a href="#devis" class="btn btn-dark header-cta">Devis gratuit →</a>
    </nav>
    <a href="tel:+33756855727" class="header-tel">{TEL_SVG}Appeler</a>
  </div>
</header>
{crumbs([('Accueil', 'index.html'), ('Services', 'index.html#services'), (m['nom'], None)])}
<main>

<section class="svc-hero">
  <div>
    <div class="svc-badge">{e(m['badge'])}</div>
    <h1>{m['h1']}</h1>
    <p class="svc-lead">{e(m['lead'])}</p>
    <div class="svc-actions">
      <a href="#devis" class="btn btn-accent btn-large">Demander un devis gratuit →</a>
      <a href="tel:+33756855727" class="btn btn-outline btn-large">{TEL_SVG}07 56 85 57 27</a>
    </div>
    <ul class="svc-trust">{''.join(f'<li>{e(t)}</li>' for t in m['trust'])}</ul>
  </div>
  <div class="note-card">
    <h3>{e(m['carte_titre'])}</h3>
    <ul>{''.join(f'<li>{e(t)}</li>' for t in m['carte'])}</ul>
    <div class="note-actions">
      <a href="#devis" class="btn btn-accent">Devis sous 48h →</a>
      <a href="https://wa.me/33756855727" target="_blank" rel="noopener" class="btn btn-outline">WhatsApp</a>
    </div>
  </div>
</section>

<section class="svc-section alt" id="prestations">
  <div class="svc-inner">
    <span class="tag">Nos prestations</span>
    <h2>{m['prestations_titre']}</h2>
    <p class="svc-desc">{e(m['prestations_desc'])}</p>
    <div class="svc-grid">
{''.join(f'      <article class="svc-card">{icone(i)}<h3>{e(t)}</h3><p>{d}</p></article>{chr(10)}' for i, t, d in m['prestations'])}    </div>
  </div>
</section>

<section class="svc-section" id="savoir">
  <div class="svc-inner split">
    <div>
      <span class="tag">À savoir</span>
      <h2>{m['savoir_titre']}</h2>
      <ul class="check-list" style="margin-top:28px">{''.join(f'<li>{e(t)}</li>' for t in m['savoir'])}</ul>
    </div>
    <div class="note-card">
      <h3>{e(sc_titre)}</h3>
      <p>{e(sc_texte)}</p>
      <div class="note-actions">
        <a href="{sc_lien}" class="btn btn-accent">{e(sc_lien_txt)} →</a>
        <a href="#devis" class="btn btn-outline">Demander un devis</a>
      </div>
    </div>
  </div>
</section>

<section class="svc-section alt" id="methode">
  <div class="svc-inner">
    <span class="tag">Notre méthode</span>
    <h2>Un chantier clair, <span class="accent">du devis à la réception.</span></h2>
    <p class="svc-desc">Un déroulé écrit, un prix détaillé, un interlocuteur qui répond.</p>
    <ol class="steps">{''.join(f'<li class="step"><h3>{e(t)}</h3><p>{e(d)}</p></li>' for t, d in m['etapes'])}</ol>
  </div>
</section>

<section class="svc-section" id="pourquoi">
  <div class="svc-inner">
    <span class="tag">Pourquoi Cohesif BTP</span>
    <h2>Une entreprise générale, <span class="accent">un seul interlocuteur.</span></h2>
    <div class="pros" style="margin-top:40px">{''.join(f'<div class="pro"><h3>{e(t)}</h3><p>{e(d)}</p></div>' for t, d in m['pros'])}</div>
  </div>
</section>

<section class="svc-section alt" id="faq">
  <div class="svc-inner">
    <span class="tag">Questions fréquentes</span>
    <h2>Vos questions sur <span class="accent">{e(m['nom'].lower())}.</span></h2>
    <div class="faq" style="margin-top:40px">{''.join(f'<details{" open" if n == 0 else ""}><summary>{e(q)}</summary><p>{e(r)}</p></details>' for n, (q, r) in enumerate(m['faq']))}</div>
  </div>
</section>

<section class="svc-section" id="devis">
  <div class="svc-inner devis-grid">
    <div class="devis-info">
      <span class="tag">Devis gratuit</span>
      <h2>Parlez-nous de <span class="accent">votre projet.</span></h2>
      <p>Décrivez votre besoin en 2 minutes. Nous vous recontactons pour organiser la visite et vous remettons un devis détaillé sous 48h, sans engagement.</p>
      <a href="tel:+33756855727" class="contact-block">
        <div class="contact-icon">{TEL_SVG}</div>
        <div><div class="contact-label">Téléphone</div><div class="contact-value">07 56 85 57 27</div></div>
      </a>
      <a href="https://wa.me/33756855727" target="_blank" rel="noopener" class="contact-block">
        <div class="contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z"/></svg></div>
        <div><div class="contact-label">WhatsApp · envoyez vos photos</div><div class="contact-value">Écrire sur WhatsApp →</div></div>
      </a>
      <a href="mailto:cohesifbtp@gmail.com" class="contact-block">
        <div class="contact-icon"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 5h18v14H3z"/><path d="M3 6l9 7 9-7"/></svg></div>
        <div><div class="contact-label">Email</div><div class="contact-value">cohesifbtp@gmail.com</div></div>
      </a>
    </div>

    <div class="devis-form">
      <p class="devis-form-title">Demande de devis · {e(m['nom'])}</p>
      <p class="devis-form-sub">Gratuit et sans engagement · Réponse sous 48h</p>
      <div class="form-success" id="form-success" role="status">✓ Demande envoyée ! Nous vous recontactons sous 48h.</div>
      <div class="form-error" id="form-error" role="alert">L'envoi n'a pas abouti. Appelez-nous au 07 56 85 57 27 ou écrivez à cohesifbtp@gmail.com.</div>
      <form id="devis-form" action="https://formspree.io/f/mzdnndna" method="POST">
        <div class="form-row">
          <div class="form-field"><label for="prenom">Prénom *</label><input type="text" id="prenom" name="prenom" autocomplete="given-name" required /></div>
          <div class="form-field"><label for="nom">Nom *</label><input type="text" id="nom" name="nom" autocomplete="family-name" required /></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label for="telephone">Téléphone *</label><input type="tel" id="telephone" name="telephone" autocomplete="tel" required /></div>
          <div class="form-field"><label for="email">Email *</label><input type="email" id="email" name="email" autocomplete="email" required /></div>
        </div>
        <div class="form-row">
          <div class="form-field"><label for="cp">Code postal du chantier *</label><input type="text" id="cp" name="code_postal" inputmode="numeric" autocomplete="postal-code" required /></div>
          <div class="form-field">
            <label for="batiment">Type de bâtiment</label>
            <select id="batiment" name="batiment"><option value="appartement">Appartement</option><option value="maison">Maison</option><option value="immeuble">Immeuble / copropriété</option><option value="professionnel">Local professionnel</option></select>
          </div>
        </div>
        <div class="form-field">
          <label for="travaux">Travaux souhaités *</label>
          <select id="travaux" name="travaux" required><option value="">— Sélectionnez —</option>{options}</select>
        </div>
        <div class="form-field"><label for="message">Votre projet</label><textarea id="message" name="message" placeholder="{e(m['form_placeholder'])}"></textarea></div>
        <input type="hidden" name="service" value="{e(m['service'])}" />
        <input type="hidden" name="_subject" value="Demande de devis {e(m['nom'].upper())} – Cohesif BTP" />
        <button type="submit" class="btn btn-dark btn-large form-submit">Recevoir mon devis gratuit →</button>
        <p class="form-note">Vos données servent uniquement à traiter votre demande. <a href="politique-confidentialite.html">Politique de confidentialité</a>.</p>
      </form>
    </div>
  </div>
</section>

<section class="svc-section alt" style="padding-top:72px;padding-bottom:72px">
  <div class="svc-inner">
    <span class="tag">Pour aller plus loin</span>
    <div class="related" style="margin-top:20px">{''.join(f'<a href="{h}"><div>{e(t)}<span>{e(d)}</span></div></a>' for h, t, d in m['liens'])}</div>
  </div>
</section>

</main>
{FOOTER}
<div class="mobile-bar">
  <a href="tel:+33756855727">Appeler</a>
  <a href="#devis" class="mb-devis">Devis gratuit →</a>
</div>

<script src="services.js"></script>
<script src="menu.js" defer></script>
</body>
</html>
'''


def main():
    pages = []
    for m in METIERS:
        open(os.path.join(ROOT, m['slug'] + '.html'), 'w', encoding='utf-8').write(page(m))
        pages.append((m['slug'] + '.html', '0.9'))
    maj_sitemaps(pages)
    print(f'{len(METIERS)} pages métier générées, sitemaps à jour.')


if __name__ == '__main__':
    main()
