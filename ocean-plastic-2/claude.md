# Mémoire orchestrateur, passe 2 (Atlas Océan Plastique II)

Dossier de travail : `ocean-plastic-2/`. Livrable : `report/index.html` (artifact publié).
Complète `ocean-plastic/claude.md` (passe 1). Ne pas dupliquer, seulement ce qui a changé.

## Ce qui a marché

- Plafond de 12 recherches web par agent écrit dans BRIEF.md : les 8 agents ont tenu
  (un seul à 13), le quota de session n'a pas été épuisé comme en passe 1.
- Noms de fichiers `dossier.md` et `verdict.md` : aucun refus d'écriture de sous-agent.
- Dater le « pourquoi maintenant » AVANT d'écrire la fiche. Les trois critiques ont
  invalidé exactement les trois idées dont le déclencheur n'était pas daté ou était
  volontaire (TireWatch, FiberScore, HullCycle).
- Trois critiques (VC, océan, tech) avec des grilles différentes : la seule idée en tête
  des trois (GhostSonar) est devenue la reco 1 sans hésitation. Les désaccords
  (StormDebris premier chez le VC, dernier chez le tech) sont assumés dans le rapport,
  pas moyennés.
- Fusion GrantMRV dans GhostSonar comme module de revenu : un critique voit une
  feature, pas une société. Toujours vérifier « est-ce une société ou un module ? ».
- Graphique à bulles : axe y de 13 à 29 (pas 16 à 30) pour ne pas couper les scores
  bas ; jitter des efforts et ancres de label (left/below/above) réglés à la main
  après capture chart-only avec Chromium headless. Deux itérations suffisent.
- Vérification finale automatisée : compteur de `<!--VERDICT`, `—`, `–` à zéro avant
  publication.

## Erreurs à ne pas refaire

- 20 corrections factuelles remontées par le critique océan sur les fiches (Deeper
  n'est pas un side-scan, Nile red non conforme SB 1422, APER consultation close,
  NFWF limité à cinq États, etc.). Les agents de recherche affirment des capacités
  matérielles sans les vérifier : demander explicitement « capacité vérifiée ou
  supposée ? » dans le brief des agents tech.
- Le premier rendu du graphique avait quatre labels superposés au score 22 et deux
  bulles hors cadre. Toujours capturer le graphique avant de publier.
- Les abonnements de surveillance d'artifact sont refusés dans cette session (403) :
  ne jamais prétendre surveiller.
- La passe 2 a tourné dans la même session au lieu d'une session enfant (risque de
  blocage sur les permissions d'une session non surveillée). Le dire à l'utilisateur.

## Faits utiles pour une passe 3

- Idées exclues (passes 1 et 2) : listées dans BRIEF.md et IDEAS.md, à reporter.
- Scores orchestrateur finaux : FloatWatch 26, GhostSonar 25, StormDebris 23, NetPen 22,
  VesselRisk 22, CoastalTrace 22, PolyID 22, GrantMRV 21, MicroScreen 19, FiberScore 16,
  HullCycle 16, TireWatch 15.
- Prochaine étape logique demandée par le plan à 30 jours : GhostSonar, semaine 1,
  entretiens dans les deux clubs de plongée et à Steveston.
