# Dossier — agent energie-cables (passe 4, phase intuition)

Périmètre : développeurs/exploitants d'éolien en mer, de câbles sous-marins, de pipelines, de plateformes à
démanteler, d'hydrolien et de houlomoteur, et leurs prestataires d'exploitation et maintenance (O&M). Date de
référence : 7 septembre 2026. Méthode : 10 WebSearch (quota atteint) + WebFetch libre sur les sources les plus
prometteuses. Chaque capacité IA est étiquetée **vérifiée (source)** ou **supposée**.

---

## (a) La population

**Qui, combien.** Six développeurs nommés dans le mandat sont actifs et vérifiables cette semaine : Ørsted
(Danemark, premier développeur mondial d'éolien en mer), RWE (Allemagne), Equinor (Norvège, énergéticien
public/pétrolier diversifié), EDF (France, via EDF Renewables), Vattenfall (Suède, public), BP (Royaume-Uni,
pétrolier diversifié vers l'éolien) — **vérifiée** : tous actifs en 2025-2026 sur des projets US/UK/Europe, y
compris rebids sur l'appel d'offres de l'État de New York et scission Equinor/BP des baux Empire Wind et Beacon
Wind mi-2025 (utilitydive.com, 2025). Le nombre total de développeurs et de projets dans le pipeline mondial est
**supposé** (dizaines d'acteurs, centaines de projets, connaissance générale non revérifiée cette session — à
marquer « estimation »). Le sous-secteur hydrolien/houlomoteur est beaucoup plus restreint et pré-commercial : le
LCOE (Levelized Cost of Energy, coût actualisé de l'énergie) hydrolien est cité à 100-280 £/MWh, très supérieur à
l'éolien — **vérifiée** (EMEC, European Marine Energy Centre, centre d'essai écossais aux Orcades). Le
démantèlement pétrolier/gazier concerne des dizaines de plateformes en mer du Nord (régime OSPAR, retrait complet
obligatoire) et dans le Golfe du Mexique/Pacifique américain (régime BOEM/BSEE, « rigs-to-reefs » autorisé) —
**vérifiée** (OSPAR Décision 98/3 ; BOEM = Bureau of Ocean Energy Management ; BSEE = Bureau of Safety and
Environmental Enforcement, agences fédérales américaines).

**Prestataires déjà payés.** RPS Group dessert environ 90 % des zones de bail éolien actives aux États-Unis
(depuis 2020) pour le support environnemental de terrain — **vérifiée**. Des sociétés de classification et de
levé (DNV = Det Norske Veritas, société norvégienne de certification ; Cathie Group ; Seagard ; Indeximate) et des
start-ups de détection par IA (Ecodetect, DeepSeaVision/Synthetik Applied Technologies, Marine Observer/Toyon,
Spoor, Anemo Robotics, Neptune AI/Tetra Tech) sont déjà rémunérées sur ce marché — **vérifiée** (sites propres +
presse sectorielle 2025-2026).

**Ce qui est déjà payé/perdu, chiffré.** Observateurs de mammifères marins (MMO, Marine Mammal Observer) et
opérateurs PAM (Passive Acoustic Monitoring, suivi acoustique passif) : 19-96 $/h, 200-700 $/j — **vérifiée**
(ziprecruiter.com, crewbase.pro, 2026). Poste « Offshore ROV » (Remotely Operated Vehicle, véhicule sous-marin
téléopéré) : 156 348 $/an en moyenne, 116-205 k$ — **vérifiée** (ZipRecruiter, mai 2026). « Data Analyst offshore
wind » : 90-105 k$/an — **vérifiée** (Glassdoor). Retrait d'une plateforme acier type en mer du Nord : 22,35 M$
contre 9,08 M$ pour un cas comparable en Asie du Sud-Est (~2,5x, écart dû aux tarifs de navires, à la météo et à
la réglementation) — **vérifiée** (Rystad Energy via oilprice.com, étude 2020, toujours citée comme référence).
RWE a déjà déployé cinq systèmes de capteurs/IA distincts et non intégrés (drone, caméra aérienne, caméra sous-
marine, véhicule sous-marin autonome, ADN environnemental) sur un seul parc, Kaskasi, preuve d'une dépense réelle
déjà engagée mais fragmentée entre prestataires — **vérifiée** (rwe.com, 09/09/2025). Une start-up du secteur
(Ecodetect) confirme elle-même que « data collection and analysis was slow and costly and delaying vital
projects » — **vérifiée** (renewableenergymagazine.com, 12/08/2025), preuve indépendante du point de douleur.

---

## (b) Cinq candidats

### 1. Couche de fusion et de conformité multi-capteurs (bruit de battage, mammifères marins, observateurs)
**Problème (source) :** pendant le battage de pieux, le protocole JNCC (Joint Nature Conservation Committee,
organisme consultatif nature du Royaume-Uni) impose observateurs MMO, PAM, zone de mitigation (500 m) et
rapports — jncc.gov.uk. RWE fait tourner 5 flux IA séparés sans fusion visible sur Kaskasi — rwe.com 09/2025.
**Acheteur nommé et dépense :** RWE (Kaskasi/SeaMe, vérifiée) et par extension Ørsted/Equinor/Vattenfall soumis au
même régime JNCC/BOEM (supposée pour le détail par site) ; coût actuel = 200-700 $/j par observateur + N
contrats fournisseurs IA distincts.
**Produit (1 phrase) :** un tableau de bord qui absorbe les flux de tous les capteurs/fournisseurs déjà installés
et génère automatiquement le rapport de conformité au format exigé par le régulateur, avec alertes d'écart au
protocole.
**IA et pourquoi impossible avant 2024 :** LLM (grand modèle de langage) multimodal réconciliant logs
hétérogènes (audio, vidéo, PDF, alertes de 5 fournisseurs) en un rapport traçable calé sur un gabarit
réglementaire précis — la détection seule est **vérifiée** commoditisée (Ecodetect, DeepSeaVision, Marine
Observer, Spoor, Neptune AI) ; avant 2024, aucun modèle ne savait extraire et recouper de façon fiable des
formats multi-fournisseurs incompatibles avec traçabilité des sources — **supposée** pour la nouveauté exacte.
**Données existantes :** logs de terrain, audio PAM, alertes caméra déjà produits par projet — **vérifiée**.
**Protocole/seuil existant :** protocole JNCC 2010 (zone 500 m) — **vérifiée** ; équivalent BOEM/BSEE (US) —
**supposée** (structure similaire non détaillée cette session).
**Existant gratuit/payant :** détection oui (liste ci-dessus, vérifiée) ; couche de fusion/rapport dédiée : aucune
trouvée dans les résultats de recherche — **supposée** (lacune, recherche non exhaustive).
**Retour annuel :** construction pluriannuelle par phases + suivi post-construction obligatoire plusieurs années +
nouveaux baux chaque cycle d'appel d'offres.
**Vérifié/Supposé :** taux, protocole JNCC et exemple RWE vérifiés ; absence de concurrent direct et détail des
homologues américains supposés.

### 2. Rapport d'inspection ROV automatisé pour biofouling et corrosion, référencé aux normes DNV
**Problème (source) :** les fondations, câbles et ancrages accumulent biofouling (colonisation biologique) et
corrosion ; les vidéos ROV sont revues à la main contre la norme DNV-RP-0416 ; la « mud zone » reste non
inspectable — dnv.com ; bsee.gov (TA&R Project 627).
**Acheteur nommé et dépense :** équipes O&M/intégrité d'actifs des développeurs (Ørsted, RWE, Equinor, Vattenfall
— **supposée** pour l'attribution individuelle, régime normatif **vérifiée**) ; postes ROV à 156 k$/an et
analyste de données à 90-105 k$/an déjà budgétés — **vérifiée**.
**Produit (1 phrase) :** un pipeline qui regarde la vidéo ROV brute et rédige automatiquement le rapport d'état
structurel (corrosion, taux de biofouling, dégradation du revêtement) référencé à la clause DNV applicable.
**IA et pourquoi impossible avant 2024 :** modèles de vision multimodaux few-shot (généralisant sans milliers
d'images annotées par client) couplés à un LLM qui rédige la conclusion normative — avant 2024, la vision
nécessitait un ré-entraînement lourd par site/modèle de fondation — **supposée** (raisonnement technique, non
vérifié par un article dédié cette session).
**Données existantes :** années de vidéo ROV déjà archivées par obligation de suivi de classification —
**supposée** (pratique courante, non chiffrée précisément cette session).
**Protocole/seuil existant :** DNV-RP-0416 et DNV-OS-J101 (sélection d'acier), méthodologies BSEE TA&R 627 —
**vérifiée**.
**Existant gratuit/payant :** Deeptrekker (ROV + services d'inspection) — **vérifiée** ; aucun générateur
automatique de rapport DNV trouvé — **supposée** (lacune).
**Retour annuel :** cycle de ré-inspection périodique sur 25-30 ans de vie d'actif, biofouling/corrosion évoluant
chaque saison — **supposée** (cadence exacte non confirmée cette session).
**Vérifié/Supposé :** normes et salaires vérifiés ; mécanisme IA précis et absence de concurrent supposés.

### 3. Prévision d'exposition et d'ensouillage des câbles (CBRA augmentée par IA)
**Problème (source) :** les câbles sous-marins doivent garder une profondeur d'ensouillage suffisante ; la
mobilité des sédiments les expose, obligeant des levés bathymétriques répétés comparés à la main — Carbon Trust,
CBRA (Cable Burial Risk Assessment) guidance, 2015.
**Acheteur nommé et dépense :** propriétaires de câbles d'export (Ørsted, RWE, Equinor, Vattenfall — **supposée**
pour l'attribution individuelle) et prestataires de levé déjà engagés : Cathie Group, Seagard, Indeximate
(DAS, Distributed Acoustic Sensing) — **vérifiée** (existence de ces acteurs).
**Produit (1 phrase) :** un service qui fusionne les levés géophysiques successifs et prédit la trajectoire
d'exposition de chaque tronçon de câble, au format CBRA, pour prioriser les campagnes de réensouillage.
**IA et pourquoi impossible avant 2024 :** fusion spatio-temporelle de nuages de points 3D multi-campagnes pour
prévoir (pas seulement comparer) l'évolution du fond marin — les outils actuels comparent deux levés statiques ;
la prévision calibrée nécessite des modèles géospatiaux temporels lourds, seulement abordables depuis 2024 —
**supposée**.
**Données existantes :** levés géophysiques multi-années déjà commandés pour la conformité CBRA — **vérifiée**
(pratique établie et documentée par Carbon Trust).
**Protocole/seuil existant :** méthodologie CBRA et « Depth of Lowering » (profondeur d'ensouillage cible) —
**vérifiée**.
**Existant gratuit/payant :** Indeximate (détection de câbles dénudés par DAS, capteur continu) — **vérifiée**,
mais orientée détection en continu, pas fusion prédictive de levés discontinus — **supposée** pour la
différenciation exacte.
**Retour annuel :** risque résiduel réévalué chaque année/campagne sur 25+ ans de vie du câble, lié au
renouvellement d'assurance — **vérifiée** (logique CBRA elle-même).
**Vérifié/Supposé :** existence et méthode CBRA, acteur DAS vérifiés ; capacité de prévision précise et
attribution acheteur par nom supposées. Angle hydrolien/houlomoteur (câbles EMEC 11 kV) identifié comme marché
secondaire plus petit — **vérifiée** l'existence, **supposée** la taille exacte du marché.

### 4. Dossier de démantèlement assisté par IA (évaluation comparative retrait vs laisser en place)
**Problème (source) :** décider du retrait complet ou du maintien en place (effet récif artificiel) exige une
évaluation comparative (Comparative Assessment) mêlant vidéo ROV de colonisation, coûts d'ingénierie et bilan
carbone ; la base de preuves est documentée comme fragmentée et le sujet politiquement contesté —
ScienceDirect ; oilprice.com.
**Acheteur nommé et dépense :** BP et autres majors propriétaires d'actifs en fin de vie (**vérifiée** le régime,
**supposée** l'attribution BP précise) ; coût de retrait déjà payé : 22,35 M$ (mer du Nord) contre 9,08 M$
(Asie du Sud-Est) pour une plateforme acier comparable, soit ~2,5x — **vérifiée** (Rystad Energy, 2020).
**Produit (1 phrase) :** un assistant qui ingère vidéo ROV, données d'ingénierie et d'émissions pour rédiger le
dossier d'évaluation comparative au format attendu par le régulateur, avec citations traçables.
**IA et pourquoi impossible avant 2024 :** synthèse multimodale combinant vision (inventaire de colonisation
depuis la vidéo) et rédaction longue traçable contre un gabarit réglementaire précis — avant 2024, ces deux
capacités n'existaient pas de façon fiable dans un seul pipeline — **supposée**.
**Données existantes :** levés écologiques ROV et études d'ingénierie déjà commandés par structure —
**supposée** (pratique courante, non chiffrée cette session).
**Protocole/seuil existant :** OSPAR Décision 98/3 (retrait complet obligatoire, mer du Nord) ; BOEM/NEPA
(National Environmental Policy Act) + permis BSEE pour rigs-to-reefs (Golfe du Mexique/Pacifique) — **vérifiée**.
**Existant gratuit/payant :** littérature académique de méthodologie de coût (ScienceDirect) mais aucun outil IA
de rédaction automatique trouvé — **supposée** (lacune).
**Retour annuel :** portefeuilles multi-actifs arrivant en fin de vie de façon échelonnée sur 2030-2040+, chaque
actif suivant plusieurs années de levé/dossier/permis/retrait/suivi post-retrait — **supposée**.
**Vérifié/Supposé :** régime réglementaire et chiffres de coût vérifiés ; attribution BP précise et absence de
concurrent supposées.

### 5. Couche de « taux d'évitement » multi-fournisseurs pour collisions oiseaux/chauves-souris, agrégée par portefeuille
**Problème (source) :** l'étude ORJIP (Offshore Renewables Joint Industry Programme, programme collaboratif R&D
énergies marines UK) sur le parc de Thanet (Vattenfall) a analysé plus de 600 000 vidéos dont seulement 12 131
contenaient de l'activité aviaire (~2 %) — Skov et al. 2018, tethys.pnnl.gov, chiffre **vérifiée**.
**Acheteur nommé et dépense :** 11 développeurs offshore ont financé l'étude ORJIP aux côtés du Crown Estate et
Crown Estate Scotland (organismes gestionnaires du domaine maritime de la Couronne britannique, concédants du
foncier éolien) — **vérifiée** ; RWE utilise déjà Spoor (caméras + IA) sur Kaskasi — **vérifiée** (rwe.com,
09/2025).
**Produit (1 phrase) :** un service qui trie automatiquement les flux caméra/radar de n'importe quel fournisseur
pour ne garder que les événements pertinents et produit le taux d'évitement standardisé attendu pour le dossier
réglementaire, agrégé sur plusieurs sites/années.
**IA et pourquoi impossible avant 2024 :** modèles vidéo transformeurs pour le tri d'événements rares à échelle
continue 24/7 pluriannuelle — l'étude ORJIP originale (2014-2016) reposait sur une revue humaine/semi-automatique
à ce volume ; le tri entièrement automatisé au niveau espèce n'est financièrement viable que depuis les modèles
vidéo efficaces post-2024 — **supposée**.
**Données existantes :** archives caméra/radar déjà collectées comme condition de permis — **vérifiée**
(pratique documentée par Carbon Trust, « Review of seabird monitoring technologies »).
**Protocole/seuil existant :** méthodologie ORJIP Bird Collision Avoidance — **vérifiée**.
**Existant gratuit/payant :** Spoor (caméras + IA, détection/suivi) déjà déployé et validé par The Biodiversity
Consultancy — **vérifiée** ; agrégation multi-fournisseurs/multi-sites en taux d'évitement standardisé : aucun
outil trouvé — **supposée** (lacune).
**Retour annuel :** conditions de suivi post-consentement sur plusieurs années par projet + nouveaux projets
entrant continuellement en construction — **supposée** (durée typique, clause exacte non vérifiée).
**Vérifié/Supposé :** chiffre ORJIP, financeurs et déploiement Spoor/RWE vérifiés ; mécanisme d'agrégation exact
et durée de clause supposés. Chauves-souris et pêche/cohabitation non creusées spécifiquement — voir lacunes.

---

## (c) Références (URL, date)

1. https://jncc.gov.uk/resources/e1d38ce8-9bc6-4fb5-b867-f7f595caa25a — JNCC/Natural England/Cefas, position
   battage de pieux (consulté 09/2026).
2. https://tethys.pnnl.gov/publications/statutory-nature-conservation-agency-protocol-minimising-risk-injury-marine-mammals
   — protocole JNCC 2010.
3. https://crewbase.pro/blog/2026/07/mmo-pam-operator-career-path-offshore-wind-seismic-2026 — tarifs MMO/PAM,
   07/2026.
4. https://www.ziprecruiter.com/Jobs/Marine-Mammal-Observer — taux horaires MMO, consulté 02/2026.
5. https://www.rpsgroup.com/find-out-more-about-protected-species-observer-jobs/ — RPS Group, observateurs.
6. https://www.dnv.com/energy/standards-guidelines/dnv-rp-0416-corrosion-protection-for-wind-turbines/ —
   DNV-RP-0416.
7. https://www.bsee.gov/sites/bsee.gov/files/tap-technical-assessment-program/627aa.pdf — BSEE TA&R Project 627.
8. https://www.carbontrust.com/our-work-and-impact/guides-reports-and-tools/cable-burial-risk-assessment-cbra-guidance
   — guide CBRA, publié 2015.
9. https://indeximate.com/exposing-subsea-cable-risks-identifying-unburied-cables-using-distributed-acoustic-sensing/
   — Indeximate, DAS.
10. https://oilprice.com/Energy/Energy-General/The-High-Cost-Of-Decommissioning-Oil-Platforms-In-The-North-Sea.html
    — coûts de démantèlement, 12/09/2020, données Rystad Energy.
11. https://www.boem.gov/newsroom/decommissioning-and-rigs-reefs-pacific-region — BOEM, rigs-to-reefs Pacifique.
12. https://tethys.pnnl.gov/publications/orjip-bird-collision-avoidance-study — ORJIP BCA (Skov et al. 2018).
13. https://www.carbontrust.com/our-work-and-impact/guides-reports-and-tools/review-of-seabird-monitoring-technologies-for-offshore
    — revue technologies de suivi des oiseaux marins.
14. https://www.thebiodiversityconsultancy.com/projects/offshore-wind-bird-monitoring-validating-spoor-buoy-mounted-camera-technology/
    — validation Spoor.
15. https://www.rwe.com/en/press/rwe-offshore-wind-gmbh/2025-09-09-innovative-environmental-monitoring-launched-at-rwes-kaskasi-offshore-wind-farm/
    — projet SeaMe, Kaskasi, 09/09/2025.
16. https://www.renewableenergymagazine.com/panorama/ecodetect-making-waves-in-marine-renewables-sector-20250812
    — Ecodetect, 12/08/2025.
17. https://techpartnerships.noaa.gov/deep-sea-vision/ — DeepSeaVision/NOAA.
18. https://www.marineobserver.com/ — Marine Observer (Toyon).
19. https://www.tetratech.com/insights/leveraging-high-end-ai-software-to-detect-and-protect-marine-mammals-for-offshore-energy-projects/
    — Tetra Tech, Neptune AI.
20. https://www.ziprecruiter.com/Jobs/Offshore-Rov — salaires ROV offshore, 05/2026.
21. https://www.glassdoor.com/Job/data-analyst-offshore-wind-jobs-SRCH_KO0,26.htm — salaires data analyst.
22. https://www.emec.org.uk/facilities/sub-sea-cables/ — EMEC, câbles sous-marins.
23. https://supergen-ore.net/uploads/Andrew-Want-ECR-Forum-Jan-2022.pdf — biofouling énergies marines
    renouvelables, SUPERGEN ORE, 01/2022.
24. https://www.utilitydive.com/news/offshore-wind-new-york-developers-rebid-equinor-bp-orsted-eversource-rwe-national-grid/705852/
    — contexte acheteurs US, 2025.
25. https://www.deeptrekker.com/resources/offshore-operations — capacités d'inspection ROV.

## Lacunes

- **Champs électromagnétiques (CEM) des câbles** et **pêche/cohabitation** : thèmes du mandat non creusés par une
  recherche dédiée (budget de 10 WebSearch épuisé sur les 5 autres axes) — aucun candidat dédié proposé ; à
  reprendre en priorité si une 6e piste est demandée.
- **Chauves-souris** : peu de littérature offshore trouvée spécifiquement (contrairement aux oiseaux) — non
  traité séparément dans le candidat 5.
- **Aucun appel d'offres brut (tender) ni marché public consulté directement** : faute de résultat exploitable
  dans le temps imparti, les besoins sont déduits de communiqués, offres d'emploi, guides techniques et
  protocoles publics plutôt que de cahiers des charges. Recommandation : creuser Ted (Tenders Electronic Daily,
  UE) et SAM.gov (US) au prochain tour.
- **Valeurs de contrat totales** (vs. taux journaliers/salaires) quasi introuvables pour tous les candidats —
  les ordres de grandeur financiers restent des indications de coût unitaire, pas des budgets de programme.
- **Attribution acheteur par développeur individuel** (au-delà de RWE/Kaskasi et Vattenfall/Thanet, vérifiés)
  reste une extrapolation du régime réglementaire commun, pas une preuve contrat-par-contrat.
- Le repositionnement stratégique (candidats = couche de fusion/conformité plutôt que détection brute, déjà
  commoditisée par Ecodetect/DeepSeaVision/Marine Observer/Spoor/Neptune AI) est un jugement de l'agent, pas un
  fait vérifié par une source unique — à valider en phase terre-à-terre.
