# Mémoire du cartographe « bureaux d'études »

## Compteur de recherches web
8 WebSearch utilisées sur 8 autorisées (quota épuisé). WebFetch utilisé environ 25 fois en complément (libre,
non limité par le brief).

## Requêtes WebSearch qui ont marché (dans l'ordre)
1. `Ecobot software pricing subscription environmental consulting 2026` : bon résultat, tiers Free/Essential/Pro/Enterprise identifiés, prix précis obtenus ensuite par WebFetch direct sur manager.ecobot.com/pricing.
2. `"environmental consultant" job salary "ArcGIS" required marine coastal California OR Florida` : bon résultat, salaires CA/FL obtenus.
3. `professional indemnity insurance ecological consultant annual premium cost UK` : très bon résultat, chiffres précis et datés (Simply Business).
4. `Esri ArcGIS Online pricing small business annual subscription cost 2026` : résultat faible (Esri ne publie pas ses prix entreprise), mais a révélé la page ArcGIS for Personal Use à 100 $/an, réutilisée en ligne 12.
5. `"hydrodynamic modelling" OR "hydrodynamic modeling" consultant job "MIKE 21" OR "Delft3D" OR "TELEMAC" required salary` : bon résultat, taux horaires ZipRecruiter et confirmation des trois logiciels standards.
6. `"ingénieur écologue" OR "chargé d'études environnement" bureau d'études salaire France offre emploi 2025` : bon résultat, plusieurs fiches métier convergentes.
7. `"marine biologist" OR "benthic surveyor" job salary SCUBA required diving environmental consulting UK OR California` : résultat moyen, chiffres agrégés toutes activités, pas isolés pour le conseil.
8. `ROV rental day rate survey OR drone survey day rate environmental consulting cost` : résultat moyen pour le drone (fourchettes utiles), aucun prix pour le ROV (véhicule télécommandé sous marin).

## Sources mortes ou bloquées (WebFetch)
- portvancouver.com, jasco.com : bloqués par le brief, jamais tentés.
- ziprecruiter.com/Salaries/Marine-Environmental-Consultant-Salary : 403 Forbidden.
- ziprecruiter.com/Jobs/Marine-Environmental-Consultant/--in-Florida : 403 Forbidden.
- g2.com/products/ecobot-ecobot/reviews : 403 Forbidden (contourné via la fiche Capterra, qui a marché).
- www.esri.com/en-us/arcgis/products/arcgis-online/buy : page sans prix, renvoie vers un devis commercial.
- pricingnow.com/question/arcgis-pricing/ : a donné une estimation tierce exploitable, mise en tableau « à confirmer » seulement (pas une source officielle).
- www.bqe.com/pricing et /core/pricing : 404, puis page sans montant (« devis sur demande »).
- www.dji.com/mavic-3-enterprise/buy : redirection 302 vers une page 404.
- ca.indeed.com/career/environmental-consultant/salaries/Vancouver--BC : 403 Forbidden.
- www.glassdoor.co.uk/Salaries/... : 403 Forbidden.
- www.jobbank.gc.ca/wagereport/occupation/<code> : la page ne respecte pas le code NOC (national occupational classification, classification nationale des professions) passé dans l'URL, retourne toujours un autre métier ; probablement rendu par JavaScript, inexploitable en WebFetch.
- www.thehartford.com/.../cost : 503 Service Unavailable.
- www.insureon.com/environmental-consultant-insurance : 404.
- www.blueskiesdronerental.com/all-rentals/ et sepcotech.com/rov-rental-service : pages sans prix affiché (gabarits vides ou 404).
- www.planet.com/pricing/ : page vide au moment de la récupération.

## Sources qui ont bien marché (WebFetch direct, prix officiels)
- manager.ecobot.com/pricing (tiers exacts)
- agisoft.com/buy/online-store/ (prix exacts, boutique officielle)
- simplybusiness.co.uk/business-insurance/insurance-for-environmental-consultants/ (chiffre daté)
- salary.com/research/salary/recruiting/environmental-consultant-salary/fl (percentiles exacts)
- cieem.net/join-us/membership-fees/ (barème complet par grade)
- payscale.com/research/US/Job=Commercial_Diver/Hourly_Rate (percentiles exacts, échantillon connu)
- biigle.de (confirmation gratuité, non retenu comme ligne de dépense car prix nul, utile pour comprendre la mémoire transmise)
- capterra.com/p/203394/Ecobot/ (avis utilisateurs, ce que l'outil ne fait pas)

## Bilan en trois lignes
Ce que je referais : aller chercher les pages officielles de prix (éditeur, assureur, ordre professionnel) par
WebFetch direct dès qu'un WebSearch en donne l'URL, plutôt que de me contenter du résumé de recherche : Ecobot,
Agisoft et CIEEM ont donné leurs meilleurs chiffres de cette façon. Ce que je ne referais pas : chercher un salaire
précis sur des sites qui bloquent systématiquement les robots (Indeed, Glassdoor, ZipRecruiter en page directe,
403 à chaque fois) ; mieux vaut se contenter du résumé fourni par l'outil de recherche lui même, qui contourne le
blocage, et le citer comme tel. Ce qui m'a surpris : la population que je devais cartographier facture l'heure et
paie très peu de logiciel de marque nommée (beaucoup d'outils cités dans la mémoire transmise sont gratuits ou en
bêta gratuite), si bien que les lignes de dépense les plus solides et les plus faciles à lire ne sont pas des
logiciels mais des salaires, des cotisations professionnelles et des primes d'assurance, des dépenses que le brief
n'annonçait pas comme prioritaires mais que les sources imposées (offres d'emploi, barèmes d'associations) rendent
justement les plus faciles à prouver.
