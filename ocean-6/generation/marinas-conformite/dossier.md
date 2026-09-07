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

## Tour 2

Verdict du tueur lu dans tueur.md, section Tour 1 : idee 1 MORTE, cause 1 (Mapistry, plateforme financee de
conformite environnementale, vend deja aux sites sous MSGP un module "monitoring and sampling with discharge
documentation" avec capture photo mobile, cite par le tueur). Causes aggravantes retenues par le tueur : cause 4
(le dossier photo permanent et geolocalise est une piece decouvrable contre le site lui meme), cause 5 (la
turbidite par photo n'est validee dans aucune source sur un rejet de chantier naval, seulement sur de l'eau
generique), cause 6 (2 000 marinas en Floride surcompte largement le secteur Q, qui ne couvre que les sites a
activite industrielle : carenage, peinture, avitaillement).

**Recherche autorisee de ce tour (une seule).** Requete : les trois chantiers nommes au tour 1 (Cracker Boy Boat
Works, Roscioli Yachting Center, Derecktor Fort Lauderdale) utilisent-ils deja Mapistry pour leur conformite eaux
pluviales ? Resultat : aucune mention publique de Mapistry ni d'aucune plateforme de conformite nommee pour ces
trois sites ; les resultats ne montrent que des pages d'entreprise generalistes (Facebook, LinkedIn, annuaires
marins). Les relations fournisseur-client de logiciel de conformite ne sont pas publiques : l'absence de mention
ne prouve pas l'absence d'usage, mais rien ne confirme non plus que ces trois acheteurs precis soient deja
occupes par Mapistry. Le trou n'est donc pas confirme occupe chez ces trois acheteurs precis ; regeneration
tentee plutot que "pas de regeneration".

### Idee 1 regeneree : la couche de decision calibree sur le signal du chantier naval, pas l'archive de preuve

Point de depart du cadavre : Mapistry (l'occupant trouve par le tueur) vend une capture photo generaliste du
prelevement MSGP a des sites industriels de tous secteurs (aciereries, aeroports, usines), avec redaction de
rapport annuel et inspections completes. Ce qu'il ne fait pas : il n'aide pas le technicien, au moment meme du
prelevement, a distinguer un signal habituel de chantier naval (poussiere de peinture antisalissure souvent
cuivree, mousse de lavage de coque melee a l'ecume marine, irisation d'huile de moteur au ponton carburant) d'un
vrai signal de pollution a signaler ; il capture et centralise, il ne calibre pas sur ce secteur precis, qui
represente une part marginale de sa clientele multisectorielle. Ce que les clients de Mapistry paient encore a
cote, meme equipes de Mapistry : les prelevements et analyses de laboratoire (ligne 8, ligne 11), le conseil
ponctuel d'un cabinet quand le technicien hesite sur ce qu'il voit (temps facture en plus de l'abonnement
logiciel), et leur propre jugement d'oeil, non ecrit, non partage d'un site a l'autre.

1. **Ligne de depense d'origine.** Inchangee : ligne 7 (200 a 500 $ par inspection periodique aupres d'un
   cabinet), avec lignes 5, 8, 11 en contexte, comme au tour 1.

2. **Le trou, revu.** Le trou n'est plus "personne ne capture la photo du prelevement" (Mapistry le fait deja,
   generiquement, pour les sites MSGP). Le trou est : au moment ou le technicien regarde l'echantillon, aucun
   outil, ni Mapistry ni le cabinet, ne lui dit si ce qu'il voit est le residu ordinaire d'un chantier naval ou
   un signal a signaler, avant qu'il ne remplisse la fiche et decide seul. C'est un jugement d'oeil non outille,
   propre a ce secteur, que le tueur lui meme identifie comme absent chez l'occupant trouve (tueur.md, "ce qui
   manque au dossier").

3. **Le produit, en une phrase.** Un outil qui, au moment du prelevement trimestriel impose par le permis MSGP,
   dit tout de suite au technicien du chantier naval si ce qu'il voit ressemble aux residus habituels d'un
   chantier naval ou a un vrai signal a signaler, avant qu'il ne remplisse la fiche ; rien n'est conserve de
   force, le site choisit comme aujourd'hui ce qu'il garde ou transmet.

4. **Ce que fait l'IA.** Un modele de classification d'image compare la photo du prelevement a une bibliotheque
   de signatures visuelles propres au secteur (particules cuivrees de peinture antisalissure, mousse de lavage
   de coque, irisation d'huile de moteur), calibree site par site au fil des prelevements repetes, pour donner
   une recommandation immediate. Verifiee (source) pour la technique generale : Lopez-Betancur et al. 2022 (IWA
   Water Science & Technology, modele CNN sur photo de smartphone pour solides en suspension et turbidite) et
   l'etude 2023 de l'Arabian Journal for Science and Engineering (classification par reseau de neurones
   convolutif d'echantillons d'eau trouble selon des normes de qualite). Supposee, et seulement supposee, pour
   l'application precise au residu de chantier naval : aucune source trouvee, ni par le dossier ni par le
   tueur, ne valide ce modele sur ce signal specifique ; la calibration doit se construire avec les premiers
   clients payants avant toute promesse de precision.

5. **Acheteur du barreau 1.** Memes trois chantiers prives de Floride qu'au tour 1 : Cracker Boy Boat Works,
   Roscioli Yachting Center, Derecktor Fort Lauderdale. Mapistry vise des sites multisectoriels avec un budget
   EHS complet (usine, aeroport) ; un chantier naval de taille moyenne n'a pas ce budget et n'a pas besoin d'une
   plateforme complete d'inspections et de rapports annuels, seulement d'aide au moment precis du prelevement.
   Ils acheteraient a une societe d'une personne plutot qu'a Mapistry parce que le produit est moins cher, plus
   etroit, et calibre sur leur propre residu plutot que generique a tous les secteurs industriels.

6. **Population, honnetement non resolue.** Le tueur a montre que "plus de 2 000 marinas en Floride" surcompte
   le secteur Q (seuls les sites a activite industrielle : carenage, peinture, avitaillement, y sont soumis).
   Sans recherche supplementaire ce tour, ce dossier ne peut pas donner un chiffre corrige defendable ; il ne
   remplace pas l'erreur par un autre chiffre invente. Ancrage concret disponible : au moins neuf chantiers de
   reparation et carenage identifiables en Floride du Sud (les trois nommes plus, entre autres, Lauderdale Marine
   Center, Rybovich, Merrill-Stevens Dry Dock, Bradford Marine, Summerfield Boat Works, Cracker Boy Fort Pierce),
   sans que cela atteigne le seuil de 25 nommables exige par le gabarit ni un chiffre mondial source. Cause 6 non
   levee ce tour, voir section causes.

7. **Prix vise.** Revu a la baisse : l'outil ne vend plus une archive permanente mais une aide ponctuelle au
   moment du prelevement, donc 39 a 79 $US par mois par site (470 a 950 $/an), sous le cout d'une seule visite
   annuelle de cabinet (200 a 500 $) et tres en dessous du ratio 10 a 30 % par an de la ligne 11.

8. **Question 8, par mecanisme, revue pour ne pas creer d'archive.** Qui detient la donnee aujourd'hui : personne
   ; le jugement d'oeil du technicien sur ce qui est residu ordinaire de chantier naval reste dans sa tete,
   propre a chaque site, jamais ecrit ni partage. Pourquoi il laisserait le fondateur en accumuler une version :
   la photo brute du prelevement n'est pas conservee par defaut au dela de la decision donnee (elle est reduite
   a une signature numerique, une empreinte de couleur et de texture, non reconstituable en photo du rejet), donc
   ce n'est pas une preuve du site que le fondateur detiendrait, mais une empreinte statistique calibree pour ce
   site precis, batie prelevement apres prelevement ; le site accepte cette calibration en echange d'une
   recommandation plus juste que le defaut generique. Ce qui rend le depart couteux en annee 3 : la calibration
   accumulee (des dizaines de prelevements passes, propres a la teinte de peinture, a l'eclairage du ponton, a la
   couleur d'eau habituelle de ce site precis) ne peut pas etre exportee comme un simple fichier ; un nouvel
   outil ou un retour au jugement d'oeil nu repart de zero et redonne au technicien un taux d'erreur plus eleve
   des le premier prelevement suivant le changement.

9. **Occupant le plus proche.** Mapistry (trouve par le tueur), plateforme financee de conformite
   environnementale vendue a des sites MSGP de tous secteurs, avec capture photo mobile, echantillonnage et
   documentation du rejet, redaction et soumission des rapports annuels, inspections completes de site. Ne fait
   pas, a la date du 7 septembre 2026, de couche calibree sur le signal visuel propre au secteur Q ni de
   recommandation en temps reel au moment du prelevement ; rien trouve, ni par le dossier ni par le tueur, ne
   contredit cela.

10. **Pre-mortem.** 2031, la societe est morte. Cause redoutee : cause 1 encore, mais sous une forme plus
    precise que le tour 1 : Mapistry ou un concurrent EHS generaliste ajoute un sous module "secteur Q" a son
    catalogue existant de secteurs MSGP, avec un cout marginal quasi nul pour eux puisque la capture photo et le
    pipeline de classification d'image existent deja chez eux pour d'autres secteurs, seule la bibliotheque de
    signatures change. Verification que ce n'est pas deja arrive au 7 septembre 2026 : la recherche du tueur sur
    Mapistry (tueur.md, recherche 3) decrit ses trois blocs de service sans mention d'une couche calibree par
    secteur ni d'indicateurs visuels par secteur d'activite ; aucune source, dans les recherches cumulees du
    dossier et du tueur, ne montre une telle specialisation deja vendue.

### Les dix causes de mort, revues pour l'idee regeneree

1. **Occupant deja present.** S'applique toujours en partie : Mapistry occupe le mecanisme general (capture
   photo, documentation du rejet) au meme type d'acheteur MSGP. Ne s'applique pas a la couche precise proposee
   ici (calibration sectorielle, recommandation en temps reel) : rien trouve a ce jour. Cause redoutee, cf.
   pre-mortem.
2. **Point de depart public.** Ne s'applique pas : origine ligne de depense privee (ligne 7), inchangee.
3. **Acheteur sans ligne budgetaire.** Ne s'applique pas : memes trois acheteurs, memes lignes 7/8/11 deja
   payees, prix revu a la baisse rend l'achat plus facile, pas plus difficile.
4. **Preuve retournee contre celui qui la detient.** Corrigee : la photo brute n'est plus conservee par defaut,
   seule une empreinte statistique non reconstituable en image l'est ; rien n'est transmis au regulateur par le
   produit ; le site garde, comme aujourd'hui, la main sur ce qu'il ecrit et transmet lui meme. Ne s'applique
   plus au meme degre que releve par le tueur au tour 1.
5. **Capacite supposee promue en fait.** Corrigee par l'etiquette : la technique generale (photo vers categorie
   d'eau) est vérifiée (source, deux publications datees) ; l'application au signal de chantier naval est
   explicitement etiquetee supposee, non promue en fait, avec plan de calibration par les premiers clients avant
   toute promesse de precision.
6. **Population non comptee.** S'applique encore, non levee ce tour faute de recherche disponible (budget
   epuise) : neuf acheteurs concrets nommes, pas vingt cinq, pas de chiffre mondial source. Risque reconnu,
   reporte a une recherche future si l'idee survit.
7. **Question 8 repondue par condition.** Ne s'applique pas, renforcee par rapport au tour 1 : la fragilite
   relevee par le tueur (les fichiers photo peuvent etre exportes ailleurs) ne tient plus, puisque ce qui fait
   la valeur n'est plus un fichier exportable mais une calibration statistique accumulee, propre a l'outil.
8. **Monoculture d'agent.** Ne s'applique pas : le produit ne redige aucun rapport ni plan, il donne une
   recommandation au moment du geste, rien de plus.
9. **Gain de productivite vendu a qui facture l'heure.** Ne s'applique pas : acheteur toujours le proprietaire
   du chantier naval, pas le cabinet facture a l'heure.
10. **Barreau 1 public ou grand compte.** Ne s'applique pas : memes trois chantiers prives independants ; a
    distinguer explicitement de Mapistry, qui vise plutot de gros sites industriels multisectoriels, jamais visee
    ici comme acheteur.

### Budget de recherche du tour 2

Une seule recherche autorisee et consommee ce tour (verification de l'usage de Mapistry chez les trois chantiers
nommes, inconclusive). Aucune recherche restante. Cause 6 (population) reste non resolue et devra etre traitee
au tour suivant si l'idee survit, en priorite sur toute autre recherche.
