# Étude « Fonds marins », troisième passe : brief commun à tous les agents

## Contexte
Deux passes précédentes ont produit vingt-quatre idées de société logicielle et IA autour du plastique marin.
Passe 1 (`ocean-plastic/IDEAS.md`) : DriftBox, GearTrace, PelletGuard, TrueBlue Claims, Plastic Credit Ratings,
HarbourTwin, WasteDeck, CleanScore, RiverEye, NurdleRisk, DiveLedger, EPR Atlas.
Passe 2 (`ocean-plastic-2/IDEAS.md`) : GhostSonar, GrantMRV, NetPen Ledger, FloatWatch, VesselRisk, StormDebris,
MicroScreen, TireWatch, CoastalTrace, PolyID, FiberScore, HullCycle.
**Ces vingt-quatre idées sont exclues.** Le plastique n'est plus le sujet. La troisième passe cherche douze idées
entièrement nouvelles dont l'objectif est la PRÉSERVATION DES FONDS MARINS : récifs coralliens, herbiers marins,
forêts de kelp, récifs d'éponges siliceuses, bancs de coraux d'eau froide, faune et flore benthiques, habitats
essentiels. Stades visés : prévention des dégâts (ancres, chalutage, dragage, câbles, éoliennes, rejets), détection et
surveillance (état de santé, blanchissement, maladies, espèces invasives, braconnage), restauration et preuve
(transplantation, pépinières, crédits biodiversité et carbone bleu, MRV).

## Le fondateur (ce qui oriente tout)
- Basé à Vancouver (Colombie-Britannique), français, plongeur, accès à deux clubs de plongée, aux marinas de
  Vancouver, au port de pêche de Steveston et potentiellement au port industriel de Vancouver.
- Profil technique (développement, data, IA) et produit ; temps plein ; bootstrap avec moins de 25 k$ CAD.
- Marchés visés dans l'ordre : Californie, Floride, Europe ; Canada et Pacifique Nord-Ouest (Colombie-Britannique,
  Washington, Oregon, Alaska) comme terrain immédiat. L'Asie et le Pacifique (Australie, Indonésie, Philippines,
  Polynésie) seulement si la proposition de valeur y est très forte et vendable à distance.
- Revenus voulus vite : beaucoup de petits clients (100 à 1 000 $ par mois), quelques pilotes payants
  (15 à 80 k$), licence de données ; subventions en complément, jamais comme modèle.
- Produit : logiciel plus matériel du commerce (caméras, drones, ROV grand public, sonars, hydrophones, capteurs,
  kits eDNA, caméras 360) avec un vrai effort de développement (IA, vision, base de données, atlas) qui construit
  une barrière à l'entrée. Pas d'application triviale, pas de matériel sur mesure.
- L'océan et les fonds marins doivent rester visibles dans le discours. Une société = une idée.

## Ce qu'on attend de chaque agent
Un fichier `dossier.md` (PAS `findings.md`, `report`, `summary` ni `analysis` : ces noms sont bloqués) dans TON
dossier de travail, avec :
1. Les faits : réglementations et programmes (nom exact, numéro, dates d'entrée en vigueur ou d'échéance,
   obligations concrètes, sanctions, qui est concerné, combien d'acteurs, budgets publics associés), chiffres de
   marché, acteurs existants (concurrents, prix publics), douleurs concrètes des cibles.
2. Pour chaque fait : la SOURCE (URL) et la date. Distingue toujours texte adopté et proposition. Pour toute
   capacité matérielle ou logicielle : écris « capacité vérifiée (source) » ou « capacité supposée ». Pas
   d'invention ; sinon écris « hypothèse non sourcée ».
3. Une section « Opportunités produit » : 4 à 6 idées NOUVELLES (hors des vingt-quatre exclues), chacune avec :
   cible précise (et combien de clients potentiels), problème ou obligation, ce que fait le produit (quelle IA,
   quel matériel du commerce, quelle base de données), prix et modèle, effort technologique, concurrents,
   « pourquoi maintenant » DATÉ (texte adopté, échéance, budget ouvert), et « premier client atteignable depuis
   Vancouver ou à distance ».
Rédige en FRANÇAIS. Les citations peuvent rester en anglais.

## Mémoire (obligatoire)
Tiens à jour `claude.md` dans TON dossier : à chaque étape notable, une ligne « succès » (requête ou source qui a
marché) ou « erreur » (fausse piste, source morte, outil en échec) et la leçon. Au fil de l'eau.

## Contraintes générales
- N'écris que dans ton dossier de travail. Pas de code produit, pas de commit.
- **Budget : au plus 12 appels à WebSearch** (le quota est partagé par toute la session) ; WebFetch est libre :
  privilégie les URL officielles (noaa.gov, coralreef.gov, fisheries.noaa.gov, myfwc.com, boem.gov, epa.gov,
  eur-lex.europa.eu, environment.ec.europa.eu, dfo-mpo.gc.ca, canada.ca, wildlife.ca.gov, coastal.ca.gov,
  ecology.wa.gov, verra.org, goldstandard.org, icvcm.org, tnfd.global) et les pages tarifaires des concurrents.
- Dates : nous sommes le 7 septembre 2026. Cherche ce qui est récent (2024-2026) et ce qui entre en vigueur
  en 2026-2030 : c'est là que se trouve le « pourquoi maintenant ».

## En cas de blocage
- Recherche web en échec deux fois : change de formulation ou passe à WebFetch ; si l'outil échoue encore, note-le
  dans claude.md et continue avec ce que tu as.
- Chiffre introuvable : fourchette raisonnée marquée « estimation ».
- Ne pose pas de question à l'orchestrateur : fais le meilleur choix, documente-le.
