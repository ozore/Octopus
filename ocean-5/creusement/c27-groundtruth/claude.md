# Mémoire, c27-groundtruth, passe 5

Compteur WebSearch : 8 sur 8 utilisés. WebFetch : 6 appels (2 échecs, voir sources mortes).

## Requêtes qui ont marché
1. "FathomNet MBARI Ocean Vision AI underwater image database free annotation 2025" : a donné directement le coeur
   du verdict (FathomNet, financement NSF, 800 contributeurs).
2. "CVision AI Tator platform marine video annotation pricing" : a révélé que CVision AI, l'outil pressenti pour le
   pipeline de l'échelle, est déjà membre du consortium Ocean Vision AI, pas seulement un fournisseur d'outil neutre.
3. "BenthicNet dataset benthic imagery annotation NSERC 2024" : a confirmé un standard de taxonomie déjà adopté
   (CATAMI) à 190 000 images, gratuit, ce qui tue une partie de l'argument "standard manquant" du dossier de
   tendance. La partie NSERC (financement canadien) n'a pas été confirmée par cette requête précise.
4. "NOAA NSF FathomNet Ocean Vision AI grant funding contract 2024 2025 million" : a donné le montant exact du
   financement NSF (5 millions de dollars, AWD_ID 2137977) et la composition du consortium OVAI.
5. "data annotation labeling price per image cost 2025 expert specialized" : bonne base de prix généraliste et
   ratio expert (3 à 10 fois plus cher), faute de prix marin publié.
6. WebFetch sur research.ibm.com/blog/oceans-AI-model : le plus décisif de la session. A confirmé que Granite
   Geospatial Ocean est entraîné sur imagerie satellite Sentinel 3 plus une centaine de mesures de terrain, pas sur
   des photos sous marines annotées par des plongeurs. Ce seul fait invalide le client nommé du barreau 1 original.

## Sources mortes ou bloquées
- https://www.find-tender.service.gov.uk/Notice/035631-2024 : WebFetch a renvoyé HTTP 403. Contourné en gardant
  le résumé donné par les résultats WebSearch (avis CEFAS24 70, sans obtenir la valeur du contrat).
- Pages produit (aquabyte.ai) et pages "about" génériques (fathomnet.org/about, mbari.org/data/fathomnet) : peu
  d'information sur la compensation des contributeurs et les prix ; utile seulement pour confirmer la gratuité et
  l'existence de la validation experte, pas pour les montants.

## Leçons
- Vérifier le client nommé avant tout : la phrase "IBM et PML ont publié Granite Geospatial Ocean" dans le dossier
  de tendance ne dit pas sur quoi le modèle est entraîné ; une seule requête WebFetch a suffi à révéler que ce
  client précis n'achète pas ce que l'échelle vend.
- Chercher d'abord le concurrent gratuit financé par des fonds publics pluriannuels (NSF, Packard) avant de chercher
  le prix de marché : si le concurrent gratuit existe et est bien financé, le prix de marché devient secondaire.
- Le marché général de l'annotation (BasicAI, GigaBPO) donne des fourchettes utiles par analogie quand aucun prix
  marin n'est publié, à condition de l'étiqueter clairement comme extrapolation, pas comme prix marin réel.

## Trois lignes de bilan
Ce que je referais : commencer par vérifier techniquement ce sur quoi le client nommé du barreau 1 entraîne
réellement son modèle, avant toute autre recherche ; cela a permis de trancher vite avec un seul WebFetch.
Ce que je ne referais pas : dépenser une requête WebSearch entière sur "Scale AI Labelbox iMerit marine" alors que
l'absence de résultat était prévisible ; une requête plus ciblée sur un fournisseur marin nommé aurait mieux servi.
Ce qui m'a surpris : que l'écosystème gratuit (FathomNet, Ocean Vision AI, BenthicNet) soit à ce point institutionnel
et bien financé (plus de 10 millions de dollars américains cumulés entre NSF, Packard et consortiums), au point que
l'outil même pressenti pour construire l'échelle (Tator, CVision AI) appartient déjà à ce même écosystème gratuit.
