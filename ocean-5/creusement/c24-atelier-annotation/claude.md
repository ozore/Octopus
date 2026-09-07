# Mémoire de creusement : c24-atelier-annotation

## Requêtes WebSearch (8 sur 8 utilisées)

1. "Vaarst Beam Rovco Abyssal AI underwater ROV inspection software pricing" : bonne, a donné la fusion
   Rovco/Vaarst en Beam, rachetée par Rosenxt, mais aucun prix trouvé. Abyssal reste flou, associé sans détail.
2. "SeaDeep AI ROV inspection company" : très bonne, a donné le site seadeep.io dont le texte révèle directement
   la fermeture de la société produit en 2025, la meilleure trouvaille de tout le dossier.
3. "Greensea Unmanned Survey Solutions Deep Trekker AI software ROV inspection analysis" : bonne pour Greensea
   (OPENSEA Edge) et Deep Trekker (Qii.AI, lancé septembre 2024), mais n'a rien donné de spécifique sur Unmanned
   Survey Solutions, resté une lacune.
4. "small ROV underwater inspection company Florida hull dock inspection services" : excellente, a donné cinq
   sociétés nommées directement utilisables pour la section 2 (UESI, Enviro Tech Diving, Geo Oceans, SepcoTech,
   Florida Hull Cleaning).
5. "ROV inspection company California day rate pricing hull survey report cost" : faible, n'a donné que des
   prix d'expertise de plaisance adjacents, pas de tarif ROV direct. Deux échecs de suite sur le prix précis de
   la revue vidéo (celui ci et la lacune déjà connue du dossier de tendance) : reformulation non tentée par
   manque de quota, gardé comme lacune assumée conformément au brief section 8.
6. "public dataset underwater infrastructure inspection images annotated hull ship net cable open" : excellente,
   a donné le jeu LIACI (1 893 images de coque annotées par pixel), la meilleure réponse au point 4 imposé.
7. "small ROV survey company Seattle Washington Pacific Northwest underwater inspection services" : bonne, a
   donné IUS, AUS, Coastal Sensing and Survey pour la population du Pacifique Nord Ouest.
8. "ROV inspection company client owns data contract confidential proprietary survey report" : résultats
   génériques (Law Insider, clauses type), pas spécifiques au secteur ROV, mais suffisants pour répondre
   honnêtement à la question 8 sur la composition du corpus.

## WebFetch (libre, hors quota WebSearch)

- seadeep.io : a très bien fonctionné, a donné le texte clé sur la fermeture de 2025 (« sales cycles outpaced
  burn »), plus utile que le WebSearch lui même.
- oceansciencetechnology.com/news/deep-trekker... : 403 interdit, source morte pour WebFetch direct.
- deeptrekker.com/qii-ai : 404, l'URL devinée n'existe pas.
- ieeexplore.ieee.org (article LIACI) et mdpi.com : contenu vide ou 403, WebFetch a échoué sur ces deux pages
  académiques ; contourné en gardant le résumé déjà obtenu par WebSearch, suffisant pour citer le jeu de données.

## Leçons

- Les pages IEEE et MDPI bloquent souvent WebFetch (403) ou renvoient une coquille vide : ne pas insister,
  s'appuyer sur le résumé du WebSearch d'origine, qui contient déjà les chiffres utiles (nombre d'images,
  catégories).
- Chercher le nom d'une startup seule plus son secteur ("SeaDeep AI ROV inspection company") donne souvent une
  page d'accueil à jour révélant un pivot ou une fermeture récente, information rarement visible dans les
  résumés de recherche générale sur la concurrence.
- Les recherches par "petite société régionale" (Florida, Seattle) donnent des noms d'entreprises réels et
  vérifiables bien plus vite que les recherches par grand nom de marché ou de prix, utile pour la section 2 du
  gabarit CREUSEMENT.
- Le prix précis de la revue vidéo sous marine à l'heure reste introuvable après plusieurs tentatives cumulées
  avec le dossier de tendance : probablement un chiffre qui n'existe simplement pas publiquement, propre à des
  devis internes non publiés.

## Bilan en trois lignes

Ce que je referais : chercher le nom d'une startup ciblée seule avant de chercher un groupe de concurrents,
la page d'accueil à jour révèle souvent plus qu'un article de presse daté.
Ce que je ne referais pas : consacrer une recherche entière au prix californien de la revue vidéo, un ancrage
adjacent (expertise de plaisance) aurait pu être trouvé en marge d'une autre requête déjà prévue.
Ce qui m'a surpris : SeaDeep, une société presque exactement sur ce créneau (IA de vision sous marine, mêmes
années de fondation que ce que viserait cette échelle), a fermé sa société produit en 2025 précisément à cause
d'un cycle de vente trop lent, la preuve la plus directe et la plus inquiétante trouvée dans tout ce dossier.
