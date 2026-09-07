# Journal generateur modelisation-permis

## Lecture, dans l'ordre
1. `/home/user/Octopus/ocean-6/BRIEF-GENERATION.md` en entier.
2. `/home/user/Octopus/ocean-6/MEMOIRE-MORTS.md` en entier (dix causes, carte des occupants).
3. `/home/user/Octopus/ocean-6/generation/modelisation-permis/lignes.md` (lignes 7, 8, 17, 18).
Rien d'autre du depot n'a ete lu, conformement au brief.

## Choix
Une seule idee soumise en Tour 1, nee de la ligne #8 (taux horaire de modelisation hydrodynamique pour
permis marins, 31 a 112 $/heure, MIKE 21 payant contre TELEMAC et Delft3D gratuits mais plus lents en
heures expertes). C'est la ligne que la consigne de l'orchestrateur designait explicitement (« le trou »
demande dans le prompt correspond mot pour mot au contenu de cette ligne). Les lignes 7 (analyste SIG
marin), 17 et 18 (accompagnement et suivi de permis) ont ete lues et considerees mais n'ont pas produit
une deuxieme idee distincte credible dans le budget de recherche disponible ; plutot que forcer une
deuxieme idee faible, une seule idee solide a ete soumise, ce que le gabarit autorise (« une ou deux
idees »).

## Recherches web (budget : 4 maximum au total, tours 1 et 2 confondus)
1. `TELEMAC OR Delft3D calibration validation expert hours coastal engineer job posting` : confirme,
   par des offres d'emploi reelles (Integral Consulting, Arcadis, Stantec, Assystem, Deltares,
   Hourglass Climate), que la mise en place, le calage et la validation de ces logiciels gratuits sont
   des competences distinctes et facturables, donc le trou de la ligne d'origine est reel et documente
   independamment du registre.
2. `machine learning surrogate model calibration hydrodynamic model coastal 2023 2024 2025` : trouve
   les deux publications citees au point 4 de l'idee (surrogate IA pour circulation cotiere, 2024 ;
   calage operationnel automatise en zone cotiere pauvre en donnees, HESS 2025), pour etiqueter la
   capacite IA « vérifiée (source) » plutot que « supposée ».
3. `pre-calibrated hydrodynamic model library subscription coastal permitting sediment plume dispersion
   service` : verifie qu'aucun occupant ne vend deja une bibliotheque ou un abonnement de modeles
   hydrodynamiques pre-cales par site pour le dragage, l'aquaculture ou les permis marins ; sert a la
   fois au point 9 (occupant le plus proche, RPS Group, qui vend l'etude complete et non l'acces loue)
   et au point 10 (verification que la cause de mort numero 1 n'est pas deja realisee aujourd'hui).
Recherches restantes disponibles pour le Tour 2 si l'idee est tuee : 1.

## Verification des dix causes
Chaque cause de `MEMOIRE-MORTS.md` a ete relue une par une contre l'idee soumise ; le detail figure au
point 11 du gabarit dans `dossier.md`. La cause la plus redoutee est la numero 1 (un occupant finance,
en particulier DHI ou Deltares, editeurs de MIKE 21 et Delft3D, integrant une bibliotheque de modeles
cales a leur propre logiciel) ; verifiee comme non realisee aujourd'hui par la recherche 3. La cause la
plus proche du risque reel du brief est la numero 9 (gain de productivite vendu a qui facture l'heure,
puisque les trois acheteurs factureraient eux memes a l'heure ou au projet) ; ecartee parce que le
produit ouvre l'acces a des dossiers que l'acheteur declinait faute de pouvoir se permettre le calage,
plutot que d'accelerer un dossier deja accepte.

## Contraintes de forme respectees
Aucun tiret long ni demi-cadratin utilise. Acronymes definis a la premiere occurrence (BOEM). Date du
dossier : 7 septembre 2026. Aucune question posee.

## Tour 2

Lu `/home/user/Octopus/ocean-6/generation/modelisation-permis/tueur.md`, section Tour 1 : idee VIVANTE,
trois trous a combler.

### Recherche web (derniere du budget de 4, tours 1 et 2 confondus)
`deltares-usa.us "Coastal Hydrodynamic Modeling" OR "Coastal Sediment Modeling" service price` :
confirme que les deux pages a 1 200 $ et 850 $ sont des cours de formation a la suite Delft3D FM
(maillage 1D/2D/3D pour la premiere, transport sedimentaire et module D Morphology pour la seconde),
pas un mandat de modelisation ni un modele deja cale vendu a la demande. Deltares USA n'est donc pas un
occupant du barreau 1 ; le prix vise au tour 1 n'est pas affaibli, ce n'est pas un produit comparable.
Budget de recherche desormais epuise (4 sur 4).

### Traitement des trois trous
1. Deltares USA : traite par la recherche ci dessus, ajoute au point 9 (occupant) et au point 7 (prix)
   du Tour 2 dans `dossier.md`.
2. Cause 5 (precedent regulateur pour un calage automatise) : aucun precedent trouve d'un dossier de
   permis marin approuve sur la base d'un modele explicitement presente comme cale par apprentissage
   automatique ; dit honnetement comme « supposée » au point 4 du Tour 2. Contournement retenu : le
   calage automatise reste un outil interne du fondateur, jamais mentionne dans le dossier depose ; le
   client recoit et depose un dossier de validation classique (comparaison de series mesurees et
   simulees, indicateurs d'ecart usuels), identique dans sa forme a ce qu'un regulateur accepte deja
   aujourd'hui d'un modele cale a la main. La cause 5 est ainsi neutralisee par un choix de produit, pas
   par une promesse d'acceptation future.
3. Interdit du fondateur (pas de donnees de terrain) : traite au point 8 du Tour 2. La ou elles
   existent, les series de maree et de courant de validation viennent des marégraphes permanents de la
   NOAA (National Water Level Observation Network) et des stations de courant PORTS sur les grands
   chenaux et ports deja instrumentes. Pour un site sans donnee publique (frequent pour un chenal de
   dragage secondaire ou une zone d'elevage), c'est le premier client qui finance une campagne de
   mesure locale (profileur de courant ADCP, sous traitee, cout deja courant dans un dossier de permis)
   ; la clause de propriete du modele est etendue a ce jeu de mesures, ce qui transforme un cout repete
   par chaque demandeur en cout paye une fois par le premier. Un site sans donnee publique et sans
   premier client pret a payer reste hors de la population vendable au depart : le dossier le dit
   plutot que de le supposer resolu.

### Ajout retenu hors gabarit strict
Clause d'entiercement (escrow) du maillage, des parametres de calage et des mesures de terrain,
liberee au client si le fondateur cesse son activite, integree a la licence au point 8 du Tour 2, en
reponse a la note de vigilance du tueur sur le precedent SeaDeep (memoire, section B).

### Mise a jour des dix causes
Seule la cause 5 change de statut entre le Tour 1 et le Tour 2 (voir point 11 du Tour 2 dans
`dossier.md`) : de « partiellement applicable » selon le tueur a « ne s'applique plus », neutralisee par
le choix de produit plutot que par une promesse. Les neuf autres causes restent dans l'etat verifie au
Tour 1.
