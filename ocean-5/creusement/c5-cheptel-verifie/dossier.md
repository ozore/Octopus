# Creusement : Cheptel Vérifié

Date : 7 septembre 2026. Agent de creusement c5 cheptel verifie, passe 5, projet Octopus. Échelle reçue du dossier
de tendance aquaculture (`ocean-5/agents/aquaculture/dossier.md`, section f, échelle 1) : une preuve vidéo
horodatée et indépendante du nombre de poissons morts dans une cage, vendue à l'assureur de cheptel pour régler
un sinistre en jours plutôt qu'en mois, puis un index de mortalité vérifié inter fermes, référence de tarification.

## 0. Verdict immédiat

Aucun concurrent ne vend déjà exactement ce produit (section 1) : l'échelle survit à l'étape 1. Mais elle est
fragilisée dès le premier barreau par un problème de consentement non résolu dans le dossier de tendance : les
caméras de cage appartiennent à la ferme, pas à l'assureur ni au fondateur (section 4), et une preuve vendue à
l'assureur peut se retourner contre la ferme qui doit pourtant l'installer et y consentir (section 5, version
aquacole précise de l'interdiction du BRIEF section 5 sur les preuves qui se retournent contre l'acheteur, sauf
qu'ici l'acheteur nommé à l'origine, l'assureur, n'est pas celui qui subit le retournement, c'est la ferme). Le
barreau 1 corrigé (section 2) change donc d'acheteur : la ferme, pas l'assureur, et de posture : preuve qui
protège la ferme plutôt qu'elle ne l'accuse.

## 1. Qui vend déjà cela

Les assureurs aquacoles ne traitent pas les sinistres à vide : ils emploient déjà des experts humains. Sunderland
Marine (assureur spécialisé aquacole, Royaume Uni, depuis 1986) confie ses réclamations de stock (mortalité,
maladie) à une équipe interne d'anciens fermiers et de biologistes marins ; vérifié (sunderlandmarine.com/service/
aquaculture/claims). Miller Insurance (courtier Lloyd's spécialisé) et WTW (Willis Towers Watson, courtier
mondial) mettent en avant des équipes spécialisées et un rôle d'accélérateur de règlement, sans mention de vidéo ;
vérifié. AXA XL utilise déjà une évaluation par satellite pour les gros sinistres de pou de mer (source citée dans
le dossier de tendance, axaxl.com), mais aucune source ne montre un outil vidéo indépendant vendu à un assureur
pour la mortalité elle même. Aucune mention de caméra ou vidéo dans la documentation de claims de Sunderland
Marine consultée directement (WebFetch, page FAQ, 2026) : négatif vérifié, pas une simple lacune de recherche.

Aquabyte et Manolin (déjà cités dans le dossier de tendance) vendent à la ferme, pas à l'assureur. Ace Aquatec
(Royaume Uni) vend une caméra 3D de biomasse sous marine qui mesure poids et taille et sert d'indicateur précoce
de maladie, mais aucun produit nommé de comptage de mortalité dans sa gamme publique ; vérifié. Ace Aquatec note
elle même que deux tiers des mortalités de saumon restent inexpliquées, preuve qu'une ferme équipée d'une caméra
de croissance ne compte pas pour autant ses morts par vidéo. Tidal (caméras sous marines pour cages) vend une
caméra de comportement et de biomasse ; vérifié pour le produit, mais aucune fonction de mortalité nommée
trouvée : supposée absente.

Fait qui change l'analyse technique : la brique de vision par ordinateur est déjà publiée académiquement. MortCam
(ScienceDirect, 2023) détecte la mortalité en système aquacole à recirculation d'eau (RAS, recirculating
aquaculture system) avec un modèle YOLOv7 (You Only Look Once, famille de modèles de détection d'objets en temps
réel) classant chaque poisson vivant ou mort. Des papiers 2024 (DD IYOLOv8, doi 10.3390/fishes9090356 ; YOLOv10
amélioré, arxiv 2409.00388) confirment que la détection est déjà résolue en bassin ou en surface d'étang, pas
encore en cage ouverte en mer. Conséquence : la barrière n'est pas l'algorithme, c'est l'accès aux vraies caméras
et la confiance de la ferme (sections 4 et 5). L'échelle n'est pas tuée à l'étape 1, mais son avantage supposé
(l'IA comme produit) est plus faible que le dossier de tendance ne le laissait entendre.

## 2. Le client du barreau 1, corrigé

AXA XL, nommé par le dossier de tendance, est un assureur mondial peu susceptible d'acheter un module pilote à une
société d'une personne sans référence. Trois acheteurs de taille moyenne, nommés, le remplacent :

1. Sunderland Marine (assureur spécialisé aquacole, Royaume Uni, depuis 1986) : paie déjà à l'heure une équipe
   interne d'anciens fermiers et de biologistes marins pour vérifier chaque sinistre sur place ; vérifié. Un
   module qui accélère le tri des dossiers avant l'expert humain, plutôt que de le remplacer, est un gain de
   temps mesurable pour une petite équipe, sans menacer leur emploi.
2. Convex Insurance (assureur ou réassureur spécialisé, Lloyd's ou Bermudes, ligne dédiée équin, bétail,
   aquaculture) : plus jeune, positionnement technologique affiché, motif d'expérimenter un outil nouveau pour se
   différencier ; vérifié pour la ligne aquaculture, raison d'achat supposée.
3. Brown & Brown (courtier ou agent général américain, division aquaculture dédiée) : marché nord américain,
   proche du Pacifique Nord Ouest et de la Floride visés par le fondateur (BRIEF section 2) ; vérifié pour la
   division, raison d'achat supposée par proximité de marché.

Aucune mutuelle de producteurs nommée pour le saumon industriel en Norvège, en Écosse ou au Canada : lacune. Un
article académique (PMC 6169256) décrit des pools d'assurance mutuelle pour la petite aquaculture dans des pays
en développement, hors du marché ciblé.

Raison précise pour laquelle un acheteur de taille moyenne achèterait à une société d'une personne : aucune des
trois n'est forte à elle seule. C'est le signal le plus sérieux contre le barreau 1 tel que conçu à l'origine
(vente directe à l'assureur) : un assureur qui vérifie déjà ses sinistres avec des experts humains n'a pas de
ligne budgétaire ouverte pour un outil non éprouvé, et n'a aucun moyen de forcer une ferme à partager sa caméra
(section 4). D'où la correction : au barreau 1, le client payeur devient la ferme, pas l'assureur.

Barreau 1 corrigé, mars 2027 : vendu à une ferme de saumon nommée déjà équipée de caméras de cage (par exemple un
site Cermaq Norway ou une ferme écossaise abonnée à Imenco, Ace Aquatec ou Tidal), un service qui transforme le
flux vidéo déjà installé en dossier de sinistre horodaté et vérifiable, prêt à être transmis par la ferme elle
même à son assureur pour accélérer l'encaissement de sa propre indemnité. Prix estimé : 500 à 1 500 $ US par mois
et par site (estimation). Geste manuel remplacé : la compilation par un gestionnaire de ferme de photos, journaux
papier et estimations de mortalité pour appuyer sa propre demande, tarif horaire précis non trouvé (lacune déjà
identifiée dans le dossier de tendance).

## 3. Le produit : six fonctionnalités dans l'ordre de vente

1. Ingestion du flux vidéo des caméras de cage déjà installées par la ferme (Imenco, Ace Aquatec, Tidal ou
   équivalent), sans nouveau matériel à poser : condition de faisabilité solo depuis Vancouver.
2. Horodatage et empreinte numérique (hachage cryptographique) de chaque segment au moment de l'ingestion, pour
   rendre toute modification a posteriori détectable : la brique qui rend la preuve indépendante de la ferme.
3. Détection et comptage automatique des poissons morts par vision par ordinateur, entraîné à partir des méthodes
   publiées (MortCam, DD IYOLOv8, YOLOv10 amélioré) et affiné site par site une fois le pilote démarré.
4. Rapport de sinistre structuré (nombre de morts, date, comparaison au taux de référence de la cage) sans
   interprétation de cause, laissée à l'expert humain, pour ne pas prétendre remplacer Sunderland Marine.
5. Tableau de bord de suivi continu pour la ferme (historique, alerte de sur mortalité) : motif d'achat quotidien
   hors des épisodes de sinistre.
6. Export signé numériquement, transmis par la ferme, pas automatiquement par le fondateur, à son assureur ou
   courtier, avec consentement documenté à chaque envoi : la ferme garde le contrôle, réponse au problème de la
   section 5.

Pourquoi impossible en 2024 : les modèles de détection de poisson mort en image sous marine dégradée qui atteignent
une précision utilisable datent de 2023 à 2024 (MortCam, DD IYOLOv8) ; l'horodatage vérifiable combiné à la
détection n'existait pas comme produit assemblé avant.

Données existantes pour amorcer sans un seul courriel : le jeu de données vidéo public de la revue Data (MDPI, doi
10.3390/data10120211), tourné dans un système RAS commercial au Mexique, plus de dix heures réparties en 31 clips
de 30 secondes, images étiquetées et métadonnées de qualité d'eau ; les méthodes publiées DD IYOLOv8 et YOLOv10
amélioré. Lacune : aucun de ces jeux ne vient d'une vraie cage ouverte en mer (eau trouble, courant, lumière
variable), donc l'entraînement initial reste un point de départ, pas une preuve finale.

## 4. L'actif qui compose, et le test adverse

- Barreau 1 (2027) : un historique horodaté et vérifié sur un ou deux sites pilotes, qui n'existe nulle part
  ailleurs, mais reste petit et non généralisable.
- Barreau 2 (2028) : plusieurs fermes, toujours à l'initiative de la ferme, forment le début d'un index de
  mortalité comparable, condition non garantie tant que le mode de vente reste volontaire, sans levier contractuel.
- Barreau 3 (2030) : si l'adoption dépasse la poignée de pilotes, l'index agrégé et anonymisé devient vendable à
  un réassureur ou courtier (Convex Insurance, Brown & Brown) comme outil de tarification, désormais construit sur
  le consentement des fermes, pas un mandat de l'assureur.
- Barreau 4 (2033) : un consortium d'assureurs accepte le format comme pièce standard de règlement, ce qui
  suppose que les fermes aient trouvé un avantage constant à fournir la preuve, pas seulement lors d'un sinistre.
- Barreau 5 (2036) : historique pluriannuel multi ferme multi assureur, actif qui compose parce qu'aucune donnée
  rétroactive ne peut être reconstituée par un nouvel entrant.

Test adverse : un concurrent avec 5 M$ US en 2031 est Aquabyte ou Manolin, déjà installés chez de nombreuses fermes
avec une relation de confiance et un accès déjà consenti aux caméras. Ils ajoutent un module d'export de sinistre
horodaté à leur produit déjà vendu, sans convaincre une ferme méfiante de donner accès à un inconnu. Le concurrent
échoue seulement si le fondateur a verrouillé assez de fermes avec un historique que personne ne veut perdre en
changeant de fournisseur (coût de changement construit par l'ancienneté des données, pas par la technologie).

## 5. Question 8 et les sept questions

- Question 8 (barreau 5 plus difficile à attaquer) : incertain. L'actif visé (index pluriannuel vérifié) est
  solide en théorie, non reconstructible en un an, mais son existence dépend du problème de consentement de la
  question 2, donc l'atteinte du barreau 5 est incertaine, pas seulement sa défendabilité une fois atteint.
- 1. Qui signe, avec quelle ligne budgétaire : incertain pour l'assureur (aucune ligne ouverte identifiée,
  section 2) ; probable pour la ferme, sur son budget de gestion de sinistre, montant précis non trouvé (lacune).
- 2. La preuve se retourne elle contre lui : oui, documenté. Une vidéo indépendante peut accélérer un paiement
  légitime ou révéler une négligence (sur mortalité mal traitée, alerte ignorée) qui donne à l'assureur un motif
  de réduire l'indemnité, alors que le rapport déclaratif actuel laisse plus de place à la ferme. Version aquacole
  précise de l'interdiction du BRIEF section 5, mais contre la ferme plutôt que contre l'assureur nommé à l'origine.
- 3. L'IA est elle le produit : oui pour la détection, mais l'algorithme est déjà publié (section 1) : l'avantage
  réel est l'intégration, l'horodatage vérifiable et la confiance accumulée, pas le modèle seul.
- 4. Existe t il gratuit ou déjà acheté : non pour un produit assemblé vendu à un assureur ou une ferme (vérifié,
  section 1) ; partiellement oui pour la brique technique de base, déjà publiée gratuitement en académique.
- 5. Faisable seul depuis Vancouver : oui pour le logiciel (entraînable à distance sur données publiques) ; non ou
  très incertain pour l'accès aux vraies caméras norvégiennes ou écossaises sans présence ni confiance établie,
  obstacle que le dossier de tendance original ne traitait pas.
- 6. Une phrase sans acronyme : oui (sections 0 et 2) : une preuve vidéo horodatée du nombre de poissons morts
  dans une cage, vendue à la ferme pour qu'elle soit payée plus vite par son assurance.
- 7. Revient il chaque année avec ses propres données : oui si adopté, chaque saison génère naturellement une
  nouvelle tranche de vidéo et de mortalité, cohérente avec le cycle biologique du saumon.

## 6. Pré mortem : 2031, la société est morte

1. (Probabilité la plus élevée) La ferme refuse ou révoque l'accès à sa caméra dès que la vérification menace de
   jouer contre elle, faute d'obligation légale ou contractuelle qui l'y contraigne. Le secteur a un antécédent
   direct de méfiance envers la caméra comme preuve : des militants ont déjà filmé secrètement des fermes
   écossaises (Sea Shepherd, 2019 ; blog Don Staniford « Green Around the Gills », 2019) parce que les fermiers ne
   montrent pas leurs images volontairement, et ont utilisé ces images contre eux publiquement. Signal avant
   coureur dès 2027 : aucun pilote ne dépasse deux ou trois fermes volontaires après un an, et le renouvellement
   chute après le premier sinistre où la vidéo a été défavorable à la ferme.
2. Aquabyte ou Manolin ajoute un module d'export de sinistre à son produit déjà installé, avec un accès déjà
   consenti aux caméras, rendant l'outil indépendant redondant avant qu'il n'atteigne une masse critique. Signal
   avant coureur : partenariat annoncé entre l'un des deux et un assureur ou courtier aquacole en 2027 ou 2028.
3. Le rapport mensuel déclaratif déjà en place en Norvège et en Écosse (section 7) suffit à la grande majorité des
   sinistres non contestés, limitant le marché réel aux sinistres disputés, un volume probablement trop faible
   pour financer seul le développement. Signal avant coureur : moins de cinq sinistres disputés identifiés en 2027.

## 7. Obligation de déclaration de mortalité, pour situer le marché

Norvège et Écosse : les fermes transmettent un rapport mensuel de mortalité au régulateur (agrégé, déclaratif, pas
vérifié par un tiers), en plus du comptage hebdomadaire de pou de mer au delà de 4 degrés Celsius exigé par
Mattilsynet (autorité norvégienne de sécurité alimentaire) ; vérifié (ScienceDirect, S0044848622010869 et
S0167587725000972). En ferme, la mortalité est déjà suivie au jour le jour en interne, mais seule l'agrégation
mensuelle remonte au régulateur : la vérification indépendante et continue visée par l'échelle n'existe dans
aucun des deux pays comme obligation. Canada : aucune fréquence précise trouvée (lacune), mais un article de
Scientific Reports (nature.com, s41598 024 83876 5) analyse les épisodes de mortalité en Colombie Britannique à
partir de données publiques, preuve qu'une divulgation agrégée existe côté canadien, source précise non
identifiée. Conséquence : la donnée déclarative mensuelle est déjà acceptée par les trois régulateurs, ce qui
confirme que la vraie fenêtre commerciale est le règlement de sinistre, pas le reporting, et qu'elle reste étroite
(section 6, cause 3).

## 8. Test à moins de 2 000 $ et deux semaines

Sur données publiques, sans contacter personne : télécharger le jeu de données vidéo public de la revue Data
(MDPI, doi 10.3390/data10120211, système RAS commercial, Mexique, plus de dix heures étiquetées) et reproduire, à
partir des méthodes publiées de MortCam et DD IYOLOv8, un affinage (fine tuning) d'un modèle de détection ouvert
(YOLOv8) pour distinguer poisson vivant et mort sur image sous marine dégradée. Budget : calcul GPU en nuage,
environ 150 à 400 $ US pour deux semaines (estimation), largement sous 2 000 $. Critère chiffré de succès :
atteindre au moins 85 % de rappel et 80 % de précision sur un sous ensemble de test retenu à part, seuils sous
les 98 à 99 % annoncés par Ace Aquatec pour la biomasse en conditions favorables (thefishsite.com), parce que la
détection de mortalité en image dégradée est plus difficile. Si le seuil n'est pas atteint, ou si les données se
révèlent trop différentes d'une vraie cage en mer pour généraliser, le test échoue et signale que la lacune de
données de cage réelle (section 3) est bloquante avant tout premier appel.

Premier appel, seulement si le test passe : contacter l'équipe de souscription aquaculture de Sunderland Marine
(acheteur le plus cohérent, section 2) avec les résultats du prototype, en proposant un pilote non exclusif avec
deux ou trois fermes volontaires identifiées par Sunderland Marine elle même, positionné comme service à la
ferme, pas comme outil de surveillance de l'assureur.

## 9. Financement

Revenu mensuel plausible, toutes estimations : à 6 mois, 0 $, phase de prototype et de test à 2 000 $, aucun
client signé. À 12 mois, un ou deux sites pilotes payants, 500 à 3 000 $ US par mois (très incertain vu le
problème de consentement, section 5). À 24 mois, extension à cinq à dix fermes et une première licence de données
agrégées à un courtier ou réassureur, 5 000 à 15 000 $ US par mois (optimiste, conditionnel).

Programme de subvention cohérent avec le barreau 2 sans être condition de survie : le Programme d'aide à la
recherche industrielle (PARI, Conseil national de recherches Canada, CNRC), contributions non remboursables à des
PME canadiennes pour la R et D technologique, conseiller dédié, guichet permanent, montant typique de l'ordre de
15 000 à plus de 100 000 $ CAD selon le projet. Modalités générales connues mais non vérifiées par recherche
fraîche ici : supposée, cohérent avec la mention du PARI dans le BRIEF section 2.

## Références

Assurance et courtage : sunderlandmarine.com/service/aquaculture/claims et /faqs (WebFetch direct, 2026, aucune
mention de caméra) ; miller insurance.com ; wtwco.com/en us/solutions/services/aquaculture insurance ;
axaxl.com/insurance/products/aquaculture insurance ; convexin.com/underwriting/equine livestock aquaculture ;
us.bbrown.com/industries/marine/aquaculture insurance ; pmc.ncbi.nlm.nih.gov/articles/PMC6169256 (mutuelles,
hors marché visé).

Caméras en ferme : aceaquatec.com/our story ; thefishsite.com (biomass camera) ; seafoodsource.com (Tidal) ;
fishfarmingexpert.com (caméras Imenco) ; revlightsecurity.com/blog/best underwater cameras for aquaculture sites ;
seashepherd.org/2019/06/17/wild salmon recorded for first time inside fish farms ; donstaniford.typepad.com (Go
Pro camera never lies).

Détection de mortalité et données publiques : sciencedirect.com/science/article/pii/S0144860923000286 (MortCam) ;
doi.org/10.3390/fishes9090356 (DD IYOLOv8) ; arxiv.org/pdf/2409.00388 (YOLOv10 amélioré) ; doi.org/10.3390/
data10120211 (données vidéo public RAS, Mexique) ; academic.oup.com/icesjms/article/82/4/fsaf039/8105847.

Obligations de déclaration : sciencedirect.com/science/article/pii/S016758772200232X et /S0167587725000972
(fréquence Norvège, Écosse) ; fishfarmingexpert.com (mortalité Norvège 2025) ; nature.com/articles/
s41598 024 83876 5 (mortalité publique, Colombie Britannique) ; nature.com/articles/s41598 024 54033 9 (mondial).

Lacunes : aucun tarif horaire précis pour le travail de gestion de sinistre en ferme ; aucune source primaire sur
la fréquence exacte de déclaration de mortalité au Canada ; aucun jeu de données vidéo public d'une vraie cage en
mer ouverte trouvé (seulement RAS et surface d'étang) ; montant du PARI non vérifié par recherche fraîche ; aucune
mutuelle de producteurs nommée dans les marchés visés.

## Résumé en dix lignes

L'échelle Cheptel Vérifié est fragile, vivante seulement sous une forme corrigée. Aucun concurrent ne vend déjà
la vérification vidéo indépendante de mortalité à un assureur ou à une ferme : l'étape 1 ne la tue pas. Mais la
preuve technique existe déjà en public (MortCam, YOLO), donc l'avantage du fondateur n'est pas l'algorithme, c'est
l'accès et la confiance. Le vice caché du dossier original : la preuve accuse potentiellement la ferme, or c'est
la ferme qui possède la caméra et doit consentir à son usage, sans aucun levier pour l'y forcer. Barreau 1 corrigé
: vendre à la ferme elle même, pas à l'assureur, comme service qui accélère son propre encaissement de sinistre,
avec Sunderland Marine comme assureur pilote plutôt qu'AXA XL. Trois marchés (Norvège, Écosse, Canada) acceptent
déjà un reporting mensuel déclaratif non vérifié, ce qui borne le marché réel aux sinistres disputés, un volume
probablement étroit. Le test à 2 000 $ est faisable sur données publiques mais ne prouve que la technique, pas
l'adoption. La cause de mort la plus probable en 2031 n'est pas un concurrent mieux financé : c'est la ferme
elle même, qui retire son consentement dès que la vidéo indépendante cesse de jouer en sa faveur.
