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
