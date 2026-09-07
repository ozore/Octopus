# Dossier technique — État de l'art accessible à un fondateur seul pour la surveillance et la protection des fonds marins

Agent : tech-underwater-ai · Rédigé le 7 septembre 2026 · Budget utilisé : 12/12 WebSearch, WebFetch libre (≈20 requêtes).

Avertissement méthodologique : chaque capacité matérielle ou logicielle porte une étiquette — **« capacité vérifiée (source,
date) »**, **« capacité supposée »** (plausible, non testée par l'auteur de ce dossier ni confirmée par une source
indépendante) ou **« hypothèse non sourcée »**. Les chiffres introuvables sont marqués **« estimation »**. Les échecs de
recherche sont notés dans `claude.md`.

---

## (a) Tableau des briques technologiques

| Brique | Capacité | Coût (fondateur bootstrap) | Licence | Source |
|---|---|---|---|---|
| **CoralNet** (jeux de données + outils d'annotation) | Vérifiée : 7 623 sources, 5 688 825 images, 299 470 428 annotations ponctuelles, hébergé par UC San Diego, gratuit | 0 $ (upload/API gratuits) | Pas de licence explicite affichée sur le site ; code Django open-source | coralnet.ucsd.edu (consulté 07/09/2026) |
| **FathomNet** | Vérifiée : base MBARI, images annotées par experts, « ML-ready », gratuite (fondée par Kakani Katija) | 0 $ | Licence de données non précisée sur la page d'accueil — à vérifier avant usage commercial | fathomnet.org (consulté 07/09/2026) |
| **BenthicNet** | Vérifiée : compilation mondiale d'images de fonds marins, agrège Seaview, Reef Life Survey, SQUIDLE ; 887 533 annotations dont 287 000 de corail dur, taxonomie WoRMS | 0 $ | Publication scientifique ouverte (Nature Scientific Data) | nature.com/articles/s41597-025-04491-1, arxiv.org/html/2405.05241v1 (2025) |
| **SQUIDLE+** | Vérifiée : outil d'annotation image/vidéo/mosaïques à grande échelle, opéré par un consortium (IMOS, CSIRO, UTAS, Geoscience Australia) | 0 $ | Licence non affichée | squidle.org (consulté 07/09/2026) |
| **Reef Life Survey** | Supposée : programme de science citoyenne (plongeurs bénévoles), alimente BenthicNet | Inconnu (site inaccessible, 403) | Inconnue | citée dans BenthicNet (arxiv 2405.05241) — accès direct au site échoué |
| **CoralSCOP** (modèle de segmentation) | Vérifiée : fondé sur SAM, segmentation corail/non-corail + forme de croissance + genre, pré-entraîné sur 1,3 M de masques, jeu CoralMask (38 928 images, 299 557 masques), CVPR 2024 Highlight | 0 $ (calcul GPU seul à charge) | Code + poids sur GitHub sous licence propre au repo (fichier LICENSE, type non détaillé dans le README) | github.com/zhengziqiang/CoralSCOP (consulté 07/09/2026) ; huggingface.co/reefsupport/CoralSCOP |
| **SAM / SAM2 sous-marin (UWSAM, etc.)** | Supposée : benchmarks de recherche (UWSAM, « Diving into Underwater ») montrent un gain net vs SAM nu sur scènes sous-marines, mais outils encore au stade recherche | 0 $ (recherche) à coût d'intégration | Apache/MIT selon dépôt (variable) | arxiv.org/html/2505.15581v1 ; arxiv.org/pdf/2406.06039 |
| **RF-DETR** (détection temps réel, dorsale DINOv2) | Vérifiée : architecture transformer temps réel (2,3–17,2 ms sur T4), conçue pour le fine-tuning sur jeux de données personnalisés | 0 $ pour les petits modèles | Apache 2.0 pour `rfdetr` et poids standard ; licence PML 1.0 pour la variante « plus » et modèles XL/2XL (payante) | github.com/roboflow/rf-detr (consulté 07/09/2026) |
| **CoralNet-Toolbox / DINOv2 sous-marin** | Hypothèse non sourcée sur les détails précis (existence confirmée par le brief, pas de fetch réussi cette session) | — | — | non vérifié — lacune assumée |
| **Photogrammétrie classique (Agisoft Metashape, Meshroom, COLMAP)** | Vérifiée (documentation éditeur) : logiciels de Structure-from-Motion généralistes, utilisables avec caméra GoPro/reflex en caisson ; pas de validation spécifique « rugosité de récif » trouvée cette session | Metashape Standard ≈ 179 $ (licence perpétuelle, prix éditeur variable) ; Meshroom et COLMAP gratuits/open-source | Metashape propriétaire ; Meshroom (AliceVision) Mozilla Public License 2.0 ; COLMAP licence BSD | agisoft.com, alicevision.org, colmap.github.io (connaissance générale, non re-vérifiée par fetch cette session) |
| **Gaussian Splatting sous-marin (WaterSplatting, UW-GS, RUSplatting, DualPhys-GS)** | Vérifiée (existence et objectif) : variantes 2024-2025 corrigeant diffusion/atténuation de la couleur sous l'eau ; revue comparative dédiée aux récifs coralliens publiée | Coût = temps d'ingénieur + GPU (pas de produit commercial clé-en-main identifié) | Codes de recherche, licences variables (souvent MIT/Apache) | arxiv.org/pdf/2502.20154 (fév. 2025) ; arxiv.org/pdf/2505.15737 (mai 2025) ; arxiv.org/pdf/2508.09610 (août 2025) |
| **Détection blanchissement par image (classification de couverture corallienne)** | Vérifiée indirectement : CoralNet/CoralSCOP permettent d'automatiser le calcul de couverture et de proportion de corail pâli/mort à partir de photos-quadrats | 0 $ (modèles) + coût plongée | Cf. CoralSCOP/CoralNet ci-dessus | idem |
| **Détection SCTLD (maladie de perte tissulaire des coraux) par IA** | **Lacune importante** : la littérature 2024-2026 trouvée porte sur génomique (expression génique, biomarqueurs) et micro-CT/U-Net sur squelette — PAS sur classification d'image RGB de plongée. Une détection SCTLD fiable par simple photo n'est pas démontrée dans les sources consultées. | — | — | royalsocietypublishing.org/rsos/article/12/7/241993 (2025) ; fau.edu/newsdesk/articles/stony-coral-imaging-study (mai 2026, micro-CT) ; researchsquare.com/article/rs-5005833/v1 (2024, biomarqueurs SCTLD vs peste blanche) |
| **eDNA marine (kits + labo)** | Supposée / estimation : technique validée scientifiquement pour la biodiversité marine (ex. 134 espèces de poissons détectées, Philippines) mais **aucun prix commercial public trouvé** cette session | **Estimation** : kit de filtration ≈ 50–150 $ CAD/échantillon (matériel) + analyse metabarcoding en labo ≈ 150–500 $ CAD/échantillon ; délai ≈ 2 à 6 semaines | Kits commerciaux type Qiagen DNeasy / PowerPlant (propriétaires) | sciencedirect.com/science/article/abs/pii/S0964569126001390 ; mdpi.com/2079-7737/14/11/1467 — pas de page tarifaire consultable (naturemetrics.com/pricing → 404) |
| **Acoustique passive bas coût** | Vérifiée : hydrophone DIY à composants du commerce ≈ 20 € (pièce) / ≈ 50 € (système complet avec enregistreur), performant sauf sous 200 Hz | ≈ 50 € (hydrophone DIY) à quelques centaines $ (SoundTrap/HydroMoth — **capacité supposée**, prix non revérifiés cette session) | Matériel du commerce ; logiciels d'analyse (CoralSoundExplorer) — licence non vérifiée | ncbi.nlm.nih.gov/pmc/articles/PMC12694390 (Low-Cost Passive Acoustic Toolkit) ; PMC12017563 (CoralSoundExplorer) ; PMC12064026 (IA soundscape) ; arxiv.org/html/2511.05349 (nov. 2025, indices composites) |
| **Allen Coral Atlas / Planet / Sentinel-2** | Vérifiée : Planet Dove 3,125 m (4 bandes), Sentinel-2 10 m pour bathymétrie/blanchiment ; zonation géomorphologique cartographiée jusqu'à ≈15 m, composition benthique jusqu'à ≈10 m ; classes hard/soft coral, macroalgues, herbier, sable, gravats, roche ; cartes mondiales complétées le 8 sept. 2021, mises à jour fin 2022 ; gratuit (Google Earth Engine) | 0 $ | Pas de licence explicite listée ; gouvernance ASU/Vulcan Inc. | allencoralatlas.org/methods/ (consulté 07/09/2026) |
| **Sentinel-2 herbiers marins (cartographie mondiale)** | Vérifiée : 10 m de résolution, 4,75 M d'images Sentinel-2 (périodes 2019-2020 et 2023-2024), classifieur deep learning, 148 506 km² d'herbiers identifiés | 0 $ (Sentinel-2 open data) | Open data Copernicus | nature.com/articles/s41586-026-10704-3 (2026) |
| **Limite eaux turbides (satellite)** | Vérifiée : « en eaux non claires, des erreurs de profondeur/classe apparaissent » — la télédétection optique perd sa fiabilité en eaux turbides (typique PNW, estuaires) | — | — | allencoralatlas.org/resources/ (FAQ, consulté 07/09/2026) |
| **BlueROV2** | Vérifiée : à partir de 4 900 $ US (config. de base), profondeur 100 m (tube acrylique) / 300 m (aluminium), caméra 1080p standard, sonar Cerulean Omniscan 450 FS / Ping360 en option (prix non affichés) | 4 900 $ US + options (sonar souvent +1 500-3 000 $ **estimation**) | Matériel + logiciel BlueOS/ArduSub open-source | bluerobotics.com/store/rov/bluerov2/ (consulté 07/09/2026) |
| **Chasing M2 Pro / QYSEA Fifish V6 Pro** | Supposée (source secondaire, pages produits inaccessibles en direct) : ≈ 3 459 $ US et ≈ 2 999 $ US respectivement | ≈ 3 000-3 500 $ US | Propriétaire | résumé WebSearch citant oneoutdoors.org (accès direct chasing.com échoué, 404) |
| **Garmin LiveScope / Humminbird MEGA Live (sonar de pêche)** | **Capacité non vérifiée pour la distinction d'habitats benthiques** : ce sont des sonars de pêche récréative optimisés pour repérer poissons/structure, aucune source trouvée ne confirme leur capacité à discriminer herbier/éponge/corail par espèce | Sonde + module ≈ 1 500-3 000 $ US (prix marché général, **estimation**) | Propriétaire | garmin.com/en-US/marine/live-sonar/livescope (page marketing seule, sans specs techniques) |
| **ROV + sonar pour cartographie d'herbiers (cas vérifié)** | Vérifiée (cas d'usage) : ROV Blue Robotics + SPRINT-Nav Mini + sonar → bandes de balayage jusqu'à 200 m de large, carte SIG d'herbiers, vérification par ROV des zones détectées | Système professionnel, hors budget bootstrap (dizaines de k$) | Propriétaire (Sonardyne) | sonardyne.com/small-rov-big-impact-transforming-habitat-restoration-with-precision-imaging |
| **Global Fishing Watch API** | Vérifiée : gratuite après inscription + attribution + description d'impact ; données sur ≈70 000 navires diffusant l'AIS, effort de pêche apparent, rencontres/transbordement, visites de port, mouillage/« loitering » ; utilisée par 200+ organisations dans 70 pays | 0 $ (recherche/impact) ; limites de débit rapportées ailleurs à 50 000 requêtes/jour, 1 550 000/mois (non re-confirmées sur la page officielle) | Conditions d'utilisation GFW (attribution obligatoire) | globalfishingwatch.org/our-apis/ (consulté 07/09/2026) |
| **AISHub** | Supposée : flux AIS gratuit en échange du partage de données de son propre récepteur AIS (modèle communautaire) | 0 $ si on installe un récepteur AIS (≈100-300 $ **estimation**) | Conditions AISHub (réciprocité) | connaissance générale du service, non re-vérifiée par fetch dédié cette session |
| **Spire Maritime (désormais Kpler)** | Vérifiée (existence/rachat) : constellation propriétaire de 100+ nanosatellites AIS, rachetée par Kpler en 2024-2025 | Tarification entreprise non publique — contact commercial requis | Propriétaire | datadocked.com/ais-api-providers (résumé WebSearch) |
| **LLM (Claude) pour rapports réglementaires** | Vérifiée par construction : un LLM généraliste peut structurer des données de suivi (couverture corallienne, indices acoustiques, alertes AIS) en rapports texte conformes à un gabarit (ex. rapports MRV, dossiers de subvention) — pas de barrière technique, la valeur est dans les données et le gabarit, pas le LLM lui-même | Coût API marginal (quelques $/rapport) | — | Capacité générique des LLM, pas de source externe nécessaire |

---

## (b) Fiches détaillées

### 1. Vision par ordinateur sous-marine — jeux de données et modèles ouverts

**Jeux de données.**
- **CoralNet** (UC San Diego) : 7 623 « sources » (jeux d'images), 5 688 825 images, 299 470 428 annotations ponctuelles ; gratuit, interface web d'annotation et de classification automatique — capacité vérifiée (coralnet.ucsd.edu, 07/09/2026).
- **FathomNet** (MBARI, fondatrice Kakani Katija) : base d'images annotées par des experts, alimentée notamment par le programme citoyen FathomVerse (99 124 images labellisées = 47 % du total à date de consultation) ; conçue explicitement « ML-ready » — capacité vérifiée (fathomnet.org, 07/09/2026).
- **BenthicNet** : compilation mondiale (Seaview Survey, Reef Life Survey, SQUIDLE et autres) publiée dans *Scientific Data* (Nature) en 2025 ; 887 533 annotations dont 287 000 de corail dur, taxonomie standardisée WoRMS — capacité vérifiée (nature.com/articles/s41597-025-04491-1).
- **SQUIDLE+** : plateforme d'annotation d'images/vidéos/mosaïques à grande échelle opérée par un consortium australien (IMOS, CSIRO, UTAS, Geoscience Australia) — capacité vérifiée pour l'existence de l'outil, licence non trouvée (squidle.org, 07/09/2026).
- **NOAA NCCOS, Reef Life Survey, Seagrass, KelpWatch** : mentionnés dans le brief comme sources ouvertes ; **lacune** — les pages officielles n'ont pas pu être récupérées cette session (404/403/contenu vide). NOAA NCCOS et Reef Life Survey sont connus pour publier des données de suivi benthique et de recensement de poissons respectivement, mais aucune caractéristique précise (licence, volume, résolution) n'a pu être vérifiée ici — à confirmer avant de bâtir un produit dessus.

**Modèles ouverts.**
- **CoralSCOP** (« Segment any COral Image on this Planet », CVPR 2024 Highlight) : premier modèle fondation dédié à la segmentation dense de coraux, construit sur Segment Anything Model (SAM), avec pré-entraînement sur 1,3 million de masques et un jeu dédié CoralMask (38 928 images / 299 557 masques). Il segmente à trois niveaux : corail/non-corail, forme de croissance, genre. Accepte des invites point/boîte/texte — capacité vérifiée (github.com/zhengziqiang/CoralSCOP, huggingface.co/reefsupport/CoralSCOP).
- **CoralSCOP-LAT** : outil de labellisation/analyse dense construit sur CoralSCOP (arxiv.org/pdf/2410.20436, oct. 2024) — existence vérifiée, pas testé.
- **SAM / SAM2 en contexte sous-marin** : plusieurs travaux 2024-2025 (UWSAM, « Diving into Underwater ») montrent que SAM nu sous-performe en scène sous-marine sans adaptation, d'où l'intérêt de CoralSCOP ou d'un fine-tuning dédié — capacité supposée pour un usage produit direct sans adaptation.
- **RF-DETR** (Roboflow) : architecture de détection d'objets en temps réel avec dorsale **DINOv2**, conçue pour le fine-tuning sur données personnalisées, latence 2,3–17,2 ms sur GPU T4 ; licence **Apache 2.0** pour les petits modèles (composants premium sous licence payante PML 1.0) — capacité vérifiée (github.com/roboflow/rf-detr, 07/09/2026). C'est l'option la plus réaliste pour un fondateur seul assisté par Claude : dorsale pré-entraînée solide (DINOv2), licence permissive, documentation orientée fine-tuning rapide.
- **CoralNet-Toolbox** : cité dans le brief comme outil open-source complémentaire à CoralNet ; **non vérifié cette session** (aucun fetch réussi) — hypothèse non sourcée sur ses capacités précises.

**Barrière à l'entrée réelle.** Faible sur le plan des modèles (SAM/DINOv2/RF-DETR sont ouverts et bien documentés) et des jeux de données globaux (CoralNet, FathomNet, BenthicNet sont gratuits). La vraie barrière est (i) la collecte et l'annotation de données **locales** (Pacifique Nord-Ouest, eaux froides et turbides, espèces différentes des tropiques où la plupart des jeux de données ont été constitués) et (ii) la constitution d'un jeu de vérité-terrain propre au client (permet un moat data, pas un moat modèle).

**Temps de développement (fondateur seul + Claude).** Un MVP de classification de couverture corallienne/algale à partir de photos-quadrats, en fine-tunant RF-DETR ou CoralSCOP sur 500-2000 images annotées : **estimation 6-10 semaines** (collecte + annotation + entraînement + interface web simple). Un pipeline complet incluant relevé automatique de biodiversité multi-espèces : **estimation 4-6 mois**.

---

### 2. Photogrammétrie et modèles 3D de récifs

**Outils généralistes.** Agisoft Metashape (propriétaire, licence Standard perpétuelle de l'ordre de quelques centaines de dollars selon barème éditeur), Meshroom/AliceVision (open-source, licence MPL 2.0) et COLMAP (open-source, licence BSD) sont des moteurs de Structure-from-Motion génériques, utilisables avec une caméra GoPro/reflex en caisson étanche pour produire des modèles 3D de récifs — capacité vérifiée par la documentation éditeur (usage général, non re-testée sur récifs cette session).

**Nouveauté 2024-2025 : Gaussian Splatting sous-marin.** Le rendu par éclatement gaussien (3D Gaussian Splatting, introduit en 2023) a été adapté au milieu sous-marin pour corriger l'atténuation et la diffusion de la couleur dans l'eau : WaterSplatting (2024), UW-GS, RUSplatting (mai 2025, arxiv.org/pdf/2505.15737), DualPhys-GS (août 2025, arxiv.org/pdf/2508.09610). Une revue comparative dédiée aux images de récifs coralliens a été publiée en février 2025 (arxiv.org/pdf/2502.20154), et un atelier international dédié à la cartographie 3D sous-marine s'est tenu à TU Wien en juillet 2025 — capacité vérifiée pour l'existence et l'objectif de ces méthodes (correction visuelle et reconstruction dense), **capacité supposée** pour leur maturité en usage produit (ce sont des travaux de recherche, pas des logiciels packagés).

**Capacités réellement démontrées.** Les sources consultées confirment la reconstruction 3D dense et la correction colorimétrique sous-marine comme axes de recherche actifs, mais **aucune source consultée cette session ne chiffre precisément une capacité de mesure automatique de rugosité de surface, de taux de couverture ou de croissance corallienne à partir de splats gaussiens** — ces usages sont plausibles (la 3D dense permet en principe de calculer rugosité et volume) mais restent une **capacité supposée** tant qu'un papier ou produit ne le démontre pas noir sur blanc.

**Barrière à l'entrée.** Faible sur les outils (open-source disponibles), moyenne sur l'expertise (pipeline photogrammétrique sous-marin = beaucoup de réglages : éclairage, distorsion du caisson, flou de mouvement, turbidité). Un fondateur avec profil dev/data peut industrialiser un pipeline COLMAP/Meshroom + correction couleur en **estimation 2-3 mois**, un module Gaussian Splatting maison en **estimation 4-6 mois** (recherche + intégration).

---

### 3. Détection du blanchissement et des maladies (SCTLD)

**Blanchissement.** La détection par image du blanchissement est en pratique un sous-produit de la classification de couverture corallienne : CoralNet/CoralSCOP permettent de calculer automatiquement la proportion de pixels « corail pâli/blanc » vs « corail sain » sur des photos-quadrats — capacité vérifiée indirectement via les capacités de segmentation citées en (1).

**SCTLD (maladie de perte tissulaire des coraux durs).** C'est le point de vigilance le plus important de ce dossier : la littérature 2024-2026 trouvée sur SCTLD porte presque exclusivement sur des approches **génomiques** (signatures d'expression génique, PMC12289216, 2025), de **micro-tomographie + deep learning sur le squelette** (étude FAU, mai 2026, U-Net/U-Net++/Attention U-Net sur imagerie micro-CT — fau.edu/newsdesk/articles/stony-coral-imaging-study) et de **classification par biomarqueurs moléculaires** (SCTLD vs peste blanche, 463 biomarqueurs identifiés, 2024, researchsquare.com/article/rs-5005833/v1). **Aucune source trouvée cette session ne démontre un classifieur d'image RGB de plongée (type CNN sur photo de smartphone/GoPro) capable de diagnostiquer la SCTLD de façon fiable.** C'est une lacune de l'état de l'art accessible à un fondateur seul : construire un « détecteur SCTLD par photo » sans base scientifique solide serait une **hypothèse non sourcée**, à traiter avec prudence dans toute proposition produit (à positionner comme aide au tri/alerte précoce pour un réseau de plongeurs, pas comme diagnostic).

---

### 4. eDNA (ADN environnemental)

**Ce que ça détecte réellement.** Le metabarcoding eDNA marin est validé scientifiquement pour la détection de présence/absence d'espèces à partir d'échantillons d'eau (ex. 134 espèces de poissons identifiées dans une étude aux Philippines, incluant des taxons benthiques peu visibles en plongée) — capacité vérifiée (sciencedirect.com/science/article/abs/pii/S0964569126001390). Les limites documentées : dilution de l'ADN dans de grands volumes d'eau, variabilité de salinité/courants/marées, contraintes méthodologiques (mdpi.com/2079-7737/14/11/1467).

**Coûts, laboratoires, délais — lacune chiffrée.** Aucune page tarifaire commerciale n'a pu être récupérée cette session (naturemetrics.com/pricing → 404 ; recherches web générales sans prix précis). **Estimation raisonnée** (à vérifier avant tout business plan) : kit de prélèvement/filtration ≈ 50-150 $ CAD par échantillon, analyse metabarcoding en laboratoire ≈ 150-500 $ CAD par échantillon, délai ≈ 2 à 6 semaines entre prélèvement et résultat. Kits d'extraction commerciaux couramment cités dans la littérature : Qiagen DNeasy Blood & Tissue, PowerPlant.

**Barrière à l'entrée.** Le laboratoire (séquençage, bases de référence taxonomiques) reste un goulot d'étranglement pour un fondateur seul — la valeur ajoutée logicielle possible est l'orchestration (échantillonnage géolocalisé, suivi de chaîne du froid, restitution cartographique des résultats), pas le séquençage lui-même qui doit être sous-traité.

---

### 5. Acoustique passive

**Matériel bas coût.** Un hydrophone construit à partir de composants du commerce coûte environ **20 € en pièces**, et un système complet avec enregistreur portable environ **50 €** ; ce matériel détecte de façon fiable la plupart des sons anthropiques identifiés par des instruments de référence, mais performe mal sous 200 Hz — capacité vérifiée (PMC12694390, « A Low-Cost Passive Acoustic Toolkit for Underwater Recordings »).

**Indices de santé des récifs.** Les récifs en bonne santé produisent des paysages sonores riches et diversifiés (poissons, crevettes-pistolets), les récifs dégradés perdent cette complexité acoustique — un logiciel dédié, **CoralSoundExplorer**, a été publié pour visualiser/quantifier ces paysages sonores (PMC12017563). Des indices composites de santé récifale basés sur l'acoustique en eaux tropicales bruyantes ont été publiés en novembre 2025 (arxiv.org/html/2511.05349). L'IA (réseaux pré-entraînés + apprentissage non supervisé) améliore l'extraction d'information des enregistrements bruts (PMC12064026) — toutes ces capacités sont vérifiées comme axes de recherche actifs et publiés en 2024-2025.

**Limite pratique documentée.** Le goulot n'est pas le matériel (bon marché) mais l'analyse : « le processus d'analyse est souvent aussi long et fastidieux que les méthodes de relevé traditionnelles » (source PMC citée ci-dessus) — c'est exactement l'ouverture pour un produit logiciel d'automatisation.

**Licences.** Aucune contrainte réglementaire spécifique identifiée pour l'écoute passive (contrairement au sonar actif, qui peut nécessiter des autorisations en zone protégée) — **hypothèse non sourcée**, à vérifier au cas par cas selon juridiction (ex. NOAA/DFO pour zones protégées).

---

### 6. Imagerie satellite et drones

**Allen Coral Atlas.** Combine Planet Dove (3,125 m de résolution, 4 bandes analytiques) et Sentinel-2 (10 m, utilisé pour la bathymétrie et le suivi du blanchissement). Zonation géomorphologique cartographiée jusqu'à environ 15 m de profondeur, composition benthique (corail dur/mou, macroalgues, herbier, sable, gravats, roche) jusqu'à environ 10 m de profondeur. Cartes mondiales complétées le 8 septembre 2021, mises à jour fin 2022 ; accès gratuit via Google Earth Engine — capacité vérifiée (allencoralatlas.org/methods/, consulté 07/09/2026). **Limite documentée explicitement** : en eaux non claires (turbides), des erreurs de profondeur et de classification apparaissent (allencoralatlas.org/resources/, FAQ) — point crucial pour le Pacifique Nord-Ouest, où la turbidité est fréquente.

**Herbiers marins par Sentinel-2.** Une cartographie mondiale à 10 m de résolution publiée en 2026 dans *Nature* a traité 4,75 millions d'images Sentinel-2 sur deux périodes (2019-2020 et 2023-2024) avec un classifieur deep learning, identifiant 148 506 km² d'herbiers (dont 142 545 km² en zone subtidale) — capacité vérifiée (nature.com/articles/s41586-026-10704-3).

**KelpWatch.** Cité dans le brief comme référence pour le suivi du kelp par satellite (habituellement basé sur des séries Landsat) — **lacune** : le contenu du site n'a pas pu être récupéré cette session (page vide via WebFetch), aucune caractéristique de résolution/fréquence/licence vérifiée ici.

**Barrière à l'entrée.** Nulle sur l'accès aux données (Sentinel-2 et Allen Coral Atlas sont gratuits et bien documentés) ; la barrière est dans le traitement fin (calibration locale, correction de turbidité, fusion avec données terrain) — exactement le type d'effort qu'un fondateur seul assisté d'IA peut fournir en quelques mois pour un marché de niche (ex. Colombie-Britannique).

---

### 7. Sonar et ROV grand public

**ROV.** Le BlueROV2 (Blue Robotics) est vendu à partir de **4 900 $ US** en configuration de base, avec une profondeur nominale de 100 m (tube acrylique) ou 300 m (tube aluminium), caméra 1080p de série, et des options sonar (Cerulean Omniscan 450 FS, Ping360) et caméra stéréo (MarineSitu C3) sans prix affiché publiquement — capacité vérifiée (bluerobotics.com/store/rov/bluerov2/, consulté 07/09/2026). Le Chasing M2 Pro (≈3 459 $ US) et le QYSEA Fifish V6 Pro (≈2 999 $ US) sont positionnés sur un segment similaire — chiffres **rapportés par des sources secondaires** (pages produits officielles inaccessibles cette session, à revérifier).

**Sonar de pêche grand public (Garmin LiveScope, Humminbird MEGA Live/side imaging).** Ce sont des sonars conçus et vendus pour la pêche récréative (repérage de poissons et de structure). **Aucune source consultée cette session ne confirme leur capacité à distinguer un type d'habitat benthique (herbier vs éponge vs corail) au niveau spécifique** — seule leur capacité générale à imager la structure du fond est notoire dans l'industrie de la pêche. À traiter comme **capacité non vérifiée pour un usage de conservation** tant qu'une étude indépendante n'a pas quantifié la résolution de classification obtenue.

**Cas vérifié de couplage ROV + sonar pour habitats.** Un système combinant ROV Blue Robotics et navigation de précision (Sonardyne SPRINT-Nav Mini) a permis de cartographier des herbiers marins par bandes de balayage sonar jusqu'à 200 m de large, avec vérification des zones détectées par plongée ROV — capacité vérifiée pour ce cas d'usage précis, mais système professionnel hors budget bootstrap (sonardyne.com/small-rov-big-impact-transforming-habitat-restoration-with-precision-imaging).

**Barrière à l'entrée.** Le matériel est en vente libre et documenté ; la barrière réelle est logicielle (post-traitement d'image sonar pour en tirer une classification d'habitat fiable) — un vrai chantier de plusieurs mois, pas une intégration triviale.

---

### 8. AIS et VMS pour détecter chalutage et mouillages

**Global Fishing Watch (GFW).** API gratuite après inscription, acceptation des conditions d'utilisation et description de l'usage prévu (attribution obligatoire) ; couvre ~70 000 navires diffusant l'AIS, effort de pêche apparent, rencontres/transbordement, visites de port, mouillage/« loitering » ; utilisée par plus de 200 organisations dans près de 70 pays — capacité vérifiée (globalfishingwatch.org/our-apis/, consulté 07/09/2026). Des limites de débit de 50 000 requêtes/jour et 1 550 000/mois sont rapportées par une source tierce (non re-confirmées sur la documentation officielle elle-même) — **à vérifier avant intégration produit**.

**AISHub.** Réseau communautaire : accès gratuit aux données agrégées en échange du partage des données de son propre récepteur AIS — **capacité supposée**, non re-vérifiée par fetch dédié cette session (connaissance générale du secteur).

**Spire Maritime (racheté par Kpler, 2024-2025).** Constellation propriétaire de plus de 100 nanosatellites AIS ; tarification entreprise non publique, contact commercial requis — capacité d'existence vérifiée, prix **capacité supposée / non publique**.

**Barrière à l'entrée.** Faible sur l'accès aux données brutes (GFW gratuit couvre déjà l'essentiel pour un usage de détection de chalutage/mouillage en zone protégée) ; la barrière est dans le croisement avec des polygones de zones sensibles (AMP, herbiers cartographiés, câbles) et la génération d'alertes exploitables — un travail de data engineering à la portée d'un fondateur seul en **estimation 6-10 semaines** pour un MVP.

---

### 9. LLM pour rapports réglementaires

Capacité générique et vérifiée par construction : un LLM (Claude) peut transformer des données structurées de suivi (couverture corallienne, indices acoustiques, alertes AIS, résultats eDNA) en rapports texte conformes à un gabarit réglementaire (ex. rapports MRV, dossiers de subvention, rapports de conformité). Aucune barrière technique propre — la valeur se trouve dans les données amont et le gabarit métier, pas dans le LLM lui-même. Coût marginal de quelques dollars par rapport en usage API.

---

## (c) Concurrents 2024-2026 : prix et financement

| Concurrent | Pays/base | Modèle | Financement / prix connus | Pertinence pour un fondateur bootstrap PNW |
|---|---|---|---|---|
| **ReefCloud** | Australie (AIMS, institut public) | Plateforme d'analyse d'images de récif en libre accès, 80-90 % de précision revendiquée, « 700x plus rapide » que l'analyse manuelle | Financée par des fonds publics/philanthropiques (AIMS, ICRI) ; pas un produit commercial concurrent direct — plutôt un bien public de référence | Source : sea-technology.com, aims.gov.au (dates non précisées, consultation 2025-2026) |
| **Coral Vita** | États-Unis (Bahamas, Arabie saoudite, Émirats) | Restauration-as-a-service, adoption de corail dès **30 $**, contrats avec hôtels côtiers, assureurs, gouvernements | Série A **8 M$** menée par Builders Vision/Builders Initiative en 2025, total levé **15 M$** ; fondée en 2015 | forbes.com (juin 2025), coralvita.co |
| **Reefgen** | États-Unis (San Francisco) | Robots plantant corail/herbier/mangrove, modèle « Robotics-as-a-Service » | Fondée en 2020 par Tom Chi ; financement non chiffré précisément dans les sources consultées | theinvadingsea.com (déc. 2025) |
| **Coral Maker** | Royaume-Uni/international | Robotique et fabrication pour restauration corallienne à grande échelle, lié au programme de financement REEF+ du Global Fund for Coral Reefs | Financement non chiffré dans les sources consultées | coralmaker.org, globalfundcoralreefs.org |
| **Ulysses (Ulysses Ecosystem Engineering)** | Irlande | Véhicules sous-marins autonomes pour tâches océaniques critiques, 5 générations de prototypes testées, >5 M$ de revenus clients (gouvernement, commercial, science) | Seed **8 M$** (nov. 2024) + Série A **38 M$** (avril 2026, avec Andreessen Horowitz) = **46 M$** au total | irishtimes.com (avril 2026), corememory.com |
| **Fathom** | Ambiguïté : deux entités distinctes trouvées — *Fathom Ocean* (monitoring vidéo/audio/capteurs en direct) et *Fathom Science* (jumeaux numériques océaniques par IA, prévisions métocéaniques) | Financement non chiffré dans les sources consultées | crunchbase.com, fathomscience.com |
| **Sofar Ocean** | États-Unis | Bouées de capteurs océaniques (Spotter) et outils d'exploration/conservation accessibles | Série B **39 M$** en 2022 (source Crunchbase) | crunchbase.com |
| **Terradepth** | États-Unis (Austin) | AUV de grande capacité (plongée >6 000 m), fondée par d'anciens Navy SEALs | Financement non chiffré précisément dans les sources consultées | résumé WebSearch (ellty.com) |
| **Bedrock Ocean** | États-Unis (New York) | AUV autonome (12h d'autonomie batterie), sonar + capteurs magnétiques, cartographie du fond marin en mode « as a service » | Série A-2 **25 M$** menée par Primary et Northzone (avec Autopilot, Costanoa Ventures, Harmony Partners, Katapult, Mana Ventures), annoncée 2025-2026 | therobotreport.com, linkedin.com (résumé) |
| **Notilo Plus** | France | iBubble (caméra grand public pour plongeurs), Seasam (ROV industriel), Notilo Cloud (analyse IA, rapports automatiques) | Prix non publiés | notiloplus.com (consulté 07/09/2026) |
| **Hydromea** | Suisse | Robotique sous-marine pour infrastructures immergées (LUMA modem optique, EXRAY robot d'inspection) — **cible les infrastructures industrielles, pas les récifs naturels** | Prix non publiés | hydromea.com (consulté 07/09/2026) |
| **Arribada** | Royaume-Uni | Matériel de conservation open-source (biologging, télémétrie acoustique) — statut de « Community Interest Company », pas une startup VC classique | Financée par RSPB, ESA, WWF, Defra, FCDO, Shuttleworth Foundation | arribada.org (consulté 07/09/2026) |
| **Vertical Oceans** | Singapour | **Note de transparence** : recherches indiquent qu'il s'agit d'une startup d'aquaculture de crevettes en système recirculé (RAS), pas d'un acteur de conservation des fonds marins — inclusion dans la liste du brief probablement une confusion de secteur ; aucune source liant cette société à la surveillance benthique n'a été trouvée | — | à vérifier auprès de l'orchestrateur |
| **Aquatic Labs, ReefOS, Blue Ocean Gear** | — | **Non identifiés avec certitude** dans les recherches de cette session (résultats trop génériques ou absents) | — | lacune assumée, à rechercher spécifiquement si besoin |

**Lecture d'ensemble.** L'essentiel du capital-risque récent afflue vers la **robotique océanique lourde** (Ulysses, Bedrock Ocean, Terradepth, Reefgen — dizaines de millions de $) et la **restauration corallienne** (Coral Vita). Aucun concurrent identifié ne combine spécifiquement (i) matériel du commerce bon marché, (ii) IA de vision entraînée sur données locales PNW, et (iii) modèle économique à petits tickets mensuels — c'est l'espace laissé libre pour un fondateur bootstrap basé à Vancouver.

---

## (d) Ce qu'un fondateur seul peut construire en 3, 6, 12 mois

**À 3 mois (MVP, < 10 k$ CAD de matériel).**
- Pipeline de classification de couverture benthique à partir de photos-quadrats prises en plongée (fine-tuning de RF-DETR ou CoralSCOP sur un jeu de 500-1500 images annotées localement, complété par CoralNet/BenthicNet pour le pré-entraînement) — capacité vérifiée pour la brique modèle, effort de collecte locale à charge du fondateur (accès aux deux clubs de plongée mentionnés dans le brief).
- Tableau de bord simple (alerte + carte) croisant l'API gratuite Global Fishing Watch avec les polygones des Aires Marines Protégées de Colombie-Britannique pour détecter des passages suspects de chalutiers ou des mouillages prolongés en zone sensible.
- Matériel : un BlueROV2 de base (4 900 $ US) ou un GoPro en caisson + drone de surface pour la collecte d'images.

**À 6 mois.**
- Intégration d'un module de photogrammétrie (COLMAP/Meshroom) pour produire des modèles 3D de sites de plongée suivis dans le temps, avec calcul de métriques de structure (surface, volume) — **capacité supposée** pour la précision de mesure de croissance/rugosité, à valider par comparaison avec des relevés manuels.
- Ajout d'un canal d'acoustique passive bas coût (hydrophone ~50 €) sur 2-3 sites pilotes, avec calcul d'un indice de complexité sonore simple (proxy de santé récifale) — capacité vérifiée pour la méthode de base (papiers cités en section acoustique), à recalibrer localement (espèces PNW différentes des récifs tropicaux étudiés dans la littérature).
- Génération automatisée de rapports (LLM) pour un premier client pilote (club de plongée, ONG locale, ou programme MRV subventionné).

**À 12 mois.**
- Extension géographique (Californie, Floride) avec adaptation du modèle de vision aux espèces coralliennes tropicales (transfert depuis CoralNet/CoralSCOP, déjà entraînés en tropical, donc **moins d'effort d'adaptation que pour le PNW en eaux froides et turbides**).
- Couche de détection de maladies élargie **avec prudence** : positionner comme outil d'alerte précoce/tri pour un réseau de plongeurs (pas comme diagnostic SCTLD certifié, faute de base scientifique solide pour la détection par simple image RGB — cf. section 3).
- Explorer un partenariat de licence de données avec un laboratoire eDNA existant plutôt que d'internaliser le séquençage (barrière trop lourde pour un fondateur seul).
- Cible de revenus compatible avec le brief : plusieurs dizaines de clients à 100-1000 $/mois (clubs de plongée, gestionnaires de petites AMP, assureurs côtiers) plus 1-2 pilotes payants (15-80 k$) avec une agence publique ou un programme MRV.

---

## (e) Opportunités produit

### 1. ReefLens PNW — suivi automatisé de la santé des récifs et herbiers du Pacifique Nord-Ouest par vision embarquée
- **Cible précise** : clubs de plongée et opérateurs de plongée commerciale en Colombie-Britannique/Washington/Oregon (dizaines de clubs recensés dans la région, l'accès à deux clubs vancouvérois est déjà acquis), gestionnaires de petites Aires Marines Protégées (Parcs Canada, BC Parks) — **estimation** de 30 à 80 clients potentiels immédiats en Pacifique Nord-Ouest.
- **Problème** : absence d'outil abordable pour transformer les photos de plongée existantes (déjà prises par les clubs et bénévoles) en séries temporelles de couverture d'espèces et d'indicateurs de santé, faute de temps/expertise en interne.
- **Produit** : application mobile de capture guidée (photo-quadrat standardisé) + pipeline de classification par fine-tuning de RF-DETR/CoralSCOP sur données locales (algues, éponges, oursins violets envahissants, étoiles de mer) + tableau de bord de tendance ; matériel = GoPro/smartphone en caisson déjà possédé par les plongeurs, pas de nouveau matériel obligatoire.
- **Prix et modèle** : abonnement club de plongée 100-300 $ CAD/mois (upload illimité + rapport trimestriel), option agence publique 15-40 k$/an pour un programme de suivi structuré sur plusieurs sites.
- **Effort technologique** : élevé sur la constitution du jeu de données local (les modèles ouverts sont tropicaux), moyen sur l'intégration modèle/app — fondateur seul assisté de Claude : **estimation 4-6 mois** pour un MVP exploitable par un club pilote.
- **Concurrents** : ReefCloud (outil public australien, pas orienté PNW ni petits clubs), CoralNet (outil générique sans produit packagé pour petits opérateurs) — aucun concurrent identifié ciblant spécifiquement le PNW avec un produit commercial à petit ticket.
- **Pourquoi maintenant (daté)** : les jeux de données ouverts CoralSCOP (CVPR 2024) et RF-DETR (licence Apache 2.0, 2024-2025) rendent le fine-tuning accessible sans budget de recherche ; aucune échéance réglementaire spécifique identifiée pour le PNW dans cette session — **à confirmer par l'agent réglementaire dédié** (reg-canada/canada-pnw-benthic).
- **Premier client atteignable depuis Vancouver** : un des deux clubs de plongée déjà fréquentés par le fondateur, en pilote gratuit puis payant.

### 2. SentinelWake — détection de mouillage et de chalutage illégal en zone d'herbiers/récifs par croisement AIS gratuit + polygones d'habitats sensibles
- **Cible précise** : gestionnaires d'Aires Marines Protégées et de zones Ramsar en Colombie-Britannique et sur la côte Ouest américaine — **estimation** 15-25 organismes potentiels (agences provinciales/fédérales, ONG de conservation marine).
- **Problème** : les gestionnaires d'AMP n'ont pas de veille continue et abordable du trafic maritime en zone sensible (chalutage de fond, mouillage prolongé sur herbier).
- **Produit** : service web consommant l'API gratuite Global Fishing Watch (vessel presence, effort de pêche apparent, loitering) croisé avec les cartes d'habitats (Allen Coral Atlas pour les tropiques, cartographie Sentinel-2 des herbiers pour le PNW) pour générer des alertes géolocalisées ; base de données propriétaire = les polygones d'habitats validés localement + historique d'alertes.
- **Prix et modèle** : 200-800 $ CAD/mois par zone surveillée (petits gestionnaires), licence de données/alertes à des assureurs ou certificateurs de crédits biodiversité en complément.
- **Effort technologique** : moyen (essentiellement du data engineering — API GFW + SIG), pas de modèle IA complexe requis pour le MVP — **estimation 2-3 mois** pour un fondateur seul.
- **Concurrents** : Global Fishing Watch lui-même est un bien public gratuit mais généraliste (pas d'alertes personnalisées par zone/client), aucun produit commercial dédié aux petits gestionnaires d'AMP identifié dans cette recherche.
- **Pourquoi maintenant (daté)** : l'API GFW est gratuite et documentée comme utilisée par 200+ organisations en 2025-2026 (globalfishingwatch.org, consulté 07/09/2026) — la donnée existe, il manque le produit de dernier kilomètre pour petits acteurs.
- **Premier client atteignable depuis Vancouver** : gestionnaire d'une AMP locale (ex. zone protégée près de Steveston/port de pêche mentionné dans le brief) via approche directe.

### 3. SplatReef — modèles 3D périodiques de sites de plongée pour preuve de restauration et calcul de structure
- **Cible précise** : programmes de restauration corallienne/herbière et porteurs de projets de crédits biodiversité/carbone bleu ayant besoin de preuve MRV visuelle — **estimation** 10-20 projets pilotes potentiels en Floride/Californie/Caraïbes dans les 12 mois (marché plus mûr que le PNW pour la restauration active).
- **Problème** : les méthodes actuelles de preuve de restauration (comptages manuels, photos ponctuelles) sont lentes et peu convaincantes pour des acheteurs de crédits ou des assureurs.
- **Produit** : capture vidéo en plongée (GoPro/caméra 360) traitée par pipeline photogrammétrique (COLMAP/Meshroom) puis Gaussian Splatting adapté sous-marin (inspiré de WaterSplatting/DualPhys-GS, 2024-2025) pour produire un modèle 3D comparable dans le temps ; calcul de métriques de structure (surface 3D, volume, densité apparente de colonies) — **capacité supposée** pour la métrique de croissance précise, à valider par un pilote comparant mesure manuelle et mesure automatique avant vente commerciale.
- **Prix et modèle** : 2 000-8 000 $ par campagne de capture + traitement (facturé au projet), ou abonnement 500-1500 $/mois pour suivi trimestriel d'un site.
- **Effort technologique** : élevé (recherche appliquée en Gaussian Splatting sous-marin, peu de produits packagés existants) — **estimation 5-7 mois** pour un pipeline fiable, fondateur seul assisté de Claude pour l'intégration logicielle.
- **Concurrents** : Coral Vita et Reefgen font de la restauration physique mais pas de la preuve 3D en tant que service indépendant ; aucun concurrent pur-jeu « 3D-as-a-proof » identifié dans les sources consultées.
- **Pourquoi maintenant (daté)** : la littérature de Gaussian Splatting sous-marin est très récente (fév.-août 2025, sources arxiv citées ci-dessus) — fenêtre où peu d'acteurs ont encore industrialisé la technique.
- **Premier client atteignable depuis Vancouver** : à distance, un projet de restauration en Floride ou aux Caraïbes déjà identifié par le fondateur ou via réseau de plongée, en pilote payant réduit.

### 4. SoundReef Alert — indice de santé acoustique low-cost pour petits sites de plongée et AMP
- **Cible précise** : clubs de plongée et petites AMP côtières souhaitant un suivi continu à très bas coût, y compris hors saison de plongée — **estimation** 20-40 clients potentiels en Amérique du Nord côtière.
- **Problème** : le suivi visuel (plongée) est ponctuel et coûteux en temps humain ; un indicateur continu et automatisé manque pour détecter une dégradation entre deux plongées.
- **Produit** : hydrophones bas coût (~50 € pièce, capacité vérifiée PMC12694390) déployés en réseau sur bouées existantes, pipeline d'analyse par réseaux pré-entraînés + apprentissage non supervisé (méthode publiée PMC12064026, 2025) pour produire un indice de complexité acoustique quotidien, alerte en cas de chute brutale (signal possible de dégradation ou d'activité anthropique).
- **Prix et modèle** : matériel vendu à prix coûtant + abonnement logiciel 100-400 $ CAD/mois par site pour le traitement et les alertes.
- **Effort technologique** : moyen (le matériel est simple, l'enjeu est le pipeline de traitement du signal et la calibration locale — les études existantes sont majoritairement tropicales) — **estimation 3-4 mois** pour un MVP sur 2-3 sites pilotes.
- **Concurrents** : pas de produit commercial identifié combinant hydrophone bas coût + IA packagée pour petits sites (les publications citées sont académiques, pas des produits).
- **Pourquoi maintenant (daté)** : papier de novembre 2025 sur les indices composites acoustiques (arxiv.org/html/2511.05349) et méthode d'IA de soundscape 2025 (PMC12064026) — la méthode est publiée mais pas encore packagée commercialement.
- **Premier client atteignable depuis Vancouver** : un des deux clubs de plongée du fondateur, avec un hydrophone posé sur une bouée existante en test gratuit.

### 5. TrawlWatch Insurance Feed — licence de données d'activité de chalutage/mouillage en zone sensible pour assureurs et certificateurs
- **Cible précise** : assureurs paramétriques et certificateurs de crédits biodiversité/carbone bleu ayant besoin de preuve indépendante d'absence de dommage mécanique en zone assurée/certifiée — **estimation** 5-15 acheteurs institutionnels (assureurs spécialisés, standards comme Verra/Gold Standard mentionnés dans le brief comme sources à consulter).
- **Problème** : les assureurs et certificateurs manquent de flux de données tiers, indépendant et daté, prouvant l'absence (ou la présence) d'activité de chalutage/mouillage sur une zone assurée.
- **Produit** : extension de SentinelWake (opportunité 2) packagée en flux de données/API vendu en licence à des tiers institutionnels, avec horodatage et export de preuve (rapport rédigé automatiquement par LLM).
- **Prix et modèle** : licence de données 1 000-5 000 $ CAD/mois selon nombre de zones couvertes, ou forfait par rapport de preuve (200-500 $ CAD/rapport).
- **Effort technologique** : faible à moyen une fois SentinelWake construit (réutilisation de la même donnée AIS/GFW) — **estimation 4-8 semaines** additionnelles après le MVP #2.
- **Concurrents** : aucun acteur identifié combinant spécifiquement AIS gratuit + preuve documentaire pour assurance paramétrique de récifs/herbiers.
- **Pourquoi maintenant (daté)** : montée en puissance des standards de crédits biodiversité/carbone bleu (Verra, Gold Standard cités dans le brief comme sources officielles à suivre) — **à confirmer précisément par l'agent finance-biodiversity** pour les échéances datées (hors périmètre WebSearch de cet agent).
- **Premier client atteignable depuis Vancouver** : à distance, un courtier ou assureur spécialisé en risques environnementaux déjà actif sur les crédits bleus.

---

## (f) Références et lacunes

### Références principales (URL et date de consultation, 07/09/2026 sauf indication contraire)
- CoralNet — coralnet.ucsd.edu
- FathomNet — fathomnet.org
- BenthicNet — nature.com/articles/s41597-025-04491-1 ; arxiv.org/html/2405.05241v1 (2025)
- SQUIDLE+ — squidle.org
- CoralSCOP — github.com/zhengziqiang/CoralSCOP ; huggingface.co/reefsupport/CoralSCOP (CVPR 2024)
- CoralSCOP-LAT — arxiv.org/pdf/2410.20436 (oct. 2024)
- UWSAM — arxiv.org/html/2505.15581v1 (mai 2025) ; « Diving into Underwater » — arxiv.org/pdf/2406.06039 (juin 2024)
- RF-DETR — github.com/roboflow/rf-detr
- Revue reconstruction 3D récifs — arxiv.org/pdf/2502.20154 (fév. 2025)
- RUSplatting — arxiv.org/pdf/2505.15737 (mai 2025) ; DualPhys-GS — arxiv.org/pdf/2508.09610 (août 2025)
- SCTLD génomique — royalsocietypublishing.org/rsos/article/12/7/241993 (2025) ; FAU micro-CT/IA — fau.edu/newsdesk/articles/stony-coral-imaging-study (mai 2026) ; biomarqueurs — researchsquare.com/article/rs-5005833/v1 (2024)
- eDNA marine — sciencedirect.com/science/article/abs/pii/S0964569126001390 ; mdpi.com/2079-7737/14/11/1467
- Acoustique passive bas coût — ncbi.nlm.nih.gov/pmc/articles/PMC12694390 ; CoralSoundExplorer — PMC12017563 ; IA soundscape — PMC12064026 ; indices composites — arxiv.org/html/2511.05349 (nov. 2025)
- Allen Coral Atlas — allencoralatlas.org/methods/ et /resources/
- Herbiers Sentinel-2 mondiaux — nature.com/articles/s41586-026-10704-3 (2026)
- BlueROV2 — bluerobotics.com/store/rov/bluerov2/
- Sonardyne ROV/herbiers — sonardyne.com/small-rov-big-impact-transforming-habitat-restoration-with-precision-imaging
- Global Fishing Watch API — globalfishingwatch.org/our-apis/
- Concurrents : coralvita.co, theinvadingsea.com, coralmaker.org, globalfundcoralreefs.org, irishtimes.com, corememory.com, crunchbase.com, therobotreport.com, notiloplus.com, hydromea.com, arribada.org

### Lacunes assumées (chercher en priorité si le projet avance)
1. **Prix commerciaux réels des kits/labos eDNA** — aucune page tarifaire trouvée ; chiffres actuels marqués « estimation ».
2. **Détection SCTLD par simple photo RGB** — pas de preuve scientifique trouvée ; ne pas construire de produit de « diagnostic automatique » sans validation indépendante.
3. **Pages officielles KelpWatch, Reef Life Survey, NOAA NCCOS** — inaccessibles cette session (403/404/vide) ; caractéristiques précises (résolution, licence, volume) non vérifiées.
4. **Capacité réelle de Garmin LiveScope/Humminbird à distinguer les habitats benthiques** (vs simplement détecter une structure/du poisson) — non confirmée par une source indépendante.
5. **Identité et pertinence exactes de « Vertical Oceans », « ReefOS », « Aquatic Labs », « Blue Ocean Gear »** dans la liste de concurrents du brief — recherches infructueuses ou résultats hors sujet (Vertical Oceans semble être une aquaculture de crevettes, pas un acteur benthique).
6. **Limites de débit et conditions commerciales précises de l'API Global Fishing Watch** pour un usage produit à volume — la page officielle ne détaille pas de quota, un chiffre (50 000/jour) provient d'une source tierce non recoupée.
7. **CoralNet-Toolbox** — existence mentionnée dans le brief, aucun détail vérifié cette session.

---

## Résumé (15 lignes max)

Meilleures opportunités identifiées pour le fondateur (Vancouver, bootstrap, dev/data/IA) :

1. **ReefLens PNW** — vision par ordinateur (RF-DETR/CoralSCOP fine-tunés) sur photos de plongée existantes pour suivi de couverture benthique locale (algues, oursins envahissants, herbiers) ; matériel déjà possédé par les plongeurs ; 4-6 mois ; 100-300 $/mois par club, 15-40 k$/an par agence publique. Le plus réaliste en 3-6 mois car s'appuie sur des modèles ouverts (CVPR 2024, Apache 2.0) et un accès terrain déjà acquis.
2. **SentinelWake** — croisement de l'API gratuite Global Fishing Watch avec des polygones d'habitats sensibles pour alerter les gestionnaires d'AMP sur chalutage/mouillage ; 2-3 mois, effort surtout data engineering, pas de barrière matérielle.
3. **SplatReef** — modèles 3D (Gaussian Splatting sous-marin, littérature très récente 2025) comme preuve de restauration pour projets de crédits biodiversité ; marché plus mûr en Floride/Caraïbes qu'au Canada ; 5-7 mois, risque technique plus élevé mais barrière à l'entrée réelle (peu d'acteurs packagés).
4. **SoundReef Alert** — hydrophones à 50 € + IA de soundscape (papiers 2025) pour indice de santé continu à très bas coût ; 3-4 mois, bon complément récurrent aux visites de plongée.
5. **TrawlWatch Insurance Feed** — extension B2B de SentinelWake vers assureurs/certificateurs de crédits bleus ; rapide à ajouter une fois #2 construit.

Principal risque à surveiller : ne pas vendre de capacité de diagnostic (SCTLD notamment) non prouvée scientifiquement par simple photo. Principale barrière réelle du secteur : les données et modèles ouverts existent (tropicaux surtout) — la vraie valeur défendable est la donnée locale PNW annotée par le fondateur lui-même.
