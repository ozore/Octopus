# Seconde passe : 12 idées nouvelles de société « Ocean Plastic » (synthèse orchestrateur, 06/09/2026)

Sources : les 8 dossiers `ocean-plastic-2/agents/*/dossier.md`. Aucune des 12 idées de la première passe n'est reprise.
Contraintes du fondateur (voir BRIEF.md) : Vancouver, plongeur, technique et produit, temps plein, bootstrap < 25 k$ CAD,
revenu rapide (petits clients, pilotes payants, licence de données), logiciel plus matériel du commerce, vraie barrière
à l'entrée, marchés Californie, Floride, Europe, Canada et Pacifique Nord-Ouest ; une société = une idée.

## 1. GhostSonar : cartographie IA des engins fantômes et débris de fond avec sonar grand public
- Déclencheur : Fonds engins fantômes du MPO, appel du 20/05/2026, 15 M$ CAD sur 2026-2029 (144 projets et 58,4 M$ depuis 2020) ;
  déclaration obligatoire des engins perdus (condition de permis depuis 2020, FGRS) ; NOAA Marine Debris Program 54 M$ FY25 ;
  VIMS TRAP 1,8 M$ pour 13 organisations (10/2025) ; Ocean Conservancy 2,2 M$ (04/2026) ; Floride FKNMS « Goal: Clean Seas »
  (300 casiers en 2025, suivi avant/après dès 2026) ; FWC trap retrieval (10 $/casier). Technologie prouvée : GhostVision
  (MDPI 2026, YOLO/RF-DETR sur sonar Garmin/Humminbird/Deeper, 3 110 images) ; Fish-Finders for Stewardship (U. Delaware,
  450 casiers retirés) ; jeux ouverts AI4Shipwrecks, SeabedObjects-KLSG.
- Cible : 15-25 organismes de récupération du Pacifique Nord-Ouest (Emerald Sea Protection Society, Ocean Legacy, Rugged Coast,
  Northwest Straits Foundation avec 5 000+ filets retirés, Ghost Diving), agences (MPO, WDFW), 13 lauréats VIMS TRAP, comtés et
  équipes de plongée de Floride ; clubs de plongée (accès direct du fondateur).
- Produit : upload des logs sonar (formats Garmin, Humminbird, Lowrance, Deeper) et vidéos ROV (Chasing, QYSEA, BlueROV2 à
  1 400-7 000 $), détection et classification (casier, filet, coque, moteur), carte partagée des points chauds par bassin,
  prédiction de dépôt (courants Copernicus/HYCOM, bathymétrie EMODnet/NOAA, historique FGRS), rapport de ciblage et de tonnage
  formaté pour les dossiers de subvention.
- Prix : 100-500 $/mois par organisme (gratuit pour bénévoles, payant pour agences) ; rapport de ciblage 2-5 k$ par cycle ;
  licence de données agrégées MPO/NOAA 10-30 k$/an ; en Floride 150-400 $ par objet documenté.
- Effort : moyen, 4-6 mois-ingénieur ; brique la plus mûre de tout le mandat ; pas de matériel propre.
- Concurrence : aucun logiciel packagé ; GhostVision est un projet académique ; GGGI Data Portal déclaratif ; chaque ONG gère ses relevés.
- Premier client : Emerald Sea Protection Society ou Ghost Diving BC via les clubs de plongée du fondateur.

## 2. GrantMRV : collecte terrain et rapport automatique pour les bénéficiaires de subventions de retrait de débris
- Déclencheur : les bailleurs exigent « un plan clair pour évaluer le succès » sans métrique standardisée : MPO Ghost Gear Fund
  (candidatures 29/06/2026, décisions 04/09/2026, dépenses avant le 31/03 de chaque exercice, suivi-évaluation éligible),
  NOAA MDP (13 lauréats FY25, 26,4 M$ ; protocole MDMAP/SCAT), NFWF Hurricane Response Fund (jusqu'à 11 M$, dossiers le
  21/10/2026), Ocean Conservancy, Programme de bateaux abandonnés (Transports Canada), FaSS UK (£360 M, appels 2026), PROBLUE.
  Outils actuels : Fulcrum 43-55 $/utilisateur/mois, 5 utilisateurs minimum (2 580-3 300 $/an), ArcGIS Survey123 ; tableurs.
- Cible : 50-80 organisations bénéficiaires en Amérique du Nord sur 2026-2028 (ONG, Premières Nations, coopératives, ports pour
  petits bateaux : 950 au Canada, Steveston compris), puis Royaume-Uni et bailleurs internationaux.
- Produit : application hors ligne (photo, GPS, poids ou volume estimé par IA, taxonomie OSPAR/MDMAP), génération du rapport au
  format de chaque bailleur à partir d'un même jeu de données, tableau de bord de campagne, portail bailleur ; alimente aussi le
  dossier de renouvellement de subvention.
- Prix : 50-150 $/mois par organisation, ou 3-5 % du budget de suivi-évaluation de la subvention ; licence bailleur 10-30 k$/an.
- Effort : faible à moyen, 3-5 mois-ingénieur ; IA de classification d'image en V2.
- Concurrence : Fulcrum, ArcGIS (génériques, chers, sans gabarit bailleur) ; aucun outil spécialisé.
- Premier client : Ocean Legacy ou T. Buck Suzuki Foundation (bénéficiaires 2020-2022, recandidats 2026), Steveston Harbour Authority.

## 3. NetPen Ledger : traçabilité du démantèlement des parcs en filet du saumon en Colombie-Britannique
- Déclencheur : décision fédérale du 19/06/2024, interdiction des parcs en filet ouverts au 30/06/2029 ; 85 licences échues le
  30/06/2024, 66 renouvelées jusqu'en 2029 ; Mowi (46 licences), Cermaq, Grieg ; plan de transition final attendu ; remise en état
  des sites à prouver au MPO et aux Premières Nations ; recycleurs (Nofir 10 298 t en 2025, Bureo, Plastix) sans couche de preuve.
  Extension : Norvège et Écosse (rapport gov.scot 05/2026 sur l'absence de filière de fin de vie ; norme SINTEF 2026 sur les
  microplastiques du lavage des filets).
- Cible : 3 opérateurs et leurs sous-traitants de démontage (barges, plongeurs professionnels), secrétariat de transition,
  Premières Nations cogestionnaires ; 65-85 sites ; 10-15 clients directs.
- Produit : inventaire d'actifs par site (drone et photo, vision par ordinateur pour compter et classer filets, flotteurs,
  ancrages), chaîne de traçabilité vers recycleurs avec preuve de livraison, dossier de remise en état pour le MPO et la
  province, tableau de bord multi-sites ; V2 : mesure des microplastiques du lavage des filets (NetWash).
- Prix : 5 000-15 000 $ par site démantelé plus 300-800 $ CAD/site/mois pendant la transition ; 1 000-3 000 $/mois par opérateur.
- Effort : moyen, 4-7 mois-ingénieur ; pas de matériel propre.
- Concurrence : aucun outil dédié ; Nofir et les recycleurs collectent sans preuve numérique ; certificateurs ASC/BAP auditent sans outiller.
- Premier client : Mowi Canada West ou Cermaq Canada (sièges en Colombie-Britannique), pilote sur un site en fin de licence.

## 4. FloatWatch : détection et registre de conformité des flotteurs en polystyrène (marinas, ports, fermes conchylicoles)
- Déclencheur : Washington E2SSB 5022 codifiée RCW 70A.245.130, en vigueur 01/01/2024 : encapsulation obligatoire à toute
  construction ou réparation de quai, amende civile jusqu'à 10 000 $ par infraction ; conditions de licence conchylicole du MPO
  2025 : flotteurs en mousse « entièrement encapsulés », retrait immédiat de toute flottaison dégradée, signalement d'incident
  sous 7 jours ; Baynes Sound : 38 t retirées, plus de 90 % d'origine conchylicole ; incident de West Sound (29/03/2026) :
  ponton à la dérive, réponse des autorités à plus de trois semaines faute de protocole ; Californie AB 2916 morte en commission
  (16/05/2024), relance probable ; Steveston : remplacement des flotteurs et fermeture du mouillage en 2025.
- Cible : marinas et docks de Washington (quelques centaines à 1 000 sites), 104 ports pour petits bateaux du Pacifique,
  fermes conchylicoles de Colombie-Britannique (BC Shellfish Growers' Association), comtés et Ecology comme acheteurs de la
  couche de détection ; marinas de Vancouver en démonstration.
- Produit : inspection par drone et caméra sous-marine du commerce, vision par ordinateur sur peu de classes (mousse exposée,
  dégradée, encapsulée), registre de conformité par ponton et par bail (photo horodatée, matériau), priorisation des
  remplacements, alerte de dérive et mise en relation avec des récupérateurs, portail de plaintes riveraines.
- Prix : audit 500-2 000 $ par marina ; suivi 100-400 $/mois ; 100-300 $ CAD par bail conchylicole ; licence comté ou État 10-40 k$/an.
- Effort : faible à moyen, 3-5 mois-ingénieur ; cible visuelle distinctive.
- Concurrence : aucune ; Clean Marine BC et Clean Marina auditent tous les trois ans ; fabricants de flotteurs sans suivi.
- Premier client : une marina de Vancouver ou Steveston Harbour Authority, puis marinas de Bellingham et des San Juan.

## 5. VesselRisk : registre transfrontalier et score de risque des bateaux abandonnés
- Déclencheur : Canada WAHVA (2019) : amendes 5 000-50 000 $ (personne), jusqu'à 250 000 $ (entreprise), 1 M$ à 6 M$ dans les cas
  graves, délais 48 h et 60 jours ; Programme de bateaux abandonnés de Transports Canada ; Washington DVRP 20,6 M$ pour 2025-2027,
  compte sous tension, remboursements suspendus jusqu'en juin 2027, inventaire des « vessels of concern » mis à jour 02/09/2026 ;
  Californie SAVE 2,75 M$/an, 25-28 agences financées, apport local 10 % ; Floride §823.11 (délit puis crime en récidive,
  immatriculation bloquée, délai de grâce 45 jours après ouragan) et FWC Derelict Vessel Grant 4,9 M$ (SFY 2026-27, contre 20 M$
  en 2022, premier arrivé premier servi).
- Cible : marinas et administrations portuaires (nombreux petits clients), agences (Transports Canada, WA DNR, OR Marine Board,
  DBW Californie, 35 comtés côtiers de Floride), assureurs de plaisance en licence de données.
- Produit : score de risque d'abandon par navire (caméras de quai ou drone du commerce et détection de changement : gîte,
  ligne de flottaison, désordre ; imagerie satellite ; données d'immatriculation ; signalements), registre cartographique partagé,
  dossier de preuve prêt pour SAVE, DVRP, FWC et Transports Canada.
- Prix : 100-500 $/mois par marina ; 2 000-8 000 $/an par agence locale ; licence régionale 20-60 k$/an ; 150-400 $ par dossier.
- Effort : moyen, 5-8 mois-ingénieur.
- Concurrence : aucun agrégateur ; inventaires internes des États ; logiciels de gestion de marina sans ce cas d'usage.
- Premier client : marina de Vancouver ou Steveston en pilote, puis San Mateo County Harbor District (SAVE) à distance.

## 6. StormDebris : documentation rapide des débris marins après tempête pour les remboursements FEMA et FWC
- Déclencheur : FEMA Public Assistance catégorie A après Helene et Milton (10/2024) : 590 M$ obligés, 31,67 M yd³, réconciliation
  encore active mi-2026 ; remboursement à 100 % conditionné à une documentation stricte (tickets, GIS, photos avant/après) ; les
  débris immergés (bateaux coulés, quais, casiers) sont les moins documentés donc les moins remboursés ; monitoring indépendant
  obligatoire (Tetra Tech, Rostan, Thompson, True North) ; NFWF Hurricane Response Marine Debris Removal Fund jusqu'à 11 M$,
  dossiers au 21/10/2026 ; saison cyclonique 2026 en cours ; tempêtes hivernales du Pacifique Nord-Ouest.
- Cible : 35 comtés côtiers de Floride (10-15 fortement touchés), cabinets de monitoring en marque blanche, ONG candidates au
  NFWF, comtés de Californie et marinas du Pacifique Nord-Ouest après tempête.
- Produit : relevé drone (RGB, thermique) et sonar du commerce dans les 24-48 h, vision par ordinateur (fine-tuning xBD, échelle
  de dommages à 4 niveaux, plus collecte propre) pour estimer les volumes et localiser les débris immergés, rapport GIS géotagué
  conforme aux exigences FEMA et FWC, suivi des tickets et réconciliation.
- Prix : 2 000-5 000 $ par mission ; 5 000-15 000 $ par campagne de comté ; 500-1 500 $/mois de disponibilité saisonnière ;
  revenu partagé avec les cabinets de monitoring.
- Effort : moyen, 4-7 mois-ingénieur ; xBD comme base, collecte terrain pour les débris marins.
- Concurrence : les cabinets de monitoring suivent les débris terrestres avec des processus manuels ; aucun acteur dédié aux débris immergés.
- Premier client : un cabinet de monitoring déjà sous contrat avec un comté (liste publique de Pinellas County), vente B2B2G à distance.

## 7. MicroScreen : dépistage bas coût des microplastiques et copilote de conformité pour distributeurs d'eau et laboratoires
- Déclencheur : Californie SB 1422 : méthodes Raman et infrarouge adoptées (SOP révisées 27/05/2022, étude interlaboratoire sur
  22 labos et 6 pays), Phase 1 achevée (30 distributeurs de plus de 100 000 habitants), Phase 2 sur l'eau traitée dès l'automne
  2026, 1 000-2 000 $ par échantillon ; EPA CCL 6 (projet 02/04/2026, finalisation 17/11/2026) mais pas d'UCMR 6 : vide fédéral,
  7 États pétitionnaires ; OPC : programme pilote de surveillance statewide des microplastiques, 2,5 M$ approuvés le 16/06/2026 ;
  UE : Directive 2024/3019, surveillance des microplastiques pour les stations de plus de 10 000 EH, méthodologie de la Commission
  due le 02/07/2027, transposition 31/07/2027 ; Décision déléguée 2024/1441 (eau potable) ; marché mondial de l'analyse 267 M$
  (2025). Logiciels ouverts : MP-VAT (Nile red, 95,8 % de précision rapportée), siMPle (FTIR). Commercial : Purency (licence sur
  FTIR existant), The Water Test (75 $, sans polymère).
- Cible : distributeurs d'eau de Californie (30 puis centaines en Phase 2), laboratoires ELAP et universitaires (UBC, SFU),
  stations d'épuration européennes de plus de 10 000 EH (plusieurs milliers, chiffre à vérifier), conchyliculteurs.
- Produit : kit caméra microscope USB (50-200 $) plus Nile red plus modèle de comptage et de dimensionnement, service cloud à
  l'échantillon avec escalade vers un labo FTIR partenaire, module de gestion de programme SB 1422 (calendrier, chaîne de
  conservation, rapport public), module d'aide à l'analyste pour les labos.
- Prix : 49-149 $ par échantillon ; labos 500-2 000 $/mois ; distributeurs 8 000-20 000 $/an ; kit 15-30 k$ pour utilities.
- Effort : moyen, 5-8 mois-ingénieur ; conditions de laboratoire contrôlées, plus simple que la détection en extérieur.
- Concurrence : Purency (dépend d'un FTIR), The Water Test (grand public), labos sans couche logicielle ; espace intermédiaire libre.
- Premier client : laboratoire de la UBC ou petite agence d'eau du Grand Vancouver, puis distributeur californien de Phase 2 à distance.

## 8. TireWatch : surveillance et priorisation du 6PPD-quinone dans les eaux pluviales (saumon)
- Déclencheur : Washington HB 2421 / SB 6119 (2025-2026) : redevance de 5 $ par pneu neuf, règles Ecology d'ici 06/2028,
  interdiction du 6PPD dans les pneus neufs au 01/01/2035 ; Californie DTSC (Priority Product 01/10/2023) : analyses finales des
  21 substituts dès 08/2026, rapport d'étape 01/10/2026, Stage 2 en 10/2029 ; Canada : MPO 6 400 échantillons sur 40 ruisseaux de
  Metro Vancouver, Squamish et l'île de Vancouver, dépassements létaux pour le coho dans 26 cours d'eau (11/2025), étude UBC sur le
  gazon synthétique (03/2026) ; USGS campagne 2026-2027 sur 6 sites ; aucun capteur terrain commercial (USGS, ACS 2025).
- Cible : municipalités et districts d'eaux pluviales de Metro Vancouver, Washington et Oregon (permis MS4, bassins à saumon),
  agences de transport, fabricants de pneus (dossiers DTSC et Ecology) en licence de données, Pacific Salmon Foundation en partenaire.
- Produit : capteurs de turbidité et débit du commerce aux exutoires, échantillonnage automatique déclenché par les pics de pluie,
  envoi groupé vers un laboratoire LC-MS/MS partenaire, modèle IA de priorisation par bassin versant (trafic, pluie, proximité des
  frayères, proxies USGS) pour placer les ouvrages de biofiltration, suivi avant et après travaux.
- Prix : 8-20 k$ CAD/an par point ; 40-120 k$ CAD/an par municipalité ; licence fabricants de pneus 20-60 k$/an.
- Effort : moyen, 5-8 mois-ingénieur ; pas de capteur propriétaire.
- Concurrence : aucune ; recherche MPO, UBC, USGS sans offre commerciale ; consultants ponctuels.
- Premier client : Ville de Vancouver ou Metro Vancouver, avec la Pacific Salmon Foundation comme partenaire de validation.

## 9. CoastalTrace : données de terrain de qualité juridique sur les déchets par marque (contentieux et éco-modulation)
- Déclencheur : People of California v. ExxonMobil (23/09/2024, en cours), County of Los Angeles v. PepsiCo et Coca-Cola
  (30/10/2024, motion to dismiss rejetée 23/09/2025, procès prévu 10/2027) s'appuient sur l'audit mondial Break Free From Plastic
  sans donnée locale chiffrée ; Baltimore v. PepsiCo et al. rejeté en 07/2026 (doctrine restreinte par la Cour suprême du
  Maryland) : les futures actions devront être mieux étayées ; NOAA MDMAP enquête nationale 07/2025-08/2026 ; éco-organismes
  (Circular Action Alliance, Recycle BC avec plus de 1 200 producteurs, Éco Entreprises Québec, Citeo) pour l'éco-modulation et
  les études de gisement ; SUP art. 13 en Europe.
- Cible : procureurs généraux et county counsels (une douzaine de juridictions actives ou candidates), cabinets et cliniques
  juridiques, éco-organismes, notateurs ESG en V2.
- Produit : protocole de collecte à chaîne de conservation (photo horodatée et géolocalisée, double vérification), application
  de terrain avec vision par ordinateur pour classer marque et type d'objet (TACO, YOLO), base longitudinale par juridiction,
  rapport statistique prêt pour témoin expert reliant volumes, marques et coûts de nettoyage.
- Prix : 50-150 k$ par dossier de contentieux ; 10-30 k$/an en abonnement pour une collectivité qui se constitue une preuve ;
  200-500 $ par campagne pour les éco-organismes ; licence API 10-40 k$/an.
- Effort : moyen, 5-8 mois-ingénieur ; MVP en comptage assisté.
- Concurrence : Break Free From Plastic (gratuit, non juridique, données verrouillées), cabinets d'économie environnementale à l'heure.
- Premier client : Recycle BC (étude de gisement côtier autour de Vancouver) en V1 ; county counsel californien à distance.

## 10. PolyID : identification des polymères et traçabilité pour les dépôts de plastique marin
- Déclencheur : absence totale de découverte de prix publique (Ocean Legacy, Net Your Problem, Oceanworks, RecyClass, OBP : aucun
  tarif) ; enfouissement 350-500 $/t documenté mais prix de reprise inconnu ; Ocean Legacy : 7 dépôts, programme EPIC, labo de
  contrôle (melt flow, humidité) ; Net Your Problem : 2,2 millions de livres depuis 2018, 8 États ; les scanners NIR (trinamiX,
  Specim) sont calibrés pour des résines propres, pas pour le plastique dégradé (UV, sel, biofouling) ; certifications OBP et
  RecyClass exigeantes et opaques ; Directive 2024/825 côté acheteurs.
- Cible : 30-60 dépôts et collecteurs en Amérique du Nord (Ocean Legacy à Richmond, Net Your Problem, coopératives de Steveston),
  recycleurs européens (Plastix, Fil&Fab), ONG de nettoyage ; en V2 acheteurs de matière et bailleurs.
- Produit : scanner NIR portable du commerce (3-8 k$) plus application avec modèle de classification corrigé pour le plastique
  marin dégradé (PP, PE, nylon 6, PET) et score de contamination, base de traçabilité par lot, dossier OBP et RecyClass, indice
  de prix par polymère et région construit sur un panel « donne tes données, reçois l'indice ».
- Prix : 150-400 $/mois par dépôt ; indice 100-500 $/mois ; accompagnement certification 2-5 k$ ; licence bailleurs 10-30 k$/an.
- Effort : moyen à élevé, 6-9 mois-ingénieur ; l'accès au matériel et la collecte de spectres de plastique marin sont le coeur.
- Concurrence : aucun acteur spécialisé plastique marin ; trinamiX et Specim vendent le matériel sans bibliothèque marine.
- Premier client : Ocean Legacy Foundation (Richmond, à côté de Steveston).

## 11. FiberScore : mesure et reporting du relargage de microfibres textiles
- Déclencheur : affichage environnemental textile en France (ADEME, Ecobalyse) : score par défaut pénalisant dès octobre 2026
  sans données mesurées (seuils de CA et de références à vérifier, source unique) ; ESPR acte délégué textiles attendu fin 2027,
  Passeport numérique produit mi-2028 avec données de relargage ; ISO 4484 (2023) coexiste avec TMC, Hohenstein et AATCC TM212
  (re-tests multiples) ; loi AGEC art. 79 (filtres lave-linge) sans décret au 07/05/2026 ; Directive 2024/825 (27/09/2026) ;
  les microfibres représentent environ un tiers des microplastiques océaniques (IUCN, hypothèse non re-sourcée cette passe).
- Cible : marques moyennes d'outdoor, de sport et de plongée vendant en UE (Vancouver est un pôle : Arc'teryx, Lululemon, MEC,
  et les marques de combinaisons), fabricants de tissus techniques, laboratoires partenaires.
- Produit : banc de test de lavage normalisé (protocole ISO 4484 avec matériel du commerce) plus caméra microscope et vision par
  ordinateur pour compter les fibres, livré en marque blanche aux laboratoires ; SaaS de centralisation multi-normes (extraction
  LLM des rapports PDF), calcul du score attendu, export ADEME/Ecobalyse et DPP, base de facteurs d'émission par tissu (l'actif).
- Prix : 3 000-8 000 €/an par marque ; 500-1 500 € par référence testée ; licence de la base aux fabricants de tissus.
- Effort : moyen à élevé, 6-9 mois-ingénieur (banc plus vision plus base réglementaire).
- Concurrence : laboratoires généralistes (SGS, Eurofins, Hohenstein, Qalitex) sans plateforme ni base ; aucun acteur combiné.
- Premier client : une marque outdoor ou de plongée de Vancouver exportant vers l'UE, audit initial avant octobre 2026.

## 12. HullCycle : traçabilité de fin de vie et détection des coques composites abandonnées
- Déclencheur : filière REP française APER (depuis 2019) : 3 079 bateaux déconstruits en 2025 (record), 16 183 cumulés, 37 centres
  agréés, consultation nationale du 15/06 au 21/08/2026 pour les prestataires 2027-2029 ; gisement européen 6,5 millions de
  bateaux, 30 000 fins de vie par an dès 2030, 23 000 t/an de composites (67 % en combustible de cimenterie) ; programmes
  nord-américains de reprise (Californie VTIP au sein de SAVE, Washington, Floride) ; les coques en fibre de verre abandonnées
  se fragmentent en microplastiques.
- Cible : APER et ses 37 centres ; collectivités et marinas (cartographie des coques abandonnées) ; en V2 les éco-organismes
  équivalents si l'UE généralise, et les programmes de reprise nord-américains.
- Produit : plateforme de déclaration, d'éco-contribution et de suivi des flux vers les centres agréés (lot, pesée, destination
  matière), module de détection de coques abandonnées par imagerie drone et satellite et vision par ordinateur (marinas, zones
  intertidales), tableau de bord de la consultation et des prestataires.
- Prix : licence éco-organisme 15-40 k€/an ; centres 2-5 k€/an ; cartographie ponctuelle 5-15 k€ par collectivité.
- Effort : moyen, 5-8 mois-ingénieur ; brique de détection mutualisable avec VesselRisk.
- Concurrence : aucun logiciel dédié ; APER gère par appels d'offres classiques.
- Premier client : preuve de concept sur les marinas de Vancouver et Steveston, puis APER à distance en France.

## Idées vues mais non retenues (et pourquoi)
- SargassumIQ (prévision d'échouage des sargasses, Miami-Dade 35 M$/an) : marché réel mais hors plastique.
- NurdleTrace Gulf (preuve probatoire des granulés près des sites du Golfe) : trop proche de PelletGuard et la détection de granulés en extérieur reste un problème ouvert.
- REACH 2023/2055 reporting ECHA (31/05/2026 puis annuel) et taxe plastique espagnole : conformité chimique et fiscale, lien océan faible, proches d'EPR Atlas.
- OceanGrantAtlas, GrantRadar, VigilanceWatch, 6PPD Alternatives Vault : veille par LLM, barrière à l'entrée faible ; peuvent devenir des modules.
- ShrinkLoop (film d'hivernage) : logistique sans IA, marché saisonnier ; module possible de FloatWatch.
- NetWash IA (microplastiques du lavage des filets) : mêmes trois clients que NetPen Ledger, gardé en V2.
- ShellPoint Coastal (score assurantiel Floride) : hypothèse non sourcée sur le lien assurance.
