# Journal du tueur, lot drone restauration

Date : 7 septembre 2026.

## Lecture imposee
1. /home/user/Octopus/ocean-6/BRIEF-TUEUR.md, en entier.
2. /home/user/Octopus/ocean-6/MEMOIRE-MORTS.md, en entier (dix causes de mort, carte des occupants).
3. /home/user/Octopus/ocean-6/generation/drone-restauration/dossier.md, Tour 1 (deux idees).
4. /home/user/Octopus/ocean-6/generation/drone-restauration/lignes.md (lignes 2 et 10 du registre bureaux etudes).
Rien d'autre du depot n'a ete lu, conformement a la consigne recue pour ce tour.

## Recherches (4 WebSearch, 2 par idee comme demande dans la consigne recue, plus stricte que les 3
autorisees par le brief du tueur)
1. "Esri ArcGIS Pro deep learning model wetland habitat classification drone orthomosaic 2026"
2. "Agisoft Metashape species classification habitat feature 2026"
3. "Esri ArcGIS Living Atlas pretrained land cover model wetland classes seagrass marsh mangrove coastal habitat"
4. "OpenDroneMap Allen Coral Atlas Global Mangrove Watch KelpWatch open segmentation model eelgrass marsh drone"

Ces quatre recherches couvrent, pour les deux idees a la fois (memes acheteurs, meme paysage d'occupants explicite
dans le dossier), les trois etapes imposees : ce que l'acheteur nomme paie deja (Esri, Agisoft), le gratuit et le
public (OpenDroneMap, Allen Coral Atlas, Global Mangrove Watch, KelpWatch), et la cause numero 1 du pre mortem
(Agisoft ou Esri livrent ils deja la classification d'habitat, verifie non).

## Constat principal
Aucun occupant commercial ou gratuit trouve ne fait la tache exacte : classification multi habitat cotier (herbier,
marais, varech, recif d'huitres) sur orthomosaique drone, vendue a un cabinet d'etudes prive. Esri a l'infrastructure
(Image Analyst, Living Atlas) mais des classes generiques et une resolution satellite ou 1 metre, pas les classes
fines a l'echelle drone. Agisoft classe le nuage de points en six classes generiques (Ground, Vegetation, Building,
Road, Car, Man made), confirme la ligne 2 du registre. Les outils gratuits sont chacun limites a un seul habitat et
au satellite (Allen Coral Atlas, Global Mangrove Watch, KelpWatch) ou ne font que la photogrammetrie sans
classification (OpenDroneMap). Verdict : les deux idees restent VIVANTES sur la cause 1.

## Faiblesses trouvees sans recherche supplementaire, sur demande explicite
- Population (cause 6) : le calcul du dossier (150 000 rapports Ecobot / 30 a 50 par cabinet = plusieurs centaines
  de cabinets) ne precise pas si le taux est annuel ou cumule, ecart possible d'un facteur dix ; de plus les 150 000
  rapports couvrent tout permis de zone humide, dont la plupart sans drone ni photogrammetrie cotiere.
- Capacite (cause 5) : les quatre publications citees sont datees et verifiees, mais aucune ne documente le
  transfert d'un modele entraine sur un site vers un autre site, faiblesse connue de cette litterature.
- Question 8 : le mecanisme de retention (comparabilite reglementaire) est plus faible que presente puisque
  l'orthomosaique brute reste chez le client, pas chez le fondateur ; un concurrent peut reclasser l'historique en
  un lot et restaurer la comparabilite, donc le cout de sortie est ponctuel, pas structurel.
- Cause 2, sur demande explicite de la consigne recue : je n'ai pas pu comparer directement contre les verdicts qui
  ont deja tue "le suivi de compensation cotiere" et "la segmentation d'images pour bureaux d'etudes", ces deux
  familles n'etant pas nommees dans MEMOIRE-MORTS.md tel que lu et la consigne interdisant de lire d'autres
  dossiers. J'ai signale le risque de silhouette partagee sans pouvoir le trancher ; a verifier au tour 2.
- Interdits (cause 9) : plus de risque pour l'idee 2 (abonnement vendu directement au cabinet qui possede deja
  Agisoft) que pour l'idee 1 (ligne ajoutee a la facture du sous traitant qui ne fait aujourd'hui aucune analyse
  ecologique). Le dossier n'a pas verifie si les trois cabinets nommes facturent deja a l'heure une delineation
  manuelle d'habitat en SIG, ce qui rendrait l'abonnement une automatisation d'une tache facturee, motif exact de
  la cause 9.

## Fichiers ecrits
- /home/user/Octopus/ocean-6/generation/drone-restauration/tueur.md, section Tour 1.
- /home/user/Octopus/ocean-6/generation/drone-restauration/claude-tueur.md (ce fichier).

## Blocages
Aucun. Aucune question posee, conformement a la consigne.
