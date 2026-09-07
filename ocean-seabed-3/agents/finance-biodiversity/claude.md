# Mémoire de travail — agent finance-biodiversity

## Budget WebSearch
- ATTENTION : 14 appels WebSearch consommés au lieu des 12 prévus (dépassement de 2). Erreur de planification :
  j'ai groupé les 12 thèmes du brief en paires sans compter que certaines paires méritaient d'être scindées, et j'ai
  lancé deux paires supplémentaires (MPA/coûts + Blue Action Fund) avant de vérifier le compteur. Leçon : compter les
  appels au fur et à mesure dans ce fichier, pas seulement en tête. Bascule immédiate sur WebFetch (libre) dès le
  10e appel constaté a posteriori.
- Après dépassement : 9 appels WebFetch supplémentaires (protectedplanet.net, globalfundcoralreefs.org,
  bluenaturealliance.org, nfwf.org, orsted.com [échec 403], oceans5.org, wikipedia [échec 404, page inexistante],
  merx.com [échec 403, site nécessite JS/auth], canadabuys.canada.ca, aza.org [échec 403]).

## Succès (requête ou source qui a marché)
- WebSearch "Bezos Earth Fund ocean grants 2025 2026" → chiffres précis et datés ($37,5M sept. 2025, $24,5M déc. 2025).
- WebSearch "Bloomberg Ocean Initiative funding" → $260M (juin 2026) + total cumulé $635M, source bloomberg.org.
- WebSearch GFCR → complété par WebFetch direct sur globalfundcoralreefs.org (chiffres précis : $248M sécurisés /
  $740M cible, 7,5M ha d'AMP à financement durable).
- WebFetch protectedplanet.net → 17 095 AMP mondiales, 23,05 % des eaux nationales protégées, 1,45 % des eaux
  au-delà de la juridiction nationale (ABNJ) — chiffre officiel Protected Planet, distinct du chiffre MPAtlas
  (9,9 % de l'océan mondial désigné, déc. 2025) car dénominateurs différents (eaux nationales vs océan total).
- WebFetch nfwf.org Coral Reef Stewardship Fund → tailles de subventions ($80k-$600k), budget cycle ($3,5M),
  obligations de suivi précises (métriques Easygrants, données spatiales).
- WebSearch BBNJ → chronologie précise et non ambiguë (60 ratifications 19 sept. 2025, entrée en vigueur
  17 janv. 2026, 82 ratifications au 14 janv. 2026).

## Erreurs / pistes mortes (source morte, outil en échec) et leçon
- WebFetch orsted.com/en/news/orsted-recoral → 403 Forbidden. Leçon : site corporate avec protection anti-bot ;
  ne pas insister, noter le programme comme connu de notoriété publique mais chiffres non sourcés dans ce dossier
  (marqué « hypothèse non sourcée » pour tout chiffre non confirmé).
- WebFetch en.wikipedia.org/wiki/Coral_restoration → 404 (mauvais titre de page). Leçon : vérifier le slug exact
  avant de fetcher Wikipédia plutôt que de deviner.
- WebFetch merx.com et aza.org/aza-news-releases/... → 403 Forbidden (protection anti-bot / mauvaise URL).
  Conséquence : pas de chiffre officiel sur les dépenses conservation des zoos/aquariums accrédités AZA, ni sur les
  appels d'offres canadiens type Merx — lacune documentée dans le dossier.
- WebFetch canadabuys.canada.ca avec mot-clé "marine protected area monitoring" → 0 résultat retourné par la page
  (recherche trop spécifique ou mauvais filtre). Lacune documentée : pas de preuve d'appel d'offres actif
  DFO/Parcs Canada au 7 sept. 2026 sur ce mot-clé exact.
- Fondation Tara, Oceankind (chiffres propres), Oceans 5 (montants agrégés), Blue Nature Alliance (montant $ total) :
  aucune des recherches n'a produit de chiffre agrégé officiel précis → notés comme lacunes avec fourchette
  « estimation » quand raisonnable, sinon absence assumée.

## Décisions prises sans validation externe (documentées, pas de question posée)
- J'ai choisi de traiter la divergence Protected Planet (23,05 % eaux nationales) vs MPAtlas (9,9 % océan mondial)
  en expliquant la différence de dénominateur plutôt qu'en choisissant arbitrairement un seul chiffre.
- Les 24 idées exclues (dont GrantMRV, spécifique aux subventions plastique/débris) ont orienté mes opportunités
  produit vers le financement de la biodiversité des fonds marins (AMP, récifs, TNFD/obligations bancaires,
  parrainage corporate) — aucune ne recycle GrantMRV telle quelle : le domaine (récifs/AMP vs débris plastiques),
  les bailleurs ciblés et les obligations de reporting sont différents.

## Résumé des 5 meilleures opportunités (voir dossier.md section e pour le détail)
1. Suite de conformité et preuve d'efficacité pour gestionnaires d'AMP (cible GFCR/PROBLUE/Blue Action
   Fund/Bezos Earth Fund) — le plus gros manque : 3,3 % de l'océan « effectivement » protégé contre 9,9 % désigné.
2. Filtrage risque nature côtier pour banques/assureurs (obligations TNFD, 733 organisations engagées nov. 2025,
   22 400 Md$ d'actifs) et vérification d'indicateurs de blue bonds (ex. Banco Bolivariano, 80 M$, -20 pb liés TNFD).
3. Tableau de bord de preuve de restauration corallienne pour sponsors corporate (Mars/Sheba 72 sites, Rolex
   Perpetual Planet 30+ partenariats, hôtels/croisiéristes) — remplace les relevés manuels de plongeurs.
4. Suivi benthique « EIA-as-a-service » pour développeurs éoliens offshore et poseurs de câbles (obligation
   d'évaluation d'impact BBNJ entrée en vigueur 17 janv. 2026 + suivi post-construction UE/US).
5. Surveillance des récifs d'éponges siliceuses et coraux d'eau froide en Colombie-Britannique pour Pêches et
   Océans Canada / Port de Vancouver — premier client atteignable localement depuis Vancouver.
