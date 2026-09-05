# Verdict critique — 12 idées « Ocean Plastic »

Agent : **critic-ocean** (politique maritime, déchets marins, économie bleue — profil EMSA / OSPAR / GGGI)
Date : 5 septembre 2026
Base : `ocean-plastic/IDEAS.md`, `ocean-plastic/BRIEF.md`, les 9 dossiers `agents/*/`, + 5 vérifications web ciblées.

## Convention de notation

Cinq critères, notés 1 à 5 (5 = meilleur pour l'entreprise) :

- **(a) Exactitude du levier réglementaire** — la référence, la date et l'obligation sont-elles justes ? Qui est réellement l'obligé ? Quelle autorité contrôle ?
- **(b) Réalité de la douleur chez la cible** — ces gens souffrent-ils vraiment, aujourd'hui, et ont-ils une ligne budgétaire ?
- **(c) Impact réel sur le plastique dans l'océan** — prévention, détection, nettoyage, en tonnes et non en communication.
- **(d) Acceptabilité par le secteur** — culture des ports, des pêcheurs, des armateurs, des P&I clubs ; qui bloque ?
- **(e) Risque de substitution** — **5 = personne ne fait déjà cela gratuitement (créneau libre)** ; **1 = un acteur public ou associatif le fait déjà gratuitement, voire obligatoirement**. Attention au sens de la note.

---

## Tableau de synthèse

| # | Idée | a | b | c | d | e | **Total /25** |
|---|---|---|---|---|---|---|---|
| 1 | DriftBox — registre des conteneurs perdus | 3 | 2 | 2 | **1** | 2 | **10** |
| 2 | GearTrace — engins de pêche, perte, dérive, REP | 3 | 3 | **5** | 2 | 3 | **16** |
| 3 | PelletGuard — conformité pertes de granulés | 4 | 4 | 4 | 4 | 3 | **19** |
| 4 | TrueBlue Claims — preuve d'allégation « ocean plastic » | 4 | 3 | 2 | 3 | 3 | **15** |
| 5 | Plastic Credit Ratings — notation des crédits plastique | 3 | 2 | 2 | 2 | 3 | **12** |
| 6 | HarbourTwin — logiciel au-dessus des robots de port | 2 | 2 | 2 | 2 | 2 | **10** |
| 7 | WasteDeck — conformité déchets navires/ports | 2 | 3 | 2 | 2 | **1** | **10** |
| 8 | CleanScore — indice de propreté des plages | 2 | 2 | 2 | 2 | **1** | **9** |
| 9 | RiverEye — points chauds fluviaux + « trash capture » | 3 | 4 | 4 | 3 | 4 | **18** |
| 10 | NurdleRisk — score de risque pour assureurs maritimes | 3 | 3 | 2 | 3 | 3 | **14** |
| 11 | DiveLedger — preuve d'impact centres de plongée | 2 | 2 | **1** | 4 | **1** | **10** |
| 12 | EPR Atlas — conformité emballages multi-juridictions | **5** | **5** | 2 | **5** | 2 | **19** |

Moyenne : 13,5/25. Deux idées à 19, une à 18, une à 16 ; cinq idées sous 11. La dispersion est saine :
la liste courte n'a pas été filtrée sur la qualité, seulement sur l'existence d'un texte de loi.

---

## Fiches par idée

### 1. DriftBox — conteneurs perdus (10/25)

**Corrections réglementaires.** Les références (MSC.550(108) SOLAS ch. V ; MEPC.384(81) Protocole I MARPOL ;
entrée en vigueur 01/01/2026) sont exactes, mais l'idée se trompe sur **qui est l'obligé** et sur **le circuit
de la donnée**. L'obligé est **le capitaine** (« the master … shall report without delay »), et la Compagnie au
sens SOLAS IX/1.2 seulement si le navire est abandonné ou dans l'incapacité de reporter. Surtout : **c'est
l'État du pavillon, et lui seul, qui alimente GISIS**. Un armateur n'a aucun canal de dépôt dans GISIS. La
promesse « déclaration en un clic conforme GISIS » est donc factuellement fausse : au mieux on produit un
dossier prêt pour l'administration du pavillon. Second point : le signalement « aux navires à proximité » est
une **diffusion de sécurité de la navigation** (VHF/NAVTEX/MSI via le MRCC de l'État côtier), pas un formulaire
web — un SaaS ne peut pas s'y substituer. Troisième point : MEPC.384(81) modifie le Protocole I de MARPOL,
qui vise les **rapports d'incidents impliquant des substances nuisibles** — ce n'est pas le régime général de
tous les conteneurs, contrairement à ce que suggère la fiche.

**Douleur.** Faible en fréquence. ~1 274 conteneurs/an en moyenne mondiale sur ~6 000-6 500 porte-conteneurs :
un armateur moyen vit l'événement une fois par décennie. On n'achète pas un abonnement annuel par navire pour
un événement décennal. Les grands (MSC, Maersk, CMA CGM, Hapag) ont des directions sinistres, un DPA ISM et
des correspondants P&I ; ils n'ont pas besoin d'un tiers. Et attention : les chiffres WSC couvrent les
**membres du WSC** (~90 % de la capacité mondiale), pas la flotte entière.

**Blocages sectoriels — le point rédhibitoire.** Le secteur bloquera activement. Un armateur ne versera jamais
dans une base tierce, revendue à des assureurs, une preuve horodatée qui devient **une pièce à charge
discoverable** dans un contentieux (X-Press Pearl : 1 Md$ jugés). La pratique du marché est inverse : faire
transiter le matériel de casualty par les avocats pour préserver le *legal privilege*. Le WSC publie
délibérément des données **agrégées et anonymisées** pour cette raison exacte. Vendre au même moment
l'abonnement à l'armateur et la licence data à son assureur est un conflit d'intérêts qui tue la jambe
armateur. Note (d) = 1, la plus basse de l'étude.

**Pièges.** AIS satellite sous licence restrictive (Spire/Kpler/exactEarth : clauses de redistribution et de
produits dérivés, budget réel 100-300 k€/an, pas « payant » en note de bas de page) ; manifestes de cargaison
= secret des affaires ; **mise en commun de données de sinistres entre transporteurs concurrents = risque
article 101 TFUE** (échange d'informations sensibles). Le seul angle défendable est la **prédiction de dérive
et l'aide à la récupération**, vendue à l'État côtier ou au salvor, pas le registre déclaratif.

### 2. GearTrace — engins de pêche (16/25)

**Corrections réglementaires.** L'erreur principale est de présenter la déclaration de perte comme une
obligation **nouvelle** de 2026. Elle existe depuis le **1er janvier 2010** : article 48 du règlement (CE)
n° 1224/2009 impose déjà d'avoir à bord le matériel de récupération et de déclarer l'engin perdu à l'autorité
compétente de l'État du pavillon. Le règlement (UE) 2023/2842 **renforce et transpose** cette obligation dans
le journal de pêche électronique et étend le journal électronique aux navires < 12 m d'ici le **10 janvier
2028** (règles d'application au 10/01/2026 pour d'autres volets). Conséquence commerciale : le « pourquoi
maintenant » est plus faible qu'annoncé, et le vrai problème n'est pas l'outil mais **l'incitation** — déclarer,
c'est s'exposer au système de points de la licence. Aucun logiciel ne corrige un problème d'incitation.
Second point : le journal électronique (ERS) est **fourni et homologué par chaque État membre** ; une app
privée doit être agréée pays par pays et s'interfacer avec le centre national de surveillance des pêches. Ce
n'est pas un SaaS à 2-5 €/navire/an, c'est un marché public pluriannuel face à des titulaires installés
(CLS, Marine Instruments, Succorfish, Olrac, Sysdel, Nautical Control). Troisième point, décisif :
**en France, il n'y a pas d'éco-organisme agréé pour les engins de pêche**. La filière fonctionne depuis le
01/01/2025 sur un **accord volontaire État/organisations professionnelles** (décret du 25/06/2025, puis décret
n° 2025-775 du 05/08/2025) ; l'acheteur « éco-organisme, 15-40 k€/an » désigné dans la fiche **n'existe pas
sur le marché français**. Le seul éco-organisme opérationnel identifié est suédois (Fiskekretsen) ; la Norvège
a reporté à mars 2027. Enfin, la « circulaire OMI marquage des engins (PPR 13 / MEPC 84) » n'est pas adoptée :
c'est un mandat de 2022 encore en travaux, à ne pas vendre comme un déclencheur.

**Douleur.** Réelle chez le pêcheur (un filet = 5 000-15 000 €, la perte est quasi toujours involontaire), mais
**le pêcheur n'achète pas de logiciel**. L'acheteur est l'administration, l'OP ou la criée. Chez les
fabricants/importateurs multi-pays, la douleur REP est réelle mais la population est minuscule (quelques
centaines d'acteurs en UE : Hampidjan, Garware, Euronete, Le Drezen, Morgère…).

**Blocages sectoriels.** La culture pêche est structurellement hostile à tout outil qui ressemble à du
contrôle — la bataille sur le REM (surveillance électronique à distance) l'a montré dans les flottes
française, espagnole et italienne, et Europêche défendra la même ligne. À l'inverse, un outil vendu comme
« prouve ta perte pour ne pas être accusé / retrouve ton filet / débloque le financement REP » passe : c'est
exactement le modèle norvégien, où la déclaration est acceptée parce qu'elle sert le pêcheur.

**Pièges — les plus lourds de l'étude.** Les positions de pêche sont le secret industriel du métier. Les
données de position et de journal de pêche sont **protégées par les articles 112 et 113 du règlement
1224/2009** (secret professionnel, règles spécifiques de traitement) : un opérateur privé n'a pas de base
juridique évidente pour les collecter, encore moins pour en tirer une carte publique de points chauds — qui
révélerait les fonds de pêche et ferait bloquer l'outil par la profession en une saison. Pour les petites
unités, navire + patron = **donnée personnelle au sens du RGPD**. IDEAS.md ne mentionne aucun de ces deux
points, qui conditionnent pourtant la faisabilité entière du produit.

**Ce qui sauve l'idée.** C'est la seule des douze qui obtienne 5 en impact océan : les ALDFG sont, en masse,
la première source identifiée de macroplastique dans plusieurs zones, et cibler les campagnes de récupération
comme le fait le Fiskeridirektoratet a un rendement mesurable (1 637 filets en une campagne). Si l'on veut
faire de l'océan et pas de la conformité, c'est ici.

### 3. PelletGuard — granulés plastiques (19/25)

**Corrections réglementaires.** La fiche est la plus juste des douze sur les dates, et elle **corrige à
raison deux dossiers internes**. Vérifié : règlement (UE) 2025/2365 publié au JOUE le **26/11/2025**, en
vigueur le **16/12/2025**, majorité des obligations au **17/12/2027**, transport maritime au **17/12/2028**.
Le seuil de certification par tiers est bien **1 500 t/an** — les dossiers `reg-europe` et `rivers-upstream`
écrivent 1 000 t/an, ce qui vient de la proposition de 2023 et doit être corrigé partout. Nuance importante
sur la taille du marché adressable : la certification ne s'impose qu'aux **entreprises moyennes et grandes**
exploitant une installation ≥ 1 500 t/an ; en dessous, et pour les micro/petites entreprises, c'est une
**auto-déclaration de conformité** renouvelable. La population « certifiable » est donc bien plus petite que
« tous les sites ≥ 5 t/an ». À vérifier avant publication : l'amende plancher de **4 % du CA** figure dans la
proposition COM(2023)645 ; il faut confirmer qu'elle survit dans le texte final, sinon la retirer.
Côté américain, une limite est omise : **le MSGP de l'EPA ne s'applique que dans les États sans délégation
NPDES** (Idaho, Massachusetts, New Hampshire, Nouveau-Mexique, sites fédéraux/tribaux). Le Texas et la
Louisiane — c'est-à-dire là où sont les usines de pellets — gèrent leurs propres permis et ne sont pas
couverts. Le levier US réel se limite pour l'instant à l'Illinois (HB 4418, promulguée le 07/08/2026, BMP à
intégrer d'ici août 2027) et au PMRP de Los Angeles.

**Douleur.** Réelle, datée, budgétée, et chez une population peu digitalisée sur ce sujet précis. La
notification des installations aux autorités compétentes au 17/12/2027 crée une échéance nette. C'est le
profil classique du bon SaaS de conformité.

**Blocages sectoriels.** Faibles, et c'est rare. PlasticsEurope et EuPC portent Operation Clean Sweep depuis
des années : l'industrie **veut** être vue en conformité. Les certificateurs (SGS, DNV, DQS, Bureau Veritas)
sont des canaux de distribution naturels, pas des concurrents. Le vrai risque est l'absorption : les grands
groupes ont déjà un outil EHS (Enablon, Intelex, Sphera, EcoOnline) qui ajoutera un module pellets.

**Pièges.** Le « registre public des certificats → score de risque fournisseur vendu aux acheteurs et
assureurs » est le volet dangereux. Publier un score nominatif sur des entreprises expose à des actions en
dénigrement et en concurrence déloyale, et pourrait tomber sous le **règlement (UE) 2024/3005 sur les activités
de notation ESG, applicable depuis le 2 juillet 2026** (agrément ESMA requis pour fournir des notations ESG
dans l'UE) — à faire qualifier par un avocat avant de commercialiser quoi que ce soit qui s'appelle un
« score ». Le module caméra sur quai filme des salariés : RGPD, analyse d'impact, information/consultation du
CSE en France, du Betriebsrat en Allemagne ; concevoir sans reconnaissance de visage dès le départ.

### 4. TrueBlue Claims — preuve d'allégation (15/25)

**Corrections réglementaires.** Dates justes (directive (UE) 2024/825 adoptée le 28/02/2024, JOUE 06/03/2024,
transposition 27/03/2026, application **27/09/2026**) et le statut du retrait de la Green Claims Directive est
correctement nuancé. Trois corrections de fond. Un : « ocean plastic » n'est **pas** une allégation générique
du type « éco-responsable ». C'est une allégation **spécifique**, déjà attaquable depuis vingt ans au titre
des pratiques commerciales trompeuses de la directive 2005/29/CE — l'urgence « avant le 27/09/2026 » est donc
en partie rhétorique. Ce qui est réellement nouveau : l'interdiction des labels de durabilité non fondés sur
une certification tierce ou une autorité publique, l'interdiction des allégations de neutralité fondées sur la
compensation, et l'interdiction des allégations génériques sans performance reconnue. Deux : l'autorité qui
contrôle est l'autorité de protection des consommateurs (DGCCRF, ACM, AGCM) via le réseau CPC (règlement
2017/2394), et les concurrents comme les associations peuvent agir — le risque est aussi civil, pas seulement
administratif. Trois : la « zone des 50 km » et la définition OBP relèvent d'un **standard privé** (Zero
Plastic Oceans / Control Union), pas du droit de l'UE ; la présenter comme une définition légale serait une
erreur reprise en boucle.

**Douleur.** Réelle et croissante, mais elle s'achète historiquement en **honoraires d'avocat**, pas en
abonnement. Le nombre de marques qui font sérieusement une allégation « plastique marin » en Europe se compte
en centaines, pas en milliers. À 15-60 k€/an on vend un prix de cabinet sans la responsabilité civile
professionnelle d'un cabinet.

**Blocages.** Faibles côté acheteur (les marques achètent du SaaS), forts côté concurrence : cabinets,
EcoVadis, Provenance, Circularise, consultants RSE occupent déjà l'espace.

**Pièges.** Produire des conclusions juridiques sur le risque de conformité d'un client frôle le périmètre du
droit (loi n° 71-1130, art. 54 à 60 : la consultation juridique est réglementée en France) — structurer
l'offre en « dossier de preuve » et non en « avis ». Effet pervers documenté à assumer : en durcissant la
preuve, on pousse les marques au *green hushing*, donc on **assèche la demande de plastique océanique
collecté** — l'inverse de l'objectif du BRIEF. D'où (c) = 2.

### 5. Plastic Credit Ratings (12/25)

**Corrections réglementaires.** Une erreur nette : la directive 2024/825 n'interdit pas « les allégations
basées sur compensation » en général. Le point ajouté à l'annexe I de la directive 2005/29/CE vise
spécifiquement les allégations de neutralité, d'impact réduit ou positif **en matière de gaz à effet de
serre** fondées sur la compensation. Une allégation « plastic neutral » n'est donc pas couverte par cette
interdiction précise ; elle reste attaquable par la voie générale des pratiques trompeuses. Autre faiblesse :
l'ESRS E2 n'impose aucune ligne de divulgation sur les crédits plastique achetés — l'accroche « rapport
d'audit CSRD » est un habillage. Enfin le chiffre de **462 M$ (2024)** provient d'un cabinet d'études dont les
projections divergent de 23 %/an à 121 %/an : cet écart signale que la taille du marché n'est pas mesurée. Ne
pas construire un business plan dessus.

**Douleur, blocages.** L'analogie Sylvera/BeZero ne tient pas à l'échelle : le carbone volontaire pesait
plusieurs milliards de dollars et des milliers d'acheteurs ; ici on parle probablement de **30 à 80 acheteurs
corporate sérieux dans le monde**. Les standards notés (Verra, PCX) et les plateformes (Plastic Bank,
CleanHub) ne paieront pas pour être notés et travailleront à discréditer la note. Sylvera et BeZero, qui ont
déjà la marque et le carnet d'adresses, peuvent étendre au plastique en un trimestre.

**Pièges.** Publier des notes négatives nominatives = exposition en dénigrement, gérable seulement avec une
méthodologie publique et un budget juridique. Surtout : **règlement (UE) 2024/3005 sur les notations ESG,
applicable depuis le 02/07/2026** — vendre par abonnement une « note de crédibilité » dans l'UE peut exiger un
agrément ESMA. C'est le piège le plus sous-estimé de la liste.

### 6. HarbourTwin — logiciel au-dessus des robots (10/25)

**Corrections réglementaires.** Pas de levier, et la fiche s'en tire par un rapprochement erroné : la
directive 2019/883 porte sur les **déchets d'exploitation des navires et les résidus de cargaison** déposés à
quai, pas sur le nettoyage du plan d'eau. Un jumeau numérique de la propreté du bassin ne produit aucun
indicateur exigé par ce texte. De même, les critères Pavillon Bleu et Blue Flag portent sur la qualité de
l'eau de baignade, le tri et l'éducation — pas sur des tonnages de macrodéchets collectés. « Calcul
automatique des indicateurs de label » survend.

**Douleur, prix.** Une marina qui achète un Jellyfishbot à 25 k€ ne paiera pas 500-3 000 €/mois — soit
6 000 à 36 000 €/an — pour le tableau de bord. La tarification est décorrélée du budget réel du segment.

**Blocages.** Le gardien de la porte est aussi le concurrent : Seabin, RanMarine et IADYS ont chacun leur
dashboard et aucun intérêt à ouvrir leur API à un agrégateur neutre qui capterait la relation client. C'est le
schéma classique de l'agrégateur sans levier de négociation.

**Substitution.** Dashboards constructeurs gratuits inclus avec le matériel ; Copernicus Marine et
OceanParcels gratuits ; SIG municipal existant.

**Verdict.** À traiter comme un **module** (le moteur de dérive « dernier kilomètre ») à vendre aux
constructeurs en marque blanche, pas comme une société.

### 7. WasteDeck — déchets navires et ports (10/25)

**Correction réglementaire décisive.** La fiche parle d'« intégration SafeSeaNet » : c'est techniquement faux
et cela invalide le cœur du produit. Depuis le **15 août 2025**, le **règlement (UE) 2019/1239 (EMSWe,
guichet unique maritime européen)** est applicable : la notification préalable des déchets se dépose via le
**guichet unique national** de chaque État membre, avec un jeu de données harmonisé et une interface commune.
**SafeSeaNet et THETIS-EU sont des systèmes d'échange entre autorités**, opérés par l'EMSA ; un SaaS privé n'y
a pas accès. Autrement dit, la fonction que WasteDeck veut vendre est désormais assurée par une
**infrastructure publique obligatoire et harmonisée**, ce qui écrase le prix de référence à zéro — c'est
pourquoi (e) = 1. Deuxième correction : un **Garbage Record Book électronique doit être approuvé par
l'administration du pavillon** (régime des registres électroniques MARPOL) ; ce n'est pas une app qu'on
déploie sur tablette et qu'on vend au mois. Troisième : le seuil MARPOL Annexe V abaissé de 400 à 100 UMS au
01/05/2024 est exact (MEPC.360(79)), mais les « amendes dès 15 000 $ » viennent d'un blog commercial — à
re-sourcer ou à retirer. Quatrième : l'évaluation de la directive 2019/883 par la Commission était due au
28/06/2026, date désormais **passée** ; il faut vérifier si le rapport est sorti avant d'en faire un « pourquoi
maintenant ».

**Douleur.** Le seul segment crédible est le **e-GRB des petites flottes** (100-400 UMS) nouvellement
assujetties, où la douleur PSC est réelle. Le volet portuaire est mort-né.

**Blocages.** Ports moyens : cycles d'achat publics longs, budgets IT sous 100 k€, et la plupart appartiennent
déjà à un consortium PCS (Portbase, MGI, dbh, DAKOSY, Portic). 1 500-6 000 €/mois est hors de portée pour la
cible décrite. Les agents maritimes, utilisateurs réels, refuseront un coût par notification pour un acte
aujourd'hui gratuit.

### 8. CleanScore — indice de propreté des plages (9/25)

**Corrections réglementaires — deux erreurs structurantes.** Un : **l'obligation DCSMM pèse sur les États
membres**, pas sur les communes. En France, la surveillance du descripteur 10 est portée par l'OFB, l'Ifremer
et le Cerema dans le cadre des documents stratégiques de façade ; **aucune commune littorale n'a d'obligation
de rapportage DCSMM**. La cible payante (5 000 communes à 3-8 k€) n'est donc pas la population obligée : il n'y
a pas de budget de conformité en face. Deux : le rapportage DCSMM/OSPAR exige des **relevés in situ
normalisés** (transect de 100 m, protocole OSPAR/UNEP-MAP, 112 catégories, observateurs formés). La
télédétection n'est **pas** acceptée aujourd'hui pour le descripteur 10 : promettre un « export conforme
DCSMM/OSPAR » à partir de satellite est une promesse non tenable. Trois, sur la technique : Sentinel-2 est à
10 m/pixel et MARIDA porte sur des **agrégations denses de plastique flottant en mer**, pas sur des objets
individuels sur le sable — il n'y a pas de chemin crédible du satellite vers un comptage d'objets/100 m. Le
chiffre « 203 déchets/100 m (JRC 2025) » doit être re-vérifié : la communication JRC de février 2025 annonce
une baisse d'environ un tiers, ce qui rend ce niveau douteux.

**Douleur.** La douleur des communes est le **coût du ramassage** (135 k€/an pour 3 km à Châtelaillon), pas la
mesure. Elles préfèrent mettre 5 k€ dans une cribleuse que dans un indice.

**Blocages.** Un indice public nommant les plages sales est une menace politique pour un maire et pour
l'office de tourisme : la filière s'y opposera, comme elle s'est opposée à toute publication comparative de
qualité des eaux de baignade. Ajoutons que le ramassage mécanique intensif est lui-même écologiquement
contesté (destruction de la laisse de mer) : un « score de propreté » peut inciter à sur-nettoyer, donc nuire.

**Pièges.** Les drones au-dessus de plages fréquentées : RGPD (images de personnes identifiables) et surtout
**réglementation EASA catégorie ouverte, qui interdit le survol de rassemblements de personnes** — c'est-à-dire
précisément une plage en été. Second piège : les données citoyennes (Surfrider, OSPAR, TIDES, Marine
LitterWatch) sont sous licences ouvertes souvent non commerciales ou à partage identique ; les revendre
empaquetées peut violer la licence et se retournera contre vous auprès des communautés qui les produisent.

**Substitution.** Maximale : OSPAR Beach Litter, EMODnet Chemistry, Marine LitterWatch (AEE), TIDES, les
programmes nationaux DCSMM, tous gratuits ; Pavillon Bleu et Blue Flag auditent déjà.

### 9. RiverEye — points chauds fluviaux et « trash capture » (18/25)

**Corrections réglementaires.** Le levier californien est solide et bien daté : **California Trash Amendments,
100 % de capture pour les permittees MS4 au 2 décembre 2030**, contrôlé par le State Water Board et les
Regional Boards, avec non-conformité = violation de permis NPDES. C'est la meilleure obligation de la liste
après le PPWR. En revanche, l'accroche européenne est bancale : la directive (UE) 2024/3019 impose une
**surveillance des microplastiques par méthode de laboratoire** dans les entrées/sorties de stations et les
boues (agglomérations à partir de 10 000 EH), et une gestion des déversements pluviaux — **pas** un comptage
vidéo de macrodéchets sur une rivière. Un produit caméra + vision par ordinateur **ne satisfait aucune
obligation** de ce texte. Il faut assumer que l'Europe est un marché de priorisation d'investissement
(agences de l'eau, métropoles), pas de conformité, et vendre en conséquence.

**Douleur.** Forte et budgétée côté US : les permittees doivent inventorier des milliers de dispositifs de
capture, prouver leur entretien et démontrer une trajectoire vers 100 %. C'est un travail de tenue de
registre pénible, sur des budgets déjà votés.

**Blocages.** Le marché municipal américain du pluvial est occupé par des bureaux d'études (Geosyntec, Larry
Walker Associates, Tetra Tech) qui vendent le reporting avec la prestation, et par la couche d'asset
management déjà installée (Esri, Cityworks, Cartegraph). Il faut se positionner **au-dessus** d'eux ou comme
fournisseur de ces bureaux, pas contre.

**Impact.** Le meilleur rapport impact/effort après GearTrace : les rivières sont la source, et Meijer 2021
montre que ce sont les petites rivières urbaines côtières qu'il faut cibler — exactement ce que fait
l'inventaire par sous-bassin. L'échec de Plastic Origins en 2025 est une **bonne nouvelle** (code ouvert
réutilisable, place libre) et un avertissement (l'industrialisation est le vrai travail).

**Pièges.** Caméras filmant l'espace public : RGPD et AIPD en Europe, lois d'État en Californie ; anonymisation
à la source obligatoire. Et un piège spécifiquement américain, méconnu : sous les **public records laws**, ce
que vous livrez à une collectivité devient largement communicable — verrouiller contractuellement ce qui est
livrable et ce qui reste votre propriété, sinon votre référentiel devient public.

### 10. NurdleRisk — score de risque assurantiel (14/25)

**Corrections réglementaires.** Il manque l'argument le plus fort, et il est structurel : **la convention HNS
de 2010 n'est toujours pas en vigueur**. Il n'existe donc aucun régime international d'indemnisation pour un
déversement de granulés ou de substances nocives, et c'est précisément pour cela que l'écart X-Press Pearl
(1 Md$ jugés contre un fonds de limitation LLMC invoqué de ~25 M$) existe. À intégrer au rapport : c'est le
cœur de la thèse. Nuance à corriger : les 25 M$ ne sont pas un « plafond d'assurance » mais le **fonds de
limitation LLMC** que l'armateur cherchait à constituer, et sa constitution était contestée. Autre point :
l'idée suppose que le flux GISIS créé en 2026 sera exploitable — or **GISIS est alimenté par les États du
pavillon et l'accès public à certains modules est restreint** ; la disponibilité de la donnée est une
hypothèse, pas un acquis. À vérifier avant d'en faire la matière première du produit.

**Douleur et blocages.** Après X-Press Pearl, l'International Group réexamine réellement son exposition
pellets/HNS. Mais le marché est **12 clubs P&I**, mutuelles disposant de leurs propres équipes de loss
prevention et d'analytics ; elles co-développent plus qu'elles n'achètent, et les cycles de vente se comptent
en années. Le mutualisme amortit par construction la tarification au risque, ce qui affaiblit l'impact
environnemental attendu. Concurrents crédibles déjà en place sur la donnée maritime assurantielle : Windward,
Concirrus, Lloyd's List Intelligence — ils ajouteraient une couche « pellets » en un trimestre.

**Pièges.** Licences AIS satellite (redistribution et produits dérivés) ; et surtout **droit de la
concurrence** : la mise en commun de données de sinistres entre assureurs concurrents n'est plus couverte
depuis l'expiration du règlement d'exemption assurance en 2017 — toute compilation commune doit être
auto-évaluée au regard de l'article 101 TFUE. À traiter dès la conception (agrégation, anonymisation, accès
non discriminatoire).

### 11. DiveLedger — centres de plongée (10/25)

**Corrections.** Aucun levier réglementaire, ce que la fiche assume — mais elle rate **le substitut gratuit
décisif** : le **Green Fins Hub** (Reef-World Foundation avec le PNUE), lancé en 2022-2023, fait déjà pour les
centres de plongée exactement ce que décrit le produit — auto-évaluation, plan d'action, suivi annuel,
reconnaissance publique — avec le prestige de l'ONU derrière et un coût nul à très faible. S'ajoutent PADI
AWARE / Dive Against Debris (gratuit), Project AWARE (carte publique gratuite) et Clean Swell d'Ocean
Conservancy (gratuit). Vendre 300-900 €/an à des micro-entreprises saisonnières contre trois offres gratuites
dont une adossée au PNUE n'est pas un marché.

**Impact.** Le plus faible des douze : environ 1 million d'objets en quatorze ans de Dive Against Debris,
c'est-à-dire une masse négligeable. La valeur est pédagogique et scientifique, pas volumétrique.

**Ce qui est juste.** L'acceptabilité sectorielle est excellente (4/5) : la culture plongée est demandeuse, et
PADI/SSI sont des canaux B2B2C réels. La fiche a raison de conclure elle-même qu'il s'agit d'une « porte
d'entrée » et non d'une société. À garder comme **fonction d'acquisition gratuite** d'une autre idée, jamais
comme ligne de revenu.

### 12. EPR Atlas — emballages multi-juridictions (19/25)

**Corrections réglementaires.** La fiche la mieux documentée des douze ; peu à corriger, quelques nuances à
poser. Le PPWR (règlement (UE) 2025/40) est applicable au 12/08/2026 avec notification des sanctions au
12/02/2027, mais **la Commission a demandé en août 2026 aux États membres de ne pas sanctionner** faute de
régimes nationaux prêts : l'urgence de vente ne doit donc pas être calée sur août 2026 mais sur **février
2027**. Les « 5 741 producteurs » SB 54 sont une **estimation de l'analyse économique de CalRecycle**, à
citer comme telle. La Malaisie est en EPR **volontaire** jusqu'en 2030 (pas de population captive) et la
Thaïlande n'a qu'un **projet de loi** en consultation depuis mars 2024 : deux marchés à présenter comme
prospects, pas comme obligations. À l'inverse, l'Inde est le meilleur levier d'Asie et il est sous-vendu : le
**blocage au dédouanement** des importateurs non enregistrés au portail CPCB depuis juillet 2025 est une
sanction immédiate et cash, bien plus mordante qu'une amende différée.

**Douleur, acceptabilité.** Maximales. C'est le profil de logiciel de conformité le plus éprouvé du marché,
avec des acheteurs (packaging/compliance) habitués à signer.

**Le vrai problème : le lien océan et la concurrence.** (c) = 2 : l'EPR emballages agit sur les systèmes de
collecte des pays à haut revenu, là où la fuite vers l'océan est déjà faible ; le lien avec le plastique marin
est indirect et diffus, sauf sur le volet asiatique (Philippines, Vietnam, Inde) où la fuite est réelle. Et
(e) = 2 : le marché est **déjà occupé et payant** — rePurpose Global (500+ marques, simulateur SB 54), Recyda,
Lorax EPI, Ecoveritas, Reverse Logistics Group/Reconomy, Source Intelligence, Interzero, Landbell — sans
compter les calculateurs gratuits fournis par les PRO eux-mêmes (CAA, Citeo, Valipac). Le créneau défendable
est **exclusivement la couverture Asie-Pacifique**, que les incumbents couvrent mal.

**Avertissement de cadrage.** Si le rapport final classe EPR Atlas en tête, il faut assumer devant le lecteur
que la meilleure idée « business » de la liste est aussi l'une des plus faibles en impact océan. C'est
défendable, mais cela doit être dit, pas dissimulé.

---

## Top 3

1. **Idée 3 — PelletGuard (19/25).** La seule qui aligne un texte contraignant fraîchement daté, une
   population identifiée, un secteur coopératif et un impact réellement mesurable en tonnes de microplastique
   primaire évitées (52 000-184 000 t/an dans l'UE selon la Commission). Le calendrier 17/12/2027 puis
   17/12/2028 laisse exactement le temps de construire et de vendre. Restreindre la V1 au socle documentaire
   et à la préparation d'audit ; garder la vision par ordinateur pour la V2 ; **ne pas lancer le score de
   risque fournisseur sans avis juridique** (règlement notations ESG 2024/3005).
2. **Idée 12 — EPR Atlas (19/25).** Meilleure exécutabilité commerciale de la liste : obligations dures,
   dates fermes, acheteurs habitués. À condition d'attaquer par l'**Asie-Pacifique** (Inde CPCB et blocage
   douanier, Philippines RA 11898, Vietnam décret 110/2026), seul angle non couvert par les incumbents, et
   d'assumer un lien océan indirect.
3. **Idée 9 — RiverEye (18/25).** L'obligation californienne au 02/12/2030 est nette, contrôlée et budgétée,
   et l'amont fluvial est là où se joue réellement le flux de plastique vers la mer. À condition de vendre
   d'abord l'**inventaire GIS + preuve d'entretien des dispositifs de capture** (la partie ennuyeuse qui se
   paie) et non les caméras IA, et de retirer l'accroche 2024/3019 qui ne tient pas.

**Réserve du critique.** Si le mandat du BRIEF (« préserver l'océan, réduire le plastique marin ») pèse plus
que la facilité commerciale, alors **l'idée 2 (GearTrace, 16/25) doit remplacer l'idée 12 dans le top 3** :
c'est la seule à obtenir 5/5 en impact océan. Elle est plus difficile — verrou des données de pêche, méfiance
de la profession, absence d'éco-organisme français — mais elle traite la première source de macroplastique
marin en masse. Un rapport honnête doit présenter les deux classements.

## Bottom 3

1. **Idée 8 — CleanScore (9/25).** Repose sur une lecture fausse de la DCSMM : l'obligé est l'État, pas la
   commune, et la télédétection n'est pas admise pour le descripteur 10. Ajoutez l'interdiction de survol de
   plages fréquentées en catégorie ouverte, les données citoyennes gratuites et sous licence ouverte, et
   l'hostilité politique à un classement public des plages. À abandonner.
2. **Idée 1 — DriftBox (10/25, dont 1/5 en acceptabilité).** Se trompe sur l'obligé (le capitaine, pas
   l'armateur) et sur le circuit GISIS (alimenté par l'État du pavillon). Surtout, demande à des armateurs et à
   leurs P&I clubs de constituer volontairement une preuve horodatée opposable, revendue à leurs assureurs :
   le secteur ne le fera pas. Ne survit que le module « dérive et récupération » vendu aux États côtiers et aux
   salvors.
3. **Idée 7 — WasteDeck (10/25, dont 1/5 en substitution).** La notification préalable des déchets passe
   désormais par le **guichet unique national obligatoire (EMSWe, règlement 2019/1239, applicable depuis le
   15/08/2025)**, gratuit pour le déclarant ; SafeSeaNet et THETIS-EU sont hors d'atteinte d'un acteur privé.
   Il ne reste que le e-Garbage Record Book des petites flottes, qui exige une approbation par État du
   pavillon — un module, pas une société.

*Juste au-dessus, à ne pas retenir non plus comme sociétés : idée 6 (HarbourTwin, 10/25) et idée 11
(DiveLedger, 10/25), toutes deux valables comme modules ou fonctions d'acquisition.*

---

## Corrections factuelles à intégrer au rapport

Par ordre d'importance.

1. **Conteneurs perdus — qui déclare.** L'obligé est **le capitaine** (la Compagnie au sens SOLAS IX/1.2
   seulement si le navire est abandonné ou incapable de reporter) ; le signalement va aux navires à proximité,
   à l'État côtier le plus proche et à l'État du pavillon. **C'est l'État du pavillon qui alimente GISIS.** Un
   armateur n'a aucun canal de dépôt GISIS : supprimer partout la promesse « déclaration en un clic conforme
   GISIS ». Préciser aussi que MEPC.384(81) modifie le Protocole I de MARPOL (rapports sur incidents impliquant
   des substances nuisibles), et ne couvre pas le régime général de tous les conteneurs.
2. **Déchets des navires — SafeSeaNet n'est pas le point d'entrée.** Depuis le **15 août 2025**, le règlement
   **(UE) 2019/1239 (EMSWe)** impose le dépôt de la notification préalable des déchets via le **guichet unique
   national** de chaque État membre, avec jeu de données harmonisé. SafeSeaNet et THETIS-EU sont des systèmes
   entre autorités opérés par l'EMSA, inaccessibles à un SaaS privé. Corriger l'idée 7 et toute mention
   d'« intégration SafeSeaNet ». Ajouter qu'un **Garbage Record Book électronique doit être approuvé par
   l'État du pavillon**.
3. **Granulés — seuil de certification 1 500 t/an, pas 1 000.** Règlement (UE) 2025/2365, JOUE 26/11/2025,
   en vigueur 16/12/2025, majorité des obligations au **17/12/2027**, maritime au **17/12/2028**. La
   certification par tiers ne vise que les **entreprises moyennes et grandes** exploitant une installation
   ≥ 1 500 t/an ; en dessous, auto-déclaration de conformité. Corriger les dossiers `reg-europe` et
   `rivers-upstream` (qui écrivent 1 000 t/an, chiffre de la proposition de 2023) et redimensionner à la
   baisse le marché adressable « certifiable ». Vérifier dans le texte final si l'amende plancher de 4 % du CA
   a survécu à la négociation avant de la citer.
4. **Engins de pêche — la déclaration de perte n'est pas nouvelle.** Elle existe depuis le 01/01/2010
   (article 48 du règlement (CE) n° 1224/2009 : matériel de récupération à bord + déclaration à l'autorité du
   pavillon). Le règlement (UE) 2023/2842 la porte dans le journal de pêche électronique et étend le journal
   électronique aux navires < 12 m d'ici le **10 janvier 2028**. Ajouter que l'ERS est **fourni et homologué
   par chaque État membre** : une app privée doit être agréée pays par pays.
5. **REP engins de pêche en France — pas d'éco-organisme agréé.** La filière fonctionne depuis le 01/01/2025
   sur un **accord volontaire État / organisations professionnelles** (décret du 25/06/2025 ; décret
   n° 2025-775 du 05/08/2025). L'acheteur « éco-organisme à 15-40 k€/an » n'existe pas en France ; le seul
   éco-organisme opérationnel cité est suédois (Fiskekretsen), la Norvège ayant reporté à mars 2027.
6. **Plages — l'obligé DCSMM est l'État, pas la commune, et le satellite n'est pas admis.** Le descripteur 10
   est suivi par les États membres (en France OFB, Ifremer, Cerema, via les documents stratégiques de façade) ;
   aucune commune n'a d'obligation de rapportage. Le rapportage exige des **relevés in situ normalisés** (100 m,
   protocole OSPAR/UNEP-MAP) ; la télédétection n'est pas acceptée. Sentinel-2 (10 m/pixel) et MARIDA visent
   des agrégations denses de plastique **flottant en mer**, pas des objets sur le sable. Re-vérifier le chiffre
   « 203 déchets/100 m » au regard de la communication JRC de février 2025 (baisse d'environ un tiers).
7. **Allégations vertes — deux imprécisions.** (i) L'interdiction des allégations fondées sur la compensation,
   ajoutée à l'annexe I de la directive 2005/29/CE, vise spécifiquement la **neutralité en gaz à effet de
   serre** : elle n'interdit pas en tant que telle une allégation « plastic neutral » (idée 5). (ii) « Ocean
   plastic » est une allégation **spécifique**, déjà attaquable depuis 2005 au titre des pratiques trompeuses ;
   ce qui est nouveau au 27/09/2026 concerne les allégations génériques, les labels sans certification tierce
   et la neutralité par compensation. (iii) La « zone des 50 km » et la définition OBP relèvent d'un **standard
   privé** (Zero Plastic Oceans / Control Union), pas du droit de l'UE.
8. **Pièges juridiques à ajouter en section transverse du rapport.**
   - **Données de pêche** : positions et journaux de pêche protégés par les **articles 112 et 113 du règlement
     1224/2009** (secret professionnel) ; navire + patron = donnée personnelle RGPD pour les petites unités ;
     une carte publique de points chauds révèle les fonds de pêche et fera bloquer l'outil par la profession.
   - **AIS** : l'AIS satellite est sous licence commerciale restrictive (redistribution et produits dérivés) —
     budgéter 100-300 k€/an, pas une ligne « données payantes ».
   - **Droit de la concurrence** : la mise en commun de données de sinistres entre assureurs concurrents n'est
     plus couverte depuis l'expiration du règlement d'exemption assurance en 2017 (article 101 TFUE) ; même
     logique pour un pool de données de pertes entre transporteurs concurrents.
   - **Règlement (UE) 2024/3005 sur les notations ESG, applicable depuis le 02/07/2026** : tout produit vendu
     comme un « score » ou une « note » ESG dans l'UE peut exiger un agrément ESMA (idées 3, 5, 10).
   - **Drones** : survol de rassemblements de personnes interdit en catégorie ouverte EASA — incompatible avec
     une plage fréquentée (idée 8).
   - **Public records laws** aux États-Unis : ce qui est livré à une collectivité devient largement
     communicable — verrouiller contractuellement le périmètre livrable (idée 9).
9. **HNS 2010 n'est pas en vigueur.** Il n'existe aucun régime international d'indemnisation pour un
   déversement de granulés ou de substances nocives ; les ~25 M$ de X-Press Pearl sont un **fonds de limitation
   LLMC** contesté, pas un plafond d'assurance. C'est l'argument central de l'idée 10 et il manque au rapport.
10. **Chiffres à requalifier ou à re-sourcer.** « 462 M$ » de marché des crédits plastique = estimation de
    cabinet, avec des projections de croissance allant de 23 % à 121 %/an — inutilisable comme base de plan
    d'affaires. Les chiffres WSC couvrent les **membres du WSC** (~90 % de la capacité), pas la flotte
    mondiale. « Amendes MARPOL dès 15 000 $ » provient d'un blog commercial. « 5 741 producteurs » SB 54 est
    une estimation de l'analyse économique CalRecycle. Enfin, l'urgence PPWR doit être calée sur le
    **12/02/2027** (notification des sanctions) et non sur le 12/08/2026, puisque la Commission a demandé en
    août 2026 aux États membres de ne pas sanctionner.

---

## Note de méthode

- Vérifications web effectuées (5, budget respecté) : EMSWe / règlement 2019/1239 applicable au 15/08/2025 ;
  seuil de certification 1 500 t et calendrier du règlement (UE) 2025/2365 ; circuit de déclaration SOLAS
  2026 et alimentation de GISIS par l'État du pavillon ; articulation article 48 de 1224/2009 / journal
  électronique et échéance 2028 ; statut de la filière REP engins de pêche en France (accord volontaire, pas
  d'éco-organisme agréé).
- Points **non vérifiés** faute de budget, à traiter avant publication : survie de l'amende plancher de 4 % du
  CA dans le texte final du règlement pellets ; publication effective du rapport d'évaluation de la directive
  2019/883 (échéance 28/06/2026, désormais passée) ; niveau exact de la moyenne UE de déchets de plage après
  la baisse annoncée par le JRC en février 2025 ; accessibilité publique du module « conteneurs perdus » de
  GISIS.
- Les affirmations non sourcées ci-dessus relèvent de la connaissance sectorielle du métier (pratiques P&I,
  procurement portuaire, culture des flottes de pêche, marché du pluvial américain) et sont présentées comme
  telles, non comme des faits documentés.
