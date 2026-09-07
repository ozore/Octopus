# Dossier — Industries payantes pour la surveillance/protection des fonds marins et leurs prestataires

Agent : `industry-benthic-surveys` — Étude « Fonds marins », passe 3. Rédigé le 7 septembre 2026.
Budget utilisé : 12/12 appels WebSearch, ~13 WebFetch. Toutes les dates de consultation web sont le **7 septembre 2026** sauf mention contraire.

---

## 0. Résumé exécutif

Six familles d'industries sont structurellement obligées de payer pour surveiller ou protéger les fonds marins :
éolien offshore (relevés benthiques avant/pendant/après construction, imposés par BOEM aux États-Unis et par MMO/Crown
Estate au Royaume-Uni), câbles et pipelines sous-marins (études d'impact et suivi post-pose), ports et dragage
(seuils de turbidité, protection des herbiers), mouillage de plaisance et de yachts (dommages d'ancre sur herbiers
et coraux), aquaculture en cages (surveillance benthique réglementaire obligatoire sous les fermes), et pêche de
fond (suivi VMS/AIS des zones interdites au chalutage). Le point commun à toutes ces obligations : l'étape la plus
coûteuse et la moins automatisée reste l'**annotation d'images/vidéo sous-marine** et la mise en forme des données
dans un format exigé par le régulateur — un goulot d'étranglement pour les bureaux d'études (Fugro, APEM, Ocean
Infinity, Hatfield, etc.) et pour les opérateurs eux-mêmes (fermes aquacoles, ports).

Fait majeur qui change la donne côté États-Unis : l'administration a suspendu l'attribution de nouveaux baux
éoliens offshore et BOEM a annoncé en juillet 2025 la résiliation de toutes les zones désignées pour l'éolien
offshore (« Wind Energy Areas »), d'après la page BOEM consultée le 7 septembre 2026
(https://www.boem.gov/renewable-energy/lease-and-grant-information). Le marché américain du relevé benthique lié à
l'éolien est donc en net ralentissement en 2025-2026, contrairement au Royaume-Uni et à l'Europe continentale où le
pipeline reste actif.

---

## (a) Tableau des obligations par industrie

| Industrie | Régulateur / texte | Obligation concrète | Fréquence / échéance | Sanction | Source (date de consultation) |
|---|---|---|---|---|---|
| Éolien offshore — US | BOEM, « Benthic Habitat Information Guidelines » (Atlantic OCS, révisées juin 2019) + COP Guidelines | Relevés d'habitats benthiques avant construction pour valider la géophysique ; ~2 ans de données pré-construction sur les 4 saisons recommandés ; suivi benthique en construction et post-construction (ex. Sunrise Wind, Revolution Wind) | Avant / pendant / après construction, sur toute la durée du permis (COP) | Blocage/retard d'autorisation (Construction and Operations Plan) | boem.gov/newsroom/boem-renewable-benthic-habitat-guidelines ; boem.gov/renewable-energy/survey-guidelines-renewable-energy-development (7/09/2026) |
| Éolien offshore — UK | Marine Management Organisation (MMO) + Crown Estate, « Standardisation of Post-Consent Environmental Monitoring for Wind Farms in English Waters » | Méthodologie standardisée de collecte/enregistrement/stockage des données de suivi post-consentement sur 6 récepteurs environnementaux dont l'habitat benthique ; conditions inscrites dans chaque Marine Licence (ex. Thanet OWF, conditions 3.1.8/3.1.9) | Publié le 16/07/2025, mis à jour le 09/03/2026 ; s'applique aux parcs sous juridiction MMO | Non-conformité à la Marine Licence = infraction (Marine and Coastal Access Act 2009) | gov.uk/government/publications/marine-licensing-standardisation-of-post-consent-environmental-monitoring-for-wind-farms-in-english-waters (7/09/2026) |
| Éolien offshore — France/Allemagne | Cadres nationaux (loi littoral, BSH en Allemagne) | Études d'impact environnemental avant attribution + suivi ; peu de détails publics trouvés dans le budget de recherche alloué | 2026-2030 : 2 parcs flottants 250 MW Méditerranée + 1,5 GW Normandie (FR) ; ~30 GW visés 2030 (DE) | Non documenté dans cette recherche | Orrick Global Offshore Wind Report 2026 (orrick.com, 7/09/2026) — **lacune** : pas de source réglementaire primaire FR/DE consultée (hors budget WebSearch) |
| Câbles sous-marins | NOAA/ONMS « Guidelines on Best Environmental Practice in Cable Route Planning » (2017) ; réglementations nationales de permis | Étude d'impact environnemental avant pose ; évitement des récifs/zones sensibles ; suivi post-installation de la récupération benthique parfois exigé comme condition de permis | Avant pose + suivi post-pose (durée variable selon permis) | Retrait/refus de permis de pose | noaa.gov/gc-international-section/submarine-cables-domestic-regulation ; sanctuaries.noaa.gov (7/09/2026) |
| Ports / dragage — US | USACE, Clean Water Act §404 + §401 (état), NOAA/NMFS (Essential Fish Habitat, ESA §7) | Permis USACE + consultation NMFS ; seuils de turbidité (couramment 9 NTU au-dessus du bruit de fond, resserrés à 5-10 NTU près des coraux/herbiers) ; mitigation UMAM (Uniform Mitigation Assessment Method) en Floride pour perte d'herbiers | Par projet de dragage (entretien ou creusement) | Arrêt de chantier, obligation de mitigation compensatoire | saj.usace.army.mil (formulaire turbidity monitoring) ; ecomagazine.com (Port Miami) (7/09/2026) |
| Ports / dragage — UE | Directive Habitats (Natura 2000), évaluation d'incidence | Évaluation d'incidence Natura 2000 avant tout dragage dans/à proximité d'un site protégé | Par projet | Recours juridique, blocage du projet | **Lacune** : pas de source primaire EU consultée dans le budget imparti (à compléter) |
| Mouillage plaisance/yachts | Réglementations locales (NOAA Florida Keys NMS, Monroe County FL, France/Italie Méditerranée) | Interdiction d'ancrage sur corail vivant ; bouées de mouillage gratuites comme alternative ; permis obligatoires par taille de bateau (Italie, Posidonie) ; interdiction de mouillage pour yachts >24 m dans zones protégées (France) | En continu ; loi Floride 2022 : 100 nouvelles bouées exigées avant limite de mouillage libre à 90 jours (Key West) | Amende, en Floride/France selon juridiction | floridakeys.noaa.gov/mbuoy/ ; monroecounty-fl.gov (Mooring Field One-Pager, jan. 2023) ; oceanindependence.com (7/09/2026) |
| Aquaculture — Canada (BC) | Aquaculture Activities Regulations (Pêches et Océans Canada, DFO) | Surveillance benthique obligatoire sous les cages à l'apogée du cycle de production : fonds meubles = sulfures libres (seuils 1300 µmol à 30 m, 700 µmol à 125 m) ; fonds durs = vidéo ROV notant la couverture de bactéries Beggiatoa/espèces opportunistes (seuil dépassé si >10 % de couverture sur >4 des 6 segments, zone 100-124 m) | ~40 à 50 fermes par an couvertes par le programme obligatoire ; rapports réguliers à DFO | Interdiction de remise en charge du site tant que la récupération n'est pas démontrée | dfo-mpo.gc.ca/about-notre-sujet/publications/infographics-infographies/benthic-benthique-eng.html (7/09/2026) |
| Aquaculture — Norvège | Norme NS 9410 + ASC Salmon Standard, alignées sur la Directive-cadre sur l'eau (UE) | Maintien du statut écologique benthique « Good » ou mieux hors de la zone d'impact local | Continu | Non documenté précisément dans le budget imparti | fishfarmingexpert.com (7/09/2026) |
| Aquaculture — Écosse | SEPA / consentements de fermes piscicoles (« Fish farm consents ») | Surveillance benthique conditionnant le consentement ; cadre distinct de la BC | Continu | Retrait de consentement | gov.scot/policies/aquaculture/fish-farm-consents (7/09/2026) — **lacune** : détails techniques non approfondis |
| Aquaculture — Chili | Concessions aquacoles (Subpesca) | Réforme 2026 en cours facilitant les « micro-relocalisations » (~100 sites éligibles) ; 1 398 concessions octroyées en 40 ans, 367 en évaluation | Réforme votée par le Parlement chilien en 2026 (loi de relocalisation) | Non documenté | undercurrentnews.com, fishfarmingexpert.com (7/09/2026) |
| Pêche de fond | Réglementations MPA nationales + suivi VMS obligatoire (bateaux >12-15 m selon juridiction) | Zones fermées au chalutage de fond ; suivi croisé VMS (gouvernemental) + AIS (public, via Global Fishing Watch) pour détecter les incursions | Continu ; incursions courtes/rapides échappent souvent à la détection VMS | Sanctions de pêche illégale (IUU) selon juridiction | globalfishingwatch.org ; marine-conservation.org (« Bottom-contact fishing persists in protected deep-sea habitats despite EU closures ») (7/09/2026) |

---

## (b) Fiches détaillées par industrie

### 1. Éolien offshore

**États-Unis (BOEM).** Le guide « Benthic Habitat Information Guidelines » (Atlantic OCS, révision juin 2019) encadre
la caractérisation des habitats benthiques dans le Construction and Operations Plan (COP). Les COP Guidelines de
BOEM recommandent une collecte de données benthiques pré-construction sur environ 2 ans couvrant les 4 saisons.
Exemples documentés : Revolution Wind (Appendix Y, Fisheries and Benthic Monitoring Plan) et Sunrise Wind
(Appendix H, Mitigation and Monitoring) — deux projets avec plans de suivi détaillés (source : tethys.pnnl.gov,
boem.gov, 7/09/2026). **Situation 2025-2026** : environ 29 baux commerciaux et de recherche actifs
(boem.gov/renewable-energy/lease-and-grant-information, consulté 7/09/2026), mais le Department of the Interior et
BOEM mettent en œuvre depuis un mémorandum présidentiel une suspension temporaire de l'attribution de nouveaux baux
éoliens offshore, et BOEM a annoncé en juillet 2025 la résiliation de toutes les zones désignées d'énergie éolienne
(« Wind Energy Areas »). Capacité vérifiée (source citée) : le ralentissement réglementaire US est réel et daté ;
en revanche, le nombre exact de projets encore actifs en construction (Vineyard Wind, Revolution Wind, etc.) n'a
pas pu être confirmé dans le budget de recherche — **hypothèse non sourcée** au-delà des deux projets cités.

**Royaume-Uni (MMO / Crown Estate).** Guide de standardisation du suivi post-consentement publié le 16 juillet
2025 par la MMO, mis à jour le 9 mars 2026 (document complet 44 pages + guide synthétique 17 pages,
gov.uk/government/publications/marine-licensing-standardisation-of-post-consent-environmental-monitoring-for-wind-farms-in-english-waters).
Il standardise la méthode (pas l'objet) de collecte pour 6 récepteurs environnementaux, dont l'habitat benthique.
Chaque parc a des conditions de Marine Licence spécifiques (exemple Thanet OWF, conditions 3.1.8/3.1.9). Capacité
du Royaume-Uni : 16,6 GW opérationnels + 11,7 GW en construction ; objectif 43 GW à 2030 ; prévision de 36,8 GW
pleinement commissionnés fin 2030 (Norton Rose Fulbright / Ember, consultés 7/09/2026 — dates de publication des
articles non précisées, à considérer comme des projections 2026).

**France.** Deux projets flottants de 250 MW chacun attribués en Méditerranée + un projet posé de 1,5 GW au large
de la Normandie, présenté comme le plus grand projet renouvelable du pays à ce jour (Orrick Global Offshore Wind
Report, édition février 2026, orrick.com). Cadre réglementaire précis (CRE, loi littoral) non approfondi — lacune.

**Allemagne.** Deux parcs de plus de 900 MW chacun mis en service récemment ; RWE et TotalEnergies ont déposé des
projets pour 4 GW supplémentaires ; le secteur a connu son premier « zero-bid auction », signe de tension sur les
coûts. Objectif national : au moins 30 GW à 2030, 40 GW à 2035 (Orrick 2026, source secondaire — cadre BSH non
vérifié directement).

**Coût d'un relevé benthique pour l'éolien offshore.** Selon guidetoanoffshorewindfarm.com (guide sectoriel,
consulté 7/09/2026) : **environ 1,2 million £ pour l'ensemble des études environnementales benthiques d'un parc de
1 GW**, combinant grab sampling, chalutage épibenthique (« epibenthic beam trawling ») et vidéo tractée (« Drop
Down Video », DDV), utilisés pour valider la géophysique et cartographier les habitats prévisionnels. Capacité
supposée (source non primaire, chiffre à traiter comme un ordre de grandeur, pas un tarif contractuel vérifié) —
marqué **« estimation »**.

### 2. Câbles sous-marins et pipelines

Les câbles de télécommunication et d'énergie (interconnexions, parcs éoliens) nécessitent une étude de faisabilité
d'ensouillage (« plowability assessment ») avant la pose, puis une étude d'impact environnemental identifiant les
zones à éviter (récifs, épaves, obstacles géologiques). Le tracé cherche à éviter les fonds accidentés et les
habitats sensibles. Le NOAA General Counsel a publié en 2017 des lignes directrices de bonnes pratiques
environnementales pour la planification des routes de câbles (« Guidelines on Best Environmental Practice in Cable
Route Planning », noaa.gov, PDF daté déc. 2017). Le suivi post-installation par ROV de la reprise des communautés
benthiques est mentionné comme pratique mais sans obligation réglementaire uniforme trouvée. **Lacune** : aucun
chiffre de coût de relevé de route de câble ou de surveillance d'ensouillage n'a pu être obtenu dans le budget
imparti — chiffre introuvable, pas d'estimation raisonnable disponible faute de comparables publics.

### 3. Ports et dragage

Aux États-Unis, la plupart des projets de dragage nécessitent un permis USACE (Clean Water Act §404) et une
autorisation d'état (§401), plus une consultation NOAA/NMFS au titre de l'Essential Fish Habitat et de l'Endangered
Species Act §7. Les seuils de turbidité typiques sont de 9 NTU au-dessus du bruit de fond, resserrés à 5-10 NTU à
proximité de coraux ou d'herbiers (formulaire de suivi de turbidité USACE Jacksonville, saj.usace.army.mil). Exemple
concret : le dragage du port de Miami a nécessité une mitigation d'herbiers à grande échelle évaluée via la méthode
UMAM (Uniform Mitigation Assessment Method) de Floride (ecomagazine.com, 7/09/2026). En Europe, l'obligation
correspondante passe par l'évaluation d'incidence Natura 2000 — **lacune** : pas de source primaire EU consultée
(hors budget de recherche alloué).

### 4. Mouillage de plaisance et de yachts

Le mouillage sur corail vivant est interdit dans le Florida Keys National Marine Sanctuary ; plus de 600 bouées de
mouillage gratuites (premier arrivé, premier servi) offrent une alternative, dont près de 300 dans la Kristin
Jacobs Coral Aquatic Preserve (floridakeys.noaa.gov/mbuoy, reefrelief.org, 7/09/2026). Une loi de Floride de 2022
impose au comté de Monroe d'installer 100 nouvelles bouées dans le mile autour de Key West Bight avant de pouvoir
appliquer la nouvelle limite de mouillage libre à 90 jours (monroecounty-fl.gov, jan. 2023). En Méditerranée, l'Italie
restreint le mouillage près des herbiers de posidonie selon la taille du bateau avec permis obligatoires dans de
nombreuses zones ; la France applique des règles parmi les plus strictes de Méditerranée avec interdiction de
mouillage pour les yachts de plus de 24 m dans les zones protégées (oceanindependence.com, 7/09/2026 — source
sectorielle, pas un texte réglementaire primaire, à vérifier). **Lacune** : aucune application (« app ») dédiée de
mouillage écologique n'a été identifiée nommément dans le budget de recherche imparti, malgré la mention explicite
du concept dans une bibliographie académique (researchgate.net, « Overview of eco-mooring facilities »).

### 5. Aquaculture

Voir tableau (a) pour le détail réglementaire par pays. Point clé pour le fondateur (Vancouver) : la
Colombie-Britannique est en transition réglementaire — les licences existantes de fermes en cages ouvertes ont été
renouvelées jusqu'en 2029, après quoi l'aquaculture en cages ouvertes sera interdite dans la province, d'après les
articles consultés (thenarwhal.ca ; Science Advances, sciadv.adt4568, 7/09/2026 — **capacité supposée**, à
confirmer via le texte réglementaire final de Pêches et Océans Canada). Cette transition crée une fenêtre de
demande spécifique : suivi de la **récupération** benthique des sites démantelés entre 2026 et 2029+, en plus du
suivi courant des sites encore actifs (40 à 50 fermes/an). Actuellement 80 à 90 % des sites BC restent sous les
seuils réglementaires de sulfures/couverture bactérienne (dfo-mpo.gc.ca, 7/09/2026).

### 6. Pêche de fond

Le suivi croisé VMS (Vessel Monitoring System, obligatoire pour certaines flottes selon juridiction) et AIS
(Automatic Identification System, public) est la méthode standard de détection du chalutage de fond dans les zones
interdites. Trois acteurs structurent ce marché : **Global Fishing Watch** (plateforme non lucrative combinant AIS
public et données VMS gouvernementales, accès public), **OceanMind** (service de surveillance par satellite pour
zones marines protégées, positionné comme solution « rentable, rapide et réactive » pour les MPA), et **Skylight**
(programme satellite de détection de navires de pêche, associé à des partenariats gouvernementaux type NOAA). Un
article de Marine Conservation Institute (marine-conservation.org, titre : « Bottom-contact fishing persists in
protected deep-sea habitats despite EU closures ») documente la persistance du chalutage de fond dans des zones
fermées de l'UE malgré les fermetures — le contenu détaillé (chiffres précis) n'a pas pu être récupéré via WebFetch
(page vide au moment de la consultation, 7/09/2026) : **lacune**, à revisiter par une recherche directe. Limite
documentée : les incursions courtes et rapides échappent souvent à la détection VMS (nationalfisherman.com,
7/09/2026).

### 7. Tourisme de croisière et hôtels de récif

**Lacune majeure** : le budget de recherche alloué (12 WebSearch) a été concentré sur les cinq industries
prioritaires ci-dessus ; aucune recherche dédiée au tourisme de croisière et aux hôtels de récif n'a pu être menée.
Aucun fait chiffré sourcé sur ce segment n'est présenté ici — à traiter en priorité si une itération supplémentaire
est possible.

---

## (c) Populations captives (combien d'acteurs concernés)

| Population | Nombre | Source / statut |
|---|---|---|
| Baux éoliens offshore actifs (commerciaux + recherche), États-Unis | ~29 | boem.gov/renewable-energy/lease-and-grant-information (7/09/2026) — **mais** nouvelles attributions suspendues et zones désignées résiliées depuis juillet 2025 |
| Capacité éolienne offshore opérationnelle, Royaume-Uni | 16,6 GW opérationnels + 11,7 GW en construction | Norton Rose Fulbright / Ember (consultés 7/09/2026) |
| Projets éoliens offshore récemment attribués, France | 3 (2×250 MW flottant Méditerranée + 1,5 GW Normandie) | Orrick Global Offshore Wind Report 2026 |
| Nouveaux projets éoliens offshore proposés, Allemagne | 2 parcs opérationnels (900+ MW chacun) + 4 GW en projet (RWE/TotalEnergies) | Orrick 2026 |
| Fermes aquacoles marines couvertes par le programme benthique obligatoire, Colombie-Britannique | ~40 à 50 fermes/an | dfo-mpo.gc.ca (7/09/2026) |
| Concessions aquacoles octroyées, Chili (cumul 40 ans) | 1 398 (+ 367 en évaluation) | seafoodsource.com / undercurrentnews.com (7/09/2026) |
| Sites éligibles à la micro-relocalisation, Chili | ~100 | fishfarmingexpert.com (7/09/2026) |
| Fermes salmonicoles, Écosse | >200 (chiffre daté, source ancienne — **estimation**, à rafraîchir) | source secondaire non datée précisément |
| Bouées de mouillage gratuites, Florida Keys NMS | >600 (dont ~300 dans Kristin Jacobs Coral Aquatic Preserve) | floridakeys.noaa.gov, reefrelief.org (7/09/2026) |
| Entreprises salmonicoles, Norvège | 215 entreprises (172 axées saumon/truite) | fishfarmingexpert.com (7/09/2026) |

**Lacune généralisée** : le nombre exact de ports pratiquant un dragage annuel soumis à obligation de surveillance
(USACE + UE), le nombre de câbles sous-marins posés/an nécessitant un relevé environnemental, et le nombre de
navires de croisière/yachts concernés par des règles de mouillage n'ont pas pu être quantifiés dans le budget de
recherche imparti.

---

## (d) Prestataires, méthodes et logiciels d'annotation

### Bureaux d'études (capacité vérifiée : sources citées ; tarifs publics rarement communiqués)

| Prestataire | Méthodes citées | Secteurs clients | Source |
|---|---|---|---|
| Fugro | Sites environnementaux, geophysique, sondages | Énergie (éolien, O&G), assainissement | fugro.com/expertise/environmental-site-assessments (7/09/2026) |
| Ocean Infinity | Seabed mapping (géophysique), hydrographie, AUV HUGIN, USV NeedleFish | Énergie (renouvelable + O&G), télécoms (câbles sous-marins), secteur public/science | oceaninfinity.com/services (7/09/2026) |
| APEM (Apem Group) | Relevés marins de terrain, grab sampling, chalutage épibenthique, drop-down video (DDV), analyse d'échantillons marins/estuariens | Éolien offshore, ports | apemltd.com (7/09/2026) |
| ABPmer, Gardline, Natural Power, Ocean Ecology | Cités comme principaux fournisseurs de relevés benthiques marins renouvelables (Royaume-Uni) | Éolien offshore | guidetoanoffshorewindfarm.com (7/09/2026) |
| Hatfield, Golder/WSP, Stantec, Ecology and Environment, Wood, Envision | Cités dans le brief comme bureaux d'études actifs sur le benthique — **non vérifiés individuellement** dans cette recherche (hors budget) | Divers | **lacune** |

Méthodes de terrain confirmées à travers les sources : vidéo tractée/drop-down video (DDV), ROV, grab sampling
(prélèvement de sédiments), chalutage épibenthique, relevés multifaisceaux (géophysique, mentionné pour la
validation d'habitat), photogrammétrie et eDNA cités dans le brief mais **non retrouvés avec un exemple de
prestataire précis** dans le budget de recherche (lacune).

### Logiciels d'annotation vidéo/image

| Logiciel | Éditeur | Modèle | Prix | Capacité |
|---|---|---|---|---|
| BIIGLE 2.0 | Consortium académique allemand (biigle.de) | Service web, communauté >1000 utilisateurs, généralement hébergé par des infrastructures de recherche financées publiquement | **Prix non trouvé** — page /pricing inexistante (404 constaté le 7/09/2026) ; probablement gratuit pour la recherche via instances institutionnelles | Capacité vérifiée (frontiersin.org, description BIIGLE 2.0, source académique) : annotation d'images et de vidéos à grande échelle |
| VIAME | Kitware / NOAA | Open source, gratuit pour les utilisateurs NOAA | Gratuit (source : actiac.org, viametoolkit.org, 7/09/2026) | Capacité vérifiée : détection d'objets, suivi, annotation, recherche, mosaïquage, mesure stéréo |
| SeaGIS EventMeasure | SeaGIS (Australie) | Licence logicielle commerciale (starter/stereo) | **Prix non trouvé** — page tarifs (« SeaGIS Prices.pdf ») inaccessible en 404 lors de deux tentatives (7/09/2026) | Capacité vérifiée (seagis.com.au) : mesure stéréo-vidéo, calibrations 3D, workflow établi pour relevés BRUV/DOV |
| TransectMeasure | SeaGIS | Idem EventMeasure (suite logicielle) | **Prix non trouvé** | Cité dans le brief, non vérifié indépendamment |
| Coda Octopus | Coda Octopus Products | Logiciel de sonar 3D temps réel | **Prix non trouvé** | Cité dans le brief, non vérifié dans cette recherche (hors budget) |
| Squidle+ | Australian Institute of Marine Science / plateforme académique | Plateforme d'annotation collaborative | **Non vérifié** dans cette recherche | — |

**Constat central pour les opportunités produit** : aucun des logiciels d'annotation identifiés (BIIGLE, VIAME,
EventMeasure) ne publie de tarification commerciale claire et destinée à des PME/consultants indépendants — le
marché reste soit académique/gratuit (BIIGLE, VIAME), soit vendu sur devis fermé (SeaGIS). C'est cohérent avec la
douleur mentionnée dans le brief : annotation manuelle, délais, manque de comparabilité entre prestataires, et
rapports réglementaires qui doivent être reformatés à la main pour chaque régulateur (BOEM, MMO, DFO...).

---

## (e) Opportunités produit

### Opportunité 1 — « SedimentIQ » : automatisation de la conformité benthique aquacole (BC / Écosse / Norvège / Chili)

- **Cible précise** : exploitants de fermes salmonicoles en cage soumis à surveillance benthique obligatoire.
  Colombie-Britannique : ~40 à 50 fermes/an (source dfo-mpo.gc.ca, 7/09/2026) réparties entre quelques groupes
  (Mowi, Grieg Seafood, Cermaq) — clientèle concentrée mais aussi vendable aux bureaux d'études qui réalisent le
  travail de terrain pour ces groupes. Extension crédible : Écosse (>200 fermes, chiffre à rafraîchir), Chili
  (1 398 concessions cumulées).
- **Problème/obligation** : le protocole DFO impose une notation manuelle de la couverture de bactéries Beggiatoa
  et d'espèces opportunistes sur vidéo ROV (seuil : >10 % de couverture sur plus de 4 des 6 segments, zone
  100-124 m) et une analyse de sulfures libres sur fonds meubles (seuils 1300 µmol/700 µmol). Le travail
  d'annotation vidéo est actuellement manuel, chronophage, et la comparabilité inter-opérateurs est faible.
- **Ce que fait le produit** : logiciel de vision par ordinateur entraîné pour détecter et quantifier automatiquement
  la couverture de tapis bactériens/organismes opportunistes sur vidéo ROV (caméra du commerce, type GoPro
  étanche/caméra ROV existante côté client — pas de matériel sur mesure), avec génération automatique du rapport
  DFO (ou SEPA en Écosse) au format attendu, plus une base de données longitudinale par site pour suivre la
  trajectoire de récupération après démantèlement (pertinent pour la transition BC 2026-2029).
- **Prix et modèle** : SaaS par site/an, 300-800 $ CAD/mois par ferme selon volume de vidéo, ou par rapport
  livré (500-1500 $ CAD/rapport) pour les bureaux d'études qui sous-traitent l'annotation.
- **Effort technologique** : modèle de segmentation d'image (fine-tuning sur jeu d'images Beggiatoa/substrat),
  pipeline de génération de rapport réglementaire, base de données de suivi par site — moat réaliste avec un
  historique de données propriétaire par ferme.
- **Concurrents** : aucun logiciel dédié identifié ; les bureaux d'études (Hatfield Consultants, cité dans le brief
  comme actif au Canada) font actuellement ce travail manuellement — concurrence indirecte, pas de produit
  logiciel concurrent trouvé (capacité supposée d'absence de concurrent direct, faute de recherche exhaustive).
- **Pourquoi maintenant (daté)** : les licences BC de cages ouvertes sont renouvelées jusqu'en 2029 puis interdites
  (source secondaire, 7/09/2026 — à confirmer), ce qui crée une vague de démantèlement et de suivi de récupération
  benthique sur 2026-2029+ en plus du suivi courant.
- **Premier client atteignable depuis Vancouver** : DFO Pacifique et les fermes salmonicoles de la Sunshine Coast/
  côte de la Colombie-Britannique sont directement accessibles depuis Vancouver ; le fondateur peut aussi approcher
  les bureaux d'études régionaux qui sous-traitent l'annotation pour ces fermes.

### Opportunité 2 — « ReefLine » : détection et prévention des dommages d'ancre par IA + réseau de mouillage

- **Cible précise** : autorités de parcs marins et marinas dans des zones à herbiers/coraux fréquentées par la
  plaisance — Gulf Islands National Park Reserve et Salish Sea (Colombie-Britannique/Washington), Florida Keys
  NMS (>600 bouées existantes), zones Natura 2000/Posidonie en Méditerranée. Potentiel : dizaines de parcs marins
  et marinas en Amérique du Nord, plus les organismes de gestion méditerranéens.
- **Problème/obligation** : l'ancrage sur substrat vivant reste la cause de dommages documentée dans les trois
  zones (interdiction en vigueur en Floride ; permis par taille de bateau en Italie ; interdiction >24 m en France)
  mais la détection des infractions et le suivi de la récupération des cicatrices d'ancre restent manuels et rares.
- **Ce que fait le produit** : application mobile pour plaisanciers (cartographie des zones sensibles + géolocalisation
  des bouées disponibles, alimentée par AIS/GPS bon marché) couplée à un pipeline de vision par ordinateur qui
  analyse des images 360°/drone soumises par les gestionnaires de parcs ou capturées via plongée pour détecter et
  mesurer automatiquement les cicatrices d'ancre dans les herbiers/coraux au fil du temps (changement détecté
  entre relevés successifs).
- **Prix et modèle** : gratuit pour les plaisanciers (financement par les gestionnaires de zones) ; abonnement
  SaaS 200-600 $/mois pour les autorités de parcs/marinas pour le module de détection de cicatrices et le tableau
  de bord de conformité.
- **Effort technologique** : modèle de détection de changement sur imagerie répétée (moat : base de données
  d'images annotées de cicatrices d'ancre par type de substrat), intégration cartographique AIS/GPS — matériel
  100 % du commerce (caméra 360, drone grand public).
- **Concurrents** : bibliographie académique mentionne le concept d'« eco-mooring facilities » mais aucune
  application commerciale nommée n'a été identifiée dans le budget de recherche — lacune qui peut aussi signaler
  un espace libre.
- **Pourquoi maintenant (daté)** : loi de Floride de 2022 imposant 100 nouvelles bouées à Key West avant la limite
  de mouillage à 90 jours (source : monroecounty-fl.gov, janvier 2023) — application encore en cours de mise en
  œuvre en 2026 ; tensions croissantes en Méditerranée sur les permis de mouillage par taille de bateau.
- **Premier client atteignable depuis Vancouver** : Parcs Canada (Gulf Islands National Park Reserve, à proximité
  immédiate de Vancouver et des clubs de plongée du fondateur) est un client pilote crédible et local.

### Opportunité 3 — « BenthicPipe » : pipeline d'annotation IA standardisé pour bureaux d'études (éolien offshore, câbles)

- **Cible précise** : bureaux d'études qui réalisent des relevés benthiques pour l'éolien offshore et les câbles
  sous-marins (Fugro, APEM, Ocean Infinity, ABPmer, Gardline, Natural Power, Ocean Ecology, et équivalents
  nord-américains type Hatfield). Marché UK seul : 11,7 GW de projets en construction nécessitant un suivi
  post-consentement standardisé sur 6 récepteurs environnementaux.
- **Problème/obligation** : la nouvelle norme MMO de juillet 2025 (mise à jour mars 2026) standardise la
  méthodologie de collecte et de stockage des données de suivi — mais ne fournit pas d'outil logiciel pour
  l'appliquer ; l'annotation de vidéo tractée (DDV) et de grab samples reste manuelle chez la plupart des
  bureaux d'études, source de délais et de non-comparabilité inter-projets soulignée dans le brief.
- **Ce que fait le produit** : plateforme SaaS d'annotation semi-automatique de vidéo DDV/ROV (détection
  d'espèces indicatrices, classification de substrat) exportant directement dans le format standardisé exigé
  par la MMO (et adaptable au format BOEM), avec module de comparaison inter-relevés (avant/pendant/après) pour
  objectiver la récupération post-construction.
- **Prix et modèle** : facturation au volume de vidéo traité (ex. 2-5 $/minute de vidéo annotée) ou licence
  SaaS par projet (2 000-8 000 $ par relevé complet), vendu directement aux bureaux d'études ou en marque
  blanche.
- **Effort technologique** : modèles de classification d'espèces/substrat entraînés sur des jeux de données DDV
  publics et propriétaires, module d'export réglementaire structuré — moat par l'accumulation de jeux
  d'entraînement propres aux méthodologies BOEM/MMO.
- **Concurrents** : BIIGLE (gratuit, académique, pas orienté conformité réglementaire commerciale) et VIAME
  (gratuit, boîte à outils générique, pas de module d'export réglementaire) sont les plus proches, mais aucun
  n'est positionné spécifiquement sur la conformité éolien offshore — espace différencié.
- **Pourquoi maintenant (daté)** : norme MMO publiée le 16/07/2025 et mise à jour le 09/03/2026, avec 11,7 GW de
  projets britanniques en construction qui devront s'y conformer sur la durée de vie du parc.
- **Premier client atteignable depuis Vancouver** : à distance — bureaux d'études basés au Royaume-Uni/Europe
  sont les cibles naturelles ; à défaut, Hatfield Consultants (Canada) ou un bureau d'études côte Ouest
  travaillant sur les extensions éoliennes offshore nord-américaines (si le marché US redémarre) est un point
  d'entrée nord-américain crédible.

### Opportunité 4 — « TrawlWatch Local » : conformité chalutage de fond pour petites zones protégées

- **Cible précise** : gestionnaires de petites zones marines protégées et de zones de fermeture provinciales/
  d'État qui n'ont pas le budget pour des contrats entreprise avec OceanMind ou Skylight — parcs marins
  provinciaux de Colombie-Britannique, zones de conservation du sébaste (Rockfish Conservation Areas, proches de
  Steveston), petites juridictions côtières.
- **Problème/obligation** : le suivi croisé VMS/AIS existe (Global Fishing Watch, gratuit) mais nécessite une
  expertise pour transformer les données brutes en alertes exploitables pour un petit gestionnaire local ; les
  incursions courtes échappent souvent à la détection VMS classique (source : nationalfisherman.com, 7/09/2026).
- **Ce que fait le produit** : tableau de bord léger construit sur l'API publique de Global Fishing Watch,
  ajoutant des alertes automatiques ciblées sur les polygones de zones fermées locales (recoupement AIS +
  vitesse/trajectoire typique du chalutage) et un historique exportable pour les rapports de conformité annuels
  du gestionnaire.
- **Prix et modèle** : abonnement 150-500 $ CAD/mois par zone protégée surveillée, modèle multi-zones pour les
  agences provinciales.
- **Effort technologique** : couche applicative sur données publiques existantes (pas de matériel), modèle de
  détection de comportement de chalutage à partir de trajectoires AIS — effort modéré mais barrière réelle
  dans la personnalisation réglementaire locale et l'ergonomie pour petits gestionnaires.
- **Concurrents** : Global Fishing Watch (gratuit mais généraliste, pas d'alerte locale personnalisée),
  OceanMind/Skylight (positionnés entreprise/gouvernemental, pas sur le segment petites juridictions).
- **Pourquoi maintenant (daté)** : pas d'échéance réglementaire précise identifiée dans le budget de recherche —
  opportunité portée par la disponibilité croissante des données AIS ouvertes plutôt que par une échéance légale
  datée ; **à noter comme point faible du dossier de cette idée**.
- **Premier client atteignable depuis Vancouver** : Pêches et Océans Canada / zones de conservation du sébaste du
  Pacifique, ou une association de gestion de parc marin provincial de C.-B., accessibles localement.

### Opportunité 5 — « DredgeGuard » : conformité turbidité/herbiers en temps réel pour ports et dragage

- **Cible précise** : autorités portuaires et entrepreneurs de dragage soumis à des seuils de turbidité près des
  herbiers/coraux (USACE, seuils 5-10 NTU near-coral) — le Port de Vancouver (Fraser Port Authority) est un
  client de proximité immédiate pour le fondateur.
- **Problème/obligation** : le respect des seuils de turbidité (couramment 9 NTU au-dessus du bruit de fond,
  resserré près des habitats sensibles) est actuellement suivi via des formulaires de monitoring papier/manuels
  (ex. formulaire USACE Jacksonville) sans alerte en temps réel ni traçabilité automatisée pour l'administration.
- **Ce que fait le produit** : capteurs de turbidité du commerce déployés en réseau (bouées low-cost) + couche
  logicielle combinant lecture temps réel, imagerie satellite pour la détection de panaches de sédiments, et
  alerte automatique de dépassement de seuil avec journal exportable pour le rapport réglementaire USACE/état.
- **Prix et modèle** : abonnement SaaS + capteurs loués, 500-1500 $ CAD/mois par chantier de dragage actif.
- **Effort technologique** : intégration capteurs IoT du commerce + modèle de fusion satellite/in-situ pour la
  détection de panache, tableau de bord de conformité — effort modéré, moat par la base de données de panaches
  vs. seuils par site au fil du temps.
- **Concurrents** : Sofar Ocean (« Marine Sensing Use Case Library » cite le suivi de turbidité pour la
  planification de dragage, sofarocean.com) — concurrent potentiel direct à vérifier plus en détail (capacité
  supposée, pas de tarif trouvé).
- **Pourquoi maintenant (daté)** : pas d'échéance datée précise identifiée dans le budget alloué — porté par la
  récurrence des campagnes de dragage d'entretien plutôt que par une nouvelle règle ; point faible à documenter
  davantage si itération future.
- **Premier client atteignable depuis Vancouver** : Vancouver Fraser Port Authority (port industriel mentionné
  comme accessible au fondateur dans le brief) est un client pilote local direct.

---

## (f) Références et lacunes

### Sources principales citées (URL, date de consultation 7/09/2026 sauf mention contraire)

- BOEM — https://www.boem.gov/newsroom/boem-renewable-benthic-habitat-guidelines
- BOEM — https://www.boem.gov/renewable-energy/survey-guidelines-renewable-energy-development
- BOEM — https://www.boem.gov/renewable-energy/lease-and-grant-information
- GOV.UK/MMO — https://www.gov.uk/government/publications/marine-licensing-standardisation-of-post-consent-environmental-monitoring-for-wind-farms-in-english-waters (publié 16/07/2025, màj 09/03/2026)
- Orrick — https://www.orrick.com/en/Insights/2026/02/Orricks-Global-Offshore-Wind-Report-2026-Edition
- Guide to an Offshore Wind Farm — https://guidetoanoffshorewindfarm.com/guide/p-development-and-project-management/p-2-environmental-surveys/p-2-1-benthic-environmental-surveys/
- NOAA — https://www.noaa.gov/gc-international-section/submarine-cables-domestic-regulation
- USACE (formulaire turbidité) — https://www.saj.usace.army.mil/Portals/44/docs/Engineering/ConstructionForms/turbmon.pdf
- ECO Magazine (Port Miami/UMAM) — https://ecomagazine.com/in-depth/large-scale-seagrass-mitigation-for-miami-harbor-dredging/
- Florida Keys NMS (bouées de mouillage) — https://floridakeys.noaa.gov/mbuoy/
- Monroe County FL — https://www.monroecounty-fl.gov/DocumentCenter/View/34391/Mooring-Field-One-Pager-Final-Jan-2023
- Ocean Independence (mouillage Méditerranée) — https://www.oceanindependence.com/articles/seagrass-and-anchoring-restrictions/
- DFO/Pêches et Océans Canada (surveillance benthique aquacole BC) — https://www.dfo-mpo.gc.ca/about-notre-sujet/publications/infographics-infographies/benthic-benthique-eng.html
- The Narwhal / Science Advances (transition BC cages ouvertes) — https://thenarwhal.ca/bc-salmon-farming-future/ ; https://www.science.org/doi/10.1126/sciadv.adt4568
- SeafoodSource / Undercurrent News / Fish Farming Expert (Chili, Norvège) — seafoodsource.com, undercurrentnews.com, fishfarmingexpert.com
- Global Fishing Watch — https://globalfishingwatch.org/our-technology/
- Marine Conservation Institute — https://marine-conservation.org/on-the-tide/tracking-bottom-fishing-in-eu-waters/ (contenu non récupérable en détail, page vide au fetch)
- National Fisherman — https://www.nationalfisherman.com/how-satellites-and-ai-track-illegal-fishing-in-protected-oceans
- Ocean Infinity — https://oceaninfinity.com/services/
- APEM — https://www.apemltd.com/service/marine-field-surveys/
- BIIGLE — https://biigle.de/ (page pricing en 404)
- VIAME — https://www.viametoolkit.org/
- SeaGIS EventMeasure — https://www.seagis.com.au/event.html (page de prix PDF inaccessible, 404 confirmé deux fois)

### Lacunes explicites à traiter en priorité si itération supplémentaire

1. **Tourisme de croisière et hôtels de récif** : aucune recherche dédiée effectuée (budget épuisé) — section (b)7 vide.
2. **Cadre réglementaire précis France/Allemagne pour l'éolien offshore** (organismes équivalents à BOEM/MMO,
   obligations de relevé benthique spécifiques) — non vérifié à la source primaire.
3. **Natura 2000 et dragage** : pas de source EU primaire consultée (URL environment.ec.europa.eu non atteinte
   dans le budget imparti).
4. **Coût d'un relevé de route de câble sous-marin et d'un suivi d'ensouillage** : chiffre introuvable dans le
   budget de recherche ; aucune fourchette raisonnable disponible faute de comparables publics identifiés — pas
   d'estimation proposée (préférable à un chiffre inventé).
5. **Tarifs exacts des logiciels d'annotation commerciaux** (SeaGIS EventMeasure/TransectMeasure, Coda Octopus) :
   deux tentatives de récupération de page de tarifs ont échoué (404) — conforme à la procédure de blocage du
   brief (changement de formulation tenté, puis passage à note de lacune).
6. **Nombre exact de fermes salmonicoles actives en Écosse et en Norvège en 2026** : chiffres trouvés sont soit
   datés soit approximatifs — marqués « estimation ».
7. **Détail des VMS obligatoires par juridiction (taille de navire seuil)** : non approfondi.

---

## Bilan des opportunités (rappel court)

Cinq opportunités produites, toutes distinctes des 24 idées exclues et centrées sur le service payant aux
industries obligées de surveiller les fonds marins plutôt que sur le plastique marin :
1. SedimentIQ (conformité benthique aquacole automatisée, BC en priorité)
2. ReefLine (détection de dommages d'ancre + réseau de mouillage, Gulf Islands en priorité)
3. BenthicPipe (pipeline d'annotation IA pour bureaux d'études éolien offshore/câbles, UK en priorité)
4. TrawlWatch Local (conformité chalutage pour petites MPA, Pacifique canadien)
5. DredgeGuard (conformité turbidité temps réel pour ports/dragage, Port de Vancouver en priorité)
