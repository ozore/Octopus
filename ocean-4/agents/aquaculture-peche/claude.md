# Mémoire de travail — agent aquaculture-pêche

Date de la passe : 2026-09-07
Quota : 10 WebSearch max (partagé), WebFetch libre.

## Plan de recherche (avant exécution)
Champs cibles du brief : aquaculteurs (saumon, coquillages, algues), flottes pêche
industrielle/artisanale, organisations de producteurs, certificateurs (ASC, MSC, BAP,
Ocean Wise, Seafood Watch), programmes d'observateurs/suivi électronique, criées,
transformateurs. 5 problèmes payés parmi : prises accessoires, mammifères marins, poux
de mer, mortalités, échappées, empreinte benthique, engins perdus, traçabilité/fraude,
quotas/fermetures, welfare.

Recherches prévues (max 10) :
1. NOAA electronic monitoring / video review bycatch — contrats, budgets
2. MPO/DFO Canada surveillance électronique pêche — appels d'offres
3. Poux de mer / sea lice AI (Aquabyte, Manolin, CageEye...) — paysage concurrentiel
4. Rapports annuels Mowi/Grieg/Cermaq/Cooke — coûts poux de mer/mortalité
5. Coûts audits certification ASC/MSC/BAP
6. Fraude/traçabilité fruits de mer — coûts, DNA testing, Oceana
7. Engins fantômes (ghost gear) — détection, coût, programmes
8. Offres d'emploi "video reviewer"/"observateur"/"analyste conformité" — salaires
9. Startups aquaculture/pêche fermées ou pivots 2024-2025
10. Réserve — combler lacune la plus critique après 1-9

## Compteur de recherches WebSearch
10/10 utilisées — quota épuisé. Détail dans le Journal ci-dessous (recherches 1 à 10).
WebFetch utilisé librement en complément (~9 appels) sur dfo-mpo.gc.ca, fisheries.noaa.gov,
msc.org, asc-aqua.org, bapcertification.org, mowi.com (échec, PDF trop lourd >10 Mo),
dfo-mpo.gc.ca/stats (échec, tableau interactif non lisible).

## Requêtes qui ont marché (bon ratio signal/une recherche)
- "Pêches et Océans Canada surveillance électronique pêche observateurs en mer appel d'offres"
  → a directement donné le mécanisme de privatisation du financement MPO (2013).
- "ASC MSC certification audit cost aquaculture fishery 2025" → fourchette de prix utilisable.
- "seafood fraud mislabeling traceability DNA testing cost Oceana 2025" → chiffres Oceana + SIMP.
- "North Atlantic right whale ropeless gear fishery closures cost lobster crab 2025" → très
  riche : coûts NOAA, subventions, zones de fermeture, tout en une recherche.
- WebFetch direct des pages officielles (dfo-mpo.gc.ca, fisheries.noaa.gov, msc.org, asc-aqua.org,
  bapcertification.org) a été PLUS efficace que WebSearch pour les chiffres précis de population —
  à faire systématiquement après un premier WebSearch qui identifie la bonne page.

## Sources mortes / infructueuses
- WebFetch https://asc-aqua.org/about-us/who-we-are/ → 404 (mauvaise URL devinée) ; la page
  d'accueil https://asc-aqua.org/ a fonctionné à la place.
- WebFetch du PDF Mowi Annual Report 2025 → échoué ("maxContentLength size of 10485760
  exceeded"), PDF trop volumineux pour l'outil. Contourné via les chiffres déjà obtenus par
  WebSearch (coûts de mortalité) — volumes de production (tonnes) restent non vérifiés.
- WebFetch https://www.dfo-mpo.gc.ca/stats/commercial/land-debarq-eng.htm → page renvoie vers des
  tableaux de bord interactifs, aucun chiffre extrait automatiquement. Nombre de permis/navires
  canadiens reste une lacune.
- WebSearch "aquaculture fisheries tech startup shut down pivot 2024 2025 computer vision" → n'a
  remonté que des listes de startups ACTIVES (StartUs Insights, Tracxn), aucune fermeture/pivot
  confirmé. Reformulation possible pour une passe future : cibler directement "TechCrunch
  aquaculture startup shuts down" ou "[nom précis] ceases operations".

## Leçons
- Le comptage de poux de mer par vision par ordinateur est un marché mature (Aquabyte depuis
  2017, Manolin, CageEye) : ne pas le proposer comme "impossible avant 2024" — chercher plutôt la
  couche prédictive/prescriptive (Manolin 2025) ou la vérification indépendante (angle non occupé,
  devenu le candidat 5 du dossier).
- Les sites institutionnels (MSC, ASC, BAP, NOAA, MPO) publient souvent leurs chiffres de
  population/coût directement sur une page "about"/"guide" — un WebFetch ciblé bat une recherche
  générique une fois l'URL identifiée.
- Le brief demande 5 candidats mais couvre 10+ catégories de problèmes : mieux vaut choisir les 5
  où j'ai le plus de preuves chiffrées croisées (acheteur + dépense + protocole) que de forcer une
  couverture exhaustive des catégories.
- Garder au moins 1 recherche de réserve pour un angle non couvert (ici : baleines/fermetures) a
  payé — c'est devenu un candidat à part entière avec d'excellents chiffres NOAA.

## Journal (au fil de l'eau)

### Recherche 1 (NOAA EM video review) — utile mais générique
Query: "NOAA electronic monitoring bycatch video review contract cost 2025"
Résultat : pas de chiffre 2025 précis trouvé automatiquement. Pistes utiles :
- https://www.fisheries.noaa.gov/national/fisheries-observers/electronic-monitoring
- https://www.fisheries.noaa.gov/insight/electronic-monitoring-explained
- PDF coût comparatif observateurs humains vs EM (2015, West Coast groundfish) :
  https://media.fisheries.noaa.gov/dam-migration/em_cos_assessment_for_gar_multispecies_20150610.pdf
- Confirme : la revue vidéo manuelle est le goulot (des milliers d'heures), le
  monitorage automatisé long terme est présenté comme la solution à venir.
Leçon : chercher chiffres précis via WebFetch sur pages NOAA plutôt que WebSearch.

### Recherche 2 (MPO/DFO surveillance électronique) — bon résultat
Query: "Pêches et Océans Canada surveillance électronique pêche observateurs en mer appel d'offres"
Résultat clé : le MPO a délégué le marché des observateurs en mer au secteur privé —
les pêcheurs choisissent et paient DIRECTEMENT leur fournisseur d'observateurs ou de
surveillance électronique (négociation de gré à gré), le MPO se limite à
certifier les fournisseurs (via l'Office des normes générales du Canada, ONGC) et à
vérifier l'intégrité des données. => Marché privé de fournisseurs de services de
surveillance = acheteur potentiel (les fournisseurs eux-mêmes, ou les flottes/OP qui
payent). Page centrale : https://www.dfo-mpo.gc.ca/fisheries-peches/sdc-cps/nir-nei/obs-fra.html
FAQ programme observateurs : https://www.dfo-mpo.gc.ca/fisheries-peches/sdc-cps/eng-comm/faq/obs-fra.html
Politique de surveillance des pêches : https://www.dfo-mpo.gc.ca/reports-rapports/regs/sff-cpd/fishery-monitoring-surveillance-des-peches-fra.htm

### Recherche 3 (sea lice AI) — marché DÉJÀ occupé, important pour éviter doublon
Query: "salmon farming sea lice AI monitoring startup Aquabyte Manolin CageEye 2025"
- Aquabyte (fondée 2017) : comptage de poux, poids, biomasse par vision par ordinateur
  sous-marine, >250M poissons traités, approuvée par l'autorité norvégienne (Mattilsynet
  implicite). => comptage brut de poux par IA = DÉJÀ résolu depuis des années, pas un
  candidat "impossible avant 2024".
- Manolin (blog.manolinaqua.com) : vient de lancer en 2025 un "Harvest Forecaster" et un
  "Sea Lice Treatment Recommender" (moteur de modélisation prédictive, 19 modèles,
  85-97% de précision annoncée) — PLUS RÉCENT, couche prédictive/prescriptive au-dessus
  des données de comptage. Piste : la prévision/recommandation de traitement (pas le
  comptage) est la frontière encore ouverte.
- CageEye : caméras de détection d'appétit pour optimisation de l'alimentation (feed).
Leçon : ne PAS proposer "comptage de poux par vision" comme candidat — trop mûr.
Chercher plutôt : mortalité, échappées, empreinte benthique, bien-être, ou couche
d'agents IA/LLM par-dessus les données déjà produites par ces capteurs.

### Recherche 4 (Mowi/Grieg coûts mortalité/poux) — chiffres exploitables
Query: "Mowi Grieg Cermaq annual report 2025 sea lice cost per kilo mortality biological challenges"
- Mowi : coûts de mortalité "incident-based" = 49,2 M EUR en 2025 (stable vs 49,0 M EUR
  en 2024), causés principalement par des problèmes branchiaux et des effets secondaires
  des traitements anti-poux. Coûts de lutte contre les poux stables vs 2024.
  Source : Mowi Annual Report 2025 (PDF) https://mowi.com/wp-content/uploads/2025/05/Mowi-Annual-Report-2025.pdf
  et Q4 2025 report https://mowi.com/wp-content/uploads/2025/05/Mowi_Q4_2025_Report.pdf
- Mowi Canada Est : incident de mortalité significatif en sept. 2025 (eaux chaudes
  record) — pertinent pour le volet "mortalités" côté Canada/Vancouver (proximité
  fondateur).
- Grieg Seafood : défis biologiques (poux, mortalité élevée, taux de survie réduit)
  ont pesé sur l'EBIT ; part de qualité "supérieure" tombée à 59%. SeafoodSource :
  https://www.seafoodsource.com/news/business-finance/biological-challenges-restructuring-costs-hit-grieg-seafood-s-q1-earnings-during-transitionary-quarter
  Autre : Grieg prévient que défis bio coûteront 7 M USD (SeafoodSource, SalMar aussi
  cité) https://www.seafoodsource.com/news/aquaculture/increased-salmon-volumes-for-salmar-in-q1-grieg-warns-biological-challenges-will-cost-usd-7-million
- Rapport transparence poux Mowi Canada Ouest : https://mowi.com/caw/sustainability/sea-lice-reporting/
- Watershed Watch (ONG) accuse les fermes de salmoniculture BC de cacher leurs chiffres
  de poux : https://watershedwatch.ca/stories/why-are-bc-salmon-farms-hiding-their-sea-lice-numbers/
  => tension transparence/vérification = piste produit (audit indépendant par IA).
- Pacific Wild "Falling Through the Net" recense les désastres de pêche/aquaculture en
  C.-B. depuis juin 2024 : https://pacificwild.org/fisheries-disasters-in-british-columbia/

### Recherche 5 (coûts audits ASC/MSC) — fourchette trouvée
Query: "ASC MSC certification audit cost aquaculture fishery 2025"
- MSC (pêche sauvage) : coût de certification 15 000 à 120 000 USD, parfois cité
  jusqu'à 250 000 USD selon taille/complexité de la pêcherie. Le MSC lui-même n'est pas
  payé — seul l'organisme certificateur (ex. SCS, DNV, TÜV NORD) facture l'audit.
  Sources : https://www.scsglobalservices.com/services/marine-stewardship-council-msc-certification
  https://nfo.com/blogs/news/fishery-certifications-do-they-even-mean-anything
- ASC (aquaculture) : devis au cas par cas après soumission du dossier ; pas de tarif
  2025 public trouvé. Audits annuels obligatoires, certification renouvelée tous les
  5 ans (donc client récurrent structurel). Sources : SCS, TÜV NORD, DNV, Ecocert.
  https://www.tuev-nord.de/en/services/auditing-and-certification/asc/
  https://www.dnv.us/services/aquaculture-stewardship-council-standards-5073/

### Recherche 6 (fraude/traçabilité fruits de mer) — chiffres clés
Query: "seafood fraud mislabeling traceability DNA testing cost Oceana 2025"
- Oceana : ~1 poisson sur 5 mal étiqueté (études répétées, dernier chiffre >20%) ;
  étude nationale antérieure = 33% des 1215 échantillons mal étiquetés (référence FDA).
  Red snapper : 7/120 échantillons étaient vraiment du vivaneau rouge. Espadon/thon
  87% et 59% de mauvais étiquetage dans certains échantillons.
  https://usa.oceana.org/press-releases/oceana-finds-seafood-fraud-persists/
  https://oceana.org/reports/oceana-study-reveals-seafood-fraud-nationwide/
- Programme fédéral US : Seafood Import Monitoring Program (SIMP) ne couvre que 13
  espèces importées et seulement du bateau jusqu'aux USA (pas jusqu'à l'assiette).
  https://www.fisheries.noaa.gov/national/sustainable-seafood/seafood-fraud
- Tests ADN : marché de labos privés en croissance, coûts en baisse mais encore trop
  chers/non adaptés aux petites pêcheries rurales. Pas de chiffre précis 2025 trouvé.
  https://www.seafoodsource.com/news/supply-trade/faster-dna-testing-could-aid-in-seafood-fraud-mislabeling-in-u-s-restaurants

### Recherche 7 (engins fantômes / ghost gear) — écosystème déjà actif mais surtout ONG
Query: "ghost fishing gear lost nets detection sonar AI recovery program cost 2025"
- Chiffre clé : ~640 000 tonnes d'engins de pêche fantômes perdus/abandonnés chaque
  année dans le monde (impact continu sur faune + habitats + coûts économiques pour
  pêcheurs/communautés côtières).
- GhostNetZero.ai (WWF Allemagne + Microsoft AI for Good Lab + Accenture) : réutilise
  des données sonar haute résolution DÉJÀ COLLECTÉES pour détecter les filets fantômes,
  ~90% de taux de détection (Baltique, Puget Sound). Source :
  https://www.accenture.com/us-en/case-studies/song/wwf-germany-hunts-ghost-nets-using-ai
  https://wwfwhales.org/news-stories/baltic-harbour-porpoise-ghost-gear
- GhostVision (MDPI, article académique) : sonar latéral bas coût + détection d'objets,
  cadre open-source pour démocratiser la détection. https://www.mdpi.com/2077-1312/14/10/951
- Constat : détection = surtout projets ONG/philanthropiques (WWF/Microsoft/Accenture),
  PAS encore un produit commercial récurrent vendu à un acheteur qui paie chaque année.
  Piste produit : passer de "projet ONG ponctuel" à "service récurrent" pour compagnies
  d'assurance maritime (P&I clubs), organisations de producteurs tenues de rapporter les
  pertes d'engins, ou conformité aux nouvelles règles de marquage d'engins (liées aux
  règles de protection des baleines).

### Recherche 8 (salaires observateurs/reviewers) — confirme le coût de la main d'œuvre humaine
Query: '"video reviewer" OR "at-sea observer" OR "compliance analyst" fisheries job posting salary 2025'
- Salaire observateur des pêches (US, 2025) : moyenne ~56 000-70 800 $ US/an (ou
  22-35 $/h) ; fourchette 39 000 $ (25e percentile) à 86 000 $ (90e percentile) ;
  entrée de carrière ~51 200 $, senior (8+ ans) ~87 000 $.
  Sources : https://www.ziprecruiter.com/Salaries/Fisheries-Observer-Salary
  https://www.salary.com/research/salary/hiring/fisheries-observer-salary
  https://www.salaryexpert.com/salary/job/fisheries-observer/united-states
- Confirme un vrai marché de main-d'œuvre humaine payée pour l'observation/la revue,
  donc un budget existant à réaffecter vers un service augmenté par IA (pas besoin de
  créer un nouveau budget, juste de capter une dépense déjà engagée).

### Recherche 9 (startups aquaculture/pêche fermées/pivots) — peu concluant, une piste trouvée
Query: "aquaculture fisheries tech startup shut down pivot 2024 2025 computer vision"
- Pas de liste claire de fermetures/pivots trouvée directement (limite de la recherche,
  cf. section Lacunes).
- Piste intéressante trouvée : "OnDeck Fisheries" (startup canadienne) — surveillance
  des pêches par IA, détection/comptage/identification des prises en temps réel à bord.
  Proximité géographique avec le fondateur (Canada). À creuser si futur budget de
  recherche (non vérifié en profondeur, une seule mention).
- Contexte marché : nombreuses startups listées comme actives (StartUs Insights,
  Tracxn, Naturetechmemos) mais aucune confirmation d'échec dans les résultats de
  recherche automatisés — nécessiterait un accès presse spécialisé (TechCrunch,
  AgFunder News, IntraFish) hors budget de recherche restant.

### Recherche 10 (baleine noire / engins ropeless / fermetures) — excellent rendement, dernière recherche
Query: "North Atlantic right whale ropeless gear fishery closures cost lobster crab 2025"
- NOAA estime le coût de sa réglementation (incl. transition ropeless) à 9-20 M USD sur 10 ans,
  soit 1,5-3,3% du revenu annuel de la pêcherie au homard. Un casier ropeless coûte "des milliers
  de dollars" vs ~200$ pour un casier classique.
- Fermetures : zone au sud de Cape Cod fermée fév.-avril ; zone LMA1 (côte du Maine) fermée
  oct.-janv. ; usage d'engins ropeless autorisé en exception PENDANT la fermeture — donc accès
  au fond de pêche conditionné à l'adoption de l'engin.
- Financement déjà engagé : Maine a reçu 5 M USD de subventions NFWF (National Fish and Wildlife
  Foundation) pour un programme d'engins ropeless + 1 M USD de fonds d'État pour indemniser les
  pêcheurs testeurs ; le Congrès américain a autorisé 20 M USD pour l'adoption d'engins innovants
  réduisant le risque d'enchevêtrement.
  Sources : https://www.fisheries.noaa.gov/feature-story/pot-trap-fisheries-regulations-help-save-north-atlantic-right-whales-announced
  https://www.seafoodsource.com/news/environment-sustainability/more-fishers-will-get-their-hands-on-ropeless-gear-in-2025
  https://www.clf.org/publication/financial-impact-ropeless-fishing-gear-transitioning-two-sectors-of-the-northeast-lobster-fishery/
  https://mainemorningstar.com/2024/10/21/the-futures-of-right-whales-and-lobstermen-are-entangled-could-high-tech-gear-help-save-them-both/
- Piste produit : (a) prévision de fermetures dynamiques à partir des détections de baleines déjà
  collectées (bouées acoustiques, survols), (b) déconfliction géospatiale des engins ropeless
  (invisibles en surface, donc risque de conflit entre pêcheurs sur le même fond) — aucun des deux
  ne semble couvert par un produit commercial identifié.
QUOTA WEBSEARCH ÉPUISÉ APRÈS CETTE RECHERCHE (10/10).

### WebFetch complémentaires (après épuisement du quota WebSearch)
1. dfo-mpo.gc.ca/.../obs-fra.html → confirme : industrie paie 100% des coûts observateurs/EM
   Pacifique depuis le 1er avril 2013 (le gouvernement s'est retiré du financement) ; fournisseurs
   privés livrent le service sous contrat ; MPO ne fait que fixer les normes et vérifier
   l'intégrité des données (mention "Standards Council of Canada" dans cet extrait — DIVERGE de la
   mention "Office des normes générales du Canada / CGSO" obtenue par WebSearch à la recherche 2 ;
   les deux organismes existent réellement au Canada mais je n'ai pas pu confirmer lequel accrédite
   précisément les fournisseurs EM — à ne PAS citer avec un acronyme précis dans le dossier tant
   que non résolu, rester générique ("organisme fédéral de normalisation").
2. fisheries.noaa.gov/.../electronic-monitoring → 14 programmes EM régionaux US ; plus gros poste
   de coût = revue vidéo manuelle + transmission + stockage (citation directe NOAA) ; doctrine de
   partage des coûts NOAA/industrie publiée mai 2019 ; West Coast groundfish EM complet dès le
   1/1/2024, Alaska chalutage pélagique goberge dès le 1/1/2025 — dates très récentes, bon signal
   "impossible/pas encore standard avant 2024".
3. msc.org/.../fishery-certification-guide → 600+ pêcheries certifiées, 20 000+ produits ;
   évaluation initiale 12-18 mois ; certificat valide 5 ans, audit de surveillance CHAQUE année ;
   coût 15-120 k$ ("anecdotal information" selon le MSC lui-même) ; 25 indicateurs / 3 principes,
   seuil de passage 60/indicateur, moyenne 80/principe.
4. asc-aqua.org/about-us/who-we-are/ → 404 (URL invalide).
5. asc-aqua.org/ (page d'accueil) → 2 640 sites de fermes certifiés, 120 usines d'aliments,
   31 679 produits, 121 pays ; espèces : saumon, bar/daurade, crevette, morue Atlantique (nouveau
   2025), coquillages.
6. fisheries.noaa.gov/.../seafood-fraud → étude FDA 2012-13 : 85% des espèces bien étiquetées
   (~15% d'erreur) ; NOAA détecte fraude dans jusqu'à 40% des échantillons soumis volontairement ;
   NOAA ne voit qu'~1/5 des fruits de mer consommés aux USA chaque année. Rien de chiffré trouvé
   sur SIMP spécifiquement dans cet extrait (nombre d'espèces couvertes confirmé via recherche 6
   à la place : 13 espèces, traçabilité bateau→frontière seulement).
7. bapcertification.org/ → 39 pays, 330+ écloseries certifiées, 2 300+ fermes certifiées, 150+
   usines d'aliments, 490+ usines de transformation, 300 000+ emplois sur sites certifiés,
   23 milliards de repas servis avec du poisson certifié BAP. Rien sur coût/durée des audits.
8. mowi.com/.../Mowi-Annual-Report-2025.pdf → ÉCHEC (PDF >10 Mo, non lisible par l'outil).
9. dfo-mpo.gc.ca/stats/commercial/land-debarq-eng.htm → page renvoie à des tableaux de bord
   interactifs sans chiffres extractibles automatiquement ; nombre de permis/navires canadiens
   reste NON TROUVÉ (lacune documentée dans le dossier).

## Résumé final (livrable)
`dossier.md` écrit dans ce dossier : population (aquaculteurs, certificateurs ASC/MSC/BAP,
programmes EM NOAA/MPO, fraude, engins perdus, baleines/fermetures) + 5 candidats chiffrés et
sourcés (revue vidéo EM ; copilote d'audit ASC/MSC/BAP ; anti-fraude traçabilité SIMP/IUU ;
prévision de fermetures + déconfliction engins ropeless baleines ; vérification indépendante
poux de mer/mortalité salmoniculture) + 38 références horodatées + lacunes explicites (Ocean
Wise/Seafood Watch non chiffrés, criées/OP européennes non cherchées, permis de pêche canadiens
introuvables, startups fermées non confirmées, coûts précis d'audit ASC non publics, tonnage de
production Mowi non lu car PDF trop lourd). 10/10 WebSearch utilisées, ~9 WebFetch en complément.
Leçon transversale : le comptage de poux par IA est un marché mûr depuis 2017 (Aquabyte) — la
vraie frontière 2024+ est la couche prédictive/prescriptive et la vérification indépendante des
données déjà collectées, pas la détection brute elle-même.
