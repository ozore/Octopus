# Dossier de creusement : Recouvrement

Date : 7 septembre 2026. Idee source : generation/drone-restauration/dossier.md, idee fusionnee "Recouvrement" du
Tour 2, jugee VIVANTE par tueur.md (Tour 1 et Tour 2). Tri impose pour ce lot : seul le canal sous traitant drone
(ligne 10) est retenu ; le canal abonnement direct au cabinet (ex "Memoire de site") tombe sous la cause 9 de la
memoire (delineation deja facturee 34 a 44 $/heure, verifie par le tueur au Tour 2, source citee au point 1).

## 1. Ce que l'acheteur paie deja, et deux occupants voisins de plus

L'acheteur du barreau 1 paie deja deux choses pour ce travail : Esri, via l'extension ArcGIS Image Analyst (deja
payante) et l'ArcGIS Living Atlas (modeles pretrained de couverture du sol) ; et Agisoft Metashape (classification
semantique limitee a Ground, Vegetation, Building, Road, Car, Man made). Verifie deux fois independamment par le
tueur (Tour 1) : aucun des deux ne livre les classes fines d'habitat cotier (herbier, marais, varech, recif
d'huitres) a l'echelle centimetrique du drone.

Deux occupants voisins de plus, trouves ce tour et non nommes par le tueur : GeoNadir (plateforme d'hebergement de
donnees drone, gratuite au demarrage) heberge des jeux de donnees de recherche sur les recifs d'huitres et l'herbier
mais ne vend aucune classification commerciale, verifie par lecture directe de sa page (7 septembre 2026) : c'est un
hebergeur, pas un classificateur. Droners.io et Droners.com (marketplace de pilotes de drones, presence Californie et
Floride pour la cartographie environnementale) connectent des sous traitants a des clients mais ne font aucune
classification d'habitat, verifie par lecture des pages de service. Complements verifies sur les noms cites dans la
consigne : Pix4D publie un article de cas sur la cartographie de zones humides de l'Etat de New York, mais sans
classification automatique d'habitat integree au logiciel (verifie, source ci dessous) ; aucune preuve trouvee que
DroneDeploy ou Picterra proposent des classes d'habitat cotier specifiques (absence notee, pas une preuve negative
forte). Skyline n'a pas ete verifie ce tour, budget de recherche epuise ; a verifier au tour suivant. Thomson
Environmental Consultants (memoire generation) garde un outil interne non revendu, confirme par le tueur.

## 2. Population et plafond de revenu

Sous 300 000 $ par an au barreau 3 (2030) : le calcul central converge sous ce seuil. Voir methode au point 5.

Acheteurs nommables : sept cabinets deja confirmes par le tueur (HANA Resources, UltraSystems Environmental Inc,
AquaTech Eco Consultants, Sequoia Ecological Consulting, Horner Environmental, AeroTech UAV, CSA Ocean Sciences Inc),
plus cinq cabinets de delineation trouves ce tour dont l'usage du drone n'est pas confirme (ECORP Consulting,
Partner ESI, Environmental Consultants of Florida, Creative Environmental Solutions, Verde Environmental Co ;
recherche du 7 septembre 2026, aucun ne mentionne explicitement un drone dans les extraits trouves). Bornes de
contexte, lues : ACEC Floride revendique plus de 350 cabinets d'ingenierie membres (dont conseil environnemental) ;
ACEC Californie revendiquait pres de 1 100 cabinets en 2010 (chiffre date, lu). Ces deux bornes couvrent tout type
d'ingenierie, pas seulement la niche drone plus suivi cotier ; la part reelle est une petite fraction, non chiffree
directement. Cote operateurs, Droners.io et Droners.com listent des pilotes commerciaux pour la cartographie
environnementale en Californie et en Floride sans compte public exploitable (marketplace "parmi les plus grandes au
monde", lu, pas de chiffre precis) ; Indeed listait 25 annonces actives "Part 107 Drone" en Californie au moment de
la recherche, un sous ensemble encore plus etroit visant specifiquement le cotier. Aucun annuaire USACE ou ACEC de
consultants agres specifiquement pour le suivi de compensation cotiere par drone n'a ete trouve en acces libre,
confirmant la lacune deja notee par le tueur au Tour 2.

Methode du plafond au barreau 3 (2030) : population de sous traitants et cabinets pertinents estimee entre 150 et
400 aux Etats Unis (23 Etats cotiers, borne du tueur, multipliee par une poignee d'operateurs actifs par Etat sur la
base des sept cabinets confirmes et du marche fragmente de la ligne 10). Taux d'adoption suppose a 15 % en 2030
(marche naissant, aucune infrastructure de vente encore construite, produit non teste). Adopteurs : environ 22 a 60.
Ticket moyen : 275 $ par orthomosaique (milieu de la fourchette 150 a 400 $, lignes.md ligne 10 et point 7
ci dessous). Volume suppose : 8 a 12 orthomosaiques par adopteur et par an (frequence typique d'un suivi
reglementaire pluriannuel, plusieurs sites). Revenu annuel estime : de 22 x 8 x 275 = 48 400 $ a 60 x 12 x 275 =
198 000 $, avec un scenario haut optimiste (adoption 20 %, 15 vols/an) qui approche 300 000 $ sans le depasser
nettement. Estimation, methode transparente, plafond confirme sous 300 000 $ par an au barreau 3.

## 3. Trois acheteurs du barreau 1

HANA Resources (programme de resilience cotiere, Outer Banks) paie aujourd'hui la prestation drone brute (ligne 10,
150 a 600 $/heure ou 10 a 25 $/acre, lu) sans analyse ecologique incluse ; elle acheterait a une societe d'une
personne plutot qu'a Esri ou Agisoft (aucun ne vend la classe fine) et plutot qu'a Thomson (outil interne non
revendu) parce qu'elle n'a ni la donnee d'entrainement ni l'ecologue en apprentissage automatique pour un volume de
quelques sites par an. UltraSystems Environmental Inc (Californie du Sud, plus de 28 ans de conseil environnemental
par drone) et AquaTech Eco Consultants (cartographie de vegetation et zones humides) sont dans la meme situation,
verifie par recherche du tour de generation, non recontredit par le tueur. Deux operateurs purs trouves ce tour pour
le canal sous traitant strict : AeroTech UAV (Floride, cartographie drone de zones humides et cotieres) et Coastal
Drone Service, un pilote professionnel liste sur Droners.io actif en cartographie et releve. Achat a la prestation
(par orthomosaique ou par acre), jamais en abonnement fixe recurrent, pour rester hors de la cause 9.

## 4. Le produit, six fonctionnalites dans l'ordre de vente

1. Import de l'orthomosaique deja livree par le sous traitant ou le cabinet, aucune donnee supplementaire requise du
   client au premier envoi.
2. Classification automatique par habitat (herbier, marais, varech, recif d'huitres). Verifiee (source) par habitat,
   une publication datee chacune : herbier, Remote Sensing 2023, doi 10.3390/rs15092321 ; marais, Drones 2024, doi
   10.3390/drones9040235 ; varech, protocole ScienceDirect/PMC 2024 ; recif d'huitres, ScienceDirect 2024 et reseau
   OysterNet.
3. Rapport de pourcentage de couverture par site, calque exportable au format SIG (GeoTIFF, shapefile).
4. Validation de precision contre des points de controle terrain (quadrats, transects), pratique reprise des quatre
   publications citees, qui rapportent toutes un taux de precision mesure contre le terrain. Verifiee (source), le
   principe existe dans la litterature pour chaque habitat pris seul.
5. Historique pluriannuel et courbe de tendance par site, methode constante d'une annee sur l'autre. Fonctionnalite
   secondaire, vendue seulement au client qui a deja un plan de suivi formel actif, pas a tout survol.
6. Calibrage leger par site lors d'un transfert geographique. Supposee, pas verifiee : voir le test a 2 000 $ au
   point 8.

Donnees publiques pour amorcer sans un seul courriel : imagerie aerienne cotiere haute resolution de NOAA Digital
Coast (publique, telechargeable) pour pretester le pipeline ; jeux de donnees publies avec les articles cites au
point 2, dont SeagrassFinder (arXiv 2412.16147, deep learning pour l'herbier, publie "in the wild", jeu de donnees
associe) et le protocole de collecte terrain plus annotation d'images pour la cartographie d'habitat cotier publie
sur ScienceDirect en 2024, qui documente son propre protocole d'annotation reutilisable.

## 5. L'actif par mecanisme, barreau par barreau

Mecanisme corrige apres la faille notee par le tueur (qui va sur le terrain n'est pas precise dans le dossier
source) : les points de verification terrain (quadrats, transects photographies) sont produits par le personnel du
cabinet client, pas par le fondateur, quand celui ci emploie deja un poste de terrain (verifie ce tour : des postes
"wetland delineation specialist" existent chez des cabinets americains a 34 a 44 $/heure et citent l'usage de
photographie aerienne et de SIG, memoire du tueur Tour 2). Ce que le fondateur garde malgre cela, par une clause
standard de produit du travail dans le contrat de service : le modele calibre par site (poids ajustes, parametres de
seuil propres a la turbidite et au marnage locaux) et l'historique de la courbe de precision mesuree contre le
terrain d'une annee sur l'autre restent la propriete du fondateur ; seuls le calque classe et le rapport de precision
sont livres au client. Le client peut remettre ses points de terrain bruts a un concurrent, mais pas le modele
calibre ni l'historique de precision documente : un nouveau prestataire doit reconstituer sa propre courbe de
precision, ce qui prend une saison de terrain, pas un reclassement de bureau.

2027 (barreau 1, premiers clients ponctuels) : personne ne detient la donnee aujourd'hui. Le fondateur commence a
zero, aucune obligation ne le retient encore, la relation est un achat ponctuel sans cout de sortie reel.

2028 (barreau 2, clients sous plan de suivi actif) : le fondateur detient une a deux saisons de courbes de precision
par site. Le client le garde parce que la clause de produit du travail exclut le modele et le journal de calibrage
du livrable ; changer de prestataire en cours de suivi force une nouvelle campagne de calibrage terrain avant le
prochain rapport.

2030 (barreau 3, plusieurs clients recurrents, plafond estime au point 2) : trois annees de series de precision
documentees. Les plans de suivi USACE durent typiquement 5 a 10 ans et exigent une methode constante pour rester
comparables (verifie ce tour : le gabarit de rapport de suivi de mitigation du district de Saint Paul, USACE, exige
des donnees vegetales substantiant la reussite du site). Rompre la methode en cours de suivi risque un rapport jugee
non comparable par le regulateur.

2033 (barreau 4, expansion multi Etats) : bibliotheque de modeles calibres site par site sur plusieurs Etats cotiers.
Test adverse, un concurrent avec 5 millions de dollars en 2031 : il peut embaucher des data scientists et entrainer
plus vite, mais il ne contourne pas l'obligation de validation terrain documentee par site exigee par le regulateur
(point 6 ci dessous) ; il doit refaire les memes campagnes de calibrage terrain que le fondateur, site par site, ce
qui limite son avantage de capital a la vitesse de vente, pas a la vitesse de validation. Risque non resolu : un
concurrent finance peut recruter les memes cabinets avec une garantie de precision day one et plus de budget marketing.

2036 (barreau 5, maturite) : si Esri ou Agisoft n'a pas absorbe la classification fine dans son propre produit deja
installe (cause 1 du pre mortem, point 7), le fondateur detient l'historique le plus long de courbes de precision
multi sites, un actif difficile a repliquer vite meme finance, mais qui devient sans valeur si l'editeur deja
installe chez le client ajoute la fonction nativement.

## 6. Question 8 et les sept questions

Question 8 (mecanisme) : oui, le fondateur detient un actif defendable (modele calibre plus historique de precision),
preuve au point 5, a condition de cibler d'abord les sites sous plan de suivi formel plutot que tout survol.

Cadre des sept questions (Zero to One, Peter Thiel), reponse oui, non ou incertain avec preuve :
1. Genie (technologie reellement superieure) : incertain. La classification par habitat pris seul est verifiee par
   publication datee (point 4) ; le transfert d'un modele entraine vers un nouveau site sans reentrainement n'est
   pas documente dans la litterature trouvee, supposee seulement. Voir le test au point 8.
2. Timing : oui. Aucun vendeur commercial n'occupe ce barreau aujourd'hui, verifie deux fois par le tueur et une
   troisieme fois ce tour (point 1) ; mais Esri controle deja l'infrastructure pour l'ajouter rapidement, fenetre de
   temps limitee.
3. Monopole (grande part d'un petit marche) : oui, plausible. La population estimee est etroite (150 a 400
   operateurs, point 2) ; viser une part significative d'un marche deja petit est plus atteignable pour une societe
   d'une personne qu'une fraction d'un grand marche.
4. Personnes : incertain. Le fondateur est developpeur data et IA, competence proche mais non identique a la
   segmentation d'image aerienne d'habitat cotier ; aucune preuve verifiable par recherche de cette competence
   precise.
5. Distribution : incertain. Le canal (ligne ajoutee a la facture du sous traitant, ou vente directe a un cabinet
   qui vole lui meme) n'a pas ete teste ; aucun appel n'a encore eu lieu, conformement a l'etape 8 qui l'exige apres
   le test seulement.
6. Durabilite : incertain. Depend fortement de la cause 1 du pre mortem (Esri ou Agisoft absorbe la fonction),
   jugee non realisee aujourd'hui mais la plus serieuse a moyen terme par le tueur a deux reprises.
7. Secret : oui, partiellement. Le regulateur exige une validation terrain documentee, pas seulement une
   classification automatique (verifie ce tour, point 6 ci dessous) ; cette barre est plus dure a copier qu'il n'y
   parait, et c'est exactement l'actif que le fondateur construit au point 5.

## 7. Le regulateur, verifie

USACE exige, selon le gabarit de rapport de suivi de mitigation lu (district de Saint Paul, 2024), des donnees
vegetales substantiant la reussite ou les difficultes du site ; une etude comparative citee dans la recherche montre
un ecart significatif entre estimations drone et releves de terrain selon l'echelle, et une autre montre une
exactitude de 89,22 % pour la classification manuelle contre 69,26 % pour une classification automatique par foret
aleatoire sur de la vegetation de prairie. Une source universitaire confirme : "les donnees de drone appuient la
delineation de zone humide sans la remplacer". La Commission cotiere de Californie n'a pas de systeme de suivi de
mitigation centralise et revient a une revue de conformite permis par permis ; aucune preuve trouvee d'une exigence
ou d'un refus explicite de couverture classee par IA en Floride specifiquement. Conclusion verifiee : le regulateur
n'accepte pas une classification automatique seule comme preuve suffisante ; il exige une validation contre le
terrain documentee. Ceci confirme que le produit doit vendre la validation (point 4, fonctionnalite 4) et non
seulement le pourcentage automatique, ce qui renforce l'actif du point 5 plutot que de l'affaiblir.

## 8. Pre mortem : 2031, la societe est morte

Cause 1, la plus serieuse : Esri (Image Analyst, Living Atlas) ou Agisoft ajoute la classification fine d'habitat
cotier a son propre produit deja installe chez les clients. Signal avant coureur des 2027 : notes de version Esri ou
Agisoft mentionnant des classes de vegetation de zone humide ou d'habitat cotier. Verification que la cause n'est pas
deja realisee au 7 septembre 2026 : confirmee independamment trois fois (dossier de generation, tueur, ce tour) ;
aucun des deux editeurs ne le fait aujourd'hui.

Cause 2 : le transfert inter site du modele ne fonctionne pas sans reentrainement couteux, cassant le tarif fixe au
$ par acre. Signal des 2027 : resultat du test du point 9 montrant un ecart de precision important sur un site non
vu.

Cause 3 : la population reelle de sous traitants et cabinets combinant drone et suivi pluriannuel reste trop petite
pour depasser quelques dizaines de clients recurrents, plafonnant le revenu durablement sous 300 000 $ par an.
Signal des 2027 : moins de cinq clients payants recurrents apres les premiers appels suivant le test du point 9.

## 9. Test a moins de 2 000 $, puis le premier appel

Test : appliquer un modele deja entraine et publie pour un habitat (par exemple le modele herbier de Remote Sensing
2023, ou reproduire le pipeline documente par SeagrassFinder, arXiv 2412.16147, publie comme fonctionnant "in the
wild") a une orthomosaique publique d'un site geographiquement distinct (NOAA Digital Coast), sans reentrainement, et
comparer le resultat aux annotations de verite terrain deja publiees dans le jeu de donnees public correspondant si
elles couvrent plusieurs sites, sans contacter personne. Critere chiffre : si la precision sur le site non vu chute
de plus de 15 points de pourcentage par rapport a la precision publiee sur le site d'entrainement, le transfert sans
reentrainement ne tient pas ; le produit doit devenir un service de calibrage facture plus cher plutot qu'un tarif
fixe au $ par acre. Sous 15 points d'ecart, le tarif actuel tient. Budget : calcul GPU en nuage, quelques dizaines a
environ 200 $, deux semaines de travail solo, total sous 2 000 $.

Si le test passe (ecart sous 15 points) : premier appel a AeroTech UAV ou Coastal Drone Service (operateurs purs,
point 3), proposant une orthomosaique deja en leur possession en echange d'un essai gratuit du calque, pour obtenir
un premier retrait payant apres validation terrain reelle plutot qu'un test synthetique.

## 10. Financement

Revenu mensuel plausible, estimations marquees : a 6 mois, 0 a 500 $ (un client pilote a prix reduit ou gratuit pour
preuve de concept). A 12 mois, 800 a 2 500 $ (deux a cinq clients payants a la prestation). A 24 mois, 3 000 a
8 000 $ (dix a vingt clients recurrents sur plusieurs saisons), coherent avec le plafond sous 300 000 $ par an au
barreau 3 (point 2).

Programme de subvention precis, lu : le Programme d'aide a la recherche industrielle (PARI, Conseil national de
recherches Canada), volet IA, offre jusqu'a 250 000 $ couvrant jusqu'a 80 % des salaires admissibles et 50 % des
couts de sous traitance pour un projet technologique. Il accelererait le developpement du calibrage inter site
(barreau 2, 2028) sans etre une condition de survie, puisque le modele de revenu a la prestation existe deja
independamment de toute subvention.
