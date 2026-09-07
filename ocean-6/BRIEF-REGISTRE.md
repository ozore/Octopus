# Passe 6, phase 1 : brief des cartographes du registre des dépenses

## 1. Objectif (la ligne d'arrivée)
Produire, pour UNE population d'acheteurs privés de l'océan, un registre de 15 à 25 lignes de dépense réelles :
ce que ces acheteurs paient déjà, aujourd'hui, en logiciel ou en travail manuel, avec le prix lu et la source.
Aucune idée de produit. Si une idée vous vient, ne l'écrivez pas : notez la ligne de dépense qui l'a fait naître.
Le registre est le sol sur lequel d'autres agents construiront ; s'il est faux ou estimé, tout ce qui suit meurt.

## 2. Le fondateur (pour savoir quelles dépenses comptent)
Seul, développeur, data et IA, plongeur, à Vancouver, moins de 25 k$ CAD sur douze mois, veut une société qui existe
encore en 2036, financée d'abord par son revenu ; écologique stricte (pas de pétrole ni de gaz, pas de défense, pas
d'extraction des fonds marins comme client), pas militant, vend à qui paie ; à distance, en français ou en anglais ;
marchés Californie, Floride, Europe, puis Pacifique Nord-Ouest ; jamais un marché public ni un grand compte comme
premier client. Les dépenses qui comptent sont donc celles d'acheteurs PRIVÉS, de taille petite ou moyenne, assez
nombreux (au moins 25 nommables, ou 200 dans le monde), qui paient déjà quelqu'un ou quelque chose.

## 3. Ce qu'est une ligne de dépense (gabarit strict, tableau puis notes)
Colonnes du tableau : numéro ; qui paie (type d'acheteur, et deux ou trois entreprises nommées) ; quoi (logiciel,
service, geste manuel, avec le nom de l'outil ou du prestataire) ; combien (montant, unité, étiquette « lu » avec
la source, ou « estimation » avec la base) ; à qui (éditeur, cabinet, salarié) ; depuis quand et pourquoi (obligation,
contrat, économie) ; ce que l'outil ou le prestataire ne fait pas (plainte d'utilisateur, geste resté manuel, donnée
non exploitée) ; qui détient la donnée produite ; population (combien d'acheteurs de ce type, source).
Sous le tableau, une note de cinq lignes maximum par ligne de dépense avec les citations et les URL.
Les lignes sans prix lu vont dans un second tableau « à confirmer », jamais mélangées.

## 4. Où lire un prix (sources imposées, dans cet ordre)
1. Offres d'emploi : salaires de postes qui font le geste à la main (« analyste », « coordinateur conformité »,
   « technicien de relevé », « observateur ») et mentions d'outils exigés (« maîtrise de X », « expérience de Y ») :
   la mention d'un outil dans une offre prouve qu'il est payé.
2. Pages de prix, fiches produit, grilles tarifaires de prestataires, barèmes d'associations ou de labels.
3. Avis d'utilisateurs (G2, Capterra, forums professionnels, groupes LinkedIn), journaux de versions et pages
   d'intégrations des éditeurs : ce qu'ils ne font pas s'y lit.
4. Rapports annuels et documents financiers d'éditeurs et de prestataires cotés ou financés (Tetra Tech, DNV,
   sociétés de classification, courtiers), communiqués « X choisit Y », listes d'exposants (Oceanology
   International, Aquaculture Europe, Seawork), subventions SBIR de la NOAA et projets de l'Ocean Supercluster
   (ils disent aussi qui construit quoi).
5. Avis d'attribution de marchés publics, lus comme signal de prix, jamais comme cible de vente.

## 5. Mémoire transmise
Lisez /home/user/Octopus/ocean-6/MEMOIRE-MORTS.md : dix causes de mort et la carte des occupants. Une dépense
versée à un occupant de la carte est une bonne ligne (elle prouve un budget) : notez ce que l'occupant ne fait pas.
Ne lisez aucun autre fichier du dépôt.

## 6. Contraintes
Au plus 8 appels WebSearch (quota partagé) ; WebFetch libre (portvancouver.com, jasco.com et de nombreux PDF sont
bloqués : passez par des résumés). Aucun tiret long ni demi-cadratin. Chaque acronyme, outil et acteur défini à
la première mention. Pas de code, pas de commit. N'écrivez que dans votre dossier. Date : 7 septembre 2026.

## 7. Format
`/home/user/Octopus/ocean-6/registre/<votre-nom>/dossier.md` : (a) la population en dix lignes (qui, combien,
sources) ; (b) le tableau des lignes de dépense avec prix lu ; (c) le tableau « à confirmer » ; (d) les notes
sourcées ; (e) les cinq dépenses les plus solides selon vous, en une ligne chacune, avec la raison ; (f) lacunes.

## 8. En cas de blocage
Deux échecs de recherche sur une question : reformulez ou WebFetch une source secondaire. Prix introuvable après
deux tentatives : ligne « à confirmer », jamais une estimation dans le tableau principal. Population introuvable :
dites-le. Ne posez aucune question : choisissez, documentez, continuez.

## 9. Mémoire
Tenez `claude.md` dans votre dossier : requêtes qui ont marché, sources mortes, compteur de recherches, trois
lignes de bilan (ce que vous referiez, ce que vous ne referiez pas, ce qui vous a surpris).
