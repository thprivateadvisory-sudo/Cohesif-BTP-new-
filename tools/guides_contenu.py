# Cohesif BTP — contenu des guides (lu par tools/build_guides.py)
# Chaque guide : slug, titre (balise <title>), h1, description, chapeau, catégorie, date, durée de lecture,
# service lié (page + libellé), corps HTML (les <h2 id="…"> forment le sommaire), FAQ, sources.
# Les prix sont des fourchettes indicatives : les garder prudentes et les revoir chaque année.

MAJ = '2026-10-03'

GUIDES = [
  {
    'slug': 'guide-prix-ravalement-facade-paris',
    'categorie': 'Façade',
    'titre': 'Prix d\'un ravalement de façade à Paris en 2026 : coût au m² | Cohesif BTP',
    'h1': 'Prix d\'un ravalement de façade à Paris en 2026 : combien coûte le m² ?',
    'description': 'Combien coûte un ravalement de façade à Paris en 2026 ? Prix au m² selon la finition (peinture, enduit, pierre de taille, ITE), échafaudage, aides et conseils pour comparer les devis.',
    'chapeau': 'De 25 €/m² pour une simple remise en peinture à plus de 200 €/m² pour une façade en pierre de taille : le prix d\'un ravalement varie du simple au décuple. Voici les fourchettes constatées à Paris et en Île-de-France, et ce qui fait réellement grimper la facture.',
    'lecture': 7,
    'service': ('facade-ravalement.html', 'Façade & ravalement'),
    'corps': '''
<h2 id="fourchettes">Les prix au m² selon le type de ravalement</h2>
<p>Le prix d'un ravalement dépend d'abord de ce qu'on fait à la façade. Les montants ci-dessous sont des fourchettes indicatives, fourniture et pose comprises, hors échafaudage particulier, constatées à Paris et en Île-de-France en 2026.</p>
<div class="g-table"><table>
<thead><tr><th>Type de ravalement</th><th>Ce qui est fait</th><th>Prix indicatif</th></tr></thead>
<tbody>
<tr><td>Remise en peinture</td><td>Nettoyage, rebouchage léger, deux couches de peinture façade</td><td>25 à 50 €/m²</td></tr>
<tr><td>Ravalement courant</td><td>Nettoyage, traitement des fissures, enduit ou peinture</td><td>50 à 120 €/m²</td></tr>
<tr><td>Enduit traditionnel ou à la chaux</td><td>Piquage de l'ancien enduit, enduit multicouche</td><td>60 à 130 €/m²</td></tr>
<tr><td>Pierre de taille (haussmannien)</td><td>Nettoyage doux, ragréage, remplacement de pierres, patine</td><td>120 à 260 €/m²</td></tr>
<tr><td>Ravalement + isolation par l'extérieur</td><td>Isolant collé ou chevillé, enduit mince ou bardage</td><td>120 à 250 €/m²</td></tr>
</tbody></table></div>
<p class="g-note">Fourchettes indicatives HT, pour comparer des devis. Seule une visite permet un prix ferme.</p>

<h2 id="facteurs">Ce qui fait varier le prix</h2>
<h3>L'état de la façade</h3>
<p>Une façade simplement encrassée se nettoie et se repeint. Des fissures structurelles, un enduit qui sonne creux ou des pierres éclatées demandent un piquage, des agrafes ou des remplacements : c'est souvent là que se joue l'écart entre deux devis.</p>
<h3>L'échafaudage et l'accès</h3>
<p>À Paris, l'échafaudage pèse lourd : montage, location au mois, filet de protection, et le plus souvent une <strong>autorisation d'occupation du domaine public</strong> à demander à la Ville quand il est posé sur le trottoir. Selon la hauteur et la durée du chantier, il représente couramment 10 à 25 % du budget.</p>
<h3>Les modénatures et les éléments à reprendre</h3>
<p>Corniches, balcons, garde-corps en fer forgé, appuis de fenêtres, zinguerie : chaque élément décoratif se traite à part et se chiffre au mètre linéaire ou à l'unité.</p>
<h3>Les contraintes administratives</h3>
<p>À Paris, le ravalement passe par une <a href="guide-autorisation-travaux-toiture-facade.html">déclaration préalable</a>, avec l'avis de l'Architecte des Bâtiments de France dans les secteurs protégés, qui peut imposer une teinte, une technique ou un matériau.</p>

<h2 id="exemples">Exemples de budgets</h2>
<ul>
<li><strong>Pavillon de 120 m² de façade</strong>, enduit en bon état à repeindre : environ 4 000 à 7 000 € HT, échafaudage compris.</li>
<li><strong>Maison de 150 m² de façade</strong>, enduit fissuré à reprendre entièrement : environ 10 000 à 18 000 € HT.</li>
<li><strong>Immeuble parisien en pierre de taille</strong>, 600 m² sur rue : souvent 90 000 à 150 000 € HT, à répartir entre les copropriétaires selon leurs tantièmes.</li>
</ul>
<p class="g-note">Ordres de grandeur, à affiner sur devis.</p>

<h2 id="aides">Aides et TVA réduite</h2>
<p>Un ravalement « simple » (nettoyage, enduit, peinture) d'un logement de plus de 2 ans bénéficie de la <strong>TVA à 10 %</strong>, mais pas des primes énergie. S'il est couplé à une <a href="guide-isolation-exterieure-ite.html">isolation par l'extérieur</a>, la TVA passe à 5,5 % et la prime CEE ainsi que l'éco-prêt à taux zéro deviennent possibles. Depuis 2026, MaPrimeRénov' ne finance plus l'isolation des murs qu'au sein d'une rénovation d'ampleur.</p>
<p>Estimez vos aides en une minute avec notre <a href="aides-financement.html?travaux=ite#simulateur">simulateur d'aides</a>.</p>

<h2 id="devis">Comment comparer les devis</h2>
<ul>
<li><strong>Même surface</strong> : vérifiez que les devis comptent les mêmes m² (ouvertures déduites ou non).</li>
<li><strong>Postes détaillés</strong> : échafaudage, nettoyage, traitement des fissures, enduit ou peinture, éléments décoratifs, zinguerie, nettoyage de fin de chantier.</li>
<li><strong>Produits nommés</strong> : marque et gamme de l'enduit ou de la peinture, nombre de couches.</li>
<li><strong>Démarches incluses</strong> : déclaration préalable, autorisation de voirie, protection des abords.</li>
<li><strong>Assurance décennale</strong> : l'attestation doit être jointe au devis.</li>
</ul>
<div class="g-box"><p class="g-box-title">Le bon réflexe</p><p>Un devis nettement moins cher que les autres oublie presque toujours un poste : échafaudage sous-estimé, fissures « traitées » d'un coup de peinture, pas de reprise des corniches. Comparez poste par poste, pas seulement le total.</p></div>
''',
    'faq': [
      ('Quel est le prix moyen d\'un ravalement de façade à Paris ?', 'Pour un ravalement courant (nettoyage, traitement des fissures, enduit ou peinture), comptez en général 50 à 120 € HT par m² à Paris. Une simple remise en peinture démarre vers 25 €/m², tandis qu\'une façade en pierre de taille dépasse souvent 120 à 260 €/m².'),
      ('L\'échafaudage est-il compris dans le prix au m² ?', 'Pas toujours. À Paris, l\'échafaudage représente couramment 10 à 25 % du budget et peut nécessiter une autorisation d\'occupation du domaine public. Vérifiez qu\'il figure bien comme un poste du devis.'),
      ('Un ravalement donne-t-il droit à des aides ?', 'Un ravalement simple bénéficie de la TVA à 10 % dans un logement de plus de 2 ans. Couplé à une isolation par l\'extérieur, il ouvre droit à la TVA à 5,5 %, à la prime CEE et à l\'éco-prêt à taux zéro.'),
    ],
    'sources': ['Fourchettes recoupées à partir des guides de prix publiés en 2026 (Travaux.com, prix-travaux-m2.com, renovationettravaux.fr) et de notre expérience de chantier en Île-de-France.'],
  },
  {
    'slug': 'guide-prix-refection-toiture',
    'categorie': 'Toiture',
    'titre': 'Prix d\'une réfection de toiture au m² en 2026 : tuile, ardoise, zinc | Cohesif BTP',
    'h1': 'Prix d\'une réfection de toiture au m² en 2026 : tuile, ardoise ou zinc ?',
    'description': 'Combien coûte une réfection de toiture en 2026 ? Prix au m² par matériau (tuile, ardoise, zinc), avec ou sans isolation, réparations courantes et conseils pour comparer les devis de couvreur.',
    'chapeau': 'Refaire une toiture coûte en général entre 90 et 300 € le m² en Île-de-France, selon le matériau, l\'état de la charpente et l\'accès au toit. Voici les prix par matériau, le coût des réparations courantes et ce qu\'un bon devis doit contenir.',
    'lecture': 7,
    'service': ('toiture-couverture.html', 'Toiture & couverture'),
    'corps': '''
<h2 id="materiaux">Le prix au m² selon le matériau</h2>
<p>Pour une réfection complète (dépose de l'ancienne couverture, écran sous-toiture, liteaux, nouvelle couverture, faîtage et rives), les fourchettes constatées en Île-de-France en 2026 sont les suivantes, fourniture et pose comprises.</p>
<div class="g-table"><table>
<thead><tr><th>Matériau</th><th>Points clés</th><th>Prix indicatif</th></tr></thead>
<tbody>
<tr><td>Tuile mécanique (terre cuite)</td><td>La plus répandue, pose rapide, 10 à 15 tuiles/m²</td><td>90 à 160 €/m²</td></tr>
<tr><td>Tuile plate</td><td>Aspect traditionnel, 60 à 70 tuiles/m², pente forte</td><td>130 à 220 €/m²</td></tr>
<tr><td>Ardoise naturelle</td><td>Très durable (70 ans et plus), pose plus longue</td><td>150 à 270 €/m²</td></tr>
<tr><td>Zinc</td><td>Typique des toits parisiens, travail de zingueur</td><td>150 à 300 €/m²</td></tr>
<tr><td>Supplément isolation (sarking ou rampants)</td><td>Isolant, pare-vapeur, écran HPV</td><td>+ 50 à 120 €/m²</td></tr>
</tbody></table></div>
<p class="g-note">Fourchettes indicatives HT. La surface de toiture est toujours supérieure à la surface au sol : comptez environ 1,2 à 1,6 fois l'emprise de la maison selon la pente.</p>
<p>Pour comparer les matériaux en vrai, essayez notre <a href="toiture-couverture.html#simulateur-3d">toiture en 3D</a> : maison entière, teintes et pose couche par couche.</p>

<h2 id="reparations">Le prix des réparations courantes</h2>
<ul>
<li><strong>Remplacement de quelques tuiles cassées</strong> : quelques centaines d'euros, l'accès au toit pesant plus que les tuiles elles-mêmes.</li>
<li><strong>Recherche et réparation de fuite</strong> : de 300 à 1 500 € selon l'origine (tuiles, solin, noue, fenêtre de toit).</li>
<li><strong>Démoussage et traitement hydrofuge</strong> : environ 15 à 40 €/m².</li>
<li><strong>Gouttières en zinc</strong> : environ 40 à 90 € le mètre linéaire posé.</li>
<li><strong>Pose d'une fenêtre de toit</strong> : environ 800 à 2 000 € posée, selon la taille et l'habillage.</li>
</ul>

<h2 id="facteurs">Ce qui fait varier le prix</h2>
<h3>L'état de la charpente</h3>
<p>Une fois la couverture déposée, la charpente se révèle : chevrons fendus, bois attaqué par les insectes ou l'humidité. Un bon couvreur prévoit au devis une ligne de reprise ou de traitement, plutôt qu'une mauvaise surprise en cours de chantier.</p>
<h3>L'accès et l'échafaudage</h3>
<p>Hauteur du bâtiment, rue étroite, cour intérieure, besoin d'un monte-matériaux ou d'une grue : à Paris, l'accès peut représenter une part importante du prix.</p>
<h3>L'amiante</h3>
<p>Les plaques de fibrociment posées avant 1997 peuvent contenir de l'amiante. Leur retrait suit une procédure réglementée qui s'ajoute au budget de couverture.</p>
<h3>Les autorisations</h3>
<p>Changer de matériau ou de teinte, ou ajouter une fenêtre de toit, demande une <a href="guide-autorisation-travaux-toiture-facade.html">déclaration préalable</a>.</p>

<h2 id="refaire-ou-reparer">Réparer ou refaire entièrement ?</h2>
<p>Si les dégâts sont localisés et la couverture saine, une réparation et une révision suffisent. Une réfection complète devient plus rentable quand les tuiles sont poreuses sur une grande surface, quand les fuites se multiplient, quand il n'y a pas d'écran sous-toiture ou quand vous voulez isoler par l'extérieur.</p>
<div class="g-box"><p class="g-box-title">Isoler en même temps</p><p>Profiter de la réfection pour isoler la toiture coûte bien moins cher que de le faire séparément, et ouvre droit à MaPrimeRénov', à la prime CEE et à la TVA à 5,5 %. <a href="aides-financement.html#simulateur">Simulez vos aides</a>.</p></div>

<h2 id="devis">Ce qu'un bon devis de couvreur doit contenir</h2>
<ul>
<li>La surface de toiture mesurée et le matériau précis (marque, modèle, teinte).</li>
<li>La dépose et l'évacuation de l'ancienne couverture.</li>
<li>L'écran sous-toiture, les liteaux et contre-liteaux, le faîtage, les rives, la zinguerie.</li>
<li>Une ligne pour la reprise éventuelle de la charpente.</li>
<li>L'échafaudage et la protection du chantier (bâchage chaque soir).</li>
<li>L'attestation d'assurance décennale.</li>
</ul>
''',
    'faq': [
      ('Quel est le prix d\'une réfection de toiture au m² ?', 'En Île-de-France en 2026, comptez en général 90 à 160 €/m² en tuile mécanique, 130 à 220 €/m² en tuile plate, 150 à 270 €/m² en ardoise naturelle et 150 à 300 €/m² en zinc, fourniture et pose comprises. L\'isolation ajoute environ 50 à 120 €/m².'),
      ('Combien coûte une toiture de 100 m² ?', 'Pour 100 m² de toiture en tuile mécanique, comptez environ 9 000 à 16 000 € HT hors reprise de charpente. En ardoise ou en zinc, le budget se situe plutôt entre 15 000 et 30 000 € HT.'),
      ('Faut-il refaire la charpente en même temps que la toiture ?', 'Pas forcément. La charpente est inspectée une fois la couverture déposée : seules les pièces abîmées sont reprises ou traitées. Un bon devis prévoit une ligne pour cette éventualité.'),
    ],
    'sources': ['Fourchettes recoupées à partir des guides de prix publiés en 2026 (Travaux.com, couvreurs d\'Île-de-France) et de notre expérience de chantier.'],
  },
  {
    'slug': 'guide-autorisation-travaux-toiture-facade',
    'categorie': 'Démarches',
    'titre': 'Faut-il une autorisation pour refaire sa toiture ou sa façade ? | Cohesif BTP',
    'h1': 'Faut-il une autorisation pour refaire sa toiture ou sa façade ?',
    'description': 'Déclaration préalable, permis de construire, avis de l\'Architecte des Bâtiments de France : quels travaux de toiture et de façade demandent une autorisation, quels délais, et les règles particulières à Paris.',
    'chapeau': 'Refaire une toiture à l\'identique ne demande en général aucune autorisation. Changer de matériau, de teinte, ajouter une fenêtre de toit ou ravaler une façade à Paris, si. Voici comment savoir quelle démarche faire, et combien de temps prévoir.',
    'lecture': 6,
    'service': ('toiture-couverture.html', 'Toiture & couverture'),
    'corps': '''
<h2 id="regle">La règle générale : l'aspect extérieur</h2>
<p>Le Code de l'urbanisme soumet à <strong>déclaration préalable</strong> les travaux qui modifient l'aspect extérieur d'un bâtiment. Tout tient donc dans une question : est-ce que, depuis la rue ou le voisinage, votre maison aura un autre aspect après les travaux ?</p>
<div class="g-table"><table>
<thead><tr><th>Travaux</th><th>Démarche habituelle</th></tr></thead>
<tbody>
<tr><td>Réparation, remplacement de tuiles à l'identique</td><td>Aucune</td></tr>
<tr><td>Réfection complète à l'identique (même matériau, même teinte)</td><td>Aucune en général, sauf secteur protégé ou règle locale</td></tr>
<tr><td>Changement de matériau ou de teinte de toiture</td><td>Déclaration préalable</td></tr>
<tr><td>Pose d'une fenêtre de toit ou d'une lucarne</td><td>Déclaration préalable</td></tr>
<tr><td>Ravalement de façade à Paris</td><td>Déclaration préalable</td></tr>
<tr><td>Isolation par l'extérieur (changement d'aspect)</td><td>Déclaration préalable</td></tr>
<tr><td>Surélévation ou extension créant de la surface</td><td>Déclaration préalable ou permis de construire selon la surface</td></tr>
</tbody></table></div>
<p class="g-note">Tableau simplifié : le plan local d'urbanisme (PLU) de votre commune peut être plus strict. En cas de doute, le service urbanisme de la mairie tranche.</p>

<h2 id="paris">Les règles particulières à Paris</h2>
<p>La Ville de Paris soumet le <strong>ravalement de façade</strong> à déclaration préalable, quel que soit le secteur. Une grande partie de la capitale se trouve en outre aux abords de monuments historiques ou en site patrimonial remarquable : l'<strong>Architecte des Bâtiments de France</strong> (ABF) donne alors son avis sur les matériaux, les teintes et les techniques, et peut imposer ses prescriptions.</p>
<p>Si un échafaudage ou une benne est posé sur le trottoir, il faut aussi une <strong>autorisation d'occupation du domaine public</strong> auprès de la Ville.</p>

<h2 id="delais">Délais et déroulement</h2>
<ol>
<li><strong>Dépôt du dossier</strong> en mairie ou en ligne : formulaire Cerfa, plans, photos, description des matériaux et teintes.</li>
<li><strong>Instruction</strong> : un mois en général, deux mois quand l'avis de l'ABF est requis. Sans réponse à la fin du délai, l'accord est en principe tacite.</li>
<li><strong>Affichage</strong> de l'autorisation sur un panneau visible de la rue, pendant toute la durée du chantier.</li>
<li><strong>Travaux</strong> : l'autorisation est valable trois ans.</li>
</ol>
<div class="g-box"><p class="g-box-title">Prévoyez large</p><p>Entre la préparation du dossier, l'instruction et la commande des matériaux, comptez souvent deux à trois mois avant le début d'un chantier de ravalement à Paris. Mieux vaut lancer la démarche dès la signature du devis.</p></div>

<h2 id="sans-autorisation">Et si on fait les travaux sans autorisation ?</h2>
<p>Des travaux réalisés sans la déclaration requise exposent à une mise en demeure de régulariser, voire de remettre en état, et à des sanctions pénales. Ils compliquent aussi une future vente : le notaire et l'acquéreur peuvent demander les autorisations. Le jeu n'en vaut pas la chandelle.</p>

<h2 id="accompagnement">Qui fait les démarches ?</h2>
<p>Le propriétaire (ou le syndic pour une copropriété) dépose la demande, mais l'entreprise fournit l'essentiel du dossier : descriptif, matériaux, teintes, plans. Chez Cohesif BTP, nous préparons ce dossier avec vous et nous gérons l'autorisation de voirie pour l'échafaudage.</p>
''',
    'faq': [
      ('Faut-il une autorisation pour refaire sa toiture à l\'identique ?', 'En général non : une réfection avec le même matériau et la même teinte ne modifie pas l\'aspect extérieur. Le PLU de la commune ou un secteur protégé peut toutefois imposer une déclaration préalable : vérifiez auprès du service urbanisme.'),
      ('Faut-il une déclaration préalable pour un ravalement à Paris ?', 'Oui. La Ville de Paris soumet le ravalement de façade à déclaration préalable. En secteur protégé, l\'Architecte des Bâtiments de France donne en plus son avis sur les matériaux et les teintes.'),
      ('Quel est le délai d\'une déclaration préalable ?', 'Un mois en général, porté à deux mois quand l\'avis de l\'Architecte des Bâtiments de France est nécessaire. L\'autorisation est ensuite valable trois ans.'),
    ],
    'sources': ['Code de l\'urbanisme (déclaration préalable de travaux) ; Ville de Paris, pages « Permis de construire, déclarations préalables » (paris.fr).'],
  },
  {
    'slug': 'guide-ravalement-obligatoire-paris',
    'categorie': 'Façade',
    'titre': 'Ravalement obligatoire à Paris : tous les 10 ans, ce que dit la loi | Cohesif BTP',
    'h1': 'Ravalement obligatoire à Paris : tous les 10 ans, ce que dit la loi',
    'description': 'À Paris, le ravalement des façades est obligatoire au moins tous les dix ans. Injonction de la mairie, sanctions, vote en copropriété, obligation d\'isoler : ce que les propriétaires doivent savoir.',
    'chapeau': 'À Paris, les façades doivent être tenues propres et ravalées au moins une fois tous les dix ans. Ce n\'est pas une recommandation mais une obligation légale, que la mairie peut imposer par injonction. Voici ce qu\'elle implique pour les propriétaires et les copropriétés.',
    'lecture': 6,
    'service': ('facade-ravalement.html', 'Façade & ravalement'),
    'corps': '''
<h2 id="obligation">Une obligation fixée par la loi</h2>
<p>Le Code de la construction et de l'habitation impose que les façades des immeubles soient <strong>constamment tenues en bon état de propreté</strong>, avec des travaux de ravalement <strong>au moins une fois tous les dix ans</strong> dans les communes concernées. Paris en fait partie, comme de nombreuses communes d'Île-de-France.</p>
<p>L'obligation vise toutes les façades visibles : sur rue, mais aussi sur cour, ainsi que les murs pignons, les souches de cheminée et les éléments de façade (balcons, garde-corps, corniches).</p>

<h2 id="injonction">Comment la mairie fait respecter l'obligation</h2>
<ol>
<li><strong>Constat</strong> : la Ville relève une façade dégradée ou un ravalement de plus de dix ans.</li>
<li><strong>Injonction</strong> : le propriétaire ou le syndic reçoit une injonction de ravaler, avec un délai pour engager les travaux.</li>
<li><strong>Sanctions</strong> : faute de travaux dans le délai, le maire peut les faire exécuter d'office aux frais du propriétaire, et le refus est passible d'une amende pouvant atteindre 3 750 €.</li>
</ol>
<div class="g-box"><p class="g-box-title">Anticiper vaut mieux que subir</p><p>Un ravalement préparé avant l'injonction laisse le temps de comparer les devis, de choisir la période et de voter sereinement en assemblée générale. Sous injonction, tout se fait dans l'urgence.</p></div>

<h2 id="copropriete">En copropriété : vote et financement</h2>
<p>Le ravalement porte sur les parties communes : il est décidé en <strong>assemblée générale</strong>. Un ravalement d'entretien se vote en principe à la majorité des voix des copropriétaires présents ou représentés ; des travaux d'amélioration, comme une isolation par l'extérieur, relèvent d'une majorité plus large. Le coût est réparti selon les tantièmes de charges.</p>
<p>Pour lisser la dépense, le <strong>fonds de travaux</strong> obligatoire de la copropriété peut être mobilisé, et des aides comme MaPrimeRénov' Copropriété existent quand le ravalement s'accompagne d'une amélioration énergétique. Voir notre page <a href="aides-financement.html">aides & financement</a>.</p>

<h2 id="isolation">Ravalement et obligation d'isoler</h2>
<p>Depuis le décret du 30 mai 2016, un ravalement important (portant sur une grande partie d'une façade) doit en principe s'accompagner d'une <strong>isolation thermique</strong> de cette façade. Des exceptions existent : impossibilité technique, atteinte à l'aspect architectural (façades en pierre de taille, secteurs protégés), ou coût disproportionné au regard des économies d'énergie.</p>
<p>À Paris, beaucoup d'immeubles anciens relèvent de ces exceptions côté rue, mais pas forcément côté cour. Nous l'étudions au cas par cas lors de la visite. En savoir plus : <a href="guide-isolation-exterieure-ite.html">isolation par l'extérieur, prix et aides</a>.</p>

<h2 id="etapes">Les étapes d'un ravalement à Paris</h2>
<ol>
<li>Diagnostic de la façade et devis détaillé.</li>
<li>Vote en assemblée générale (copropriété).</li>
<li><a href="guide-autorisation-travaux-toiture-facade.html">Déclaration préalable</a> et, si besoin, autorisation de voirie pour l'échafaudage.</li>
<li>Installation de l'échafaudage et protection des abords.</li>
<li>Travaux : nettoyage, reprises, enduit ou peinture, éléments décoratifs.</li>
<li>Réception des travaux et dépose de l'échafaudage.</li>
</ol>
<p>Côté budget, consultez notre guide du <a href="guide-prix-ravalement-facade-paris.html">prix d'un ravalement à Paris</a>.</p>
''',
    'faq': [
      ('Le ravalement est-il obligatoire à Paris ?', 'Oui. À Paris, les façades doivent être tenues en bon état de propreté et ravalées au moins une fois tous les dix ans. La mairie peut adresser une injonction au propriétaire ou au syndic de copropriété.'),
      ('Que risque-t-on en cas de refus de ravaler ?', 'Faute de travaux dans le délai fixé par l\'injonction, le maire peut les faire exécuter d\'office aux frais du propriétaire, et le refus est passible d\'une amende pouvant atteindre 3 750 €.'),
      ('Faut-il isoler la façade lors d\'un ravalement ?', 'Depuis 2016, un ravalement important doit en principe s\'accompagner d\'une isolation de la façade, sauf exceptions : impossibilité technique, atteinte à l\'aspect architectural ou coût disproportionné par rapport aux économies d\'énergie.'),
    ],
    'sources': ['Code de la construction et de l\'habitation (entretien et ravalement des façades) ; décret n° 2016-711 du 30 mai 2016 ; Ville de Paris (paris.fr).'],
  },
  {
    'slug': 'guide-isolation-exterieure-ite',
    'categorie': 'Isolation',
    'titre': 'Isolation thermique par l\'extérieur (ITE) : prix, intérêt et aides 2026 | Cohesif BTP',
    'h1': 'Isolation par l\'extérieur (ITE) : prix, intérêt et aides en 2026',
    'description': 'Isolation thermique par l\'extérieur : prix au m² (enduit, bardage), avantages, cas où elle est possible, aides 2026 (CEE, TVA 5,5 %, éco-PTZ, rénovation d\'ampleur) et liens avec le ravalement.',
    'chapeau': 'L\'isolation par l\'extérieur emballe la maison sans toucher aux pièces de vie et refait la façade au passage. Elle coûte plus cher qu\'une isolation intérieure, mais elle traite les ponts thermiques et ne réduit pas la surface habitable. Prix, conditions et aides 2026.',
    'lecture': 6,
    'service': ('facade-ravalement.html', 'Façade & ravalement'),
    'corps': '''
<h2 id="principe">Le principe</h2>
<p>Des panneaux isolants (polystyrène, laine de roche, fibre de bois…) sont fixés sur les murs extérieurs, puis recouverts d'un enduit armé ou d'un bardage. Le mur reste du côté chaud : il garde la chaleur l'hiver et la fraîcheur l'été.</p>
<ul>
<li><strong>Aucune surface habitable perdue</strong> et pas de travaux à l'intérieur.</li>
<li><strong>Ponts thermiques traités</strong> aux planchers et aux refends, là où l'isolation intérieure laisse des fuites.</li>
<li><strong>Façade neuve</strong> : l'ITE remplace un ravalement.</li>
</ul>

<h2 id="prix">Combien coûte une ITE ?</h2>
<div class="g-table"><table>
<thead><tr><th>Finition</th><th>Points clés</th><th>Prix indicatif</th></tr></thead>
<tbody>
<tr><td>Isolant + enduit mince</td><td>La solution la plus courante sur maison</td><td>120 à 200 €/m²</td></tr>
<tr><td>Isolant + bardage (bois, composite, métal)</td><td>Aspect contemporain, ossature ventilée</td><td>150 à 250 €/m²</td></tr>
<tr><td>Laine de roche ou fibre de bois</td><td>Meilleur confort d'été et résistance au feu</td><td>+ 10 à 30 €/m²</td></tr>
</tbody></table></div>
<p class="g-note">Fourchettes indicatives HT, échafaudage et reprises d'appuis de fenêtres compris selon les entreprises : vérifiez-le au devis.</p>

<h2 id="aides">Les aides en 2026</h2>
<p>Depuis 2026, l'isolation des murs n'est plus financée par MaPrimeRénov' « par geste ». Elle reste aidée de plusieurs façons :</p>
<ul>
<li><strong>TVA à 5,5 %</strong> au lieu de 20 % dans un logement de plus de 2 ans.</li>
<li><strong>Prime CEE</strong>, versée par les fournisseurs d'énergie, bonifiée pour les revenus modestes.</li>
<li><strong>Éco-prêt à taux zéro</strong>, jusqu'à 15 000 € pour une action.</li>
<li><strong>MaPrimeRénov' Rénovation d'ampleur</strong>, si l'ITE fait partie d'un projet global qui gagne au moins deux classes au DPE.</li>
</ul>
<p>Faites le calcul pour votre logement : <a href="aides-financement.html?travaux=ite#simulateur">simulateur d'aides</a>.</p>

<h2 id="possible">Quand l'ITE est-elle possible ?</h2>
<p>Elle convient très bien aux pavillons et aux immeubles à façade enduite. Elle est plus délicate, voire exclue, sur les façades en pierre de taille ou à modénatures, en secteur protégé où l'Architecte des Bâtiments de France peut la refuser, ou quand l'épaisseur ajoutée déborde sur la voie publique. Une <a href="guide-autorisation-travaux-toiture-facade.html">déclaration préalable</a> est nécessaire, car l'aspect de la façade change.</p>
<div class="g-box"><p class="g-box-title">Le bon moment</p><p>Le meilleur moment pour isoler par l'extérieur, c'est quand la façade doit être ravalée : l'échafaudage est déjà là, et depuis 2016 la réglementation demande d'étudier l'isolation lors d'un ravalement important. Voir <a href="guide-ravalement-obligatoire-paris.html">ravalement obligatoire à Paris</a>.</p></div>

<h2 id="etapes">Les étapes du chantier</h2>
<ol>
<li>Diagnostic de la façade et choix de l'isolant et de la finition.</li>
<li>Déclaration préalable et installation de l'échafaudage.</li>
<li>Préparation du support, rail de départ, pose et fixation des panneaux.</li>
<li>Traitement des points singuliers : appuis de fenêtres, angles, descentes d'eau, bas de façade.</li>
<li>Enduit armé de finition ou pose du bardage, puis réception.</li>
</ol>
<p>Comptez en général deux à six semaines pour une maison, selon la surface et la météo.</p>
''',
    'faq': [
      ('Quel est le prix d\'une isolation par l\'extérieur au m² ?', 'Comptez en général 120 à 200 € HT par m² pour un isolant recouvert d\'un enduit mince, et 150 à 250 € HT par m² sous bardage. Les isolants biosourcés ou en laine de roche ajoutent environ 10 à 30 €/m².'),
      ('L\'isolation par l\'extérieur est-elle encore aidée en 2026 ?', 'Oui, par la TVA à 5,5 %, la prime CEE et l\'éco-prêt à taux zéro. MaPrimeRénov\' ne la finance plus par geste en 2026, mais elle reste prise en charge dans une rénovation d\'ampleur.'),
      ('Faut-il une autorisation pour une isolation par l\'extérieur ?', 'Oui, une déclaration préalable est nécessaire, car l\'aspect de la façade change. En secteur protégé, l\'Architecte des Bâtiments de France doit donner son avis.'),
    ],
    'sources': ['Fourchettes recoupées à partir des guides de prix publiés en 2026 ; règles d\'aides Anah 2026 (voir notre page aides & financement) ; décret n° 2016-711 du 30 mai 2016.'],
  },
  {
    'slug': 'guide-choisir-couvreur-eviter-arnaques',
    'categorie': 'Conseils',
    'titre': 'Démarchage toiture : 7 signes d\'arnaque et comment choisir son couvreur | Cohesif BTP',
    'h1': 'Démarchage toiture : 7 signes d\'arnaque et comment bien choisir son couvreur',
    'description': 'Faux couvreurs, démoussage hors de prix, « tuiles cassées » vues depuis la rue : les signes d\'une arnaque à la toiture, vos droits (rétractation, démarchage) et les vérifications à faire avant de signer.',
    'chapeau': 'Un inconnu sonne et vous annonce des tuiles cassées, une mousse « dangereuse » ou une charpente qui pourrit, avec une remise si vous signez aujourd\'hui ? Méfiance. Voici les signes qui doivent alerter, vos droits, et les vérifications à faire avant de choisir un couvreur.',
    'lecture': 5,
    'service': ('toiture-couverture.html', 'Toiture & couverture'),
    'corps': '''
<h2 id="signes">7 signes qui doivent vous alerter</h2>
<ol>
<li><strong>Le démarchage spontané</strong> : un professionnel « qui passait dans le quartier » et a repéré un problème sur votre toit.</li>
<li><strong>L'urgence et la pression</strong> : « il faut intervenir aujourd'hui », « la remise ne vaut que maintenant ».</li>
<li><strong>Pas de devis écrit détaillé</strong>, ou un devis avec un prix global sans quantités ni matériaux.</li>
<li><strong>Un acompte élevé en liquide</strong>, ou un paiement demandé avant tout commencement.</li>
<li><strong>Pas d'adresse vérifiable</strong>, un simple numéro de portable, une entreprise introuvable.</li>
<li><strong>Pas d'attestation d'assurance décennale</strong> ou une attestation qui ne couvre pas la couverture.</li>
<li><strong>Des photos de dégâts</strong> qu'on ne peut pas vérifier : elles ne sont pas toujours prises sur votre toit.</li>
</ol>

<h2 id="droits">Vos droits face au démarchage</h2>
<ul>
<li><strong>14 jours pour vous rétracter</strong> après la signature d'un contrat conclu à domicile, sans justification.</li>
<li><strong>Aucun paiement</strong> ne peut être exigé avant 7 jours à compter de la conclusion d'un contrat signé lors d'un démarchage à domicile.</li>
<li><strong>Le démarchage téléphonique est interdit</strong> pour les travaux de rénovation énergétique (isolation, pompe à chaleur…), sauf contrat en cours avec l'entreprise.</li>
</ul>
<p>En cas de litige, vous pouvez contacter la DGCCRF via le site SignalConso ou une association de consommateurs.</p>

<h2 id="verifier">Les vérifications à faire avant de signer</h2>
<ul>
<li><strong>Le SIRET</strong> de l'entreprise, sur l'annuaire des entreprises de l'État (annuaire-entreprises.data.gouv.fr) : existence, date de création, activité.</li>
<li><strong>L'assurance décennale</strong> : l'attestation doit être jointe au devis et couvrir la couverture et la zinguerie.</li>
<li><strong>Le label RGE</strong> pour des travaux d'isolation aidés, sur l'annuaire officiel de France Rénov'.</li>
<li><strong>Des références</strong> : chantiers récents, photos, avis vérifiables.</li>
<li><strong>Plusieurs devis</strong> comparables, poste par poste. Voir notre guide du <a href="guide-prix-refection-toiture.html">prix d'une réfection de toiture</a>.</li>
</ul>
<div class="g-box"><p class="g-box-title">Le démoussage miracle</p><p>Un démoussage facturé plusieurs milliers d'euros pour une petite maison, une « résine » qui promet 30 ans de tranquillité, un nettoyage à haute pression qui décape les tuiles : c'est le scénario d'arnaque le plus courant. Un démoussage sérieux se fait à basse pression, avec un traitement adapté, et coûte en général 15 à 40 €/m².</p></div>

<h2 id="bon-couvreur">Ce que fait un bon couvreur</h2>
<p>Il se déplace pour un diagnostic, monte sur le toit ou utilise un drone, vous montre les photos, et vous remet un devis écrit détaillé, avec les matériaux, les quantités, les délais et son assurance. Il vous laisse le temps de comparer. C'est exactement ce que nous faisons chez Cohesif BTP, avec un devis sous 48h après la visite.</p>
''',
    'faq': [
      ('Comment reconnaître une arnaque à la toiture ?', 'Démarchage spontané, urgence et pression pour signer, absence de devis écrit détaillé, acompte élevé en liquide, entreprise introuvable ou sans assurance décennale : ces signes doivent vous alerter.'),
      ('Peut-on annuler un contrat signé avec un démarcheur ?', 'Oui. Pour un contrat conclu à domicile, vous disposez de 14 jours pour vous rétracter sans justification, et aucun paiement ne peut être exigé avant 7 jours.'),
      ('Comment vérifier qu\'un couvreur est sérieux ?', 'Vérifiez son SIRET sur l\'annuaire des entreprises de l\'État, demandez l\'attestation d\'assurance décennale, le label RGE pour des travaux d\'isolation aidés, et des références de chantiers récents.'),
    ],
    'sources': ['Code de la consommation (contrats hors établissement : rétractation de 14 jours, absence de paiement pendant 7 jours) ; loi n° 2020-901 du 24 juillet 2020 (démarchage téléphonique et rénovation énergétique).'],
  },
]
