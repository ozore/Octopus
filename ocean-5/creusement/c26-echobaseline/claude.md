# Mémoire de creusement, EchoBaseline (c26)

## Requêtes qui ont marché (WebSearch, compteur 8 sur 8 utilisés)

1. "NatureMetrics eDNAtec Jonah Ventures eDNA sequencing interpretation price per sample 2025 2026" : pas de
   prix, mais confirme les trois noms comme acteurs réels.
2. "OBITools Tourmaline MIDORI BOLD eDNA metabarcoding open source pipeline bioinformatics" : confirme OBITools
   et l'usage de BOLD ou NCBI GenBank comme bases de référence. Tourmaline et MIDORI non retrouvés directement.
3. "BOEM offshore wind environmental DNA eDNA monitoring requirement permit 2025 2026" : confirme l'usage eDNA
   par le BOEM comme outil, pas de mandat de permis daté trouvé. A donné Empire Wind et NJDEP comme pistes.
4. "Norway aquaculture eDNA monitoring requirement regulation lakseoppdrett miljø DNA" : confirme la recherche
   active (Norwegian Veterinary Institute) sans mandat réglementaire trouvé.
5. "public eDNA sequence dataset NCBI SRA OBIS offshore wind biodiversity monitoring open data" : très
   productive, a donné le jeu OBIS mer du Nord belge (30 sites, BioProject PRJNA1032405) et l'étude Horns Rev 1
   avec séquences au NCBI SRA. C'est la base du test à 2000 dollars en section 7.
6. "environmental consulting firm eDNA sampling offshore wind subcontract laboratory interpretation habitat
   compensation mitigation" : la meilleure requête de la session. A donné Natural Power, EDF Renewables,
   Fugro, GMGI et MA DMF. N'a rien donné pour l'aquaculture ni la compensation d'habitat précisément.
7. "dry lab eDNA bioinformatics only no wet lab sequencing outsourced analysis service company" : confirme que
   la séparation laboratoire humide et bio informatique est une pratique commerciale normale en génomique
   générale, pas de fournisseur eDNA spécifique "interprétation seule" trouvé nommément.
8. "eDNA monitoring methodology comparability switching laboratory long-term biodiversity time series
   standardization challenge" : la requête la plus décisive pour la question 8. A confirmé que le protocole de
   laboratoire, pas la couche d'interprétation, est le facteur de rupture de continuité. A changé le verdict du
   dossier sur la solidité de l'actif.

## Sources mortes ou partiellement mortes

- naturetechmemos.com (article "Top 10 eDNA Startups") : erreur 503, jamais récupéré.
- naturemetrics.com/faqs : redirige vers un portail Zendesk, non exploité (temps insuffisant après le
  redirect, jugé secondaire face au reste du budget WebFetch).
- appliedgenomics.io : domaine introuvable (DNS), Applied Genomics reste non vérifié en dehors de sa mention
  dans l'annuaire eDNA Resources.
- group.bureauveritas.com/services/edna-environmental-dna-analysis : page 404, Bureau Veritas reste non
  vérifié pour son offre eDNA précise.

## Leçons

- Le WebFetch libre (hors quota) a fait le plus gros du travail utile cette session : après une requête
  WebSearch générique, fetcher directement les pages des acteurs nommés (ednatec.com, naturalpower.com,
  inspireenvironmental.com, obis.org) a donné des réponses plus précises que les résumés de recherche.
- Chercher "qui vend déjà cela" avant tout, comme l'impose le brief, a été décisif : la première paire de
  requêtes a suffi à établir que le geste central du barreau 1 original est déjà vendu par un acteur financé
  (NatureMetrics avec EDF Renewables). Continuer dans cette direction en confirmant avec le projet Blyth a
  changé le verdict d'ouverture du dossier.
- La requête sur la comparabilité méthodologique (question 8) aurait dû venir plus tôt : c'est elle qui a le
  plus changé la lecture de l'actif qui compose. À refaire, la placer en position 3 ou 4 plutôt qu'en dernier.
- Deux catégories de clients demandées par la mission (aquaculteurs, développeurs de compensation) n'ont reçu
  aucune preuve directe faute de budget de recherche restant : elles sont marquées "supposé" dans le dossier,
  pas fabriquées comme vérifiées.

## Bilan en trois lignes

Ce que je referais : commencer par vérifier "qui vend déjà cela" avec des WebFetch directs sur les sites des
labos nommés plutôt que des recherches génériques, et garder une ou deux recherches en réserve pour la
question de continuité qui s'est révélée la plus décisive.
Ce que je ne referais pas : dépenser deux recherches sur les buyeurs moyens (bureau, aquaculture, compensation)
en une seule requête combinée trop large ; séparer aquaculture et compensation d'habitat en deux requêtes
ciblées aurait probablement donné des noms vérifiés au lieu de suppositions.
Ce qui m'a surpris : au moins deux laboratoires (eDNAtec, NatureMetrics) vendent déjà exactement le geste que
le barreau 1 original visait, et directement à des développeurs éoliens en mer en Europe, alors que le dossier
de tendance ne l'avait pas trouvé ; la continuité de série, présentée comme le verrou principal, s'avère plus
fragile que prévu car la société ne contrôle pas le laboratoire humide qui est le vrai facteur de comparabilité.
