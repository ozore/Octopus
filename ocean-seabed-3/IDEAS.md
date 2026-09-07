# Passe 3 : douze idées nouvelles pour la préservation des fonds marins

Synthèse de l'orchestrateur à partir des huit dossiers de `agents/*/dossier.md` (7 septembre 2026). Aucune des vingt-quatre idées des passes 1 et 2 n'est reprise. Chaque idée est une société à part entière : produit logiciel plus matériel du commerce, IA au cœur ou en accélérateur, premier client joignable depuis Vancouver ou à distance, « pourquoi maintenant » daté. Scores provisoires /35 (sept axes /5 : urgence, cible captive, prix, facilité technique, vide concurrentiel, IA et donnée, impact fonds marins), à réviser après les trois critiques.

Trois familles : A. Mouillage, dragage et échouements (prévention des dégâts) ; B. Surveillance des habitats ; C. Restauration et preuve.

---

## 1. ScarMap : cicatrices d'ancre et geofencing des herbiers et récifs (famille A)
- **Déclencheur daté** : Florida Keys National Marine Sanctuary, Restoration Blueprint, règle finale publiée le 17/01/2025 (Federal Register 2025-00496) : ancrage interdit dans toutes les Sanctuary Preservation Areas d'ici 2027, bouées obligatoires (plus de 500 bouées déjà en place). Côté Salish Sea, aucune obligation canadienne (recommandations PSF et Northwest Straits seulement), mais pression documentée sur les mouillages des îles Gulf (Canada's National Observer, 26/06/2026) et suivi manuel annuel de la zostère par Mayne Island Conservancy.
- **Problème** : les gestionnaires de parcs et de marinas ne savent ni où les ancres raclent, ni si les cicatrices se referment ; la surveillance repose sur des patrouilles et des plongées bénévoles.
- **Cible** : Parcs Canada (Gulf Islands National Park Reserve), Islands Trust, 30 à 50 marinas et autorités de mouillage des îles Gulf et de Puget Sound (estimation), FKNMS et les centaines d'opérateurs de charter des Keys, parcs marins californiens (réseau de 124 AMP).
- **Produit** : (1) cartographie des herbiers et récifs à partir de Sentinel-2 et Planet (10 m et 3 m, capacité vérifiée jusqu'à 10 m de profondeur en eau claire, dégradée en eau turbide) validée par drone et plongée ; (2) détection de changement sur images de plongée et de drone pour mesurer les cicatrices d'ancre entre deux relevés (détecteur RF-DETR, Apache 2.0, affiné sur un jeu de cicatrices annotées : c'est l'actif) ; (3) application plaisancier avec geofencing et bouées disponibles, gratuite, financée par le gestionnaire ; (4) tableau de bord et rapport annuel automatique.
- **Prix et modèle** : 300 à 800 $ CAD par mois par gestionnaire ; rapport annuel de suivi 3 000 à 8 000 $ ; licence de données aux agences (PSF, MPO, NOAA).
- **Effort** : moyen, 4 à 6 mois-ingénieur ; matériel : drone grand public, GoPro, BlueROV2 (4 900 $ US).
- **Concurrence** : Donia (Andromède, Méditerranée, grand public) ; aucune application « cicatrices » commerciale identifiée ; risque : NOAA équipe le FKNMS avec ses propres moyens.
- **Premier client** : Mayne Island Conservancy ou Islands Trust (moins de 2 h en traversier), puis Parcs Canada.
- Scores provisoires : urgence 4, cible 3, prix 3, facilité 4, vide 4, IA 4, impact 4 = 26.

## 2. PosidoniaProof : preuve horodatée de mouillage pour ports, ZMEL et assureurs en Méditerranée (famille A)
- **Déclencheur daté** : jugement du Tribunal maritime de Marseille du 22/11/2024 (présomption de préjudice écologique dès qu'un mouillage illégal sur posidonie est constaté ; amendes 15 000 à 150 000 € plus préjudice) ; Real Decreto 191/2026 espagnol (mars 2026) interdisant l'ancrage sur posidonie et Cymodocea dans toutes les eaux méditerranéennes espagnoles ; plus de 179 000 bateaux ont mouillé sur des herbiers méditerranéens en 2024, dont environ 45 % de plus de 24 m (WWF).
- **Problème** : les gestionnaires de zones de mouillage (ZMEL), les ports de plaisance et les assureurs de yachts n'ont aucune preuve horodatée distinguant mouillage autorisé et mouillage sauvage, ni pour sanctionner, ni pour se défendre.
- **Cible** : plusieurs centaines de ports, AMP et ZMEL de Méditerranée occidentale (France, Baléares avec 9 champs de bouées, Italie), assureurs plaisance, sociétés de charter.
- **Produit** : récepteur AIS (100 à 300 $) et caméra marine fixe du commerce sur le site, croisement en continu avec la cartographie officielle des herbiers (Donia, Medtrix, cartes Natura 2000), détection IA de position d'ancrage et de durée, rapport de conformité ou de constat horodaté, géolocalisé et signé, exploitable devant le Tribunal maritime.
- **Prix et modèle** : 300 à 1 500 $ par mois par site selon le nombre de bouées ; dossier de preuve 500 à 2 000 $ ; abonnement assureur.
- **Effort** : moyen à élevé, 4 à 6 mois-ingénieur ; vente à distance, francophone.
- **Concurrence** : Donia (cartographie et alerte grand public, 24,99 € par an), bureaux d'études (Andromède, GIS Posidonie) ; pas de couche preuve B2B identifiée. Risque : le RGPD et la surveillance de personnes à bord.
- **Premier client** : gestionnaire d'une ZMEL du Var ou compagnie d'assurance plaisance, à distance ; pilote possible sur les marinas de Vancouver pour la technique.
- Scores : urgence 4, cible 3, prix 3, facilité 3, vide 4, IA 3, impact 4 = 24.

## 3. PlumeWatch : panaches de dragage contre seuils de permis, en continu (famille A)
- **Déclencheur daté** : dragage de Port Everglades suspendu en juillet 2025 et procès déposé le 06/08/2026 par Earthjustice (reprise prévue automne 2026) ; critical habitat élargi des coraux caraïbes (règle finale 09/08/2023) et indo-pacifiques (15/07/2025), qui déclenche la consultation Section 7 pour tout dragage fédéral ; seuils USACE de turbidité (9 NTU au-dessus du bruit de fond, 5 à 10 NTU près des coraux et herbiers) encore suivis sur formulaires manuels.
- **Problème** : les maîtres d'ouvrage et dragueurs découvrent le dépassement après coup, dans la plainte ; les plaignants utilisent déjà Sentinel-2.
- **Cible** : quelques dizaines de grands projets de dragage par an aux États-Unis (districts USACE de Jacksonville, San Francisco, Los Angeles), entrepreneurs de dragage, autorités portuaires (Everglades, Miami, Canaveral, Long Beach), et le Port de Vancouver (dragage d'entretien du Fraser) comme site pilote.
- **Produit** : bouées de turbidité du commerce (500 à 2 000 $ pièce) en réseau, détection de panache sur Sentinel-2 et Planet, fusion in situ et satellite, comparaison automatique au seuil du permis et au panache modélisé, journal horodaté et rapport exportable pour l'USACE et le NMFS, alerte temps réel au capitaine de la drague.
- **Prix et modèle** : 1 000 à 5 000 $ par mois par chantier pendant les travaux ; location des capteurs ; licence de données aux assureurs de chantier.
- **Effort** : moyen, 4 à 6 mois-ingénieur ; capteurs et imagerie existants, valeur dans la fusion et le gabarit réglementaire.
- **Concurrence** : Sofar Ocean (bouées Spotter, turbidité citée dans ses cas d'usage, prix non public), bureaux d'études au projet. Risque : le dragueur ne veut pas d'une preuve contre lui ; vendre au port ou à l'assureur.
- **Premier client** : Vancouver Fraser Port Authority pour un pilote technique ; premier client payant en Floride via un cabinet ou un consultant EFH.
- Scores : urgence 4, cible 3, prix 4, facilité 3, vide 3, IA 3, impact 3 = 23.

## 4. ReefInjury : mesure photogrammétrique des dommages d'échouement et calcul du barème (famille A)
- **Déclencheur daté** : Florida Coral Reef Protection Act, Fla. Stat. §403.93345 : barème civil par m² (150 $ jusqu'à 1 m², 300 $ par m² de 1 à 10 m², 1 000 $ par m² au-delà, doublé, triplé, quadruplé en récidive, plafond 250 000 $ par incident), notification sous 24 h et retrait du navire sous 72 h ; Kristin Jacobs Coral Aquatic Preserve établie le 01/07/2024 ; budget d'État FCR3 coupé à 0 $ en 2026 (28,5 M$ distribués 2023-2025), ce qui pousse l'État vers les recettes de pénalités.
- **Problème** : la surface endommagée est mesurée en plongée, lentement, et contestée ; assureurs (P&I) et avocats maritimes n'ont pas de référentiel.
- **Cible** : FDEP et les 5 comtés concernés (Monroe, Miami-Dade, Broward, Palm Beach, Martin), FKNMS, P&I clubs, cabinets d'avocats maritimes de Floride ; plus tard Hawaï, Porto Rico, USVI.
- **Produit** : kit caméra 360 ou GoPro plus BlueROV2, pipeline photogrammétrique (COLMAP, Meshroom, Gaussian splatting sous-marin 2025 en option) pour reconstruire la zone en 3D, segmentation IA corail vivant, mort et substrat cassé (CoralSCOP, CVPR 2024), mesure de surface défendable, rapport standardisé avec calcul automatique du barème, base d'incidents comparables.
- **Prix et modèle** : 2 000 à 6 000 $ par expertise ; licence 5 000 à 15 000 $ par an pour les agences ; abonnement assureurs.
- **Effort** : moyen à élevé, 5 à 7 mois-ingénieur ; compétence plongeur du fondateur directement utile.
- **Concurrence** : évaluateurs mandatés au cas par cas, laboratoires universitaires (Nova Southeastern) ; pas de logiciel dédié identifié. Lacune : nombre annuel d'incidents sanctionnés en Floride inconnu.
- **Premier client** : cabinet d'avocats maritimes ou P&I club, à distance ; validation technique sur une épave connue près de Vancouver.
- Scores : urgence 3, cible 4, prix 4, facilité 3, vide 4, IA 4, impact 3 = 25.

## 5. SedimentIQ : conformité benthique automatique sous les fermes aquacoles (famille B)
- **Déclencheur daté** : Aquaculture Activities Regulations (MPO) : surveillance benthique obligatoire à l'apogée de production ; fonds durs notés sur vidéo ROV (couverture de Beggiatoa et d'espèces opportunistes, seuil dépassé si plus de 10 % sur plus de 4 des 6 segments, zone 100 à 124 m), fonds meubles par sulfures (1 300 et 700 µmol) ; 40 à 50 fermes par an en Colombie-Britannique, 80 à 90 % sous les seuils ; licences renouvelées jusqu'au 30/06/2029 puis fin annoncée des cages ouvertes, donc suivi de la récupération des sites démantelés de 2026 à 2029 et au-delà. Écosse (SEPA), Norvège (NS 9410) et Chili (réforme 2026, 1 398 concessions) comme extension.
- **Problème** : l'annotation de la vidéo est manuelle, lente, peu comparable entre bureaux d'études ; la remise en charge d'un site est bloquée tant que la récupération n'est pas démontrée.
- **Cible** : Mowi, Grieg, Cermaq et leurs bureaux d'études en Colombie-Britannique (Hatfield, Dynamic Ocean Consulting à Port Moody), puis Écosse et Chili.
- **Produit** : segmentation IA de la couverture bactérienne et des opportunistes sur vidéo ROV (caméra existante du client), génération du rapport au format MPO ou SEPA, base longitudinale par site avec trajectoire de récupération.
- **Prix et modèle** : 300 à 800 $ CAD par mois par ferme ou 500 à 1 500 $ par rapport ; licence de données au MPO.
- **Effort** : moyen, 4 à 5 mois-ingénieur ; jeu d'entraînement Beggiatoa à constituer avec un bureau d'études.
- **Concurrence** : aucun logiciel dédié identifié ; bureaux d'études en interne. Risque : clientèle concentrée (trois groupes) et marché canadien qui se ferme en 2029 (d'où l'Écosse).
- **Premier client** : Dynamic Ocean Consulting (30 min de Vancouver) ou Hatfield.
- Scores : urgence 4, cible 4, prix 3, facilité 4, vide 4, IA 4, impact 3 = 26.

## 6. KelpPulse : suivi du kelp et de la zostère, satellite, drone et plongée (famille B)
- **Déclencheur daté** : Washington SB 5619 (signé mars 2022, RCW 79.135.440) : conserver ou restaurer 10 000 acres de kelp et de zostère d'ici 2040 avec rapport biennal ; seulement 5 500 acres prioritaires identifiés en décembre 2024 ; Oregon : 900 acres de bull kelp perdus depuis 2010, 2,521 M$ obtenus (FY2024) pour 3 sites en 2025 et 3 en 2026 ; Californie : OPC jusqu'à 5,94 M$ pour le kelp (2023-2025) ; Help Our Kelp Act (proposition 2025, 5 M$ par an, non adoptée) ; carbone bleu kelp : aucune méthodologie acceptée (Frontiers 2026), donc la donnée de référence est le goulot.
- **Problème** : le suivi repose sur des plongées scientifiques manuelles et des cartes annuelles bénévoles ; les barrens d'oursins ne sont pas détectés à temps.
- **Cible** : Washington DNR, Oregon Kelp Alliance, Kelp Rescue Initiative, Ocean Wise, SeaChange, Project Watershed, OPC et ONG californiennes ; 30 à 80 sites de restauration actifs dans le Pacifique Nord-Ouest (estimation).
- **Produit** : détection de canopée sur Sentinel-2 et Planet (capacité vérifiée pour le kelp de surface, limitée en eau turbide), drones grand public pour la validation, protocole de plongée standardisé pour les zones profondes, IA de classification kelp, zostère, barrens d'oursins, base longitudinale et rapport biennal automatique.
- **Prix et modèle** : 500 à 1 500 $ CAD par mois par organisme ; pilote 20 à 50 k$ pour un rapport régional ; licence de série temporelle.
- **Effort** : élevé, 5 à 7 mois-ingénieur ; peu de modèles ouverts pour Nereocystis et Zostera (les jeux ouverts sont tropicaux) : barrière réelle.
- **Concurrence** : KelpWatch (Landsat, académique, site inaccessible), Hakai Institute (recherche), aucun produit commercial identifié.
- **Premier client** : SeaChange ou Project Watershed (moins de 3 h), puis Washington DNR avant le prochain rapport biennal.
- Scores : urgence 3, cible 3, prix 3, facilité 3, vide 4, IA 5, impact 5 = 26.

## 7. BenthicPipe : annotation IA de la vidéo benthique pour l'éolien en mer et les câbles (famille B)
- **Déclencheur daté** : norme MMO « Standardisation of Post-Consent Environmental Monitoring for Wind Farms in English Waters » publiée le 16/07/2025, mise à jour le 09/03/2026, applicable aux 11,7 GW en construction au Royaume-Uni et inscrite dans les Marine Licences ; BOEM Benthic Habitat Guidelines (deux ans de données pré-construction recommandés) ; BOEM a suspendu les nouveaux baux et résilié les Wind Energy Areas en juillet 2025 (marché américain gelé) ; coût estimé d'un relevé benthique complet pour 1 GW : environ 1,2 M£.
- **Problème** : la vidéo tractée (DDV) et ROV est annotée à la main chez les bureaux d'études ; la norme impose un format sans fournir d'outil.
- **Cible** : Fugro, APEM, Ocean Ecology, Gardline, ABPmer, Natural Power et leurs équivalents (dizaines de bureaux d'études au Royaume-Uni, mer du Nord, France), développeurs de parcs, poseurs de câbles.
- **Produit** : plateforme d'annotation semi-automatique (détection d'espèces indicatrices et de substrat, modèles affinés sur BenthicNet, 887 533 annotations, et données propres), export au format MMO et BOEM, comparaison avant, pendant, après.
- **Prix et modèle** : 2 à 5 $ par minute de vidéo annotée ou 2 000 à 8 000 $ par relevé ; marque blanche.
- **Effort** : élevé, 5 à 7 mois-ingénieur ; données d'entraînement à négocier avec un premier bureau d'études.
- **Concurrence** : BIIGLE (gratuit, académique), VIAME (gratuit, boîte à outils), SQUIDLE+ ; aucun n'est positionné conformité MMO. Risque : Fugro et APEM développent en interne.
- **Premier client** : bureau d'études britannique à distance ; Hatfield à Vancouver comme point d'entrée nord-américain.
- Scores : urgence 4, cible 3, prix 4, facilité 3, vide 3, IA 5, impact 3 = 25.

## 8. SpongeSentinel : alertes de chalutage et de mouillage dans les petites AMP et les zones VME (famille B)
- **Déclencheur daté** : amende de 33 596 $ CAD (24/05/2024) pour pêche illégale dans l'AMP des récifs d'éponges siliceuses de Hecate Strait ; réseau d'AMP du plateau Nord (30 493 km², catégorie 1 en 2025, catégorie 2 en 2030, 16 Premières Nations) ; Royaume-Uni : 377 AMP dont 38 protégées du chalutage, restriction ciblée sur environ 30 000 km² annoncée le 09/09/2025 ; plan d'action UE : chalutage de fond hors de toutes les AMP d'ici 2030 ; zones VME fermées depuis le 15/09/2022 (règlement 2022/1614) ; API Global Fishing Watch gratuite, 70 000 navires.
- **Problème** : les petits gestionnaires d'AMP, les gardiens autochtones et les organisations de producteurs n'ont pas d'alerte locale exploitable ; OceanMind et Skylight visent les gouvernements.
- **Cible** : bureau régional Pacifique du MPO (Vancouver), programmes de gardiens des Premières Nations, parcs marins provinciaux, Rockfish Conservation Areas près de Steveston, ONG européennes de contentieux (Oceana, ClientEarth), organisations de producteurs de pêche profonde ; 15 à 25 organismes en Amérique du Nord (estimation).
- **Produit** : couche sur l'API Global Fishing Watch et un récepteur AIS local (AISHub), polygones des zones fermées et des récifs d'éponges, modèle de comportement (vitesse et trajectoire de chalutage, mouillage prolongé), alertes, journal exportable ; option SAR commercial (ICEYE, prix non public) pour les navires sans AIS.
- **Prix et modèle** : 150 à 800 $ CAD par mois par zone ; 40 à 80 k$ par an pour un consortium ; flux de preuve pour assureurs et certificateurs.
- **Effort** : faible à moyen, 2 à 4 mois-ingénieur ; barrière dans les polygones validés et l'historique.
- **Concurrence** : Global Fishing Watch (gratuit, généraliste), Skylight (gratuit pour certains gestionnaires), OceanMind. Risque : le MPO a son propre système VMS ; les incursions courtes échappent à l'AIS.
- **Premier client** : MPO Pacifique (Vancouver même) ou une association de gestion de parc marin provincial.
- Scores : urgence 3, cible 3, prix 3, facilité 5, vide 2, IA 3, impact 4 = 23.

## 9. DiveAtlas : réseau de plongeurs, IA d'espèces et hydrophones pour l'atlas benthique du Pacifique Nord-Ouest (famille B)
- **Déclencheur daté** : politique de compensation d'habitat republiée en 2025 (mise à jour 25/05/2026) et réseau d'AMP du plateau Nord (2025, 2030) qui augmentent la demande de données benthiques indépendantes ; crabe vert européen et tuniciers envahissants sur la côte Pacifique ; Bloomberg Ocean Initiative (260 M$, juin 2026) tourné vers l'efficacité de gestion des AMP (3,3 % de l'océan effectivement géré contre 9,9 % désigné).
- **Problème** : les plongeurs de loisir produisent des milliers de photos sans protocole ; les gestionnaires manquent de données à faible coût entre deux relevés scientifiques.
- **Cible** : les deux clubs du fondateur, une dizaine de clubs et boutiques du Grand Vancouver et de Puget Sound, Ocean Wise, Hakai, MPO, BC Parks ; à terme 6 600 centres PADI et 346 opérations Green Fins.
- **Produit** : application de saisie post-plongée (photo-quadrat guidé), reconnaissance d'espèces indicatrices et envahissantes affinée sur données locales (RF-DETR, CoralSCOP pour les tropiques), hydrophones bas coût (50 € pièce) sur bouées de club pour un indice acoustique continu, atlas régional, alertes aux gestionnaires, licence de données.
- **Prix et modèle** : 100 à 300 $ CAD par mois par club, gratuit pour le plongeur ; licence de données 10 à 40 k$ par an aux agences.
- **Effort** : moyen à élevé, 4 à 6 mois-ingénieur ; jeu de données local à constituer soi-même (c'est l'actif).
- **Concurrence** : iNaturalist, Reef Check (protocole EcoDiver lourd), ReefCloud et CoralNet (tropicaux, gratuits) ; rien de régional avec alertes réglementaires. Risque : clubs bénévoles peu solvables.
- **Premier client** : les deux clubs de plongée (0 h).
- Scores : urgence 2, cible 4, prix 2, facilité 4, vide 3, IA 5, impact 4 = 24.

## 10. OffsetLedger : MRV de la compensation d'habitat et des banques d'habitat (famille C)
- **Déclencheur daté** : politique de compensation de la Loi sur les pêches republiée en 2025 (mise à jour 25/05/2026) : « aucune perte nette », suivi documenté, garanties financières saisissables ; Roberts Bank Terminal 2 approuvé en 2023 avec 370 conditions, 177 ha détruits pour 86 ha compensés hors site, construction 2024-2030 ; Floride : crédits de mitigation banks à 30 000 à 360 000 $ par acre ; Verra Nature Framework éligible aux crédits depuis le 01/04/2025.
- **Problème** : la reprise d'un site de compensation se prouve par relevés manuels pluriannuels, chers et peu comparables ; le promoteur risque sa caution, le régulateur manque de preuve indépendante.
- **Cible** : 15 à 30 projets actifs par an en Colombie-Britannique nécessitant un suivi pluriannuel (estimation), bureaux d'études (Dynamic Ocean, Hemmera, Stantec), Port de Vancouver, opérateurs de mitigation banks en Floride et Californie (dizaines).
- **Produit** : caméras fixes et ROV du commerce, eDNA sous-traité (150 à 500 $ CAD par échantillon, estimation), IA de couverture de zostère et d'espèces indicatrices, registre des crédits d'habitat et rapports au format MPO ou USACE, horodatés et géoréférencés par parcelle.
- **Prix et modèle** : pilote 15 à 80 k$ CAD par site ; 500 à 2 000 $ par mois par bureau d'études ou par bank.
- **Effort** : moyen à élevé, 5 à 7 mois-ingénieur.
- **Concurrence** : bureaux d'études au service ; aucune plateforme MRV marine canadienne identifiée. Lacune : politique des banques d'habitat (2021) introuvable, nombre de banques actives inconnu.
- **Premier client** : Dynamic Ocean Consulting (Port Moody) ou Project Watershed (Comox).
- Scores : urgence 3, cible 4, prix 5, facilité 3, vide 4, IA 3, impact 4 = 26.

## 11. ColonyTrack : re-identification de colonies et preuve de restauration pour bailleurs et sponsors (famille C)
- **Déclencheur daté** : Floride : FCR3 coupé à 0 $ en 2026 après 28,5 M$ distribués à 14 organisations (2023-2025), donc chaque dollar doit être justifié ; NFWF Coral Reef Stewardship Fund (3,5 M$ par cycle, 80 à 600 k$ par projet) exige plans de suivi et données spatiales géoréférencées ; CRCA réautorisée (45 M$ par an autorisés FY2023-2027) avec bascule vers des block grants ; Mars Sustainable Solutions vise 185 000 m² restaurés d'ici 2029 sur 72 sites ; Coral Gardeners (Rolex) vise 1 M de coraux plantés ; mortalité 89 à 100 % des elkhorn sauvages et restaurés dans les Keys après l'été 2023.
- **Problème** : la survie et la croissance des coraux transplantés sont comptées à la main, colonie par colonie, dans des tableurs ; les bailleurs et sponsors n'ont pas de preuve tierce comparable ; les logiciels gratuits (MERMAID, ReefCloud, CoralNet) ne suivent pas une colonie dans le temps.
- **Cible** : les 14 organisations floridiennes ex-FCR3 (Reef Institute, Reef Renewal USA, I.CARE, Mote, CRF), quelques centaines d'organisations de restauration dans le monde, sponsors corporate (Mars, Rolex, hôtels, croisiéristes), bailleurs.
- **Produit** : capture vidéo en plongée (GoPro, caméra 360), photogrammétrie (COLMAP) et splatting sous-marin (littérature 2025), re-identification visuelle des colonies entre campagnes, survie, croissance, blanchissement (pas de diagnostic SCTLD par photo : non démontré scientifiquement), rapports au format NFWF, CRCP et sponsor.
- **Prix et modèle** : 150 à 600 $ par mois par site ; rapport annuel 2 000 à 5 000 $ ; campagne pour sponsor 500 à 2 000 $ par mois par site.
- **Effort** : élevé, 5 à 7 mois-ingénieur ; capacité de mesure de croissance par 3D « supposée », à valider par pilote contre mesure manuelle.
- **Concurrence** : Coral Vita et Reefgen (restauration, pas preuve tierce), Agisoft et Pix4D (génériques, 3 499 $ et 3 990 $ par an), MERMAID (gratuit, pas de colonie). Différent de GrantMRV : la valeur est dans la mesure 3D, pas dans le formulaire.
- **Premier client** : I.CARE (Islamorada, 585 k$ historiques) à distance ; Coral Gardeners via le réseau de plongée.
- Scores : urgence 4, cible 4, prix 3, facilité 2, vide 4, IA 5, impact 4 = 26.

## 12. SeafloorLedger : intégrité des fonds marins et plans de restauration pour l'Europe (famille C)
- **Déclencheur daté** : règlement (UE) 2024/1991 sur la restauration de la nature (en vigueur 18/08/2024) : projets de plans nationaux dus le 01/09/2026, 7 États sur 27 à jour et 20 en retard au 02/09/2026 (dont l'Italie) ; objectifs 20 % des habitats marins dégradés restaurés en 2030, 60 % en 2040, 90 % en 2050, annexe II (posidonie, maërl, récifs, fonds meubles) ; DCSMM descripteur D6 : seuil de perte D6C4 (2 %) adopté en juin 2023, seuil de perturbation D6C5 toujours non adopté en 2026 ; plan d'action pêche : chalutage hors AMP d'ici 2030 ; plus de 3 000 sites Natura 2000 marins.
- **Problème** : les administrations et les ONG de contentieux n'ont pas de mesure indépendante et comparable de la perte et de la perturbation des habitats benthiques par zone d'évaluation.
- **Cible** : ONG (Oceana Europe, ClientEarth, Seas At Risk), bureaux d'études mandatés par les 20 États en retard, agences nationales (OFB, JNCC), Commission.
- **Produit** : empreinte du chalutage dérivée de l'AIS (Global Fishing Watch) croisée avec les cartes d'habitats EMODnet et EUNIS, détection de changement satellite et sonar pour les habitats peu profonds, indicateurs D6C3 et D6C4 par zone, suivi des objectifs 2030 à 2050 par habitat annexe II, rapport au format Commission.
- **Prix et modèle** : rapport de contentieux 10 à 30 k$ ; 800 à 3 000 $ par mois par zone pour une administration ; pilote pays 15 à 80 k$ avec un bureau d'études.
- **Effort** : moyen à élevé, 5 à 7 mois-ingénieur ; données publiques, valeur dans la méthode et la comparabilité.
- **Concurrence** : JRC et ICES (publics), ERM, Ramboll, RSK (conseil), Marine Conservation Institute (rapports ponctuels). Risque : cycle de vente public long ; vendre d'abord aux ONG.
- **Premier client** : Oceana Europe ou ClientEarth à distance, rapport pilote sur une zone britannique ou espagnole.
- Scores : urgence 4, cible 3, prix 3, facilité 3, vide 3, IA 3, impact 4 = 23.

---

## Idées vues mais non retenues (et pourquoi)
- **ReefTrigger** (couche de données pour assurance paramétrique de récif et de kelp) : classe d'actif réelle (MAR Fund, 6e placement 2026-2027, 12 aires ; Hawaï doublé en 2025) mais 2 à 3 acheteurs dans le monde et aucun programme américain ni kelp ; trop lent pour un bootstrap. Piste de licence de données pour SpongeSentinel et KelpPulse.
- **PosidoniaCarbon** (MRV carbone bleu posidonie, label bas-carbone avril 2023, ARCHIPEL 2025) : une dizaine de projets, standard non verrouillé ; module possible de SeafloorLedger ou de PosidoniaProof.
- **MPA Proof** (suite de preuve d'efficacité pour gestionnaires d'AMP, Bloomberg 260 M$ juin 2026, GFCR 400 organisations) : besoin réel mais volonté de payer faible et produit trop proche de DiveAtlas plus SpongeSentinel.
- **Coastal Nature Score** (scoring TNFD de portefeuilles côtiers pour banques) : 733 organisations engagées TNFD, blue bond Banco Bolivariano lié à des KPI ; vente longue à des banques, données de fond marin trop indirectes pour un fondateur seul.
- **TaxeRécif Verify** (audit des redevances récifales) : douzaine de juridictions, risque de sous-déclaration non documenté ; fiscalité plus qu'océan.
- **ReefFundOS** (veille et rédaction de subventions pour ONG post-FCR3) : trop proche de GrantMRV (passe 2), pas de matériel ni de donnée de terrain.
- **ProtocolBridge** (traduction AGRRA, GCRMN, Natura 2000) : pas de « pourquoi maintenant » daté ; MERMAID couvre déjà une partie.
- **ESRS E4 marin** : Omnibus réduit le champ d'environ 80 %, texte final non stabilisé.
- **Offshore Wind sensors** (capteurs sur protections anti-affouillement) : logistique en mer hors budget ; couvert par BenthicPipe côté logiciel.
- **SplatReef** et **SoundReef** : intégrés respectivement dans ColonyTrack et DiveAtlas.
