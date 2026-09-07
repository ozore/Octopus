# Notes de generation, lot drone restauration

## Perimetre lu
Uniquement : BRIEF-GENERATION.md, MEMOIRE-MORTS.md, generation/drone-restauration/lignes.md. Rien d'autre du depot,
en particulier pas le registre bureaux-etudes/dossier.md source des lignes (interdit par le brief pour ce role).

## Budget WebSearch : 4 sur 4 utilises au Tour 1
1. "drone UAV orthomosaic deep learning classification seagrass marsh vegetation cover machine learning 2023 2024"
   -> sources pour herbier et marais (point 4 des deux idees).
2. "environmental consulting firm coastal wetland mitigation monitoring drone photogrammetry vegetation cover
   mapping cost per acre" -> trois acheteurs nommes (HANA Resources, UltraSystems Environmental, AquaTech Eco
   Consultants) et fourchette de prix par acre pour ancrer le point 7.
3. "oyster reef intertidal drone aerial imagery classification machine learning cover mapping restoration" -> source
   pour le recif d'huitres (OysterNet, ScienceDirect 2024), quatrieme habitat.
4. "startup software automated habitat cover classification drone imagery service environmental consultants
   seagrass marsh oyster 2025 2026" -> verification du pre mortem cause 1 : Thomson Environmental Consultants
   construit un outil interne, non revendu ; aucun vendeur externe trouve.

Le tueur a recherche cote occupant (deux recherches, tueur.md Tour 1) et n'a trouve aucun occupant exact : Esri
generique et satellite, Agisoft sol/vegetation/batiment, OpenDroneMap sans classification, Allen Coral Atlas,
Global Mangrove Watch, KelpWatch chacun mono habitat.

## Budget WebSearch Tour 2 : 1 sur 1 utilise (consigne du coordinateur pour ce tour, distincte du plafond de 4 du
tour 1)
5. "cross site transferability generalization drone UAV habitat classification model accuracy different site
   eelgrass seagrass salt marsh without retraining" -> confirme la faille numero 2 signalee par le tueur : une etude
   d'imagerie hyperspectrale de cartographie cotiere dit explicitement que la transferabilite entre sites n'a pas
   ete evaluee et recommande de la tester sur des jeux de donnees independants ; aucun transfert reussi sans
   reentrainement trouve pour l'un des quatre habitats. Utilise pour etiqueter "supposee" le transfert inter site
   au Tour 2 et concevoir le test a 2 000 $ demande par le coordinateur.

Budget epuise pour ce tour. Aucune recherche n'a pu etre consacree a un annuaire direct de cabinets (population,
point 6) ; le Tour 2 utilise une borne basse assumee (au moins 25) plutot qu'un chiffre lu, faiblesse explicite dans
le dossier.

## Point faible assume (mis a jour au Tour 2)
Le calcul de population du Tour 1, derive du chiffre Ecobot (150 000 rapports 404), a ete abandonne : le tueur a
montre que la grande majorite de ces rapports ne comporte ni drone ni photogrammetrie, ce n'etait pas la bonne
population. Le Tour 2 le remplace par une borne basse assumee d'au moins 25 cabinets (trois nommes et verifies dans
trois regions distinctes, plus le raisonnement sur 23 Etats cotiers americains), explicitement etiquetee comme une
borne, pas un annuaire. C'est toujours le point le plus faible du dossier.

## Distinction avec le territoire deja juge
Consigne recue au Tour 1 : le suivi de compensation cotiere est deja occupe par Ecobot (flux de conformite, pas
l'image) et la video benthique pour bureaux d'etudes a deja ete jugee. L'idee fusionnee du Tour 2 reste volontairement
aerienne (orthomosaique drone, jamais de video sous marine), multi habitats (herbier, marais, varech, recif
d'huitres sur une meme image), et vendue par deux canaux, tous deux comme une capacite revendable : ligne ajoutee sur
la facture du sous traitant (ligne 10), ou abonnement direct au cabinet dont le livrable change de nature
(precision validee contre le terrain, absente de la delineation manuelle), pas une productivite gardee par qui
facture deja l'heure.

## Fusion au Tour 2
Le tueur a traite les deux idees du Tour 1 (Recouvrement, Memoire de site) avec le meme paysage d'occupants, les
memes acheteurs et les memes causes de mort. Elles sont fusionnees en une seule idee vendue par deux canaux de prix,
suivant la consigne du coordinateur de ne pas maintenir deux idees qui ne sont qu'une offre et un prix.

## Cause de mort la plus redoutee (inchangee au Tour 2, confirmee non realisee par le tueur)
Cause 1 de la memoire (occupant finance fait deja le barreau 1) : Agisoft ajoute la classification a sa licence deja
installee chez les trois acheteurs nommes, ou Esri ajoute des classes cotieres fines a Image Analyst et Living Atlas,
infrastructure qu'il possede deja. Verifie non realise aujourd'hui par deux recherches independantes (tour 1 et
tueur, 7 septembre 2026), mais c'est le risque qui reviendra en premier si l'idee marche, precisement parce que ces
deux editeurs controlent deja l'outil de traitement du client.
