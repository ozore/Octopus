# Mémoire de travail — agent plaisance-croisiere

## Compteur WebSearch
0 / 10 utilisées au départ.

## Plan de recherche
Secteurs cibles : marinas, chantiers navals de plaisance, charter/location, croisiéristes,
opérateurs d'excursion (baleines, plongée, pêche sportive), fabricants d'équipements nautiques,
assureurs.
Problèmes candidats à explorer : biofouling (encrassement biologique de coque), antifouling,
eaux grises/noires, bruit sous-marin, collisions avec la faune (baleines), mouillage (ancrage
sur Posidonie/herbiers), carburant, déchets, réglementation des excursions, certification/labels,
sinistres (assurance).

## Hypothèses de départ (à vérifier)
1. Biofouling : Californie (California State Lands Commission) impose des seuils de
   pourcentage de recouvrement de coque avant entrée en port — protocole déjà écrit.
2. Collisions baleines : Ocean Wise (Vancouver) gère déjà le WhaleReport Alert System (WRAS) ;
   Whale Safe (Benioff Ocean Science Laboratory, Santa Barbara) fait de la prévision acoustique.
   Concurrence existante à documenter précisément.
3. Mouillage sur Posidonie (Méditerranée, France/Espagne/Italie) : réglementation + appli Donia
   existante ; amendes de la gendarmerie maritime / parcs naturels marins.
4. Sinistres assurance plaisance : coût d'un expert maritime (marine surveyor) par sinistre,
   pénurie d'experts.
5. Marinas / eaux grises-noires / Clean Marina : programmes volontaires US (Clean Marina),
   logiciels de gestion de marina (Dockwa, Marina Master) et leurs prix.

## Recherches effectuées (log) — 10/10 WebSearch utilisées

1. "California biofouling management regulations vessel hull inspection percent cover threshold"
   → Rank 2 (léger) = macrofouling ≤5% de la surface immergée évaluée. CCR Titre 2 §2298 (California
   State Lands Commission, CSLC). Effectif 1er oct. 2017. Biofouling Record Book obligatoire à bord.
2. "Ocean Wise WhaleReport Alert System Whale Safe Benioff AI whale detection vessel strike"
   → WRAS (Ocean Wise, Vancouver) : >20 000 alertes envoyées, fusionne sightings citoyens +
   WhaleSpotter (infrarouge) + hydrophones (JASCO Applied Sciences, SMRU Consulting). Whale Safe
   (Benioff Ocean Science Laboratory, UC Santa Barbara) : IA acoustique+visuelle, Santa Barbara/SF.
   Concurrence forte et déjà institutionnelle sur la DÉTECTION — créneau produit doit être ailleurs
   (conformité/preuve, pas détection).
3. "réglementation mouillage Posidonie amende Méditerranée application Donia zones interdites ancrage"
   → Arrêté 1988 interdit destruction herbiers ; arrêtés préfectoraux maritimes depuis 2019
   (interdiction mouillage >24m, parfois >20m, extension via ZMEL). Appli Donia gratuite (cartographie
   fond marin temps réel). Amendes jusqu'à 150 000€ + préjudice écologique >100 000€ (versés à
   l'Agence de l'Eau Rhône Méditerranée Corse). Étude AIS+Donia montrant baisse des ancrages illégaux
   à creuser via WebFetch (source FNE PACA).
4. "marine insurance hull damage claim marine surveyor fee cost yacht survey report price"
   → Expertise assurance : 20-28$/pied ; achat : 25-35$/pied ; minimum 750-850$. Mise à sec pour
   inspection coque : 10-20$/pied. Expert plein jour ~1200$, demi-jour ~600$.
5. "marina management software pricing Dockwa Marina Master annual cost slip management"
   → Logiciels de gestion de marina : 150-2000$+/mois, la plupart 500-1500$/mois. Dockwa : % du CA +
   frais logiciel annuel (prix non public, sur devis).
6. "CLIA 2025 annual state of the industry report passengers environmental"
   → CLIA (Cruise Lines International Association) : 37,7M passagers océaniques 2025 (→41,9M en 2028),
   310 navires océaniques, 56 navires en commande jusqu'en 2036 (56,7 Md$).
7. "Pacific Whale Watch Association DFO Marine Mammal Regulations Southern Resident Killer Whale
   approach distance number of operators Salish Sea"
   → PWWA (Pacific Whale Watch Association) : 12 entreprises C.-B. + 16 État de Washington = 28
   opérateurs. DFO (Pêches et Océans Canada / Fisheries and Oceans Canada) : distance d'approche
   épaulards résidents du sud passée de 200m à 1000m (règlement 2026, Gazette du Canada). AIS
   (Automatic Identification System) obligatoire et actif sur chaque navire PWWA pendant les sorties.
8. "NOAA Whale SENSE program commercial whale watching operators number participating logbook
   requirement"
   → Whale SENSE (NOAA Fisheries, programme volontaire) : >30 entreprises Atlantique+Alaska, >15 en
   Alaska seul. Évaluation par visites au quai, "secret shopper", retours passagers — pas de mention
   explicite d'un logbook numérique obligatoire (à vérifier via WebFetch).
9. "bareboat charter fleet Mediterranean Croatia Greece security deposit damage dispute AI startup
   insurance"
   → Caution location bareboat : 2500-5000€ bloqués (bateaux ~50 pieds). Assurance caution (damage
   waiver) non remboursable ~10% de la somme assurée. Aucun concurrent IA identifié sur ce point
   précis.
10. "startup AI marine insurance claims photo damage assessment boat yacht 2025"
    → Vision par ordinateur déjà utilisée par des assureurs marins généralistes/cargo (articles
    sectoriels 2025 : AutomationEdge, WorkBoat, EONSR, Zentis.ai) mais seulement ~20% des grands
    assureurs déploient de l'IA au-delà de l'automatisation basique ; rien de spécifique identifié
    pour la plaisance/petits assureurs nautiques indépendants → lacune probable.

## WebFetch effectuées
(à remplir)

## Sources mortes / échecs
(à remplir)

## Leçons
- Les recherches groupées par lot de 3-4 (parallèles) ont permis de couvrir les 10 requêtes en 3
  appels d'outil. Prioriser tôt les requêtes à forte incertitude (chiffres, seuils réglementaires).
- Pour la détection de baleines, la niche est déjà occupée par des acteurs institutionnels
  (Ocean Wise, Benioff/UCSB) — le produit doit viser la conformité/preuve documentaire pour
  l'opérateur individuel, pas un nouveau système de détection concurrent.
