# Verdict investisseur — les 12 idées « Ocean Plastic »

Agent : critic-vc · 5 septembre 2026
Sources : `IDEAS.md`, `BRIEF.md`, les 9 dossiers `agents/*/findings.md` (+ `dossier-rivers-upstream.md`),
2 vérifications web (règlement pellets UE ; SB 54 Californie — voir § Vérifications).

## Méthode de notation

Cinq critères, 1 à 5, total sur 25.

| Critère | 1 = | 5 = |
|---|---|---|
| **a. Urgence réglementaire** | pas de texte, ou texte sans date ni sanction | date ferme < 24 mois **et** sanction chiffrée qui fait mal |
| **b. Cible captive** | cible minuscule ou introuvable | population large, dénombrée, joignable par une liste |
| **c. Volonté de payer / modèle** | qui paie ? combien ? incertain ; budget inexistant | budget de conformité déjà voté, prix comparable prouvé |
| **d. Moat** | reproductible en un trimestre par n'importe qui | données propriétaires cumulatives, effets de réseau, coût de sortie |
| **e. Exécution commerciale** (5 = **risque faible**) | marché public, dépendance à un partenaire, cycle > 12 mois | vente B2B privée, cycle < 6 mois, canal existant |

Note : le critère (e) est inversé volontairement (5 = peu risqué) pour que le total sur 25 se lise
« plus c'est haut, mieux c'est ».

## Tableau de synthèse

| # | Idée | a | b | c | d | e | **Total /25** | Verdict |
|---|---|---|---|---|---|---|---|---|
| 12 | EPR Atlas (emballages multi-juridictions) | 5 | 5 | 5 | 2 | 3 | **20** | Go si… (différenciation Asie prouvée) |
| 3 | PelletGuard (granulés) | 5 | 4 | 4 | 2 | 4 | **19** | **Go** |
| 7 | WasteDeck (déchets navires/ports) | 4 | 3 | 4 | 2 | 3 | **16** | Go si… (on abandonne les ports, on vise les flottes) |
| 1 | DriftBox (conteneurs perdus) | 3 | 3 | 3 | 3 | 3 | **15** | Go si… (un P&I club signe une licence data) |
| 9 | RiverEye (points chauds fluviaux) | 4 | 3 | 3 | 3 | 2 | **15** | Go si… (2 villes MS4 californiennes payantes) |
| 2 | GearTrace (engins de pêche) | 4 | 3 | 2 | 3 | 2 | **14** | Go si… (un éco-organisme ou une administration paie) |
| 4 | TrueBlue Claims (allégations) | 4 | 2 | 3 | 2 | 3 | **14** | No-go en tant que société (feature) |
| 5 | Plastic Credit Ratings | 2 | 2 | 2 | 3 | 2 | **11** | No-go |
| 8 | CleanScore (propreté des plages) | 2 | 3 | 2 | 3 | 1 | **11** | No-go |
| 6 | HarbourTwin (robots de port) | 1 | 3 | 2 | 2 | 2 | **10** | No-go |
| 10 | NurdleRisk (score assureurs) | 2 | 1 | 3 | 3 | 1 | **10** | No-go (V2 de l'idée 1) |
| 11 | DiveLedger (centres de plongée) | 1 | 3 | 1 | 1 | 3 | **9** | No-go |

---

# Fiches

## 1. DriftBox — conteneurs perdus (15/25)

L'obligation SOLAS/MARPOL du 01/01/2026 est réelle mais c'est une obligation **de capitaine**, pas
d'entreprise : elle se règle avec un formulaire et une procédure ISM, pas avec un abonnement. Le
dossier ports-shipping ne cite aucune amende chiffrée — la sanction dépend de l'État du pavillon,
c'est-à-dire, en pratique, de personne. Le calcul de fréquence tue l'abonnement navire : ~1 274
conteneurs/an sur ~6 000 porte-conteneurs, soit un événement déclarable tous les 10 à 20 ans pour un
armateur donné. Personne ne paie 2 000 €/an pour un formulaire décennal. La vraie valeur est ailleurs :
la base agrégée temps réel (là où le WSC publie un PDF annuel) et la prédiction de dérive vendues aux
12 P&I clubs et aux assureurs cargo — 20-100 k€/an, budget qui existe. Le moat est correct si l'on
capte les déclarations avant GISIS ; il s'évapore si GISIS publie en open data.
- **Risque principal** : le produit est vendu à ceux qui déclarent (armateurs, événement rarissime, zéro douleur) alors que seuls ceux qui indemnisent (P&I) ont un budget.
- **Test Mom Test (2 semaines)** : 10 entretiens — 6 souscripteurs/claims handlers de P&I clubs et courtiers (Gard, Skuld, London P&I via le dossier X-Press Pearl), 4 DPA/HSEQ d'armateurs. Questions rétrospectives uniquement : « Racontez-moi votre dernier dossier de conteneurs perdus : combien de jours pour reconstituer position et contenu ? Qui l'a fait ? Combien avez-vous facturé/payé en expertise externe sur ce dossier ? » Critère de réussite : ≥ 3 clubs citent une facture d'expertise > 20 k€ sur un sinistre récent.
- **Verdict** : Go si… un P&I club signe une LOI de licence data avant tout développement ; sinon c'est un formulaire, pas une société.

## 2. GearTrace — engins de pêche (14/25)

Le déclencheur est le meilleur du lot sur le papier (2023/2842 applicable au 10/01/2026, REP engins
depuis le 31/12/2024, sanctions par points de licence) mais l'échéance est **déjà passée** : on vend
après la vague, aux retardataires, pas dans la fenêtre de panique. Surtout, la structure de prix est
incohérente avec le marché : 68 863 navires × 2-5 € = 140-350 k€ de TAM sur le segment principal.
Les payeurs réels seraient les administrations (DPMA, Fiskeridirektoratet — marché public, 12-18 mois)
et les éco-organismes, dont le français n'est **même pas encore nommé** (décret 2025-775 d'août 2025,
filière en construction). La Norvège a reporté sa REP à mars 2027. Le moat est le seul point solide :
un registre multi-pays branché sur le journal électronique devient très collant. Mais on ne finance
pas 6-9 mois d'ingénierie pour attendre qu'un éco-organisme se constitue.
- **Risque principal** : la douleur est chez le pêcheur (qui ne paie pas) et le budget chez l'administration ou l'éco-organisme (qui n'existe pas encore ou achète en 18 mois).
- **Test Mom Test (2 semaines)** : appeler 8 organisations de producteurs / criées françaises et espagnoles + 3 fabricants d'engins (via l'EFTTA) + Fiskekretsen (Suède, éco-organisme opérationnel, tarif public 6 000 SEK + 10 SEK/kg). Questions : « Comment avez-vous déclaré vos pertes d'engins depuis janvier 2026 ? Montrez-moi le fichier. Qui a payé le développement ? Combien avez-vous dépensé en 2026 pour la conformité 2842 ? » Critère : ≥ 2 acteurs montrent une ligne budgétaire déjà dépensée (tableur Excel maison compte comme signal positif).
- **Verdict** : Go si… un éco-organisme scandinave (Fiskekretsen, Nofir) ou une DG des pêches signe un pilote payant à ≥ 20 k€ ; sinon no-go.

## 3. PelletGuard — granulés plastiques (19/25) ⭐

La meilleure structure réglementaire du dossier, et vérifiée : Règlement (UE) 2025/2365 publié au
JOUE le 26/11/2025, obligations de base (prévention, confinement, formation, **documentation annuelle
des pertes**) déjà applicables depuis le 16/12/2025, gros des obligations au **17/12/2027**,
certification tierce obligatoire ≥ 1 500 t/an, transport maritime au 17/12/2028. C'est le cas d'école
d'une fenêtre commerciale : l'obligation existe, la date est ferme, et il reste 15 mois — c'est
exactement le moment où l'on achète un outil. Cible dénombrable et joignable (adhérents Operation
Clean Sweep, Plastics Europe, plasturgistes, nettoyeurs de citernes). Prix 3-10 k€/site/an :
dérisoire face à un échec de certification. Canal évident : SGS, DNV, DQS ont besoin d'un support de
préparation d'audit qu'ils ne veulent pas construire.
Deux réserves. (1) Le moat est faible : un moteur de plan de gestion des risques est un formulaire
sophistiqué ; les suites EHS (Sphera, Enablon, Intelex) peuvent l'ajouter en un trimestre. La seule
défense crédible est le **registre des certificats** revendu en score de risque fournisseur — à
construire dès le jour 1, pas en V2. (2) Le module caméra IA (petits objets translucides sur quai)
est un puits technique : le sortir du plan de route, il détruira la marge.
- **Risque principal** : produit facile à copier — la course se gagne sur la distribution (certificateurs, fédérations), pas sur la technologie.
- **Test Mom Test (2 semaines)** : 12 entretiens — 8 responsables HSE/qualité de sites plasturgie et logistique vrac (> 1 500 t/an), 2 nettoyeurs de citernes, 2 auditeurs OCS chez SGS/DQS. Questions : « Montrez-moi votre plan de gestion des risques pellets actuel. Qui a rédigé la documentation annuelle des pertes 2026 exigée depuis décembre 2025 ? Combien de jours-homme ? Avez-vous déjà payé un consultant pour l'OCS, et combien ? » Critère : ≥ 5 sites sur 8 avouent un Excel bricolé ou rien du tout, **et** ≥ 3 citent une facture de conseil > 5 k€.
- **Verdict** : **Go** — meilleur rapport urgence/accessibilité/prix, à condition de verrouiller un accord de distribution avec un certificateur avant la ligne 1 de code.

## 4. TrueBlue Claims — preuve d'allégation (14/25)

Piège de calendrier : la directive 2024/825 s'applique au **27/09/2026**, soit dans trois semaines.
On ne construit pas un SaaS pour une échéance à J-22 — soit les marques ont traité le sujet avec leur
cabinet d'avocats, soit elles ne le traiteront pas avant une première sanction DGCCRF. Ensuite, le
segment « allégation plastique océanique » est étroit : quelques centaines de marques dans l'UE, pas
des milliers. Le produit lui-même est un scan LLM + un dossier de preuve — c'est-à-dire une
fonctionnalité qui rejoint naturellement une plateforme de conformité produit (idée 12) ou une offre
de cabinet. Et le désistement de la Green Claims Directive (juin 2025) supprime le mécanisme
« vérification préalable obligatoire » qui aurait créé un acte d'achat récurrent : il ne reste qu'un
risque contentieux diffus, mauvais moteur de vente.
- **Risque principal** : marché adressable trop étroit pour une société autonome et échéance déjà consommée — c'est un module, pas une entreprise.
- **Test Mom Test (2 semaines)** : 10 directions juridiques/RSE de marques utilisant réellement l'allégation (cosmétique, outdoor, mode) + 2 fournisseurs OBP (Oceanworks, #tide). Questions : « Qu'avez-vous fait concrètement depuis mars 2026 pour vos allégations "ocean plastic" ? Qui a rédigé le dossier ? Combien avez-vous facturé par votre cabinet ? Avez-vous retiré une allégation d'un packaging ? » Critère : ≥ 4 marques citent une facture d'avocat > 15 k€ **et** disent que le sujet reviendra chaque année.
- **Verdict** : No-go en tant que société — à intégrer comme module de l'idée 12 ou de l'idée 3.

## 5. Plastic Credit Ratings (11/25)

L'analogie Sylvera/BeZero est séduisante et fausse. Un notateur capte 1 à 2 % de la valeur du marché
sous-jacent : le carbone volontaire pesait plusieurs milliards, le crédit plastique pèse **462 M$**
(2024) — soit un TAM de notation de l'ordre de 5-10 M$ mondial, avant même de discuter la part de
marché. Pire, la dynamique réglementaire va **contre** : la directive 2024/825 interdit les
allégations fondées sur la compensation à partir du 27/09/2026, ce qui attaque la demande même de
crédits. Il n'existe aucune obligation d'audit tiers des crédits plastique. Le produit noterait donc
un marché non obligatoire, non normalisé (Verra, PCX, TÜV SÜD, standards propriétaires) et contesté
publiquement — au bénéfice d'acheteurs qui, précisément, cherchent à ne pas être audités. Le seul
point positif est le moat (registre agrégé + historique de double comptage), mais on ne construit pas
un moat sur un marché qui rétrécit.
- **Risque principal** : noter un marché de 462 M$ que la réglementation européenne est en train de délégitimer — le TAM de la notation est inférieur au coût de l'équipe.
- **Test Mom Test (2 semaines)** : appeler 8 acheteurs corporate ayant réellement acheté des crédits en 2025-2026 (via les listes projets Verra/PCX). Questions : « Combien de crédits avez-vous achetés en 2026 vs 2025 ? Votre budget monte ou baisse depuis EmpCo ? Avez-vous payé quelqu'un pour vérifier un projet, combien ? » Critère : ≥ 3 acheteurs déclarent un budget crédits **en hausse** en 2026 et une dépense de due diligence externe déjà réalisée. À défaut : abandon immédiat.
- **Verdict** : No-go — mauvais timing réglementaire, TAM insuffisant.

## 6. HarbourTwin — logiciel au-dessus des robots (10/25)

Zéro déclencheur réglementaire à date ferme : Pavillon Bleu et Clean Marina sont des labels
volontaires, la directive 2019/883 vise les ports de commerce, pas les marinas. Incohérence de prix
flagrante : le label Pavillon Bleu coûte 700-1 500 €/an à un port, et on propose 500-3 000 €/**mois**
de logiciel par-dessus — c'est 5 à 30 fois le prix de l'objet auquel il se rattache. Le parc de robots
est minuscule (Jellyfishbot ~100 unités) et la valeur du « jumeau numérique » dépend d'API de
fabricants que le dossier lui-même signale comme fermées : on construit une société dont la matière
première est contrôlée par des concurrents potentiels qui vendent déjà leurs propres dashboards
(Seabin 2.0). C'est de l'anti-moat.
- **Risque principal** : dépendance totale à des API de fabricants fermées, pour agréger la donnée d'un parc installé de quelques centaines d'unités, sans obligation qui force l'achat.
- **Test Mom Test (2 semaines)** : demander à 3 fabricants (IADYS/Jellyfishbot, RanMarine, Poralu/BeBot) un accès API documenté et un accord de revente ; en parallèle, 8 capitaineries labellisées Pavillon Bleu : « Montrez-moi le rapport annuel que vous avez rendu pour le label. Combien de temps l'avez-vous mis à le faire ? Avez-vous payé quelqu'un ? » Critère : ≥ 2 fabricants acceptent l'ouverture d'API **et** ≥ 3 ports citent une dépense externe. Le premier volet échouera probablement — et il est bloquant.
- **Verdict** : No-go — pas de contrainte, pas de budget, et le fournisseur de données est le concurrent.

## 7. WasteDeck — conformité déchets navires/ports (16/25)

Bonnes obligations, avec la seule sanction vraiment chiffrée du dossier : Garbage Record Book
obligatoire dès 100 UMS depuis le 01/05/2024 (contre 400 avant — la population de navires concernés a
bondi), amendes dès 15 000 $ pour une erreur documentaire et 25 000 $/infraction aux USA, inspections
15 %/an sous 2019/883. Mais l'idée telle qu'écrite mélange deux entreprises. Le volet **ports**
(1 500-6 000 €/mois, ~500 ports TEN-T) est un marché public européen : appels d'offres, 12-24 mois,
et un concurrent gratuit financé par les autorités portuaires (Portbase). Le volet **navires**
(e-Garbage Record Book tablette, 200-500 €/mois, yachts 1 000-3 000 €/an) est une vente B2B privée à
des milliers de petites flottes que les suites lourdes (ABS, Brenock, cruisePAL) ignorent parce que
le ticket est trop petit pour elles. C'est le wedge. Le moat reste faible (intégration SafeSeaNet +
règles MARPOL codifiées) mais le coût de changement d'un registre légal conservé 2 ans est réel.
- **Risque principal** : se noyer dans les marchés publics portuaires alors que l'argent rapide et récurrent est du côté des petites flottes et des yachts.
- **Test Mom Test (2 semaines)** : 12 entretiens — 8 capitaines/DPA de navires 100-400 UMS et sociétés de gestion de yachts, 4 agents maritimes. Questions : « Montrez-moi votre Garbage Record Book. Papier ou électronique ? Avez-vous eu une remarque en Port State Control depuis mai 2024 ? Combien a coûté la dernière déficience ? Qui remplit les notifications de déchets avant escale et en combien de temps ? » Critère : ≥ 3 interlocuteurs citent une déficience PSC ou une amende réelle liée au registre.
- **Verdict** : Go si… on coupe le volet « ports » du plan de route V1 et qu'on vend l'e-GRB aux flottes 100-400 UMS et aux gestionnaires de yachts.

## 8. CleanScore — indice de propreté des plages (11/25)

La DCSMM descripteur 10 n'impose rien à une **commune** : elle oblige les États membres à rapporter,
sans sanction pour la collectivité. Le seuil des 20 déchets/100 m n'est pas opposable au maire de
Châtelaillon. On vend donc un indicateur à un acheteur qui n'a aucune obligation de l'acheter, sur
un budget (3-8 k€/an) dérisoire au regard de la lourdeur du cycle : marché public, décideur diffus
(mairie, intercommunalité, service technique), appels d'offres. L'exemple des ~400 appels d'offres
« nettoyage plage » en France démontre l'existence d'un marché de **prestation de nettoyage**, pas
d'un marché de mesure. Techniquement c'est aussi le plus lourd du lot (CV terrain, pipeline
multi-sources) alors que la valeur perçue est la plus faible. L'API assureurs/immobilier est de la
science-fiction commerciale à ce stade.
- **Risque principal** : la seule obligation pèse sur l'État membre, pas sur le payeur visé — on vend un tableau de bord à un acheteur public sans contrainte ni budget dédié.
- **Test Mom Test (2 semaines)** : 10 communes littorales (services techniques + élus environnement) + 2 organismes de label (Teragir/Pavillon Bleu, FEE). Questions : « Quelle ligne budgétaire 2026 pour mesurer la propreté de vos plages, hors prestation de nettoyage ? Qui a rempli votre dossier Pavillon Bleu et en combien d'heures ? Avez-vous déjà acheté une prestation de comptage de déchets ? » Critère : ≥ 3 communes montrent une ligne budgétaire « mesure » distincte du nettoyage. Je parie que la réponse est zéro.
- **Verdict** : No-go — au mieux un module vendu aux organismes de label (Teragir, FEE), pas une société.

## 9. RiverEye — points chauds fluviaux (15/25)

Le meilleur déclencheur américain du dossier : California Trash Amendments, 100 % de capture au
**2 décembre 2030**, adossé aux permis NPDES MS4 — la non-conformité est une violation de permis avec
amendes civiles Clean Water Act, et les budgets sont déjà votés. Côté UE, 2024/3019 (transposition
31/07/2027) ajoute une obligation de surveillance des microplastiques. La cible existe et se compte.
Mais trois signaux d'alarme. (1) Plastic Origins, le pipeline open source de référence, s'est **arrêté
en 2025 faute d'industrialisation** après 6 ans, 1 100 campagnes et 8 pays : la faisabilité technique
n'a jamais été le problème, la vente l'était. (2) Le déploiement de caméras fixes sur ponts et
déversoirs impose du terrain, des autorisations et de la maintenance — coût marginal non nul, marge
logicielle dégradée. (3) Marché public américain et agences de l'eau européennes : cycles longs,
subventions plutôt que budgets récurrents. Le moat, en revanche, est réel : la série temporelle par
sous-bassin ne se rachète pas et l'inventaire GIS multi-fournisseurs devient l'outil de travail des
équipes stormwater.
- **Risque principal** : c'est un projet d'infrastructure vendu à des collectivités, pas un SaaS — Plastic Origins a prouvé que la techno marche et que le modèle économique ne marche pas.
- **Test Mom Test (2 semaines)** : 10 stormwater program managers de villes californiennes Phase I/II (LA County, Long Beach, San Diego, Oakland) + 2 fournisseurs de dispositifs (EnviroPod, Storm Water Systems). Questions : « Comment avez-vous produit votre dernier rapport de conformité trash au State Water Board ? Combien d'heures ? Quel consultant, quelle facture ? Que vous coûte l'inspection des dispositifs de capture par an ? » Critère : ≥ 4 villes citent une facture de consultant > 25 k$/an sur le reporting trash — c'est le budget qu'on vient remplacer.
- **Verdict** : Go si… deux villes MS4 californiennes signent un pilote payant (≥ 15 k$) avant tout déploiement matériel ; commencer par le logiciel de reporting, pas par les caméras.

## 10. NurdleRisk — score de risque pour assureurs (10/25)

Le marché adressable se compte sur les doigts : 12 P&I clubs, plus quelques dizaines d'assureurs
corps/cargo et réassureurs. Même à 150 k€/an, on plafonne à quelques millions d'euros de revenu
maximal théorique — et l'assurance maritime est le pire cycle de vente qui soit (12-24 mois,
validation actuarielle, comités). Surtout, le produit est **prématuré** : le flux de données de
pertes créé par SOLAS ne démarre qu'en 2026, il faudra 3 à 5 ans d'historique pour construire un
modèle actuariel défendable. Aucune obligation ne force un assureur à acheter un score. L'idée est
juste : c'est la couche de valeur de l'idée 1, dans quelques années, une fois les données accumulées.
Pas un point de départ.
- **Risque principal** : moins de 50 clients possibles au monde, un cycle de vente de 18 mois, et pas encore de données pour prouver que le score prédit quoi que ce soit.
- **Test Mom Test (2 semaines)** : 6 souscripteurs P&I et 2 courtiers spécialisés. Questions : « Comment tarifez-vous aujourd'hui le risque pollution plastique d'un porte-conteneurs ? Avez-vous déjà acheté un jeu de données ou un score externe, lequel, à quel prix ? Qu'est-ce qui a changé dans votre tarification après X-Press Pearl ? » Critère : ≥ 2 clubs citent un achat de données externes déjà réalisé. Sinon la douleur est intellectuelle, pas budgétaire.
- **Verdict** : No-go autonome — à conserver comme V2 de DriftBox, financée par la donnée déjà collectée.

## 11. DiveLedger — preuve d'impact pour centres de plongée (9/25)

L'idée est honnête avec elle-même : le dossier reconnaît un TAM d'environ 6 M€ (10 000 centres ×
600 €). C'est un TAM de projet, pas de société — et il suppose 100 % de pénétration mondiale d'un
marché nord-américain en contraction (part PADI passée de 55 % à 43 % en un an). Aucun déclencheur
réglementaire : Dive Against Debris est gratuit, l'engagement est volontaire, le bénéfice est
marketing. Un centre de plongée est le pire client SaaS possible : petit, saisonnier, non structuré,
faible propension au paiement récurrent. Le seul scénario défendable est un accord de marque blanche
avec PADI — c'est-à-dire un chiffre d'affaires dépendant à 100 % d'un partenaire unique qui peut
internaliser le produit pour le prix de deux développeurs. Effort faible (2-3 mois-ingénieur), certes,
mais un produit facile à construire et facile à copier, sans obligation, n'est pas une opportunité :
c'est une distraction.
- **Risque principal** : TAM de 6 M€ reconnu par les auteurs eux-mêmes, sans obligation réglementaire et avec une dépendance existentielle à PADI.
- **Test Mom Test (2 semaines)** : 15 centres PADI/SSI (Méditerranée, mer Rouge, Asie du Sud-Est) + le responsable partenariats PADI AWARE. Questions : « Avez-vous déjà payé pour un label ou une certification environnementale (Green Fins, Blue Flag) ? Combien ? Un client vous a-t-il déjà choisi pour ça — comment le savez-vous ? Combien de sorties Dive Against Debris en 2025, et où sont les données ? » Critère : ≥ 5 centres déclarent une dépense annuelle réelle > 500 € pour un label environnemental.
- **Verdict** : No-go — porte d'entrée données, pas société ; à réutiliser gratuitement comme source pour l'idée 8 si celle-ci renaît.

## 12. EPR Atlas — emballages multi-juridictions (20/25)

Le meilleur dossier commercial, et de loin, avec des sanctions qui font mal et des dates vérifiées :
SB 54 californien — règlement permanent entré en vigueur le **01/05/2026**, enregistrement au
**01/06/2026**, **interdiction de vente en Californie au 01/01/2027** pour les non-enregistrés,
~5 741 producteurs concernés, fonds de 5 Md$ ; Inde — blocage du **dédouanement** sans enregistrement
EPR depuis juillet 2025 ; Vietnam — amende jusqu'à 2 Md VND ; PPWR — sanctions notifiées au
12/02/2027. Budget de conformité déjà voté, prix comparables prouvés (rePurpose Global, 500+ marques).
Deux objections, l'une commerciale, l'autre stratégique.
Commerciale : le marché est **déjà encombré** (rePurpose, Recyda, Source Intelligence, Reverse
Logistics Group, Lorax, Clearyst) et le produit est un moteur de règles — reproductible, sans effet de
réseau. Le seul angle crédible est celui identifié par le dossier reg-asia : la couverture
Asie-Pacifique (Inde CPCB, Philippines RA 11898, Vietnam décret 110/2026, Singapour, Thaïlande 2027)
que les acteurs américains couvrent mal, vendue aux marques qui **produisent** en Asie.
Stratégique : le lien avec l'océan est indirect, en amont. C'est le meilleur business du dossier et
le pire alignement avec la mission du BRIEF. Il faut l'assumer ou l'écarter, pas le maquiller.
- **Risque principal** : entrer en concurrence frontale avec des acteurs installés sur un produit sans moat, sur la seule promesse d'une meilleure couverture Asie.
- **Test Mom Test (2 semaines)** : 12 responsables conformité emballage de marques FMCG/cosmétique/électronique multi-pays produisant en Asie. Questions : « Comment avez-vous géré l'enregistrement SB 54 en juin 2026 — outil, consultant, tableur ? Combien facturé ? Qui gère votre enregistrement CPCB en Inde et le QR code depuis juillet 2025 ? Avez-vous déjà eu un conteneur bloqué en douane indienne ? Quels outils de conformité EPR payez-vous aujourd'hui, à quel prix ? » Critère : ≥ 5 marques utilisent déjà un outil payant **et** ≥ 4 déclarent que leur outil ne couvre pas correctement l'Asie (c'est ça, la validation — pas l'absence d'outil).
- **Verdict** : Go si… le test confirme le trou Asie-Pacifique chez les clients d'acteurs existants ; sinon on paie pour entrer dans un marché rouge, hors mission.

---

# Top 3

1. **#3 PelletGuard (19/25)** — ma conviction n°1 malgré la note brute. C'est le seul dossier où
   convergent une obligation vérifiée (règlement UE 2025/2365, JOUE 26/11/2025), une **date ferme
   encore devant nous** (17/12/2027, puis 17/12/2028 pour le maritime), une certification tierce
   obligatoire au-delà de 1 500 t/an — donc un événement d'audit qui déclenche l'achat —, une cible
   dénombrable et joignable, et un prix (3-10 k€/site/an) sans commune mesure avec le coût d'un
   échec. La fenêtre est ouverte 15 mois : c'est maintenant. Conditions : verrouiller un canal
   certificateur (SGS/DNV/DQS) dès la phase de découverte, construire le registre des certificats
   dès la V1 (c'est le seul moat possible), et supprimer le module vision par ordinateur du plan.
2. **#12 EPR Atlas (20/25)** — meilleure note, deuxième en conviction. Sanctions dures et vérifiées
   (interdiction de vente en Californie au 01/01/2027, blocage douanier indien), budgets existants,
   comparables tarifaires prouvés. Mais marché rouge et lien océan indirect : ne s'engager qu'après
   validation du trou Asie-Pacifique auprès de clients d'acteurs installés.
3. **#7 WasteDeck (16/25)** — la seule idée du lot avec une sanction chiffrée qui frappe l'acheteur
   lui-même (15 000 à 25 000 $ pour un registre mal tenu) et une population qui a **triplé** en 2024
   avec l'abaissement du seuil de 400 à 100 UMS. À condition d'abandonner les ports (marché public,
   Portbase gratuit) et de vendre l'e-Garbage Record Book aux petites flottes et aux yachts.

# Bottom 3

1. **#11 DiveLedger (9/25)** — un TAM de 6 M€ reconnu par les auteurs, zéro obligation, un client
   structurellement pauvre et une dépendance existentielle à PADI. Le fait que ce soit rapide à
   construire (2-3 mois-ingénieur) est un argument contre, pas pour : facile à faire = facile à
   copier, dans un marché qui de toute façon ne peut pas payer.
2. **#6 HarbourTwin (10/25)** — aucun texte à date ferme, une incohérence de prix indéfendable
   (500-3 000 €/mois de logiciel greffé sur un label à 700-1 500 €/an), et surtout un modèle dont la
   matière première dépend d'API fermées détenues par des fabricants qui vendent déjà leur propre
   couche data. On ne bâtit pas une société sur la bonne volonté de ses futurs concurrents.
3. **#10 NurdleRisk (10/25)** — moins de 50 clients possibles au monde, cycle de vente assurantiel de
   12-24 mois, et un modèle actuariel qui ne peut pas être crédible avant 3-5 ans d'historique SOLAS.
   Idée juste, timing faux : c'est la V2 de DriftBox, pas un point de départ.

*(Mentions déshonorables : #5 Plastic Credit Ratings et #8 CleanScore, tous deux à 11/25 — le premier
note un marché que la réglementation européenne délégitime, le second vend un indicateur à des
communes qu'aucun texte n'oblige.)*

---

# Vérifications effectuées (2 recherches web)

1. **Règlement (UE) 2025/2365** — confirmé : publié au JOUE le 26/11/2025, premières obligations
   (prévention, confinement, formation, documentation annuelle des pertes) applicables depuis le
   **16/12/2025** ; gros des exigences au **17/12/2027** ; seuil de certification tierce à
   **1 500 t/an**. Sources : [EUR-Lex OJ L 2025/2365](https://eur-lex.europa.eu/legal-content/EN/TXT/PDF/?uri=OJ:L_202502365), [Hogan Lovells](https://www.hoganlovells.com/en/publications/eu-tightens-requirements-for-the-handling-of-plastic-pellets), [DQS](https://www.dqsglobal.com/en/explore/blog/new-eu-regulation-on-preventing-plastic-pellet-loss-how-ocs-certification-supports-compliance).
   → Corrige le dossier `reg-europe/findings.md`, qui indiquait un seuil de 1 000 t/an et une
   application « 2027-2028 » ; `ports-shipping/findings.md` était juste.
2. **Californie SB 54** — confirmé : règlement permanent approuvé par l'Office of Administrative Law
   et en vigueur le **01/05/2026** ; enregistrement producteurs au **01/06/2026** ; **interdiction de
   vente au 01/01/2027** pour les non-enregistrés ; jalons de recyclage 30 % (2028), 40 % (2030),
   65 % (2032). Sources : [Mayer Brown](https://www.mayerbrown.com/en/insights/publications/2026/06/californias-sb-54-epr-regulations-take-effect-key-deadlines-and-compliance-obligations-for-producers), [Holland & Knight](https://www.hklaw.com/en/insights/publications/2026/05/californias-final-epr-regulations-now-in-effect), [CalRecycle](https://calrecycle.ca.gov/laws/rulemaking/sb54regulations/).

# Réserves factuelles à lever avant tout investissement

- **« Amende plancher de 4 % du CA » (idée 3)** : provient de la *proposition* de la Commission de
  2023 (CELEX 52023PC0645, cité par `rivers-upstream`), pas du texte adopté. À vérifier dans le
  texte final avant d'en faire un argument de vente — c'est le pilier de l'argumentaire d'urgence.
- **Éco-organisme REP engins de pêche en France (idée 2)** : décret n° 2025-775 du 05/08/2025, mais
  aucun éco-organisme agréé ni tarif public identifié par `fishing-aquaculture`. Pas de payeur
  identifié = pas de business case.
- **Nombre de ports TEN-T « sans PCS dédié » (idée 7)** : les ~500 ports sont une estimation, non un
  décompte. Sans dénombrement, le TAM portuaire n'est pas défendable.
- **Périmètre CSRD (idée 5)** : le chiffre de « ~5 000 grands groupes » est une déduction non
  confirmée dans `brands-esg-finance`, pas une donnée officielle.
- **API des fabricants de robots (idée 6)** : `IDEAS.md` note lui-même le risque « API souvent
  fermées ». C'est un risque bloquant, pas un risque à moyenner.
