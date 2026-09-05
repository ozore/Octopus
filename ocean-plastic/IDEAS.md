# Liste courte : 12 idées de société « Ocean Plastic » (synthèse orchestrateur, 05/09/2026)

Sources : les 9 dossiers de recherche dans `ocean-plastic/agents/*/`. Chaque idée cite la
réglementation déclencheuse (référence exacte + date), la cible, le produit, le prix, l'effort.
Prix et tailles de marché = estimations à partir des comparables trouvés par les agents.

## 1. DriftBox : registre et suivi des conteneurs perdus (armateurs, P&I clubs, États côtiers)
- Déclencheur : amendements SOLAS Ch. V règles V/31-32 + MARPOL Protocole I (MSC.550(108), MEPC.384(81)), en vigueur 01/01/2026 : déclaration immédiate de tout conteneur perdu ou observé (position, nombre, marchandises dangereuses) aux navires voisins, État côtier, État du pavillon, puis GISIS.
- Chiffres : 221 conteneurs perdus (2023), 576 (2024), 1 478 (2025, dont 640 sur un seul sinistre) ; moyenne 10 ans ~1 274/an ; ~280 M conteneurs transportés/an. 12 P&I clubs assurent ~90 % du tonnage mondial. X-Press Pearl : jugement 1 Md$ (juillet 2025).
- Cible : armateurs porte-conteneurs (quelques milliers de navires), P&I clubs et assureurs cargo, autorités côtières.
- Produit : déclaration structurée en un clic conforme GISIS, diffusion automatique aux autorités, prédiction de dérive du conteneur (Copernicus Marine + OceanParcels, gratuits) pour la récupération, dossier de preuve horodaté pour le sinistre, base agrégée en continu (l'équivalent du rapport annuel WSC en temps réel), marketplace de récupération (ROV/salvage) en V2.
- Prix : 500-2 000 €/navire/an (armateurs) ; licence data 20-100 k€/an (P&I clubs, assureurs) ; commission 8-12 % sur missions de récupération.
- Effort : moyen (base de données + API + intégration AIS/GISIS + modèle de dérive open source ; 6-9 mois-ingénieur).
- Concurrence : aucun acteur dédié identifié ; Loginno (balise sonar hardware), WSC (rapport annuel). Portbase/dbh sans module.

## 2. GearTrace : registre des engins de pêche, déclaration de perte, dérive et REP
- Déclencheur : Règlement (UE) 2023/2842 (contrôle des pêches) : marquage, déclaration électronique des engins perdus, matériel de récupération à bord ; règles d'application 10/01/2026 ; journal électronique généralisé aux navires < 12 m d'ici 2028. Règlement d'exécution (UE) 2025/274 (marquage engins passifs récréatifs, 12/02/2025). Directive (UE) 2019/904 art. 8 : REP engins de pêche obligatoire depuis 31/12/2024 ; France décret n° 2025-775 (05/08/2025), éco-organisme encore en construction ; Suède Fiskekretsen : 6 000 SEK + 10 SEK/kg ; Norvège REP reportée à mars 2027. IMO : circulaire marquage des engins (PPR 13, MEPC 84, avril-mai 2026). Corée : consigne étendue aux filets/bouées en 2026.
- Chiffres : 68 863 navires de pêche actifs UE (2024) ; 500 000 à 1 000 000 t/an d'engins perdus dans le monde ; un filet ~10 000 € ; Nofir 10 298 t collectées en 2025 ; Norvège : 1 637 filets récupérés lors de la dernière campagne.
- Cible : administrations des pêches (DPMA, Fiskeridirektoratet), organisations de producteurs et criées, éco-organismes REP, fabricants/importateurs d'engins, en V2 assureurs et recycleurs (Nofir, Fil&Fab, Plastix, Bureo).
- Produit : app mobile hors-ligne de déclaration de perte (géoloc, photo, type) branchée sur le journal électronique ; registre des marquages ; prédiction IA de dérive et de dépôt sur le fond pour cibler les campagnes de récupération ; calcul et déclaration REP multi-pays pour les fabricants ; traçabilité port → recycleur (preuve REP).
- Prix : 2-5 €/navire/an via administrations/OP ; 15-40 k€/an par éco-organisme ; 2-8 k€/an par fabricant ; 5-15 €/t tracée.
- Effort : moyen (base réglementaire multi-pays + app mobile + dérive open source ; 6-9 mois-ingénieur ; pas de hardware en V1).
- Concurrence : GGGI Data Portal (gratuit, non réglementaire), Blue Ocean Gear (bouées connectées US, hardware), apps nationales isolées. Aucun acteur ne combine conformité 2023/2842 + REP + dérive.

## 3. PelletGuard : conformité et détection des pertes de granulés plastiques
- Déclencheur : Règlement (UE) 2025/2365 (JOUE 26/11/2025, en vigueur 16/12/2025) : plans de gestion des risques dès 5 t/an, certification tierce > 1 500 t/an, obligations générales dès décembre 2027, transport maritime au 17/12/2028 ; amende plancher proposée 4 % du CA. USA : Illinois HB 4418 (07/08/2026, BMP NPDES d'ici 08/2027), EPA MSGP 2026, Plastic Pellet Free Waters Act (H.R.7543, en commission), Californie PMRP (LA).
- Chiffres : 52 000 à 184 000 t/an de pellets perdus dans l'UE (jusqu'à 7 300 camions/an) ; transport maritime = 38 % des mouvements de pellets UE ; X-Press Pearl 1 680 t déversées.
- Cible : plasturgistes, producteurs de résine, logisticiens, nettoyeurs de citernes, transporteurs maritimes et ports manipulant des pellets (quelques milliers de sites UE) ; organismes certificateurs (SGS, DNV, DQS) comme partenaires.
- Produit : plateforme de plan de gestion des risques par site, registre des pertes, préparation de l'audit de certification, échéancier ; module caméra IA (vision par ordinateur) de détection de déversement sur quais/chargement ; registre public des certificats → score de risque fournisseur vendu aux acheteurs et assureurs.
- Prix : 3-10 k€/site/an (SaaS) ; module caméra 200-500 €/mois/site ; API score fournisseur 10-50 k€/an.
- Effort : faible pour le SaaS (3-5 mois-ingénieur), élevé pour la vision (petits objets translucides).
- Concurrence : aucun logiciel dédié ; Operation Clean Sweep (volontaire), certificateurs (audit seulement).

## 4. TrueBlue Claims : preuve d'allégation « plastique océanique » avant le 27/09/2026
- Déclencheur : Directive (UE) 2024/825 « Empowering Consumers » : interdiction des allégations environnementales génériques non prouvées et des labels sans certification tierce, applicable à partir du 27/09/2026 ; Green Claims Directive retirée (juin 2025) → les marques doivent s'auto-armer de preuves. Étude Commission : 53 % des allégations vagues ou infondées.
- Cible : marques B2C (cosmétique, mode, boissons, équipement outdoor) vendant en UE avec allégations « ocean plastic », « ocean-bound », « recyclé marin » ; leurs fournisseurs (Oceanworks, #tide, Bureo, Econyl) ; directions juridiques.
- Produit : scan NLP/LLM des sites, packagings et campagnes pour repérer les allégations à risque ; dossier de preuve par lot : collecte géolocalisée (zone des 50 km, définition OBP), corroboration satellite/IA des sites de collecte, certificats OBP/PCX rattachés ; export prêt pour la DGCCRF ou l'ACM ; piste d'audit.
- Prix : 15-60 k€/an par marque selon nombre de références ; 200-500 € par dossier de lot ; audit pré-campagne 2-10 k€.
- Effort : moyen (LLM + base réglementaire + corrélation géospatiale ; 5-8 mois-ingénieur).
- Concurrence : CleanHub (crédits, 499 €/mois), certification OBP (Control Union), cabinets d'avocats ; aucun outil de preuve d'allégation spécialisé plastique marin.

## 5. Plastic Credit Ratings : l'agence de notation des crédits plastique
- Déclencheur : marché des crédits plastique 462 M$ (2024) en croissance mal mesurée (23 % à 121 %/an selon les sources) ; standards non harmonisés (Verra PWRS 200-800 $/t, PCX, Plastic Bank 160 $/t, CleanHub TÜV SÜD, Empower) ; controverses (cimenterie, additionnalité) ; Directive 2024/825 interdit les allégations basées sur compensation ; CSRD/ESRS E2 pour ~5 000 grands groupes.
- Cible : acheteurs corporate de crédits (Nestlé, PepsiCo, L'Oréal, Samsung cités), leurs auditeurs et assureurs ; standards et courtiers en marque blanche.
- Produit : agrégation de tous les registres publics, détection de double comptage, score de crédibilité par projet (type de traitement, géolocalisation vérifiée par satellite, historique), rapport d'audit CSRD ; MRV indépendant à la tonne (photos/IoT + satellite). Analogie directe : Sylvera / BeZero sur le carbone.
- Prix : 15-60 k€/an par acheteur ; 2-5 $/t vérifiée ; licence standards 50-200 k$/an.
- Effort : moyen (agrégation de registres + scoring ; satellite optionnel).
- Concurrence : aucun agrégateur indépendant identifié ; TÜV SÜD vérifie pour CleanHub (non indépendant des plateformes).

## 6. HarbourTwin : le logiciel au-dessus des robots de nettoyage de ports et marinas
- Déclencheur : parc installé de robots sans couche data (Jellyfishbot ~100 unités à 25 k€, WasteShark 30+ pays à ~15 k£, Seabin, BeBot 40 k€, PixieDrone) ; labels Pavillon Bleu (104 ports FR, 700-1 500 €/an), Clean Marina (30+ États US), Blue Flag 5 216 sites ; Directive 2019/883 (plans de gestion des déchets) ; Copernicus Marine + OceanParcels gratuits pour la dérive.
- Chiffres : 10 000 à 25 000 marinas en Europe, 12 000+ aux USA, 30 000+ dans le monde ; marché plaisance Europe 17-18 Md$ ; ~550 ports TEN-T ; PCS 1,23 Md$ (2025) → 2,62 Md$ (2030).
- Cible : autorités portuaires, marinas et fédérations (Ports Propres), villes portuaires ; fabricants de robots comme canal (marque blanche).
- Produit : jumeau numérique du bassin : agrégation des données de collecte de tous les robots/capteurs, carte des zones d'accumulation, prédiction hebdomadaire de dérive « dernier kilomètre » pour positionner les robots, calcul automatique des indicateurs de label, rapport annuel, affichage public « X kg retirés ».
- Prix : 500-3 000 €/mois par site selon capteurs ; revenue-share avec fabricants ; licence fédérations.
- Effort : faible à moyen (intégration API fabricants, souvent fermées : risque ; dérive open source ; 4-6 mois-ingénieur).
- Concurrence : chaque fabricant vend ses données isolément ; Sinay (généraliste maritime) ; aucun agrégateur neutre.

## 7. WasteDeck : conformité déchets navires et ports (PRF + MARPOL Annexe V)
- Déclencheur : Directive (UE) 2019/883 : notification préalable des déchets (SafeSeaNet), redevance indirecte, reçu de dépôt, inspections 15 %/an, transposition hétérogène (MDPI 2025), évaluation Commission 28/06/2026. MARPOL Annexe V : Garbage Record Book obligatoire dès 100 UMS depuis 01/05/2024 (contre 400 avant) ; amendes dès 15 000 $ pour une erreur documentaire, 25 000 $/infraction aux USA ; stratégie IMO 2026 zéro rejet plastique 2030.
- Cible : ~500 ports TEN-T « comprehensive » sans PCS dédié ; agents maritimes ; compagnies de croisière et cargos moyens 100-400 UMS ; flottes de yachts/superyachts (100 UMS+) et sociétés de gestion.
- Produit : pré-remplissage des notifications via AIS et plan de voyage, calcul de la redevance selon la grille du port, reçu numérique, statistiques d'inspection ; côté navire : e-Garbage Record Book tablette avec validation des règles, horodatage GPS, export inviolable, alerte avant escale.
- Prix : ports 1 500-6 000 €/mois ; agents 2-5 €/notification ; navires 200-500 €/mois ; yachts 1 000-3 000 €/an.
- Effort : moyen (intégration SafeSeaNet/THETIS-EU, règles MARPOL codifiées ; pas d'IA lourde).
- Concurrence : Portbase (gratuit, Rotterdam/Amsterdam seulement), dbh, ABS Nautical Systems, cruisePAL, Brenock (suites chères pour grandes flottes). Positionnement : ports moyens et petites flottes.

## 8. CleanScore : l'indice de propreté des plages pour communes, labels, hôtels et assureurs
- Déclencheur : DCSMM descripteur 10, seuil de bon état 20 déchets/100 m (adopté 2020, OSPAR 2023) contre 203/100 m en moyenne UE (JRC 2025) ; cycles de rapportage 2024-2027 ; Zero Pollution Action Plan : -50 % de déchets en mer d'ici 2030 ; labels Pavillon Bleu / Blue Flag (5 216 sites) avec critères déchets.
- Chiffres : Châtelaillon 135 000 €/an pour 3 km de plage ; 90 communes de la côte ouest US : 520 M$/an ; Skagerrak -22,5 M$/an de tourisme ; ~400 appels d'offres « nettoyage plage » actifs en France ; ~5 000 communes littorales UE (estimation).
- Cible : communes et intercommunalités littorales, organismes de label, hôtels et resorts (Green Key 3 000+ sites), assureurs et locations saisonnières (V2).
- Produit : drone/satellite (Sentinel-2, MARIDA) + vision par ordinateur (TACO/YOLO) + ingestion des données citoyennes (Marine Debris Tracker, TIDES, Surfrider, OSPAR) → score normalisé par plage, hebdomadaire, cartographie des zones prioritaires, export conforme DCSMM/OSPAR et dossiers de label ; API assurance/immobilier.
- Prix : 3-8 k€/an par commune ; API 10-50 k€/an par assureur ; rapports 3-10 k€.
- Effort : moyen à élevé (modèle CV entraîné, pipeline multi-sources ; 6-9 mois-ingénieur).
- Concurrence : Scidrones/CMLO (pré-commercial), projets académiques ; données citoyennes toutes gratuites, personne ne les vend structurées.

## 9. RiverEye : cartographie IA des points chauds fluviaux et conformité « trash capture »
- Déclencheur : Directive (UE) 2024/3019 (recast eaux résiduaires urbaines) : surveillance des microplastiques y compris dans les rejets pluviaux, transposition 31/07/2027, jalons 2027-2035 ; California Trash Amendments : 100 % de capture pour les permis MS4 au 02/12/2030 ; Trash TMDL (LA, Baltimore, Anacostia). 1 000 rivières = 80 % des apports (Meijer 2021), surtout petites rivières urbaines.
- Chiffres : Interceptor ~2,8 M$ + 650 k$/an (Ballona Creek) ; Mr. Trash Wheel 720 k$ ; EnviroPod 75 000 unités ; Plastic Origins (Surfrider) arrêté en 2025 faute d'industrialisation (1 100 campagnes, 8 pays).
- Cible : agences de l'eau et métropoles (UE), villes californiennes sous MS4 (Phase I/II), bailleurs (PROBLUE, ADB) en Asie.
- Produit : caméras fixes bas coût sur ponts et déversoirs + vision par ordinateur (comptage/classification) → carte des points chauds par sous-bassin ; inventaire GIS des dispositifs de capture tous fournisseurs, tournées, rapports de conformité State Water Board ; priorisation des investissements.
- Prix : 8-25 k€/an par point de mesure ; 15-60 k$/an par ville ; licence agence 150 k€/an.
- Effort : moyen (Plastic Origins open source + TACO ; caméras du commerce ; 6-9 mois-ingénieur).
- Concurrence : The Ocean Cleanup (RMS propriétaire, non vendu), Plastic Origins (arrêté), fournisseurs hardware sans agrégateur.

## 10. NurdleRisk : score de risque « pollution plastique » pour assureurs maritimes
- Déclencheur : X-Press Pearl : 1 Md$ jugés (Cour suprême Sri Lanka, 07/2025) contre 25 M$ de plafond invoqué ; 1 478 conteneurs perdus en 2025 ; règlement pellets UE (maritime 2028) ; SOLAS 2026 crée pour la première fois un flux de données de pertes.
- Cible : 12 P&I clubs, assureurs corps et cargo, réassureurs, courtiers ; ports et pêcheurs (paramétrique) en V2.
- Produit : score par navire/route/cargaison (AIS, météo, courants, historique WSC/GISIS, zones sensibles, cargaison pellets), aide à la tarification, produits paramétriques (tempête → indemnité engins/cages aquacoles). Se nourrit des données de DriftBox (idée 1).
- Prix : 50-150 k€/an par assureur ; revenu par police.
- Effort : moyen à élevé (ML actuariel, données AIS payantes).
- Concurrence : aucun acteur « risque nurdle » ; doctrine des P&I clubs sans outil.

## 11. DiveLedger : preuve d'impact pour centres de plongée et flottes de loisir
- Déclencheur : PADI 6 600+ centres (+220 en 2025), SSI 4 000+, 23 M plongeurs actifs, 3,1 M certifications/an, marché nord-américain en recul → besoin de différenciation ; Dive Against Debris : 50 000 plongeurs, 1 M objets, mais aucun reporting daté par centre ; Water Revolution Foundation (superyachts) sans outil.
- Cible : centres de plongée et resorts, réseaux PADI/SSI (marque blanche B2B2C), aires marines protégées, OTA éco-responsables.
- Produit : app de log des sorties nettoyage, certificat/badge vérifiable par QR pour le client, statistiques par centre/région, API vers labels (Green Fins, Blue Flag) et OTA ; alimente CleanScore (idée 8) en données sous-marines.
- Prix : 300-900 €/an par centre ; freemium ; licence réseau.
- Effort : faible (app + base + certificats ; 2-3 mois-ingénieur).
- Concurrence : PADI AWARE (gratuit, non structuré) ; aucun acteur commercial. Marché petit (~10 000 centres × 600 € ≈ 6 M€ TAM) : idée « porte d'entrée », pas société entière.

## 12. EPR Atlas : conformité emballages plastique multi-juridictions (UE, USA, Asie)
- Déclencheur : PPWR (UE) 2025/40 applicable 12/08/2026 (sanctions notifiées 12/02/2027, mais Commission demande de ne pas sanctionner en 08/2026) ; Californie SB 54 (5 741 producteurs, enregistrement 01/06/2026, interdiction de vente 01/01/2027, 5 Md$ de fonds 2027-2037) + 6 autres États ; UK PPT £228,82/t (04/2026) et pEPR modulée 2026/27 ; Inde : QR code EPR + blocage douanier (07/2025) ; Philippines RA 11898 : 60 % (2026) → 80 % (2028), 1 017 entités ; Vietnam décret 110/2026 (25/05/2026) ; Singapour consigne 04/2026 ; Malaisie EPR volontaire 2026 ; Thaïlande 2027 ; Australie 2026.
- Cible : marques et distributeurs multi-pays (FMCG, cosmétique, électronique), en particulier celles produisant en Asie.
- Produit : moteur de règles multi-juridictions (définitions du recyclé, seuils, formats), calcul des éco-contributions, génération des déclarations par portail (CPCB, NEC, VEP Fund, CAA), alertes, simulation coût conformité vs contribution.
- Prix : 10-80 k€/an selon juridictions et SKU ; 5-15 k€/pays/an.
- Effort : faible à moyen (base réglementaire + moteur de règles ; veille LLM).
- Concurrence : marché déjà actif (rePurpose Global 500+ marques, Clearyst, Lappa, Recyda, Source Intelligence, Reverse Logistics Group, Circular Action Alliance) mais couverture Asie-Pacifique incomplète. Lien océan indirect (amont).

## Idées écartées ou fusionnées (et pourquoi)
- Robots de nettoyage hardware (Seabin, WasteShark, Jellyfishbot, Clearbot, BeBot) : marché encombré, faible différenciation, capital intensif → on vend le logiciel au-dessus (idée 6).
- Module ESRS E2/E4 microplastiques : périmètre CSRD réduit de ~90 % par l'Omnibus (seuil 1 000 salariés, 450 M€), E4 exemptée 2026-2027 → fusionné dans l'idée 5 (rapport CSRD).
- Copilote export de déchets Basel/PIC (Règlement 2024/1157 : interdiction d'export plastique hors OCDE au 21/11/2026) : cible étroite (négociants), lien océan indirect ; à garder en veille.
- Veille réglementaire plastique (USA 7 États) : produit d'information, faible barrière ; peut être un module de l'idée 12.
- Assurance paramétrique des engins de pêche et cages aquacoles : nécessite un porteur de risque ; fusionné comme V2 de l'idée 10.
- Marketplace de primes de récupération d'engins fantômes : fusionné comme V2 de l'idée 2.
- Traité mondial plastique : échec INC-5.2 (août 2025), pas de date de reprise → aucun levier fiable 2026-2028.
