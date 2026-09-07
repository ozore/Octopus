# Mémoire orchestrateur, passe 3 (Atlas Fonds Marins)

Dossier de travail : `ocean-seabed-3/`. Livrable : `report/index.html` (artifact publié).
Complète `ocean-plastic/claude.md` (passe 1) et `ocean-plastic-2/claude.md` (passe 2).

## Ce qui a marché

- Brief qui exclut nommément les 24 idées précédentes et impose l'étiquette « capacité vérifiée
  ou supposée » : les huit dossiers ont marqué leurs suppositions, ce qui a permis aux critiques
  de repérer où l'orchestrateur les avait promues en faits (leçon en face).
- Plafond de 12 recherches web par agent tenu (un agent à 14, documenté) ; ~95 recherches au total.
- Trois critiques Opus sur pièces uniquement (0 recherche) : 5 erreurs factuelles (VC), 10 corrections
  et 10 pièges (écologue), 20 promesses techniques (architecte). L'écologue a apporté des faits
  absents des huit dossiers (suivi électronique à 100 % de la flotte de chalut de C.-B., mécanisme
  de financement de la mer du Grand Ours, seuil floridien de 29 NTU, analyse d'équivalence
  d'habitat de la NOAA, SVMP de Washington DNR) : un critique de métier vaut un neuvième agent.
- Squelette HTML écrit avec des emplacements (`<!--VERDICT:n-->`, `<!--RECOS-->`, `<!--CMP-->`,
  `<!--PIEGES-->`, `<!--PLAN-->`, `<!--CHARTNOTE-->`) pendant que les critiques tournaient, puis
  deux scripts de patch (corrections de fiches, puis verdicts et sections). Zéro placeholder
  résiduel vérifié par compteur.
- Graphique : axe y 15 à 28, x 2 à 8,5 ; trois itérations de jitter et d'ancres de labels.

## Erreurs à ne pas refaire

- L'orchestrateur a transformé des « capacités supposées » des dossiers en capacités acquises dans
  IDEAS.md (cicatrices d'ancre par satellite, zostère par Sentinel-2 en mer des Salish, barrens
  d'oursins depuis l'orbite, croissance corallienne par splatting, présomption de préjudice).
  Règle pour la passe 4 : grepper « supposée » et « estimation » dans les dossiers avant d'écrire
  une fiche, et recopier l'étiquette.
- « Aucun concurrent identifié » dans dix fiches sur douze : sur un marché réglementé, cela signale
  souvent un travail internalisé par l'agence (KelpWatch, WA DNR, CIEM, VMS du MPO). Un site
  inaccessible pendant la collecte n'est pas un concurrent absent.
- Confusion entre population soumise à une obligation et acheteur solvable (clubs bénévoles,
  conservancies, ONG sans budget d'État). Et cinq idées vendaient une preuve à celui qu'elle
  accuse (dragueur, promoteur, aquaculteur).
- Les efforts en mois-ingénieur d'équipe ont été lus comme un calendrier solo : compter 0,6 m-i par
  mois calendaire avec Claude, 0,3 à 0,4 quand le chemin critique n'est pas du code.
- Deux dossiers de la même étude se contredisent (bouées du FKNMS 500 contre 600 ; période FCR3
  2023-2025 contre 2023-2026 ; BlueROV2 4 603 contre 4 900 $) : imposer une relecture croisée.
- Les abonnements de surveillance d'artifact restent refusés (403) : ne jamais prétendre surveiller.

## Résultat de la passe

- Scores orchestrateur finaux /35 : OffsetLedger 26, SedimentIQ 25, BenthicPipe 22, ColonyTrack 21,
  ScarMap 20, ReefInjury 20, SpongeSentinel 19, KelpPulse 18, DiveAtlas 18, SeafloorLedger 18,
  PosidoniaProof 17, PlumeWatch 17.
- Recommandations : BenthicOS (un moteur de segmentation vidéo, trois gabarits : aquaculture,
  compensation d'habitat, norme MMO) ; moteur de mesure 3D (ReefInjury plus ColonyTrack) en année
  deux ; corpus benthique froid (DiveAtlas, KelpPulse, ScarMap) comme actif, pas comme société.
- Idées exclues pour une passe 4 : les 36 idées des trois passes (listes dans les trois BRIEF et IDEAS).
