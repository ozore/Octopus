# Claude-tueur modelisation-permis

Agent : tueur apparie, passe 6, phase 2. Date : 7 septembre 2026.

## Lecture faite
BRIEF-TUEUR.md en entier, MEMOIRE-MORTS.md en entier, puis uniquement dossier.md et lignes.md du
dossier modelisation-permis (idee du tour 1). Rien d'autre du depot n'a ete lu, claude.md du generateur
compris (l'exclusion demandee par le brief).

## Recherches (3 WebSearch au total, ordre impose)
1. « DHI MIKE Cloud OR Deltares Delft3D cloud pre-calibrated OR calibrated regional model subscription
   coastal permit 2026 ». Trouve : DHI vend un abonnement logiciel (module MIKE 21 ou MIKE 3, location
   courte duree, minimum 2 mois) ; pages de service Deltares USA « Coastal Hydrodynamic Modeling
   ($1200) » et « Coastal Sediment Modeling ($850) », non demandees explicitement par le dossier mais
   pertinentes pour la question de l'acheteur nomme.
2. « free calibrated coastal hydrodynamic model NOAA OR Copernicus OR university public regional model
   reuse permit dredging aquaculture ». Trouve : Copernicus Marine Service et NOAA fournissent des
   modeles regionaux et des conditions aux limites gratuites, utilisables en entree d'un modele plus
   fin par « downscaling », pas un modele deja cale a l'echelle d'un site precis.
3. « library of calibrated hydrodynamic models by site subscription DHI OR Deltares rental permit ».
   Trouve : rien qui corresponde a une bibliotheque ou un abonnement de modeles deja cales par site
   revendus a plusieurs clients ; seuls des abonnements logiciels (DHI) et des pages de service au
   mandat (Deltares USA) remontent.

## Verdict
VIVANTE. Voir tueur.md, section Tour 1, pour le detail ligne par ligne.

## Ce qui a pese dans le verdict
La cause numero 1 du pre-mortem (occupant finance deja sur le barreau 1) n'est pas realisee au sens
strict revendique par le dossier : ni DHI ni Deltares ne vendent une bibliotheque de modeles deja cales
par site, reutilisables d'un client a l'autre. Le point le plus proche de tuer l'idee est la page de
service Deltares USA a 850 et 1200 dollars, dont le contenu exact (mandat cale complet ou simple forfait
d'heures) n'est pas verifiable en une recherche et doit etre reprise au tour 2. Le deuxieme point faible,
non couvert par le dossier, est l'interdit du fondateur sans donnees de terrain : le dossier ne dit pas
qui fournit les series de courant mesurees necessaires au calage de chaque nouveau site, hors des
maregraphes NOAA deja en place.

## Ce qui n'a pas ete cherche
Le contenu detaille des pages de service Deltares USA (au dela du titre et du prix affiches dans les
resultats de recherche) ; le budget limite a 3 WebSearch pour cette idee et ce tour est atteint.

## Tour 2

### Lecture faite
Section « Tour 2 » de dossier.md, rien d'autre du depot.

### Recherches (1 WebFetch, 1 WebSearch, budget 2 WebSearch respecte)
1. Lecture directe de deltares-usa.us/service-page/coastal-hydrodynamic-modeling-1200 : confirme une
   formation Delft3D FM (modules autonomes plus trois seances en ligne, mars 2026, licence de cours de
   3 mois, 10 participants maximum, inscriptions closes), pas un mandat de modelisation ni un modele
   deja cale. L'affirmation du generateur (« Deltares vend des cours, pas des modeles ») tient.
2. « coastal calibrated regional ocean model licensed model as a service Oceanum OR Sofar OR Bluecast
   OR Tidetech OR university permit 2026 » : aucun resultat ne montre un tiers vendant un modele
   regional cale en licence pour un dossier de permis marin en 2026 ; seuls des modeles de recherche
   publique (ROMS, CROCO, IOOS) remontent, deja couverts par le tour 1.

### Verdict
MORTE (cause 7, clause de propriete de la campagne ADCP repondue par une condition deguisee en
mecanisme, pour les sites non couverts par NOAA ou PORTS, le coeur de cible revendique par le dossier).
Voir tueur.md, section Tour 2, pour le detail.

### Ce qui a pese dans le verdict
Les deux corrections verifiees par recherche tiennent (Deltares vend des cours, aucun tiers ne loue de
modele regional cale). La troisieme reponse du dossier (campagne ADCP financee par le premier client,
propriete etendue au fondateur, entiercement en cas de fermeture) tient seulement pour les sites deja
couverts par les maregraphes NOAA et les stations PORTS, majoritairement de grands chenaux et ports
amenages. Pour les chenaux de dragage secondaires et les zones d'elevage, la niche que le dossier
revendique comme non servie par l'occupant RPS, la clause demande a un client de financer 20 000 a
40 000 $ sans exclusivite ni remise, pendant que le fondateur revend ensuite le meme jeu de donnees a
un concurrent du meme site ; rien dans le dossier ne montre qu'un cabinet negociant deja ce type de
contrat accepterait ces termes. Le barreau 1 sur ce sous ensemble depend d'un client qui finance une
depense hors de la ligne budgetaire habituelle avant la premiere facture, ce qui reouvre aussi la cause
9 (gain de productivite vendu a qui facture l'heure) pour ce sous ensemble precis.

### Ce qui n'a pas ete cherche
Le detail des contrats types d'entiercement logiciel dans ce secteur et un chiffrage du sous ensemble
de sites deja couverts par NOAA et PORTS parmi les entites nommees au tour 1 ; les deux verifications
demandees etaient sans recherche par consigne du coordinateur.
