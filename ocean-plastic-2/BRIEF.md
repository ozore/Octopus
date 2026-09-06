# Étude « Ocean Plastic », seconde passe : brief commun à tous les agents

## Contexte
Une première passe (dossier `ocean-plastic/`, rapport `ocean-plastic/report/index.html`, liste `ocean-plastic/IDEAS.md`)
a produit douze idées : DriftBox (conteneurs perdus), GearTrace (engins de pêche UE), PelletGuard (granulés UE),
TrueBlue Claims (allégations « ocean plastic »), Plastic Credit Ratings, HarbourTwin (robots de port), WasteDeck
(déchets navires UE), CleanScore (plages), RiverEye (caméras sur rivières, Californie), NurdleRisk (assureurs),
DiveLedger (centres de plongée), EPR Atlas (emballages). **Ces douze idées sont exclues : la seconde passe doit
trouver douze idées entièrement nouvelles.** Lis `ocean-plastic/IDEAS.md` pour savoir ce qu'il faut éviter.

## Le fondateur (ce qui oriente tout)
- Basé à Vancouver (Colombie-Britannique), français, plongeur, accès à deux clubs de plongée, aux marinas de
  Vancouver, au port de pêche de Steveston et potentiellement au port industriel de Vancouver.
- Profil technique (développement, data, IA) et produit ; temps plein ; bootstrap avec moins de 25 k$ CAD.
- Marchés visés dans l'ordre : Californie, Floride, Europe, Canada et Pacifique Nord-Ouest (Colombie-Britannique,
  Washington, Oregon, Alaska) comme terrain immédiat. L'Asie seulement si la proposition de valeur y est très forte.
- Revenus voulus vite : beaucoup de petits clients (100 à 1 000 $ par mois), quelques pilotes payants
  (15 à 80 k$), licence de données ; subventions en complément, jamais comme modèle.
- Produit : logiciel plus matériel du commerce (caméras, drones, sonars, capteurs, scanners achetés sur étagère),
  avec un vrai effort de développement (IA, vision, base de données, atlas) qui construit une barrière à l'entrée.
  Pas d'application triviale.
- Stades du cycle visés : prévention des fuites en amont, détection et surveillance, nettoyage et valorisation.
  (Pas la réduction de la consommation.) L'océan doit rester visible dans le discours, même si le lien est indirect.
- Une société = une idée.

## Ce qu'on attend de chaque agent
Un fichier `dossier.md` (PAS `findings.md`, `report`, `summary` ni `analysis` : ces noms sont bloqués) dans TON
dossier de travail, avec :
1. Les faits : réglementations et programmes (nom exact, numéro, dates d'entrée en vigueur ou d'échéance,
   obligations concrètes, sanctions, qui est concerné, combien d'acteurs, budgets publics associés), chiffres de
   marché, acteurs existants (concurrents, prix publics), douleurs concrètes des cibles.
2. Pour chaque fait : la SOURCE (URL) et la date. Distingue toujours texte adopté et proposition. Pas d'invention ;
   sinon écris « hypothèse non sourcée ».
3. Une section « Opportunités produit » : 4 à 6 idées NOUVELLES (hors des douze de la première passe), chacune avec :
   cible précise (et combien de clients potentiels), problème ou obligation, ce que fait le produit (quelle IA,
   quel matériel du commerce, quelle base de données), prix et modèle, effort technologique, concurrents,
   « pourquoi maintenant », et « premier client atteignable depuis Vancouver ou à distance ».
Rédige en FRANÇAIS. Les citations peuvent rester en anglais.

## Mémoire (obligatoire)
Tiens à jour `claude.md` dans TON dossier : à chaque étape notable, une ligne « succès » (requête ou source qui a
marché) ou « erreur » (fausse piste, source morte, outil en échec) et la leçon. Au fil de l'eau.

## Contraintes générales
- N'écris que dans ton dossier de travail. Pas de code produit, pas de commit.
- **Budget : au plus 12 appels à WebSearch** (le quota est partagé par toute la session) ; WebFetch est libre :
  privilégie les URL officielles connues (gov, gc.ca, noaa.gov, epa.gov, eur-lex, legislature.ca.gov,
  myfwc.com, ecology.wa.gov, dfo-mpo.gc.ca, tc.canada.ca) et les pages tarifaires des concurrents.
- Dates : nous sommes le 6 septembre 2026. Cherche ce qui est récent (2024-2026) et ce qui entre en vigueur
  en 2026-2030 : c'est là que se trouve le « pourquoi maintenant ».

## En cas de blocage
- Recherche web en échec deux fois : change de formulation ou passe à WebFetch ; si l'outil échoue encore, note-le
  dans claude.md et continue avec ce que tu as.
- Chiffre introuvable : fourchette raisonnée marquée « estimation ».
- Ne pose pas de question à l'orchestrateur : fais le meilleur choix, documente-le.
