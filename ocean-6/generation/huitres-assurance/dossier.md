# Dossier huitres-assurance

Date : 7 septembre 2026. Budget recherche utilise ce tour : 4 WebSearch sur 4 autorises au total (tour 1 et tour 2
confondus). Aucun WebSearch disponible pour un tour 2 : toute regeneration devra s'appuyer sur les sources deja
citees ici.

## Tour 1

### Idee 1 : le carnet de comptage verifie de la ferme d'huitres

1. **Ligne de depense d'origine** : registre aquaculteurs-transformateurs, ligne 3. Les ostreiculteurs petits et
   moyens en zone pilote paient une prime de 97 a 2536 dollars US (pour 50 000 a 250 000 huitres, plus 30 a 60
   dollars de frais administratifs) a des agents d'assurance prives agrees par la Risk Management Agency (Approved
   Insurance Provider) pour l'assurance recolte USDA, programme pilote coquillages.

2. **Le trou** : la police APH-PC (Actual Production History, Price Component) indemnise sur declencheur de comte
   (tempete nommee, chaleur excessive a maree basse, gel a maree basse, salinite basse apres pluie) combine a la
   perte de production propre a la ferme. La page officielle du programme le dit : "The program uses county loss
   triggers combined with producers' sales records to confirm a loss has occurred" (Risk Management Agency, FAQ
   Shellfish Pilot Crop Insurance Program, rma.usda.gov). Autrement dit, c'est le producteur qui doit apporter la
   preuve de ce qu'il avait dans l'eau avant l'evenement et de ce qu'il a perdu ; aujourd'hui ce sont des carnets,
   des factures de vente et un comptage a l'oeil, verifies a la main par l'agent agree (ligne 3 : "qui detient la
   donnee : la RMA et l'agent d'assurance"). Aucune ferme ne tient une serie continue et datee d'inventaire.

3. **Le produit en une phrase** : un carnet de bord photo pour l'huitre, qui transforme les comptages reguliers et
   les evenements climatiques de la ferme en un dossier date que l'assureur accepte pour fixer la couverture et
   payer plus vite apres une perte.

4. **Ce que fait l'IA** : compter et mesurer les huitres a partir de photos ou de video de poche prises par le
   fermier lui meme, a chaque visite de cage, puis dater et recouper ces comptages avec les evenements de comte
   (tempete, chaleur, gel, salinite). Vérifiée (source) : "Application of Artificial Intelligence and Computer
   Vision for Measuring and Counting Oysters", Journal of Imaging, decembre 2025 (doi 10.3390/jimaging11120439,
   PMC12733815), qui rapporte un comptage et une mesure automatises 86,7 fois plus rapides qu'un comptage manuel a
   partir de photos de terrain.

5. **L'acheteur du barreau 1** : trois Approved Insurance Providers prives qui vendent deja ce programme pilote
   coquillages : ProAg, NAU Country Insurance Company (groupe QBE) et Rain and Hail LLC (groupe Chubb), tous trois
   agrees par la Risk Management Agency et actifs dans les etats cotiers vises. Ils paient deja la verification
   manuelle d'un dossier de sinistre coquillage (temps d'agent, pas de logiciel specifique publie pour ce produit de
   niche). Ils acheteraient a une societe d'une personne plutot que de batir en interne parce que le volume de
   polices coquillages est trop faible face a leurs lignes de recolte majeures (mais, soja) pour justifier un outil
   maison ; un courtier specialise en aquaculture a le meme interet, pour retenir son client et reduire les litiges
   de sinistre.

6. **La population** : le nombre exact de fermes assurees n'est pas publie (deja note en ligne 3). Mais les
   acheteurs nommables ne se limitent pas aux fermes : les trois AIP cites vendent via un reseau national d'agents
   de recolte agrees par la RMA, documente publiquement a plusieurs milliers d'agents credites a l'echelle des
   Etats Unis (RMA, service de localisation d'agents) ; rien que sur les etats cotiers couverts par le programme
   pilote (Alabama, Californie, Delaware, Floride, Louisiane, Maine, Maryland, Massachusetts, Mississippi, New
   Hampshire, New Jersey, New York, Caroline du Nord, Rhode Island, Caroline du Sud, Virginie, seize etats au
   crop year 2025), cela depasse tres largement le seuil de 200.

7. **Le prix vise** : abonnement ferme a 240 a 480 dollars US par an (comptage regulier, historique conserve),
   sous la prime lue de 97 a 2536 dollars mais recupere en couverture mieux etablie. En option, un forfait dossier
   de sinistre vendu au courtier ou a l'AIP a 150 a 300 dollars US par sinistre verifie, a comparer aux 600 a 1200
   dollars US par jour d'un temoin expert (ligne 6 du meme lot) et aux 64 609 a 77 433 dollars US annuels d'un
   ajusteur salarie (ligne 11).

8. **Question 8** :
   - Qui detient aujourd'hui la donnee qui s'accumulerait : personne en continu. Chaque ferme garde ses propres
     carnets informels ; l'AIP et son agent ne recoivent qu'un dossier ponctuel au moment du sinistre (ligne 3) ;
     le fabricant de sonde garde des lectures brutes sans lien au comptage (ligne 4) ; les applications generalistes
     de gestion de ferme existantes n'exportent pas de preuve datee au format assurance (voir occupant, point 9).
   - Pourquoi il laisserait le fondateur la detenir : la ferme y gagne directement, la serie de comptages datee et
     verifiee devient sa preuve pour etablir ou faire monter son Actual Production History, donc sa couverture et
     sa prime future, et pour etre indemnisee plus vite apres un evenement declenche par comte. L'AIP et le
     courtier y gagnent aussi, moins d'heures de verification manuelle par dossier, moins de dossiers rejetes faute
     de preuve.
   - Ce qui rend le depart couteux en annee trois : la valeur du service grandit avec l'historique. Trois ans de
     comptages photo verifies et d'evenements documentes constituent l'historique de production reel de la ferme,
     base de calcul de la prime et de la couverture RMA. Partir signifie perdre la continuite de cette preuve et
     repartir d'un historique fragmente, ce qui abaisse la couverture assurable accessible.

9. **L'occupant le plus proche** : Oceanfarmr, application de gestion de ferme ostreicole avec cartes GPS, qui
   "track exactly where stock is located and what condition it's in" (oceanfarmr.com, page huitres). OysterTracker
   gere deja inventaire et activites de la ferme (Oyster Recovery Partnership, avril 2026). Mussel App (Nouvelle
   Zelande) annonce des "detailed insurance reports" et un suivi de stock. Aucun des trois ne publie de comptage
   verifie par vision par ordinateur a partir de photos, aucun ne relie le comptage aux declencheurs de comte de la
   RMA, aucun ne produit un dossier pret pour un Approved Insurance Provider americain ; ce sont des outils de
   gestion d'exploitation, pas des generateurs de preuve d'assurance.

10. **Pre-mortem** : 2031, la societe est morte. Cause numero 1 la plus crainte, un occupant finance (Oceanfarmr ou
    un equivalent) ajoute un module de comptage automatise et de dossier de sinistre directement dans son
    application generaliste deja installee chez les fermes, gratuitement ou en option bon marche, avant que le
    fondateur n'ait construit assez d'historique pour etre defendable. Verification que ce n'est pas deja realise
    aujourd'hui (recherche du 7 septembre 2026, meme requete que le point 9) : Oceanfarmr, OysterTracker et Mussel
    App decrivent un suivi de stock et des rapports, mais aucune de leurs pages publiques ne mentionne un comptage
    automatise par photo ni un rapprochement avec les declencheurs de comte RMA ; le risque est reel mais pas
    encore realise.

11. **Les dix causes de mort** :
    1. Occupant deja en place : pas encore realise (verifie au point 10) ; Oceanfarmr et Mussel App font du suivi de
       stock et des rapports d'assurance generiques, mais ni comptage par vision automatisee ni dossier RMA. A
       surveiller de pres, c'est la cause la plus probable.
    2. Point de depart public : ne s'applique pas, la ligne d'origine est une prime chiffree payee par la ferme, pas
       un texte ou une obligation seule.
    3. Acheteur sans ligne budgetaire : ne s'applique pas, les AIP sont des societes privees a but lucratif qui
       paient deja la verification manuelle des sinistres, et les fermes paient deja des primes de plusieurs
       centaines de dollars.
    4. La preuve accuse celui qui tient la donnee : ne s'applique pas, le comptage sert a faire etablir et payer la
       ferme, jamais a la denoncer ; la ferme reste proprietaire de son dossier et choisit a qui elle le transmet.
    5. Capacite supposee promue en fait : ne s'applique pas, le comptage par vision par ordinateur est verifie par
       une publication datee de decembre 2025 (point 4).
    6. Population non comptee : partiellement vraie pour les fermes assurees precisement (non trouve, deja note en
       ligne 3), mais couverte pour les acheteurs alternatifs, agents et courtiers agrees, documentes a plusieurs
       milliers sur seize etats.
    7. Question 8 repondue par condition : ne s'applique pas, la reponse du point 8 s'appuie sur l'historique de
       production reel et le cout de reconstitution, pas sur une masse critique.
    8. Monoculture d'agents : ne s'applique pas, ce n'est ni un redacteur de rapport reglementaire, ni un standard
       impose, ni un score vendu a un assureur qui n'a rien demande.
    9. Gain de productivite vendu a qui facture l'heure : a surveiller si le produit est vendu en premier a l'AIP
       comme un pur gain de temps d'agent ; le prix vise (point 7) le positionne d'abord comme un achat de la ferme
       pour sa propre couverture, et pour l'AIP comme une capacite nouvelle (moins de litiges, meilleure retention)
       plutot qu'une simple economie d'heures.
    10. Barreau 1 public ou grand compte : ne s'applique pas, la RMA fixe le cadre reglementaire mais l'acheteur qui
        paie reste l'AIP prive, le courtier prive ou la ferme elle meme, jamais un organisme public directement.

## Tour 2

Verdict du tueur sur le tour 1 : VIVANTE. Idee maintenue (pas de regeneration), corrigee sur trois points et
mise en vigilance sur deux autres. Aucune nouvelle recherche (budget de 4 WebSearch epuise au tour 1) : les
corrections ci dessous s'appuient sur les sources deja lues au tour 1 et sur le verdict du tueur lui meme, qui a
consomme ses trois requetes propres et cite ses sources dans tueur.md.

### Idee 1 (maintenue) : le carnet de comptage verifie de la ferme d'huitres

1. **Ligne de depense d'origine** : inchangee. Registre aquaculteurs-transformateurs, ligne 3, prime de 97 a 2536
   dollars US payee par la ferme a un Approved Insurance Provider prive pour l'assurance recolte USDA, programme
   pilote coquillages.

2. **Le trou, corrige** : la RMA exigeait historiquement des "registres acceptables d'une tierce partie
   desinteressee" pour completer l'ajustement de perte, mais une reforme Crop Insurance Reporting and Other
   Changes (CIROC), annoncee en 2022, permet desormais au producteur de s'auto declarer sans registre tiers et
   d'utiliser ses propres registres de production comme piece justificative (source citee par le tueur : communique
   RMA Announces Greater Flexibilities for Crop Insurance Reporting, 2022, et FAQ Shellfish Pilot Crop Insurance
   Program, rma.usda.gov). Le trou n'est donc plus une obligation reglementaire de preuve tierce, il n'a jamais
   ete que ca : le trou reste que personne, ni la ferme ni l'AIP, ne tient une serie continue et datee de
   comptages verifiables independamment de la memoire du fermier, meme quand l'auto declaration suffit
   formellement. L'AIP garde le pouvoir de determiner le montant de l'indemnite et un dossier auto declare mais mal
   date ou incoherent reste plus lent a approuver et plus expose a un audit ou un litige.

3. **Le produit en une phrase, reformule** : un carnet de bord photo pour l'huitre qui construit, visite apres
   visite, l'historique de production que le fermier peut opposer lui meme, sans intermediaire, pour fixer sa
   couverture et defendre son dossier en cas de sinistre conteste.

4. **Ce que fait l'IA, avec la reserve du tueur** : compter et mesurer les huitres a partir de photos prises par le
   fermier a chaque visite de cage, puis dater et recouper ces comptages avec les evenements de comte. Vérifiée
   (source) pour la methode en general : "Application of Artificial Intelligence and Computer Vision for Measuring
   and Counting Oysters", Journal of Imaging, decembre 2025 (doi 10.3390/jimaging11120439). Supposee, et non
   vérifiée par cette source, l'exactitude sur des photos de telephone prises en conditions reelles de cage
   (salissure, chevauchement, eau trouble) plutot que sur des images de test controlees : l'etude elle meme
   rapporte un comptage complet manque sur deux images sur dix testees, ce qui doit etre traite comme un risque de
   produit a valider avec de vraies fermes, pas comme une capacite acquise.

5. **L'acheteur du barreau 1, avec vigilance** : ProAg, NAU Country Insurance Company (QBE) et Rain and Hail LLC
   (Chubb), toujours les trois Approved Insurance Providers vises. Ce qu'ils exigent en pratique au dela du minimum
   RMA n'a pas ete confirme par une source datee et nommee, ni au tour 1 ni au tour 2 : supposee, marquee comme
   telle. Raisonnement qui la soutient sans la remplacer : un AIP prive reste financierement expose si un dossier
   auto declare est ensuite conteste ou audite par la RMA au titre du controle qualite du programme fedeal ;
   accepter une auto declaration minimale n'empeche pas un assureur prive de preferer, en interne, un dossier mieux
   etaye pour reduire son propre risque de sinistre conteste ou de fraude. A verifier en priorite si un budget de
   recherche est de nouveau disponible, aupres des manuels de souscription publics des trois AIP nommes.

6. **La population, corrigee** : le nombre de polices vendues dans le programme pilote coquillages n'est pas
   publie dans les sources deja lues (confirme par le tueur). Compte retenu, source et defendable : le reseau
   d'agents de recolte agrees par la RMA, documente publiquement a plusieurs milliers a l'echelle nationale (RMA,
   service de localisation d'agents), dont plus de 200 rien que sur les seize etats du programme pilote coquillages
   (Alabama, Californie, Delaware, Floride, Louisiane, Maine, Maryland, Massachusetts, Mississippi, New Hampshire,
   New Jersey, New York, Caroline du Nord, Rhode Island, Caroline du Sud, Virginie). Borne honnete et non sourcee
   ce tour pour le compte de fermes elles memes : au moins quelques dizaines d'exploitations ostreicoles
   commerciales par etat cotier ferait deja depasser 200 fermes sur les seize etats, mais ce chiffre est une
   estimation raisonnee, pas une donnee publiee ; il est marque supposee et reste le premier point a verifier avec
   un budget de recherche (Census of Aquaculture USDA, ou donnees d'un etat comme la Virginie ou le Maryland).

7. **Le prix vise, revise a la baisse** : abonnement ferme ramene a 180 a 360 dollars US par an (contre 240 a 480
   au tour 1), parce que la reforme CIROC 2022 rend l'achat discretionnaire plutot qu'impose par une obligation de
   tiers verificateur : le fermier paie pour son historique et sa defense en cas de litige, pas pour se conformer.
   Sous la prime lue de 97 a 2536 dollars. Le forfait dossier de sinistre vendu au courtier ou a l'AIP reste a 150 a
   300 dollars US par sinistre verifie, a comparer aux 600 a 1200 dollars US par jour d'un temoin expert (ligne 6)
   et aux 64 609 a 77 433 dollars US annuels d'un ajusteur salarie (ligne 11).

8. **Question 8, reformulee sans exigence de tiers** :
   - Qui detient aujourd'hui la donnee qui s'accumulerait : personne en continu, meme apres CIROC 2022. La memoire
     du fermier n'est pas une serie datee et exploitable ; l'AIP ne recoit qu'un dossier ponctuel au moment du
     sinistre ; les applications generalistes de gestion de ferme (point 9) ne generent pas de dossier de preuve.
   - Pourquoi il laisserait le fondateur la detenir : la ferme y gagne trois choses independantes de l'obligation
     reglementaire, un historique de production qui sert de base a sa couverture assurable, un traitement plus
     rapide de l'indemnite parce que le dossier est deja structure et date, et une piece opposable si le montant
     est conteste ou audite. L'AIP y gagne moins de dossiers auto declares incoherents a instruire.
   - Ce qui rend le depart couteux en annee trois : inchange, la valeur croit avec l'historique. Trois ans de
     comptages photo verifies et d'evenements documentes constituent l'historique de production reel de la ferme ;
     partir signifie perdre la continuite de cette preuve, quelle que soit l'obligation reglementaire du moment.

9. **L'occupant le plus proche, corrige** : SmartOysters est l'ancien nom d'Oceanfarmr, rebaptise apres extension
   aux moules et algues (meme entreprise, source The Fish Site, citee par le tueur) : ce n'est pas un quatrieme
   acteur, la carte du tour 1 est corrigee en ce sens. Occupants reels : Oceanfarmr (suivi GPS de stock, et depuis
   l'ouragan Sally en Alabama une fonction objets perdus et retrouves pour le materiel derive), OysterTracker
   (inventaire et activites), Mussel App (suivi de stock et rapports d'assurance generiques). Aucun des trois ne
   publie de comptage automatise par photo ni de rapprochement avec les declencheurs de comte de la RMA, confirme
   par le tueur avec une recherche independante du tour 1.

10. **Pre-mortem, avec le delai de six mois** : 2031, la societe est morte. Cause numero 1 toujours la plus
    crainte, mais elle exige plus que six mois pour se realiser. Trois raisons que le comptage par vision ne
    s'ajoute pas vite chez ces occupants : la publication de reference elle meme rate deux comptages sur dix en
    conditions controlees (point 4), donc atteindre une precision defendable devant un assureur sur des photos de
    terrain prises par des fermiers exige une collecte de donnees et une validation propres, pas un module a
    brancher ; aucun des trois occupants n'a aujourd'hui de pipeline d'image en production, leur feuille de route
    visible va vers la logistique (le suivi objets perdus et retrouves d'Oceanfarmr apres l'ouragan Sally repond a
    un probleme de materiel, pas de preuve de sinistre) ; et produire un dossier accepte par un AIP demande une
    relation avec ces assureurs prives que ces applications generalistes n'ont pas encore engagee. Verification que
    la cause n'est pas deja realisee : confirmee par le tueur le 7 septembre 2026 avec une recherche independante
    de celle du tour 1, aucun des trois occupants ne publie de comptage par vision ni de dossier RMA a cette date.

11. **Les dix causes de mort, mises a jour** :
    1. Occupant deja en place : toujours pas realise, verifie deux fois independamment (tour 1 et tueur) ; reste la
       menace la plus credible, mais le point 10 donne des raisons concretes qu'elle ne se realise pas en six mois.
    2. Point de depart public, nuance : la reforme CIROC 2022 est elle meme une reponse publique et gratuite a la
       question de qui verifie le registre du producteur, elle n'occupe pas le barreau 1 (ce n'est pas un outil de
       comptage) mais elle affaiblit l'argument d'obligation reglementaire ; corrige au point 2 et au point 7, le
       produit se vend desormais sur l'historique et la defense en litige, pas sur une exigence de tiers qui n'existe
       plus depuis 2022.
    3. Acheteur sans ligne budgetaire : ne s'applique pas, inchange depuis le tour 1.
    4. La preuve accuse celui qui tient la donnee : ne s'applique pas, inchange, le dossier sert toujours a payer la
       ferme, jamais a la denoncer.
    5. Capacite supposee promue en fait : partiellement a surveiller desormais, la methode de comptage est verifiee
       par une publication datee (point 4) mais son exactitude en conditions reelles de cage est explicitement
       marquee supposee, pas vérifiée, corrige suite au tueur.
    6. Population non comptee : toujours vraie pour le compte exact de fermes assurees, corrige au point 6 avec un
       compte sourced pour les agents et une borne honnete et non sourcee pour les fermes, a verifier en priorite.
    7. Question 8 repondue par condition : ne s'applique pas, la reponse reformulee du point 8 s'appuie sur
       l'historique et le cout de reconstitution, jamais sur une masse critique ni sur une obligation reglementaire.
    8. Monoculture d'agents : ne s'applique pas, inchange.
    9. Gain de productivite vendu a qui facture l'heure : ne s'applique pas si le produit se vend d'abord a la ferme
       (prix revise au point 7) ; a surveiller si la vente glisse vers l'AIP seul comme argument d'heures gagnees.
    10. Barreau 1 public ou grand compte : ne s'applique pas, inchange, l'acheteur qui paie reste prive.
