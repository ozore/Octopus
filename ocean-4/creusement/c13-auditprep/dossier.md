# Dossier de creusement — Candidat 13 : AuditPrep

Copilote qui lit les journaux d'une ferme aquacole ou d'un navire de pêche et les pré-cartographie
contre les grilles ASC, MSC ou BAP avant l'arrivée de l'auditeur. Vendu aux sites certifiés ou aux
organismes certificateurs. Rédigé 7 septembre 2026. Dossiers d'origine : agents/aquaculture-peche
(candidat 2) et agents/bureaux-labos (candidat 5), qui proposent tous deux, indépendamment, une
version de ce produit. Acronymes : **ASC** (Aquaculture Stewardship Council), **MSC** (Marine
Stewardship Council), **BAP** (Best Aquaculture Practices, programme de la **GSA** = Global
Seafood Alliance), **CoC** (Chain of Custody, traçabilité de la chaîne de contrôle), **CAB**
(Conformity Assessment Body, organisme certificateur accrédité), **GFSI** (Global Food Safety
Initiative, référentiel générique de sécurité alimentaire), **LLM** (grand modèle de langage).

## 1. Trois angles candidats

**A. Gabarit réglementaire versionné.** Le produit maintient en continu la correspondance exacte
entre un journal brut et les indicateurs numérotés d'ASC, MSC ou BAP, mise à jour à chaque révision
de norme, ce qu'un LLM générique avec un simple gabarit ne fait pas de lui même.
**B. Historique cumulé par site.** Le produit mémorise, d'un cycle d'audit à l'autre, les
non conformités relevées et les corrections apportées, ce qu'un consultant ponctuel ou un outil
générique sans mémoire ne conserve pas.
**C. Position bifronte dans la chaîne.** Le produit se vend à la fois au site et à l'organisme
certificateur (Bureau Veritas, DNV, SCS, Intertek), qui l'utiliserait pour accélérer sa propre revue
documentaire avant l'audit terrain.

## 2. Confirmation, contradiction, verdict

**A.** Confirme : les référentiels sont publics et détaillés (25 indicateurs MSC, seuils 60/80 ;
standards BAP Farm 3.1, Hatchery 2.1, Feed Mill 3.3, Processing 6.0), vérifiée sur msc.org et
bapcertification.org. Aucun outil commercial dédié à ce mapping n'a été identifié dans les deux
dossiers d'origine ni dans mes recherches. Contredit : MSC et ASC ont déjà digitalisé leur propre
plateforme d'audit CoC (remplacement du système eCert, plateforme unique lancée en test mi 2023,
généralisée en septembre 2023) et BAP possède un portail de certification nommé Prism
(prism-landing.globalseafood.org, existence vérifiée par WebFetch, contenu détaillé non accessible).
Les certificateurs construisent donc déjà leurs propres rails numériques, ce qui indique une
trajectoire où ils pourraient absorber ce mapping en interne plutôt que l'acheter. Verdict : angle
réel aujourd'hui (aucun concurrent commercial trouvé), mais fragile à moyen terme si Prism ou la
plateforme MSC/ASC s'enrichissent d'une couche de pré-évaluation.

**B.** Confirme : le retour annuel est vérifié pour MSC (« audits every year of the five-year
certification period », msc.org), donc la matière pour accumuler existe. Contredit : n'importe quel
logiciel qui garde un historique accumule par construction, ce n'est pas propre à AuditPrep ; un
concurrent qui copie le gabarit A accumule aussi son propre historique dès l'année 2. Verdict :
argument valide pour expliquer pourquoi le client revient (réponse à Q7 des instructions), mais ce
n'est pas en soi ce qui fait gagner le premier contrat.

**C.** Confirme : le dossier bureaux-labos nomme déjà les CAB (Bureau Veritas, DNV, SCS, Intertek)
comme acheteurs potentiels de conseil pré-audit, et SCS vend explicitement des services
« ASC Certification » et « MSC Certification » sur son site. Contredit : ces CAB facturent l'audit au
temps ou à la complexité ; un outil qui accélère leur revue documentaire réduit leurs honoraires
facturables, ce qui crée un désincitatif économique direct à l'achat, sauf s'ils le refacturent au
site ou passent au forfait. Verdict : angle qui tombe, le conflit d'intérêt structurel est trop
direct pour un acheteur de 2 000 dollars.

## 3. Angle retenu

Angle A (gabarit réglementaire versionné), avec B comme mécanisme de rétention et non comme
différenciateur d'entrée. C tombe pour la raison ci dessus. B tombe en tant qu'angle autonome car
n'importe quel logiciel à mémoire produit le même effet après un ou deux cycles ; il reste dans le
produit uniquement pour répondre à la question du retour client (section 6). Ce qui reste :
personne n'a construit et maintenu, à ma connaissance vérifiée dans ce budget de recherche, un
gabarit de correspondance journal vers indicateur pour ASC, MSC et BAP à jour de leurs révisions,
avec citation exacte du passage source pour chaque case cochée.

## 4. Acheteur, terre à terre

Acheteur nommé : le responsable qualité ou durabilité d'un site aquacole certifié ou en voie de
certification (ferme salmonicole ou coquillage, taille moyenne, hors les quatre majors qui ont déjà
un service conformité interne), ou le coordinateur technique d'un CAB local. Dépense actuelle : un
audit MSC coûte 15 000 à 120 000 USD (jusqu'à 250 000 USD selon d'autres prestataires), chiffre
qualifié d'« anecdotique » par le MSC lui même (vérifiée, msc.org, hérité du dossier candidat 2).
Aucun chiffre équivalent trouvé pour ASC ou BAP malgré une tentative WebFetch dédiée sur
bapcertification.org (lacune assumée). Par comparaison, hors secteur marin, un consultant de
préparation d'audit GFSI facture 2 500 à 12 000 USD selon la complexité (vérifiée, sources
agrégées food safety, comparanda seulement, pas le même référentiel). Qui signe un bon de commande
de 2 000 dollars : le responsable qualité du site lui même, sans validation de comité, s'il s'agit
d'un pré-audit ponctuel facturé en dessous de son budget consultant habituel.

## 5. Fonctionnalités, dans l'ordre de vente

1. Le site téléverse ses journaux (traitements, mortalité, registres alimentaires, PDF scannés,
   tableurs, plusieurs langues).
2. Le copilote les cartographie contre la grille cible (25 indicateurs MSC, standard BAP Farm 3.1
   ou équivalent ASC) et affiche indicateur par indicateur : couvert, manquant, ambigu.
3. Chaque case « couverte » cite le passage source exact du journal, jamais une affirmation libre.
4. Le copilote signale les incohérences entre documents (dates, chiffres qui ne concordent pas).
5. Il produit un rapport de pré-audit priorisé, gardé en interne au site.
6. Il mémorise les écarts et corrections d'un cycle à l'autre pour accélérer le renouvellement.
Ce que l'IA fait précisément : extraction multimodale de documents hétérogènes puis mise en
correspondance sémantique contre un gabarit fixe, jamais de décision de conformité elle même.
Vérifié : contenu des référentiels publics, coûts MSC, existence de Prism et de la plateforme
CoC digitale. Supposé : performance réelle sur journaux dégradés multilingues, volonté des sites de
partager des documents internes, acceptation par les CAB d'un pré-rapport tiers.

## 6. Prix, modèle, retour l'année suivante

Prix par pré-audit ponctuel (quelques centaines à environ 1 500 USD, très inférieur au coût de
l'audit lui même) ou abonnement annuel par site incluant la mémoire de cycle. Le client revient
l'année suivante parce que son historique de non conformités et de corrections vit dans le produit :
recommencer avec un autre outil ou un consultant signifie perdre cette continuité et repayer le
temps de remise en contexte (réponse à Q7, angle B en soutien de l'angle A retenu).

## 7. Faisabilité depuis Vancouver

Données accessibles : les référentiels ASC, MSC et BAP sont publics et téléchargeables en PDF sur
asc-aqua.org, msc.org et bapcertification.org (licence de consultation non vérifiée précisément
dans ce budget). Les journaux de sites eux mêmes ne sont pas publics : il faut un client pilote
prêt à en partager un échantillon, ce n'est pas un problème de licence mais de confiance
commerciale. Matériel : aucun, API LLM plus OCR standard. Permis : aucun permis réglementaire requis
pour un logiciel de mise en correspondance documentaire ; seule une clause de confidentialité
contractuelle est nécessaire si les journaux contiennent des données sensibles (personnel,
finances). Vrai blocage : obtenir un premier site pilote qui accepte de partager des journaux réels
et convaincre, à terme, un CAB de prendre au sérieux un pré-rapport produit par un tiers.

## 8. La preuve se retourne-t-elle contre l'acheteur

Oui, potentiellement. Un rapport qui liste précisément les non conformités d'un site devient une
preuve documentaire que le site savait et n'a pas corrigé, exploitable contre lui si elle atteint
l'auditeur, un régulateur ou une procédure judiciaire. L'architecture doit donc garder le rapport
strictement privé au site (jamais transmis automatiquement au certificateur), laisser le site
choisir ce qu'il corrige avant de présenter lui même son dossier, et offrir une suppression du
détail des écarts une fois corrigés plutôt qu'un historique immuable horodaté.

## 9. Test à moins de 2 000 dollars, deux semaines

Recruter un site pilote (ferme indépendante de taille moyenne, hors majors) prêt à partager un ou
deux ans de journaux réels et sa dernière grille d'audit ASC, MSC ou BAP. Construire un prototype
qui cartographie 10 à 15 indicateurs choisis. Critère chiffré : au moins 80 % des indicateurs testés
classés correctement (couvert, manquant, ambigu) en accord avec le jugement d'un connaisseur du
référentiel (le site lui même ou un consultant freelance payé quelques heures sur le budget
restant), coût API sous 200 dollars, reste du budget pour le consultant de validation.

## 10. Incertitudes et question au client

Incertain : coût réel de préparation ASC et BAP (non trouvé, contrairement à MSC) ; volonté des
sites de partager des journaux internes avec un logiciel tiers ; acceptation par les CAB d'un
pré-rapport externe ; ampleur réelle du risque de la section 8. Question à poser au premier client
potentiel : accepteriez vous de partager un échantillon anonymisé de vos journaux de conformité et
les écarts de votre dernier audit pour un test gratuit de pré-cartographie, et combien d'heures
internes ou de consultant dépensez vous aujourd'hui à préparer un audit ASC, MSC ou BAP.

---

**Résumé en 8 lignes.** AuditPrep cartographie les journaux d'un site contre les grilles publiques
ASC, MSC et BAP avant l'audit humain. L'angle retenu est un gabarit réglementaire versionné et
sourcé, absent des outils génériques trouvés (iAuditor, Intelex, EcoVadis ne couvrent pas ces
référentiels) et non répliqué par un LLM nu. L'angle « vendre aussi aux certificateurs » tombe : ils
facturent au temps, un outil qui accélère leur revue réduit leurs honoraires. L'acheteur solide est
le responsable qualité d'un site moyen, dépense actuelle 15 000 à 120 000 USD par audit MSC (ASC et
BAP non chiffrés, lacune assumée). Le vrai risque n'est pas technique mais probatoire : un rapport
d'écarts trop précis peut se retourner contre le site, d'où un produit strictement privé et non
transmis au certificateur. Le lien avec la préservation de l'océan reste indirect : la littérature
académique (PLOS One, Springer, ScienceDirect) documente des doutes sérieux sur l'efficacité
environnementale réelle d'ASC et MSC eux mêmes, donc mieux préparer un audit n'améliore pas la
norme, seulement la fiabilité documentaire et le temps de l'auditeur sur le terrain. Test proposé :
un site pilote, 10 à 15 indicateurs, 80 % de classement correct validé par un connaisseur du
référentiel, sous 2 000 dollars.
