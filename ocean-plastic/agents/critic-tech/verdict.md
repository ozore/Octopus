# Verdict technologique sur les 12 idées « Ocean Plastic »

Agent : critic-tech (CTO / architecte IA & données) · Date : 2026-09-05
Sources internes : `ocean-plastic/IDEAS.md`, `ocean-plastic/BRIEF.md`,
`ocean-plastic/agents/tech-landscape/findings.md` (grille d'effort, TRL, datasets),
`ocean-plastic/agents/ports-shipping/findings.md` (SafeSeaNet, MARPOL).
2 recherches web complémentaires (voir `claude.md`).

> **Tout chiffre d'effort et de coût de ce document est une ESTIMATION** produite par moi,
> calibrée sur la grille de `tech-landscape/findings.md` (8 000-12 000 €/mois-ingénieur chargé,
> équipe de 2-4 : 1 lead + 1-2 devs + 0-1 data scientist, hors commercial et hors coût de données
> payantes récurrentes). Aucune de ces valeurs n'est sourcée ailleurs. Les faits techniques
> (TRL, datasets, F1, licences) proviennent de `tech-landscape/findings.md`.

## Conventions de notation (1 à 5)

| Axe | 1 signifie | 5 signifie |
|---|---|---|
| **Faisabilité à 12 mois** | équipe de 2-4 ne livre pas un produit vendable en 12 mois | produit vendable et fiable en 12 mois, sans verrou scientifique |
| **Dépendance tierce (= RISQUE)** | le produit fabrique sa propre donnée, aucune API tierce critique | le produit meurt si un tiers ferme une API, un registre ou un guichet. **5 = mauvais** |
| **Avantage IA réel** | pur CRUD, l'IA serait un habillage marketing | sans IA/ML, il n'existe pas de produit du tout |
| **Défendabilité par la donnée** | la donnée accumulée n'a aucune valeur de rachat | après 18-24 mois, la base est irremplaçable et se vend seule |

**Attention à la lecture** : la colonne « dépendance » est un **risque**, donc une note haute est
un mauvais signal, contrairement aux trois autres colonnes.

---

## Tableau de synthèse

| # | Idée | Faisabilité 12 m | Dépendance (risque) | Avantage IA | Défendabilité donnée | Effort (m-i, est.) | Coût MVP (k€, est.) |
|---|---|:---:|:---:|:---:|:---:|:---:|:---:|
| 1 | DriftBox — conteneurs perdus | 4 | 4 | 2 | 4 | 7-11 | 80-150 |
| 2 | GearTrace — engins de pêche | 4 | 3 | 2 | 4 | 7-10 | 70-130 |
| 3 | PelletGuard — granulés | 3 | 2 | 2 | 3 | 8-14 (SaaS seul : 4-6) | 110-190 (SaaS seul : 40-70) |
| 4 | TrueBlue Claims — allégations | 5 | 3 | 3 | 2 | 5-8 | 50-100 |
| 5 | Plastic Credit Ratings | 5 | 5 | 2 | 4 | 5-8 | 50-100 |
| 6 | HarbourTwin — ports/marinas | 5 | 4 | 2 | 3 | 4-7 | 40-90 |
| 7 | WasteDeck — PRF / MARPOL V | 4 | 5 | 1 | 3 | 7-11 | 70-140 |
| 8 | CleanScore — plages | 3 | 4 | 4 | 4 | 7-11 | 70-140 (+ opérations drone) |
| 9 | RiverEye — rivières | 4 | 2 | 5 | 5 | 6-10 | 60-120 (+ 0,3-0,6 k€/point) |
| 10 | NurdleRisk — score assureurs | 2 | 5 | 2 | 3 | 9-14 | 90-180 (+ 25-100 k€/an AIS) |
| 11 | DiveLedger — centres de plongée | 5 | 2 | 1 | 2 | 2-4 | 20-45 |
| 12 | EPR Atlas — emballages | 4 | 3 | 2 | 3 | 6-10 (3-4 juridictions) | 60-120 |

Moyenne d'effort : 7 m-i. Aucune des 12 idées n'exige une percée scientifique **sauf** la brique
vision de PelletGuard (détection de granulés translucides) et, à un moindre degré, la validation
statistique de NurdleRisk.

---

## Fiches par idée

### 1. DriftBox — registre des conteneurs perdus

**Architecture MVP (5 briques)** — (a) *Base* PostgreSQL/PostGIS : événement de perte (position,
nombre, UN/IMDG, navire IMO), chaîne de preuve append-only (hash chaîné + S3 Object Lock) ;
(b) *Moteur de rapport et de routage* : gabarits SOLAS V/31-32 + MARPOL Protocole I, génération
PDF/XML, diffusion e-mail/EDI vers MRCC de l'État côtier, État du pavillon, et alerte aux navires
voisins (NAVTEX/SafetyNET côté autorité) ; (c) *Dérive* OceanParcels + Copernicus Marine (courants,
Stokes, vent) avec ensemble de trajectoires et cône de probabilité ; (d) *Ingestion AIS* pour
pré-remplir position/route et corroborer la météo ; (e) *App navire* offline, très basse bande
passante (liaison satellite : formulaire de quelques ko, pas d'upload photo lourd).
**Open source / gratuit** : Copernicus Marine (API Toolbox, gratuit), OceanParcels (Python),
ERA5, rapports WSC publics, sections publiques de GISIS.
**À construire** : le référentiel des destinataires réglementaires (points de contact MRCC par
État côtier, ~150 entrées, maintenance permanente), le paramétrage de flottabilité/windage des
conteneurs (aucun dataset public de calibration), le format de preuve opposable.
**Point le plus risqué** : la boucle réglementaire ne passe **pas** par le navire vers GISIS. Le
capitaine rapporte aux navires voisins, à l'État côtier et à l'État du pavillon ; c'est **l'État du
pavillon** qui téléverse dans le module GISIS (confirmé par recherche web, voir `claude.md`). Il
n'existe donc ni « déclaration en un clic conforme GISIS », ni API d'écriture. Corollaire : la base
agrégée « WSC en temps réel » dépendra de ce que les États publient, avec une latence et une
complétude hors de notre contrôle. Risque secondaire : ~1 274 conteneurs/an correspondent à
seulement quelques dizaines d'**événements** mondiaux — la fréquence d'usage par navire est
quasi nulle et la base propriétaire croît très lentement.
**Dé-risquage en 4 semaines** : S1 audit du module GISIS « container loss » (ce qui est public,
format, latence) auprès de 2 administrations de pavillon (Malte, Liberia, Marshall) et de l'EMSA ;
S2 obtenir 3 à 5 rapports de perte réels via un P&I club et vérifier qu'on les reproduit à
l'identique ; S3 rejouer MSC Zoe, Zim Kingston et X-Press Pearl avec Parcels + CMEMS et mesurer
l'erreur de position à 24 h et 72 h contre les échouages constatés ; S4 test d'émission du rapport
en liaison satellite dégradée. Livrable : go/no-go entre « produit de conformité » (fragile) et
« produit de dérive/récupération » (le vrai contenu technique).

### 2. GearTrace — registre des engins de pêche et REP

**Architecture MVP** — (a) *App mobile offline-first* (SQLite local, synchronisation différée :
la connectivité en mer est nulle) pour la déclaration de perte géolocalisée, photo, type d'engin ;
(b) *Base* registre des marquages + historique des pertes (PostGIS) ; (c) *Moteur de règles REP
multi-pays* versionné (2023/2842, exécution 2025/274, DSUP art. 8, France décret 2025-775, Suède,
Norvège 2027, Corée) et calcul des éco-contributions ; (d) *Intégration journal électronique* —
la brique structurante est le standard **FLUX/ERS UN-CEFACT** de la DG MARE, pas une API maison ;
(e) *Dérive et dépôt* : Parcels + CMEMS pour les engins flottants, et pour les engins coulés un
modèle de probabilité de présence (bathymétrie EMODnet + courants de fond + type d'engin).
**Open source / gratuit** : Copernicus Marine, OceanParcels, EMODnet bathymétrie, spécifications
FLUX publiques, GGGI Data Portal.
**À construire** : le moteur réglementaire multi-pays (c'est l'actif, et il n'est pas de l'IA),
le connecteur ERS, le modèle de localisation d'engins déposés sur le fond.
**Point le plus risqué** : l'accès au journal électronique est un **guichet d'administration
nationale**, pas une API ouverte. Sans lui, l'app impose une double saisie que les pêcheurs ne
feront pas — et le produit s'effondre côté adoption, pas côté technique. Risque n°2 : aucune
vérité terrain publique pour calibrer la localisation d'engins coulés.
**Dé-risquage en 4 semaines** : obtenir la spécification FLUX et un bac à sable auprès de la DPMA
(ou d'un éditeur ERS installé : Olrac, Succorfish, Nautical) et écrire un connecteur jetable ;
en parallèle, récupérer les données des campagnes norvégiennes de récupération (positions déclarées
vs filets effectivement remontés) et tester si un modèle bat la baseline triviale « rayon de 2 km
autour de la position déclarée ». Si la baseline gagne, on retire la promesse IA et on vend le
registre seul — ce qui reste un bon produit.

### 3. PelletGuard — conformité granulés

**Architecture MVP** — (a) *SaaS conformité* : sites, plan de gestion des risques (gabarits
2025/2365), registre des pertes, échéancier de certification, dossier d'audit prêt pour
SGS/DNV/DQS — CRUD + workflow documentaire, zéro IA ; (b) *Module vision* : caméras existantes
RTSP ou 2-4 caméras 4K par site, inférence en edge (Jetson Orin Nano, ~250-500 €/site) ;
(c) *Base* registre des certificats + score de risque fournisseur exposé en API ; (d) intégration
légère aux systèmes qualité clients (export/import fichier).
**Open source / gratuit** : YOLOv8 / RT-DETR, SAM pour l'annotation semi-automatique. **TACO et
AquaTrash ne contiennent pas de granulés** : le dataset est à créer entièrement.
**Point le plus risqué** : la détection par vision de granulés de 2 à 5 mm, translucides, sur béton
mouillé et de nuit, est un **problème de recherche ouvert**, pas une tâche d'ingénierie. C'est
l'écart promesse/réalité le plus large des 12 idées. Le contournement réaliste n'est pas de détecter
le granulé mais l'**événement-proxy** : big-bag éventré, raccordement de citerne non conforme,
absence de bac de rétention ou de grille avaloir, déversement visible en masse — ce qui est
détectable, et qui correspond exactement à ce que l'auditeur veut voir.
**Dé-risquage en 4 semaines** : deux jours sur un site réel (poste de chargement citerne + zone de
lavage), collecte de 3 000 à 5 000 images en conditions variées (jour, nuit, pluie), annotation de
500 avec SAM, entraînement d'une baseline de segmentation. Critère de sortie explicite : rappel
> 0,8 sur un déversement de plus de 100 g vu à 5 m. En cas d'échec, bascule assumée sur la
détection de non-conformité de procédure, et le SaaS seul (4-6 m-i, 40-70 k€) devient le produit.

### 4. TrueBlue Claims — preuve d'allégation

**Architecture MVP** — (a) *Crawler + pipeline LLM* : ingestion sites, packagings, campagnes ;
extraction des allégations ; classification de risque au regard de 2024/825 (annexe I) via RAG sur
un corpus réglementaire + décisions DGCCRF/ACM ; (b) *Base dossier de preuve par lot* : chaîne de
custody collecte → recycleur → marque, certificats OBP/PCX rattachés, géolocalisation de collecte
et distance à la côte (définition OBP des 50 km) ; (c) *Corroboration satellite* Sentinel-2 via
Copernicus ; (d) *Export* DGCCRF/ACM + piste d'audit horodatée et inviolable.
**Open source / gratuit** : Copernicus/Sentinel-2, MARIDA et Global Plastic Watch comme référence
méthodologique, registres OBP publics, EUR-Lex.
**Point le plus risqué** : le produit promet une **preuve** que la technologie ne peut pas
fabriquer. Sentinel-2 à 10 m/pixel n'établit pas qu'un site a collecté X tonnes ; au mieux il
atteste qu'un site existe, sa distance à la côte et son évolution. La traçabilité réelle du lot
repose sur des déclaratifs fournisseurs invérifiables. Vendre « preuve » plutôt que « détection de
risque » expose au retour de bâton juridique si un dossier est attaqué.
**Dé-risquage en 4 semaines** : prendre 3 marques réelles portant une allégation « ocean plastic »
et tenter de reconstituer le dossier de bout en bout avec les seuls documents réellement
obtenables ; faire qualifier par un avocat consommation ce qui serait opposable devant la DGCCRF.
Livrable : liste « preuves obtenables / non obtenables » qui tranche entre outil de preuve
(ambitieux et exposé) et outil de détection de risque d'allégation (modeste, immédiatement
vendable, et honnête).

### 5. Plastic Credit Ratings — agence de notation

**Architecture MVP** — (a) *Ingestion des registres* Verra PWRS, PCX, OBP cert, CleanHub, Empower :
aucun n'expose d'API, donc scrapers + parsing de PDF assisté par LLM ; (b) *Résolution d'entités et
détection de double comptage* : record linkage sur empreinte (géographie × période × volume ×
porteur) — technique classique, pas de l'IA lourde ; (c) *Modèle de scoring* explicite et publié
(type de traitement recyclage vs cimenterie, additionnalité, géolocalisation vérifiée, gouvernance,
historique de controverses) avec justification traçable ; (d) *Vérification satellite optionnelle*
(Sentinel-2, approche Global Plastic Watch) sur l'existence des sites ; (e) *Export rapport
CSRD/ESRS E2*.
**Open source / gratuit** : Copernicus, MARIDA, registres publics, EUR-Lex.
**Point le plus risqué** : **dépendance maximale** — 100 % de la matière première provient de
registres tiers, sans API, sans SLA, dont les opérateurs sont juges et parties et peuvent bloquer
le scraping du jour au lendemain. C'est le seul des 12 produits qu'un tiers peut éteindre par une
décision unilatérale. Sur le carbone, Sylvera et BeZero ont contourné cela par la réputation et
des accords ; ici le marché sous-jacent (462 M$) est trop petit pour offrir le même levier.
**Dé-risquage en 4 semaines** : écrire les 5 scrapers, normaliser, et tenter de **démontrer
empiriquement au moins un cas de double comptage ou d'incohérence de volume** entre deux
registres. Un cas prouvé constitue à lui seul toute la démonstration commerciale. Si aucune
incohérence n'est détectable à partir des données publiques, le produit n'a pas de preuve
d'existence et il faut renoncer ou négocier des accords d'accès avant d'écrire une ligne de plus.

### 6. HarbourTwin — logiciel au-dessus des robots portuaires

**Architecture MVP** — (a) *Connecteurs robots* (IADYS/Jellyfishbot, RanMarine/WasteShark, Seabin,
BeBot/PixieDrone) avec, en repli obligatoire, un import CSV et une saisie de fin de tournée sur
tablette + pesée ; (b) *Base* PostGIS des collectes, capteurs, zones ; (c) *Modèle d'accumulation* :
la vraie approche n'est pas la dérive lagrangienne mais l'apprentissage empirique
zone × vent × marée à partir de l'historique de collecte ; (d) *Moteur d'indicateurs de label*
(Pavillon Bleu, Blue Flag, Clean Marina, Ports Propres) + rapport annuel ; (e) affichage public
« X kg retirés ».
**Open source / gratuit** : Copernicus Marine, OceanParcels, EMODnet bathymétrie, marées SHOM/EMODnet.
**Point le plus risqué** : deux verrous cumulés. (i) Les API des fabricants de robots sont fermées
ou inexistantes — c'est un risque **contractuel** qu'aucune prouesse technique ne résout, et le
produit est un agrégateur neutre, donc structurellement non désiré par les fabricants. (ii) La
résolution de Copernicus (régional ≈ 2-3 km) est **inutilisable à l'échelle d'un bassin portuaire
de 500 m** ; la promesse « prédiction de dérive dernier kilomètre » n'est pas tenable avec les
modèles gratuits, il faudrait un modèle hydrodynamique local (Telemac, Delft3D, SCHISM) hors
budget MVP. S'ajoute un problème de démarrage à froid : le modèle appris exige des mois de
tournées avant d'être utile.
**Dé-risquage en 4 semaines** : demander **par écrit** un accès data à IADYS et RanMarine — un
refus est en soi l'information décisive ; signer 2 marinas pilotes et tester si 8 semaines de
journaux de collecte croisés avec vent et marée prédisent la zone de la semaine suivante mieux que
la baseline « toujours le même coin ». Si la baseline gagne, il n'y a pas de produit IA, seulement
un très bon outil de reporting de label — ce qui reste vendable, mais à un autre prix.

### 7. WasteDeck — conformité déchets navires et ports

**Architecture MVP** — (a) *Moteur de règles* MARPOL Annexe V et directive 2019/883 codifié
(catégories de déchets, interdictions de rejet, seuils, grilles de redevance indirecte par port) —
c'est l'actif réel ; (b) *Intégration guichet* : depuis le règlement EMSWe 2019/1239 (applicable
15/08/2025), le point d'entrée n'est pas SafeSeaNet directement mais le **guichet unique maritime
national (NSW)** de chaque État membre, plus THETIS-EU en lecture ; (c) *Pré-remplissage AIS* +
plan de voyage ; (d) *e-Garbage Record Book* sur tablette, offline, horodatage GPS, export scellé
(chaîne de hachage + signature) ; (e) *Facturation* de la redevance et statistiques d'inspection.
**Open source / gratuit** : formats et circulaires IMO publics, THETIS-EU en consultation.
Quasiment rien d'autre : c'est un produit d'intégration, pas un produit de données.
**Point le plus risqué** : le coût d'intégration est **linéaire par pays**. L'EMSWe devait
harmoniser les guichets ; l'harmonisation est partielle et chaque NSW conserve son interface, son
processus d'accréditation et sa langue. Trois pays coûtent trois fois le travail — ce qui détruit
la marge SaaS et le rythme d'expansion. Ajouté à cela : avantage IA nul assumé (note 1), donc
aucune barrière technologique face à un Portbase ou un dbh qui déciderait d'ouvrir son module.
**Dé-risquage en 4 semaines** : connecter réellement **un seul** guichet en bac à sable (France,
Belgique ou Portugal), et **chronométrer** de bout en bout le processus d'accréditation. Le chiffre
obtenu — semaines et euros par pays — décide seul de la viabilité du modèle multi-pays. Toute
réponse supérieure à 2 mois-ingénieur par pays condamne le plan d'expansion tel qu'écrit.

### 8. CleanScore — indice de propreté des plages

**Architecture MVP** — (a) *Ingestion multi-sources* : EMODnet Chemistry (WFS, exploitable), OSPAR
Beach Litter (portail, API non confirmée), TIDES (pas d'API, export manuel), Marine LitterWatch ;
harmonisation vers les catégories du protocole DCSMM/JRC (J-list) — travail ingrat mais c'est
l'actif ; (b) *Acquisition drone* RGB (DJI Mavic 3 ~2 500 €) à 20-40 m ; (c) *Vision* YOLOv8
fine-tuné sur TACO/AquaTrash + collecte locale ; (d) *Score normalisé* par plage + cartographie de
priorisation ; (e) *Export* DCSMM/OSPAR et dossiers de label.
**Open source / gratuit** : TACO (1 500 images, 28 catégories), AquaTrash, YOLO, EMODnet WFS,
OSPAR, données citoyennes (Surfrider, Marine Debris Tracker).
**Point le plus risqué** : deux illusions à purger. (i) **La promesse satellite est infondée pour
la plage** : Sentinel-2 à 10 m/pixel ne détecte que des accumulations denses de plastique flottant
en mer (c'est le domaine de MARIDA) ; il ne voit pas des déchets de plage. Seul le drone tient.
(ii) Un score maison n'a **aucune valeur réglementaire ou de labellisation** s'il n'est pas démontré
équivalent au comptage manuel normalisé OSPAR/DCSMM sur 100 m. Contrainte annexe réelle : le vol de
drone sur plage fréquentée relève des catégories EASA A2/A3, ce qui limite les créneaux et impose
un opérateur.
**Dé-risquage en 4 semaines** : protocole de comparabilité — 10 plages, comptage manuel OSPAR par
un opérateur qualifié **et** vol drone le même jour, puis régression du score automatique sur le
comptage officiel. Publier le r² et l'intervalle de confiance par grande catégorie. Au-delà de
r² > 0,8, le produit existe et devient vendable aux organismes de label ; en dessous, on ne vend
qu'une cartographie de priorisation d'intervention (utile aux communes, sans valeur de label).

### 9. RiverEye — points chauds fluviaux

**Architecture MVP** — (a) *Capteurs* : caméras fixes bas coût sur ponts et déversoirs (Reolink 4G
ou Raspberry Pi + module 4G, 150-400 € par point), échantillonnage d'images ou inférence en edge ;
(b) *Vision* : **réutilisation directe du pipeline open source Plastic Origins** (Surfrider,
GitHub) — détection, comptage, géolocalisation et classification de déchets fluviaux — complété
par TACO et un fine-tuning local ; (c) *Base GIS* : inventaire des dispositifs de capture tous
fournisseurs, tournées de maintenance, rapports de conformité State Water Board ; (d) *Priorisation*
par sous-bassin en croisant comptages, débit (Hub'Eau en France, USGS aux USA — gratuits avec API)
et occupation du sol ; (e) *App* de tournée pour les équipes d'exploitation.
**Open source / gratuit** : Plastic Origins (code et modèle), TACO, YOLO, OpenStreetMap, Hub'Eau,
USGS. C'est **la seule des 12 idées où un pipeline open source quasi complet existe déjà**.
Nuance : Plastic Origins a été arrêté en 2025 faute d'industrialisation — c'est à la fois un cadeau
(code disponible) et un avertissement (personne n'a su en faire un produit).
**Point le plus risqué** : la fiabilité du comptage en conditions réelles — nuit, crue, reflets sur
l'eau, occlusion, confusion avec les débris végétaux (qui dominent en volume après une pluie) — et
la robustesse du point de mesure (vandalisme, alimentation, lien 4G). Risque réglementaire adjacent :
la méthode de référence du State Water Board californien est une évaluation visuelle au sol, pas un
comptage de flux ; il faut démontrer l'équivalence ou faire accepter la nouvelle métrique.
**Dé-risquage en 4 semaines** : 3 caméras sur un pont urbain pendant 4 semaines incluant au moins
un épisode pluvieux ; annotation de 2 000 images ; mesure de la précision de comptage contre un
comptage humain sur la même vidéo, ventilée par condition météo ; relevé de la disponibilité 4G et
de la consommation. Livrables : courbes précision/rappel par condition, et coût réel complet par
point de mesure (matériel + pose + exploitation) à comparer au prix affiché de 8-25 k€/an.

### 10. NurdleRisk — score de risque pour assureurs

**Architecture MVP** — (a) *Ingestion AIS* (payant et consolidé : Kpler détient MarineTraffic,
FleetMon et Spire ; S&P a repris ORBCOMM — ordres de grandeur relevés en septembre 2026 :
MarineTraffic 200-500 $/mois, Spire 2 000-8 000 $/mois, offre entreprise sur devis) ;
(b) *Données environnementales* CMEMS et ERA5 (gratuites) ; (c) *Base d'événements* : rapports WSC,
futur module GISIS, enquêtes MAIB/BSU/DMAIB ; (d) *Modèle de risque* par navire/route/cargaison ;
(e) *API de scoring* et, en V2, produits paramétriques (nécessitent un porteur de risque, donc hors
périmètre technique).
**Open source / gratuit** : CMEMS, ERA5, rapports WSC et rapports d'enquête publics. L'AIS, lui,
est payant et concentré entre deux mains — c'est un coût récurrent et un risque de dépendance.
**Point le plus risqué** : **la statistique ne suit pas**. 1 274 conteneurs perdus par an
correspondent à quelques dizaines d'événements mondiaux, dont un seul pesait 640 conteneurs en 2025
— distribution à queue extrêmement lourde. On n'apprend pas un modèle de ML sur 30 à 60 événements
annuels ; c'est un problème de valeurs extrêmes et de causalité, à traiter par un modèle expert
transparent, pas par du gradient boosting. S'ajoute l'inaccessibilité du manifeste de cargaison
(savoir qu'un navire transporte des granulés est précisément la variable la plus prédictive, et
elle n'est pas publique) et une circularité gênante : le produit est censé se nourrir de DriftBox,
qui n'existe pas encore. C'est l'idée où l'écart entre « avantage IA annoncé » et « avantage IA
démontrable » est le plus grand.
**Dé-risquage en 4 semaines** : assembler la base d'événements historiques publics 2011-2025 (WSC,
rapports d'enquête, presse spécialisée) et **compter les événements réellement documentés avec
métadonnées exploitables**. Seuil de décision : moins de 300 événements exploitables sur 15 ans
interdit tout modèle appris — on repositionne alors sur un score expert co-construit et cosigné
avec un P&I club, ce qui change le produit, le prix et le discours.

### 11. DiveLedger — preuve d'impact pour centres de plongée

**Architecture MVP** — (a) *App mobile* de log de sortie (participants, durée, objets remontés,
photos, géolocalisation) ; (b) *Base* PostgreSQL simple + agrégats par centre et par région ;
(c) *Certificat vérifiable* : QR renvoyant vers une page publique signée cryptographiquement — un
registre signé suffit, la blockchain serait un coût sans bénéfice ici ; (d) *API* vers Green Fins,
Blue Flag et OTA ; (e) option ultérieure de classification d'images sous-marines (dataset TrashCan
existe) — gadget en V1.
**Open source / gratuit** : datasets TrashCan/AquaTrash, fonds de carte, bibliothèques de signature.
Aucune brique océanographique nécessaire.
**Point le plus risqué** : **il n'y a pas de risque technique** — et c'est précisément le problème.
Deux développeurs livrent ce produit en 3 mois ; la barrière à l'entrée est nulle, la donnée
accumulée (des logs de plongée) n'a pas d'acheteur naturel, et PADI AWARE occupe le terrain
gratuitement. Sur l'axe technologie, le verdict est « rien à défendre », pas « trop difficile ».
Le TAM reconnu dans IDEAS.md (~6 M€) confirme qu'il s'agit d'une porte d'entrée, pas d'une société.
**Dé-risquage en 4 semaines** : la seule question qui compte n'est pas technique — prototyper le
certificat QR et le déployer sur 5 centres pour mesurer **le taux de scan par le client final**.
Si les plongeurs ne scannent pas, la valeur pour le centre est nulle et l'idée doit rester un
module de CleanScore plutôt qu'un produit autonome.

### 12. EPR Atlas — conformité emballages multi-juridictions

**Architecture MVP** — (a) *Moteur de règles déclaratif versionné dans le temps* (définitions du
recyclé, seuils, formats, barèmes modulés) — c'est le cœur, et c'est de l'ingénierie de la
connaissance largement sous-estimée dans l'estimation « effort faible à moyen » d'IDEAS.md ;
(b) *Veille LLM* : surveillance des journaux officiels (EUR-Lex expose une API ; CPCB, NEC, VEP
beaucoup moins), extraction des changements, **validation humaine obligatoire** — on ne laisse pas
un LLM décider d'une obligation légale ; (c) *Calcul des éco-contributions* et génération des
déclarations par portail (CPCB avec QR en Inde, NEC aux Philippines, VEP Fund au Vietnam, CAA en
Californie) — la plupart sans API, donc dépôt de fichiers ou automatisation d'interface ;
(d) *Ingestion des données produit* depuis les ERP/PLM clients (nomenclatures d'emballages sales :
c'est en pratique le plus gros chantier) ; (e) *Simulateur* coût de conformité vs contribution.
**Open source / gratuit** : API EUR-Lex, référentiels de nomenclature publics. Peu d'autre.
**Point le plus risqué** : le coût marginal par juridiction **ne décroît pas** — chaque pays
apporte son modèle de données, son portail, sa langue et son calendrier. Le produit ne se comporte
donc pas comme un SaaS mais comme un cabinet outillé, ce qui plafonne la marge. À cela s'ajoute
le fait que le marché est déjà occupé par des acteurs financés (rePurpose Global 500+ marques,
Recyda, Source Intelligence) avec plusieurs années d'avance sur l'UE et les USA — le seul angle
technique défendable est la couverture Asie-Pacifique, précisément là où les portails sont les
moins automatisables. Lien avec l'océan : indirect.
**Dé-risquage en 4 semaines** : modéliser **trois juridictions volontairement dissemblables**
(PPWR européen, SB 54 californien, CPCB indien) dans un **schéma de règles unique**. Si un seul
modèle de données les absorbe sans champs spécifiques par pays, la thèse « moteur unique
multi-juridictions » tient et l'expansion est industrialisable. Si le schéma explose en cas
particuliers, le produit est en réalité un service et il faut reprendre le modèle économique
avant d'écrire le code.

---

## Top 3 sur l'axe technologie

**1. RiverEye (idée 9).** La seule idée des 12 où l'IA est **indispensable** (note 5) : compter
manuellement des déchets flottants à l'échelle d'un bassin versant est impossible, donc sans vision
par ordinateur il n'y a littéralement pas de produit. Elle cumule les trois bonnes propriétés :
dépendance tierce la plus faible avec DiveLedger (note 2 — le produit fabrique sa propre donnée
avec ses propres caméras, personne ne peut lui couper le robinet), défendabilité maximale (chaque
point de mesure produit une série temporelle propriétaire et le dataset fluvial annoté devient
rapidement le meilleur disponible, ce qui améliore le modèle qui justifie de nouveaux points :
véritable boucle de données), et un pipeline open source déjà écrit (Plastic Origins) qui retire
2 à 3 mois-ingénieur du chemin critique. Le risque restant est un risque d'ingénierie terrain
(robustesse, météo, 4G), donc mesurable et bornable en 4 semaines.

**2. CleanScore (idée 8).** Avantage IA réel (note 4) : le comptage automatisé remplace un
protocole manuel normalisé coûteux, et la série temporelle par plage est exactement l'actif que
les labels, les assureurs et l'immobilier savent acheter (défendabilité 4). C'est aussi l'idée qui
exige la plus grande discipline intellectuelle : il faut **abandonner publiquement la promesse
satellite** (Sentinel-2 ne voit pas les déchets de plage) et gagner la comparabilité au protocole
OSPAR/DCSMM par la mesure, pas par l'affirmation. À ces deux conditions, elle est solide.

**3. GearTrace (idée 2).** Faisabilité élevée sans verrou scientifique, et défendabilité 4 : le
registre de marquages et l'historique de pertes géolocalisées sont alimentés par une **obligation
réglementaire**, ce qui est la meilleure source de donnée propriétaire qui soit. Le risque est
administratif (accès au journal électronique ERS/FLUX) et non technique — donc négociable, à la
différence d'un verrou de physique ou de statistique. Je la place devant DriftBox (idée 1), pourtant
proche, pour deux raisons techniques : le volume d'événements de DriftBox (quelques dizaines par an)
est trop faible pour constituer un actif de données, et le circuit GISIS passe par les États du
pavillon, ce qui prive DriftBox de la brique d'intégration qui fait sa promesse.

## Bottom 3 sur l'axe technologie

**1. NurdleRisk (idée 10).** L'IA y est vendue alors que les données ne peuvent pas la porter :
quelques dizaines d'événements par an, à queue lourde, avec la variable la plus prédictive (la
cargaison réelle) inaccessible. Dépendance tierce maximale (AIS désormais concentré chez Kpler et
S&P, coût récurrent significatif) et circularité assumée avec DriftBox, qui n'existe pas encore.
Faisabilité 2 : à 12 mois on livre au mieux une heuristique habillée, pas un score validé — et un
assureur teste un score avant de payer 50-150 k€/an.

**2. DiveLedger (idée 11).** Écarté par **absence de contenu technique**, pas par difficulté. Aucun
avantage IA (note 1), aucune défendabilité par la donnée (note 2), réplicable en 3 mois par deux
développeurs, face à un incumbent gratuit (PADI AWARE). Sur l'axe technologie il n'y a rien à
construire et rien à protéger. À conserver éventuellement comme module d'alimentation de CleanScore.

**3. WasteDeck (idée 7).** Zéro IA assumée (note 1) et dépendance tierce maximale (note 5) à des
guichets uniques maritimes nationaux hétérogènes, chacun avec sa propre accréditation. Le coût
d'intégration croît **linéairement par pays**, ce qui interdit l'économie d'échelle attendue d'un
SaaS ; le fossé concurrentiel serait fait de connecteurs, pas de données. Techniquement banal,
opérationnellement lourd. EPR Atlas (idée 12) souffre du même mal linéaire mais conserve, lui, un
actif réglementaire réutilisable et un marché déjà prouvé, ce qui le sauve de cette liste.

**Mention spéciale — PelletGuard (idée 3)** : ce n'est pas un mauvais projet, mais c'est celui qui
porte le plus grand écart entre la promesse affichée et la réalité technique. Le SaaS de conformité
est sain, rapide (4-6 m-i) et peu dépendant ; la brique vision « détection de granulés » relève de
la recherche. Vendre le SaaS et présenter la vision comme un pilote R&D est la seule position
techniquement honnête.
