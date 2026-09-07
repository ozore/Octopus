# Mémoire agent energie-cables

## Mandat (rappel)
Secteur : développeurs/exploitants éolien en mer, câbles sous-marins, pipelines, plateformes à démanteler,
hydrolien, houlomoteur + leurs prestataires O&M (opération et maintenance).
Cible : 5 problèmes réels PAYÉS + produit IA impossible avant 2024. Max 10 WebSearch (quota partagé). Écrire
uniquement dans ce dossier. Pas de code, pas de commit. Date de référence : 7 septembre 2026.

## Compteur de recherches WebSearch
0/10 utilisées au démarrage.

## Plan de recherche (avant exécution)
1. MMO (Marine Mammal Observer) / PAM (Passive Acoustic Monitoring) - coût, prestataires, offres d'emploi.
2. Protocole JNCC (Joint Nature Conservation Committee, UK) battage de pieux / mammifères marins.
3. Inspection ROV (Remotely Operated Vehicle) biofouling/corrosion, normes DNV, sociétés spécialisées.
4. CBRA (Cable Burial Risk Assessment, Carbon Trust) - ensouillage câbles, prestataires de levés.
5. Démantèlement plateformes pétrolières/gaz - BOEM (Bureau of Ocean Energy Management, US),
   OSPAR (convention pour la protection du milieu marin de l'Atlantique du Nord-Est), coûts.
6. ORJIP (Offshore Renewables Joint Industry Programme, UK) collisions oiseaux.
7. Startups IA existantes (concurrence) - inspection offshore, détection mammifères marins.
8. BOEM / obligations annuelles de suivi environnemental (récurrence du besoin).
9-10. Réserve pour combler des lacunes (chiffres de coûts, confirmation d'acheteurs nommés).

## Candidats retenus (hypothèse de travail avant recherche)
A. Automatisation de la conformité MMO/PAM pendant le battage de pieux (bruit + mammifères marins + observateurs)
B. Inspection vidéo ROV par IA pour biofouling + corrosion (intégrité structurelle)
C. Prévision d'exposition de câbles / profondeur d'ensouillage par IA sur données bathymétriques répétées
D. Rapport de démantèlement / évaluation comparative (laisser en place vs retrait, effet récif artificiel)
E. Conformité collisions oiseaux/chauves-souris (caméras + radar + IA) en mer

## Journal (au fil de l'eau)
- [Démarrage] Dossier créé. Brief lu intégralement. Aucune autre lecture du dépôt effectuée (consigne respectée).

## Recherches effectuées
1. "marine mammal observer offshore wind passive acoustic monitoring contractor cost job" -> OK.
   - Taux MMO (Marine Mammal Observer) : 19-96 $/h ; tarif journalier MMO/PAM (Passive Acoustic Monitoring) : 200-700 $/j (ziprecruiter, crewbase.pro, 2026).
   - RPS Group : prestataire environnemental offshore, dessert ~90% des zones de bail éolien actives aux US (depuis 2020).
   - Source vivante : crewbase.pro/blog/2026/07/mmo-pam-operator-career-path-offshore-wind-seismic-2026
2. "JNCC piling protocol marine mammal mitigation offshore wind noise 2024" -> OK, protocole confirmé.
   - JNCC (Joint Nature Conservation Committee, UK) : "Statutory Nature Conservation Agency Protocol for Minimising
     the Risk of Injury to Marine Mammals from Piling Noise" (2010, toujours en vigueur). Zone de mitigation standard
     500 m. Defra (UK, ministère environnement/agriculture) a commandé en 2024 une étude sur un seuil de bruit de
     battage pour Round 4/5 (vagues d'appels d'offres éolien en mer UK). Natural England + Cefas (Centre for
     Environment, Fisheries and Aquaculture Science) coautorité.
   - Source : jncc.gov.uk/resources/e1d38ce8-9bc6-4fb5-b867-f7f595caa25a
3. "ROV inspection offshore wind foundation biofouling corrosion report DNV standard" -> OK.
   - DNV-RP-0416 (Det Norske Veritas, société de classification norvégienne) : protection anticorrosion éoliennes.
   - BSEE (Bureau of Safety and Environmental Enforcement, US) : TA&R Project 627, méthodologies d'inspection.
   - Limite technique notée : "mud zone" (zone enfouie/proche sédiment) non inspectable par ROV standard -> lacune IA.
4. "Cable Burial Risk Assessment Carbon Trust offshore wind depth of cover survey" -> OK, protocole confirmé.
   - CBRA (Cable Burial Risk Assessment), Carbon Trust / Offshore Wind Accelerator, publié 2015, standard industrie.
   - Notion clé : "Depth of Lowering" (profondeur d'ensouillage visée) + risque résiduel après pose.
   - Concurrents/outils repérés : Indeximate (DAS - Distributed Acoustic Sensing - détection câbles dénudés),
     Cathie Group (conseil géotechnique), Seagard.
   - Source : carbontrust.com/our-work-and-impact/guides-reports-and-tools/cable-burial-risk-assessment-cbra-guidance

5. "offshore oil gas platform decommissioning comparative assessment cost OSPAR BOEM North Sea rigs to reefs" -> OK.
   - OSPAR (Convention pour la protection du milieu marin de l'Atlantique du Nord-Est) Décision 98/3 : retrait complet
     obligatoire en mer du Nord (pas de "rigs-to-reefs" comme au Golfe du Mexique/Pacifique US).
   - Rystad Energy (cabinet d'analyse énergie) : coût de retrait d'une plateforme acier en mer du Nord >2x le même
     retrait en Asie du Sud-Est (ordre de grandeur, non chiffré précisément -> ESTIMATION).
   - BOEM (Bureau of Ocean Energy Management, US) : revue environnementale (loi NEPA) pour rigs-to-reefs ; permis de
     retrait délivré par BSEE (Bureau of Safety and Environmental Enforcement, US).
   - Nuance retenue : le candidat "démantèlement" vise surtout le contexte US (Golfe du Mexique/Pacifique) et
     Asie/Australie où le "leave in place"/reefing est une option ; mer du Nord = valeur surtout dans le comparatif
     réglementaire (Comparative Assessment) même si le retrait reste obligatoire.
6. "ORJIP bird collision avoidance offshore wind monitoring protocol camera" -> OK, EXCELLENT signal quantifié.
   - ORJIP (Offshore Renewables Joint Industry Programme, UK) Bird Collision Avoidance Study, parc de Thanet
     (Vattenfall), 2014-2016, commandé par 11 développeurs + Crown Estate + Crown Estate Scotland + Marine Scotland.
   - Chiffre clé VERIFIE : >600 000 vidéos analysées, seulement 12 131 contenaient de l'activité aviaire (~2%) ->
     charge de revue manuelle massive et majoritairement stérile = candidat fort pour tri vidéo par IA.
   - Source : tethys.pnnl.gov/publications/orjip-bird-collision-avoidance-study (Skov et al. 2018)
7. "AI startup offshore wind inspection video analysis marine mammal detection 2025 2026" -> OK, concurrence identifiée.
   - Ecodetect (UK, startup) : IA de classification de vie marine sur flux caméra d'infrastructures énergie offshore
     (baleines, oiseaux, plancton). Case study AMRC (Advanced Manufacturing Research Centre) + article
     renewableenergymagazine.com (08/2025).
   - DeepSeaVision (Synthetik Applied Technologies) : détection temps réel mammifères marins, vidéo+acoustique+IA,
     partenariat NOAA (National Oceanic and Atmospheric Administration, US).
   - Marine Observer (Toyon) : caméra infrarouge + IA, 6 systèmes déployés printemps 2025 pour un chantier éolien en
     Atlantique nord (surveillance mammifères marins pendant construction).
   - Tetra Tech "Neptune AI" : prix Oceantic Ventus Innovation of the Year 2025 (Oceantic Network, association US).
   - RWE : "monitoring environnemental innovant" lancé au parc Kaskasi (communiqué RWE).
   - CONCLUSION IMPORTANTE : la détection temps réel de mammifères marins par IA est déjà un marché actif avec
     plusieurs acteurs 2025 -> le candidat A doit être repositionné sur un angle moins couvert : l'automatisation de
     la CONFORMITÉ/rapport réglementaire (JNCC/BOEM) et la fouille d'archives PAM/logs multi-années/multi-sites, pas
     la détection brute (déjà commoditisée).

8. "Orsted RWE Equinor EDF BP offshore wind tender environmental monitoring inspection O&M contract 2025 2026" -> OK
   partiel (contexte acheteurs confirmé, pas de chiffre de contrat précis).
   - Confirme les acheteurs nommés actifs : Ørsted, Equinor, RWE, BP (scission Empire Wind/Beacon Wind mi-2025),
     National Grid. Contexte difficile US : arrêt de chantier (stop-work order) pour 5 projets éoliens offshore US
     en construction, décembre 2025 (Department of the Interior). Ørsted a annulé Hornsea 4 (UK) en mai 2025, coût
     jusqu'à 650 M$. RWE a annulé un projet 2 GW en Australie (déc. 2025).
   - Pas de chiffre de dépense précis sur les contrats environnement/inspection -> reste en estimation.
9. "tidal stream wave energy EMEC corrosion biofouling monitoring cable cost" -> OK, couverture hydrolien/houlomoteur.
   - EMEC (European Marine Energy Centre, centre d'essai écossais, Orkney) : sites d'essai câblés (11 kV), 5 câbles
     site houlomoteur Billia Croo, 7 câbles site hydrolien Fall of Warness.
   - Biofouling documenté comme facteur de coût d'inspection + corrosion accrue + charge hydrodynamique accrue
     (SUPERGEN ORE - Supergen Offshore Renewable Energy Hub, réseau académique UK).
   - LCOE (Levelized Cost of Energy) hydrolien : 100-280 £/MWh (vérifié, ordre de grandeur cité), très supérieur à
     l'éolien -> secteur plus petit/moins d'acheteurs solvables mais coûts unitaires élevés -> sensible à l'IA coût.
10. "inspection data analyst offshore wind ROV video review job biofouling corrosion salary" -> OK.
    - Salaire moyen poste "Offshore ROV" (Remotely Operated Vehicle, submersible télépiloté) US : 156 348 $/an
      (ZipRecruiter, mai 2026, vérifié) ; fourchette 116-205 k$/an.
    - "Data Analyst - Offshore Wind" : 90-105 k$/an (Glassdoor, vérifié).
    - Rôles "inspection class ROV data review" confirmés existants (analyse vidéo, gestion de base d'objets détectés)
      -> correspond exactement au poste "analyste de données d'inspection" ciblé par le brief.

QUOTA WEBSEARCH ATTEINT : 10/10 utilisées. Passage en WebFetch (libre, hors quota) pour approfondir 2-3 sources déjà
trouvées avant rédaction du dossier.

## WebFetch complémentaires (hors quota WebSearch, "WebFetch libre")
A. oilprice.com "The High Cost Of Decommissioning..." (12/09/2020, données Rystad Energy) -> chiffres précis :
   retrait plateforme acier type (60 m profondeur, 4 pieux, topside 1500 t, jacket 800 t) : 22,35 M$ mer du Nord vs
   9,08 M$ Asie du Sud-Est (~2,5x). Cause : coûts de navire (+50% pour navires DP heavy-lift vs derrick barge),
   météo, réglementation stricte. Confirme OSPAR 98/3 (retrait complet obligatoire mer du Nord).
B. rwe.com communiqué SeaMe Kaskasi (09/09/2025) -> TRES IMPORTANT, exemple concret d'acheteur nommé (RWE) déployant
   DEJA 5 systèmes IA différents et non intégrés sur un seul parc :
   - Drone longue portée (Primoco UAV One 150 + caméra HiDef + IA) avec BioConsult SH -> oiseaux/marsouins,
     -90% empreinte carbone vs avion.
   - Caméras HD + IA (détection/suivi/identification, IR nuit) avec Spoor -> oiseaux.
   - Caméra sous-marine autonome (clips 30s/15min + IA) avec Anemo Robotics -> faune marine, remplace méthode
     invasive annuelle.
   - AUV (Autonomous Underwater Vehicle) avec DFKI (Deutsches Forschungszentrum für Künstliche Intelligenz,
     centre de recherche IA allemand) -> poissons/mammifères/benthos + paramètres océanographiques.
   - ADN environnemental (eDNA) avec HIFMB (Helmholtz Institute for Functional Marine Biodiversity) + AWI
     (Alfred Wegener Institute) -> 143 espèces identifiées dont marsouins.
   => 5 prestataires/vendeurs différents, 5 flux de données séparés, AUCUNE preuve d'une couche de fusion/rapport
      unique -> confirme un vrai gap d'intégration (utilisé pour candidat 1).
C. renewableenergymagazine.com Ecodetect (12/08/2025) -> citation directe utile : "data collection and analysis
   was slow and costly and delaying vital projects" (fondateur David Gold). Cible développeurs éolien flottant +
   applications pêche/shipping/démantèlement O&G. Pas de prix/contrat public. Start-up en levée de fonds (donc
   marché encore ouvert, pas d'acteur dominant identifié).

## Repositionnement stratégique des 5 candidats (décision prise après recherche)
Constat transversal : la DETECTION brute par IA (mammifères marins, oiseaux, biofouling) est déjà commoditisée en
2025-2026 par plusieurs fournisseurs (Ecodetect, DeepSeaVision, Marine Observer/Toyon, Spoor, Anemo Robotics,
Neptune AI/Tetra Tech). Le produit défendable en 2026 n'est donc PAS la détection elle-même mais la couche
au-dessus : fusion multi-capteurs/multi-fournisseurs + mise en forme réglementaire (JNCC/BOEM/OSPAR/CBRA) +
agrégation multi-sites/multi-années pour les obligations cumulatives. Décision reflétée dans dossier.md.

## Lacunes assumées (faute de budget de recherche)
- Champs électromagnétiques (CEM) des câbles : non creusé spécifiquement (thème mentionné dans le brief mais pas
  de recherche dédiée -> pas de candidat dédié, mentionné en lacune).
- Pêche et cohabitation : non creusé spécifiquement.
- Chauves-souris (vs oiseaux) : peu de littérature trouvée spécifiquement offshore.
- Aucun appel d'offres (tender) brut consulté directement (PDF de marché public) faute de résultat direct exploitable
  dans le temps imparti ; déduction faite à partir de communiqués, offres d'emploi et guides techniques.
- Montants de contrats (valeur totale $, pas seulement taux journaliers/salaires) non trouvés pour la plupart des
  candidats -> fourchettes ou ordres de grandeur marqués "estimation" dans dossier.md.

FIN DE RECHERCHE. Rédaction de dossier.md en cours.

## Résumé final (max 10 lignes)
dossier.md livré avec 5 candidats : (1) fusion/conformité multi-capteurs mammifères marins-oiseaux pendant
battage (RWE/Kaskasi vérifié), (2) rapport ROV auto biofouling/corrosion réf. DNV, (3) prévision d'exposition de
câbles via CBRA augmentée par IA, (4) dossier de démantèlement assisté IA (retrait vs récif artificiel, chiffres
Rystad vérifiés), (5) taux d'évitement oiseaux multi-fournisseurs agrégé portefeuille (ORJIP 600k/12k vidéos
vérifié). Constat clé : la détection IA brute est déjà commoditisée en 2025-2026 (Ecodetect, DeepSeaVision, Spoor,
Marine Observer, Neptune AI) ; le produit défendable est la couche de fusion/mise en conformité réglementaire
au-dessus, pas encore trouvée chez un concurrent. 10/10 WebSearch utilisées + 3 WebFetch libres. Lacunes : CEM
câbles, pêche/cohabitation, chauves-souris et tenders bruts non creusés (voir dossier.md, section Lacunes).
