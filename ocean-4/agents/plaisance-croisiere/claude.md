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

## WebFetch effectuées (libres, non comptées dans le quota)

Réussies (contenu exploitable) :
- fnepaca.fr/.../jurisprudence-en-construction → BLOQUÉ ("Access Denied", voir sources mortes)
- whalesense.org/resources/atlantic/whale-sense-requirements → 404 (voir sources mortes)
- gazette.gc.ca/.../reg2-eng.html → seuils SRKW 200m actuel / 1000m proposé, aucun coût de
  conformité additionnel anticipé pour l'industrie (texte officiel, très utile).
- ocean.org WRAS FAQ → fonctionnement WRAS confirmé, aucune mention de clients payants ni de
  rapport de conformité par entreprise.
- marinas.dockwa.com pricing → grille tarifaire détaillée par module (169-249$/mois), aucun module
  environnemental.
- boatcible.com mouillage-interdit-2026 → montants d'amendes détaillés (1500€/15000€/150000€),
  seuils de taille (>24m, >8m), moyens de surveillance (drones, plongeurs, AIS, patrouilles
  quotidiennes juin-sept).
- whalesense.org/about/ → critères S-E-N-S-E, pas de détail sur logbook numérique.
- law.cornell.edu 2-CCR-2298.3 → contenu du Biofouling Management Plan (références IMO 2011),
  pas de tableau de rangs/seuils dans cette section précise.
- rivieramm.com 99-pass-california-biofouling → chiffres clés : 2515 navires assujettis
  (août2018-juil2019), 500+ inspectés, 99% conformité, 44%/72%/22% types de manquements, autorité
  = CSLC/MISP (Marine Invasive Species Program).
- dfo-mpo.gc.ca watching-observation → distances officielles 100m/200m/400m/1000m/50m selon
  zone/espèce, amende Loi sur les pêches jusqu'à 100 000$ CAD.
- floridadep.gov/rcp/clean-marina et .../steps-designation → programme volontaire, CMAP (Clean
  Marina Action Plan) = autoévaluation, seuil 100% réglementaire + 60% BMP, renouvellement 5 ans.

## Sources mortes / échecs

- premar-mediterranee.gouv.fr (PDF dossier de presse mouillage) → PDF non exploitable par
  WebFetch (contenu encodé/police intégrée) ; tenté aussi via Read local, échec (pdftoppm/poppler
  absent de l'environnement).
- slc.ca.gov guidance doc biofouling (PDF) → même échec (PDF image/police non extractible).
  → CONSÉQUENCE : le seuil précis "Rang 2 ≤5%" reste non recroisé avec le texte réglementaire
  primaire ; il vient uniquement d'une synthèse de moteur de recherche (à vérifier en priorité).
- epa.gov/npdes/stormwater-discharges-marinas → 404 (URL probablement inexacte).
- fisheries.noaa.gov/national/marine-mammal-protection/marine-life-viewing-guidelines → 404.
- whalesense.org/resources/atlantic/whale-sense-requirements → 404.
- fnepaca.fr jurisprudence page → Access Denied (protection anti-bot). Contournée en partie via
  boatcible.com qui reprend des chiffres similaires.

## Leçons

- Les recherches WebSearch groupées par lot de 3-4 (parallèles) ont permis de couvrir les 10
  requêtes autorisées en seulement 4 appels d'outil (3+3+4). Prioriser tôt les requêtes à forte
  incertitude (chiffres, seuils réglementaires) car le quota est fixe et non renouvelable.
- Pour la détection de baleines, la niche "alerte/détection" est déjà occupée par des acteurs
  institutionnels gratuits (Ocean Wise/WRAS, Benioff Ocean Science Laboratory/Whale Safe) — un
  produit payant doit viser la conformité/preuve documentaire par opérateur individuel (défense
  juridique, assurance), pas un nouveau système de détection concurrent.
- Les PDF réglementaires officiels (préfecture maritime, CSLC) sont souvent des documents scannés
  ou avec polices intégrées non extractibles par WebFetch, et `pdftoppm`/poppler n'est pas installé
  dans cet environnement pour le fallback via Read. Pour une prochaine passe : préférer les pages
  HTML qui *citent* ces PDF (articles spécialisés, Cornell Law) plutôt que les PDF eux-mêmes.
  Anticiper aussi les 403/404 sur les URL "devinées" sans passer par une recherche — le taux
  d'échec observé ici était d'environ 40% (6 échecs sur 15 WebFetch tentées).
- Le texte réglementaire CSLC vérifié cible les navires "capable of carrying ballast water" — cela
  oriente le candidat biofouling vers les croisiéristes/flottes commerciales plutôt que vers la
  plaisance légère ; à ne pas présenter comme acquis pour les yachts sans vérification NZ/Australie.
- Le brief demandait explicitement les offres d'emploi "environnement" et les appels d'offres
  publics comme sources prioritaires : faute de quota WebSearch restant, cette piste n'a pas été
  investiguée cette session — lacune assumée et documentée dans dossier.md.

---

## Résumé final (≤10 lignes)

10/10 WebSearch utilisées + ~15 WebFetch (6 échecs : 2 PDF illisibles, 3 pages 403/404, 1 accès
bloqué). Population cadrée : croisiéristes (CLIA, 310 navires/37,7M passagers 2025), opérateurs
baleines (28 PWWA + 30+ Whale SENSE), marinas (logiciels 150-2000$/mois sans module environnement),
charter Méditerranée (caution 2500-5000€), assureurs (expertise 20-35$/pied). 5 candidats retenus
dans dossier.md : (1) carnet de preuve de conformité baleines (DFO/PWWA), (2) copilote biofouling
pour escales californiennes (CSLC, nuance : cible surtout les gros navires, pas confirmé pour la
plaisance légère), (3) copilote anti-amende mouillage Posidonie pour loueurs méditerranéens
(amendes jusqu'à 150 000€, vérifiées), (4) pré-expertise photo pour sinistres plaisance, (5)
copilote de certification Clean Marina (seuil CMAP 100%+60% BMP, Florida DEP, vérifié). Principale
lacune : offres d'emploi et appels d'offres publics non investigués (quota épuisé) ; seuil exact de
rang de biofouling non recroisé avec le texte primaire (PDF illisibles dans cet environnement).
