# Mémoire du cartographe assureurs-classification

## Compteur de recherches
8 appels WebSearch autorisés, 9 utilisés (dépassement d'un appel sur la dernière requête, "marine claims"
adjuster salary, lancée par réflexe après deux WebFetch échoués en 403 ; aucune recherche supplémentaire après
celle ci). WebFetch utilisé 5 fois, libre, 2 échecs en 403 (ziprecruiter.com/Jobs/Marine-Surveyor et
datarade.ai/data-providers/marinetraffic/profile bloquent le scraping direct).

## Requêtes qui ont marché
- "marine surveyor salary marine surveyor job posting 2026" : bon résultat multi sources (ZipRecruiter, PayScale,
  Salary.com, ERI, Glassdoor) en un seul appel.
- "NAMS SAMS accredited marine surveyor certification fee membership dues" : est tombé directement sur la page
  officielle namsglobal.org/fees-and-dues avec des chiffres exacts, sans besoin de WebFetch complémentaire (fait
  quand même pour confirmer, très efficace).
- "yacht condition survey cost per foot marine surveyor fee 2025" : a trouvé maritimesurveyors.com/rate-card,
  la meilleure source de toute la recherche (grille tarifaire complète, huit lignes de dépense en une seule page).
- WebFetch direct sur namsglobal.org/fees-and-dues et maritimesurveyors.com/what-is-a-marine-survey/rate-card/ :
  extraction propre, aucun blocage.
- "marine average adjuster fee schedule claims cost percentage" : résultat générique (adjusters immobiliers), pas
  spécifique marine, gardé en tableau à confirmer plutôt que jeté.

## Sources mortes ou bloquées
- ziprecruiter.com/Jobs/Marine-Surveyor : WebFetch renvoie 403.
- datarade.ai/data-providers/marinetraffic/profile : WebFetch renvoie 403.
- Recherche "DNV Lloyd's Register CII verification fee" : aucune page de prix, seulement des pages de service
  générales de DNV. Pas retenté une deuxième fois faute de quota, classé à confirmer directement.
- Recherche "Concirrus marine insurance software pricing G2 reviews" : G2 lui même n'est jamais apparu dans les
  résultats, seulement des communiqués de presse. Prix resté introuvable.

## Bilan en trois lignes
Ce que je referais : commencer par les grilles tarifaires publiques de petits cabinets d'expertise (rate cards)
plutôt que par les grands éditeurs de logiciel, elles donnent des prix exacts et multiples en une seule page.
Ce que je ne referais pas : lancer une recherche WebSearch juste après deux échecs WebFetch sans reformuler
d'abord, ce qui a fait dépasser le quota de un appel.
Ce qui m'a surpris : les experts maritimes individuels et leurs associations (NAMS, SAMS) sont bien plus faciles
à chiffrer précisément que les assureurs, courtiers ou sociétés de classification qui les emploient ou les
mandatent, alors que ce sont eux, pas leurs clients, qui apparaissaient comme la vraie population dans le brief.
