# Mémoire de travail — agent agences-donnees

## Mandat
Trouver chez les agences/institutions (POC/DFO, NOAA, EMSA, Copernicus Marine, EMODnet, ONC, MBARI,
Ifremer, JNCC, CIEM/ICES, observatoires câblés, programmes d'observateurs, flottes océanographiques)
des données déjà collectées/annotées mais sous-exploitées, et 5 candidats produits IA pour acheteur
solvable. Livrable : `dossier.md`. Budget : ≤10 WebSearch, WebFetch libre. Pas de code, pas de commit.

## Compteur WebSearch — TERMINÉ : 10/10 utilisées
1. Ocean Networks Canada hydrophone whale detection machine learning acoustic monitoring
2. NOAA fisheries electronic monitoring video review artificial intelligence computer vision 2025
3. Ifremer campagnes océanographiques images sous-marines annotées intelligence artificielle
4. JNCC seabed habitat mapping benthic monitoring data marine protected areas
5. CanadaBuys tender marine data annotation video review fisheries observer 2025
6. Vancouver Salish Sea killer whale ship slowdown ECHO program underwater noise compliance hydrophone
7. Global Fishing Watch satellite AI dark vessel detection illegal fishing SAR
8. "data steward" OR "annotateur" marine data job posting NOAA OR DFO OR Ifremer OR "Ocean Networks Canada"
9. Fisheries and Oceans Canada electronic monitoring at-sea observer program cost video review backlog
10. UN Ocean Decade hackathon data challenge underused ocean data 2025 2026

Toutes ont donné des résultats exploitables. Aucune n'a été « perdue » — bon taux de réussite car
requêtes formulées avec noms propres + mots-clés techniques précis plutôt que questions génériques.

## Stratégie qui a marché
WebFetch direct sur URL connues/devinées AVANT de consommer du WebSearch, pour économiser le quota.
Fonctionne bien pour les pages statiques d'agences (marine.copernicus.eu, fathomnet.org, ifremer.fr,
emsa.europa.eu, jncc.gov.uk, viametoolkit.org, github.com). Ne marche PAS pour : SPA/JS-only, pages
avec anti-bot (403), URL de recherche interne devinées (souvent 404), PDF (rendu texte échoue souvent
et `pdftoppm`/poppler-utils est absent de cet environnement donc Read ne peut pas non plus les
rasteriser — se contenter du nom de fichier/métadonnées comme preuve d'existence).

## Sources mortes / échecs
- https://www.oceannetworks.ca/data-services/our-data/ → 404 (utiliser la racine oceannetworks.ca à la
  place, qui fonctionne).
- https://data.marine.copernicus.eu/about → 404 (utiliser marine.copernicus.eu/user-corner/... à la
  place).
- https://www.dfo-mpo.gc.ca/fisheries-peches/monitoring-controle/index-eng.html → 404 (page bougée ou
  inexistante ; DFO a beaucoup de liens morts, préférer des sources tierces type CBC/Ecotrust Canada).
- https://open.canada.ca/en/search/opendatasets?search_text=... → 404 (l'URL de recherche paramétrée ne
  se fetch pas ; il faudrait passer par l'interface ou l'API officielle).
- https://jncc.gov.uk/our-work/marine-monitoring/ → 404 (bonne page existe : jncc.gov.uk/our-work/
  marine-monitoring-resources/ ou /monitoring/marine-monitoring-mapping/).
- https://www.ices.dk (page data) : chargée mais contenu générique, pas de détail logbook/VMS trouvé.
- https://www.cbc.ca/... et https://www.portvancouver.com/... → 403 (anti-bot) ; contourné via WebSearch
  snippets + sources tierces (sustainableworldports.org pour ECHO).
- PDF Quiet Sound 2024-25 et JNCC Report 712A : téléchargés (sauvegardés localement par WebFetch) mais
  illisibles — ni WebFetch ni Read (pdftoppm manquant) n'ont pu en extraire le texte. Seuls titre/date de
  fichier exploités comme preuve d'existence d'un rapport récurrent.

## Leçons pour la prochaine passe
- Les pages d'agences publiques (.gc.ca, .gov.uk portails de recherche) sont souvent fragiles en fetch
  direct : préférer chercher d'abord le titre exact via WebSearch puis fetch l'URL retournée plutôt que
  deviner un chemin.
- Les résumés WebSearch intégrés (le modèle qui résume les résultats) sont souvent suffisamment riches
  pour ne PAS avoir besoin de fetch la page derrière chaque lien — a permis d'économiser des appels.
  Une bonne requête avec noms propres + acronymes techniques ramène des faits chiffrés exploitables
  directement dans le résumé.
- FathomNet (MBARI), VIAME (NOAA/Kitware) et AI.Fish (privé, SBIR NOAA) sont les 3 briques IA déjà
  existantes les plus solides trouvées dans tout le corpus — à réutiliser comme référence de
  comparaison ("ce qui existe déjà") pour toute idée future touchant vision par ordinateur + données
  marines.
- Le couple ECHO Program (Vancouver Fraser Port Authority) / Quiet Sound (Washington) est une trouvaille
  forte et non anticipée au départ : pertinent pour un fondateur basé à Vancouver, correspond bien aux
  3 critères du brief (protocole déjà écrit à 11 nœuds, données hydrophone+AIS déjà collectées, rapport
  annuel récurrent). À creuser en priorité si une passe de validation suit.

## Statut final
`dossier.md` écrit avec (a) population/inventaire de 12 agences/programmes, (b) 5 candidats en format
compact étiqueté vérifiée/supposée, (c) 27 références datées + section lacunes. Aucun fichier écrit hors
de ce dossier. Aucun commit. Aucun code exécuté (seulement mkdir/ls pour préparer le dossier).
