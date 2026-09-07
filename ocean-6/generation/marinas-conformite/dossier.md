# Dossier marinas conformite

Date : 7 septembre 2026. Generateur : marinas-conformite, passe 6. Lignes source lues :
ocean-6/generation/marinas-conformite/lignes.md. Memoire lue : ocean-6/MEMOIRE-MORTS.md.
WebSearch utilises ce tour : 4 sur 4 autorises au total (0 reserve pour le tour 2, a assumer si le tueur
tue l'idee).

## Tour 1

### Idee 1 : le carnet de preuve du geste visuel trimestriel MSGP

1. **Ligne de depense d'origine.** Ligne 7 du registre ports-terminaux-marinas : marinas et chantiers navals
   prives de Floride sous permis generique multisectoriel actif (Multi Sector General Permit, MSGP, le permis
   federal americain de rejet d'eaux pluviales industrielles) paient 200 a 500 $US par inspection periodique a
   des cabinets de conseil environnemental. Contexte : ligne 5 (plan de prevention 2 000 a 10 000 $), ligne 8
   (accompagnement permis de rejet federal 2 500 a 10 000 $) et ligne 11 (conformite recurrente 10 a 30 % par an).

2. **Le trou.** A cote de l'inspection payee au cabinet (qui verifie l'etat physique des mesures de gestion),
   le permis MSGP impose un examen visuel trimestriel distinct : un prelevement d'eau (grab sample) pris au
   point de rejet dans les 30 minutes suivant une pluie, note contre des indicateurs visuels (couleur, turbidite,
   mousse, solides flottants, odeur, trace d'huile en surface). Cet examen n'exige ni laboratoire ni transmission
   systematique au regulateur ; c'est le personnel du site lui meme qui le fait, sur une fiche papier ou PDF que
   le site conserve (ligne 7 : "le cabinet remet un rapport... que le site conserve"). Preuve, verifiee (source) :
   guide EPA 832-B-09-003 (Industrial Stormwater Monitoring and Sampling Guide) et la fiche SOP du Maine DEP
   (visual-monitoring-sop.pdf) decrivent ce prelevement dans les 30 minutes et cette notation visuelle sans
   obligation d'analyse labo ni de soumission systematique.

3. **Le produit, en une phrase.** Une application de telephone qui previent l'employe du chantier naval quand
   une pluie declenche l'obligation d'examen trimestriel, le guide pour prendre la photo du prelevement au bon
   moment, note automatiquement si l'echantillon a l'air conforme aux criteres du permis, et garde ce dossier en
   permanence pour le site.

4. **Ce que fait l'IA.** Deux taches : a) rapprocher l'heure de la photo et la position GPS du site des donnees
   de pluie publiques (NOAA) pour etablir si la pluie comptait et si la fenetre legale a ete respectee ; b)
   noter la photo du prelevement contre les indicateurs visuels du permis (couleur, turbidite, mousse, trace
   d'huile) par un modele entraine sur image. Verifiee (source) : Lopez-Betancur et al. 2022 (modele CNN sur
   photo de smartphone estimant solides en suspension et turbidite, IWA Water Science & Technology) et l'etude
   2023 de l'Arabian Journal for Science and Engineering (classification par vision par ordinateur et reseau de
   neurones convolutif d'echantillons d'eau turbide selon des normes de qualite).

5. **Acheteur du barreau 1.** Trois chantiers navals prives de Floride, independants, non cotes, non publics :
   Cracker Boy Boat Works (Riviera Beach), Roscioli Yachting Center (Fort Lauderdale), Derecktor Fort Lauderdale.
   Ils paient deja les lignes 7, 8 et 11 aujourd'hui a des cabinets. Ils achèteraient a une societe d'une
   personne plutot qu'a l'occupant parce que le cabinet facture un deplacement ponctuel et ne peut pas etre sur
   place a chaque pluie qualifiante (fenetre de 30 minutes) ; c'est necessairement le personnel du site qui agit
   dans l'instant, et le produit remplace la case cochee a la hate par un protocole guide et horodate, moins cher
   qu'un deplacement de cabinet.

6. **Population.** La Floride compte plus de 2 000 marinas sur ses cotes (chiffre agrege d'une recherche
   WebSearch, sources FDEP, RMA, KCI) ; une partie est soumise au secteur Q du MSGP (marinas et chantiers navals
   a activite industrielle : avitaillement, carenage, peinture). Chaque Etat cotier americain administre son
   propre equivalent du MSGP pour ce meme secteur Q, donc une population nationale bien au dela de 200 sites.
   Chiffre exact des sites sous MSGP actif non compte cette session, comme les lignes 5 et 8 le notaient deja.

7. **Prix vise.** Abonnement mensuel par site, 149 a 249 $US/mois (1 800 a 3 000 $/an), rapporte a la ligne
   d'origine : moins cher que 4 visites de cabinet par an a 200 a 500 $ (800 a 2 000 $/an) plus une part de
   l'accompagnement ponctuel (2 500 a 10 000 $) et tres en dessous du ratio 10 a 30 % par an de la ligne 11.
   Positionne comme complement du cabinet (qui garde la redaction du plan et le conseil), pas comme remplacement.

8. **Question 8, par mecanisme.** Qui detient la donnee aujourd'hui : le site lui meme conserve les fiches
   papier ou PDF de l'examen trimestriel et les rapports d'inspection du cabinet (lignes 7, 8, 11), dispersees,
   sans lien avec les releves de pluie reels. Pourquoi il laisserait le fondateur la detenir : le protocole
   exige que la photo soit prise sur place dans les 30 minutes du rejet, donc c'est l'application sur le
   telephone du personnel qui capte l'evenement en premier, le dossier de preuve nait dans l'app et nulle part
   ailleurs ; le permis impose par ailleurs la conservation des dossiers de surveillance au moins 3 ans apres
   l'expiration du permis, ce que l'app assure nativement alors que le classeur du site se perd au changement de
   personnel. Ce qui rend le depart couteux en annee 3 : le site aurait alors 12 trimestres d'examens visuels et
   d'inspections horodates et rattaches aux releves de pluie reels, le seul historique continu defendable en cas
   de controle ou lors de la revente du chantier (diligence environnementale a la vente ou au refinancement) ;
   changer d'outil ne recree pas retroactivement cette chaine de preuve horodatee et geolocalisee, or c'est
   precisement cette continuite qui a de la valeur.

9. **Occupant le plus proche.** Recherche WebSearch du jour : StormGuard Pro, StormScout, StormBMP,
   ComplianceGo, EHSTracks/SW2, NJBSoft SAMS, Ecesis notent des photos de mesures de gestion physiques (barriere
   a sediments, protection d'entree d'egout, bassin de retention) pour des permis de chantier de construction
   (erosion et sedimentation, ex. NCG01 Caroline du Nord, TXR Texas), pas pour le rejet industriel d'un site deja
   construit comme une marina. Aucun des outils trouves ne mentionne l'examen visuel trimestriel par prelevement
   propre au MSGP industriel, ni la notation des indicateurs visuels EPA sur un tel prelevement. Dans la carte
   des occupants : Ecobot fait le permis 404 des zones humides, pas le suivi MSGP ; Green Marine est une
   autoevaluation volontaire de l'industrie maritime, pas une preuve reglementaire de rejet.

10. **Pre-mortem.** 2031, la societe est morte. Cause redoutee : cause n°1, un occupant finance (un des outils
    de suivi de chantier trouves, ou un nouvel entrant) etend son modele deja entraine sur les mesures de
    gestion de chantier vers l'examen visuel trimestriel MSGP industriel et le vend en option a bas cout dans sa
    suite existante, avant que le fondateur seul n'ait atteint une masse de sites payants. Verification que ce
    n'est pas deja arrive aujourd'hui (7 septembre 2026) : la recherche WebSearch du jour sur les outils IA de
    conformite eaux pluviales ne retourne aucun outil citant l'examen visuel trimestriel par prelevement ni la
    notation des indicateurs visuels EPA (couleur, mousse, trace d'huile) sur ce prelevement ; tous les outils
    trouves se limitent a la condition physique des mesures de gestion de chantiers de construction.

11. **Les dix causes de mort, verifiees une par une.**
    - 1. Occupant deja present : aucun trouve sur ce mecanisme precis au 7 septembre 2026 (point 9 et 10) ;
      risque reel si un occupant pivote, c'est la cause redoutee.
    - 2. Point de depart public : le point de depart est une ligne de depense privee precise (ligne 7, montant
      paye a un cabinet), pas un texte de loi ni une tendance mediatique. Ne s'applique pas.
    - 3. Acheteur sans ligne budgetaire : les trois chantiers nommes paient deja 200 a 500 $ par inspection, 2
      500 a 10 000 $ d'accompagnement et 10 a 30 % par an de recurrent, poste budgetaire existant. Ne s'applique
      pas.
    - 4. Preuve retournee contre celui qui la detient : le produit structure une preuve que le site choisit deja
      de produire (obligation existante du permis), il n'ajoute pas de capteur qui denoncerait une infraction
      cachee au site ; le site reste maitre de l'action corrective. Ne s'applique pas.
    - 5. Capacite supposee promue en fait : capacite verifiee par deux publications datees, 2022 et 2023, sur
      l'estimation de turbidite et la classification d'eau trouble par photo. Etiquette vérifiée (source). Ne
      s'applique pas.
    - 6. Population non comptee : plus de 2 000 marinas en Floride, secteur Q national au dela, largement plus
      de 200. Le chiffre exact des sites sous MSGP actif reste non compte cette session, limite reconnue au
      point 6.
    - 7. Question 8 repondue par condition : reponse donnee sans "oui si masse critique", avec obligation de
      retention de 3 ans et chaine de preuve horodatee comme raison. Ne s'applique pas.
    - 8. Monoculture d'agent (redige le rapport, devient le standard, score aux assureurs) : le produit ne
      redige aucun rapport ni plan pour le regulateur ; il guide une photo, la note contre des indicateurs
      visuels fixes par le permis, et l'horodate contre la pluie reelle. Le cabinet garde la redaction du plan.
      Ne s'applique pas.
    - 9. Gain de productivite vendu a qui facture l'heure : l'acheteur est le proprietaire du chantier, pas le
      cabinet facture a l'heure ; l'examen trimestriel n'a jamais ete fait par le cabinet, le produit ne lui
      retire donc aucune heure facturable. Ne s'applique pas.
    - 10. Barreau 1 public ou grand compte : trois chantiers prives independants nommes, aucun organisme public
      ni chaine nationale. Ne s'applique pas.

### Budget de recherche du tour 1

Quatre WebSearch consommees : nombre de marinas en Floride (population) ; outils IA de conformite eaux
pluviales existants (occupant, cause 1) ; exigences de l'examen visuel trimestriel MSGP (le trou, secteur Q) ;
publications sur l'estimation de turbidite par photo de smartphone (capacite IA, question 4). Aucune reserve
pour le tour 2 : si l'idee est tuee, la regeneration du tour 2 partira du cadavre et des occupants deja trouves
sans recherche supplementaire, sauf necessite absolue.
