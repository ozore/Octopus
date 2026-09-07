# Dossier de creusement : Échelle 3, GroundTruth Ocean

Date : 7 septembre 2026. Agent : c27-groundtruth, passe 5, projet Octopus. Échelle source : dossier de tendance
donnee-ocean, section f, échelle 3 (ocean-5/agents/donnee-ocean/dossier.md).

Verdict en première ligne : le barreau 1 tel que décrit (vendre un contrat d'annotation d'images sous marines de la
Colombie Britannique au Plymouth Marine Laboratory, PML, laboratoire de recherche marine britannique) est mort. Deux
raisons trouvées cette session. D'abord, le modèle cité comme client, Granite Geospatial Ocean (IBM et PML), est
entraîné sur des images couleur du satellite Copernicus Sentinel 3 et sur une centaine de mesures de terrain, pas sur
des photos sous marines annotées par des plongeurs (vérifié, source IBM Research) : ce client précis n'a pas ce
besoin. Ensuite, un acteur gratuit et déjà financé à plus de 5 millions de dollars américains, FathomNet (base
d'images sous marines de MBARI, Monterey Bay Aquarium Research Institute, institut de recherche californien), fait
déjà exactement ce que l'échelle propose : un registre d'images géolocalisées, "curated and validated by MBARI deep
sea biology experts" (vérifié, source MBARI), gratuit, avec plus de 100 000 images et 800 contributeurs dans 101
pays. La section 7 propose un barreau 1 de remplacement, explicitement marqué comme tel.

## 1. Qui vend déjà cela

- CVision AI (société américaine) : éditeur de Tator, plateforme d'annotation vidéo et image, et fabricant de
  caméras sous marines (ShoalSight, financé par une subvention du Massachusetts Department of Marine Fisheries).
  CVision AI est membre du consortium Ocean Vision AI (voir ci dessous), pas un simple concurrent isolé. Vend des
  systèmes clé en main (matériel plus logiciel plus hébergement) à des agences et laboratoires, prix non public
  (vérifié pour l'existence de l'offre, prix non trouvé).
- MBARI, FathomNet et Ocean Vision AI (OVAI) : FathomNet est une base d'images sous marines ouverte, fondée en 2018,
  financée par 5 millions de dollars américains de la National Science Foundation (NSF, agence fédérale américaine
  de recherche) via son programme Convergence Accelerator (2022), plus la National Geographic Society, NOAA
  (National Oceanic and Atmospheric Administration, agence océanique et atmosphérique américaine) et la fondation
  David et Lucile Packard. Plus de 100 000 images, 800 contributeurs, 101 pays, 6,6 millions d'annotations produites
  par l'application citoyenne gratuite FathomVerse (vérifié, source MBARI). OVAI, financé lui aussi par la NSF (prix
  NSF AWD_ID 2137977), réunit MBARI, CeNCOOS (Central and Northern California Ocean Observing System), Climate
  Change AI, CVision AI, Ocean Discovery League et l'université Purdue pour construire l'outillage d'annotation
  assistée par IA que GroundTruth Ocean voulait construire seul (vérifié, source NSF award search).
- BenthicNet : compilation mondiale d'images de fond marin, en licence ouverte CC BY 4.0, gratuite, 1,3 million
  d'images sélectionnées sur 11,4 millions collectées, 190 000 images annotées pour 3,1 millions d'annotations,
  utilisant déjà un standard de taxonomie existant, le schéma CATAMI (Collaborative and Annotation Tools for
  Analysis of Marine Imagery, système de classification visuelle des fonds marins) (vérifié, source Nature
  Scientific Data et arXiv). Le financement précis, canadien ou non, n'a pas été confirmé cette session (lacune).
  Ce point tue une partie de l'argument "e" du dossier de tendance : un standard de taxonomie pour l'imagerie
  benthique existe déjà et est déjà adopté à 190 000 images, gratuitement.
- Scale AI, Labelbox, iMerit (sociétés généralistes d'annotation) : aucune offre marine spécifique nommée trouvée
  cette session ; ce sont des généralistes capables de prendre un contrat marin ponctuel si un acheteur le demande,
  mais rien ne prouve qu'ils l'ont fait (lacune, pas une preuve d'absence).

Conclusion de l'étape 1 : le registre gratuit et financé par des fonds publics pluriannuels existe déjà, avec
validation experte, à l'échelle mondiale, et son écosystème (Ocean Vision AI) inclut déjà l'éditeur d'outils que
l'échelle comptait utiliser. Le barreau 1 tel qu'écrit est mort.

## 2. Le client du barreau 1 (version proposée, testée et invalidée)

- Plymouth Marine Laboratory (PML) avec IBM : preuve trouvée contre l'hypothèse. Granite Geospatial Ocean n'a pas
  besoin d'images sous marines annotées par des plongeurs (vérifié, source IBM Research, voir verdict ci dessus).
  Aucune offre d'emploi ni appel d'offres trouvé chez PML pour de l'annotation d'imagerie sous marine.
- Microsoft, Google : aucune transaction, offre d'emploi ni appel d'offres publié trouvé cette session liant l'un ou
  l'autre à l'achat de données visuelles ou acoustiques sous marines annotées (lacune, deux recherches tentées).
- Fabricants de robots et de caméras sous marines (Saildrone, Teledyne, SubC Imaging, Deep Trekker) : aucune preuve
  trouvée d'achat de service d'annotation experte tiers ; ils construisent plutôt leurs propres pipelines internes
  (CVision AI en est un exemple, mais il vend l'outil, pas la donnée annotée) (lacune).
- Agence trouvée avec un besoin réel et documenté : CEFAS (Centre for Environment, Fisheries and Aquaculture
  Science, agence scientifique publique britannique), avis de marché CEFAS24 70 publié en novembre 2024, pour
  l'analyse d'images de fond marin, fixes et vidéo, de deux sites de la Manche collectées en 2023 et 2024 (lu,
  source find tender service gov uk, valeur du contrat non obtenue, page bloquée en lecture directe cette session).
  C'est un signal de demande réel pour de l'analyse d'imagerie sous marine, mais c'est un marché public : le brief
  interdit un marché public comme premier client.

Conclusion : aucun acheteur privé nommé, avec une ligne budgétaire prouvée, n'a été trouvé pour un registre
d'images ou de sons sous marins validés par des experts en 2024 à 2026. Le seul signal de demande documenté est un
marché public britannique, exclu comme premier client par le brief.

## 3. Prix de marché de l'annotation d'image experte

Aucun prix marin spécifique trouvé (Aquabyte, ThayerMahan, Sercel : pages consultées, aucun prix publié). Le marché
général de l'annotation d'image en 2025 à 2026 : de 0,03 à 1,00 dollar américain par étiquette simple (boîte
englobante), de 0,50 à 6,00 dollars par image segmentée, et de 6 à 60 dollars américains par heure d'annotateur
selon la région et la compétence (lu, sources BasicAI, GigaBPO, datavlab). L'annotation experte spécialisée
(exemple cité : imagerie médicale) coûte de trois à dix fois plus cher qu'une annotation générique, par exemple 2,50
dollars par image contre 0,05 dollar pour une image de produit courant (lu, source GigaBPO). Un salaire moyen
d'annotateur d'image généraliste aux États Unis est d'environ 25 dollars de l'heure, 51 556 dollars par an (lu,
source Salary.com et ZipRecruiter). Par extrapolation, une image sous marine annotée par un plongeur biologiste
vaudrait plausiblement entre 1 et 5 dollars américains par image, ou entre 30 et 60 dollars de l'heure de travail
expert (estimation, faute de prix marin publié).

## 4. Question 8 : le réseau compose t il, ou Scale le copie en un trimestre

Réponse : incertain, avec un poids fort vers "Scale, ou plus précisément FathomNet et OVAI, le fait déjà, en mieux
financé". La thèse de l'échelle est que le réseau de plongeurs et biologistes payés à la tâche, et le standard de
qualité qu'ils font adopter, sont l'actif non reconstructible. Mais FathomNet a déjà un réseau de 800 contributeurs
dans 101 pays, une validation experte MBARI, et 5 millions de dollars de la NSF pour l'outillage. Un concurrent
n'a même pas besoin de "copier en un trimestre" : le concurrent existe depuis 2018, est financé par des fonds
publics pluriannuels, et sa mission explicite est de rendre ce service gratuit à l'échelle mondiale. La seule
différence défendable pour un réseau payé à la tâche serait la vitesse et la fiabilité contractuelle (délai garanti,
niveau de service, format exigé par un client précis) plutôt que la simple existence du réseau, mais aucun client
prêt à payer pour cette différence n'a été identifié cette session (voir section 2).

## 5. Les sept questions

1. Qui signe, avec quelle ligne budgétaire ? Non. Aucun acheteur privé nommé trouvé (section 2). Le seul acheteur
   documenté est un marché public britannique, exclu par le brief.
2. La preuve se retourne t elle contre l'acheteur ? Incertain. Un score de validation propriétaire pourrait être
   jugé moins rigoureux qu'un jeu de référence public déjà cité dans la littérature (FathomNet, BenthicNet), ce qui
   jouerait contre l'acheteur devant un pair reviewer ou un régulateur.
3. L'IA est elle le produit ? Oui, en partie : vérifiée pour la pré annotation assistée (technique standard dans
   l'industrie, Tator et BIIGLE le font déjà), mais la validation finale reste humaine et payée à la tâche, ce qui
   est le geste manuel remplacé, pas l'IA elle même.
4. Existe t il gratuit ou déjà acheté ? Oui, de façon écrasante : FathomNet, BenthicNet, Ocean Vision AI (section 1).
5. Faisable seul depuis Vancouver ? Non pour le barreau 1 tel qu'écrit : il suppose un réseau de plongeurs
   multi régions dès le barreau 3, impossible à amorcer seul avec des données publiques sans contacter personne.
6. Une phrase sans acronyme ? Oui : "un registre de photos et de sons du fond marin, vérifiés par des plongeurs et
   des scientifiques, pour vérifier si un modèle d'intelligence artificielle de l'océan se trompe."
7. Revient il chaque année avec ses propres données ? Incertain : dépend d'un contrat pluriannuel de site jamais
   trouvé pour cette échelle ; les registres génériques (FathomNet) n'ont pas ce lien contractuel récurrent, un
   registre local à un site pourrait l'avoir, voir barreau de remplacement en section 7.
8. En année cinq, plus difficile à attaquer qu'en année un ? Incertain pour la version originale (le réseau généraliste
   est déjà battu par un acteur gratuit mieux financé) ; possible pour la version resserrée sur un site unique et un
   contrat récurrent (section 7), à condition qu'un vrai client paie dès le barreau 1.

## 6. Pré mortem

"2031, la société est morte." Trois causes, classées par probabilité, avec signal avant coureur observable dès 2027.

1. La plus probable : aucun client privé n'a jamais signé, parce que FathomNet, BenthicNet et Ocean Vision AI
   couvrent le besoin générique gratuitement et que les besoins locaux et récurrents restent trop rares pour former
   un marché. Signal avant coureur : au barreau 1 de remplacement (section 7), moins de trois exploitants de site
   contactés n'acceptent de payer un abonnement de validation, même à faible prix.
2. Deuxième cause : la validation locale devient inutile quand les modèles de fondation océaniques (Granite
   Geospatial Ocean et ses successeurs) deviennent assez bons en zéro exemple pour se passer de calibration locale
   image par image.
3. Troisième cause : un laboratoire universitaire canadien (celui derrière BenthicNet, ou un partenaire d'Ocean
   Networks Canada, ONC, observatoire câblé opéré par l'Université de Victoria) ajoute une couche de validation
   locale au registre gratuit existant, financée par une subvention plutôt qu'un revenu, avant que l'échelle
   n'ait un historique assez long pour être défendable.

## 7. Barreau 1 de remplacement (explicitement un remplacement) et test à moins de 2 000 dollars

Le barreau 1 original meurt à l'étape 1. Remplacement le plus crédible trouvé cette session : au lieu de vendre un
registre générique à un laboratoire de modèle de fondation, vendre un audit récurrent de calibration à un seul
exploitant de site en Colombie Britannique qui possède déjà une caméra sous marine avec IA embarquée (par exemple
un site de salmoniculture ou un projet de restauration d'algueraie suivi par DFO, Pêches et Océans Canada, ministère
fédéral) : le fondateur, plongeur certifié, valide manuellement à la main un échantillon mensuel des détections de
l'IA du client contre la réalité observée, et facture cet audit comme preuve de conformité, pas comme donnée
d'entraînement générique. C'est plus proche d'un service de contrôle qualité récurrent que d'un registre à vendre
à des tiers, et cela évite frontalement FathomNet, qui ne fait pas d'audit contractuel site par site. Cette
option est supposée, pas vérifiée : aucun exploitant nommé n'a confirmé un besoin ou un budget cette session.

Test à moins de 2 000 dollars canadiens, deux semaines, sans contacter personne, sur données publiques : télécharger
un lot d'images étiquetées de FathomNet (gratuit) et un flux vidéo public d'ONC (Ocean Networks Canada, gratuit via
le portail Oceans 3.0), construire un pipeline de pré annotation assistée par IA avec un modèle de vision
disponible, puis mesurer le taux d'accord entre les étiquettes produites par le pipeline et les étiquettes
existantes de FathomNet sur un échantillon de 500 images. Critère chiffré de succès : au moins 80 pour cent
d'accord au niveau du genre taxonomique sans intervention humaine, ce qui prouverait que la pré annotation assistée
vaut la peine d'être vendue comme gain de temps à un client d'audit, pas que le registre lui même a de la valeur.
Coût estimé : temps du fondateur plus environ 200 à 500 dollars canadiens de calcul infonuagique (estimation). Le
premier appel n'a lieu que si ce test dépasse 80 pour cent : il vise alors un exploitant de site unique en Colombie
Britannique repéré via un registre public d'aquaculture ou de restauration marine, pas un laboratoire de modèle de
fondation.

## 8. Financement

Revenu mensuel plausible (barreau 1 de remplacement, toutes estimations) : à 6 mois, 0 à 2 000 dollars canadiens
(phase de test, pas de client signé) ; à 12 mois, 1 500 à 4 000 dollars canadiens par mois si un seul exploitant de
site signe un abonnement d'audit mensuel ; à 24 mois, 4 000 à 10 000 dollars canadiens par mois avec deux à trois
sites clients. Programme de subvention précis : le Fonds pour les combustibles propres n'applique pas ici ; le
guichet pertinent est le Fonds d'innovation Supergrappe des océans (Ocean Supercluster, organisme canadien financé
par le gouvernement fédéral, guichets ouverts en continu pour des projets d'innovation océanique, montants
typiquement de 100 000 à plusieurs millions de dollars canadiens selon le projet, cofinancement industriel exigé)
(vérifié pour l'existence du guichet dans le brief fondateur, montant non revérifié cette session) : il accélérerait
un barreau 2 avec un deuxième site client, sans être la condition de survie, conformément au brief.

## Références (consultées le 7 septembre 2026)

- https://www.mbari.org/data/fathomnet/
- https://www.fathomnet.org/about
- https://www.sciencedaily.com/releases/2022/10/221018130553.htm
- https://www.nsf.gov/awardsearch/showAward?AWD_ID=2137977
- https://research.ibm.com/blog/oceans-AI-model
- https://arxiv.org/abs/2405.05241
- https://www.nature.com/articles/s41597-025-04491-1
- https://www.cvisionai.com/
- https://techpartnerships.noaa.gov/tator-web-video-analytics-platform/
- https://www.find-tender.service.gov.uk/Notice/035631-2024 (avis lu par extrait de recherche, page bloquée en
  lecture directe)
- https://www.basic.ai/blog-post/how-much-do-data-annotation-services-cost-complete-guide-2025
- https://gigabpo.com/data-labeling-cost-per-image/
- https://www.salary.com/research/salary/hiring/image-annotator-salary
- https://www.aquabyte.ai/

## Lacunes assumées

- Aucun prix public trouvé pour l'annotation experte d'images ou de sons sous marins spécifiquement : le prix cité
  en section 3 est une extrapolation depuis le marché général de l'annotation, étiquetée estimation.
- Valeur exacte du contrat CEFAS24 70 non obtenue (page find tender bloquée en lecture directe, résumé de recherche
  seulement).
- Financement précis de BenthicNet (pays, agence, montant) non confirmé cette session.
- Aucun exploitant de site en Colombie Britannique nommé et contacté pour le barreau 1 de remplacement : c'est une
  hypothèse à tester, pas un client prouvé.
- Microsoft et Google : recherche tentée deux fois sous des angles différents (achat de données annotées, modèles de
  fondation océaniques), aucune transaction trouvée ; traité comme absence de preuve, pas comme preuve d'absence.
