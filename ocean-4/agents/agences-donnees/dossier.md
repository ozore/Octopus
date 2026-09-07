# Dossier — Agences et données marines sous-exploitées
Agent : agences-donnees — Passe 4 (idéation) — 7 septembre 2026

Méthode : 10 appels WebSearch utilisés (quota maximal atteint), WebFetch libre utilisé en complément
(≈20 appels) pour vérifier les pages trouvées et économiser le quota de recherche. Chaque affirmation
est étiquetée **(vérifiée, source)** ou **(supposée)** ; les fourchettes non trouvées sont marquées
« estimation ». Acronymes définis à la première mention.

---

## (a) Population et inventaire des données

### Qui paie déjà, ou perd déjà, et combien (synthèse)
- **Pêcheurs commerciaux canadiens** paient eux-mêmes le programme d'observateurs en mer depuis que
  Pêches et Océans Canada (POC ; en anglais *Fisheries and Oceans Canada*, DFO) ne partage plus les
  coûts (1er avril 2013) : « tens of thousands of dollars each season » par pêcheur (vérifiée,
  Ecotrust Canada). Un système de surveillance électronique (EM, *Electronic Monitoring*) coûte
  10 000–20 000 $ hors installation (vérifiée, rapports NOAA/EDF cités dans les résultats de recherche).
- **NOAA** (*National Oceanic and Atmospheric Administration*, agence fédérale américaine océan/pêches)
  exploite 14 programmes EM actifs aux États-Unis (Alaska, Nord-Est, Côte Ouest, îles du Pacifique) dont
  le plus gros poste de coût est la révision vidéo manuelle, la transmission et le stockage (vérifiée,
  fisheries.noaa.gov).
- **Développeurs éoliens offshore et leurs bureaux d'études** doivent financer des suivis benthiques
  pluriannuels (construction + années 1/3/5 post-construction) ; JNCC (*Joint Nature Conservation
  Committee*, organisme consultatif du gouvernement britannique) a dû modéliser sa carte nationale des
  habitats (UKSeaMap 2018) faute de données de terrain suffisantes malgré ~50 campagnes 2003-2019
  (vérifiée, jncc.gov.uk).
- **Armateurs et pilotes maritimes** de la mer des Salish participent déjà (>80 organisations) aux
  ralentissements volontaires du programme ECHO (*Enhancing Cetacean Habitat and Observation*, piloté
  par l'Administration portuaire Vancouver-Fraser) et de son équivalent américain Quiet Sound, qui
  publient un rapport de conformité saisonnier (vérifiée, sustainableworldports.org ; quietsound.org).
- **Ampleur amont non chiffrée précisément mais documentée comme majeure** : la pêche INN (illégale, non
  déclarée et non réglementée) représenterait plus de 20 % des captures mondiales, dont ~75 % des
  navires détectés par radar satellite dans une étude n'étaient pas suivis par AIS (*Automatic
  Identification System*, système d'identification automatique des navires) (vérifiée, Global Fishing
  Watch, résultats de recherche).
- **Estimation de population d'acheteurs aval** (fourchette « estimation », non trouvée précisément) :
  milliers d'exploitants de pêche commerciale soumis à observateurs en Amérique du Nord ; dizaines de
  projets éoliens offshore actifs en Europe/UK ; ~25-30 États côtiers utilisateurs d'EMSA CleanSeaNet ;
  une douzaine de grands assureurs/P&I Clubs (*Protection and Indemnity Clubs*, mutuelles d'assurance
  maritime) mondiaux.

### Inventaire par agence/institution

1. **NOAA** — 14 programmes EM actifs (vérifiée). Reconnaît le potentiel de la vision par ordinateur
   mais le décrit comme encore « en développement » sur ses pages officielles (vérifiée). Outil ouvert :
   **VIAME** (*Video and Image Analytics for Marine Environments*), développé avec Kitware sous
   l'initiative NOAA AIASI (*Automated Image Analysis Strategic Initiative*), gratuit et open source,
   Gold Medal Award du département du Commerce US en 2019 (vérifiée, viametoolkit.org). Concurrent privé
   existant : **AI.Fish / FisheriesAI**, contrat SBIR (*Small Business Innovation Research*, subvention
   fédérale américaine de R&D pour PME) avec NOAA de sept. 2022 à fév. 2023 pour classer thon et prises
   accessoires (vérifiée, ai.fish). YOLOv11 (famille de modèles de détection d'objets) utilisé pour
   évaluer des dispositifs d'exclusion du saumon dans la pêcherie de goberge (vérifiée, fisheries.noaa.gov).
2. **POC/DFO** — Programme d'observateurs qualifié de « broken » (en panne) par des défenseurs, pénurie
   de main-d'œuvre depuis la COVID (vérifiée, CBC News, page bloquée en accès direct — titre/résumé issus
   des résultats de recherche). Programme pilote d'urgence EM lancé en avril 2020 dans le chalut de fond
   du Pacifique (vérifiée). Alternative communautaire : Ecotrust Canada opère des programmes de suivi
   avec Premières Nations en Colombie-Britannique (saumon, crabe, poisson de fond, flétan) (vérifiée,
   ecotrust.ca).
3. **Ocean Networks Canada (ONC)** — observatoire océanique câblé basé à l'Université de Victoria
   (Colombie-Britannique), opère les réseaux câblés NEPTUNE et VENUS (hydrophones, caméras) ; portail
   ouvert **Oceans 3.0** revendique >70 000 utilisateurs (vérifiée, oceannetworks.ca). Postes « Data
   Steward » activement publiés (ex. annonce clôturant le 11 mai 2026 sur Schmidt Marine Job Board),
   confirmant le métier cité dans le mandat (vérifiée). La station d'écoute sous-marine (ULS,
   *Underwater Listening Station*) de Boundary Pass, opérée par Transports Canada, sert au suivi du bruit
   ambiant pour le programme ECHO (vérifiée). Lien direct entre l'archive ONC et une revue IA
   systématique par espèce : non confirmé (supposée).
4. **MBARI** (*Monterey Bay Aquarium Research Institute*, institut de recherche océanographique privé
   californien) — **FathomNet** : base d'images sous-marines annotées ; la plateforme participative
   FathomVerse a fourni 99 124 images étiquetées, soit 47 % d'un corpus total estimé à ~211 000 images
   (vérifiée, fathomnet.org). Meta a généré, via son modèle Segment Anything Model 3, 280 118 masques de
   segmentation d'entraînement et 14 247 de test (vérifiée). Modèles publiés en accès libre sur
   HuggingFace (plateforme de partage de modèles d'IA) (vérifiée). Licence exacte des images sources :
   non confirmée — le dépôt logiciel `fathomnet-py` est en licence MIT mais cela ne couvre que le code
   (supposée pour les images : usage recherche/IA largement permissif vu son usage en compétitions
   publiques CVPR/FGVC, conférences de référence en vision par ordinateur).
5. **Ifremer** (Institut français de recherche pour l'exploitation de la mer, agence publique française)
   — catalogue **SISMER** (Système d'Information Scientifique pour la MER) des campagnes à la mer :
   plus de 10 200 campagnes référencées, ~200 nouvelles par an, la plus ancienne datant de 1909
   (vérifiée, data.ifremer.fr) ; chaque fiche compile descriptifs, données archivées, bibliographie,
   jeux de données, vidéos (vérifiée). IA déjà utilisée : détection de bulles en mer par apprentissage
   profond (vérifiée, ifremer.fr) ; projet **Meiodyssea** (imagerie 3D + IA pour la méiofaune des
   sédiments, financé par la Sasakawa Peace Foundation, vise à décrire jusqu'à 200 nouvelles espèces)
   (vérifiée). Ifremer indique explicitement que l'IA fonctionne bien sur une espèce ou peu d'espèces
   mais que la distinction multi-espèces exige de grandes bases annotées — goulot reconnu (vérifiée).
   Licence d'accès au catalogue/images : non précisée sur la page consultée (supposée : métadonnées
   ouvertes, données brutes probablement sur demande).
6. **JNCC** — carte prédictive **UKSeaMap 2018** des habitats de fonds marins du Royaume-Uni (vérifiée).
   ~50 campagnes de relevés 2003-2019 : caméras tractées (« camera sledge »), stations photo, bennes
   Hamon (échantillons d'infaune et granulométrie), sondeurs multifaisceaux (MBES) et profils
   acoustiques sous le fond, ADN environnemental (vérifiée, jncc.gov.uk). Accès partiellement restreint :
   certains rapports « available from DEFRA (ministère britannique de l'environnement) upon request »,
   pas en libre accès direct (vérifiée). Normes : « Marine Benthic Data Standards », rapport JNCC n°598
   (guide de suivi des habitats benthiques) et rapport n°712A sur le flux de données des programmes de
   monitoring — titre suggérant un souci de fragmentation des données, contenu détaillé non lisible par
   l'outil PDF disponible (existence vérifiée ; contenu non confirmé).
7. **EMSA** (*European Maritime Safety Agency*, Agence européenne pour la sécurité maritime) — service
   **CleanSeaNet** : imagerie satellite radar SAR (*Synthetic Aperture Radar*, radar à synthèse
   d'ouverture, actif par tout temps) issue notamment de Sentinel-1 (programme Copernicus), commandée
   régulièrement pour détecter les nappes d'hydrocarbures et identifier les pollueurs, disponible pour
   tous les États côtiers UE + AELE (Association européenne de libre-échange) + candidats (vérifiée,
   emsa.europa.eu). Analyse réalisée par des « opérateurs formés » — aucune mention d'IA sur la page
   officielle consultée, ce qui suggère une étape encore manuelle côté EMSA (vérifiée pour l'absence de
   mention ; ne prouve pas l'absence réelle d'IA interne).
8. **Copernicus Marine Service** (service européen de surveillance de l'environnement marin, programme
   Copernicus de l'UE) — licence gratuite, mondiale, non exclusive, perpétuelle, avec obligation de
   citer « E.U. Copernicus Marine Service Information » + DOI (*Digital Object Identifier*) en cas de
   redistribution/dérivation (vérifiée, marine.copernicus.eu). Gratuité garantie seulement jusqu'au
   30 juin 2028, fin du financement UE actuel (vérifiée) — risque de modèle d'affaires à surveiller.
   7 zones géographiques, 16+ paramètres (température, salinité, courants, glace, vagues, plancton,
   oxygène), sources satellite + in situ + modèles (vérifiée).
9. **EMODnet** (*European Marine Observation and Data Network*, réseau européen de données marines
   financé par l'UE) — 7 portails thématiques (bathymétrie, biologie, chimie, géologie, activités
   humaines, physique, habitats des fonds marins) + volet d'ingestion de données (vérifiée,
   emodnet.ec.europa.eu). Accès majoritairement ouvert mais certains jeux en licence CC-BY-NC (non
   commerciale), restrictive pour un produit payant (vérifiée). Services standards OGC (*Open
   Geospatial Consortium*) WFS/WMS + ERDDAP (*Environmental Research Division's Data Access Program*)
   (vérifiée).
10. **ICES/CIEM** (*International Council for the Exploration of the Sea* / Conseil international pour
    l'exploration de la mer, organisation intergouvernementale réunissant ~20 pays d'Europe pour la
    science et la gestion des mers) — portail de données : plus de 300 millions de mesures
    (contaminants, phytoplancton, évaluations de stocks) (vérifiée, ices.dk). Données de journaux de
    bord (« logbook ») et VMS (*Vessel Monitoring System*, surveillance satellite des navires) existent
    au niveau national et alimentent les groupes de travail ICES, mais l'accès public direct est
    généralement restreint pour confidentialité commerciale (supposée — connaissance générale du
    secteur, non confirmée par la page consultée cette session).
11. **Bonus — Global Fishing Watch (GFW)** (ONG de surveillance maritime, non gouvernementale, référence
    de facto du secteur) — apprentissage profond sur pétaoctets d'imagerie satellite SAR/optique pour
    détecter les navires « sombres » (sans émission AIS) (vérifiée). Jeu de référence public
    **xView3-SAR** (NASA, *Defense Innovation Unit* américaine, GFW) pour l'entraînement de modèles
    (vérifiée, arXiv). Produit dérivé : **Skylight**, plateforme de renseignement maritime pour agences
    d'application de la loi (vérifiée existence ; modèle tarifaire non confirmé, supposée gratuite pour
    agences via financement philanthropique).
12. **Bonus — ECHO (Vancouver Fraser Port Authority) et Quiet Sound (Washington State)** — >100
    partenaires, ralentissements volontaires sur ~74 milles nautiques de la mer des Salish jusqu'à
    5 mois/an, réduction du bruit sous-marin jusqu'à 50 % dans les zones clés (2020), >80 % de
    participation des navires commerciaux (vérifiée, sustainableworldports.org). Quiet Sound publie un
    rapport final saisonnier avec annexes (ex. « 2024-25 Slowdown Final Report w/ Appendix », ~2,2 Mo,
    nommé août 2025) confirmant une cadence de reporting récurrente (existence et titre vérifiés ;
    contenu détaillé illisible par l'outil PDF disponible dans cet environnement).

---

## (b) Cinq candidats (12 lignes maximum chacun)

### 1. Copilote de conformité acoustique pour programmes de ralentissement des navires (type ECHO/Quiet Sound)
- Problème : ECHO et Quiet Sound produisent chaque saison un rapport de conformité croisant hydrophones
  et positions de navires ; Quiet Sound publie un rapport final saisonnier avec annexes (vérifiée,
  quietsound.org, nom de fichier daté août 2025).
- Acheteur : Administration portuaire Vancouver-Fraser (VFPA, gestionnaire d'ECHO) et/ou Quiet Sound —
  dépense non chiffrée publiquement ; analyse aujourd'hui probablement humaine/consultants (supposée,
  aucune mention d'automatisation trouvée).
- Produit (1 phrase) : « Un tableau de bord qui calcule automatiquement, navire par navire, le respect
  des zones de ralentissement et des seuils de bruit, et rédige la section du rapport annuel. »
- IA : classification audio d'événements acoustiques fusionnée à un agent qui croise les pistes AIS et
  rédige le texte du rapport ; impossible avant 2024 faute d'agents combinant classification audio,
  données géospatiales et rédaction longue automatique (supposée, raisonnement sur l'état de l'art).
- Données exploitables : hydrophone de Boundary Pass (Transports Canada) ; positions AIS des >80
  organisations participantes (vérifiée, sustainableworldports.org).
- Protocole/seuil existant : vitesse cible ≤11 nœuds dans les couloirs désignés (~74 milles nautiques),
  objectifs de réduction de bruit en décibels (vérifiée, Frontiers 2019 ; sustainableworldports.org).
- Existant gratuit/payant : aucun produit IA dédié trouvé ; analyse actuelle vraisemblablement interne
  (supposée, absence de preuve n'est pas preuve d'absence).
- Retour annuel : programme structurellement saisonnier, rapport et seuils réévalués chaque année
  (vérifiée).

### 2. Agent d'harmonisation et de conformité pour la surveillance électronique des pêches (EM)
- Problème : le plus gros coût des programmes EM (*Electronic Monitoring*) est la révision vidéo
  manuelle, la transmission et le stockage (vérifiée, fisheries.noaa.gov) ; au Canada, le programme
  d'observateurs est qualifié de « broken » avec pénurie de main-d'œuvre (vérifiée, CBC News).
- Acheteur : pêcheurs commerciaux canadiens (paient eux-mêmes depuis 2013, « tens of thousands of
  dollars » par saison, vérifiée Ecotrust Canada) et bureaux régionaux NOAA gérant 14 programmes EM
  (vérifiée).
- Produit (1 phrase) : « Un agent qui prend les sorties de plusieurs outils de vision (VIAME, AI.Fish,
  caméras propriétaires) et les journaux de bord PDF, et produit directement le formulaire réglementaire
  exigé par POC/NOAA. »
- IA : agents multimodaux lisant vidéo annotée + PDF hétérogènes et générant un document conforme au
  format exigé ; impossible avant les agents multimodaux/agentiques 2024+ capables de réconcilier des
  formats hétérogènes sans pipeline codé sur mesure (supposée, raisonnement).
- Données exploitables : vidéos des 14 programmes EM NOAA et du pilote POC Pacifique (avril 2020)
  (vérifiée, existence) ; journaux de bord papier (supposée exploitable, format non vérifié).
- Protocole/seuil existant : formats de déclaration de captures/prises accessoires propres à chaque
  agence (supposée existence d'un format standard, non consulté directement).
- Existant gratuit/payant : VIAME (gratuit, NOAA/Kitware, vérifiée) ; AI.Fish/FisheriesAI (privé, contrat
  SBIR NOAA 2022-2023, vérifiée) couvrent la vision ; aucun concurrent identifié sur la couche
  d'harmonisation documentaire (supposée).
- Retour annuel : surveillance renouvelée chaque campagne de pêche (vérifiée, structure des programmes).

### 3. Classification IA des habitats benthiques pour le suivi environnemental de l'éolien offshore
- Problème : JNCC a dû modéliser UKSeaMap 2018 faute de données de terrain suffisantes malgré ~50
  campagnes 2003-2019 (vérifiée, jncc.gov.uk) ; Ifremer confirme que la distinction multi-espèces exige
  de grandes bases annotées, un goulot reconnu (vérifiée, ifremer.fr).
- Acheteur : développeurs de parcs éoliens offshore et bureaux d'études environnementaux, tenus à des
  suivis benthiques pluriannuels par autorisation — dépense actuelle non chiffrée (supposée).
- Produit (1 phrase) : « Un service qui classe automatiquement espèces/habitats benthiques dans les
  vidéos ROV (*Remotely Operated Vehicle*, véhicule sous-marin téléopéré) d'un projet selon les normes
  JNCC/EUNIS (*European Nature Information System*), et produit le rapport attendu par le régulateur. »
- IA : modèles affinés sur le corpus MBARI FathomNet (~211 000 images, 280 118 masques Segment Anything
  Model 3 de Meta, vérifiée) transposés aux espèces locales ; impossible avant ces corpus ouverts massifs
  et modèles de segmentation générique 2024-2025 (supposée, raisonnement).
- Données exploitables : FathomNet (MBARI) ; catalogue Ifremer de >10 200 campagnes (vérifiée,
  data.ifremer.fr) ; relevés JNCC 2003-2019 (vérifiée).
- Protocole/seuil existant : « Marine Benthic Data Standards » et rapport JNCC n°598 (vérifiée) ;
  classification EUNIS (supposée applicable, non vérifiée directement).
- Existant gratuit/payant : VIAME et modèles FathomNet (HuggingFace) gratuits pour la brique de base
  (vérifiée) ; aucun service intégré « conformité éolien clé en main » identifié (supposée absence).
- Retour annuel : suivis post-construction obligatoires sur plusieurs années par condition d'autorisation
  (pratique connue du secteur ; texte réglementaire précis non consulté — supposée).

### 4. Générateur de dossiers de preuve pour pollution et pêche illégale par satellite
- Problème : CleanSeaNet (EMSA) détecte les nappes par SAR mais l'analyse reste faite par des
  « opérateurs formés », sans IA mentionnée (vérifiée, emsa.europa.eu) ; GFW montre que ~75 % des navires
  détectés par SAR dans une étude n'étaient pas suivis par AIS, l'INN (pêche illégale, non déclarée et
  non réglementée) représentant >20 % des captures mondiales (vérifiée, GFW).
- Acheteur : garde-côtes/autorités maritimes des États membres EMSA, assureurs/P&I Clubs (*Protection
  and Indemnity Clubs*) évaluant la responsabilité pollution — perte/dépense non chiffrée (supposée).
- Produit (1 phrase) : « Un agent qui assemble détection satellite, historique AIS et modèles de
  courants Copernicus Marine en un dossier de preuve rédigé, prêt pour poursuite ou sinistre. »
- IA : agent multimodal de synthèse combinant imagerie SAR, séries AIS et sorties de modèles océaniques
  pour rédiger un rapport long référencé ; impossible avant les agents de synthèse multi-source et
  rédaction longue de 2024+ (supposée, raisonnement).
- Données exploitables : CleanSeaNet (SAR Sentinel-1/Copernicus, vérifiée) ; xView3-SAR (NASA, Defense
  Innovation Unit, GFW, vérifiée) ; courants via Copernicus Marine Service (gratuit jusqu'en 2028,
  vérifiée).
- Protocole/seuil existant : cadre MARPOL (*International Convention for the Prevention of Pollution
  from Ships*) et formats de signalement OMI/IMO (*International Maritime Organization*) (supposée
  applicable, texte précis non consulté).
- Existant gratuit/payant : GFW/Skylight fait la détection (supposée gratuite pour agences) ; aucun
  assembleur de dossier de preuve automatisé identifié (supposée absence).
- Retour annuel : revues de portefeuille de risque annuelles des assureurs + flux continu d'incidents
  (supposée, logique sectorielle).

### 5. Mineur de sonothèque IA pour rapports de suivi environnemental (énergie offshore)
- Problème : la littérature PAM (*Passive Acoustic Monitoring*) documente des jeux de centaines à
  milliers d'heures par déploiement, à révision manuelle jugée « labour-intensive » (vérifiée,
  littérature générale) ; ONC opère des hydrophones sur NEPTUNE/VENUS avec portail Oceans 3.0 (>70 000
  utilisateurs) mais le lien vers une revue IA systématique n'est pas confirmé (vérifiée pour ONC ;
  supposée pour le lien).
- Acheteur : développeurs de câbles sous-marins, d'éoliennes offshore et de terminaux de gaz naturel
  liquéfié (LNG) en Colombie-Britannique, via leurs bureaux d'études, tenus à des suivis acoustiques par
  condition d'évaluation environnementale — dépense actuelle non chiffrée (supposée).
- Produit (1 phrase) : « Un service qui interroge une archive hydrophone sur une fenêtre/zone donnée,
  détecte espèces cibles et bruit de navigation, et rédige la section acoustique du rapport de suivi. »
- IA : classificateurs audio profonds (ex. MobileNetV2 à ~99 % de précision sur des appels de baleine à
  bosse en laboratoire) couplés à un agent de rédaction citant les données sources ; impossible avant la
  combinaison récente de classificateurs matures et d'agents de rédaction ancrés sur preuves (vérifiée
  pour la performance en laboratoire ; supposée pour l'assemblage produit).
- Données exploitables : archive Oceans 3.0 d'ONC (vérifiée) ; hydrophone de Boundary Pass, Transports
  Canada (vérifiée) ; hydrophones propres à chaque projet (supposée disponibles selon promoteur).
- Protocole/seuil existant : conditions de suivi post-construction imposées par les autorisations
  (Agence d'évaluation d'impact du Canada, POC) — mécanisme connu, texte précis non consulté (supposée).
- Existant gratuit/payant : postes « Data Steward » actifs chez ONC confirment la fonction humaine
  (vérifiée, schmidtmarine.org) ; aucun produit de génération automatisée de rapport identifié (supposée
  absence).
- Retour annuel : suivis post-construction pluriannuels (années 1, 3, 5...) par condition d'autorisation
  (supposée, pratique connue du secteur).

---

## (c) Références (URL, date de consultation : 7 septembre 2026 sauf date propre indiquée)

- NOAA Fisheries — Electronic Monitoring : https://www.fisheries.noaa.gov/national/fisheries-observers/electronic-monitoring
- NOAA Technology Partnerships — Cloud-Based Automated EM : https://techpartnerships.noaa.gov/cloud-based-automated-electronic-monitoring-for-fisheries/
- NOAA Fisheries — Increasing Efficiency of Video Surveys with AI : https://www.fisheries.noaa.gov/feature-story/increasing-efficiency-video-surveys-artificial-intelligence
- NOAA Fisheries — Faster Analysis... Pollock Fishery (YOLOv11) : https://www.fisheries.noaa.gov/feature-story/faster-analysis-data-evaluate-bycatch-reduction-efforts-pollock-fishery
- AI.Fish / FisheriesAI : https://www.ai.fish/project/fisheriesai
- VIAME : https://viametoolkit.org/
- CBC News — At-sea observer program « broken » (titre/résumé via résultats de recherche, page en accès
  direct bloquée 403 le 7/9/2026) : https://www.cbc.ca/news/canada/nova-scotia/at-sea-observer-program-is-broken-advocates-say-but-electronic-tools-and-ai-could-help-9.7025221
- Ecotrust Canada — Observer-based fisheries monitoring : https://ecotrust.ca/priorities/fisheries/observer-based-fisheries-monitoring/
- Ocean Networks Canada : https://www.oceannetworks.ca/
- ONC — poste Data Steward (Schmidt Marine Job Board, clôture 11/5/2026) : https://jobs.schmidtmarine.org/companies/ocean-networks-canada/jobs/76756607-data-steward-research-data-management-closes-may-11
- FathomNet : https://fathomnet.org/
- fathomnet-py (GitHub) : https://github.com/fathomnet/fathomnet-py
- Ifremer — Sous l'eau, l'image révèle la biodiversité marine : https://www.ifremer.fr/fr/sous-l-eau-l-image-revele-la-biodiversite-marine
- Ifremer — Meiodyssea / 200 nouvelles espèces : https://www.ifremer.fr/fr/presse/jusqu-200-nouvelles-especes-cachees-dans-les-sediments-marins-bientot-decrites-grace-l-ia-et
- Ifremer — Détection des bulles en mer (deep learning) : https://www.ifremer.fr/fr/ressources/detection-des-bulles-en-mer-le-deep-learning-change-la-donne
- Ifremer — Catalogue des campagnes à la mer (SISMER) : https://data.ifremer.fr/Centre-de-donnees/Systemes-d-information/Catalogue-des-campagnes-a-la-mer
- JNCC — Completed Seabed Surveys : https://jncc.gov.uk/our-work/completed-seabed-surveys/
- JNCC — Marine Benthic Data Standards : https://jncc.gov.uk/our-work/marine-benthic-data-standards/
- JNCC Report 598 (PDF) : https://data.jncc.gov.uk/data/9ade4be8-63dd-4bbc-afd0-aefe71af0849/JNCC-Report-598-REVISED-WEB.pdf
- JNCC Report 712A (PDF, contenu illisible par l'outil, titre seul exploité) : https://data.jncc.gov.uk/data/43e4c894-8b35-4aed-b0e0-af3846caed99/jncc-report-712a.pdf
- EMSA — CleanSeaNet : https://www.emsa.europa.eu/csn-menu.html
- Copernicus Marine Service — licence : https://marine.copernicus.eu/user-corner/service-commitments-and-licence
- EMODnet : https://emodnet.ec.europa.eu/en
- ICES — portail de données : https://www.ices.dk/data/Pages/default.aspx
- Global Fishing Watch — Dark Vessels : https://globalfishingwatch.org/research-project-dark-vessels/
- xView3-SAR (arXiv) : https://arxiv.org/pdf/2206.00897
- ECHO Program (via Sustainable World Ports ; portvancouver.com direct bloqué 403 le 7/9/2026) : https://sustainableworldports.org/project/vancouver-fraser-port-authority-the-echo-program/
- Quiet Sound — 2024-25 Slowdown Final Report (PDF, nommé août 2025, contenu illisible par l'outil,
  existence/titre confirmés) : https://quietsound.org/wp-content/uploads/2025/08/Quiet-Sound-2024-25-Slowdown-Final-Report-w_-Appendix.pdf
- Frontiers (2019) — Potential Benefits of Vessel Slowdowns on Southern Resident Killer Whales : https://www.frontiersin.org/journals/marine-science/articles/10.3389/fmars.2019.00344/full
- NOAA Fisheries — New Voluntary Slowdown for Killer Whales : https://www.fisheries.noaa.gov/feature-story/new-voluntary-slowdown-commercial-ships-aims-quiet-sound-endangered-killer-whales
- Ocean Hackathon / Décennie de l'océan des Nations Unies : https://oceandecade.org/events/ocean-hackathon-2025/ ; https://www.campusmer.fr/call-for-challenges-5144-0-0-0.html

### Lacunes
- Licence exacte des images FathomNet non confirmée (code MIT ≠ licence des données) ; à vérifier
  directement auprès de MBARI.
- Deux PDF clés (Quiet Sound 2024-25, JNCC 712A) non lisibles : `pdftoppm`/poppler-utils absent de
  l'environnement, seuls titres et métadonnées exploités — contenu détaillé non vérifié.
- Pages officielles DFO/POC (dfo-mpo.gc.ca) et Vancouver Fraser Port Authority (portvancouver.com)
  inaccessibles en direct (404/403) pendant la session ; contournées via sources tierces (CBC,
  Sustainable World Ports, Ecotrust Canada), donc financement exact d'ECHO et contenu précis des
  rapports annuels non confirmés de première main.
- Chiffres de coût précis introuvables dans le temps imparti : budget annuel CleanSeaNet, coût du
  backlog vidéo NOAA/POC, tarification AI.Fish/Skylight — laissés « supposée »/absents plutôt que
  chiffrés au hasard.
- Statut d'ouverture réel des données ICES logbook/VMS non vérifié sur le portail lui-même (supposée,
  connaissance générale du secteur).
- Budget WebSearch épuisé (10/10) avant de pouvoir confirmer : existence d'un concurrent direct au
  candidat 4 (assembleur de dossier de preuve), tarification Copernicus Marine post-juin 2028, volume
  exact d'heures hydrophones ONC non revues par un humain.
- L'absence de concurrent direct relevée pour les candidats 1, 4 et 5 est une absence de preuve dans une
  recherche limitée à 10 requêtes, pas une preuve d'absence — à re-vérifier avant toute décision produit.
