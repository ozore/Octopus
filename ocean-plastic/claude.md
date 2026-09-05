# Mémoire de l'orchestrateur : étude « Ocean Plastic » (septembre 2026)

Journal des succès et des erreurs du pilotage de la flotte d'agents, pour les prochaines études
du même type dans ce dépôt.

## Succès
- Brief commun (`BRIEF.md`) écrit une fois, référencé par tous les agents : cohérence des livrables
  (mêmes sections a-f, mêmes règles de sourçage, même gabarit d'idée). À refaire.
- Cinq piliers dans chaque prompt d'agent (objectifs, contraintes, format, blocage, mémoire) : les
  agents ont tous livré un `claude.md` exploitable et ont documenté leurs lacunes au lieu d'inventer.
- Découpage par population (ports, pêche, littoral, rivières, marques) plutôt que par technologie :
  les opportunités produit sont sorties naturellement avec leur cible et leur prix.
- Deuxième vague de trois critiques (VC, secteur, technique) sur la liste courte : a corrigé quatre
  promesses techniques fausses (GISIS, Sentinel-2 sur plage, Copernicus en bassin portuaire,
  détection de granulés) et deux divergences réglementaires (seuil pellets 1 500 t, amende 4 %).
- Validation de la palette du graphique avec le script du skill dataviz avant d'écrire le HTML.

## Erreurs et leçons
- Le quota de recherche web est partagé par toute la session (environ 200 requêtes) : neuf agents
  lancés en parallèle l'ont épuisé en 10 minutes. Leçon : fixer un budget par agent (15 max) dans le
  brief, ou lancer les agents en deux vagues, et garder 30 requêtes pour la phase critique.
- L'outil d'écriture des sous-agents refuse les fichiers nommés `findings.md`, `report`, `summary`,
  `analysis`. Trois agents ont perdu du temps ; l'un a écrit `dossier-rivers-upstream.md`. Leçon :
  demander des noms neutres (`dossier.md`, `verdict.md`) dès le brief.
- Deux dossiers ont donné des chiffres différents pour le même texte (seuil de certification pellets
  1 000 vs 1 500 t/an). Leçon : faire relire les fiches réglementaires par un second agent avant la
  synthèse, ou imposer une source primaire (JOUE) pour toute date et tout seuil.
- Les agents Sonnet ont parfois repris des chiffres de la proposition législative plutôt que du texte
  adopté (amende 4 % du CA). Leçon : demander explicitement « texte adopté ou proposition ? ».
- Le rapport HTML a été écrit avant le retour des critiques, puis patché : cela marche mais oblige
  à un second passage sur la synthèse. Leçon : écrire les fiches après les verdicts si le temps le
  permet, ou prévoir des emplacements de patch dès le départ (fait ici avec `<!--VERDICT:n-->`).

## À vérifier avant toute décision d'investissement
- Sanctions du règlement pellets 2025/2365 dans le texte adopté (pas la proposition de 2023).
- Éco-organisme français agréé pour les engins de pêche (décret 2025-775) et son barème.
- Circuit exact de déclaration SOLAS V/31-32 par État du pavillon et ce que GISIS publie.
- Nombre réel de ports TEN-T sans système communautaire dédié.
