# Dossier drone restauration

Date : 7 septembre 2026. Lot source : lignes.md (registre bureaux etudes, lignes 1, 2, 10, 15).

## Tour 1

### Idee 1 : Recouvrement (calque de couverture pour sous traitants drone)

1. Ligne d'origine : ligne 10, cabinets sous traitant un survol drone pour releve de vegetation ou d'erosion cotiere,
   150 a 600 $/heure ou 10 a 25 $/acre, a l'operateur de drone independant.
2. Le trou : la ligne dit explicitement que la prestation "ne couvre pas le post traitement photogrammetrique (ligne
   2) ni l'analyse ecologique des images". L'operateur livre des photos et une orthomosaique, jamais un pourcentage
   de couverture par habitat. La ligne 2 (Agisoft) confirme : l'outil "ne fait pas la classification automatique des
   especes ni l'acquisition".
3. Le produit, en une phrase : un service qui prend l'orthomosaique deja livree par le sous traitant drone et rend
   une carte de couverture par habitat (herbier, marais, varech, recif d'huitres) avec le pourcentage par site, que
   le sous traitant revend a son client sous sa propre facture, en plus de la photo brute.
4. Ce que fait l'IA, dates verifiees par recherche du 7 septembre 2026 :
   - Herbier : classification d'eelgrass intertidal par apprentissage profond sur images drone, Remote Sensing 2023,
     doi 10.3390/rs15092321. Verifiee (source).
   - Marais : identification de vegetation de marais salant par UAV multispectral et deep learning, Drones 2024,
     doi 10.3390/drones9040235. Verifiee (source).
   - Varech : protocole de cartographie d'habitats cotiers (cas d'etude herbier, algue, varech) par drone et machine
     learning, ScienceDirect/PMC 2024. Verifiee (source).
   - Recif d'huitres : cartographie de la morphologie de recifs d'huitres intertidaux par photogrammetrie UAV et deep
     learning, ScienceDirect 2024 ; reseau OysterNet, ecart de 8% entre delimitation manuelle et automatique.
     Verifiee (source).
5. Acheteur barreau 1, trois entreprises privees nommees, verifiees par recherche : HANA Resources (programme de
   resilience cotiere aux Outer Banks, drones pour cartographier vegetation et rivage), UltraSystems Environmental
   Inc (Californie du Sud, drones pour le conseil environnemental depuis plus de 28 ans), AquaTech Eco Consultants
   (drones pour cartographie de vegetation et gestion de zones humides). Elles paient deja les lignes 2 et 10
   (licence Agisoft, prestation drone). Elles achetent a une societe d'une personne plutot qu'a l'occupant le plus
   proche (Thomson Environmental Consultants, Royaume Uni, qui a construit son propre outil de reconnaissance
   d'habitat en interne, non revendu) parce que ce dernier n'est pas a vendre et qu'elles n'ont ni la donnee
   d'entrainement ni l'ingenieur pour reproduire l'outil en interne pour une poignee de mandats par an.
6. Population : au moins 200 dans le monde. Estimation construite, methode transparente : Ecobot (ligne 1) revendique
   150 000 rapports produits par ses clients cabinets AEC et ressources naturelles au 31 juillet 2024 (memoire). A
   raison d'environ 30 a 50 rapports par cabinet sur la periode, cela pointe vers plusieurs centaines de cabinets
   actifs aux Etats Unis seuls, sans compter les sous traitants drone (ligne 10, marche fragmente non chiffre) ni les
   cabinets hors Etats Unis. Estimation, pas un chiffre lu directement ; c'est le point le plus faible du dossier.
7. Prix vise : 5 a 12 $/acre en supplement du 10 a 25 $/acre deja facture (ligne 10), ou 150 a 400 $ par
   orthomosaique livree, empoche par le sous traitant qui refacture au cabinet commanditaire avec majoration.
8. Question 8 par mecanisme :
   - Qui detient la donnee aujourd'hui : personne. La ligne 10 dit que l'image livree n'est jamais analysee sur le
     plan ecologique ; quand un cabinet le fait a la main, la couche reste un fichier GIS isole dans un dossier de
     projet, jamais comparee d'une annee sur l'autre avec une methode fixe.
   - Pourquoi le fondateur la detiendrait : les criteres de reussite d'un plan de suivi de restauration ou de
     compensation (USACE) comparent la couverture annee N a l'annee de reference avec une methode constante. Changer
     de prestataire de classification en cours de suivi casse la comparabilite que le regulateur exige ; le cabinet a
     donc interet reglementaire, pas seulement contractuel, a garder le meme pipeline pendant toute la duree du suivi.
   - Ce qui rend le depart couteux en annee 3 : le fondateur detient alors trois annees de calques classes avec un
     modele calibre par site. Changer de fournisseur oblige a reclasser tout l'historique avec une nouvelle methode
     pour garder une courbe de tendance valide face au regulateur, sur un plan qui dure typiquement 5 a 10 ans.
9. Occupant le plus proche : aucun vendeur commercial ne revend cette classification aerienne multi habitats a des
   cabinets tiers (recherche du 7 septembre 2026). Thomson Environmental Consultants a construit un outil interne
   non revendu. KelpWatch suit le varech par satellite, gratuit, un seul habitat, pas de drone. BIIGLE, CoralNet,
   ReefCloud, FathomNet (memoire) traitent de l'image sous marine ou de plongee, pas d'orthomosaique aerienne
   d'estran.
10. Pre mortem : en 2031, la societe est morte. Cause redoutee numero 1 (memoire, cause 1) : un occupant finance fait
    deja le barreau 1. Verification faite le 7 septembre 2026 : aucun produit commercial de ce type n'existe
    aujourd'hui ; le risque est qu'un cabinet comme Thomson, ou un auteur des publications citees au point 4,
    commercialise son outil interne ou l'ouvre en gratuit avant que le fondateur n'ait des clients recurrents. Cette
    cause n'est pas realisee aujourd'hui mais elle est la plus plausible a moyen terme.
11. Les dix causes de mort :
    1. Pas realisee aujourd'hui (verifiee ci dessus) ; c'est la cause la plus redoutee pour l'avenir, voir point 10.
    2. Point de depart prive (facture reelle, ligne 10), pas un texte public ni une tendance ; ne s'applique pas.
    3. Les trois acheteurs nommes facturent deja leurs clients pour la ligne 10 et la ligne 2 ; budget reel, pas
       benevole ni subvention ; ne s'applique pas.
    4. La preuve accuse la reussite du site restaure, jamais le sous traitant qui tient la camera ; ne s'applique pas.
    5. Chaque habitat a une publication datee au point 4, aucune n'est promue en "impossible avant" sans date ; ne
       s'applique pas.
    6. Population estimee, pas chiffree directement (voir point 6) ; s'applique partiellement, faiblesse assumee.
    7. Le mecanisme du point 8 est une obligation reglementaire de methode constante, pas une masse critique ; ne
       s'applique pas.
    8. Le produit est un calque livre, pas un agent qui redige le rapport du regulateur a la place du cabinet ; ne
       s'applique pas.
    9. Vendu au sous traitant qui facture a l'heure, mais comme une ligne nouvelle refacturee au client final, jamais
       comme un gain de temps garde pour lui seul ; ne s'applique pas si le contrat impose la revente en ligne
       distincte, a verifier au tour 2.
    10. Les trois acheteurs sont des cabinets prives, aucun marche public ni grand compte ; ne s'applique pas.

### Idee 2 : Memoire de site (abonnement de suivi pluriannuel pour cabinets equipes d'Agisoft)

1. Ligne d'origine : ligne 2, cabinets faisant de la photogrammetrie drone pour le suivi cotier ou de restauration,
   licence Agisoft Metashape Standard 179 $ ou Professionnel 3 499 $, licence perpetuelle, a Agisoft LLC.
2. Le trou : la ligne dit que l'outil "ne fait pas la classification automatique des especes" et n'inclut "pas de
   sauvegarde en nuage". Le cabinet traite lui meme ses orthomosaiques en interne mais n'a ni classification ni
   historique centralise d'un site d'une annee sur l'autre ; chaque suivi repart d'un fichier GIS isole.
3. Le produit, en une phrase : un abonnement qui recoit l'orthomosaique deja produite par le cabinet dans son propre
   Agisoft, classe la couverture par habitat, et garde l'historique annuel du site pour generer directement la
   courbe de tendance demandee par le suivi de compensation ou de restauration.
4. Ce que fait l'IA : memes quatre publications datees qu'au point 4 de l'idee 1 (herbier Remote Sensing 2023,
   marais Drones 2024, varech protocole ScienceDirect/PMC 2024, recif d'huitres ScienceDirect 2024 et OysterNet).
   Verifiee (source) pour les quatre habitats.
5. Acheteur barreau 1 : memes trois entreprises qu'a l'idee 1 (HANA Resources, UltraSystems Environmental, AquaTech
   Eco Consultants), qui possedent deja une licence Agisoft (ligne 2) et traitent leurs propres vols. Elles
   achetent a une societe d'une personne plutot qu'a Agisoft (qui ne fait pas de classification) ou qu'a Thomson
   (outil interne non revendu) parce qu'un abonnement leur coute moins qu'embaucher un ingenieur en apprentissage
   automatique pour un volume de quelques sites par an.
6. Population : meme base qu'a l'idee 1, au moins 200 dans le monde, meme methode et meme faiblesse assumee
   (estimation construite sur le chiffre Ecobot de la memoire, pas un compte direct).
7. Prix vise : abonnement 40 a 90 $/mois par site suivi, a comparer aux 19 a 125 $/mois d'Ecobot (ligne 1) pour la
   partie formulaire, et aux 179 a 3 499 $ payes une fois pour Agisoft (ligne 2) qui ne fait pas cette tache.
8. Question 8 par mecanisme :
   - Qui detient la donnee aujourd'hui : le cabinet lui meme, mais sous forme de fichiers GIS non centralises et non
     classes avec une methode constante ; personne ne detient une serie comparable d'une annee sur l'autre.
   - Pourquoi le fondateur la detiendrait : le plan de suivi (USACE, compensation ou restauration) impose une methode
     constante sur toute sa duree ; le cabinet signe un abonnement plutot qu'un achat ponctuel precisement parce que
     la comparabilite reglementaire depend de la continuite du meme classificateur d'une annee sur l'autre.
   - Ce qui rend le depart couteux en annee 3 : trois annees de calques et de courbes de tendance archivees chez le
     fondateur ; un depart oblige le cabinet a reclasser tout l'historique avec un autre outil pour ne pas casser la
     courbe face au regulateur, sur un plan qui court encore 2 a 7 ans.
9. Occupant le plus proche : identique a l'idee 1 (aucun revendeur externe, Thomson en interne, KelpWatch limite au
   varech et au satellite, familles BIIGLE et CoralNet limitees a l'image sous marine).
10. Pre mortem : en 2031, la societe est morte. Cause redoutee numero 1, identique a l'idee 1 : un occupant finance
    ou Agisoft lui meme ajoute la classification en option. Verification du 7 septembre 2026 : la fiche produit
    Agisoft lue en ligne (ligne 2) ne mentionne toujours pas de classification d'especes ; ce n'est pas realise
    aujourd'hui, mais un editeur avec 3 499 $ de licence Professionnel et une base installee large est le risque le
    plus serieux si l'idee marche.
11. Les dix causes de mort :
    1. Pas realisee aujourd'hui (verifiee ci dessus, point 10) ; cause la plus redoutee, risque porte par Agisoft
       lui meme plutot que par un occupant deja present.
    2. Point de depart prive (licence reelle payee, ligne 2) ; ne s'applique pas.
    3. Meme budget reel que l'idee 1 (les trois cabinets facturent deja des mandats prives) ; ne s'applique pas.
    4. La preuve porte sur l'etat du site, jamais sur le cabinet qui a pris la photo ; ne s'applique pas.
    5. Memes quatre publications datees qu'a l'idee 1, aucune capacite supposee promue en fait ; ne s'applique pas.
    6. Population estimee non chiffree directement ; s'applique partiellement, faiblesse assumee, identique a l'idee
       1.
    7. Le mecanisme est la continuite reglementaire de methode, pas une masse critique ; ne s'applique pas.
    8. Le produit est un calque et une courbe archivee, pas un agent qui redige le rapport du regulateur ; ne
       s'applique pas.
    9. Vendu en abonnement direct au cabinet pour un livrable qu'il ne pouvait pas produire seul (classification
       constante et archivage pluriannuel), pas un gain de temps sur une tache qu'il facturait deja a l'heure ; ne
       s'applique pas.
    10. Meme trois cabinets prives qu'a l'idee 1, aucun marche public ni grand compte ; ne s'applique pas.

## Tour 2

Verdict du tueur sur le Tour 1 lu (tueur.md, section Tour 1) : les deux idees sont VIVANTES, aucun occupant exact
trouve (Esri classe generique et satellite, Agisoft classe sol/vegetation/batiment, OpenDroneMap sans
classification, Allen Coral Atlas et Global Mangrove Watch et KelpWatch mono habitat). Le tueur releve trois failles
communes aux deux idees (population fragile d'un facteur dix, aucune preuve de transfert inter site, la question 8
qui suppose que l'orthomosaique brute reste chez le client) et une faille propre a Memoire de site (cause 9, risque
que l'abonnement automatise une delineation deja facturee a l'heure). Les deux idees partageaient le meme paysage
d'occupants, le meme couple d'acheteurs et le meme mecanisme defaillant : elles sont fusionnees en une seule idee,
vendue par deux canaux (le sous traitant drone ou le cabinet lui meme), plutot que deux idees separees pour la meme
offre.

### Idee fusionnee : Recouvrement (classification aerienne multi habitats, vendue par le sous traitant drone ou en
abonnement direct au cabinet)

1. Ligne d'origine : ligne 10 (prestation drone, 150 a 600 $/heure ou 10 a 25 $/acre, a l'operateur de drone
   independant) comme canal principal ; ligne 2 (licence Agisoft, 179 a 3 499 $, a Agisoft LLC) comme deuxieme
   canal quand le cabinet traite lui meme ses vols et prefere un abonnement direct plutot qu'une ligne ajoutee par
   son sous traitant.
2. Le trou : verifie deux fois par le tueur avec deux recherches independantes du dossier initial. La ligne 10 dit
   que la prestation "ne couvre pas... l'analyse ecologique des images" ; la ligne 2 dit qu'Agisoft "ne fait pas la
   classification automatique des especes". Le tueur a confirme cote editeur : la classification "semantique"
   d'Agisoft se limite a Ground, Vegetation, Building, Road, Car, Man made, aucune classe d'habitat ni d'espece.
3. Le produit, en une phrase : un calque de couverture par habitat (herbier, marais, varech, recif d'huitres), avec
   pourcentage par site, calcule sur l'orthomosaique deja produite par le sous traitant ou le cabinet, livre soit en
   ligne ajoutee sur la facture du sous traitant, soit en abonnement direct au cabinet avec historique pluriannuel.
4. Ce que fait l'IA, quatre publications datees, une par habitat, deja verifiees au tour 1 et non contestees par le
   tueur : herbier, Remote Sensing 2023, doi 10.3390/rs15092321 ; marais, Drones 2024, doi 10.3390/drones9040235 ;
   varech, protocole ScienceDirect/PMC 2024 ; recif d'huitres, ScienceDirect 2024 et OysterNet. Verifiee (source)
   pour la classification dans un site donne, avec une reserve nouvelle au point 8 sur le transfert entre sites.
5. Acheteur barreau 1, trois entreprises deja verifiees par recherche et non contestees par le tueur : HANA
   Resources (Outer Banks, programme de resilience cotiere par drone), UltraSystems Environmental Inc (Californie
   du Sud, drones pour le conseil environnemental depuis plus de 28 ans), AquaTech Eco Consultants (drones pour
   vegetation et zones humides). Elles achetent a une societe d'une personne plutot qu'a Esri (classes generiques,
   satellite ou 1 metre) ou Agisoft (aucune classe d'habitat) parce que ces deux editeurs ne vendent pas la classe
   fine demandee, et plutot qu'a Thomson Environmental Consultants (outil interne, non revendu) parce qu'elles n'ont
   ni la donnee d'entrainement ni l'ecologue en apprentissage automatique pour reproduire un outil interne pour un
   volume de quelques sites par an.
6. Population, correction demandee par le tueur (facteur dix non resolu) : borne basse honnete plutot qu'un chiffre
   derive. Le calcul Ecobot du tour 1 est abandonne, le tueur ayant montre que 150 000 rapports 404 couvrent tout
   permis de zone humide, dont la grande majorite sans drone ni photogrammetrie : ce n'etait pas la bonne population.
   Nouvelle borne : au moins 25 cabinets, en s'appuyant sur trois faits verifies plutot que sur un annuaire complet
   (non consulte, faute de budget de recherche restant ce tour) : (a) trois cabinets sont deja nommes et confirmes
   dans trois regions cotieres distinctes des Etats Unis (Caroline du Nord, Californie, une troisieme non precisee
   par la source) ; (b) la ligne 10 elle meme cite une fourchette de prix "Lu (2026)" construite a partir d'un
   marche assez large pour publier un taux horaire par type de prestation, comme la ligne 15 publie un taux par
   percentile sur 57 profils ; (c) les Etats Unis comptent 23 Etats cotiers (connaissance generale, NOAA), et il
   suffit d'un seul cabinet de ce type par Etat cotier pour depasser 25. Ce n'est pas un annuaire direct, c'est une
   borne assumee comme faible : un annuaire (listes de consultants agrees pour le suivi de compensation tenues par
   les districts USACE, ou repertoires des sections locales de l'ACEC) reste a consulter si un tour suivant l'exige.
7. Prix vise : 5 a 12 $/acre en supplement de la ligne 10, ou 40 a 90 $/mois par site en abonnement direct au
   cabinet (a comparer aux 19 a 125 $/mois d'Ecobot pour le formulaire, et aux 179 a 3 499 $ payes une fois pour
   Agisoft qui ne fait pas cette tache).
8. Question 8 par mecanisme, reformule apres la critique du tueur (l'orthomosaique brute reste chez le client, donc
   un concurrent peut en theorie reclasser tout l'historique en un lot) :
   - Qui detient la donnee aujourd'hui : le client detient l'orthomosaique brute et le calque livre. Il ne detient
     pas les points de verification terrain annotes (quadrats, transects photographies au sol) qui servent a calibrer
     et a valider la precision du modele pour son site precis, ni le modele ajuste avec ce calibrage. Ce sont ces
     deux elements, pas l'image, que le fondateur garde.
   - Pourquoi il laisserait le fondateur les detenir : un rapport de suivi reglementaire qui affirme un pourcentage
     de couverture doit, pour etre defendable devant le regulateur, etre accompagne d'une precision validee contre
     un controle terrain independant (pratique standard des publications citees au point 4, qui rapportent toutes
     un taux de precision mesure contre le terrain). Le client n'a ni le temps ni le personnel de terrain pour
     reproduire cette validation lui meme a chaque annee ; il la delegue au fondateur en echange de son prix.
   - Ce qui rend le depart couteux en annee 3 : un concurrent peut reclasser l'orthomosaique brute en un lot, comme
     l'a note le tueur, mais il ne peut pas reproduire instantanement les points de verification terrain valides des
     annees precedentes ni prouver au regulateur que sa nouvelle classification est calibree de la meme facon sur ce
     site precis ; il doit refaire une campagne de terrain de validation, ce qui a un cout reel et un delai, pas
     seulement un reclassement de bureau. Correction assumee : cet actif est plus etroit que ce que le tour 1
     affirmait (ce n'est pas "le pipeline" en general, c'est le couple annotations validees plus courbe de precision
     par site), et il est nul pour un client qui n'a jamais eu besoin de precision documentee pour son regulateur ;
     le produit doit donc cibler d'abord les sites sous plan de suivi formel (USACE, compensation), pas tout survol.
9. Occupant le plus proche : confirme par le tueur, aucun vendeur commercial ne revend cette classification aerienne
   multi habitats a des cabinets tiers. Esri (classes generiques, satellite ou 1 metre), Agisoft (aucune classe
   d'habitat), OpenDroneMap (aucune classification), Allen Coral Atlas et Global Mangrove Watch et KelpWatch (chacun
   un seul habitat, par satellite). Thomson Environmental Consultants garde un outil interne non revendu.
10. Pre mortem : en 2031, la societe est morte. Cause redoutee numero 1 : Agisoft, deja installe chez les trois
    acheteurs nommes, ou Esri, qui possede deja l'infrastructure Image Analyst et Living Atlas pour ajouter des
    classes cotieres fines, decide d'ajouter la classification d'habitat a son propre produit. Verification faite
    deux fois (tour 1 et tueur, deux recherches independantes le 7 septembre 2026) : ni l'un ni l'autre ne le fait
    aujourd'hui. Le risque n'est pas realise mais reste le plus serieux parce que ces deux editeurs controlent deja
    l'outil de traitement du client.
11. Les dix causes de mort :
    1. Verifiee deux fois, non realisee aujourd'hui (voir point 10) ; reste la cause la plus redoutee pour l'avenir.
    2. Point de depart prive (factures reelles, lignes 2 et 10), pas un texte public ni une obligation ; ne
       s'applique pas.
    3. Les trois acheteurs nommes facturent deja leurs clients pour les lignes 2 et 10 ; budget reel ; ne s'applique
       pas.
    4. La preuve porte sur l'etat du site restaure ou suivi, jamais sur le sous traitant ou le cabinet qui tient la
       camera ; ne s'applique pas.
    5. S'applique en partie, corrige au point 4 et au point 8 : la classification dans un site donne est verifiee
       (source datee par habitat), mais le transfert d'un modele entraine vers un nouveau site sans reentrainement
       est supposee, pas verifiee. Recherche du tour 2 (7 septembre 2026) : une etude d'imagerie hyperspectrale de
       cartographie cotiere note explicitement que "the transferability of the reference spectra and classification
       was not evaluated at other locations" et recommande de le tester sur des jeux de donnees independants ; aucune
       publication trouvee ne documente un transfert reussi sans reentrainement pour l'un des quatre habitats.
       Etiquette : supposee. Test a 2 000 $ qui verifierait la capacite : appliquer un modele deja entraine (par
       exemple le modele herbier de Remote Sensing 2023) a un deuxieme site geographiquement distinct sans
       reentrainement, comparer le resultat a des quadrats de controle releves sur le terrain le meme jour (un vol
       drone plus une demi journee de verification terrain, budget proche de 2 000 $ en comptant le taux plongeur ou
       ecologue de la ligne 15 a la journee) ; le test dirait si un calibrage leger suffit (le prix au $/acre tient)
       ou si un reentrainement complet est necessaire par site (le prix doit monter ou le produit doit devenir un
       service de calibrage plutot qu'un tarif au $/acre).
    6. S'applique en partie, corrigee au point 6 : le calcul derive d'Ecobot du tour 1 est abandonne (mauvaise
       population, le tueur l'a montre) ; remplace par une borne basse assumee d'au moins 25 cabinets, pas un
       annuaire direct verifie. Faiblesse assumee, a resoudre par un annuaire au tour suivant si necessaire.
    7. Le mecanisme du point 8 repose sur la validation terrain documentee exigee par un plan de suivi formel, pas
       sur une masse critique d'utilisateurs ; ne s'applique pas.
    8. Le produit est un calque et une courbe de precision livres, jamais un agent qui redige le rapport du
       regulateur a la place du cabinet ; ne s'applique pas.
    9. Corrigee pour le canal abonnement (ex Memoire de site) suite a la critique du tueur : il est suppose, non
       verifie chez les trois acheteurs nommes, qu'un ecologue salarie y delimite deja des habitats a la main dans
       un logiciel SIG et facture ces heures au client final. Si c'est le cas, le produit doit rester une capacite
       nouvelle revendue et non une economie gardee par le cabinet : le cabinet continue de facturer a son client
       une ligne "couverture d'habitat", mais le livrable change de nature, d'une estimation oculaire non
       documentee a un calque accompagne d'une precision validee contre le terrain (point 8), ce que la delineation
       manuelle ne fournissait pas. Si l'enquete du tour suivant montre qu'aucune precision n'est jamais exigee ni
       valorisee par le client final, la cause 9 s'applique pleinement et ce canal doit etre abandonne au profit du
       seul canal sous traitant (ligne 10), qui cree une ligne de facturation neuve plutot que d'automatiser une
       tache deja facturee.
    10. Les trois acheteurs nommes sont des cabinets prives, aucun marche public ni grand compte, confirme par le
        tueur qui n'a rien trouve d'autre ; ne s'applique pas.
