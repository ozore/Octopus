# Dossier de creusement, EM Review (candidat 12)

Passe 4 (validation et creusement), 7 septembre 2026. Idée : relecture assistée par IA des vidéos de
surveillance électronique des pêches (EM, Electronic Monitoring), espèces, prises, rejets, mammifères marins, au
format de rapport MPO (ministère des Pêches et des Océans du Canada) ou NOAA (National Oceanic and Atmospheric
Administration), vendue aux fournisseurs d'EM comme Archipelago Marine Research (Victoria), Saltwater Inc.,
Integrated Monitoring, et aux programmes régionaux, pas aux pêcheurs. Sources d'origine : aquaculture-pêche
candidat 1 (copilote de revue vidéo EM), agences-données candidat 2 (agent d'harmonisation EM). 6 WebSearch
utilisés (quota atteint), WebFetch libre.

## 1. Trois angles candidats

1. **Couche IA générique multi-fournisseur** : un modèle qui fonctionne sur n'importe quel flux EM (n'importe
   quelle caméra, n'importe quel fournisseur), contrairement à un outil verrouillé dans l'écosystème d'un seul
   fournisseur.
2. **Génération du rapport réglementaire exact** (format MPO/NOAA) en plus de la détection, positionné comme la
   brique manquante entre la sortie brute du modèle de vision et le document que le régulateur accepte.
3. **Programmes régionaux et internationaux non couverts** par les trois fournisseurs nommés (hors Alaska,
   hors côte Ouest américaine, hors Colombie-Britannique), qui n'ont ni budget ni équipe pour construire en
   interne.

## 2. Verdict par angle

**Angle 1.** Confirmé : Ifremer note que l'IA marche bien sur une ou peu d'espèces mais que la généralisation
multi-espèces reste un goulot reconnu (vérifié, dossier source agences-données), donc un vrai problème technique
existe. Contredit : Ai.Fish/Catchvision (financé par une subvention SBIR de NOAA) est déjà en « pleine
disponibilité commerciale », vendu aux navires ET aux organismes de gestion des pêches, sans lien apparent à un
seul fournisseur de matériel EM (vérifié, techpartnerships.noaa.gov, WebFetch cette session). Verdict : l'angle
tombe, un produit générique et déjà commercial existe.

**Angle 2.** Confirmé : le rapport 2015 NOAA cité par les deux dossiers d'origine identifie la revue vidéo comme
le poste de coût dominant, ce qui laisse penser qu'une couche de mise en forme du rapport a de la valeur.
Contredit : Catchvision « compte le nombre de poissons capturés, identifie l'espèce » ET « génère des rapports
téléchargeables pour faciliter la conformité réglementaire » (vérifié, WebFetch cette session) ; FishVue AI
d'Archipelago s'intègre à FishVue Interpret pour « validation et documentation » du flux de travail (vérifié,
WebFetch cette session). Détection et mise en forme du rapport sont déjà couvertes par deux produits distincts.
Verdict : l'angle tombe.

**Angle 3.** Confirmé : NOAA opère 14 programmes EM régionaux et le MPO a transféré tout le coût EM du Pacifique
à l'industrie depuis 2013 (vérifié, dossiers sources) ; les déploiements documentés de FishVue AI (300 à 500+
navires) et de la subvention Alaska Longline Fishermen's Association restent concentrés en Alaska et Colombie-
Britannique (vérifié, WebSearch cette session), ce qui laisse des programmes plus petits ou internationaux
potentiellement non couverts. Contredit : VIAME, gratuit et open source, développé par NOAA/Kitware précisément
pour être réutilisable par n'importe quel programme sans payer un fournisseur commercial (vérifié, viametoolkit.org,
WebSearch cette session) ; c'est un concurrent gratuit pour les programmes à petit budget visés par cet angle.
Verdict : l'angle survit partiellement, affaibli, car VIAME couvre déjà la brique technique gratuite mais exige
une compétence de déploiement (« do-it-yourself AI ») que les petits programmes n'ont probablement pas.

**Angle retenu : 3, très affaibli.** Aucun des trois angles ne tient une différenciation solide face aux
acheteurs nommés dans le mandat (Archipelago, Saltwater, Integrated Monitoring) : les deux premiers construisent
déjà en interne, avec succès commercial mesuré. Le seul espace restant est vendre à des programmes plus petits ou
hors Amérique du Nord qui n'ont ni FishVue AI, ni O2Review, ni le budget pour engager Ai.Fish, et qui n'ont pas la
compétence pour déployer VIAME eux-mêmes. C'est un marché de niche, pas celui décrit par le mandat.

## 3. Acheteur, terre à terre

Les trois acheteurs nommés dans le mandat sont en réalité des concurrents, pas des clients probables : Archipelago
a lancé FishVue AI en production sur 300 à 500+ navires, a remporté le prix VIATEC 2026 Innovation Excellence, et
pilote un projet de 581 500 $ CAD cofinancé par Canada's Ocean Supercluster (148 500 $ CAD, Stratégie
pancanadienne en matière d'IA) avec l'Université de Victoria et deux associations de pêcheurs (vérifié,
oceansupercluster.ca, WebFetch) : dépense déjà engagée en interne, pas dans l'achat externe. Saltwater Inc. a déjà
intégré une détection IA (personnes sur le pont) dans O2Review, conçu pour accueillir des outils IA (vérifié,
saltwaterinc.com, WebSearch). Integrated Monitoring introuvable cette session (lacune, quota épuisé). Acheteur
plus réaliste : un organisme de gestion des pêches régional ou international sans fournisseur EM doté d'IA
propre, ou un petit fournisseur EM sans équipe de science des données. Fonction qui signerait un bon de commande
de 2 000 $ : non identifiée, **question à poser au client**. Dépense actuelle documentée : NOAA situe le coût EM
à environ un tiers du coût d'un observateur humain (jusqu'à 800 $US/jour), revue vidéo manuelle en poste de coût
dominant (vérifié, dossiers sources et WebSearch) ; $/heure exact introuvable (estimation, voir section 8).

## 4. Produit en 6 lignes, prix, retour annuel

1. Ingestion de la vidéo EM brute déjà tournée sous mandat réglementaire.
2. Détection et classification des espèces, comptage des prises et rejets, signalement des mammifères marins.
3. Génération du rapport au format exigé par le régulateur (MPO ou NOAA).
4. Signalement des segments incertains pour revue humaine ciblée (pas de décision automatique finale).
5. Export archivé par navire/fournisseur pour la saison suivante.
6. Validation humaine obligatoire avant soumission au régulateur.
Vérifié : le contenu exigé par le rapport et l'existence du poste de coût dominant. Supposé : la performance d'un
modèle construit par un fondateur seul face à FishVue AI (48 % de gain de temps mesuré, 46 % d'économie de coût,
erreur 2,7 % contre 1,3 % en revue humaine standard, vérifié WebSearch) ou Catchvision (jusqu'à 80 % de gain de
temps annoncé, vérifié WebFetch).
Prix et modèle : abonnement par heure de vidéo traitée ou par saison, en dessous du coût actuel de revue humaine,
modèle à valider. Retour l'année suivante (Q7) : chaque saison de pêche redemande un rapport EM, et un modèle
entraîné sur les espèces et angles de caméra spécifiques d'un site s'améliore avec l'historique local, mais ce
mécanisme d'accumulation est exactement celui que FishVue AI revendique déjà via son projet Ocean Supercluster
(supposé, non testé cette session).

## 5. Faisabilité depuis Vancouver

Données publiques exploitables : aucune archive vidéo EM publique identifiée cette session (vidéo EM soumise sous
mandat réglementaire, propriété du fournisseur ou du régulateur, non en libre accès) ; corpus de substitution
possible via FathomNet (MBARI, licence de code MIT mais licence des images non confirmée) ou VIAME/Kitware
(gratuit, orienté relevés scientifiques, pas vidéo de pont de bateau). Matériel : aucun nécessaire pour un
prototype sur données publiques de substitution. Permis : aucun, le fondateur ne fait pas d'observation lui-même.
Blocage réel : accès à de la vraie vidéo EM de pont de bateau (mauvaise lumière, occlusion, angles fixes) non
public ; sans partenariat avec un fournisseur ou un programme régional, impossible de valider la performance en
conditions réelles, contrairement à Archipelago et Ai.Fish qui ont un accès direct à ces flux.

## 6. La preuve se retourne-t-elle contre l'acheteur ?

Oui, potentiellement : un rapport EM erroné (espèce mal identifiée, rejet non compté) expose le fournisseur EM ou
le pêcheur à une non-conformité face au régulateur, avec un risque de sanction ou de perte de permis.
L'architecture l'évite comme FishVue AI et Catchvision le font déjà : IA « assistée » qui accélère la revue sans
retirer la validation humaine finale, aucune décision de conformité automatique, export uniquement après signature
d'un réviseur humain.

## 7. Test à moins de 2 000 $ et deux semaines

Construire un classificateur d'espèces sur un corpus public de substitution (FathomNet ou clips publics NOAA
Fisheries de démonstration EM, si trouvés) et comparer sa précision aux chiffres publiés de FishVue AI (2,7 %
d'erreur) et Catchvision (80 % de gain de temps annoncé). Critère chiffré : atteindre une précision de
classification d'espèces égale ou supérieure à 90 % sur le corpus de test en moins de 40 heures de travail, pour
moins de 2 000 $ (temps du fondateur, coût de calcul cloud). Limite assumée : ce test ne prouve rien sur la
performance en conditions réelles de pont de bateau, faute d'accès à de la vraie vidéo EM (voir section 5).

## 8. Incertitudes et question au client

Coût précis en $/heure de revue vidéo humaine introuvable (estimation, à partir du ratio « EM environ un tiers du
coût observateur, jusqu'à 800 $US/jour »). Existence et statut d'Integrated Monitoring comme entreprise non
confirmés. Rôle exact de Barnacle Systems Inc. (partenaire du financement FishVue AI, site injoignable cette
session) non éclairci : IA en sous-traitance ou simple fournisseur matériel. Question à poser au client : un
fournisseur EM plus petit ou un programme régional hors Alaska/Colombie-Britannique/côte Ouest américaine
paierait-il pour un outil que ni FishVue AI, ni O2Review, ni Catchvision, ni VIAME (gratuit) ne couvrent
aujourd'hui, et à quel prix ?
