# Tueur, lot drone restauration

Date : 7 septembre 2026. Deux idees recues (Recouvrement, Memoire de site), meme paire d'acheteurs, meme paysage
d'occupants. Au plus 2 WebSearch par idee, comme demande (le brief du tueur en autorise 3, la consigne recue pour ce
tour en autorise 2 : c'est la plus restrictive qui a ete appliquee).

## Tour 1

### Idee 1 : Recouvrement

VIVANTE.

Recherche 1 (ce que l'acheteur nomme paie deja pour classer une orthomosaique) : "Esri ArcGIS Pro deep learning
model wetland habitat classification drone orthomosaic 2026" et "Agisoft Metashape species classification habitat
feature 2026". Trouve : Esri vend, via l'extension ArcGIS Image Analyst (deja payante, deja utilisee par des
cabinets qui font de la teledetection) et l'ArcGIS Living Atlas, des modeles pretrained de couverture du sol. Mais
leurs classes sont generiques (National Land Cover Database ou Corine Land Cover : eau, arbres, sol nu, batise,
culture) et leur resolution est satellite ou aerienne large echelle (Landsat, Sentinel 2, ou au mieux imagerie
nationale a 1 metre), jamais les classes fines demandees (herbier contre marais contre varech contre recif
d'huitres) sur une orthomosaique drone centimetrique. ArcGIS Image Analyst permet en revanche a un cabinet
d'entrainer lui meme son propre modele avec le Training Samples Manager : c'est exactement ce que fait Thomson
Environmental Consultants en interne (dossier, point 5). Cote Agisoft, la classification "semantique" existante ne
fait que Ground, Vegetation, Building, Road, Car, Man made : confirme mot pour mot ce que dit la ligne 2 du registre,
aucune classe d'habitat ou d'espece.

Recherche 2 (le gratuit et le public) : "OpenDroneMap Allen Coral Atlas Global Mangrove Watch KelpWatch open
segmentation model eelgrass marsh drone". Trouve : OpenDroneMap ne fait que la photogrammetrie, comme Agisoft, pas
de classification. Allen Coral Atlas classe le substrat corallien par satellite a 5 metres, recif seulement, pas de
drone. Global Mangrove Watch suit la mangrove par satellite, un seul habitat. KelpWatch suit le varech par satellite
(deja note dans le dossier). Aucun de ces quatre occupe le barreau 1 tel que decrit : drone, multi habitat, vendu a
un cabinet prive.

Cause numero 1 du pre mortem (Agisoft ou Esri livrent ils deja la classification d'habitat) : non, verifie ci
dessus par deux recherches independantes du dossier initial. Le risque reste latent, pas realise : Esri a deja
l'infrastructure (Image Analyst, Living Atlas, pretrained models) pour ajouter des classes cotieres fines s'il le
decide, ce qui est un risque plus serieux que "un concurrent nait" puisque l'editeur controle deja l'outil de
traitement du cabinet.

Causes de mort qui s'appliquent au dela du point 1 : cause 6 (population) s'applique plus fort que ce que le dossier
admet. Le calcul du dossier (150 000 rapports Ecobot, 30 a 50 rapports par cabinet, donc plusieurs centaines de
cabinets) ne precise pas si le taux de 30 a 50 est annuel ou cumule sur la duree du client ; selon l'hypothese, le
nombre de cabinets varie de plusieurs centaines a plusieurs milliers, un ecart d'un facteur dix qui n'est pas
resolu. Plus grave : les 150 000 rapports Ecobot couvrent tout permis de zone humide article 404, dont la
grande majorite ne comporte ni drone ni photogrammetrie ; le sous ensemble reel (cabinets qui font a la fois de la
photogrammetrie drone cotiere et du suivi pluriannuel) est une fraction non chiffree de ce total, probablement bien
en dessous de "plusieurs centaines". Cause 5 (capacite supposee) s'applique en partie : les quatre publications
citees (Remote Sensing 2023 pour l'herbier, Drones 2024 pour le marais, ScienceDirect ou PMC 2024 pour le varech,
ScienceDirect 2024 pour le recif d'huitres) sont datees et verifiees, mais aucune ne documente le transfert d'un
modele entraine sur un site vers un autre site : la litterature de segmentation d'habitat cotier par drone est connue
pour son manque de validation croisee entre sites (turbidite, marnage, capteur different a chaque campagne). Vendre
un service au $ par acre suppose une classification qui marche sans reentrainement sur chaque nouveau site du
client, ce que le dossier ne demontre pas. Question 8 : le mecanisme de retention du dossier (le cabinet reste
parce que changer de classificateur casse la comparabilite reglementaire) est plus faible que presente, puisque
le dossier admet lui meme que l'orthomosaique brute reste chez le sous traitant ou le cabinet, jamais chez le
fondateur. Un concurrent peut donc reclasser tout l'historique en un seul lot avec sa propre methode et restaurer
la comparabilite : le cout de sortie est un reclassement ponctuel facturable, pas un verrou structurel. Interdits :
le sous traitant drone facture deja a l'heure ou a l'acre pour la photo seule (ligne 10) et ne fait aujourd'hui
aucune analyse ecologique ; ajouter la couche de couverture est donc une ligne de revenu nouvelle et non un
raccourci qui reduit des heures deja facturees, ce qui ne declenche pas la cause 9. Ce qui manque au dossier : un
chiffre de population direct plutot que derive d'Ecobot, une preuve de transfert inter site pour au moins un des
quatre habitats, et une reponse a la question du reclassement en lot par un concurrent.

### Idee 2 : Memoire de site

VIVANTE.

Meme recherche 1 et meme recherche 2 que l'idee 1 (paysage d'occupants identique, memes acheteurs, dossier
explicite ce partage). Meme resultat : ni Esri (classes generiques, resolution satellite ou 1 metre, pas les
quatre habitats cotiers a l'echelle drone), ni Agisoft (classification generique du nuage de points, pas
d'espece), ni les quatre outils gratuits (OpenDroneMap sans classification, Allen Coral Atlas et Global Mangrove
Watch et KelpWatch chacun limites a un seul habitat par satellite) n'occupent le barreau 1 d'un abonnement de
classification plus historique pluriannuel branche sur les propres orthomosaiques Agisoft du cabinet.

Cause numero 1 du pre mortem : verifiee comme pour l'idee 1, pas realisee aujourd'hui ; le risque le plus serieux
reste Agisoft lui meme (base installee large, licence deja payee par les trois acheteurs nommes) qui ajouterait la
classification et un historique en nuage a son propre produit, ce que sa fiche produit ne fait pas a ce jour.

Causes de mort au dela du point 1 : cause 6 identique a l'idee 1 (meme faiblesse du chiffre Ecobot, meme
absence de sous ensemble chiffre pour les cabinets qui font drone plus suivi pluriannuel). Cause 5 identique
(meme absence de preuve de transfert inter site sur les quatre publications). Question 8 : le mecanisme est le
meme que l'idee 1 et souffre de la meme faiblesse (l'orthomosaique brute reste au cabinet, donc un concurrent peut
reclasser l'historique en lot). Cause 2 (point de depart public qui revient a chaque passe) : le dossier ancre
l'idee sur une ligne de facturation reelle (licence Agisoft, ligne 2) et non sur un texte ou une obligation, ce qui
la distingue formellement d'un point de depart public. Mais la forme du produit (classifier des images pour un
suivi de conformite cotiere, vendu a un cabinet d'etudes) ressemble par sa silhouette a deux familles deja jugees
selon la consigne recue : le suivi de compensation cotiere et la segmentation d'image pour bureaux d'etudes. Le
dossier ne peut pas etre compare directement a ces verdicts anterieurs, cette memoire ne les nomme pas et la
consigne interdit de lire autre chose que les idees recues ; la difference que le dossier revendique tient a deux
points precis, non a la silhouette generale : le produit est vendu comme une ligne ajoutee sur une facture
existante (l'abonnement vient completer une licence Agisoft deja payee, pas creer un nouveau centre de cout), et
la tache technique (segmentation multi habitat cotier sur drone) est plus etroite qu'une "segmentation d'image"
generique. Cette difference est affirmee par le dossier, pas prouvee contre le motif exact qui a tue les idees
anterieures : a verifier au tour 2 si la memoire ou le generateur peut preciser ce qui a tue ces deux familles.
Interdits : ici le risque de cause 9 est plus reel que pour l'idee 1. Le dossier affirme que le cabinet "ne pouvait
pas produire seul" la classification et l'historique, mais un cabinet qui possede deja Agisoft et un ecologue
salarie peut tres bien deja facturer a son client des heures de delineation manuelle d'habitat dans un logiciel
SIG a partir de son orthomosaique ; si c'est le cas, l'abonnement automatise une tache aujourd'hui facturee a
l'heure au client final, ce qui est exactement le motif de la cause 9. Le dossier ne verifie pas si cette
delineation manuelle facturee existe chez les trois acheteurs nommes. Ce qui manque au dossier : confirmation ou
infirmation de la delineation manuelle facturee a l'heure chez HANA Resources, UltraSystems ou AquaTech ; un
chiffre de population direct ; une preuve de transfert inter site.

## Tour 2

En attente des idees du tour 2.
