# Dossier de creusement : Atelier d'Annotation Partagé

Agent : c24-atelier-annotation, passe 5, projet Octopus. Date : 7 septembre 2026. Échelle issue du dossier de
tendance `ocean-5/agents/robots-autonomes/dossier.md` (échelle 4, section f).

Rappel du produit reçu : une plateforme qui donne aux petites sociétés indépendantes de pilotage de robots
sous-marins et de surface (inspection de coques, de quais, de filets d'aquaculture, de câbles d'énergie
renouvelable, d'émissaires d'eau) une analyse par intelligence artificielle (IA) de leurs vidéos et sonars, pour
qu'elles revendent des rapports d'anomalies à leurs clients au lieu de vendre seulement des heures de pilotage.
Restriction imposée : l'annotation écologique benthique pour bureaux d'études est une piste séparée, hors
périmètre. Ce dossier se concentre sur l'inspection d'infrastructures civiles non pétrolières.

Verdict en une ligne : l'échelle n'est tuée par aucun concurrent trouvé qui vendrait exactement ce barreau 1 à de
petites sociétés multi marques, mais deux précédents la fragilisent fortement : Qii.AI de Deep Trekker (IA de
diagnostic de coque déjà vendue, mais liée au matériel Deep Trekker) et SeaDeep (même promesse d'IA d'inspection
sous marine, société produit démontée en 2025 faute de cycle de vente assez court pour de gros clients). Le
barreau 1 corrigé doit rester agnostique de marque de robot et viser un cycle de vente court avec de petites
sociétés, jamais un cycle de vente d'entreprise ou d'agence.

## 1. Qui vend déjà cela

- Deep Trekker (Canada, fabricant de robots sous marins téléopérés, ROV, Remotely Operated Vehicle) a lancé en
  septembre 2024 un projet nommé Qii.AI, présenté à la conférence ALL IN, qui intègre l'IA à ses propres ROV pour
  automatiser l'inspection de coques de navires et signaler les défauts en temps réel pendant l'inspection.
  Vérifié (oceansciencetechnology.com). Lié au matériel Deep Trekker, pas vendu comme couche d'analyse
  indépendante pour des robots d'autres marques. Prix non trouvé.
- Greensea (États-Unis, éditeur de logiciels d'autonomie robotique marine) vend OPENSEA Edge, un système
  embarqué qui traite vidéo et sonar directement à bord, sans ordinateur de surface, pour la navigation et la
  perception. Vérifié (unmannedsystemstechnology.com). Vendu comme logiciel d'autonomie du robot, intégré à
  l'écosystème Greensea, pas comme service d'analyse à la demande pour des vidéos déjà tournées par un tiers.
  Prix non trouvé.
- Beam (Royaume-Uni, fusion en 2024 de Rovco et Vaarst, rachetée depuis par Rosenxt) vend un véhicule sous marin
  autonome (AUV, Autonomous Underwater Vehicle) piloté par IA pour l'inspection et le relevé de l'éolien en mer,
  avec 20 millions de dollars (M$) levés côté Vaarst avant fusion et 15 millions de livres investis dans sa
  flotte Xplorer et Quantum. Vérifié (offshore-technology.com, marinetechnologynews.com). Cliente visée : grands
  développeurs éoliens en mer, pas de petites sociétés de service indépendantes. Prix non public. Abyssal
  (logiciel de jumeau numérique subsea) apparaît associé à ce même mouvement de consolidation mais son offre
  précise n'a pas pu être vérifiée séparément dans cette recherche, lacune.
- SeaDeep (États-Unis, Boston, née en 2019 d'une collaboration avec l'Université Tufts) vendait une IA de vision
  sous marine pour classer des objets subsea en temps réel, à des clients comme la marine américaine, Avangrid
  (énergie éolienne en mer) et l'initiative Seabed 2030 de l'Organisation des Nations Unies (ONU). Vérifié
  (seadeep.io, tufts.edu). Fait clé : la société produit a été fermée en 2025, son fondateur déclarant que « les
  cycles de vente ont dépassé le rythme de combustion de trésorerie » ; SeaDeep opère aujourd'hui uniquement
  comme cabinet de conseil pour fondateurs et investisseurs. Vérifié (seadeep.io). C'est la preuve la plus
  directe que vendre de l'IA d'inspection sous marine à de grands comptes (défense, énergie, agences) tue une
  petite société avant qu'elle ne perce, un avertissement direct pour cette échelle si elle visait le même type
  de client.
- Voyis, Blue Robotics et Unmanned Survey Solutions n'ont pas pu être vérifiés en détail dans le quota de
  recherche alloué (huit WebSearch au total pour tout le dossier, budget déjà réparti sur les points 1 à 5).
  Connus par ailleurs comme fabricants de matériel (caméras et scanners laser sous marins pour Voyis, ROV bas
  coût pour Blue Robotics, véhicules de surface pour Unmanned Survey Solutions) plutôt que comme éditeurs d'un
  service d'analyse tiers vendu à des sociétés de service multi marques : supposé, non confirmé par une source
  datée dans cette recherche, lacune assumée.
- Outils gratuits déjà identifiés dans le dossier de tendance (CoralNet, ReefCloud, BIIGLE 2.0, BenthicNet)
  servent l'annotation écologique et benthique financée par subvention, hors du périmètre imposé à ce dossier
  (infrastructures civiles), et ne vendent rien à des sociétés commerciales. Vérifié (dossier de tendance,
  section d).
- Constat : aucun acteur trouvé ne vend une couche d'analyse d'anomalies agnostique de marque de robot,
  spécifiquement packagée pour qu'une petite société de service la revende à ses propres clients sous sa propre
  marque. L'échelle n'est donc pas tuée à ce stade, mais elle doit se différencier explicitement de Qii.AI
  (verrouillage matériel) et éviter le piège SeaDeep (client trop gros, cycle de vente trop long).

## 2. Le client du barreau 1

Trois sociétés nommées, avec ce qu'elles vendent aujourd'hui et pourquoi une plateforme d'un fondateur seul à
Vancouver les intéresserait :

- Integrated Underwater Services (IUS), Pacifique Nord Ouest (État de Washington, États-Unis) : plongée
  commerciale et inspection par ROV d'infrastructures civiles et marines, avec une division ROV spécialisée dans
  l'inspection et le nettoyage de châteaux d'eau et de réservoirs. Vérifié (iusdiving.com). Vend aujourd'hui des
  jours de plongée ou de pilotage ROV facturés à l'intervention ; raison d'achat : une petite structure de ce
  type n'a pas les moyens d'embaucher un analyste vidéo à temps plein ni de négocier un contrat entreprise avec
  Beam ou Deep Trekker, mais peut payer un abonnement mensuel modeste pour enrichir chaque rapport déjà vendu.
- Underwater Engineering Services, Inc. (UESI), Floride : inspections par ROV de ponts, structures portuaires,
  levés d'état d'installations et inspections vidéo et photo (plongeur et ROV). Vérifié (uesi.com). Vend des
  rapports d'inspection structurelle facturés au projet ; raison d'achat : accélérer et enrichir la production de
  rapports sans embaucher, en gardant son propre nom sur le livrable final.
- Enviro Tech Diving, Inc., Floride : flotte de ROV portables avec caméras haute définition, pour l'inspection de
  quais, jetées, palplanches et coques dans les marinas et ports commerciaux. Vérifié (etdiving.com). Vend des
  inspections de quai et de coque facturées à l'intervention.
- Autres sociétés du même profil repérées dans la même recherche, indiquant une population plus large :
  Associated Underwater Services (Washington), Coastal Sensing and Survey (Puget Sound), Geo Oceans, SepcoTech
  (marque Vesselity) et Florida Hull Cleaning (Floride). Vérifié, noms et services (sources ci dessous). Le
  nombre exact de sociétés indépendantes de ce type sur la côte Pacifique nord américaine, en Californie et en
  Floride n'a pas de recensement unique trouvé ; sur la seule base de deux recherches ciblées, au moins huit
  sociétés distinctes de ce profil sont apparues, ce qui suggère une population plausible de quelques dizaines
  (estimation, 30 à 80, chiffre non recensé formellement, lacune).
- Ce qu'elles paient aujourd'hui pour la revue vidéo elle même (par opposition au pilotage) n'a pas été trouvé
  précisément : deux recherches ciblées sur le prix de la revue vidéo n'ont donné que des ancrages de marché
  adjacents (expertise de coque de plaisance à 18 à 22 dollars le pied plus 500 dollars forfaitaires chez Golden
  Gate Yacht Surveys, Californie, lu goldengateyachtsurveys.com ; inspection experte générale à environ 600
  dollars la demi journée et 1 200 dollars la journée complète, lu inspectionvendorindex.com ; le pilotage ROV
  réduirait le coût jusqu'à 50 % par rapport à la plongée, lu inspectionvendorindex.com). Ces chiffres concernent
  le pilotage ou l'expertise, pas la revue d'images après coup : lacune assumée, comme dans le dossier de
  tendance pour le coût horaire d'un analyste d'images marines.
- Le geste payé à l'heure derrière l'achat reste celui déjà établi dans le dossier de tendance : un pilote ROV
  offshore aux États Unis gagne en moyenne 130 916 dollars par an, soit environ 62,94 dollars de l'heure. Vérifié
  (ziprecruiter.com, juin 2025, cité dans le dossier de tendance).

## 3. Le produit

Six fonctionnalités, dans l'ordre de vente :

1. Ingestion vidéo et sonar brute, multi format et multi marque de robot (ROV, USV, plongeur, caméra fixe de
   quai), sans dépendre d'une intégration matérielle propriétaire d'un seul fabricant.
2. Détection automatique d'anomalies visuelles génériques d'infrastructure (corrosion, encrassement biologique,
   défauts de peinture, trous de filet, exposition de câble) par un modèle de vision entraîné et amorcé sur des
   jeux de données publics, puis affiné sur les premières livraisons clients.
3. Génération automatique d'un rapport structuré, horodaté, avec captures d'écran des anomalies, prêt à être
   revendu tel quel par la société cliente sous sa propre marque à son propre client final.
4. Classement des anomalies par sévérité et export dans un format standard, réutilisable par la société cliente
   quel que soit le robot ou la caméra utilisés pour la mission suivante.
5. Comparaison dans le temps d'une même cible physique (même quai, même filet, même coque) au fil des campagnes
   successives d'un même client, chaque société de service gardant le contrôle de ses propres livraisons.
6. Tableau de bord multi projets pour la société de service, permettant de suivre plusieurs contrats clients en
   parallèle et de facturer chaque projet séparément.

Pourquoi impossible en 2024 : des modèles de vision par ordinateur capables de détecter et décrire des anomalies
visuelles génériques sur vidéo brute, avec un ajustement rapide par exemples plutôt qu'un entraînement spécialisé
coûteux par cible, ne sont devenus assez fiables et abordables en coût de calcul que depuis 2024 et 2025.
Supposé, non vérifié par un repère chiffré précis dans cette recherche, cohérent avec le fait que Deep Trekker
n'a lancé son propre projet équivalent qu'en septembre 2024 (vérifié, section 1).

Données existantes pour entraîner ou amorcer sans un seul courriel :

- LIACI (Lifecycle Inspection, Analysis and Condition Information), jeu de données public d'inspection sous
  marine de coques de navires, 1 893 images avec annotations par pixel sur dix catégories dont défauts,
  corrosion, écaillage de peinture, encrassement biologique, grille de caisse à mer, vannes de coque, hélice,
  anodes et quille de roulis, annoté par des experts humains. Vérifié (ieeexplore.ieee.org, mdpi.com,
  researchgate.net). C'est le jeu le plus directement utile pour l'inspection de coque civile visée par cette
  échelle.
- Jeux de données synthétiques et virtuels pour l'inspection de filets d'aquaculture (net pens), avec classes
  incluant trous de filet, encrassement biologique et végétation. Vérifié (mdpi.com, researchgate.net). Utile
  pour amorcer la détection sur filets, sans dépendre de la piste écologique interdite pour ce dossier.
- SUIM, jeu de référence pour la segmentation sous marine générale. Vérifié comme cité dans les mêmes recherches
  (arxiv.org). Utile en pré entraînement générique, pas spécifique à l'infrastructure.
- BenthicNet, déjà vérifié dans le dossier de tendance (plus de 11,4 millions d'images et 3,1 millions
  d'annotations benthiques), utile pour la robustesse générale du modèle en environnement sous marin varié, même
  si son contenu est surtout écologique et non structurel.

Aucun de ces jeux ne nécessite de contacter un client ou un fabricant : ils sont téléchargeables publiquement.
Le premier amorçage du modèle est donc faisable seul, avant toute vente.

## 4. L'actif qui compose et le test adverse

- Barreau 1 (mars 2027) : un abonnement à un client, aucun historique encore. L'actif est le pipeline
  d'analyse lui même, entraîné sur données publiques.
- Barreau 2 (2028) : trois à cinq sociétés clientes ; premier corpus croisant plusieurs zones géographiques et
  plusieurs marques de robot, chose qu'aucun fabricant de robot seul ne peut voir puisque chacun ne voit que ses
  propres appareils.
- Barreau 3 (2030) : quinze à vingt sociétés clientes ; des modèles spécialisés par type de cible (câble, filet,
  coque, quai) deviennent meilleurs que les modèles génériques faute d'un corpus comparable ailleurs, car aucun
  fabricant de robot ni aucune société de service seule n'a de flotte assez large pour réunir ce volume.
- Barreau 4 (2033) : le réseau de sociétés clientes devient un canal de distribution pour d'autres échelles de
  la même tendance (registre d'encrassement, suivi de câbles), chacune profitant du volume déjà annoté.
- Barreau 5 (2036) : le corpus croisant des dizaines d'opérateurs et de zones devient la plus grande base privée
  d'images d'inspection sous marine civile en Amérique du Nord, selon la thèse du dossier parent.
- Test adverse : un concurrent avec 5 millions de dollars (M$) en 2031 peut copier le pipeline de détection en
  quelques mois, ses modèles de vision étant devenus des briques standard. Il échoue en revanche à racheter en un
  an le réseau de quinze à vingt sociétés de service déjà abonnées et leur historique d'images annotées propre à
  chaque cible physique suivie depuis 2027, car ce réseau s'est construit relation par relation, pas par un
  chèque : chaque société cliente a un contrat, une habitude de facturation et une confiance construite sur
  plusieurs années de livraisons correctes, pas rachetable en bloc comme un brevet ou un jeu de données figé.

## 5. Question 8 puis les sept questions

Question 8, la question honnête : le corpus d'inspection compose t il vraiment, ou chaque client le garde t il en
propriété exclusive ? Réponse : incertain, avec une nuance importante. Les contrats types d'inspection observés
dans cette recherche stipulent que le rapport est confidentiel et réservé à l'usage exclusif du client qui a payé
l'inspection, sans droit pour un tiers de s'en prévaloir. Lu (lawinsider.com, clauses type de confidentialité et
de propriété de rapport, source générique non spécifique au ROV mais représentative des usages du secteur de
l'inspection). Concrètement, cela veut dire que la société de service (le client direct de la plateforme) ne peut
pas revendre ni montrer les images brutes ou les rapports nommés d'un port ou d'un développeur éolien à un autre
de ses propres clients. Mais la relation contractuelle de la plateforme n'est pas avec le port ou le développeur
éolien : elle est avec la société de service elle même. Si le contrat d'abonnement de la plateforme inclut une
clause distincte, standard en logiciel en tant que service (SaaS), autorisant l'usage des images en forme agrégée
et dépersonnalisée pour améliorer un modèle partagé, sans jamais montrer une image identifiable d'un client à un
autre, alors le corpus compose au niveau des motifs appris par le modèle (formes de corrosion, de trous de filet,
d'exposition de câble), pas au niveau du partage d'images brutes entre clients. Verdict : le réseau de sociétés
clientes compose vraiment (plus de clients, plus de sociétés qui reviennent), mais le corpus d'images ne compose
que sous forme agrégée et anonymisée, jamais comme une bibliothèque d'images consultable entre clients. C'est un
actif plus faible que ce que la section e du dossier de tendance laissait entendre, mais réel.

1. Qui signe, avec quelle ligne budgétaire existante ? La société de service elle même signe, avec la ligne
   budgétaire qu'elle consacre déjà à la production de rapports (sous traitance d'un analyste ou temps interne
   non facturable). Oui, une ligne existe, mais son montant précis n'a pas été trouvé (voir section 2).
2. La preuve se retourne t elle contre l'acheteur ? Non dans le cas central : le rapport enrichi par IA est un
   livrable commercial que la société de service choisit de vendre ou non, pas un dépôt réglementaire obligatoire
   comme dans l'échelle 1 du dossier de tendance. Nuance : si une anomalie critique est manquée par le modèle et
   que la société de service en avait garanti l'exhaustivité à son propre client, sa crédibilité est engagée,
   pas directement celle du fondateur, mais cela reste un risque de réputation en cascade.
3. L'IA est elle le produit ? Oui : elle remplace le geste humain payé à l'heure de visionnage vidéo (analyste
   sous traitant), un usage déjà tenté commercialement par Deep Trekker en 2024 (section 1), confirmant que la
   demande et la faisabilité technique existent.
4. Existe t il gratuit ou déjà acheté ? Partiellement. Qii.AI (Deep Trekker) et OPENSEA Edge (Greensea) existent
   mais sont liés au matériel de leur propre fabricant. Beam vend de l'IA d'inspection mais à de grands
   développeurs éoliens, pas à de petites sociétés multi marques. SeaDeep vendait la même promesse à de grands
   comptes et a fermé sa société produit en 2025. Aucun concurrent brand agnostique vendu à de petites sociétés
   n'a été trouvé : incertain plutôt que non, car l'espace pourrait déjà être occupé par un acteur non trouvé dans
   le quota de recherche alloué.
5. Faisable seul depuis Vancouver ? Oui : amorçage sur données publiques (LIACI et autres, section 3), vente à
   distance par abonnement mensuel, aucune plongée commerciale ni pose de matériel requise.
6. Une phrase sans acronyme : un logiciel qui regarde les vidéos et les signaux sonar déjà filmés par de petites
   sociétés de robots sous marins, repère automatiquement les dégâts et l'encrassement sur les coques, les quais,
   les filets et les câbles, et leur fabrique un rapport qu'elles peuvent revendre à leurs propres clients.
7. Revient il chaque année avec ses propres données ? Oui, structurellement : chaque société cliente réalise ses
   propres campagnes d'inspection chaque année pour ses propres clients (inspections récurrentes de quais, coques
   et câbles déjà établies comme un geste payé aujourd'hui, section b et fait a8 du dossier de tendance), ce qui
   alimente le pipeline en continu sans action supplémentaire du fondateur.

## 6. Pré-mortem

Nous sommes en 2031, la société est morte. Trois causes, classées par probabilité, avec le signal avant coureur
observable dès 2027 :

1. Le plus probable : un fabricant de robot déjà présent chez les clients (Deep Trekker, Greensea, ou un
   fabricant de caméras bas coût comme Blue Robotics) intègre gratuitement ou à bas coût une couche d'IA
   suffisamment bonne dans son propre logiciel, et les petites sociétés utilisent ce qui vient avec le matériel
   qu'elles possèdent déjà plutôt qu'un abonnement tiers. Signal dès 2027 : Deep Trekker ou un concurrent annonce
   une extension gratuite ou incluse de Qii.AI ou d'un équivalent pour les clients existants.
2. La clause de partage de données s'avère inutilisable en pratique : les contrats entre les sociétés de service
   et leurs propres clients (ports, développeurs éoliens, exploitants de filets) interdisent explicitement tout
   usage tiers des images, forçant chaque client de la plateforme à refuser la clause d'agrégation, ce qui réduit
   la société à un simple outil logiciel sans l'actif réseau décrit en section 4. Signal dès 2027 : la majorité
   des premiers clients demandent une clause de retrait (opt out) de l'agrégation dès la signature.
3. Le même sort que SeaDeep : le cycle de vente aux petites sociétés se révèle plus long et plus fragile que
   prévu (trésorerie saisonnière, faible appétit pour un nouvel outil, désabonnement après un ou deux contrats
   sans renouvellement), épuisant le budget de moins de 25 000 dollars canadiens du fondateur avant que le volume
   ne compose. Signal dès 2027 : les premiers clients pilotes se désabonnent après trois à six mois plutôt que de
   renouveler.

## 7. Test à moins de 2 000 dollars et deux semaines

Sur données publiques uniquement, sans contacter personne :

- Calcul et location de puissance de calcul pour affiner un modèle de vision existant sur le jeu LIACI (section
  3) : 400 à 600 dollars, estimation.
- Achat de séquences vidéo sous marines d'inspection en banque d'images (hors LIACI, pour tester la
  généralisation hors distribution) : 200 à 400 dollars, estimation.
- Stockage et outillage cloud pour deux semaines : 100 à 150 dollars, estimation.
- Marge de sécurité : environ 200 dollars, estimation.
- Total estimé : 900 à 1 350 dollars, sous le plafond de 2 000 dollars.

Critère chiffré de succès : sur 20 % du jeu LIACI mis de côté comme test, jamais vu à l'entraînement, le modèle
doit détecter au moins 80 % des zones annotées de corrosion et d'encrassement biologique (rappel supérieur ou
égal à 0,80) avec une précision supérieure ou égale à 0,65, et repérer correctement au moins une anomalie
visible, validée manuellement par le fondateur (plongeur qualifié), sur au moins cinq séquences achetées hors
LIACI. Si ce critère échoue, l'échelle est retardée, pas nécessairement enterrée : le barreau 1 peut être reporté
ou restreint à un seul type de cible (coque, la mieux couverte par LIACI) en attendant plus de données.

Premier appel seulement si le test passe : contacter une des trois sociétés nommées en section 2 (IUS, UESI ou
Enviro Tech Diving), avec une démonstration faite sur des images publiques déjà visibles sur leur propre site ou
leur chaîne vidéo, avant de proposer un essai payant.

## 8. Financement

Revenu mensuel plausible, estimations : à 6 mois (septembre 2027), un client à 1 500 à 3 000 dollars par mois,
soit 1 500 à 3 000 dollars par mois. À 12 mois, trois clients à environ 2 000 dollars par mois en moyenne, soit
environ 6 000 dollars par mois. À 24 mois, huit à dix clients à environ 2 000 dollars par mois, soit 16 000 à
20 000 dollars par mois. Toutes ces estimations restent inférieures au seuil où le revenu seul finance une
croissance rapide, cohérent avec un rythme de développeur solo.

Programme de subvention plausible pour accélérer le barreau 2 sans en faire une condition de survie : le
Programme d'aide à la recherche industrielle (PARI, souvent cité sous son sigle anglais IRAP, Industrial Research
Assistance Program) du Conseil national de recherches Canada, guichet permanent pour petites et moyennes
entreprises technologiques canadiennes avec un conseiller technico-industriel dédié, montant typique estimé entre
15 000 et 50 000 dollars canadiens pour un projet de développement de produit. Supposé et estimation : programme
connu par ailleurs et cité comme accélérateur acceptable dans le brief du projet, mais son montant exact pour ce
type de projet n'a pas été vérifié par une recherche dédiée dans le quota alloué à ce dossier, lacune assumée.
Le Ocean Supercluster canadien (grappe d'innovation océanique financée par le gouvernement du Canada) est une
autre piste plausible pour un cofinancement de projet à l'année deux, également non vérifiée dans ce quota.

## Sources consultées

- https://www.eenewseurope.com/en/rovco-and-vaarst-come-together-as-beam-with-first-ai-undersea-robot/
- https://offshore-technology.com/analysis/rovco-vaarst-ai-investment
- https://www.marinetechnologynews.com/news/rovco-vaarst-unite-under-640131
- https://www.seadeep.io/
- https://now.tufts.edu/2024/03/04/start-deploys-ai-see-better-underwater
- https://www.oceansciencetechnology.com/news/deep-trekker-heads-ai-driven-rov-ship-inspection-initiative/
- https://www.unmannedsystemstechnology.com/company/greensea-iq/
- https://uesi.com/underwater-inspection-services-in-florida/
- https://etdiving.com/service/rov-inspections/
- https://www.iusdiving.com/
- https://www.ausdiving.com/
- https://www.coastalsensing.com/rov-inspection
- https://www.geooceans.com/services/rov-class-inspection/
- https://www.sepcotech.com/rov-hull-inspections
- https://www.floridahull.com/hd-4k-video-inspections
- https://goldengateyachtsurveys.com/?page_id=866
- https://inspectionvendorindex.com/insights/maritime-hull-inspection-ndt-cost-structure-roi
- https://ieeexplore.ieee.org/document/9998080/ (jeu LIACI, résumé via recherche croisée)
- https://mdpi.com/2077-1312/10/9/1289/htm
- https://www.researchgate.net/publication/363505896_Virtual_Underwater_Datasets_for_Autonomous_Inspections
- https://www.lawinsider.com/clause/confidentiality-of-report

## Résumé en dix lignes

L'échelle Atelier d'Annotation Partagé est vivante, mais fragile, pas morte. Aucun concurrent trouvé ne vend
exactement ce barreau 1 : une couche d'analyse IA agnostique de marque de robot, revendue par de petites sociétés
de service à leurs propres clients d'infrastructure civile. La preuve la plus forte de vie : trois petites
sociétés nommées (Integrated Underwater Services, Underwater Engineering Services, Enviro Tech Diving) vendent
déjà des rapports d'inspection à la main, sans outil IA tiers dédié à leur échelle. La preuve la plus forte de
danger : SeaDeep, même promesse d'IA d'inspection sous marine, a fermé sa société produit en 2025 faute de cycle
de vente assez rapide, et Deep Trekker vend déjà une IA de coque, mais verrouillée à son propre matériel. Le
barreau 1 corrigé doit donc explicitement se vendre comme agnostique de marque de robot, à un prix mensuel bas
gardant le cycle de vente court, jamais comme un projet d'entreprise à la Beam ou à la SeaDeep première version.
Le corpus d'images ne compose que sous forme agrégée et anonymisée, jamais comme bibliothèque partagée entre
clients nommés, à cause des clauses de confidentialité standard du secteur de l'inspection. L'acteur le plus
probable pour la tuer d'ici 2031 est un fabricant de robot déjà installé chez les clients (Deep Trekker, Greensea
ou un fabricant de caméras bas coût) qui intègre gratuitement une IA suffisante dans le matériel que les petites
sociétés possèdent déjà.
