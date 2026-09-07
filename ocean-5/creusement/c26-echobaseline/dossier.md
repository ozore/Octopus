# Dossier de creusement : EchoBaseline

Date : 7 septembre 2026. Agent : c26 echobaseline, passe 5, projet Octopus.
Échelle reçue (échelle 2 du dossier de tendance donnee ocean) : une mémoire continue de la biodiversité de
chaque site éolien en mer, construite à partir d'échantillons d'ADN environnemental (eDNA) et de données
océaniques publiques, montrée au régulateur année après année.

Verdict d'ouverture, tel qu'exigé par l'ordre de travail : le barreau 1 tel qu'écrit (vendre l'interprétation
eDNA directement à un grand développeur comme Equinor) est déjà fait, en bout en bout, par au moins deux
laboratoires (eDNAtec et NatureMetrics). L'échelle n'est pas morte, mais le client du barreau 1 doit changer :
pas le grand développeur, mais le bureau d'études moyen qui aujourd'hui sous traite déjà ces laboratoires
projet par projet sans couche de fusion continue avec les données océaniques publiques. Le détail suit.

## 1. Qui vend déjà cela

- eDNAtec (Terre Neuve, Canada) : workflow EnviroSeq, du prélèvement à l'interprétation, livre des "rapports
  de biodiversité complets avec information exploitable" (traduction), clients nommés dans les secteurs
  Énergie et Pêches (vérifié, source ednatec.com). Aucun prix trouvé.
- NatureMetrics (Royaume Uni) : vend des kits de prélèvement et l'analyse de laboratoire complète. Dans le
  projet Blyth Offshore Demonstrator (18 mois, quatre campagnes), elle a fait l'extraction d'ADN et
  l'identification d'espèces pour EDF Renewables (développeur éolien en mer) avec Natural Power (bureau
  d'études) comme chef de projet ; l'eDNA a détecté 70 % d'espèces de poissons en plus que le chalutage (54
  contre 26) (vérifié, source naturalpower.com et naturemetrics.com). Preuve directe que "prélever, analyser,
  livrer un rapport de biodiversité à un développeur éolien" est déjà vendu par un acteur financé en Europe.
- Jonah Ventures : boutique en ligne de kits eDNA (store.jonahventures.com), existence vérifiée, périmètre de
  service non détaillé cette session (lacune).
- Applied Genomics et Bureau Veritas : nommés dans l'annuaire "eDNA Labs" du site eDNA Resources
  (ednaresources.science/edna-labs, vérifié comme figurant dans la liste), mais leurs pages de service n'ont
  pas répondu cette session (domaine introuvable, puis page 404) : offre et prix non vérifiés, lacune plutôt
  qu'absence de concurrent.
- Fugro (bureau d'ingénierie côtière) développe des méthodes de prélèvement eDNA à distance en mer du Nord
  (vérifié, source envirotecmagazine.com), et Gloucester Marine Genomics Institute (GMGI, institut de
  recherche à but non lucratif) fait tourner un programme eDNA avec l'agence d'État Massachusetts Division of
  Marine Fisheries (MA DMF) sur trois zones de baux éoliens en mer (vérifié) : un acteur public et un acteur
  associatif financent déjà un suivi multi sites sans facturer de série au marché privé, un signal de risque
  mais pas une offre commerciale équivalente.
- Pipelines ouverts : OBITools (logiciel de métabarcodage ADN de style Unix, utilisé avec NCBI GenBank ou BOLD,
  Barcode of Life Data System, pour l'assignation taxonomique) est vérifié actif et documenté (source Galaxy
  Training Network). OBIS (Ocean Biodiversity Information System, infrastructure intergouvernementale) fait
  tourner le pipeline PacMAN, gratuit, qui prend des séquences brutes et sort un tableau Darwin Core prêt à
  publier, avec accompagnement méthodologique gratuit (vérifié, source obis.org). Tourmaline (pipeline QIIME2)
  et MIDORI (base mitochondriale) non retrouvés directement cette session, connaissance générale non
  revérifiée (supposé).

Conclusion de l'étape 1 : le geste "interprétation eDNA livrée à un développeur éolien" est déjà fait par des
acteurs financés. Ce qui n'est vérifié nulle part cette session : une fusion systématique et vendue de la
série eDNA avec les courants et températures publics (Copernicus Marine, vu dans le dossier de tendance) pour
expliquer la variance des détections, livrée comme série versionnée à un acheteur autre que le développeur
principal. C'est l'espace qui reste, plus étroit que prévu.

## 2. Le client du barreau 1 (trois candidats, remplaçant Equinor)

1. Natural Power (bureau d'études énergies renouvelables, Royaume Uni, actif dans le projet Blyth) : prélève et
   pilote les études de terrain, sous traite aujourd'hui le laboratoire et l'interprétation à NatureMetrics
   projet par projet (vérifié comme rôle dans le projet Blyth). Raison d'achat : plutôt que gérer une relation
   fournisseur à chaque campagne, une couche standardisée qui fusionne la sortie du labo avec les courants
   publics et maintient une série versionnée réduit son risque de refaire le travail de mise en contexte à
   chaque rapport. Montant payé aujourd'hui à la main : non trouvé pour ce projet précis (lacune).
2. INSPIRE Environmental (bureau d'études environnemental pour l'éolien en mer, Rhode Island et Aberdeen,
   ligne de service environnement du groupe Venterra, plus de neuf sociétés spécialisées éolien en mer) :
   vérifié comme bureau de taille moyenne faisant de l'acquisition et l'interprétation de données benthiques et
   halieutiques pour des développeurs (vérifié, source inspireenvironmental.com). Son offre eDNA spécifique et
   un éventuel partenaire laboratoire n'ont pas été confirmés cette session (supposé). Raison d'achat plausible :
   compléter son offre de données de site avec une couche eDNA fusionnée aux données océaniques publiques sans
   monter une équipe de bio informatique interne.
3. Un acteur aquacole moyen en Colombie Britannique (exemple retenu : Grieg Seafood BC, filiale d'un
   salmoniculteur privé norvégien) : non recherché cette session, nom retenu par connaissance générale
   (supposé), à vérifier au premier appel. La surveillance pathogène par eDNA est un axe de recherche actif en
   aquaculture salmonicole norvégienne (vérifié, source Norwegian Veterinary Institute, vetinst.no), donc une
   demande latente existe même sans mandat formel confirmé.
4. Un développeur de compensation d'habitat marin ou côtier moyen (exemple retenu : Resource Environmental
   Solutions, société privée américaine de banques de compensation) : non recherché, nom retenu par
   connaissance générale (supposé). Catégorie la moins étayée du dossier : aucune preuve d'un achat eDNA actif
   par un développeur de compensation nommé.

Correction assumée : sur les trois catégories demandées (bureau qui prélève sans interpréter, aquaculteur,
développeur de compensation), seule la première est étayée par une preuve directe cette session (Natural
Power, INSPIRE). Les deux autres restent des candidats plausibles non vérifiés : le budget de recherche a été
concentré sur les points 1, 2, 5 et 6, jugés plus décisifs pour la survie de l'échelle.

## 3. Le produit, six fonctionnalités dans l'ordre de vente

1. Ingestion des rapports de séquençage bruts (fichiers FASTQ ou tableaux d'abondance déjà assignés) fournis
   par le laboratoire partenaire du client, sans dépendre d'un format propriétaire unique.
2. Assignation taxonomique standardisée et versionnée avec OBITools et une base de référence publique (BOLD,
   NCBI GenBank), pour que le même échantillon rejoué un an plus tard avec le même pipeline documenté donne un
   résultat comparable (vérifié : OBITools et bases publiques existent et sont l'infrastructure standard).
3. Contrôle qualité automatisé (contaminants, faux positifs, complétude par réplicat), un geste aujourd'hui
   fait à la main par un bio informaticien du bureau d'études ou du laboratoire.
4. Fusion avec les séries publiques Copernicus Marine (courants, température, vérifié gratuit dans le dossier
   de tendance) pour expliquer la variance des détections par site et par saison, ce qui n'a été trouvé nulle
   part comme produit commercial existant cette session.
5. Génération d'un rapport standardisé versionné, comparable d'une campagne à l'autre, citable dans un dossier
   réglementaire, remplaçant le tableur statique produit à la main.
6. Accès en lecture à la série historique par site pour les tiers autorisés (assureur, régulateur, deuxième
   bureau d'études repris sur le même site), vendu en option à partir du barreau 2.

Pourquoi impossible en 2024 sans IA : l'assignation taxonomique assistée, le contrôle qualité automatisé et la
mise en corrélation multi source à grande échelle demandent des modèles de langage et des pipelines de
traitement de données que l'IA générative et les grands modèles rendent praticables pour une personne seule ;
avant, ce travail demandait une équipe de bio informaticiens dédiés (partiellement vérifié par l'existence
récente, 2023 à 2025, des pipelines et modèles cités dans le dossier de tendance ; le lien causal "impossible
avant l'IA générative" reste en partie une inférence, étiqueté supposé).

Données pour amorcer sans un seul courriel : les jeux eDNA publics d'OBIS (51 jeux de données, plus de
19 millions d'enregistrements, vérifié), dont un jeu eDNA de 30 sites en mer du Nord belge, à l'intérieur et à
l'extérieur de deux parcs éoliens en mer (BioProject PRJNA1032405, vérifié), et une étude métagénomique publiée
sur le parc éolien danois Horns Rev 1 avec séquences déposées au NCBI SRA (Sequence Read Archive) (vérifié,
source Nature Scientific Reports et PubMed).

## 4. L'actif qui compose, barreau par barreau, et le test adverse

- 2027 : deux ou trois séries pilotes sur sites publics rejoués (voir section 7), plus la première série réelle
  chez le client du barreau 1 corrigé. Actif : le pipeline versionné documenté, pas encore un historique long.
- 2028 : deux baselines consécutives chez deux clients. Actif : première preuve que la fusion aux courants
  publics explique une part mesurable de la variance, ce qui n'existe encore nulle part ailleurs comme produit.
- 2030 : historique pluriannuel sur huit à dix sites. Actif : la série elle même, plus longue que ce qu'un
  nouvel entrant peut produire en partant de zéro.
- 2033 : accès API vendu à des tiers (assureurs, régulateurs). Actif : un format de sortie cité en dehors de
  l'entreprise, début de standard de fait.
- 2036 : la plus longue série continue fusionnée eDNA et données océaniques sur les sites suivis.

Test adverse : un concurrent avec 5 millions de dollars en 2031 peut recruter une équipe, s'associer à
eDNAtec ou NatureMetrics (déjà vertically intégrés, déjà déployés en énergie) et lancer une offre de fusion
équivalente en moins d'un an, car le savoir faire technique (OBITools, bases publiques, Copernicus Marine) est
public et non protégé. Ce que le concurrent ne peut pas racheter en un an, c'est l'historique déjà accumulé
site par site chez les clients déjà signés, à condition que ces clients n'aient pas changé de laboratoire de
séquençage en cours de route (voir section 5, la nuance est décisive). Le concurrent réussit en revanche s'il
convainc le client de rejouer les séquences brutes archivées avec son propre pipeline : la section suivante
montre que c'est technique ment faisable, ce qui affaiblit le verrou plus que le dossier de tendance ne le
supposait.

## 5. Question 8, puis les sept questions

Question 8, plus difficile à attaquer en 2031 qu'en 2027 : incertain, en baisse par rapport au dossier de
tendance. La littérature confirme que changer de protocole de laboratoire pendant un suivi longitudinal
compromet la comparabilité, et que ce protocole, pas la couche d'interprétation, casse le plus la continuité
(vérifié, source PMC sur la standardisation du metabarcoding eDNA marin, et synthèse citant des
"inconsistances substantielles" au changement de laboratoire). EchoBaseline ne possède pas de laboratoire
humide : le verrou technique réel lui échappe. Les séquences brutes sont couramment déposées au NCBI SRA sous
forme de BioProject (vérifié, pratique observée dans Horns Rev et mer du Nord belge, section 3) : un
concurrent qui obtient les séquences archivées du client, avec le même protocole de laboratoire encore en
place, peut rejouer l'interprétation sur les mêmes bases publiques et reproduire une série comparable. Le
verrou réel est donc la relation avec le laboratoire de séquençage et la connaissance fine du site, plus
faciles à copier qu'annoncé.

1. Qui signe, avec quelle ligne budgétaire existante ? Le bureau d'études (Natural Power, INSPIRE) qui refacture
   déjà des services de laboratoire à ses clients développeurs, avec une ligne budgétaire de sous traitance
   environnementale existante (vérifié comme pratique dans le projet Blyth). Incertain pour l'aquaculteur et le
   développeur de compensation, faute de client nommé vérifié.
2. La preuve se retourne-t-elle contre lui ? Non a priori : une série mieux fondée statistiquement (fusion aux
   courants) renforce un dossier réglementaire plutôt qu'elle ne l'affaiblit, sauf si elle révèle une variance
   inexpliquée que le client aurait préféré ne pas documenter (incertain, pas de cas trouvé).
3. L'IA est elle le produit ? Oui pour l'assignation taxonomique assistée et la fusion multi source à grande
   échelle (vérifié comme rendu praticable par les modèles récents cités en section 3, avec la réserve du lien
   causal notée plus haut).
4. Existe t il gratuit ou déjà acheté ? Oui pour l'interprétation seule (eDNAtec, NatureMetrics, vérifié). Oui
   pour un pipeline gratuit sans accompagnement commercial (OBIS PacMAN, vérifié). Non trouvé pour la fusion
   continue vendue avec les données océaniques publiques : c'est la niche restante, plus étroite que l'idée
   initiale.
5. Faisable seul depuis Vancouver ? Oui pour la partie logicielle (vérifié : les pipelines et bases sont en
   ligne). Le prélèvement et le séquençage restent la tâche d'un partenaire externe, ce qui est cohérent avec le
   brief (pas de plongée commerciale ni de terrain à l'étranger).
6. Une phrase sans acronyme ? "Une mémoire annuelle de ce qui vit sur un site marin, fondée sur des traces d'ADN
   dans l'eau et recoupée avec les courants et la température du même site." Tient.
7. Revient il chaque année avec ses propres données ? Oui par construction (obligation de suivi pluriannuel), à
   condition que le client garde le même laboratoire de prélèvement, ce qui n'est pas garanti (voir ci dessus).

## 6. Pré mortem

1. La cause la plus probable : eDNAtec ou NatureMetrics, déjà intégrés du prélèvement à l'interprétation et déjà
   vendus au secteur énergie, ajoutent une couche de fusion aux données océaniques publiques à leur offre
   existante avant qu'EchoBaseline ait signé assez de sites pour que son historique compte. Signal avant coureur
   dès 2027 : une mention de "contextualisation environnementale" ou de "données de courants intégrées" dans la
   communication commerciale de l'un de ces deux laboratoires.
2. Deuxième cause : le client change de laboratoire de séquençage entre deux campagnes (fusion, changement de
   fournisseur, négociation de prix) et rejoue ses séquences archivées avec un nouveau prestataire, cassant la
   continuité qu'EchoBaseline pensait posséder. Signal avant coureur : une demande client de portabilité du
   format de sortie vers un autre prestataire, ou un appel d'offres de renouvellement du laboratoire partenaire.
3. Troisième cause : aucun mandat réglementaire daté n'apparaît (voir section suivante) et la demande reste
   volontaire, projet par projet, sans obligation pluriannuelle stable ; les développeurs traitent alors le
   suivi eDNA comme une dépense ponctuelle d'étude d'impact plutôt que comme un actif à faire fructifier chaque
   année. Signal avant coureur : aucun client du barreau 1 ne revient signer une deuxième campagne en 2028.

Sur les obligations réglementaires : aucun mandat formel daté n'a été trouvé imposant l'eDNA dans un permis. Le
BOEM (Bureau of Ocean Energy Management, agence fédérale américaine) utilise l'eDNA dans ses études de site et
son programme 2025 à 2026, et Empire Wind (New York) a mené des campagnes eDNA en 2024 et 2025, mais l'article
BOEM consulté le décrit comme un outil, pas une exigence de permis (vérifié pour l'usage, pas pour un mandat
daté). Le New Jersey Department of Environmental Protection (NJDEP, agence d'État) a publié une proposition
eDNA pour l'éolien en mer, sans date d'entrée en vigueur trouvée. En Norvège, l'Institut vétérinaire norvégien
mène une recherche active sur l'eDNA en aquaculture salmonicole pour la détection de pathogènes, sans exigence
réglementaire trouvée. Le Ministère des Pêches et des Océans (MPO, Canada) n'a pas été recherché faute de
budget (lacune). Correction assumée : l'obligation pluriannuelle qui justifie la "série" est une pratique
volontaire en expansion, pas encore un mandat daté, ce qui affaiblit sans l'annuler l'argument de continuité
imposée par le régulateur.

## 7. Test à moins de 2 000 dollars, deux semaines, données publiques

Prendre le jeu de données eDNA public du parc éolien en mer Horns Rev 1 (mer du Nord danoise, séquences au
NCBI SRA, vérifié) ou le jeu de 30 sites en mer du Nord belge (BioProject PRJNA1032405, vérifié, dont des sites
à l'intérieur et à l'extérieur de deux parcs éoliens en mer), rejouer l'assignation taxonomique avec OBITools et
une base publique (BOLD), puis fusionner le résultat avec la série Copernicus Marine du même site sur la même
fenêtre temporelle (courants, température, gratuit, vérifié dans le dossier de tendance). Coût : temps de calcul
et hébergement seulement, sous 2 000 dollars, deux semaines de travail seul avec l'IA comme co développeur,
sans contacter personne. Critère chiffré de succès : retrouver au moins 80 % des espèces rapportées par
l'étude publiée à partir des mêmes séquences brutes (preuve que le pipeline ouvert reproduit un résultat
scientifique connu), et obtenir une corrélation mesurable, même faible, entre au moins une variable de courant
ou de température et la variance des détections d'une espèce entre saisons (preuve que la fusion ajoute une
information que le rapport original ne donnait pas déjà). Si les deux critères passent, le premier appel vise
Natural Power ou INSPIRE Environmental, avec ce test comme démonstration plutôt qu'une promesse.

## 8. Financement

Revenu mensuel plausible (estimation, aucun montant lu directement pour ce produit précis) : 6 mois, 0 dollar,
le test et le premier appel sont en cours. 12 mois, 3 000 à 8 000 dollars canadiens par mois si un bureau
d'études comme Natural Power ou INSPIRE achète un abonnement de fusion continue sur deux à trois sites, à un
prix nettement inférieur à une campagne complète de laboratoire (estimation fondée sur l'écart entre un service
logiciel et un service de laboratoire complet, pas sur un prix lu). 24 mois, 10 000 à 25 000 dollars canadiens
par mois si trois à cinq sites sont sous contrat et qu'un premier accès en lecture est vendu à un deuxième
bureau d'études (estimation).

Programme de subvention précis : le Ocean Supercluster (Ocean Startup Project ou programmes similaires,
supercluster canadien de l'économie océanique, basé à Halifax) finance des projets d'innovation océanique
canadienne avec des montants variables par projet ; ce guichet n'a pas été revérifié cette session pour un
montant ou une date précise applicable à l'eDNA (lacune, connaissance générale reportée du dossier de tendance,
étiqueté supposé). Il accélérerait le barreau 2 (extension à plusieurs sites côtiers canadiens) sans être une
condition de survie, le revenu du barreau 1 corrigé restant la base.

## Références (URL, consultées le 7 septembre 2026)

https://ednatec.com/, https://www.naturemetrics.com/news/offshore-wind-farms-with-edna,
https://www.naturalpower.com/us/news/news-post/innovative-fish-edna-project-to-revolutionise-environmental-survey-work-at-offshore-wind-farms,
https://envirotecmagazine.com/2023/11/16/fish-edna-project-to-revolutionise-environmental-survey-work-at-offshore-wind-farms/,
https://ednaresources.science/edna-labs, https://store.jonahventures.com/,
https://www.boem.gov/newsroom/ocean-science-news/environmental-dna-edna-powerful-tool-exploring-marine-ecosystems,
https://www.boem.gov/sites/default/files/documents/environment/environmental-studies/SDP_2025-2026.pdf,
https://dep.nj.gov/wp-content/uploads/offshorewind/docs/njdep-edna-proposal.pdf,
https://tethys.pnnl.gov/wind-project-sites/empire-wind,
https://www.vetinst.no/en/research-and-innovation/research-areas/research-areas-fish-health/environmental-dna-monitoring-edna,
https://obis.org/2024/10/22/obis-edna/, https://obis.org/dataset/634b85c1-3f7e-4648-add0-dae012fa7193,
https://www.nature.com/articles/s41598-025-01541-x (Horns Rev 1), https://www.inspireenvironmental.com/,
https://training.galaxyproject.org/training-material/topics/ecology/tutorials/Obitools-metabarcoding/tutorial.html,
https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6374651/ (standardisation du metabarcoding marin).

Lacunes assumées : aucun prix par échantillon trouvé pour eDNAtec, NatureMetrics, Jonah Ventures, Applied
Genomics ni Bureau Veritas. Applied Genomics et Bureau Veritas non vérifiables cette session (domaine
introuvable, page 404). Aucun client aquacole ni développeur de compensation nommé et vérifié. Aucun mandat
réglementaire daté trouvé pour l'eDNA en permis éolien en mer ou aquacole. Le MPO (Canada) et les agences
britanniques n'ont pas été recherchés directement faute de budget. Tourmaline et MIDORI non revérifiés cette
session.
