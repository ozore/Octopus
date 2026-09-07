# Dossier plaisance-croisière — passe d'idéation (phase intuition)

Date : 7 septembre 2026. Secteurs couverts : marinas, chantiers navals de plaisance, sociétés de
charter et de location, croisiéristes, opérateurs d'excursion (observation des baleines, plongée,
pêche sportive), fabricants d'équipements nautiques, et leurs assureurs.

Méthode : 10 recherches web (quota maximal utilisé) + recherches documentaires libres (WebFetch)
sur les sources renvoyées. Chaque capacité est étiquetée **vérifiée (source)** ou **supposée**.
Quand un chiffre précis n'a pas pu être retrouvé dans le quota imparti, une fourchette est donnée
et marquée **estimation**.

---

## (a) Population : qui paie déjà, combien, et pour quoi

- **Croisiéristes** — CLIA (Cruise Lines International Association, association professionnelle
  mondiale des compagnies de croisière) recense 310 navires océaniques en 2025, 37,7 millions de
  passagers transportés (projection 41,9 millions en 2028), et 56 navires en commande jusqu'en 2036
  pour 56,7 milliards $ US d'investissement — **vérifiée** (CLIA, *State of the Cruise Industry
  Report 2025*). Ces compagnies gèrent déjà des obligations réglementaires lourdes et coûteuses
  (biofouling — encrassement biologique de la coque —, eaux usées, carburant) à l'échelle de flottes
  entières.
- **Opérateurs d'excursion baleines** — au moins 28 entreprises rien que dans la PWWA (Pacific
  Whale Watch Association : 12 en Colombie-Britannique + 16 dans l'État de Washington) — **vérifiée**
  (pacificwhalewatchassociation.com) — plus 30+ entreprises labellisées Whale SENSE (programme
  volontaire de NOAA Fisheries, agence américaine océanique et atmosphérique) sur la côte est et en
  Alaska, dont 15+ en Alaska seul — **vérifiée** (whalesense.org, fisheries.noaa.gov). Ces opérateurs
  paient déjà des formations annuelles obligatoires et l'installation/l'entretien d'un AIS (Automatic
  Identification System, transpondeur maritime obligatoire) sur chaque navire — **vérifiée** (PWWA).
  Plusieurs centaines d'opérateurs commerciaux au total en Amérique du Nord si l'on ajoute les
  opérateurs non labellisés — **estimation**.
- **Marinas et chantiers navals de plaisance** — marché nord-américain de plusieurs milliers de
  sites — **estimation** (chiffre précis introuvable dans le quota imparti). Ils paient déjà 150 $ à
  plus de 2 000 $/mois pour un logiciel de gestion de marina (Dockwa et équivalents), sans aucun
  module environnemental inclus — **vérifiée** (marinas.dockwa.com/marina-software-pricing, sept.
  2026). Une partie d'entre eux engage une démarche de certification volontaire « Clean Marina »
  nécessitant une autoévaluation documentée et une visite de vérification tous les 5 ans —
  **vérifiée** (Florida DEP, Department of Environmental Protection).
- **Sociétés de charter/location** — en Méditerranée (Croatie, Grèce, France, Italie), chaque
  location bareboat (sans équipage) bloque 2 500 à 5 000 € de caution par bateau et une assurance-
  caution non remboursable représentant environ 10 % de la somme assurée est couramment proposée —
  **vérifiée** (sources spécialisées charter, sept. 2026). Taille totale de la flotte en charter non
  chiffrée dans le temps imparti — **lacune**.
- **Assureurs et experts maritimes** — chaque sinistre ou souscription déclenche une expertise
  maritime (marine survey) facturée 20 à 35 $/pied (minimum 750-850 $) ou 600 à 1 200 $/jour
  d'honoraires d'expert — **vérifiée** (Better Boat, Popeye Marine Group, SkiSafe, 2026). Seulement
  environ 20 % des grands assureurs déploient l'IA au-delà de l'automatisation basique — **vérifiée**
  (synthèse sectorielle 2025, EONSR).
- **Fabricants d'équipements nautiques** — non investigué en détail faute de quota ; piste à
  approfondir (fabricants de peintures antifouling, de systèmes de traitement des eaux noires) —
  **lacune**.

---

## (b) Cinq candidats

### 1. Carnet de preuve de conformité pour l'observation des baleines

- **Problème (source)** : les opérateurs doivent respecter des distances d'approche réglementaires
  variables (100 m en général, 200 m si l'animal se repose ou a un petit, 1000 m pour les épaulards
  résidents du sud — SRKW, Southern Resident Killer Whale — en Colombie-Britannique, 400 m dans
  l'estuaire du Saint-Laurent) sous peine de poursuite au titre de la Loi sur les pêches (amende
  jusqu'à 100 000 $ CAD) — **vérifiée** (DFO, Pêches et Océans Canada / Fisheries and Oceans Canada,
  page « Watching marine wildlife »). La preuve de position au moment d'un contrôle ou d'une plainte
  repose sur la mémoire du capitaine et le journal papier — **supposée**.
- **Acheteur nommé / dépense actuelle** : les 28 membres de la PWWA et les 30+ entreprises Whale
  SENSE paient déjà formation annuelle obligatoire + AIS embarqué en continu — **vérifiée**.
- **Produit en une phrase** : un carnet de bord automatique qui croise en continu la position
  AIS/GPS du bateau avec les zones et distances réglementaires pour délivrer, à chaque sortie, une
  attestation de conformité horodatée et défendable.
- **Ce que l'IA fait / pourquoi impossible avant 2024** : un agent fusionne le flux AIS du navire
  avec les signalements de baleines (type WRAS — Whale Report Alert System, Ocean Wise) et rédige en
  langage naturel le rapport de sortie et les écarts détectés ; la fusion fiable de séries
  temporelles hétérogènes et la rédaction automatique de rapports défendables exigent des modèles
  multimodaux et agentiques récents — la détection seule existait déjà (WRAS, Whale Safe) mais pas la
  preuve documentaire par opérateur.
- **Données exploitables** : AIS obligatoire PWWA (**vérifiée**) ; flux WRAS/Whale Report ouvert aux
  mariniers commerciaux (**vérifiée**, ocean.org) ; règles DFO codifiées en mètres par zone/espèce
  (**vérifiée**).
- **Protocole/seuil existant** : distances DFO vérifiées ci-dessus ; critères Whale SENSE (5 critères
  dits S-E-N-S-E) partiellement documentés, sans carnet numérique obligatoire trouvé (**supposée**
  absence).
- **Existant gratuit/payant** : WRAS (Ocean Wise) et Whale Safe (Benioff Ocean Science Laboratory,
  UC Santa Barbara) font de la détection/alerte gratuite mais ni l'un ni l'autre ne documente de
  rapport de conformité par entreprise — **vérifiée** (FAQ WRAS consultée, aucune fonction de ce
  type mentionnée).
- **Retour l'année suivante** : formation et saison renouvelées chaque année ; un historique
  pluriannuel de conformité devient un actif de négociation avec l'assureur.
- **Vérifié / supposé** : distances, AIS, PWWA/Whale SENSE, existence de WRAS/Whale Safe =
  vérifiées. Carnet numérique inexistant, économies réelles par opérateur, appétence à payer =
  supposées.

### 2. Copilote de conformité biofouling pour flottes faisant escale en Californie

- **Problème (source)** : la Californie exige inspection et dossier de gestion du biofouling
  (Biofouling Management Plan/Record Book, conforme aux lignes directrices IMO — International
  Maritime Organization — de 2011) pour tout navire pouvant transporter de l'eau de ballast entrant
  dans ses ports ; sur la période août 2018-juillet 2019, 2 515 navires étaient assujettis, 500+
  inspectés, 44 % avec un plan/registre incomplet et 72 % sans information sur la durée de vie du
  revêtement antifouling — **vérifiée** (California State Lands Commission — CSLC — via Riviera
  Maritime Media, et Cornell Law, Cal. Code Regs. Tit. 2 § 2298.3).
- **Acheteur nommé / dépense actuelle** : croisiéristes et exploitants de flottes commerciales
  faisant escale en Californie, plus les sociétés d'inspection/nettoyage de coque qui les servent ;
  coût comparable à une expertise maritime classique (20-35 $/pied, minimum 750-850 $) —
  **vérifiée** indirectement (barème d'expertise), **supposée** pour le lien direct au biofouling.
- **Produit en une phrase** : une IA qui regarde la vidéo de coque prise par le plongeur ou un ROV
  (Remotely Operated Vehicle, robot sous-marin téléopéré) et rend immédiatement le rang de
  biofouling avec le rapport prêt à déposer auprès de la CSLC.
- **Ce que l'IA fait / pourquoi impossible avant 2024** : classification visuelle multimodale du
  pourcentage de recouvrement par zone de coque (carène, safran, hélice, prises d'eau) à partir
  d'une vidéo sous-marine, puis rédaction automatique du Biofouling Record Book dans le format
  attendu ; la vision sous-marine fine (eau trouble, éclairage variable) combinée à la génération de
  rapports structurés nécessite des modèles vision-langage récents — auparavant seul un inspecteur
  humain certifié pouvait le faire.
- **Données exploitables** : vidéos de plongée déjà tournées en routine par les nettoyeurs de coque
  (**supposée**, pratique courante non revérifiée cette session) ; registre d'inspections déjà tenu
  par la CSLC (**vérifiée**).
- **Protocole/seuil existant** : existence d'une échelle de rangs en pourcentage de recouvrement
  confirmée par synthèse de recherche, mais le seuil exact (« Rang 2 ≤ 5 % ») n'a pas pu être
  reconfirmé dans le texte réglementaire primaire (PDF illisible dans cet environnement) —
  **supposée**, à valider.
- **Existant gratuit/payant** : aucun produit IA dédié identifié pour ce sous-segment dans le temps
  imparti — **lacune probable**, quota de recherche limité.
- **Retour l'année suivante** : chaque escale à risque ou cycle de mise à sec (1-2 ans) redéclenche
  l'inspection ; le registre doit rester à jour en continu depuis la dernière cale sèche —
  **vérifiée** (exigence CSLC).
- **Vérifié / supposé** : chiffres CSLC 2018-2019, exigence de registre = vérifiées. Seuils exacts
  par rang, applicabilité directe à la plaisance légère (le texte vérifié cible les navires
  « capables de transporter de l'eau de ballast », donc plutôt gros commerciaux/paquebots que
  petits yachts) = supposées — **limite importante à noter**.

### 3. Copilote anti-amende pour flottes de location en Méditerranée (mouillage sur Posidonie)

- **Problème (source)** : le mouillage sur les herbiers de posidonie (plante marine protégée) est
  interdit par arrêtés préfectoraux maritimes depuis 2019 (interdiction totale >24 m, restriction
  >8 m en zone protégée) ; amendes de 1 500 € (zone ZMEL — Zone de Mouillage et d'Équipements
  Légers — non autorisée) à 150 000 € + préjudice écologique >100 000 € pour destruction avérée,
  jusqu'à 3 ans de prison dans les cas documentés — **vérifiée** (boatcible.com, mars 2026 ; FNE
  PACA, France Nature Environnement Provence-Alpes-Côte d'Azur). Surveillance par affaires
  maritimes, gendarmerie maritime, agents de parcs nationaux, douanes, drones, plongeurs et AIS,
  avec patrouilles quotidiennes en zone sensible de juin à septembre — **vérifiée**.
- **Acheteur nommé / dépense actuelle** : sociétés de location de bateaux (charter/bareboat) en
  Méditerranée qui bloquent 2 500-5 000 € de caution par bateau et vendent une assurance-caution non
  remboursable (~10 % de la somme assurée) pour couvrir les litiges de dommages — **vérifiée**.
- **Produit en une phrase** : un copilote embarqué (tablette/appli) qui alerte le skipper avant qu'il
  jette l'ancre sur une zone interdite et archive la preuve de bonne conduite pour désamorcer les
  litiges de caution.
- **Ce que l'IA fait / pourquoi impossible avant 2024** : un agent multimodal combine position
  GPS/AIS temps réel, cartographie du fond marin (type Donia, gratuite) et règles locales (taille du
  bateau, zone, saison) pour émettre une alerte en langage naturel avant le mouillage puis générer
  automatiquement le journal de preuve ; l'agent conversationnel embarqué capable d'expliquer la
  règle locale et de documenter la conformité en continu est nouveau — avant, la vérification était
  manuelle (carte papier ou appli séparée sans alerte proactive).
- **Données exploitables** : cartographie posidonie/Donia gratuite (**vérifiée**) ; arrêtés
  préfectoraux publiés (**vérifiée**) ; position GPS du bateau loué, déjà captée par certains loueurs
  pour le suivi de flotte (**supposée**).
- **Protocole/seuil existant** : seuils de taille de navire et de zone fixés par arrêté préfectoral
  (**vérifiée** : >24 m interdiction totale, >8 m en zone protégée) ; barème d'amendes
  (**vérifiée**).
- **Existant gratuit/payant** : Donia (gratuite, cartographie seule, pas d'alerte proactive
  embarquée ni de preuve de conformité) — **vérifiée** ; aucune solution IA dédiée aux loueurs
  identifiée dans le temps imparti — **lacune supposée**.
- **Retour l'année suivante** : nouvelle saison de location chaque printemps avec une nouvelle
  flotte de clients non-experts et arrêtés locaux parfois révisés ; renouvellement annuel du contrat
  d'assurance-caution.
- **Vérifié / supposé** : montants d'amendes, seuils de taille, moyens de surveillance, montants de
  caution = vérifiées. Captation GPS déjà en place chez les loueurs, part des litiges liée
  spécifiquement à l'ancrage = supposées.

### 4. Pré-expertise photo pour sinistres plaisance

- **Problème (source)** : chaque sinistre coque/moteur déclenche une expertise maritime facturée
  20-35 $/pied (minimum 750-850 $) ou 600-1 200 $/jour d'honoraires d'expert, avec un délai de
  plusieurs semaines pendant lequel le bateau immobilisé continue de coûter — **vérifiée** (Better
  Boat, Popeye Marine Group, SkiSafe, 2026).
- **Acheteur nommé / dépense actuelle** : assureurs et MGA (Managing General Agent, gestionnaire
  délégué en assurance) spécialisés plaisance qui paient déjà ces expertises à chaque déclaration de
  sinistre — **vérifiée** pour le coût, **supposée** pour les noms d'acteurs précis (non vérifiés
  individuellement cette session).
- **Produit en une phrase** : une IA qui pré-analyse les photos envoyées par l'assuré au moment du
  sinistre, estime la nature et l'ampleur des dégâts, et ne déclenche l'expert humain payant que si
  le dossier le justifie réellement.
- **Ce que l'IA fait / pourquoi impossible avant 2024** : vision par ordinateur comparant les photos
  de dégâts (coque, gelcoat, moteur) à une base de sinistres passés pour produire une estimation
  préliminaire en minutes et détecter des incohérences (fraude, dégâts antérieurs) ; documenté comme
  tendance sectorielle 2025 en assurance marine généraliste/cargo — **vérifiée** (AutomationEdge,
  WorkBoat, Zentis.ai) — mais pas encore descendue au marché de la plaisance/petits assureurs
  indépendants, où seulement ~20 % des grands assureurs dépassent l'automatisation basique —
  **vérifiée** (EONSR, 2025). Avant les modèles vision-langage récents, ce triage nécessitait un
  humain qualifié à chaque dossier.
- **Données exploitables** : historiques de sinistres et rapports d'expertise déjà au format
  standardisé par les associations professionnelles de surveyors — **supposée**, non revérifiée
  individuellement ; photos de pré-souscription déjà exigées par certains assureurs à la signature.
- **Protocole/seuil existant** : formats de rapport d'expertise maritime standardisés par les
  associations professionnelles de surveyors — **supposée**, non vérifiée cette session.
- **Existant gratuit/payant** : IA de triage de sinistres déjà utilisée en assurance transport/cargo
  (**vérifiée**) ; rien de spécifique trouvé pour la plaisance indépendante — **lacune probable**,
  quota de recherche limité.
- **Retour l'année suivante** : chaque saison de navigation (et chaque saison des ouragans
  Atlantique/Golfe) génère un nouveau pic de sinistres ; chaque renouvellement de police (souvent
  redemandé pour les bateaux plus âgés) redemande une expertise pré-souscription.
- **Vérifié / supposé** : coûts d'expertise, tendance IA en assurance marine générale = vérifiées.
  Adoption réelle par petits assureurs plaisance, formats standardisés exacts, gain de temps chiffré
  = supposées.

### 5. Copilote de certification environnementale pour marinas (Clean Marina)

- **Problème (source)** : les marinas candidates au label volontaire « Clean Marina » (programme
  d'État américain, ex. Floride) doivent remplir un dossier (formulaire, engagement signé,
  autoévaluation CMAP — Clean Marina Action Plan) prouvant 100 % des exigences réglementaires et au
  moins 60 % des bonnes pratiques recommandées (BMP, Best Management Practice), avant une visite de
  vérification, puis renouveler tous les 5 ans — **vérifiée** (Florida DEP, Department of
  Environmental Protection, sept. 2026).
- **Acheteur nommé / dépense actuelle** : opérateurs de marinas qui paient déjà 150 $ à plus de
  2 000 $/mois pour un logiciel de gestion de marina (Dockwa et équivalents) sans aucun module
  environnemental inclus — **vérifiée** (page tarifaire Dockwa consultée, sept. 2026).
- **Produit en une phrase** : une IA qui remplit le dossier CMAP à partir de photos et de documents
  existants de la marina et prépare la visite de vérification, au lieu d'un employé qui coche la
  liste à la main.
- **Ce que l'IA fait / pourquoi impossible avant 2024** : un agent multimodal analyse des photos de
  site (stockage de produits, séparateurs d'hydrocarbures, gestion des déchets, stations de pompage
  des eaux noires) et des documents existants pour pré-remplir chaque item du CMAP avec preuve
  photographique horodatée, et repérer les écarts avant la visite officielle ; la lecture combinée
  d'images de site et de documents réglementaires, puis la rédaction du dossier dans le format
  attendu par le régulateur, nécessite des modèles vision-langage et des agents documentaires
  récents.
- **Données exploitables** : listes de contrôle CMAP publiques — **vérifiée** (Florida DEP) ; photos
  de routine déjà prises par le personnel de marina pour l'entretien — **supposée**.
- **Protocole/seuil existant** : seuil numérique vérifié (100 % réglementaire + 60 % BMP) et
  checklist publique Florida DEP — **vérifiée** ; programmes équivalents dans d'autres États
  américains — **supposée**, non revérifiée État par État cette session.
- **Existant gratuit/payant** : logiciels de gestion de marina (Dockwa etc.) sans module
  environnemental — **vérifiée** ; aucun outil IA dédié à la certification Clean Marina identifié —
  **lacune supposée**.
- **Retour l'année suivante** : renouvellement obligatoire tous les 5 ans avec nouvelle visite
  (**vérifiée**) ; un suivi continu entre deux renouvellements reste recommandé pour conserver les
  avantages (assurance, image) liés au label.
- **Vérifié / supposé** : seuil CMAP, cycle de renouvellement, absence de module environnemental
  chez Dockwa = vérifiées. Nombre de marinas Clean Marina actives, généralisation à tous les États,
  réutilisation des photos de routine = supposées.

---

## (c) Références (URL, date de consultation : 7 septembre 2026)

1. CLIA (Cruise Lines International Association), *State of the Cruise Industry Report 2025* —
   https://cruising.org/resources/state-cruise-industry-report-2025 et
   https://cruising.org/news/new-2025-state-cruise-industry-report-shows-cruising-vibrant-tourism-sector-growing-steadily
2. Ocean Wise, Whale Report Alert System (WRAS) — https://ocean.org/whales/wras/ et FAQ
   https://ocean.org/whales/whales/ocean-wise-sightings-network/whale-report-system-faq/
3. Benioff Ocean Science Laboratory (UC Santa Barbara), Whale Safe —
   https://bosl.ucsb.edu/project/whale-safe/
4. Pacific Whale Watch Association, réglementation — https://www.pacificwhalewatchassociation.com/regulations
5. Pêches et Océans Canada / Fisheries and Oceans Canada (DFO), « Watching marine wildlife » —
   https://www.dfo-mpo.gc.ca/species-especes/mammals-mammiferes/watching-observation/index-eng.html
6. Gazette du Canada, projet de règlement sur la distance d'approche des épaulards résidents du sud
   (2026) — https://gazette.gc.ca/rp-pr/p1/2026/2026-03-07/html/reg2-eng.html
7. NOAA Fisheries, Whale SENSE — https://whalesense.org/about/ et
   https://www.fisheries.noaa.gov/feature-story/whale-watching-operators-around-alaska-commit-having-whale-sense
8. California State Lands Commission (CSLC), réglementation biofouling — synthèse via Riviera
   Maritime Media, https://www.rivieramm.com/news-content-hub/news-content-hub/99-pass-how-california-is-building-compliance-in-biofouling-regulations-59768
   et Cornell Law (Cal. Code Regs. Tit. 2 § 2298.3) —
   https://www.law.cornell.edu/regulations/california/2-CCR-2298.3
9. BoatCible, « Mouillage Posidonie interdit 2026 : amendes, ZMEL et carte Méditerranée » (mars
   2026) — https://boatcible.com/2026/03/17/mouillage-interdit-sur-posidonie-en-mediterranee/
10. FNE PACA (France Nature Environnement Provence-Alpes-Côte d'Azur), « Mouillages illégaux et
    posidonies » — https://fnepaca.fr/dossiers/mouillages-illegaux-et-posidonies-une-jurisprudence-en-construction
    (page bloquée à l'accès automatisé lors de la consultation — citée via les reprises de
    boatcible.com)
11. Dockwa, tarification logiciel de gestion de marina —
    https://marinas.dockwa.com/marina-software-pricing
12. Florida Department of Environmental Protection (DEP), Clean Marina Program —
    https://floridadep.gov/rcp/clean-marina et https://floridadep.gov/rcp/clean-marina/content/steps-designation
13. Better Boat, Popeye Marine Group, SkiSafe — coûts d'expertise maritime : recherche agrégée,
    URLs individuelles listées dans claude.md (log de recherche n°4)
14. AutomationEdge, WorkBoat, EONSR, Zentis.ai — articles 2025 sur l'IA en assurance marine :
    recherche agrégée, URLs listées dans claude.md (log de recherche n°10)
15. Sources spécialisées charter Méditerranée (Croatie/Grèce) sur cautions et assurance-caution :
    recherche agrégée, URLs listées dans claude.md (log de recherche n°9)

## Lacunes et limites

- **Quota de recherche épuisé (10/10 WebSearch)** avant d'avoir pu vérifier : le nombre exact de
  marinas et de sociétés de charter en Amérique du Nord/Méditerranée, les offres d'emploi
  « environnement » chez les croisiéristes et marinas (source pourtant demandée par le brief, non
  investiguée faute de quota), les appels d'offres publics, et les brevets récents.
- **Deux documents PDF réglementaires clés n'ont pas pu être lus dans cet environnement**
  (`pdftoppm`/poppler absent, conversion HTML échouée) : le dossier de presse officiel de la
  préfecture maritime de Méditerranée sur le mouillage, et le guide d'application CSLC détaillant
  précisément les rangs de biofouling. Le seuil « Rang 2 ≤ 5 % » vient d'une synthèse de moteur de
  recherche et n'a pas pu être recroisé avec le texte réglementaire primaire — à vérifier en
  priorité par la suite.
- **Candidat 2 (biofouling)** : la réglementation CSLC vérifiée cible les navires « capables de
  transporter de l'eau de ballast », c'est-à-dire plutôt les gros navires commerciaux et paquebots
  que les yachts de plaisance légers ; l'extension du produit à la plaisance repose sur les régimes
  néo-zélandais/australiens (Craft Risk Management Standard), non vérifiés dans cette session.
- **Fabricants d'équipements nautiques** : catégorie d'acheteurs listée dans le brief mais non
  investiguée faute de quota — piste ouverte pour une future passe (peintures antifouling,
  traitement des eaux noires/grises).
- **Aucun appel d'offres public ni offre d'emploi n'a été consulté directement** — le dossier
  s'appuie sur des rapports, réglementations et pages tarifaires, pas sur les sources d'emploi ou de
  marchés publics recommandées par le brief en première intention.
- Plusieurs pages pertinentes ont renvoyé des erreurs d'accès (403/404) lors de la consultation
  automatisée (EPA stormwater marinas, Whale SENSE Atlantic requirements, FNE PACA) : les faits
  correspondants ont été recoupés via des sources secondaires quand c'était possible, sinon marqués
  lacune.
