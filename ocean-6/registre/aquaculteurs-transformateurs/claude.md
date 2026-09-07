# Mémoire du cartographe « aquaculteurs-transformateurs »

## Compteur de recherches WebSearch
8 sur 8 utilisées (quota atteint). WebFetch utilisé environ 25 fois en complément, sans limite imposée.

## Requêtes qui ont marché (WebSearch)
1. « ASC certification audit cost small farm fee 2025 aquaculture » : pas de prix, mais liste des organismes
   certificateurs (SCS, NSF, SGS, DNV).
2. « BAP Best Aquaculture Practices certification application fee cost per facility » : pas de prix, confirme
   le mécanisme de devis.
3. « "quality assurance" OR "compliance coordinator" seafood processor salary indeed HACCP » : bon résultat,
   trois salaires chiffrés (ZipRecruiter).
4. « SIMP Seafood Import Monitoring Program recordkeeping cost compliance third party audit fee » : très bon
   résultat, chiffre officiel du Federal Register (10 000 $US/espèce).
5. « shellfish farm water quality monitoring sensor subscription cost YSI sonde price » : bon résultat, mène à
   l'article PEBL avec tableau de prix comparatif.
6. « Wholechain OR "Trace Register" seafood traceability software pricing plan per month » : aucun prix trouvé,
   piste morte pour la tarification (mais confirme l'existence commerciale des deux outils).
7. « USDA aquaculture crop insurance premium cost oyster salmon shellfish grower » : excellent résultat, mène à
   la page ACES avec tous les chiffres du programme pilote.
8. « HACCP plan development consultant cost seafood processor small business price » : bon résultat, plusieurs
   fourchettes convergentes.

## Sources mortes (WebFetch en échec, 403 ou 404)
- aquaculturenorthamerica.com (503 puis pas de chiffres malgré succès de lecture)
- bapcertification.org/pricing, /pricing-and-fees (404)
- ams.usda.gov (cost-share bio, 403 ; page alternative 404)
- xpertsea.com/pricing (403)
- doh.wa.gov page croissants coquillages (404, mauvaise URL)
- maine.gov/dmr baux aquacoles (404 x2, mauvaises URL)
- capterra.com AquaManager (404)
- g2.com Wholechain pricing (403)
- naturland.de fees (404)
- msc.org cost-of-msc-certification (404)
- nass.usda.gov census aquaculture PDF (404, mauvaise URL)
- eurostat aquaculture statistics-explained : pas de nombre d'entreprises, seulement des volumes de production
- taylorshellfish.com/pages/sustainability (503)
- 2026-USDA-Shellfish-Pilot-Insurance-Costs-Information.pdf (PDF illisible en extraction, contourné par la page
  ACES qui contient les mêmes chiffres en HTML lisible)

## Ce qui a bien fonctionné comme méthode
Chercher d'abord via WebSearch les pages qui *pourraient* contenir un chiffre, puis lire la meilleure candidate
avec WebFetch plutôt que de deviner des URL de tarification à l'aveugle : les devinettes d'URL (bapcertification,
naturland, capterra, g2, nass, doh.wa.gov, maine.gov) ont presque toutes échoué. Les sources gouvernementales
(Federal Register, RMA, ACES, universités agricoles) et les forums professionnels (IFSQN) donnent des chiffres
bien plus souvent que les sites des organismes de certification eux mêmes, qui préfèrent le devis individuel.

## Bilan en trois lignes
Ce que je referais : commencer par les postes de dépense obligatoires et chiffrés par un tiers indépendant de
l'acheteur (assurance USDA, règle fédérale SIMP) avant les certifications privées, qui cachent systématiquement
leur prix derrière un devis.
Ce que je ne referais pas : deviner des URL de page de tarification pour des éditeurs de logiciel ou des
organismes de certification sans indice préalable qu'elle existe ; le taux de succès a été proche de zéro et
cela a consommé du temps sans consommer de quota WebSearch, mais au prix de l'efficacité.
Ce qui m'a surpris : les organismes de certification (ASC, BAP, MSC, bio) sont unanimement opaques sur le prix
en ligne malgré des décennies d'existence, alors que des dépenses bien plus techniques (assurance récolte
USDA, audit de traçabilité SIMP) sont publiées noir sur blanc dans des documents réglementaires ; l'Europe est
restée presque vide de chiffres faute de temps de recherche, contrairement à l'Amérique du Nord où la
réglementation fédérale publie ses propres estimations de coût.
