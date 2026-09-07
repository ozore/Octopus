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

En attente du verdict du tueur sur le Tour 1.
