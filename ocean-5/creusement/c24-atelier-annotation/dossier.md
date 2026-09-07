# Dossier de creusement : Atelier d'Annotation Partagé

Agent : c24-atelier-annotation, passe 5, projet Octopus. Date : 7 septembre 2026. Échelle issue du dossier de
tendance `ocean-5/agents/robots-autonomes/dossier.md` (échelle 4, section f).

Rappel du produit reçu : une plateforme qui donne aux petites sociétés indépendantes de pilotage de robots
sous-marins et de surface (inspection de coques, de quais, de filets d'aquaculture, de câbles d'énergie
renouvelable, d'émissaires d'eau) une analyse par intelligence artificielle (IA) de leurs vidéos et sonars, pour
qu'elles revendent des rapports d'anomalies à leurs clients au lieu de vendre seulement des heures de pilotage.
Restriction imposée : l'annotation écologique benthique pour bureaux d'études est hors périmètre. Ce dossier se
concentre sur l'inspection d'infrastructures civiles non pétrolières.

Verdict en une ligne : aucun concurrent trouvé ne vend exactement ce barreau 1, mais deux précédents fragilisent
l'échelle : Qii.AI de Deep Trekker (IA de diagnostic de coque déjà vendue, liée au matériel Deep Trekker) et
SeaDeep (même promesse d'IA d'inspection sous marine, société produit fermée en 2025 faute de cycle de vente
assez court pour de gros clients). Le barreau 1 corrigé doit rester agnostique de marque de robot et viser un
cycle de vente court avec de petites sociétés, jamais un cycle de vente d'entreprise ou d'agence.

## 1. Qui vend déjà cela

- Deep Trekker (Canada, fabricant de robots sous marins téléopérés, ROV, Remotely Operated Vehicle) a lancé en
  septembre 2024 Qii.AI, présenté à la conférence ALL IN : IA intégrée à ses propres ROV pour automatiser
  l'inspection de coques et signaler les défauts en temps réel. Vérifié (oceansciencetechnology.com). Lié au
  matériel Deep Trekker, pas vendu comme couche d'analyse indépendante. Prix non trouvé.
- Greensea (États-Unis, éditeur de logiciels d'autonomie robotique marine) vend OPENSEA Edge, système embarqué
  qui traite vidéo et sonar à bord pour la navigation et la perception. Vérifié (unmannedsystemstechnology.com).
  Intégré à l'écosystème Greensea, pas un service d'analyse à la demande pour des vidéos tierces. Prix non
  trouvé.
- Beam (Royaume-Uni, fusion 2024 de Rovco et Vaarst, rachetée depuis par Rosenxt) vend un véhicule sous marin
  autonome (AUV, Autonomous Underwater Vehicle) piloté par IA pour l'éolien en mer, 20 millions de dollars (M$)
  levés côté Vaarst avant fusion, 15 millions de livres investis en flotte. Vérifié (offshore-technology.com,
  marinetechnologynews.com). Cliente visée : grands développeurs éoliens, pas de petites sociétés, prix non
  public. Abyssal (jumeau numérique subsea) apparaît lié à cette consolidation, offre non vérifiable, lacune.
- SeaDeep (États-Unis, Boston, née en 2019 avec l'Université Tufts) vendait une IA de vision sous marine pour
  classer des objets subsea en temps réel, clients : marine américaine, Avangrid, initiative Seabed 2030 de
  l'Organisation des Nations Unies (ONU). Vérifié (seadeep.io, tufts.edu). Fait clé : société produit fermée en
  2025, son fondateur déclarant que « les cycles de vente ont dépassé le rythme de combustion de trésorerie » ;
  SeaDeep n'est plus qu'un cabinet conseil. Vérifié (seadeep.io). Preuve que vendre de l'IA d'inspection sous
  marine à de grands comptes tue une petite société avant qu'elle ne perce.
- Voyis, Blue Robotics et Unmanned Survey Solutions non vérifiés en détail (quota de huit WebSearch réparti sur
  les points 1 à 5). Connus par ailleurs comme fabricants de matériel (caméras et scanners laser pour Voyis, ROV
  bas coût pour Blue Robotics, véhicules de surface pour Unmanned Survey Solutions), pas éditeurs d'un service
  d'analyse tiers multi marques : supposé, lacune assumée.
- Outils gratuits déjà identifiés dans le dossier de tendance (CoralNet, ReefCloud, BIIGLE 2.0, BenthicNet)
  servent l'annotation écologique financée par subvention, hors périmètre infrastructure, et ne vendent rien à
  des sociétés commerciales. Vérifié (dossier de tendance, section d).
- Constat : aucun acteur trouvé ne vend une couche d'analyse d'anomalies agnostique de marque de robot, packagée
  pour qu'une petite société la revende sous sa propre marque. L'échelle n'est donc pas tuée, mais doit se
  différencier de Qii.AI (verrouillage matériel) et éviter le piège SeaDeep (client trop gros, cycle trop long).

## 2. Le client du barreau 1

Trois sociétés nommées, ce qu'elles vendent aujourd'hui, et pourquoi elles achèteraient à un fondateur seul :

- Integrated Underwater Services (IUS), Pacifique Nord Ouest (État de Washington) : plongée commerciale et
  inspection par ROV d'infrastructures civiles et marines, division ROV spécialisée en inspection de châteaux
  d'eau et réservoirs. Vérifié (iusdiving.com). Vend des jours de plongée ou de pilotage facturés à
  l'intervention ; raison d'achat : pas les moyens d'embaucher un analyste à temps plein ni de négocier un
  contrat entreprise avec Beam ou Deep Trekker, mais peut payer un abonnement mensuel modeste.
- Underwater Engineering Services, Inc. (UESI), Floride : inspections par ROV de ponts, structures portuaires,
  levés d'état d'installations. Vérifié (uesi.com). Vend des rapports facturés au projet ; raison d'achat :
  accélérer et enrichir la production de rapports sans embaucher, en gardant son propre nom sur le livrable.
- Enviro Tech Diving, Inc., Floride : flotte de ROV portables, inspection de quais, jetées, palplanches et
  coques dans marinas et ports commerciaux. Vérifié (etdiving.com). Vend des inspections facturées à
  l'intervention.
- Autres sociétés du même profil : Associated Underwater Services (Washington), Coastal Sensing and Survey
  (Puget Sound), Geo Oceans, SepcoTech (marque Vesselity), Florida Hull Cleaning. Vérifié, noms et services.
  Aucun recensement unique de la population totale trouvé ; sur deux recherches ciblées, au moins huit sociétés
  distinctes sont apparues, suggérant quelques dizaines au total (estimation, 30 à 80, chiffre non recensé,
  lacune).
- Ce qu'elles paient pour la revue vidéo elle même n'a pas été trouvé précisément : seulement des ancrages
  adjacents (expertise de coque de plaisance à 18 à 22 dollars le pied plus 500 dollars forfaitaires, Golden
  Gate Yacht Surveys, Californie, lu goldengateyachtsurveys.com ; inspection experte générale à environ 600
  dollars la demi journée et 1 200 dollars la journée, lu inspectionvendorindex.com ; le pilotage ROV réduirait
  le coût jusqu'à 50 % face à la plongée, lu inspectionvendorindex.com). Ces chiffres concernent le pilotage ou
  l'expertise, pas la revue d'images après coup, lacune assumée comme dans le dossier de tendance.
- Le geste payé à l'heure derrière l'achat reste celui du dossier de tendance : un pilote ROV offshore américain
  gagne en moyenne 130 916 dollars par an, environ 62,94 dollars de l'heure. Vérifié (ziprecruiter.com, juin
  2025, cité dans le dossier de tendance).

## 3. Le produit

Six fonctionnalités, dans l'ordre de vente :

1. Ingestion vidéo et sonar brute, multi format et multi marque de robot (ROV, USV, plongeur, caméra fixe de
   quai), sans intégration propriétaire d'un seul fabricant.
2. Détection automatique d'anomalies visuelles génériques (corrosion, encrassement, défauts de peinture, trous
   de filet, exposition de câble) par un modèle amorcé sur données publiques, affiné sur les livraisons clients.
3. Génération automatique d'un rapport structuré, horodaté, avec captures d'écran, revendable tel quel sous la
   propre marque de la société cliente.
4. Classement des anomalies par sévérité, export en format standard, réutilisable quel que soit le robot de la
   mission suivante.
5. Comparaison dans le temps d'une même cible physique au fil des campagnes d'un même client, la société de
   service gardant le contrôle de ses livraisons.
6. Tableau de bord multi projets pour suivre plusieurs contrats en parallèle et facturer chaque projet
   séparément.

Pourquoi impossible en 2024 : des modèles de vision capables de détecter et décrire des anomalies génériques sur
vidéo brute, ajustables par exemples plutôt que par entraînement spécialisé coûteux, ne sont devenus assez
fiables et abordables que depuis 2024 à 2025. Supposé, cohérent avec le fait que Deep Trekker n'a lancé son
propre projet équivalent qu'en septembre 2024 (vérifié, section 1).

Données existantes pour amorcer sans un seul courriel :

- LIACI (Lifecycle Inspection, Analysis and Condition Information) : 1 893 images de coques de navires, annotées
  par pixel sur dix catégories (défauts, corrosion, écaillage de peinture, encrassement biologique, grille de
  caisse à mer, vannes de coque, hélice, anodes, quille de roulis), par experts humains. Vérifié
  (ieeexplore.ieee.org, mdpi.com, researchgate.net). Le plus utile pour cette échelle.
- Jeux synthétiques pour l'inspection de filets d'aquaculture (net pens), classes trous de filet, encrassement,
  végétation. Vérifié (mdpi.com, researchgate.net). Sans dépendre de la piste écologique interdite.
- SUIM, référence de segmentation sous marine générale, cité dans les mêmes recherches (arxiv.org). Utile en pré
  entraînement générique. BenthicNet, déjà vérifié dans le dossier de tendance (plus de 11,4 millions d'images),
  utile pour la robustesse générale, contenu surtout écologique.

Aucun de ces jeux ne nécessite de contacter un client ou un fabricant : tous téléchargeables publiquement. Le
premier amorçage du modèle est faisable seul, avant toute vente.

## 4. L'actif qui compose et le test adverse

- Barreau 1 (mars 2027) : un abonnement, aucun historique encore. L'actif est le pipeline lui même, entraîné
  sur données publiques.
- Barreau 2 (2028) : trois à cinq sociétés clientes ; premier corpus croisant plusieurs zones géographiques et
  marques de robot, chose qu'aucun fabricant seul ne peut voir puisqu'il ne voit que ses propres appareils.
- Barreau 3 (2030) : quinze à vingt sociétés clientes ; modèles spécialisés par type de cible (câble, filet,
  coque, quai) meilleurs que les modèles génériques faute d'un corpus comparable ailleurs.
- Barreau 4 (2033) : le réseau de sociétés clientes devient un canal de distribution pour d'autres échelles de
  la même tendance, chacune profitant du volume déjà annoté.
- Barreau 5 (2036) : le corpus croisant des dizaines d'opérateurs et de zones devient la plus grande base privée
  d'images d'inspection sous marine civile en Amérique du Nord, selon la thèse du dossier parent.
- Test adverse : un concurrent avec 5 millions de dollars (M$) en 2031 copie le pipeline en quelques mois, les
  modèles de vision étant devenus des briques standard. Il échoue à racheter en un an le réseau de quinze à
  vingt sociétés déjà abonnées et leur historique par cible physique depuis 2027, bâti relation par relation,
  pas par un chèque : contrat, habitude de facturation et confiance construits sur plusieurs années, non
  rachetables en bloc comme un brevet ou un jeu de données figé.

## 5. Question 8 puis les sept questions

Question 8, honnête : le corpus compose t il vraiment, ou chaque client le garde t il en propriété exclusive ?
Réponse : incertain, avec nuance. Les contrats types d'inspection observés stipulent que le rapport est
confidentiel et réservé à l'usage exclusif du client qui a payé l'inspection, sans droit pour un tiers de s'en
prévaloir. Lu (lawinsider.com, clauses type de confidentialité et de propriété de rapport, générique au secteur
de l'inspection). Donc la société de service ne peut pas montrer les images ou rapports nommés d'un port ou
d'un développeur éolien à un autre de ses clients. Mais la relation contractuelle de la plateforme est avec la
société de service, pas avec le port. Une clause distincte de logiciel en tant que service (SaaS), autorisant
l'usage des images en forme agrégée et dépersonnalisée pour améliorer un modèle partagé sans jamais montrer une
image identifiable d'un client à un autre, permettrait au corpus de composer au niveau des motifs appris
(formes de corrosion, de trous de filet), pas au niveau du partage d'images brutes. Verdict : le réseau de
sociétés clientes compose vraiment, mais le corpus d'images ne compose que sous forme agrégée et anonymisée,
jamais comme bibliothèque consultable entre clients. Actif plus faible que ce que le dossier de tendance
laissait entendre, mais réel.

1. Qui signe, quelle ligne budgétaire ? La société de service, avec la ligne déjà consacrée à la production de
   rapports (sous traitance d'un analyste ou temps interne non facturable). Oui, ligne existante, montant précis
   non trouvé (section 2).
2. La preuve se retourne t elle contre l'acheteur ? Non dans le cas central : livrable commercial choisi, pas un
   dépôt réglementaire obligatoire comme l'échelle 1 du dossier de tendance. Nuance : une anomalie manquée
   engage la crédibilité de la société de service envers son client, risque de réputation en cascade.
3. L'IA est elle le produit ? Oui : elle remplace le geste payé à l'heure de visionnage vidéo, usage déjà tenté
   par Deep Trekker en 2024 (section 1), confirmant demande et faisabilité.
4. Existe t il gratuit ou déjà acheté ? Partiellement. Qii.AI et OPENSEA Edge liés au matériel de leur
   fabricant. Beam vend de l'IA d'inspection mais à de grands développeurs éoliens. SeaDeep vendait la même
   promesse à de grands comptes et a fermé en 2025. Aucun concurrent agnostique vendu à de petites sociétés
   trouvé : incertain plutôt que non, l'espace pouvant être occupé par un acteur hors quota.
5. Faisable seul depuis Vancouver ? Oui : amorçage sur données publiques (section 3), vente à distance, aucune
   plongée commerciale ni pose de matériel requise.
6. Une phrase sans acronyme : un logiciel qui regarde les vidéos et les signaux sonar déjà filmés par de petites
   sociétés de robots sous marins, repère automatiquement les dégâts et l'encrassement sur les coques, les
   quais, les filets et les câbles, et leur fabrique un rapport qu'elles peuvent revendre à leurs clients.
7. Revient il chaque année avec ses propres données ? Oui : chaque société cliente réalise ses propres
   campagnes chaque année pour ses propres clients (inspections récurrentes déjà établies, section b et fait
   a8 du dossier de tendance), alimentant le pipeline en continu sans action supplémentaire du fondateur.

## 6. Pré-mortem

Nous sommes en 2031, la société est morte. Trois causes, classées par probabilité, signal avant coureur dès
2027 :

1. Le plus probable : un fabricant de robot déjà présent chez les clients (Deep Trekker, Greensea, ou un
   fabricant de caméras bas coût comme Blue Robotics) intègre gratuitement une IA suffisante dans son propre
   logiciel, et les petites sociétés utilisent ce qui vient avec le matériel qu'elles possèdent déjà. Signal dès
   2027 : Deep Trekker ou un concurrent annonce une extension gratuite de Qii.AI ou d'un équivalent.
2. La clause de partage de données s'avère inutilisable : les contrats entre sociétés de service et leurs
   propres clients interdisent tout usage tiers des images, forçant chaque client à refuser l'agrégation,
   réduisant la société à un simple outil sans l'actif réseau de la section 4. Signal dès 2027 : la majorité des
   premiers clients demandent une clause de retrait dès la signature.
3. Le même sort que SeaDeep : le cycle de vente aux petites sociétés se révèle plus long et fragile que prévu
   (trésorerie saisonnière, faible appétit pour un nouvel outil), épuisant le budget de moins de 25 000 dollars
   canadiens du fondateur avant que le volume ne compose. Signal dès 2027 : les premiers clients pilotes se
   désabonnent après trois à six mois.

## 7. Test à moins de 2 000 dollars et deux semaines

Sur données publiques uniquement, sans contacter personne :

- Location de calcul pour affiner un modèle de vision sur le jeu LIACI : 400 à 600 dollars, estimation.
- Achat de séquences vidéo sous marines en banque d'images, hors LIACI, pour tester hors distribution : 200 à
  400 dollars, estimation. Stockage et outillage cloud deux semaines : 100 à 150 dollars, estimation.
- Marge de sécurité environ 200 dollars, estimation. Total estimé : 900 à 1 350 dollars, sous le plafond de
  2 000 dollars.

Critère chiffré de succès : sur 20 % du jeu LIACI mis de côté, jamais vu à l'entraînement, le modèle doit
détecter au moins 80 % des zones annotées de corrosion et d'encrassement (rappel supérieur ou égal à 0,80) avec
une précision supérieure ou égale à 0,65, et repérer correctement au moins une anomalie visible, validée
manuellement par le fondateur (plongeur qualifié), sur au moins cinq séquences achetées hors LIACI. Si le
critère échoue, l'échelle est retardée, pas enterrée : le barreau 1 peut être restreint à la coque, la mieux
couverte par LIACI, en attendant plus de données.

Premier appel seulement si le test passe : contacter une des trois sociétés nommées en section 2 (IUS, UESI ou
Enviro Tech Diving), avec une démonstration sur des images déjà publiques sur leur site ou leur chaîne vidéo,
avant de proposer un essai payant.

## 8. Financement

Revenu mensuel plausible, estimations : 6 mois (septembre 2027), un client à 1 500 à 3 000 dollars par mois. 12
mois, trois clients à environ 2 000 dollars en moyenne, soit environ 6 000 dollars par mois. 24 mois, huit à dix
clients à environ 2 000 dollars, soit 16 000 à 20 000 dollars par mois. Estimations modestes, cohérentes avec un
rythme de développeur solo.

Programme de subvention plausible pour accélérer le barreau 2 sans condition de survie : le Programme d'aide à
la recherche industrielle (PARI, sigle anglais IRAP, Industrial Research Assistance Program) du Conseil national
de recherches Canada, guichet permanent pour petites et moyennes entreprises technologiques canadiennes avec
conseiller technico-industriel dédié, montant typique estimé entre 15 000 et 50 000 dollars canadiens pour un
projet de développement. Supposé et estimation : programme connu et cité comme accélérateur acceptable dans le
brief du projet, montant exact non vérifié dans ce quota, lacune assumée. Le Ocean Supercluster canadien (grappe
d'innovation océanique financée par le gouvernement du Canada) est une autre piste de cofinancement à l'année
deux, non vérifiée non plus.

## Sources consultées

Rovco, Vaarst, Beam : eenewseurope.com, offshore-technology.com, marinetechnologynews.com. SeaDeep : seadeep.io,
now.tufts.edu. Deep Trekker Qii.AI : oceansciencetechnology.com. Greensea : unmannedsystemstechnology.com.
Sociétés de service : uesi.com, etdiving.com, iusdiving.com, ausdiving.com, coastalsensing.com, geooceans.com,
sepcotech.com, floridahull.com. Prix adjacents : goldengateyachtsurveys.com, inspectionvendorindex.com. Jeux de
données : ieeexplore.ieee.org (LIACI), mdpi.com, researchgate.net, arxiv.org (SUIM). Clauses : lawinsider.com.
Consultées le 7 septembre 2026.

## Résumé en dix lignes

L'échelle Atelier d'Annotation Partagé est vivante, mais fragile, pas morte. Aucun concurrent trouvé ne vend
exactement ce barreau 1 : une couche d'analyse IA agnostique de marque de robot, revendue par de petites
sociétés de service à leurs propres clients d'infrastructure civile. Preuve de vie : trois petites sociétés
nommées (Integrated Underwater Services, Underwater Engineering Services, Enviro Tech Diving) vendent déjà des
rapports à la main, sans outil IA tiers dédié à leur échelle. Preuve de danger : SeaDeep, même promesse d'IA
d'inspection sous marine, a fermé sa société produit en 2025 faute de cycle de vente assez rapide, et Deep
Trekker vend déjà une IA de coque, verrouillée à son propre matériel. Le barreau 1 corrigé doit se vendre comme
agnostique de marque de robot, à un prix mensuel bas gardant le cycle de vente court, jamais comme un projet
d'entreprise à la Beam ou à la SeaDeep première version. Le corpus d'images ne compose que sous forme agrégée et
anonymisée, jamais comme bibliothèque partagée entre clients, à cause des clauses de confidentialité standard du
secteur. L'acteur le plus probable pour la tuer d'ici 2031 est un fabricant de robot déjà installé chez les
clients qui intègre gratuitement une IA suffisante dans le matériel qu'ils possèdent déjà.
