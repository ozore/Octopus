# Memoire de travail, generateur releve-hydro

## Lecture faite, dans l'ordre
1. ocean-6/BRIEF-GENERATION.md (entier)
2. ocean-6/MEMOIRE-MORTS.md (dix causes, carte des occupants)
3. ocean-6/generation/releve-hydro/lignes.md (lignes #5, #7, #19 energies-marines ; #19 laboratoires-surveillance ;
   #4 ports-terminaux-marinas)

Rien d'autre du depot n'a ete lu, conformement au brief.

## Recherches web utilisees (3 sur 4 autorisees au total, tours 1 et 2 confondus)
1. "EIVA NaviSuite Naia AI automatic pipeline cable tracking machine learning" : a confirme que le module IA
   commercialise par EIVA (NaviSuite Deep Learning Pipeline Inspection) est scope pipeline et cable, pas fond
   marin generique.
2. "QPS Qimera CARIS automated seabed classification AI target detection sonar 2025" : a confirme que QPS
   automatise le flux d'import/maillage et la retrodiffusion, mais que la classification de cible par CNN est
   presentee comme "peut etre integree" (integration tierce), pas une fonction Qimera livree en natif.
3. "side scan sonar target list eelgrass SAV survey required before dredging permit small hydrographic survey
   company" : a confirme l'exigence reglementaire de releve d'herbiers/obstructions avant permis de dragage
   (exemple California Coastal Commission) et a fait remonter une societe de releve privee reelle (MBC Applied
   Environmental Sciences) proposant deja des services de cartographie de type de fond.

Budget restant pour le tour 2 : une requete WebSearch, a garder pour verifier un occupant que le tueur
identifierait, plutot que pour re-verifier ce qui est deja confirme ci-dessus.

## Decisions prises
- Une seule idee retenue au tour 1 (le brief permet une ou deux) : la classification d'objets et d'habitat du
  fond a partir des donnees sonar deja collectees pendant le releve bathymetrique paye. Choix motive par la
  solidite de la verification (trou reel, confirme par recherche, distinct de tout occupant trouve) plutot que
  par la dispersion sur une deuxieme idee moins verifiee.
- Ecarte une idee de type "detection de munitions non explosees" malgre la proximite technique (meme detection
  de cible sur sonar lateral) : trop proche du champ defense interdit au fondateur (brief section 2, "pas de
  defense"), meme en usage civil de securite avant dragage. Reformule volontairement en debris/obstructions et
  habitat (herbiers, fond dur) pour rester hors du champ militaire.
- Ecarte une deuxieme idee de type "nettoyage automatique des sondes bathymetriques" (holiday/rejet
  d'aberrantes) : deja couverte par CUBE (CARIS) depuis les annees 2000 et par les flux "mains libres" de Qimera
  Live (QPS), donc tuee d'avance par la cause 1 (occupant deja en place).
- Prix fixe comme ligne de facturation nouvelle du prestataire vers son client final (marina, port), jamais
  comme remise sur le jour de navire ou le jour de technicien deja factures, pour respecter l'interdit sur le
  gain de productivite vendu a qui facture le jour.
- Acheteurs nommes verifies un par un pour eviter un nom invente : MBC Applied Environmental Sciences trouve par
  recherche cette passe ; Ocean Surveys Inc et TerraSond retenus de connaissance generale comme societes privees
  reelles de releve hydrographique cote est et Alaska, non revérifiees par recherche dediee faute de budget
  restant, a revalider si le tueur les met en doute.

## Points fragiles a surveiller si le tueur revient
- La population du point 6 est une estimation, pas un comptage source direct (limite reconnue dans le dossier).
- Ocean Surveys Inc et TerraSond comme acheteurs n'ont pas ete revérifiés par recherche web cette passe.
- La frontiere avec l'interdit "un agent lit les documents et redige le rapport du regulateur" a ete tenue en
  gardant le produit du cote de la vision par ordinateur sur image sonar (detection/segmentation), jamais de la
  redaction de texte reglementaire ; a reexpliquer clairement si le tueur la confond.

## Tour 2

Verdict tueur lu dans tueur.md (Tour 1) : idee 1 MORTE, cause 1, SonarWiz de Chesapeake Technology (module ATR,
reconnaissance de cible par reseau de neurones sur sonar lateral depuis la version 8.1.0, et outil Seabed
Characterization deja utilise pour cartographier des herbiers). Faute du tour 1 : SonarWiz etait nomme
explicitement par le brief parmi les logiciels deja payes a verifier en priorite (meme rang que CARIS, QPS,
EIVA) et n'a pas ete verifie avant d'ecrire.

Consigne du coordinateur pour le tour 2 : la piste de regeneration du tueur (etiquetage expert et mise en forme
reglementaire des sorties SonarWiz) est jugee cause 8 par avance et interdite sauf preuve qu'un modele generique
avec la grille publique du regulateur echoue sur cette tache ; chercher ailleurs, budget d'une seule requete
WebSearch pour tout le tour 2.

Requete utilisee (1 sur 1 restante, 4 sur 4 au total pour le dossier) : "bathymetric survey data archive
continuity multiple survey companies marina dredge history change detection software 2024 2025". Resultat :
Esri ArcGIS Bathymetry se vend explicitement comme archive historique multi temporelle avec detection de
changement (esri.com/en-us/arcgis/products/arcgis-bathymetry/overview) et NOAA NCEI tient deja l'archive
nationale des releves hydrographiques et la base HSMDB (ngdc.noaa.gov/mgg/bathymetry/hydro.html). Cette piste
(donnee non tenue en serie a travers plusieurs entreprises sur un meme site) retombe donc aussi sur la cause 1.

Trois pistes suggerees par le coordinateur toutes examinees et ecartees :
1. Rien entre deux releves a la marina : ecartee sans recherche dediee, deja occupee par le crowdsourcing grand
   public (Navionics SonarChart Live, Garmin Quickdraw Community, bathymetrie participative OHI) et acheteur
   hors barreau 1 impose (plaisancier/marina, pas societe de releve).
2. Traitement differe sous traite : une fois la piste 1 du tueur retiree (cause 8), rien de distinct ne reste
   verifie dans le temps imparti.
3. Donnee non tenue en serie multi entreprises : occupee par ArcGIS Bathymetry et NCEI (cause 1), verifie cette
   passe. Sous niche possible (numerisation de vieux rapports papier/PDF non integres a ArcGIS ni NCEI) laissee
   de cote faute de publication datee verifiee, pour ne pas repeter la cause 5 deja sanctionnee au tour 1.

Decision : pas de regeneration honnete possible avec le budget de recherche restant. Ecrit comme resultat
accepte dans dossier.md, section Tour 2, avec le detail des trois pistes et leurs causes de mort respectives.
Budget WebSearch du dossier desormais entierement consomme (4 sur 4).
