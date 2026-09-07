# Verdict critic-ocean, passe 3 « Fonds marins »

Agent : critic-ocean (écologue marin, ancien gestionnaire d'AMP, bureau d'études en environnement marin ;
habitué du MPO, de NOAA, de l'USACE, de la Commission européenne et des préfectures maritimes).
Rédigé le 07/09/2026, sur pièces uniquement : `BRIEF.md`, `IDEAS.md`, les huit `agents/*/dossier.md`.
**Zéro recherche web** (contrainte de mission). Quand je contredis un dossier ou `IDEAS.md` à partir de ma
propre connaissance du métier, je l'écris en toutes lettres : « je contredis le dossier ».

**Méthode.** Je note ce qui est écrit dans `IDEAS.md`, pas ce qu'un lecteur bienveillant reformulerait.
Les cinq axes valent 5 chacun :
(a) réalité du besoin chez la cible (qui signe le chèque, qui bloque) ;
(b) acceptabilité par régulateurs, pêcheurs, Premières Nations et plongeurs ;
(c) impact réel sur les fonds marins, mesuré en hectares protégés ou restaurés par dollar ;
(d) risque de substitution (5 = personne ne le fait gratuitement, 1 = tout le monde le fait gratuitement) ;
(e) exactitude réglementaire et technique des faits cités.

**Constat d'ensemble.** Les leviers réglementaires sont, dans l'ensemble, bien identifiés et bien datés :
c'est le meilleur corpus des trois passes sur ce point. Ce qui casse, ce sont trois choses répétées douze fois :
(1) des capacités matérielles surestimées, en particulier ce que le satellite voit réellement d'un herbier ;
(2) des payeurs qui n'ont pas de trésorerie (ONG subventionnées, conservancies bénévoles, clubs de plongée) ou
qui ont un intérêt direct à ne pas documenter leur propre empreinte ; (3) un angle mort massif sur les biens
publics gratuits déjà en place (ICES, EMODnet, KelpWatch, Global Fishing Watch, programme SVMP de WA DNR,
suivi électronique à 100 % de la flotte de chalut de fond de C.-B.).

---

## 1. Tableau de notation

| # | Idée | a | b | c | d | e | **Total /25** | Premier « oui » | Premier « non » |
|---|---|---|---|---|---|---|---|---|---|
| 10 | OffsetLedger | 4 | 3 | 3 | 4 | 3 | **17** | Dynamic Ocean / Hemmera sur un suivi déjà sous contrat | Le promoteur (VFPA) et les Nations si la donnée sort de leur contrôle |
| 8 | SpongeSentinel | 3 | 3 | 5 | 2 | 3 | **16** | Un programme de gardiens financé par le PFP Great Bear Sea | MPO Conservation et Protection (VMS + SE à 100 %) |
| 11 | ColonyTrack | 3 | 4 | 3 | 3 | 3 | **16** | Une équipe RSE de sponsor (Mars/Sheba, hôtellerie) | Les 14 organisations ex-FCR3, sans trésorerie |
| 1 | ScarMap | 3 | 4 | 3 | 3 | 2 | **15** | Mayne Island Conservancy / SeaChange (pilote gratuit) | Islands Trust (aucune compétence maritime) |
| 7 | BenthicPipe | 3 | 4 | 2 | 3 | 3 | **15** | Bureau d'études UK de taille moyenne, en marque blanche | Fugro et APEM (interne + référencement fournisseur) |
| 9 | DiveAtlas | 2 | 5 | 3 | 2 | 3 | **15** | Les deux clubs du fondateur, gratuitement | Tout le monde à 100-300 $/mois |
| 4 | ReefInjury | 3 | 4 | 2 | 2 | 3 | **14** | Avocat de la défense ou assureur plaisance, dossier en cours | FDEP (fiduciaire, prestataires accrédités) ; clubs P&I |
| 6 | KelpPulse | 2 | 5 | 4 | 1 | 2 | **14** | SeaChange ou Project Watershed, sur subvention | Washington DNR (programme interne depuis 2000) |
| 5 | SedimentIQ | 3 | 2 | 2 | 4 | 2 | **13** | Un bureau d'études au forfait (Dynamic Ocean, Hatfield) | Mowi, Grieg, Cermaq et le MPO |
| 12 | SeafloorLedger | 2 | 3 | 4 | 1 | 3 | **13** | Oceana Europe, rapport de campagne ponctuel | Les 20 administrations en retard (marchés TED) |
| 2 | PosidoniaProof | 2 | 2 | 4 | 2 | 2 | **12** | Un affréteur de charter voulant une preuve à décharge | Préfecture maritime et CNIL (vidéoprotection) |
| 3 | PlumeWatch | 3 | 2 | 3 | 2 | 2 | **12** | Le bureau d'études qui fait déjà le suivi de turbidité | Le dragueur et l'autorité portuaire |

Moyenne 14,3/25, amplitude 12 à 17. Aucune idée absurde, aucune évidente. Le classement se joue sur (d) et (e),
c'est-à-dire sur « qui le fait déjà gratuitement » et « le fait cité est-il exact ».

---

## 2. Les douze fiches

### 1. ScarMap, 15/25 (a3 b4 c3 d3 e2)
**(e) La capacité satellite est fausse telle qu'écrite, et c'est la thèse du produit.** Un pixel Sentinel-2 fait
10 m sur 10 m, soit 100 m² ; une cicatrice d'ancre dans un herbier fait 0,5 à 3 m de large. Planet Dove à 3,125 m
ne la résout pas davantage. Le satellite cartographie **l'habitat**, jamais la cicatrice : celle-ci se mesure en
photographie aérienne submétrique, au drone à basse altitude ou en plongée. Le dossier tech-underwater-ai le dit
d'ailleurs correctement (Allen Coral Atlas : composition benthique jusqu'à ~10 m de profondeur, dégradée en eau
non claire), mais `IDEAS.md` transforme cette limite de profondeur en capacité de détection de cicatrice.
S'ajoute la fenêtre utile : en mer des Salish il faut cumuler basse mer, faible turbidité, absence de reflet
spéculaire et ciel dégagé ; il reste, mon estimation, deux à cinq scènes exploitables par an, pas une série.
**Islands Trust n'a aucune compétence maritime** (je contredis le dossier canada-pnw et `IDEAS.md`) : c'est un
organisme d'aménagement du sol insulaire ; le fond marin est domaine provincial, la navigation et le mouillage
sont fédéraux (Transports Canada), et les mouillages de cargos du sud des îles Gulf relèvent du protocole
intérimaire d'utilisation des mouillages de la C.-B. et de l'attribution par le Port de Vancouver.
Le parc de bouées est incohérent entre deux dossiers : ~500 dans le FKNMS d'un côté, « plus de 600 dont ~300 dans
la Kristin Jacobs Coral Aquatic Preserve » de l'autre : deux périmètres différents (fédéral sanctuaire contre
préserve d'État du sud-est de la Floride). Enfin l'interdiction d'ancrage en SPA est un **durcissement** d'une
règle qui existe depuis 1997 (bouée obligatoire quand disponible, sinon mouillage sur sable), pas une création.
**(a)** La douleur est réelle mais les payeurs sont des conservancies bénévoles et des agences fédérales.
**(b)** Excellente : protéger la zostère de l'ancre ne fâche personne, l'appli plaisancier est gratuite.
**(c)** Le geofencing plus un champ de bouées empêche réellement le raclage ; la carte de cicatrices, non.
**(d)** Donia existe en Méditerranée, Navionics et Aqua Map affichent déjà des couches d'habitat, NOAA publie ses
polygones : la barrière n'est pas la carte, c'est l'historique validé.

### 2. PosidoniaProof, 12/25 (a2 b2 c4 d2 e2)
**(e) Il n'existe pas de « présomption de préjudice écologique » en droit français** (je contredis `IDEAS.md`).
Les articles 1246 à 1252 du Code civil (loi du 8 août 2016) imposent que le préjudice soit **prouvé et évalué**,
avec réparation en nature en priorité : les décisions Take Off (86 537 €) et My Falcon (22 423 €) sont justement
des évaluations d'expert sur surface détruite. Cela renforce l'utilité de mesurer, mais interdit d'écrire que le
constat suffit. Le fondement pénal à citer est l'article L.415-3 du Code de l'environnement (atteinte à une espèce
protégée, la posidonie l'étant par l'arrêté du 19 juillet 1988), à distinguer de la contravention pour violation
de l'arrêté du préfet maritime ; la fourchette « 15 000 à 150 000 € » mélange les deux régimes.
**Le chiffre « 179 000 bateaux dont ~45 % de plus de 24 m » est numériquement invraisemblable** : la flotte
mondiale de yachts de plus de 24 m se compte en milliers, pas en dizaines de milliers. La chaîne de sourçage est
tertiaire (un site sectoriel résumant un rapport résumant une étude WWF). À retirer ou à reformuler.
**L'AIS ne prouve pas où l'ancre a touché.** Un yacht de 50 m évite sur une longueur de chaîne de cinq à sept fois
la profondeur : l'antenne AIS peut être à 150-250 m du point de croche, et la chaîne balaie un cercle entier.
De plus l'AIS n'est obligatoire qu'à partir de 300 UMS en international (SOLAS ch. V) : le plaisancier est en
classe B volontaire, coupable à volonté. Le produit démontre une **présence en zone**, pas un mouillage sur
posidonie : c'est un indice, pas une preuve.
**Piège opérationnel non vu : installer une caméra filmant le domaine public maritime en France exige une
autorisation préfectorale** (art. L.251-2 du Code de la sécurité intérieure), pas une simple conformité RGPD.
**(a)** Le gestionnaire de ZMEL n'encaisse pas l'amende (elle va à l'État) : il n'a pas de retour sur
investissement. Les assureurs ne couvrent pas les amendes (inassurables), seulement la responsabilité civile.
**(d)** Aux Baléares, un service public de surveillance des mouillages patrouille chaque été depuis 2018, et
Andromède/Medtrix détiennent la cartographie et les marchés publics : le créneau est déjà occupé des deux côtés.
**(c)** Bon score : la posidonie est l'habitat à plus forte valeur par hectare du lot, et la dissuasion marche.

### 3. PlumeWatch, 12/25 (a3 b2 c3 d2 e2)
**(e) Le seuil de turbidité de la Floride est de 29 NTU au-dessus du bruit de fond naturel** (Fla. Admin. Code
62-302.530, eaux de classe III), et de 0 NTU au-dessus du fond dans les Outstanding Florida Waters. **Le « 9 NTU »
repris du dossier industry-benthic est très probablement une lecture erronée de « 29 NTU » sur le formulaire de
l'USACE Jacksonville : je contredis le dossier.** C'est le cœur du produit (« comparaison automatique au seuil du
permis ») : à vérifier au texte avant toute publication.
Second point : « le dragage de Port Everglades » mélange deux chantiers. Le contentieux Earthjustice porte sur le
**Port Everglades Inlet Sand Bypass** (contournement sableux), pas sur l'approfondissement du chenal ; et le
précédent scientifique d'ensevelissement corallien est le dragage du **Port de Miami** (2013-2015). Un maître
d'ouvrage vous jugera sur cette précision-là.
**Le satellite ne fait pas de la conformité.** Sentinel-2 repasse tous les cinq jours, un panache de drague vit
quelques heures et la couverture nuageuse d'été en Floride est forte : le satellite est un outil **forensique et
d'après-coup**, exactement l'usage qu'en font déjà les plaignants. Le permis, lui, impose des mesures in situ à
des stations de fond et de conformité, plusieurs fois par jour, à la méthode néphélométrique prescrite (EPA 180.1
ou ISO 7027), avec des stations qui se déplacent avec le panache : c'est du travail en bateau, pas une bouée
fixe. Une bouée du commerce non conforme à la méthode produit une donnée qui n'est pas de la donnée de conformité.
**(a) Le bon acheteur existe et `IDEAS.md` le rate** : le suivi de turbidité est déjà une ligne du marché de
dragage, payée par l'entrepreneur à un bureau d'études local en condition de permis. Vendre le logiciel à ce
sous-traitant, pas au port ni au dragueur.
**(b)** Le pire terrain de conflit d'intérêt du lot : personne dans la chaîne n'a envie d'une preuve horodatée
contre soi, et l'utile payeur (le plaignant, le régulateur) n'est pas le client visé.
**(d)** Sentinel-2 est gratuit et déjà utilisé par Earthjustice ; les bureaux d'études tiennent le marché.
Le pilote Vancouver ne démontre rien : la turbidité naturelle du Fraser en crue se compte en centaines de NTU et
il n'y a ni corail ni récif, seulement de la zostère à Roberts Bank.

### 4. ReefInjury, 14/25 (a3 b4 c2 d2 e3)
**(e) Le vide de référentiel n'existe pas.** L'évaluation des dommages coralliens aux États-Unis repose depuis
trente ans sur le programme d'évaluation et de restauration des dommages de NOAA et sur l'**analyse d'équivalence
d'habitat** (HEA), méthode éprouvée dans les affaires d'échouement du FKNMS (Wellwood, Elpis, Alec Owen Maitland,
Columbus Iselin) ; la photogrammétrie par structure-from-motion y est déjà pratique courante. Je contredis
`IDEAS.md` : il n'y a pas de barème à inventer, il y a un pipeline à accélérer et à rendre reproductible.
Deuxième précision de droit : §403.93345 est un **texte d'État**, applicable dans les eaux de Floride ; dans les
eaux fédérales du sanctuaire c'est le National Marine Sanctuaries Act (16 U.S.C. §1443) qui s'applique, sans
plafond de 250 000 $, avec coûts de réponse, dommages et intérêts. Et le barème n'est jamais l'essentiel du
recouvrement : le gros de l'argent, ce sont les postes annexes déjà correctement listés par le dossier
reg-coral-usa (coût de restauration, valeur d'usage perdue, coût d'évaluation, coût de suivi, honoraires).
**(a) Le volume tue l'idée.** Mon estimation d'expert, à défaut de chiffre officiel (lacune reconnue par le
dossier) : le FKNMS enregistre de l'ordre de plusieurs centaines d'échouements par an, dont seulement quelques
dizaines donnent lieu à une évaluation formelle ; en Floride du Sud-Est, le programme RIPR traite l'ordre de dix
à vingt incidents significatifs par an. À 2 000-6 000 $ l'expertise, le marché adressable total plafonne autour
de 100 000 à 350 000 $ par an, pour toute la Floride. C'est une activité d'indépendant, pas une société.
**Mauvais segment d'assurance** : les clubs P&I couvrent les navires de commerce ; le volume des échouements
floridiens est du plaisancier et du charter, assuré par des assureurs de responsabilité maritime de détail.
**Permis** : travailler sur des coraux inscrits à l'ESA impose un permis §10(a)(1)(A) pour toute manipulation, un
permis FKNMS pour toute activité dans le sanctuaire, une Special Activity License de la FWC côté Floride, et
l'évaluation se fait sous l'autorité du fiduciaire (le FDEP est « lead trustee »), pas en libre-service.
**(b)** Personne ne s'oppose à mieux mesurer un dommage : le meilleur score d'acceptabilité avec l'idée 11.
**(c)** Mesurer n'a jamais restauré un mètre carré : effet de second ordre, via les sommes recouvrées.
Le lien « FCR3 coupé donc l'État va chercher les pénalités » est un raisonnement, pas un fait : à écrire comme tel.

### 5. SedimentIQ, 13/25 (a3 b2 c2 d4 e2)
**(e) Le déclencheur principal s'effondre à l'examen.** L'obligation de démontrer la récupération benthique
existe **pour autoriser la remise en charge d'un site**. Un site fermé définitivement en 2029 n'a plus ni
obligation ni payeur : l'exploitant qui s'en va n'a aucune raison de financer trois ans de vidéo ROV. La « vague
de suivi de récupération 2026-2029 » n'existe que si le MPO impose des conditions de remise en état, ce qu'aucun
des huit dossiers ne documente. Je contredis `IDEAS.md` sur ce point, qui est son « pourquoi maintenant ».
**Mauvais texte cité.** Les seuils (1 300 et 700 µmol de sulfures libres, couverture de Beggiatoa sur plus de
4 des 6 segments) ne viennent pas du Règlement sur les activités d'aquaculture (2015, qui traite du dépôt de
substances nocives et de la déclaration) mais des **conditions de permis d'aquaculture de poissons marins** prises
sous le Règlement du Pacifique sur l'aquaculture, elles-mêmes héritées du Finfish Aquaculture Waste Control
Regulation de la C.-B. C'est la référence à écrire dans une proposition commerciale.
**L'échéance 2029 est une politique ministérielle de permis, réversible**, annoncée le 19/06/2024, pas un
règlement codifié : la passe 2 avait déjà porté cette correction, elle est perdue ici.
**(a) Le marché est plus mince qu'annoncé** : 40 à 50 fermes, dont 80 à 90 % passent déjà les seuils. La douleur
réelle se concentre sur les 4 à 10 fermes par an qui échouent. Le bon client est le bureau d'études qui facture
au forfait et veut réduire son coût d'annotation, pas l'éleveur.
**L'extension Écosse et Norvège est sous-estimée** : la SEPA raisonne en indice de qualité de l'infaune (IQI) sur
carottes et en modélisation de dépôt, la norme norvégienne NS 9410 en MOM-B (pH/Eh, sensoriel, faune). Ce ne sont
pas des variantes de format d'export, ce sont d'autres protocoles et d'autres modèles à entraîner.
**(b) Le pire terrain politique après PlumeWatch** : l'aquaculture en cages ouvertes divise frontalement les
Premières Nations de la C.-B. (certaines cogèrent, d'autres militent pour le retrait). Un fournisseur perçu comme
l'outil de l'industrie devant le MPO est bloqué d'un côté, et comme l'auxiliaire du MPO, de l'autre.
**(c)** L'empreinte benthique d'une ferme se compte en un à deux hectares : impact faible par dollar.
**(d)** Le meilleur score du lot avec l'idée 10 : personne ne vend ce logiciel, les bureaux d'études annotent à la main.

### 6. KelpPulse, 14/25 (a2 b5 c4 d1 e2)
**(d) Le pire risque de substitution des douze, et il vient de faits que les dossiers ont manqués.**
Washington DNR n'est pas un prospect vierge : le Nearshore Habitat Program exploite depuis 2000 le Submerged
Vegetation Monitoring Program (vidéo tractée sous-marine, plan d'échantillonnage statistique de la zostère du
Puget Sound) et cartographie la canopée de kelp flottant par imagerie aérienne depuis 1989. Vendre de la
télédétection kelp à WA DNR, c'est vendre au titulaire de la série temporelle de référence. Je contredis
`IDEAS.md` et le dossier canada-pnw sur ce point.
**KelpWatch n'est pas mort parce qu'un WebFetch a échoué** : c'est un produit vivant et gratuit, série Landsat
depuis 1984, couvrant la Californie, l'Oregon, Washington et la Basse-Californie. Écrire « site inaccessible »
comme s'il s'agissait d'une absence de concurrent est une faute de méthode à corriger dans le rapport final.
S'ajoutent les relevés aériens annuels de canopée de la CDFW en Californie (depuis 1989) et le Hakai Institute.
**(e) Deux capacités surestimées.** Le kelp flottant se détecte à 10 m, mais la canopée de *Nereocystis* se
submerge dès que le courant dépasse environ un demi-nœud : sans filtrage marée et courant, la série temporelle
mesure la marée, pas le kelp. Et la **zostère du Puget Sound et de la mer des Salish est majoritairement
subtidale, entre 2 et 6 m d'eau turbide : elle est invisible au satellite optique**, alors qu'elle représente une
grande part de l'objectif de 10 000 acres. Enfin les **barrens d'oursins ne sont pas détectables depuis l'orbite**
(substrat rocheux subtidal) : ils se constatent en plongée ou au ROV. Retirer cette promesse.
**(a)** SB 5619 ne crée ni permis, ni sanction, ni obligation d'achat : c'est un objectif et un rapport biennal.
Les acheteurs sont des ONG sur subvention et des agences avec un programme interne. Le crédit d'affectation
fédéral de 2,521 M$ de l'Oregon Kelp Alliance est un earmark FY2024, non récurrent.
**(b) 5/5, le meilleur du lot** : personne, nulle part, ne s'oppose au kelp. Restauration de plus en plus portée
par les Premières Nations (Tseshaht et PUHA sur les oursins) : partenariat naturel, sous réserve de gouvernance
des données.
**(c)** Kelp et zostère sont les habitats à plus forte valeur du terrain immédiat du fondateur, d'où le 4.
Le crédit carbone kelp n'est pas un revenu : aucune méthodologie acceptée, et l'étude 2026 montrant que plus de
90 % de la biomasse coulée se dégrade en une centaine de jours ferme le sujet plutôt qu'elle ne l'ouvre.

### 7. BenthicPipe, 15/25 (a3 b4 c2 d3 e3)
**(e) Trois nuances à porter.** Le document MMO du 16/07/2025 (mis à jour le 09/03/2026) **standardise la méthode
de collecte, de saisie et de stockage** ; l'obligation juridique, elle, est dans les conditions de chaque Marine
Licence. Écrire « inscrite dans les Marine Licences » laisse croire à une norme auto-exécutoire : c'est un guide
dont la MMO attend l'application. Ensuite, ce guide couvre les **eaux anglaises** : les 11,7 GW en construction
sont un chiffre britannique incluant l'Écosse (Marine Directorate) et le pays de Galles (NRW), qui ne relèvent pas
de la MMO. Enfin le « 1,2 M£ pour un relevé benthique de 1 GW » vient d'un guide sectoriel secondaire, marqué
« estimation » par le dossier industry-benthic et présenté comme un fait par `IDEAS.md`.
**Le goulot n'est pas là où le produit se place.** Dans un relevé benthique britannique, le poste dominant est la
taxonomie macrofaunistique sur bennes (identification à l'espèce par un analyste accrédité NMBAQC) et la
granulométrie, pas l'annotation de vidéo tractée. La vidéo sert au codage d'habitat et à l'évaluation des récifs
annexe I. Un tiers gratuit du coût, au mieux : le marché adressable réel pour un annotateur assisté est de
l'ordre de 60 à 180 k£ par projet de 1 GW, réparti sur des années et entre plusieurs prestataires.
**Ce qu'il faut produire pour être achetable** : un export codé selon la Marine Habitat Classification for
Britain and Ireland (et son alignement EUNIS/types d'habitats larges DCSMM), avec métadonnées conformes MEDIN, et
une validation contre les exercices d'inter-comparaison NMBAQC. C'est cela, la barrière, pas le modèle de vision.
**(a)** Vrai budget récurrent, vrais clients solvables, mais référencement fournisseur lourd (ISO 9001/14001/45001,
assurances, accords-cadres) : une société d'une personne au Canada aura du mal à entrer chez Fugro ou Gardline.
Viser un bureau de taille moyenne, en marque blanche, est le bon instinct de `IDEAS.md`.
**(b)** Neutre à bonne : pas de pêcheurs, pas de Premières Nations, pas de plongeurs dans la boucle.
**(c) Le plus faible impact des douze** : on annote mieux un relevé qui aurait lieu de toute façon.
**(d)** BIIGLE et VIAME sont gratuits, SQUIDLE+ aussi, et Fugro comme APEM développent en interne : le
différenciateur est le format réglementaire, il est imitable en un trimestre par un concurrent installé.
**Piège de licence** : BenthicNet agrège des jeux dont les licences diffèrent (certaines non commerciales).
Entraîner un modèle **commercial** dessus sans vérifier composant par composant est une infraction de licence.

### 8. SpongeSentinel, 16/25 (a3 b3 c5 d2 e3)
**(c) Le meilleur impact par dollar des douze, et de loin.** Les récifs d'éponges siliceuses du détroit d'Hécate
sont les seuls récifs hexactinellides vivants connus, structures de plusieurs milliers d'années, détruits
irréversiblement par un seul passage de chalut. Empêcher une incursion protège des hectares pour des siècles.
**(d) Mais le fait qui décide est absent des huit dossiers, et je l'apporte de ma propre connaissance : la flotte
de chalut de fond du poisson de fond de C.-B. est sous suivi électronique et journal de bord à 100 % depuis 1996,
en plus du VMS.** Le MPO sait déjà, tow par tow, où chaque chalut a travaillé. La proposition de valeur
« détecter le chalutage en zone fermée » est donc largement déjà servie pour la flotte visée. À noter aussi que
l'amende de 33 596 $ du 24/05/2024 concerne un **palangrier au flétan**, pas un chalutier, et que cette pêcherie
est elle aussi sous suivi électronique intégral. Ce qui reste comme vrai vide : les navires sans AIS ni VMS, les
mouillages prolongés de cargos, la pose de câbles, et surtout le fait que le MPO **ne partage pas** son VMS en
temps réel avec les gardiens autochtones. Le produit est une réponse à un problème de gouvernance de la donnée,
pas à un problème de détection : il faut le vendre ainsi.
**Le « pourquoi maintenant » réel manque aussi.** Le réseau d'AMP du plateau Nord est financé par le mécanisme de
financement de projet pour la permanence de la mer du Grand Ours (annoncé en juin 2024, de l'ordre de 335 M$ CAD
dont environ 200 M$ philanthropiques), qui finance explicitement les programmes de gardiens et le suivi. C'est
l'argent de la cible, et il transite par la gouvernance des Nations, pas par un contrat MPO. À ajouter.
**(e)** L'AIS n'est obligatoire qu'à partir de 300 UMS en international : la plupart des chalutiers de C.-B. sont
sous ce seuil et peuvent ne pas en émettre ; la valeur des alertes AIS sur cette flotte est donc structurellement
limitée, ce que `IDEAS.md` mentionne trop brièvement (« les incursions courtes échappent à l'AIS » est plus faible
que la réalité). Vérifier par ailleurs si le règlement d'exécution 2022/1614 a été modifié depuis 2022 : il a fait
l'objet de recours d'États membres devant le juge de l'Union, ce qu'aucun dossier ne signale.
**(b)** Excellente avec les gardiens, à condition d'un accord de gouvernance des données en amont ; mauvaise avec
les pêcheurs, pour qui une carte d'incursions est un dossier à charge.
**(d)** Global Fishing Watch est gratuit, Skylight est gratuit pour les gestionnaires qualifiés, OceanMind vend
aux gouvernements : la substitution est très haute sur la donnée, moyenne sur l'ergonomie et les polygones validés.

### 9. DiveAtlas, 15/25 (a2 b5 c3 d2 e3)
**(a) Le payeur n'existe pas, et c'est rédhibitoire tel que rédigé.** Un club de plongée de C.-B. est une
association bénévole dont le budget annuel se compte en milliers de dollars : il ne paiera pas 100 à 300 $ par
mois. Une boutique le pourrait, si l'outil vend des cours. Le marché régional est par ailleurs minuscule : mon
estimation, 15 à 25 boutiques en C.-B. et 20 à 30 dans l'État de Washington, soit un plafond de 30 à 90 k$ par an
si tout le monde signe, ce qui n'arrivera pas. Les 6 600 centres PADI et les 346 opérations Green Fins sont des
chiffres tropicaux : ils n'ont rien à voir avec le marché adressable décrit et ne doivent pas figurer dans la même
phrase que « les deux clubs du fondateur ».
**(e) Le crabe vert européen n'est pas une espèce que voient les plongeurs.** Il est intertidal et subtidal très
peu profond, et il se détecte au casier, pas à la bouteille : c'est ainsi que travaillent le MPO et les équipes
de restauration côtière. Annoncer la détection précoce du crabe vert par un réseau de plongeurs est une erreur de
biologie qui décrédibilise l'ensemble auprès du premier gestionnaire consulté. Les tuniciers envahissants, en
revanche, sont un bon candidat (fixés, photographiables, sur quais et substrats durs).
**Le volet hydrophone porte trois autorisations que `IDEAS.md` ignore** : poser un instrument sur une bouée exige
l'accord du propriétaire de la bouée (tenure de terres domaniales provinciale pour un corps-mort privé, permis de
recherche de Parcs Canada dans une réserve de parc national) ; poser dans une aire de conservation du sébaste ou
une AMP exige une autorisation du MPO ; et tout enregistrement acoustique en mer des Salish croise le dossier
très surveillé des épaulards résidents du Sud, où opèrent déjà Ocean Networks Canada, Orcasound (réseau ouvert et
gratuit) et JASCO.
**Licences de données, le point qui tue la ligne « licence 10 à 40 k$ aux agences »** : les photos appartiennent
aux plongeurs, iNaturalist laisse chaque observateur choisir sa licence (beaucoup en non commercial), et vendre
un atlas construit sur du bénévolat sans consentement explicite est un risque autant réputationnel que juridique
dans un milieu petit et connecté.
**(b) 5/5** : c'est l'idée que tout le monde accepte, plongeurs, ONG, agences, Nations.
**(c)** Réel si les espèces cibles sont visibles en plongée, faible sinon ; la donnée de présence ne protège rien
par elle-même. La visibilité en mer des Salish, souvent inférieure à 3 m d'avril à octobre, dégrade la donnée.

### 10. OffsetLedger, 17/25 (a4 b3 c3 d4 e3)
**La meilleure note, et pour une seule raison : c'est la seule idée du lot adossée à une obligation
pluriannuelle, opposable, assortie d'une garantie financière saisissable, chez un payeur solvable, à trente
minutes de Vancouver.** Le suivi post-compensation est une condition d'autorisation au titre de la Loi sur les
pêches : c'est une ligne budgétaire existante, pas une intention.
**(e) Trois corrections.** Un, les prix de 30 000 à 360 000 $ l'acre-crédit cités pour la Floride sont des prix
de crédits de **zones humides** évalués à l'UMAM ; les impacts sur herbiers y sont le plus souvent compensés en
mesures à la charge du pétitionnaire ou via des banques d'herbiers spécifiques, pas au prix des zones humides.
Transposer l'un à l'autre est une erreur de marché. Deux, la ventilation de Roberts Bank T2 (177 ha détruits
contre 86 ha compensés hors site) provient d'une tribune d'opinion et d'un dossier d'évaluation, pas du plan de
compensation lui-même : la part sur site et hors site diffère selon les sources, à revérifier avant publication,
de même que l'échéancier de construction « 2024-2030 », vraisemblablement optimiste. Trois, l'ADN
environnemental n'est demandé par aucune ligne directrice de suivi du MPO : les métriques attendues pour la
zostère sont la densité de pousses, l'étendue et la persistance sur cinq ans. Ne pas mettre l'eDNA en avant.
**(a)** Le bon client est le bureau d'études, pas le promoteur : le promoteur veut dépenser le minimum qui
satisfait le MPO et garder la main sur le récit ; c'est le même piège de « preuve retournée contre le client »
que dans les idées 3 et 5, en plus feutré.
**(b)** Le MPO est neutre à favorable, le promoteur méfiant, et les Nations (Tsawwassen, Musqueam sur Roberts
Bank) sont au centre : le suivi d'un site de compensation en territoire non cédé se contracte avec elles.
**(c)** Le suivi ne crée pas d'habitat, mais l'échec chronique des compensations est un problème systémique
documenté : prouver l'échec est le seul levier qui change la pratique. D'où 3 et pas 2.
**(d) 4/5** : personne ne vend cela, aucune plateforme MRV marine canadienne identifiée, le MPO n'en construira
pas. C'est le meilleur couple (a)(d) du lot.
**Vigilance** : tout rapport remis au MPO au titre d'une autorisation devient un document détenu par une
institution fédérale, donc communicable au titre de la Loi sur l'accès à l'information. Licencier un accès,
livrer des rapports, ne pas livrer la base.

### 11. ColonyTrack, 16/25 (a3 b4 c3 d3 e3)
**Le bon point : `IDEAS.md` écrit noir sur blanc qu'il n'y a pas de diagnostic SCTLD par photo, et que la mesure
de croissance en 3D est une capacité « supposée » à valider par pilote.** C'est la seule fiche des douze qui
assume une incertitude technique au lieu de la maquiller. À conserver mot pour mot dans le rapport final.
**(e) Quatre corrections.** Un, la re-identification visuelle de colonies entre campagnes est le cœur du produit
et n'est démontrée nulle part : une colonie change de forme (croissance, mortalité partielle, blanchiment) ; la
pratique de terrain repose sur des étiquettes physiques plus la photo. Il faut le dire, ou le pilote sera un
échec public. Deux, la période de FCR3 diffère entre deux dossiers (28,5 M$ « 2023-2025 » pour reg-coral-usa,
« 2023-2026 » pour dive-restoration-market) : trancher. Trois, l'autorisation de crédits de la CRCA à 45 M$ par
an court jusqu'à l'exercice 2027 et les crédits réellement votés tournaient autour de 33 M$ : la trajectoire
fédérale du financement corallien en 2026 est baissière, ce qui affaiblit et non renforce le « pourquoi
maintenant ». Quatre, Coral Gardeners n'est pas un client : cette organisation développe et communique sa propre
plateforme de suivi de récif instrumentée. Je contredis ici le dossier tech-underwater-ai, qui classe « ReefOS »
en acteur non identifié.
**(a) Le pire moment pour vendre à la cible principale** : on ne vend pas un abonnement à quatorze organisations
qui viennent de perdre leur financement d'État et qui parlent de licenciements. Le payeur crédible est le sponsor
(équipe RSE) ou le bailleur, tous deux à un cran de distance et tous deux embarrassés par une vérification tierce
qui reviendrait à dire qu'ils ne croient pas leur partenaire.
**Permis et établissement** : manipuler des coraux inscrits à l'ESA exige un permis §10(a)(1)(A), toute activité
dans le sanctuaire un permis FKNMS, toute collecte en Floride une Special Activity License de la FWC. Une société
canadienne travaillant commercialement en eaux américaines doit en outre régler immigration et cabotage.
**(b) 4/5** : NOAA, les ONG et les plongeurs sont favorables ; la seule résistance est celle d'un opérateur dont
la vérification indépendante montrerait un mauvais taux de survie.
**(c)** La restauration corallienne elle-même est contestée dans son rapport coût-efficacité (coût médian de
l'ensemencement larvaire cité à ~830 000 $ l'hectare) : mieux allouer ces dollars a de la valeur, mais l'ordre de
grandeur des surfaces reste modeste (l'objectif Mars de 185 000 m² représente 18,5 hectares).
**(d)** MERMAID, ReefCloud et CoralNet sont gratuits mais ne suivent pas la colonie : le créneau est réel.
En face, Agisoft à 3 499 $ perpétuel et les protocoles publiés de Mission: Iconic Reefs fixent déjà un standard.

### 12. SeafloorLedger, 13/25 (a2 b3 c4 d1 e3)
**(e) L'objectif marin de 2030 n'est pas 20 %.** Le règlement (UE) 2024/1991 fixe à son article 1 un objectif
d'ensemble de mesures de restauration couvrant au moins 20 % des zones terrestres **et** marines de l'Union d'ici
2030 ; l'objectif propre aux habitats marins de l'annexe II est, à l'article 5, de **30 % de la surface non en
bon état d'ici 2030**, 60 % d'ici 2040 et 90 % d'ici 2050. `IDEAS.md` fusionne les deux et sous-estime la cible
2030. Je contredis `IDEAS.md` et le dossier reg-europe-benthic sur ce point : à revérifier à l'article 5 avant
publication, mais l'écriture actuelle est en tout état de cause ambiguë.
**(d) 1/5, le pire du lot, pour une raison structurelle.** L'empreinte de pêche de fond en eaux européennes est
déjà produite chaque année, de façon officielle et gratuite, par le CIEM à partir des données VMS et journaux de
bord des États (couches d'abrasion des fonds et de ratio de surface balayée alimentant les évaluations DCSMM,
OSPAR et HELCOM), et la couche d'habitats de référence est EMODnet Seabed Habitats / EUSeaMap, gratuite et
codée EUNIS. Reconstruire une empreinte dérivée de l'AIS, c'est produire une donnée **moins bonne** (l'AIS rate
les navires de moins de 15 m et souffre de trous de couverture) que le produit public de référence. `IDEAS.md`
cite bien le CIEM et le JRC comme « concurrents publics, non commerciaux », mais un bien public gratuit et
faisant autorité ne concurrence pas un produit payant : il le supprime.
**(a) Barrière structurelle non vue : une société canadienne d'une personne ne peut pas répondre à un marché
public d'État membre ni à un appel TED** (références, capacité financière, souvent établissement dans l'Union).
La voie réaliste est la sous-traitance chez un bureau d'études européen, ce que la fiche évoque pour l'idée
voisine du dossier reg-europe mais pas ici. Et une administration en retard sur une échéance ne se met pas à
acheter à un fournisseur étranger : elle mobilise son marché-cadre (ERM, Ramboll, RSK, Deltares, Ifremer, Cefas).
**(b)** Bonne avec les ONG et la Commission, franchement mauvaise avec les pêcheurs et avec les États mesurés :
c'est un produit d'accusation. L'Allemagne, l'Espagne, le Portugal, l'Italie, l'Irlande et le Danemark se sont
publiquement opposés au plan d'action pêche.
**(c) 4/5** : le chalutage de fond est la première pression physique sur le fond marin européen, l'échelle est
continentale, et le trou du seuil D6C5 est un vrai sujet de méthode. Mais la contribution marginale d'un
fournisseur seul est faible, et le seuil finira par être fixé par un avis du CIEM, gratuit.
**Sur D6C5** : c'est intellectuellement l'angle le plus intéressant des douze idées, et commercialement le pire.

---

## 3. Classement par impact sur les fonds marins (hectares protégés ou restaurés par dollar)

1. **SpongeSentinel (8)** : un passage de chalut évité sur un récif d'éponges siliceuses protège des hectares de
   structure vieille de milliers d'années, irremplaçable à échelle humaine. Meilleur rapport du lot, sans rival.
2. **SeafloorLedger (12)** : la seule idée à l'échelle continentale, sur la première pression physique du fond
   marin européen. Impact potentiel énorme, contribution marginale du fournisseur faible.
3. **KelpPulse (6)** : kelp et zostère sont les habitats structurants du terrain immédiat du fondateur ; la
   donnée oriente réellement le choix des sites de restauration. Pénalisé parce que mesurer n'est pas protéger.
4. **PosidoniaProof (2)** : l'habitat à plus forte valeur par hectare du lot (une matte de posidonie représente
   des siècles), et une dissuasion dont on sait qu'elle fonctionne quand la surveillance est visible.
5. **ScarMap (1)** : le geofencing plus un champ de bouées empêche physiquement le raclage. C'est de la
   prévention, pas de la mesure : ce qui vaut le classement, c'est l'appli plaisancier, pas l'atlas de cicatrices.
6. **PlumeWatch (3)** : un panache maîtrisé évite l'ensevelissement de dizaines d'hectares de récif (précédent du
   Port de Miami), mais l'outil documente bien plus souvent qu'il ne modifie une opération de dragage.
7. **OffsetLedger (10)** : agit sur la qualité des compensations, dont l'échec chronique est le problème.
8. **ColonyTrack (11)** : améliore l'allocation de dollars de restauration dont le coût par hectare est extrême.
9. **DiveAtlas (9)** : la détection précoce d'invasifs a un fort effet de levier, si les espèces sont visibles.
10. **SedimentIQ (5)** : l'empreinte sous une ferme se compte en un à deux hectares.
11. **ReefInjury (4)** : mesurer un dommage déjà survenu ; effet uniquement via les sommes recouvrées.
12. **BenthicPipe (7)** : annoter mieux un relevé qui aurait lieu de toute façon. Aucun mètre carré protégé.

## 4. Classement par chance d'être acheté

1. **OffsetLedger (10)** : obligation pluriannuelle, garantie financière saisissable, payeur solvable, premier
   client à trente minutes. La seule ligne budgétaire du lot qui existe déjà et qui ne dépend pas d'une subvention.
2. **BenthicPipe (7)** : budget commercial récurrent, facturation à l'acte, pas de dépendance à la subvention.
   Frein réel : le référencement fournisseur chez des groupes qui développent en interne.
3. **SedimentIQ (5)** : obligation réglementaire vérifiée, clients identifiés et proches, mais marché mince et
   déclencheur de récupération 2029 à reconstruire.
4. **ReefInjury (4)** : les assureurs et les avocats paient volontiers une expertise, mais le volume annuel
   plafonne l'affaire au niveau d'un indépendant.
5. **ScarMap (1)** : beaucoup de petits clients possibles, aucun avec de la trésorerie ; le vrai chèque est un
   accord de coopération NOAA, à cycle long.
6. **ColonyTrack (11)** : le sponsor peut payer, l'ONG non ; le produit doit être vendu comme assurance de marque.
7. **PlumeWatch (3)** : la ligne budgétaire existe chez le sous-traitant de suivi, mais tout le monde en aval a
   intérêt à ne pas acheter la preuve.
8. **SpongeSentinel (8)** : l'argent existe (mécanisme de financement pour la permanence), le cycle de décision
   autochtone et fédéral est long, et le MPO peut répondre « nous avons déjà le VMS ».
9. **PosidoniaProof (2)** : gestionnaires sans retour sur investissement, assureurs qui ne couvrent pas l'amende,
   et une autorisation préfectorale de vidéoprotection à obtenir avant la première caméra.
10. **KelpPulse (6)** : agence avec programme interne, ONG sur subvention, concurrent gratuit historique.
11. **SeafloorLedger (12)** : marchés publics inaccessibles à une société non établie dans l'Union.
12. **DiveAtlas (9)** : la cible ne peut structurellement pas payer le prix affiché.

**Une seule idée figure dans les six premiers des deux classements : ScarMap, et de justesse.** Aucune idée n'est
à la fois en tête de l'impact et en tête de la vente : c'est le vrai résultat de cette évaluation. Si le fondateur
veut du chiffre d'affaires en six mois, c'est **OffsetLedger**, en assumant que le récit « fonds marins » y est
tiède (on vend un logiciel de conformité à un bureau d'études). S'il veut l'impact, c'est **SpongeSentinel**, en
assumant deux ans de construction de relation avec les Nations avant le premier dollar. Ce qui serait une erreur,
c'est de traiter ces deux-là comme interchangeables : ils ne répondent pas à la même question.

---

## 5. Dix pièges juridiques et éthiques transverses

**1. Licences des jeux de données d'entraînement (idées 1, 4, 5, 6, 7, 9, 11).** BenthicNet agrège des sources
aux licences hétérogènes (dont des clauses non commerciales), CoralNet n'affiche pas de licence explicite,
FathomNet laisse le contributeur choisir, SQUIDLE+ n'en publie pas. Entraîner un modèle **commercial** sur ces
corpus sans audit composant par composant est une infraction contractuelle, et une infraction que les
propriétaires académiques repèrent vite dans un milieu petit. **Règle** : cartographier les licences avant la
première époque d'entraînement, documenter la provenance, et préférer un modèle affiné sur données propres.

**2. Conditions d'utilisation de Global Fishing Watch et de l'AIS communautaire (idées 2, 8, 12).** L'API GFW est
gratuite pour la recherche et l'impact, avec attribution obligatoire ; les jeux téléchargeables sont sous licence
de type partage à l'identique. Revendre 150 à 800 $ par mois des alertes dérivées de cette donnée exige une
autorisation explicite, et le partage à l'identique peut contaminer votre base dérivée. AISHub fonctionne par
réciprocité (vous devez alimenter le réseau), ce qui est incompatible avec une exclusivité de données promise à
un client. **Règle** : obtenir un accord écrit de GFW avant de facturer quoi que ce soit qui en dérive.

**3. La preuve retournée contre le client (idées 2, 3, 5, 7, 10).** C'est le piège commercial le plus
sous-estimé du corpus, et il frappe cinq idées sur douze. Un journal horodaté de conformité documente aussi les
non-conformités. Aux États-Unis, il n'est couvert par aucun secret professionnel et il est communicable en
« discovery » ; au Canada, la protection contre l'auto-incrimination est faible en matière d'infraction
réglementaire sous la Loi sur les pêches. Un exploitant aquacole, un dragueur ou un promoteur qui comprend cela
n'achète pas. **Règle** : le client contrôle la rétention, la durée de conservation et la divulgation, ou le
produit est invendable à sa propre cible.

**4. Recevabilité de la preuve et statut d'expert (idées 2, 3, 4, 8, 12).** Aux États-Unis, la méthode doit
survivre à un examen Daubert (règle 702 des Federal Rules of Evidence : revue par les pairs, taux d'erreur connu,
acceptation dans la discipline) et le système doit être authentifié (règle 901(b)(9)) ; vos jeux d'entraînement,
vos versions de modèle et vos journaux deviennent communicables. En France, un « constat » opposable est dressé
par un commissaire de justice ou par un agent assermenté et commissionné (art. L.172-1 du Code de
l'environnement) : le rapport d'une société privée est au mieux un commencement de preuve. Au Canada, l'expert
doit démontrer son indépendance et son impartialité. **Règle** : vendre le protocole et l'outil aux acteurs
qualifiés, jamais la conclusion ; publier la méthode ; souscrire une assurance responsabilité professionnelle.

**5. Surveillance de personnes, RGPD et vidéoprotection (idées 1, 2, 8).** Un nom de navire, un MMSI ou une
immatriculation deviennent des données personnelles dès qu'ils sont rattachables à une personne identifiable.
En France, installer une caméra filmant le domaine public maritime relève d'une **autorisation préfectorale**
(art. L.251-2 du Code de la sécurité intérieure), au-delà des obligations RGPD, avec information des personnes et
durée de conservation limitée. Au Canada s'appliquent la LPRPDE et la loi sur la protection des renseignements
personnels de la C.-B., qui n'offrent pas d'équivalent de l'intérêt légitime européen. **Règle** : indexer sur la
coque et la position, jamais sur le propriétaire ; ne rien revendre qui contienne un identifiant de personne.

**6. Données autochtones, OCAP et gouvernance de la mer du Grand Ours (idées 1, 5, 6, 8, 9, 10).** L'obligation
de consulter lie la Couronne, pas un fournisseur privé, mais elle se répercute par les conditions du MPO et de la
province, renforcée par la loi de la C.-B. sur la Déclaration des Nations Unies. Toute collecte sur territoire
Heiltsuk, Kitasoo/Xai'xais, Nuu-chah-nulth, Kwakwaka'wakw ou Coast Salish relève des principes **OCAP**
(propriété, contrôle, accès, possession) : sans entente de gouvernance des données, l'accès au terrain est refusé
et le canal MPO se ferme. Les Nations disposent de leurs propres programmes de gardiens, désormais financés :
**contracter avec eux, ne jamais les concurrencer ni héberger leurs données hors de leur contrôle.**

**7. Permis de plongée, de ROV, de drone et de sonar actif (idées 1, 4, 9, 11).** Le travail sous-marin rémunéré
est de la plongée professionnelle (partie 24 du règlement de WorkSafeBC au Canada, 29 CFR 1910 sous-partie T aux
États-Unis) : on ne fait pas travailler des plongeurs de loisir. En Floride, toute activité dans le sanctuaire
exige un permis FKNMS, toute collecte une Special Activity License de la FWC, et toute manipulation d'un corail
inscrit à l'ESA un permis §10(a)(1)(A). En C.-B., le travail scientifique en AMP ou en aire de conservation du
sébaste passe par le MPO, et par un permis de recherche de Parcs Canada dans une réserve de parc national. Le
drone exige un certificat de pilote et l'enregistrement de l'appareil au Canada, une certification Part 107 aux
États-Unis, plus une autorisation d'espace aérien : le port de Vancouver et Coal Harbour sont sensibles. Enfin,
un **sonar actif** en zone à mammifères marins peut constituer un harcèlement au sens de la loi américaine sur
les mammifères marins et croise la Loi sur les espèces en péril au Canada : ce n'est pas neutre.

**8. Lois d'accès à l'information et au document public (toutes les idées vendues à une agence).** Ce que vous
livrez peut être publié. La loi de l'État de Washington sur les documents publics est très large et sans exemption
générale de secret d'affaires ; le chapitre 119 des Florida Statutes est parmi les plus ouverts des États-Unis ;
au Canada s'appliquent la Loi sur l'accès à l'information et la loi de la C.-B. sur l'accès et la protection de la
vie privée, qui impose souvent l'hébergement au Canada par contrat ; en Europe, la directive 2003/4/CE sur
l'accès à l'information environnementale joue dans le même sens. **Règle** : licencier un accès, pas livrer une
base ; remettre des rapports ; identifier et justifier les éléments confidentiels dans le contrat lui-même.

**9. Marchés publics et établissement (idées 1, 3, 8, 12).** Une société d'une personne établie au Canada ne peut
pas répondre à un appel d'offres TED ni à un marché-cadre d'État membre (références, capacité, souvent
établissement dans l'Union) : la seule voie est la sous-traitance chez un titulaire européen. Aux États-Unis, il
faut un enregistrement SAM et un identifiant UEI, se conformer au FAR et parfois à des préférences nationales.
Au Canada, l'achat fédéral sous seuil peut passer par un préavis d'adjudication de contrat, mais un abonnement
mensuel n'est pas un véhicule d'achat naturel pour Parcs Canada ou le MPO : prévoir un contrat annuel.

**10. Allégation de capacité, responsabilité et écoblanchiment (idées 4, 6, 10, 11, 12).** Vendre un
« diagnostic » non validé (SCTLD par photo RGB, mesure de croissance en 3D, re-identification de colonie,
dépassement d'un seuil de permis) engage votre responsabilité professionnelle dès qu'une décision réglementaire
ou financière s'appuie dessus. Sur le volet crédits carbone et biodiversité, la directive (UE) 2024/825
(transposition au 27/03/2026, application au 27/09/2026) interdit les allégations environnementales génériques
non étayées, et l'article 12 de la loi française Climat et résilience encadre la neutralité carbone alléguée.
**Règle** : écrire « capacité supposée » dans le contrat comme dans le dossier, plafonner contractuellement la
responsabilité, et budgéter une assurance responsabilité professionnelle, poste jamais compté dans un amorçage
à moins de 25 k$ CAD.

**Piège bonus, à ne pas perdre.** Un balayage sonar systématique du fond finit par détecter des épaves et des
sites archéologiques : la Heritage Conservation Act de la C.-B. protège automatiquement les sites antérieurs à
1846 et impose une déclaration ; en Floride, les épaves du sanctuaire sont protégées. Prévoir une procédure de
signalement et une politique de non-divulgation des coordonnées.

---

## 6. Les dix corrections factuelles à porter dans le rapport final

1. **Ce que Sentinel-2 voit vraiment d'un herbier (idées 1, 6, 12).** Un pixel Sentinel-2 vaut 100 m², Planet
   Dove environ 10 m² : **aucun des deux ne résout une cicatrice d'ancre de 0,5 à 3 m de large**. Le satellite
   cartographie l'étendue de l'habitat, la cicatrice se mesure en aérien submétrique, au drone bas ou en plongée.
   Ajouter la limite documentée par l'Allen Coral Atlas lui-même (composition benthique jusqu'à ~10 m en eau
   claire, erreurs en eau turbide) et le fait que la zostère subtidale de la mer des Salish et du Puget Sound est
   **invisible** au satellite optique. Retirer aussi la promesse de détection des barrens d'oursins par satellite.
2. **Le seuil de turbidité floridien (idée 3).** La norme d'État est de **29 NTU au-dessus du bruit de fond**
   (Fla. Admin. Code 62-302.530, classe III) et de 0 NTU dans les Outstanding Florida Waters, avec des conditions
   de permis plus strictes près des coraux inscrits à l'ESA. **Le « 9 NTU » du dossier industry-benthic est très
   probablement une lecture erronée de « 29 NTU » : je contredis le dossier, à revérifier au texte.** Ajouter que
   la conformité se mesure in situ, à la méthode prescrite, à des stations mobiles, et non par satellite.
3. **L'AIS ne prouve pas où l'ancre a touché (idées 2, 8).** Le cercle d'évitage d'un yacht de 50 m place
   l'antenne à 150-250 m du point de croche, et l'AIS n'est obligatoire qu'à partir de 300 UMS en international :
   la plaisance émet en classe B, volontairement, et peut couper. Le produit établit une **présence en zone**, pas
   un mouillage sur posidonie. Corollaire pour l'idée 8 : la flotte de chalut de fond de C.-B. est déjà sous VMS
   **et** suivi électronique embarqué à 100 % depuis 1996, et l'amende de mai 2024 concerne un palangrier au
   flétan, pas un chalutier. La valeur du produit est la gouvernance de la donnée, pas la détection.
4. **Le règlement (UE) 2024/1991 (idée 12).** L'objectif de 20 % à 2030 est l'objectif d'ensemble terre et mer de
   l'Union (article 1) ; l'objectif propre aux habitats marins de l'annexe II est à l'article 5 : **30 % de la
   surface non en bon état d'ici 2030**, 60 % en 2040, 90 % en 2050. `IDEAS.md` fusionne les deux et sous-estime
   la cible marine. **Je contredis `IDEAS.md` et le dossier reg-europe-benthic**, à confirmer à l'article 5.
5. **Le référentiel de dommage corallien existe déjà (idée 4).** L'analyse d'équivalence d'habitat et les
   protocoles du programme d'évaluation et de restauration des dommages de NOAA sont la méthode établie depuis
   les affaires d'échouement du FKNMS, et la photogrammétrie y est déjà courante. Le §403.93345 est de plus un
   texte **d'État** : en eaux fédérales du sanctuaire c'est le National Marine Sanctuaries Act (16 U.S.C. §1443),
   sans plafond de 250 000 $. Reformuler l'idée en « accélérer un référentiel existant », pas en « le créer ».
6. **Droit français du mouillage sur posidonie (idée 2).** Il n'existe **pas** de présomption de préjudice
   écologique : les articles 1246 à 1252 du Code civil exigent la preuve et l'évaluation, avec réparation en
   nature en priorité. Le fondement pénal est l'article L.415-3 du Code de l'environnement (la posidonie est
   protégée par l'arrêté du 19 juillet 1988), distinct de la contravention pour violation de l'arrêté du préfet
   maritime. Et le chiffre « 179 000 bateaux dont 45 % de plus de 24 m » est invraisemblable (la flotte mondiale
   de yachts de plus de 24 m se compte en milliers) : chaîne de sourçage tertiaire, à retirer ou à requalifier.
7. **Le déclencheur aquacole 2026-2029 n'existe pas tel qu'écrit (idée 5).** L'obligation de démontrer la
   récupération benthique conditionne la **remise en charge** d'un site : un site fermé définitivement n'a plus
   ni obligation ni payeur. Citer par ailleurs les **conditions de permis d'aquaculture de poissons marins**
   (Règlement du Pacifique sur l'aquaculture), et non le Règlement sur les activités d'aquaculture, pour les
   seuils de 1 300 et 700 µmol et le protocole vidéo à 6 segments. Rappeler que l'échéance du 30/06/2029 est une
   politique ministérielle de permis annoncée le 19/06/2024, réversible, pas un règlement codifié.
8. **Washington DNR et KelpWatch ne sont pas des cases vides (idée 6).** Le Nearshore Habitat Program exploite
   depuis 2000 un programme statistique de suivi de la zostère par vidéo tractée et cartographie la canopée de
   kelp flottant depuis 1989 ; **KelpWatch est un produit gratuit et vivant** (série Landsat depuis 1984,
   Californie à Washington), et la CDFW conduit des relevés aériens de canopée depuis 1989. « Site inaccessible
   lors d'une session » ne vaut pas « pas de concurrent » : c'est une faute de méthode à corriger explicitement.
9. **Le financement réel du réseau d'AMP du plateau Nord manque (idée 8).** Le mécanisme de financement de projet
   pour la permanence de la mer du Grand Ours (annoncé en juin 2024, de l'ordre de 335 M$ CAD dont environ 200 M$
   philanthropiques) finance les programmes de gardiens et le suivi : c'est le budget de la cible, absent des
   douze fiches, et il transite par la gouvernance des Nations et non par un contrat MPO. Ajout de ma part.
10. **Restoration Blueprint et parc de bouées (idée 1).** L'interdiction d'ancrage dans les Sanctuary Preservation
    Areas est un **durcissement** d'une règle en vigueur depuis 1997 (bouée obligatoire quand disponible, sinon
    mouillage sur sable), pas une nouveauté ; et sous le National Marine Sanctuaries Act le gouverneur de Floride
    peut certifier qu'une disposition lui est inacceptable, auquel cas elle ne s'applique pas dans les eaux
    d'État, ce qui couvre une grande partie du sanctuaire : risque juridique réel sur une règle présentée comme
    acquise. Harmoniser enfin le parc de bouées : environ 500 dans le FKNMS d'un dossier, « plus de 600 dont
    environ 300 dans la Kristin Jacobs Coral Aquatic Preserve » de l'autre, soit deux périmètres distincts.

**Corrections de rang immédiatement inférieur, à garder en note** : le prix du BlueROV2 varie de 4 603 à 4 900 $
selon les dossiers, à harmoniser ; le « 1,2 M£ par gigawatt » de l'idée 7 est une estimation sectorielle
secondaire et l'annotation vidéo n'en est qu'une fraction (le poste dominant est la taxonomie sur bennes) ; le
document MMO standardise une **méthode** et couvre les **eaux anglaises**, pas les 11,7 GW britanniques ; les
30 000 à 360 000 $ l'acre-crédit de Floride sont des prix de zones humides à l'UMAM, non transposables aux
herbiers ; Coral Gardeners développe sa propre plateforme instrumentée et n'est donc pas un client de l'idée 11 ;
le crabe vert européen n'est pas détectable par un plongeur en bouteille ; et enfin cinq idées supposent une
« licence de données » de 10 à 80 k$ par an à une agence, sans qu'aucun des huit dossiers ne produise un seul
exemple d'agence ayant effectivement acheté ce type de licence : à présenter comme une hypothèse, pas un modèle.
