# Verdict technologique — les 12 idées de la seconde passe « Ocean Plastic »

Agent : critic-tech-2 (CTO / architecte IA & données) · Date : 2026-09-06
Sources internes : `ocean-plastic-2/IDEAS.md`, `ocean-plastic-2/BRIEF.md`,
`ocean-plastic-2/agents/tech-detection/dossier.md` (TRL, datasets, prix matériel),
`ocean-plastic/agents/tech-landscape/findings.md` § d (grille d'effort réutilisée).
3 recherches web (budget : 4) — journal dans `claude.md`.

---

## Avertissement de méthode (à lire avant le tableau)

> **Tous les chiffres d'effort et de coût ci-dessous sont des ESTIMATIONS de ma part.** Aucun n'est
> sourcé. Les faits techniques (TRL, datasets, prix matériel, limites de méthode) viennent du dossier
> `tech-detection` et de mes 3 recherches.

**Conversion « équipe » → « solo ».** La grille de `tech-landscape/findings.md` § d chiffre l'effort en
mois-ingénieur (m-i) pour une **équipe de 2-4 personnes**. Le mandat porte sur un **fondateur seul**.
Je publie donc deux grandeurs distinctes et je refuse de les confondre :

- **Effort m-i** : la charge au sens de la grille (comparable d'une idée à l'autre, comparable aux
  chiffres d'IDEAS.md).
- **Mois calendaires solo** : le temps réel avant un produit *facturable*. Hypothèse assumée :
  **un fondateur seul avec Claude produit ~0,6 m-i utile par mois calendaire**. Claude accélère
  massivement l'écriture de code (facteur 2-3 sur le CRUD, le parsing, les rapports) mais **n'accélère
  pas** : la collecte de données terrain, l'annotation, l'intégration matérielle, le support, la vente,
  l'attente réglementaire. Sur les idées où le chemin critique n'est pas du code (7, 8, 10, 11),
  Claude n'apporte presque rien et le facteur tombe à 0,3-0,4.

**Coût MVP k$ CAD** = dépenses **de poche sur 12 mois**, hors salaire du fondateur (il est bootstrap :
son temps n'est pas une sortie de trésorerie). Comprend : matériel du commerce, cloud/GPU/API,
analyses de laboratoire, location de bateau/drone, déplacements, assurance RC, frais de licence.
C'est la seule lecture compatible avec la contrainte « bootstrap < 25 k$ CAD » du BRIEF.

**Conventions de notation (1 à 5).** Attention : **une seule colonne s'interprète à l'envers.**

| Axe | 1 signifie | 5 signifie |
|---|---|---|
| **Faisabilité solo 12 m** | un fondateur seul n'a rien de vendable au bout de 12 mois | produit vendu et facturé avant 12 mois, seul |
| **Dépendance tierce** ⚠️ *(5 = MAUVAIS)* | autonome : données ouvertes, matériel banal, plusieurs clients | verrouillé par un tiers : 1-3 clients au monde, matériel sur devis, labo obligatoire, décision réglementaire à venir |
| **Avantage IA réel** | un tableur ou un inspecteur avec un téléphone fait pareil | l'IA fait quelque chose qu'aucun processus manuel ne fait à ce coût |
| **Défendabilité par la donnée** | la donnée est publique ou se périme en un an | corpus propriétaire, cumulatif, non rétro-constructible par un concurrent |
| **Budget matériel < 10 k$ CAD** | impossible sous 10 k$ | zéro ou quasi-zéro matériel |

---

## Tableau de synthèse

| # | Idée | Faisab. solo 12 m | Dépendance ⚠️(5=mauvais) | Avantage IA | Défendabilité donnée | Budget mat. <10 k$ | Effort m-i | Coût MVP k$ CAD | Score techno /25 |
|---|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| 1 | **GhostSonar** | 5 | 2 | 4 | 5 | 5 | 4-6 | 8-15 | **23** |
| 4 | **FloatWatch** | 5 | 2 | 3 | 4 | 5 | 3-5 | 5-10 | **21** |
| 9 | **CoastalTrace** | 4 | 3 | 3 | 5 | 5 | 5-7 | 4-9 | **20** |
| 2 | **GrantMRV** | 5 | 3 | 2 | 3 | 5 | 3-4 | 3-8 | **18** |
| 10 | **PolyID** | 3 | 4 | 4 | 5 | 2 | 7-10 | 10-28 | **16** |
| 7 | **MicroScreen** | 3 | 4 | 3 | 4 | 3 | 6-9 | 12-25 | **15** |
| 5 | **VesselRisk** | 3 | 4 | 2 | 3 | 4 | 5-8 | 6-14 | **14** |
| 3 | **NetPen Ledger** | 4 | 5 | 2 | 2 | 4 | 4-6 | 6-14 | **13** |
| 12 | **HullCycle** | 3 | 5 | 2 | 2 | 5 | 4-6 | 4-9 | **13** |
| 8 | **TireWatch** | 3 | 5 | 2 | 4 | 2 | 5-8 | 20-45 | **12** |
| 6 | **StormDebris** | 2 | 5 | 2 | 2 | 2 | 6-9 | 20-40 | **9** |
| 11 | **FiberScore** | 2 | 5 | 2 | 3 | 1 | 8-12 | 30-60 | **9** |

*Score techno = faisabilité + (6 − dépendance) + avantage IA + défendabilité + budget. Purement
technologique : il ignore la taille de marché, le prix de vente et l'appétence des acheteurs — que
critic-vc et critic-ocean jugent mieux que moi.*

---

## Fiches par idée

### 1. GhostSonar — score 23 · **la seule idée où le matériel, les données et le code s'alignent**
**Architecture MVP (4 briques).** (a) *Ingestion des logs sonar* — **entièrement open source, ne rien
réécrire** : `PINGVerter` / `PINGMapper` (Python) décodent Humminbird `.DAT/.SON/.IDX`, Lowrance
`.sl2/.sl3`, Garmin `.RSD` et Cerulean ; `sonarlight` et `python-sllib` en secours. C'est le cadeau
technique du mandat : le poste que tout le monde croit dur (formats propriétaires) est déjà résolu.
(b) *Détection* — **à construire** : fine-tuning d'un détecteur (RF-DETR Apache-2.0 de préférence,
YOLO Ultralytics étant AGPL-3.0 et payant en usage commercial) sur AI4Shipwrecks (286 images) et
SeabedObjects-KLSG, **plus un dataset propre PNW** : c'est l'actif. (c) *Carte multi-organisation* —
PostGIS + MapLibre, gratuit, modèle de permissions à construire. (d) *Rapport de tonnage/subvention* —
templating, faible. **Je sors la « prédiction de dépôt » du MVP** (voir promesses à corriger).
**Matériel.** Aucun côté client. Pour constituer le dataset : un sondeur à imagerie latérale
d'occasion (Humminbird Helix 7 SI ≈ 800-1 200 $ CAD, Lowrance HDS + Active Imaging 1 500-2 500 $),
temps bateau via les clubs. **2-5 k$ CAD.**
**Solo.** 3 mois : ingestion 3 formats + mosaïque géoréférencée + annotation assistée + carte partagée
— **vendable comme outil de relevé, sans IA**. 6 mois : détecteur entraîné sur 2 000-5 000 vignettes,
rapport bailleur. 12 mois : 10-20 organisations, base inter-bassins, licence de données MPO/NOAA.
**Coût MVP 8-15 k$ CAD.**
**Risque n°1 (masqué par IDEAS.md) : les fonds rocheux.** GhostVision et U. Delaware opèrent sur des
fonds **mous et plats** (Delaware Inland Bays, Chesapeake). La côte de Colombie-Britannique est
rocheuse, en forte pente, avec du kelp — un casier y a la même signature acoustique qu'un bloc. Le
taux de faux positifs peut être 5-10× celui des papiers.
**Dérisquage 4 semaines à Vancouver.** Emprunter/louer un Helix SI ; 4 sorties (Howe Sound, Burrard
Inlet, Indian Arm, Steveston) avec les deux clubs ; **déposer 3-5 cibles connues** (vieux casier,
panneau de filet lesté) entre 5 et 25 m, les relever au sonar, **vérifier en plongée**. Livrable :
distance de détection réelle et FP/km de ligne, fond rocheux vs vaseux. Go/no-go chiffré, < 2 k$.

### 2. GrantMRV — score 18 · **le revenu le plus rapide, l'actif technologique le plus faible**
**Architecture MVP (4 briques).** (a) *App terrain hors ligne* — **à construire**, mais patterns
banals : Flutter/React Native + SQLite + synchronisation (PowerSync/ElectricSQL, open source).
(b) *Taxonomies* — OSPAR/MDMAP/NOAA publiques et gratuites, à ingérer, pas à inventer. (c) *Moteur de
rapport par bailleur* — **à construire, et c'est là qu'est toute la valeur** : un modèle de données
unique → N gabarits (MPO Ghost Gear Fund, NOAA MDP, NFWF, Transports Canada, FaSS UK). (d) *Portail
bailleur* — CRUD.
**Matériel.** Aucun. Téléphones des bénévoles. Ajouter une **balance à crochet numérique 50-300 $**
(voir promesses à corriger). **< 1 k$ CAD.**
**Solo.** 3 mois : app + **un seul** gabarit (MPO) — déjà facturable 50-150 $/mois. 6 mois : 4-5
gabarits + tableau de bord de campagne. 12 mois : 40-60 organisations, licence bailleur.
**Coût MVP 3-8 k$ CAD.**
**Verdict technique.** C'est du logiciel de gestion très bien ciblé, pas un produit IA. Fulcrum à
2 580-3 300 $/an prouve le prix de référence ; la barrière est la **bibliothèque de gabarits**
(actif de contenu, copiable mais fastidieux), pas la technologie. Note IA 2 assumée.
**Risque n°1.** Que les gabarits générés ne soient pas acceptés tels quels par les chargés de
programme, ce qui renvoie l'ONG à Word et tue l'abonnement.
**Dérisquage 4 semaines.** Obtenir de 2 bénéficiaires (Ocean Legacy, T. Buck Suzuki) leur **dernier
rapport final MPO réel**, et vérifier champ par champ combien sont dérivables du modèle de données.
En parallèle, 3 sorties de nettoyage avec saisie papier ET app. Seuil de décision : **≥ 90 % des
champs dérivables**, sinon le produit n'est qu'un carnet de terrain de plus.

### 3. NetPen Ledger — score 13 · **techniquement facile, commercialement verrouillé**
**Architecture MVP (4 briques).** (a) *Inventaire d'actifs* — drone + photos, CV pour compter
filets/flotteurs/ancrages : **à construire intégralement**, aucun dataset existant. (b) *Chaîne de
traçabilité* — CRUD + signature + horodatage géolocalisé, gratuit à construire. (c) *Dossier de remise
en état* — templating. (d) *Tableau de bord multi-sites*.
**Matériel.** Drone DJI Mavic 3E ≈ 5-6 k$ CAD (ou Mini 4 Pro 1,1 k$), déplacements île de Vancouver
et Campbell River. **6-14 k$ CAD** — mais **l'accès aux sites n'est pas achetable** : il passe par
l'opérateur.
**Solo.** 3 mois : traçabilité + dossier réglementaire, sans CV. 6 mois : un site pilote livré.
12 mois : 2 opérateurs — **si et seulement si** un contrat est signé au mois 4.
**Risque n°1 : il n'est pas technique.** Trois clients au monde (Mowi, Cermaq, Grieg), cycle d'achat
de 9-18 mois, et une échéance politique (30/06/2029) qui peut glisser. Le CV de comptage résout par
ailleurs un **faux problème** : l'opérateur connaît déjà son inventaire par sa comptabilité d'actifs.
**Dérisquage 4 semaines.** Aucun test terrain n'a de sens. Test d'**achat** : 3 entretiens (Mowi
Canada West, Cermaq Canada, un sous-traitant de démontage / plongeurs pro de Nanaimo) + une question
écrite au secrétariat de transition : **qui porte l'obligation de preuve de remise en état, et sur
quelle ligne budgétaire ?** Si personne ne dit « budget 2027 », abandonner.

### 4. FloatWatch — score 21 · **la meilleure idée pour un fondateur PLONGEUR**
**Architecture MVP (5 briques).** (a) *Capture* — caméra sur perche sous les pontons + plongée +
drone en appoint. (b) *CV 3-4 classes* (mousse exposée / dégradée / encapsulée / conforme) — **à
construire**, aucun dataset EPS marin n'existe (vide confirmé par le dossier tech-detection), mais la
cible est visuellement très distinctive (blanc, texture granuleuse, cassure caractéristique) :
**500-1 500 images suffisent** — c'est le meilleur ratio effort/résultat en vision du mandat.
(c) *Registre par ponton et par bail* — PostGIS + photo horodatée, gratuit/à construire. (d) *Avis de
non-conformité* pré-rempli RCW 70A.245.130 / conditions de licence conchylicole MPO — templating.
(e) *Portail de plaintes riveraines* — CRUD.
**Matériel.** DJI Mini 4 Pro ≈ 1 100 $ CAD (< 250 g : règles Transport Canada allégées), GoPro +
perche 800 $, caméra sous-marine filaire 300-800 $, éventuellement un scooter/lampes de plongée déjà
possédés. **2-4 k$ CAD.**
**Solo.** 3 mois : audit assisté (capture + registre + rapport), **facturable 500-2 000 $ par marina
dès le premier mois**, sans une ligne d'IA. 6 mois : CV opérationnel + abonnement de suivi.
12 mois : 30-60 marinas + première licence comté/Ecology. **Coût MVP 5-10 k$ CAD.**
**Risque n°1 : la géométrie.** La mousse **conforme est encapsulée**, et la mousse **est sous le
ponton**. Un drone nadir ne voit que le platelage. La promesse « inspection par drone » d'IDEAS.md
est donc largement fausse — et c'est une bonne nouvelle : l'inspection utile est **sous-marine**, donc
dans la compétence rare du fondateur, ce qui est une barrière contre un concurrent logiciel pur.
**Dérisquage 4 semaines.** 5 marinas (False Creek, Coal Harbour, Steveston, Deep Cove, Richmond) ;
sur 20 doigts par marina, comparer **3 modalités** — drone nadir, caméra sur perche sous le ponton,
plongée. Mesurer le % de flotteurs dégradés détectés par modalité. Ce test **définit le produit** et
coûte < 1,5 k$.

### 5. VesselRisk — score 14 · **le bon signal n'est pas visuel, il est administratif**
**Architecture MVP (4 briques).** (a) *Agrégation des registres publics* — WA DNR « vessels of
concern » (mis à jour 02/09/2026), FWC, Transports Canada : scraping, **gratuit**. (b) *Score de
risque* — à construire. (c) *Détection de changement* — caméras de quai / drone. (d) *Dossier de
preuve* par programme (SAVE, DVRP, FWC, TC) — templating.
**Matériel.** Caméras timelapse (Brinno/Reconyx 300-1 000 $ pièce), drone 1-2 k$, imagerie satellite
commerciale si on y va (là est le vrai coût). **6-14 k$ CAD.**
**Solo.** 3 mois : registre agrégé + score à règles. 6 mois : 2 marinas pilotes. 12 mois : une agence.
**Risque n°1 : la vision par satellite ne peut pas fonctionner.** Un bateau de 8 m à 50 cm/pixel
occupe ~16 × 3 pixels vus du dessus : la **gîte** et la **ligne de flottaison** — deux grandeurs
verticales — n'y sont pas mesurables. Le signal d'abandon est administratif : immatriculation
expirée, mouillage impayé, propriétaire injoignable, immobilité prolongée.
**Second risque, non technique et grave** : les acheteurs n'ont plus d'argent (remboursements
DVRP suspendus jusqu'en juin 2027 ; FWC passé de 20 M$ à 4,9 M$).
**Dérisquage 4 semaines.** Zéro image. Construire un jeu de **100 navires étiquetés** (50 devenus
épaves 2022-2026 depuis l'inventaire public WA DNR + 50 témoins) et tester si des variables purement
administratives prédisent l'abandon. Si l'AUC dépasse 0,75 sans vision, **tout le volet imagerie
saute** et l'idée devient un produit de données à coût matériel nul.

### 6. StormDebris — score 9 · **le pipeline est plausible, l'opération ne l'est pas**
**Architecture MVP (4 briques).** (a) *Relevé drone* 24-48 h. (b) *CV* — fine-tuning xBD, **et c'est
le problème** (voir promesses). (c) *Sonar* pour l'immergé — recyclable depuis GhostSonar. (d)
*Rapport GIS conforme FEMA* + réconciliation de tickets — la seule brique qui vaut de l'argent.
**Matériel.** Drone thermique DJI (M30T ≈ 15-20 k$ CAD estimé), sonar 1,5 k$, assurance RC US,
déplacements Floride. **20-40 k$ CAD : hors budget bootstrap.**
**Solo.** 3 mois : rien de vendable — le produit n'existe qu'après une tempête. 12 mois : quelques
missions ponctuelles. C'est un **métier de service saisonnier**, pas un SaaS ; il ne capitalise pas.
**Risques bloquants, cumulés.** (i) La FAA impose des **TFR** après ouragan : voler en 24-48 h est
juridiquement improbable pour un opérateur étranger sans accréditation locale. (ii) Part 107 +
assurance + présence physique en Floride depuis Vancouver. (iii) Les comtés ont déjà des contrats
pluriannuels de monitoring. (iv) Le **thermique ne voit pas le plastique** : aucun contraste
d'émissivité exploitable sur des débris mouillés.
**Dérisquage 4 semaines (le seul utile est téléphonique).** Appeler Tetra Tech, Rostan et Thompson et
poser une question : « sous-traitez-vous la partie **débris immergés**, et à quel prix ? ». En
parallèle, tester le pipeline sur une rivière atmosphérique de novembre sur une marina de Vancouver.
Si les trois cabinets répondent « on ne facture pas l'immergé », l'idée n'a pas de marché.

### 7. MicroScreen — score 15 · **bon actif de données, mais la chimie n'est pas du logiciel**
**Architecture MVP (4 briques).** (a) *Préparation d'échantillon* — filtration, digestion Fenton/H₂O₂,
**espace anti-contamination** (les fibres de l'air sont le faux positif n°1) : ce n'est ni du logiciel
ni du matériel du commerce. (b) *Imagerie fluorescente* — Nile red + excitation ~470 nm + filtre
d'émission : **pas une webcam microscope à 50-200 $**. (c) *Comptage* — MP-VAT/ImageJ **gratuit**, à
améliorer (segmentation, k-means pour réduire les faux positifs organiques). (d) *Module SB 1422*
(calendrier, chaîne de conservation, rapport public) — **la brique la plus vendable et la seule sans
laboratoire**.
**Matériel réel.** Rampe de filtration sous vide 500-1 500 $, stéréomicroscope à épifluorescence ou
montage LED + filtres 2-6 k$, verrerie/consommables, analyses de confirmation en labo tiers.
**12-25 k$ CAD.**
**Solo.** 3 mois : module de gestion SB 1422 seul — vendable, zéro chimie. 6 mois : comptage assisté
sur images fournies par des labos partenaires (modèle « Purency low-cost », sans posséder d'appareil).
12 mois : service à l'échantillon **si** un labo partenaire est signé.
**Risque n°1 : Nile red ne mesure pas ce que la loi demande.** Il colore les particules lipophiles, y
compris chitine, lignine et cuticules → faux positifs ; l'écart de comptage avec le Raman atteint
**421 %** selon la granulométrie (littérature 2025). Et il **n'identifie pas le polymère**, alors que
SB 1422 impose Raman ou IR. Le produit ne peut donc être vendu que comme **pré-criblage/priorisation**,
jamais comme conformité.
**Dérisquage 4 semaines.** 20 échantillons du Grand Vancouver, **split** : la moitié par le kit, la
moitié envoyée à un labo (UBC/SFU ou ELAP). Mesurer la **corrélation de rang**. Seuil : si
ρ < 0,6, le pré-criblage ne vaut rien commercialement. 2-4 k$ d'analyses.

### 8. TireWatch — score 12 · **le vide technologique n'est pas une opportunité pour un développeur seul**
**Architecture MVP (4 briques).** (a) *Capteurs turbidité/débit* du commerce. (b) *Déclenchement
pluie* — données Environnement Canada, **gratuites**. (c) *Logistique labo LC-MS/MS* — tiers,
300-800 $ l'échantillon. (d) *Modèle de priorisation par bassin* — données ouvertes (trafic,
imperméabilisation, frayères PSF/MPO), **la seule brique à coût nul**.
**Matériel.** Un point correctement instrumenté = sonde multiparamètre 5-8 k$ **plus** un préleveur
automatique réfrigéré type ISCO 8-15 k$ US : **15-30 k$ CAD pour un seul point**. Le tarif annoncé de
8-20 k$/an par point ne couvre même pas l'amortissement de la première année.
**Solo.** 3 mois : modèle de priorisation cartographique, SaaS pur, 0 $ de matériel. 6 mois : 1-2
municipalités pilotes. 12 mois : campagnes d'échantillonnage **manuel** (bouteille + glacière, zéro
capteur) — plus rapide, moins cher et scientifiquement équivalent au first flush.
**Risque n°1 : le proxy n'existe pas.** Le 6PPD-quinone est **dissous**, pas particulaire ; la
turbidité ne le trace pas. Aucun capteur terrain commercial n'existe (confirmé par deux sources
indépendantes dans le dossier tech-detection). Le produit repose donc entièrement sur des analyses de
laboratoire payées par quelqu'un d'autre, et la réglementation Ecology n'arrive qu'en **06/2028**.
**Dérisquage 4 semaines.** 8-12 prélèvements manuels de first flush sur 3 exutoires de Metro Vancouver
(Still Creek, Byrne Creek, Musqueam Creek) pendant deux événements pluvieux d'automne, envoyés à un
labo (ALS/SGS Burnaby ou UBC) ; confronter aux prédictions du modèle. **4-8 k$** — et c'est le test
qui décide de tout : si le classement des bassins par le modèle ne correspond pas aux mesures,
l'idée n'a pas de produit.

### 9. CoastalTrace — score 20 · **la meilleure défendabilité par la donnée de tout le mandat**
**Architecture MVP (4 briques).** (a) *Protocole de chaîne de conservation* — **c'est le produit**, et
c'est du droit plus que du code : photo horodatée/géolocalisée, double vérification humaine, journal
inaltérable. (b) *App terrain avec CV* — **à construire** : TACO (~1 500 images) contient des classes
d'objets mais **aucune étiquette de marque** ; la voie réaliste est OCR + appariement de logo sur une
liste fermée de 150-250 marques, pas une classification de marque de bout en bout. (c) *Base
longitudinale par juridiction* — PostGIS, l'actif. (d) *Rapport statistique prêt pour témoin expert*.
**Matériel.** Aucun : téléphones, balance, sacs, gants. **< 1 k$ CAD.**
**Solo.** 3 mois : app + protocole + première campagne à Vancouver. 6 mois : base + rapport
statistique. 12 mois : un client contentieux **ou** 3 éco-organismes (Recycle BC est le premier
client réaliste et il est à 30 minutes).
**Risque n°1 : l'admissibilité.** Une preuve produite par un modèle de vision est attaquable
(Daubert/Frye) : il faut un **taux d'erreur connu et publié** et une méthode reproductible. Le rejet
de *Baltimore v. PepsiCo* en 07/2026 durcit encore l'exigence. Architecture imposée par ce risque :
**l'IA ne classe pas, elle pré-trie ; un humain confirme chaque item**, et l'app enregistre la double
vérification. C'est une contrainte produit, pas un obstacle.
**Dérisquage 4 semaines.** Une campagne réelle sur 3 plages (Spanish Banks, Iona, Garry Point à
Steveston) avec les deux clubs : 1 000 objets, **double codage par deux observateurs**, calcul du
kappa inter-annotateurs. Puis une heure de relecture du protocole par une clinique juridique (UBC
Environmental Law Clinic ou Ecojustice) — gratuit, et c'est ce qui décide si le produit est vendable
à 50-150 k$ le dossier.

### 10. PolyID — score 16 · **excellent actif, mauvais matériel dans le budget**
**Architecture MVP (4 briques).** (a) *Spectromètre NIR portable* — **le point dur**. Sous 10 k$ on
ne trouve que du 900-1 700 nm (ex. Sagitto ≈ 2 750 US$) : suffisant pour séparer grossièrement
PE/PP/PET, **insuffisant** pour distinguer PA6 de PA6,6 et **inopérant sur le plastique noir** (le
noir de carbone absorbe tout). La bonne plage (jusqu'à 2 500 nm, type NeoSpectra) est nettement plus
chère ; trinamiX est sur devis avec licence annuelle. (b) *Bibliothèque spectrale « plastique marin
dégradé »* — **l'actif**, entièrement à construire, et il exige des échantillons de référence à
polymère **connu**, donc une validation FTIR chez un tiers (coût). (c) *Traçabilité par lot* — CRUD.
(d) *Indice de prix par polymère et région* — le vrai produit à terme, et il ne demande **aucun
matériel**.
**Matériel. 10-28 k$ CAD** selon l'appareil retenu — c'est la principale raison de la note 2 en budget.
**Solo.** 3 mois : registre de lots + dossier OBP/RecyClass, sans NIR, facturable 150-400 $/mois.
6 mois : 300-800 spectres et un classifieur 4-5 classes. 12 mois : indice de prix **si** 8-10 dépôts
contribuent — un effet de réseau qu'un fondateur seul met plus de 12 mois à créer.
**Risque n°1.** Le NIR abordable sépare-t-il réellement PP/PE/PA6/PET **marins et dégradés** ?
Personne ne le documente publiquement.
**Dérisquage 4 semaines — et c'est le meilleur test local du mandat.** Ocean Legacy est à Richmond, à
20 minutes. Obtenir 60-100 échantillons à polymère déclaré, **emprunter un NIR** (UBC Materials
Engineering, BCIT, ou une démo constructeur de 30 jours), acquérir 5 spectres par échantillon,
mesurer la séparabilité en validation croisée. < 3 k$ si le prêt aboutit. Résultat binaire et net.

### 11. FiberScore — score 9 · **la seule idée dont le MVP est un laboratoire**
**Architecture MVP (4 briques).** (a) *Banc de lavage ISO 4484-1* — **ce n'est pas du matériel du
commerce** : la norme suppose un appareil de lavage de laboratoire (type Gyrowash/Launder-Ometer,
15-30 k$) et une gravimétrie sub-milligramme (balance 5-15 k$). (b) *Comptage de fibres sur filtre* —
traitement d'image classique, pas un avantage IA. (c) *SaaS multi-normes + extraction LLM de PDF* —
facile, et c'est une commodité. (d) *Base de facteurs d'émission par tissu* — l'actif prétendu.
**Matériel. 30-60 k$ CAD** pour un banc crédible : **incompatible avec le bootstrap**. Le SaaS seul
coûterait 4-8 k$ — mais alors il n'y a plus de mesure, donc plus d'actif.
**Solo.** 3 mois : SaaS d'agrégation de rapports + calcul du score Ecobalyse attendu, **sans mesurer
quoi que ce soit**. 6 mois : base de facteurs compilée depuis la littérature (donc publique, donc
copiable). 12 mois : 5-10 marques — dans le meilleur des cas.
**Risque n°1 : la reproductibilité.** Si ISO 4484, TMC, Hohenstein et AATCC TM212 coexistent, c'est
précisément parce que la mesure de relargage de microfibres est mal reproductible entre laboratoires.
Un banc maison non accrédité ne produira jamais un rapport opposable à l'ADEME ou à un donneur
d'ordre. Second risque, fatal pour l'actif : **l'ADEME peut publier ses propres facteurs par tissu
dans Ecobalyse et détruire la base du jour au lendemain.**
**Dérisquage 4 semaines — un test de marché, pas de terrain.** Appeler 5 marques de Vancouver
(Arc'teryx, MEC, Lululemon, deux fabricants de combinaisons) et poser une seule question : « qui, chez
vous, est responsable du score Ecobalyse, et existe-t-il un budget 2027 ? ». Demander en parallèle un
devis par référence à Vartest ou Hohenstein. Si la réponse est « c'est notre fournisseur de tissu qui
s'en occupe », la cible est fausse et l'idée doit être réécrite ou abandonnée.

### 12. HullCycle — score 13 · **du CRUD sans risque technique, avec un risque commercial déjà réalisé**
**Architecture MVP (3 briques).** (a) *Plateforme de déclaration, d'éco-contribution et de suivi de
flux* — **du logiciel de gestion classique**, zéro IA, entièrement à construire mais sans difficulté.
(b) *Détection de coques abandonnées* par imagerie drone/satellite — mutualisable avec VesselRisk,
mais voir promesses. (c) *Tableau de bord prestataires*.
**Matériel.** Drone 1-2 k$. **4-9 k$ CAD.** C'est l'idée la plus légère en matériel avec CoastalTrace.
**Solo.** 3 mois : la plateforme déclarative complète — techniquement, c'est fait. 6 mois : un pilote
sur une collectivité. 12 mois : APER **si** un marché public est gagné, ce qui est très improbable
pour un fondateur seul, étranger au dispositif et sans références.
**Risque n°1 : le calendrier est déjà passé.** La consultation nationale pour les prestataires
2027-2029 courait du **15/06 au 21/08/2026** — elle est close. Un éco-organisme agréé achète par
marché public, avec des exigences de solidité financière et d'antériorité qu'un fondateur seul ne
remplit pas. Le risque n'est pas technique, il est structurel et il est **déjà survenu**.
**Dérisquage 4 semaines.** Vérifier auprès de l'APER si l'attribution 2027-2029 est faite et si un
lot « système d'information » subsiste. En parallèle, tester la brique de détection sur les marinas
de Vancouver et Steveston — mais en la comptabilisant comme un **module de VesselRisk**, pas comme
une société. Si l'attribution est close, il n'y a pas d'entreprise ici avant 2029.

---

## Top 3 / Bottom 3 sur l'axe technologie

### Top 3

1. **GhostSonar (23)** — La seule idée du mandat où les trois verrous habituels sont déjà levés : les
   formats sonar propriétaires sont **décodés par des bibliothèques open source** (PINGVerter/
   PINGMapper couvrent Garmin RSD, Humminbird, Lowrance), l'architecture de détection est publiée
   (GhostVision 2026), le matériel coûte 1-2 k$ et le client est à quinze minutes en bateau. Le
   dataset sonar annoté du Pacifique Nord-Ouest devient un actif que personne ne peut reconstituer
   sans refaire les sorties. C'est aussi la seule idée où **le fondateur plongeur est un avantage de
   production**, pas seulement de réseau : il vérifie ses propres étiquettes.
2. **FloatWatch (21)** — Cible visuellement la plus facile du mandat (mousse blanche granuleuse,
   3-4 classes, 500-1 500 images suffisent), matériel sous 4 k$, obligation réglementaire déjà en
   vigueur (RCW 70A.245.130, 01/01/2024) et non pas annoncée, registre longitudinal par bail
   défendable, et une correction d'architecture qui **renforce** le fondateur : l'inspection utile est
   sous-marine, donc hors de portée d'un concurrent purement logiciel. Facturable au mois 1 sans IA.
3. **CoastalTrace (20)** — Coût matériel quasi nul, et la **meilleure défendabilité par la donnée** :
   une série longitudinale par juridiction n'est pas rétro-constructible, un concurrent qui démarre en
   2028 ne peut pas fabriquer l'historique 2026-2027. L'exigence d'admissibilité juridique force une
   architecture homme-dans-la-boucle qui, loin d'être un handicap, est exactement ce qui rend le
   produit vendable à 50-150 k$ le dossier.

*Mention : GrantMRV (18) est le chemin le plus court vers un premier revenu récurrent — mais c'est un
logiciel de gestion, pas un actif technologique. À traiter comme un module de GhostSonar ou de
CoastalTrace plutôt que comme une société.*

### Bottom 3

1. **StormDebris (9)** — Le seul obstacle qui compte n'est pas résoluble par le code : voler en 24-48 h
   sur une zone sous TFR après un ouragan, depuis Vancouver, sans accréditation locale. Le transfert
   de xBD (bâtiments, satellite, 0,5 m) vers des débris marins vus du drone est proche de zéro, le
   thermique n'apporte rien sur du plastique mouillé, le matériel dépasse le budget et le modèle
   économique est un service saisonnier qui ne capitalise aucune donnée.
2. **FiberScore (9)** — La seule idée dont le MVP **est un laboratoire** : 30-60 k$ CAD de banc et de
   balance avant le premier client, pour produire une mesure dont la non-reproductibilité inter-labos
   est précisément la raison d'être des normes concurrentes. Et l'actif (la base de facteurs) peut
   être annulé par une simple publication de l'ADEME.
3. **TireWatch (12)** — Le vide technologique est réel mais il se retourne contre un fondateur seul :
   pas de capteur, pas de proxy établi (le 6PPD-q est dissous, la turbidité ne le trace pas), donc
   dépendance totale à un laboratoire LC-MS/MS à 300-800 $ l'échantillon, 15-30 k$ par point
   instrumenté, et une réglementation Ecology qui n'arrive qu'en 06/2028. Ce qui reste — un modèle de
   priorisation multicritère sur données ouvertes — se code en six semaines et ne défend rien.

*NetPen Ledger (13) et HullCycle (13) échappent au bottom 3 uniquement parce que leur risque est
commercial et non technique. Techniquement ce sont deux CRUD ; comme sociétés, elles sont plus
dangereuses que TireWatch, avec 3 clients au monde pour l'une et un appel d'offres déjà clos pour
l'autre.*

---

## Promesses techniques d'IDEAS.md que je juge fausses ou exagérées

**Fausses (à retirer du discours).**

1. **Idée 1 — « formats Garmin, Humminbird, Lowrance, Deeper ».** Le Deeper est un sondeur **vertical
   castable** : il ne produit pas d'imagerie latérale et est inutilisable pour cartographier des
   engins au fond. À retirer de la liste.
2. **Idée 1 — « prédiction de dépôt (courants Copernicus/HYCOM) ».** HYCOM est à 1/12° (~8 km) et
   Copernicus régional à 2-3 km, pour des baies de 1-3 km : physiquement inutilisable. Et un casier
   lesté ne dérive pas — il tombe. Le bon prédicteur est l'effort de pêche historique et la
   bathymétrie, pas l'hydrodynamique.
3. **Idée 4 — « inspection par drone » de la mousse.** La mousse conforme est **encapsulée** et se
   trouve **sous** le ponton. Le drone ne voit que le platelage. L'inspection réelle est à la caméra
   sur perche ou en plongée.
4. **Idée 5 — « imagerie satellite » pour détecter « gîte, ligne de flottaison ».** Deux grandeurs
   verticales, mesurées depuis la verticale, sur une cible de ~16 pixels. Impossible.
5. **Idée 6 — « fine-tuning xBD » pour les débris marins.** xBD annote des **bâtiments** sur imagerie
   **satellite** après catastrophe. Le domain gap vers des débris flottants ou immergés vus du drone
   est tel que le pré-entraînement n'apporte pratiquement rien.
6. **Idée 6 — le drone « thermique » pour les débris.** Aucun contraste d'émissivité exploitable sur
   du plastique mouillé ; le thermique sert à chercher des personnes, pas des déchets.
7. **Idée 7 — « MP-VAT (Nile red, 95,8 % de précision rapportée) ».** Chiffre de publication sorti de
   son contexte. La littérature 2025 mesure jusqu'à **421 % d'écart** de comptage entre Nile red et
   Raman selon la granulométrie, avec des faux positifs sur chitine, lignine et cuticules. Surtout :
   **Nile red n'identifie pas le polymère**, donc ne satisfait pas SB 1422 qui impose Raman ou IR.
   Le produit est un pré-criblage, jamais une méthode de conformité.
8. **Idée 12 — détecter des coques « abandonnées » par satellite.** On détecte un bateau ; « abandonné »
   est un statut **juridique et temporel**, pas une signature d'image.

**Exagérées (à recalibrer, pas à supprimer).**

9. **Idée 7 — « kit caméra microscope USB (50-200 $) ».** La fluorescence Nile red exige une excitation
   ~470 nm, un filtre d'émission et une optique correcte, plus une rampe de filtration et un espace
   anti-contamination. Ordre de grandeur réel : **6-12 k$ CAD**, sans compter le local.
10. **Idée 10 — « scanner NIR portable du commerce (3-8 k$) ».** Dans cette gamme on n'a que
    900-1 700 nm : insuffisant pour les polyamides, inopérant sur le plastique noir. La plage utile
    (jusqu'à 2 500 nm) coûte nettement plus, et trinamiX ne publie pas ses prix.
11. **Idée 11 — « banc de test normalisé ISO 4484 avec matériel du commerce ».** ISO 4484-1 suppose un
    appareil de lavage **de laboratoire** et une gravimétrie sub-milligramme : 25-50 k$ CAD, et un banc
    non accrédité ne produit pas de rapport opposable.
12. **Idée 8 — « 8-20 k$ CAD/an par point » avec capteurs et préleveur automatique.** Un préleveur
    réfrigéré seul coûte 8-15 k$ US à l'achat. Le prix annoncé ne couvre pas la première année.
13. **Idée 8 — « modèle IA de priorisation ».** 26 cours d'eau en dépassement ne fournissent pas assez
    d'étiquettes pour apprendre quoi que ce soit. C'est un **scoring multicritère**, à assumer comme
    tel : c'est honnête et ça se vend quand même.
14. **Idée 2 — « poids ou volume estimé par IA » depuis une photo.** Mal posé sans référence d'échelle
    ni densité connue (un filet enchevêtré varie d'un facteur 3), et les bailleurs exigent de toute
    façon des tickets de pesée. Remplacer par : photo + **balance à crochet à 50-300 $** + ticket de
    décharge. C'est plus simple, plus juste et plus vendable.
15. **Idée 10 — « indice de prix construit sur un panel donne-tes-données ».** Effet de réseau
    nécessitant 8-10 dépôts contributeurs. Ce n'est pas un MVP, c'est un objectif de mois 18-24.

**Transversales (elles affectent les 12 idées).**

16. **« Effort moyen, 3-9 mois-ingénieur » repris tel quel.** La grille de `tech-landscape` chiffre une
    **équipe de 2-4**. En solo il faut multiplier le calendrier par ~1,5-2 — et sur les idées 7, 8, 10
    et 11 le chemin critique n'est pas du code, donc **Claude n'accélère rien**.
17. **« Pas de matériel propre » ≠ « pas de coût matériel ».** Cinq idées sur douze (6, 7, 8, 10, 11)
    dépassent 10 k$ CAD dès qu'on compte le terrain, les analyses et les déplacements. Trois d'entre
    elles (6, 8, 11) crèvent le plafond de 25 k$ du BRIEF avant le premier client.
18. **Aucune idée ne mentionne la réglementation drone.** Transport Canada exige l'enregistrement et un
    certificat (opérations de base ou avancées) au-dessus de 250 g ; les États-Unis exigent Part 107 ;
    une assurance RC 1-5 M$ coûte 600-1 500 $/an. Cela concerne les idées 3, 4, 5, 6 et 12 : **2 à 6
    semaines de délai** et une ligne de coût récurrente, aujourd'hui absentes du document.
19. **La licence des modèles n'est jamais évoquée.** Ultralytics YOLO est en **AGPL-3.0** : tout usage
    commercial en SaaS impose soit une licence payante, soit la publication du code. Préférer RF-DETR
    (Apache-2.0) ou un détecteur sous licence permissive dès le premier jour — une erreur ici est
    coûteuse à corriger après la première vente.
20. **« Aucune concurrence » apparaît dans 9 fiches sur 12.** Techniquement c'est souvent vrai (pas de
    produit packagé), mais l'absence de concurrent sur un marché réglementé signale plus souvent une
    **absence d'acheteur solvable** qu'une fenêtre ouverte. TireWatch, HullCycle et NetPen Ledger sont
    les trois cas où je lis « pas de concurrent » comme un signal négatif.

---

*Estimations produites le 06/09/2026 par critic-tech-2. Toutes les valeurs d'effort, de coût et de
note sont des jugements d'ingénieur, non sourcés, à contester par les chiffres si l'orchestrateur en
obtient de meilleurs.*
