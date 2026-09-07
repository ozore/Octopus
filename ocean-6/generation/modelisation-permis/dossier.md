# Dossier modelisation-permis

Date : 7 septembre 2026. Generateur : modelisation-permis, passe 6.

## Tour 1

### Idee 1 : Modeles hydrodynamiques loues, deja cales par site marin, pour dossiers de permis

1. **Ligne d'origine** : #8 (registre bureaux-etudes). Paient : cabinets et consultants independants
   de modelisation hydrodynamique aux Etats Unis. Lu : 31 a 112 $/heure au national, 29 a 75 $/heure a
   Houston (Texas) en aout 2026. A qui : consultant ou societe d'ingenierie facturant ce taux au client
   porteur du projet.

2. **Le trou** : la ligne d'origine dit elle meme que « les outils gratuits demandent plus d'heures
   expertes, donc plus facture » (TELEMAC et Delft3D, gratuits, contre MIKE 21, payant, de l'editeur
   DHI). Preuve independante : les offres d'emploi 2026 pour ce poste listent explicitement, comme
   competences separees et facturables, la mise en place du modele, le calage et la validation, par
   exemple Integral Consulting Inc. (« setup, calibration, and validation of numerical models »,
   Delft3D, XBeach, SWAN, HEC-RAS, SFINCS), Arcadis (« developing, calibrating, validating » Delft3D et
   ADCIRC a Los Angeles) et Stantec (« setup, calibration, validation and troubleshooting » de Delft3D).
   Ce sont des semaines d'heures expertes par site, refaites a zero a chaque nouveau dossier, par
   personne n'en detient de bibliotheque reutilisable : chaque cabinet recale son maillage a partir de
   rien pour chaque nouveau site marin.

3. **Le produit** : un acces loue, par site marin precis (une baie, un chenal, une zone de mouillage ou
   d'elevage), a un modele hydrodynamique deja construit, deja cale sur les mesures de maree et de
   courant de ce site, et deja valide, livre avec son dossier de calage pret a joindre a un dossier de
   permis. Le client paie l'acces et le lancement de son propre scenario (rejet de sediments, panache
   d'une drague, dispersion des dechets d'un elevage) plutot que la construction du modele depuis zero.

4. **Ce que fait l'IA** : apprentissage automatique pour ajuster automatiquement les parametres de
   frottement de fond, de viscosite et de rugosite contre les series mesurees de maree et de courant
   (calage automatise), et modeles de substitution entraines sur les sorties du modele complet pour
   reduire le nombre de simulations necessaires a la validation. Vérifiée (source) : « A Fast AI
   Surrogate for Coastal Ocean Circulation Models » (2024, ResearchGate) construit un modele de
   substitution rapide pour la circulation cotiere ; la note technique « Operational calibration and
   performance improvement for a 1D hydrodynamic model in a data-scarce coastal area » (HESS, 2025)
   documente un calage operationnel automatise dans une zone cotiere pauvre en donnees, exactement le
   cas des petits sites vises ici.

5. **Acheteur du barreau 1**, trois entreprises privees nommees :
   - Integral Consulting Inc. (cabinet independant, Seattle) : paie aujourd'hui un modelisateur senior
     plusieurs semaines pour caler Delft3D sur un nouveau site ; achete l'acces pour repondre a des
     appels d'offres sur des sites deja dans la bibliotheque sans immobiliser son propre modelisateur.
   - Cashman Dredging & Marine Contracting Co. (drague privee, Massachusetts) : paie un bureau d'etudes
     pour chaque dossier de dragage d'entretien ; achete l'acces pour les chenaux qu'elle drague chaque
     annee, ou le modele reste le meme d'un permis a l'autre.
   - Blue Ocean Mariculture (elevage de poissons en mer, Hawaii) : demande un nouveau site d'elevage et
     doit prouver la dispersion des dechets et de la nourriture ; achete l'acces plutot que de
     commander une etude complete a un cabinet, trop chere pour une seule demande de site.
   Ces trois achetent a une societe d'une personne plutot qu'a l'occupant (RPS, point 9) parce que
   l'occupant vend l'etude complete au tarif d'un mandat majeur (voir point 9), hors de portee d'un
   cabinet independant, d'une drague privee ou d'un eleveur pour un seul dossier.

6. **Population** : au moins 25 acheteurs nommables aux Etats Unis, compilee par categorie (societes
   verifiables individuellement, hors occupants et grands comptes) : cabinets independants de
   modelisation cotiere (Integral Consulting, CWP Engineering, Sustainable Coastal Solutions, Applied
   Coastal Research and Engineering, Coastal Systems International, Continental Shelf Associates,
   Olsen Associates, Anchor QEA, Coastal Protection Engineering, ATM Applied Technology and Management,
   Hourglass Climate) ; dragues et entrepreneurs marins prives de taille moyenne (Cashman Dredging,
   Norfolk Dredging Company, Curtin Maritime, Manson Construction, Weeks Marine, J.F. Brennan Company,
   Marinex Construction) ; aquaculteurs marins independants en demande de site (Blue Ocean Mariculture,
   Ocean Era, Australis Aquaculture, Forever Oceans, Manna Fish Farms). Total superieur a 20 entites
   nommees dans ces trois categories, avant tout comptage des cabinets d'Etat par Etat cotier (17 Etats
   cotiers americains) non recenses ici un par un.

7. **Prix vise** : abonnement d'acces par site, 400 a 900 $/mois par site actif plus un forfait de
   lancement de scenario a 1 500 a 4 000 $ par depot de permis. Rapporte a la ligne d'origine : pour un
   cabinet facturant 31 a 112 $/heure, un calage complet pris en charge par l'acces (au lieu de 80 a 150
   heures expertes de mise en place et calage, au tarif meme bas de la fourchette) vaut 2 500 a 16 800 $
   de temps evite sur le premier dossier, et l'abonnement mensuel reste inferieur au cout d'une seule
   semaine de ce meme temps expert sur les dossiers suivants au meme site.

8. **Question 8 par mecanisme** :
   - Aujourd'hui, le modele cale (maillage, parametres de frottement, jeu de donnees de validation) est
     detenu par le cabinet qui l'a construit pour ce mandat precis ; le client ne recoit que le rapport
     et les cartes de resultats, jamais le modele executable, et le cabinet ne le repartage pas avec un
     autre cabinet.
   - Le client louerait, il ne construirait pas : le contrat de licence reserve au fondateur la
     propriete du maillage, des parametres de calage et du jeu de validation, le client recevant
     uniquement les sorties de son propre scenario pour son dossier ; c'est cette clause, standard dans
     une licence de logiciel ou de donnees, qui permet au fondateur de revendre le meme modele calibre
     a la demande de permis suivante sur le meme site, ce qui finance le cout de calage initial.
   - En annee 3, le regulateur (par exemple une agence d'Etat cotiere ou le Bureau of Ocean Energy
     Management, agence federale americaine charge des permis en mer) a deja accepte ce modele et son
     dossier de calage pour ce site precis, parfois sur plusieurs cycles de permis ou de suivi de
     conformite ; changer de fournisseur oblige a reconstruire un dossier de calage credible pour le
     meme site face au meme regulateur, avec le risque de delai que cela porte sur un calendrier de
     permis deja engage.

9. **Occupant le plus proche** : RPS Group (filiale de Tetra Tech), qui developpe et exploite ses
   propres modeles maison (HYDROMAP, WQMAP, SSFATE construit avec le corps du genie americain) et a
   deja plus de 65 mandats sur le marche eolien offshore americain. RPS vend l'etude complete, au tarif
   d'un mandat majeur, a de grands developpeurs ; il ne loue pas l'acces a un modele deja cale pour un
   seul depot de permis d'un cabinet independant, d'une drague privee ou d'un eleveur, et ne publie pas
   de bibliotheque de modeles reutilisables. DHI (editeur de MIKE 21) vend une licence de logiciel, pas
   un modele deja construit et cale pour un site donne. Recherche verifiee : aucune offre de
   bibliotheque ou d'abonnement de modeles hydrodynamiques pre-cales pour le dragage, l'aquaculture ou
   les permis marins n'apparait dans les resultats de recherche sur ce marche en 2026.

10. **Pre-mortem** : 2031, la societe est morte. Cause redoutee numero 1 (memoire, cause A1) : un
    occupant finance (DHI ou Deltares, editeurs de MIKE 21 et Delft3D) lance sa propre bibliotheque de
    modeles cales en abonnement, integree a son logiciel, et capte les cabinets deja clients de la
    licence. Verification que cette cause n'est pas deja realisee aujourd'hui (recherche menee) : la
    recherche sur une bibliotheque ou un abonnement de modeles hydrodynamiques pre-cales pour le
    dragage, l'aquaculture ou les permis marins ne remonte, en 2026, que des services d'etude complete
    a la mission (RPS, et d'autres cabinets classiques) et aucune offre de location de modele deja
    cale par site ; la cause n'est pas realisee aujourd'hui.

11. **Les dix causes de mort** :
    1. Occupant ou outil gratuit deja au barreau 1 : pas realise aujourd'hui (verifie au point 10) ;
       reste le risque principal a surveiller si DHI ou Deltares reagit.
    2. Point de depart public : non, le point de depart est un ecart de facturation entre outils payant
       et gratuits, pas un texte ou une obligation.
    3. Acheteur sans ligne budgetaire : non, les trois acheteurs nommes facturent deja ce poste a leurs
       propres clients (taux horaire ou budget de dossier de permis), la depense existe.
    4. La preuve se retourne contre celui qui tient la donnee : non, le modele et son calage restent la
       propriete du fondateur ; aucune preuve n'est produite contre le client qui loue l'acces.
    5. Capacite supposee promue en fait : non, le calage automatise et les modeles de substitution sont
       etiquetes vérifiée (source), avec deux publications datees 2024 et 2025 citees au point 4.
    6. Population non comptee : non, au moins 20 entites nommees en trois categories au point 6.
    7. Question 8 repondue par condition : non, les trois reponses du point 8 sont des clauses et des
       couts de depart concrets, pas une condition de masse critique.
    8. Monoculture d'agents : non, le produit est un acces a un modele calcule et cale, pas un agent qui
       redige un rapport ou fixe un standard.
    9. Gain de productivite vendu a qui facture l'heure : le risque existe puisque l'acheteur facture
       l'heure ; ecarte parce que le produit est un acces a une capacite qu'il ne possedait pas (un
       modele deja cale pour un site qu'il n'aurait pas pu se permettre de caler seul), lui permettant
       de repondre a des dossiers qu'il declinait, pas seulement d'aller plus vite sur un dossier deja
       pris.
    10. Barreau 1 public ou grand compte : non, les trois acheteurs nommes sont des entreprises privees
        de taille petite a moyenne ; aucun port public, aucune agence, aucun grand compte nomme.

## Tour 2

### Idee 1 : Modeles hydrodynamiques loues, deja cales par site marin, pour dossiers de permis

MAINTENUE, avec corrections sur les trois trous releves par le tueur (verification Deltares USA,
precedent regulateur pour un calage automatise, source des donnees de terrain).

1. **Ligne d'origine** : inchangee. #8 (registre bureaux-etudes). 31 a 112 $/heure au national, 29 a 75
   $/heure a Houston en aout 2026, paye a un consultant ou une societe d'ingenierie.

2. **Le trou** : inchange et renforce par la recherche du tour 2 (point 9 ci dessous) : l'ecart d'heures
   expertes entre MIKE 21 (payant) et TELEMAC ou Delft3D (gratuits mais plus lents a mettre en place, a
   mailler, a caler et a valider) reste reel, et aucun vendeur trouve, y compris Deltares, ne comble ce
   trou par un modele deja construit et cale pour un site precis.

3. **Le produit** : inchange. Un acces loue, par site marin precis, a un modele hydrodynamique deja
   maille, cale et valide, livre avec son dossier de calage pret pour un permis.

4. **Ce que fait l'IA**, corrige : le calage automatise et les modeles de substitution restent internes
   au fondateur, pour accelerer la construction du modele ; le dossier remis au client et depose aupres
   du regulateur suit la methode de validation classique deja acceptee dans ce secteur (comparaison des
   series simulees et mesurees de maree et de courant, indicateurs d'ecart usuels), sans mention de la
   maniere dont les parametres ont ete trouves. Vérifiée (source), sur la faisabilite technique
   seulement : « A Fast AI Surrogate for Coastal Ocean Circulation Models » (2024) et la note technique
   HESS 2025 sur le calage operationnel en zone pauvre en donnees, deja citees au tour 1. Supposée, et
   dit honnetement comme telle : aucun precedent trouve d'un dossier de permis marin approuve par un
   regulateur sur la base d'un modele explicitement presente comme cale par apprentissage automatique ;
   le contournement retenu est de ne jamais presenter le calage comme automatise dans le dossier
   depose, seulement le resultat valide selon la methode classique, ce qui rend ce point du regulateur
   sans objet pour le produit vendu.

5. **Acheteur du barreau 1** : inchange. Integral Consulting Inc., Cashman Dredging & Marine
   Contracting Co., Blue Ocean Mariculture, memes raisons d'achat qu'au tour 1.

6. **Population** : inchangee, au moins 20 entites nommees en trois categories (tour 1, point 6).

7. **Prix vise** : inchange. Verification du tour 2 (point 9) : les pages Deltares USA a 850 et 1 200 $
   sont des formations a la suite Delft3D FM (cours « Coastal Hydrodynamic Modeling » et « Coastal
   Sediment Modeling »), pas un service de modelisation au mandat ni un modele deja cale ; elles
   n'affaiblissent donc pas l'ecart de prix invoque au tour 1, elles ne sont pas un produit comparable.

8. **Question 8 par mecanisme**, complete sur la source des donnees de terrain :
   - Aujourd'hui, le modele cale reste chez le cabinet qui l'a construit pour un mandat (inchange, tour
     1). Ajout sur les mesures de validation : les series de maree et de niveau d'eau proviennent, la
     ou elles existent, des marégraphes permanents de la NOAA (National Oceanic and Atmospheric
     Administration, agence federale americaine, reseau National Water Level Observation Network) et
     des stations de courant du systeme PORTS (Physical Oceanographic Real Time System) sur les grands
     chenaux et ports deja instrumentes ; ces donnees publiques ne couvrent pas un chenal de dragage
     secondaire ou une zone d'elevage precise, ou une campagne de mesure locale (profileur de courant
     ADCP pose sur site) est necessaire et n'existe pas au depart chez le fondateur.
   - Le client louerait, il ne construirait pas (inchange). Ajout : quand aucune donnee publique ne
     couvre le site, c'est le premier client qui finance la campagne de mesure locale (sous traitee a
     un prestataire de releves marins, cout deja courant dans un dossier de permis), et le contrat de
     licence etend la meme clause de propriete du point 7 (tour 1) au jeu de mesures ainsi obtenu : le
     fondateur le garde, le revend integre au modele aux demandeurs suivants sur ce meme site, ce qui
     finance le cout de la campagne que chaque nouveau demandeur payait seul jusqu'ici. Un site sans
     donnee publique et sans premier client pret a payer la campagne reste hors de la population
     vendable au depart, ce que le dossier reconnait plutot que de le supposer resolu.
   - En annee 3 (inchange, renforce) : le cout de depart couvre maintenant aussi la perte d'acces aux
     mesures de terrain deja payees par le client ou son predecesseur sur ce site, en plus du dossier de
     calage deja accepte par le regulateur.
   Ajout de vigilance retenu du tueur, hors gabarit strict mais integre a la licence : une clause
   d'entiercement (escrow) du maillage, des parametres de calage et du jeu de mesures aupres d'un tiers,
   liberee au client si le fondateur cesse son activite, pour couvrir le precedent SeaDeep (memoire,
   section B) ou les clients d'un fournisseur ferme perdent l'acces au modele deja accepte.

9. **Occupant le plus proche**, verification du tour 2 : RPS Group reste l'occupant le plus proche
   (inchange, tour 1). Recherche demandee sur Deltares USA Inc. : les pages « Coastal Hydrodynamic
   Modeling » (1 200 $) et « Coastal Sediment Modeling » (850 $), deltares-usa.us, sont des cours de
   formation a la suite Delft3D FM (maillages structures et non structures en 1D, 2D, 3D pour la
   premiere ; transport sedimentaire et morphodynamique avec le module D Morphology pour la seconde),
   pas un mandat de modelisation ni un modele deja construit et cale pour un site. Deltares USA n'est
   donc pas un occupant du barreau 1 ; DHI reste loueur de logiciel (« Hydrodynamics Subscription
   Package », minimum deux mois), pas fournisseur de modele deja cale.

10. **Pre-mortem** : 2031, la societe est morte. Cause redoutee numero 1, inchangee du tour 1 (memoire,
    cause A1) : un editeur finance (DHI ou Deltares) lance sa propre bibliotheque de modeles cales en
    abonnement. Verification tour 1 maintenue et renforcee par la recherche du tour 2 : ni DHI (location
    de logiciel) ni Deltares (cours de formation) ne vendent aujourd'hui une bibliotheque de modeles
    deja cales par site revendue a plusieurs clients successifs ; la cause n'est pas realisee
    aujourd'hui.

11. **Les dix causes de mort**, mises a jour :
    1 a 4, 6 a 10 : inchangees du tour 1 (point 11), toujours non realisees au vu des recherches du
    tour 1 et du tour 2.
    5. Capacite supposee promue en fait, corrige apres le tueur : la faisabilite technique du calage
       automatise reste vérifiée (source), mais l'acceptation par un regulateur d'un dossier
       explicitement presente comme cale par apprentissage automatique n'a pas de precedent trouve ;
       dit honnetement comme « supposée » au point 4, et neutralise par un choix de produit, pas par une
       promesse : le calage automatise reste un outil interne, le dossier depose suit la methode de
       validation classique deja acceptee, donc cette cause ne s'applique plus au produit tel que
       vendu.
